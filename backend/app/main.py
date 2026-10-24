import time
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.schemas import HealthResponse, ErrorResponse
from app.utils.image_validation import validate_and_load_image
from app.services.background_remover import remover_service

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("clearcut.app")

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_PER_MINUTE])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize AI model session once at startup."""
    logger.info("Starting up ClearCut AI background remover backend...")
    remover_service.initialize()
    logger.info(
        f"Initialization complete. Model ready: {remover_service.is_ready} ({remover_service.model_name})"
    )
    yield
    logger.info("Shutting down ClearCut AI backend. Cleaning up resources...")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Privacy-conscious, high-performance AI background removal API.",
    lifespan=lifespan,
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/redoc" if settings.APP_ENV != "production" else None,
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Processing-Time-Ms"],
)


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """Uniform, secure HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": f"HTTP_{exc.status_code}",
        },
    )


@app.exception_handler(Exception)
async def global_unhandled_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions without leaking stack traces or sensitive paths."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred while processing your request. Please try again later.",
            "error_code": "INTERNAL_SERVER_ERROR",
        },
    )


@app.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Health and model readiness check",
)
async def health_check():
    """
    Returns API operational status and AI model readiness.
    Used by frontend and monitoring probes.
    """
    return HealthResponse(
        status="ok",
        model_ready=remover_service.is_ready,
        model_name=remover_service.model_name,
        version="1.0.0",
    )


@app.post(
    "/api/remove-background",
    responses={
        200: {
            "content": {"image/png": {}},
            "description": "Background removed transparent PNG.",
        },
        400: {"model": ErrorResponse, "description": "Invalid image or parameters."},
        413: {"model": ErrorResponse, "description": "Image exceeds size limit."},
        429: {"description": "Too many requests."},
        503: {"model": ErrorResponse, "description": "Server busy or model initializing."},
    },
    tags=["Background Removal"],
    summary="Remove background from uploaded image",
)
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def remove_background_endpoint(
    request: Request,
    file: UploadFile = File(..., description="Uploaded image file (JPG, PNG, WEBP)"),
    refine_edges: bool = Form(
        False, description="Apply edge refinement and alpha matting for complex hair/fur edges"
    ),
    main_subject_only: bool = Form(
        False, description="Isolate main foreground subject and eliminate background people/objects"
    ),
):
    """
    Accepts an uploaded image, securely validates its content and size,
    performs AI foreground segmentation, and streams back a high-resolution transparent PNG.
    """
    start_time = time.time()
    client_ip = request.client.host if request.client else "unknown"

    # Step 1: Read uploaded bytes safely with size check
    try:
        raw_bytes = await file.read(settings.MAX_FILE_SIZE_BYTES + 1024)
    except Exception as e:
        logger.warning(f"Failed to read upload from {client_ip}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read the uploaded image. Please try again.",
        )

    if len(raw_bytes) > settings.MAX_FILE_SIZE_BYTES:
        max_mb = settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413),
            detail=f"Uploaded file exceeds the maximum limit of {max_mb}MB.",
        )

    # Step 2: Validate magic bytes, integrity, and inspect image properties
    img, detected_format = validate_and_load_image(raw_bytes)
    orig_w, orig_h = img.size
    logger.info(
        f"Processing image from {client_ip}: {orig_w}x{orig_h}px, format={detected_format}, size={len(raw_bytes)} bytes, refine_edges={refine_edges}, main_subject_only={main_subject_only}"
    )

    # Step 3: Run AI background removal engine
    png_bytes = await remover_service.remove_background(
        image=img,
        alpha_matting=refine_edges,
        main_subject_only=main_subject_only,
    )

    elapsed_ms = (time.time() - start_time) * 1000
    logger.info(f"Background removed successfully in {elapsed_ms:.1f}ms. Output size: {len(png_bytes)} bytes.")

    # Return pure transparent PNG response
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={
            "Content-Disposition": 'inline; filename="image-background-removed.png"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "X-Processing-Time-Ms": f"{elapsed_ms:.1f}",
        },
    )
