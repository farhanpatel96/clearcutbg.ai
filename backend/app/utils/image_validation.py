import io
from typing import Tuple
from PIL import Image, ImageOps, UnidentifiedImageError
from fastapi import HTTPException, status

from app.config import settings

# Supported magic byte signatures
MAGIC_SIGNATURES = {
    b"\xff\xd8\xff": "JPEG",
    b"\x89PNG\r\n\x1a\n": "PNG",
    b"RIFF": "WEBP",  # WEBP has RIFF at 0..4 and WEBP at 8..12
}


def verify_magic_bytes(data: bytes) -> bool:
    """Check if header matches JPEG, PNG, or WEBP."""
    if len(data) < 12:
        return False
    if data.startswith(b"\xff\xd8\xff"):
        return True
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return True
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return True
    return False


def validate_and_load_image(raw_bytes: bytes) -> Tuple[Image.Image, str]:
    """
    Validate raw uploaded bytes, inspect content, enforce limits,
    handle EXIF orientation, and return normalized PIL Image.
    
    Returns:
        (PIL.Image, detected_format_name)
    
    Raises:
        HTTPException with appropriate 400 status and friendly message.
    """
    # 1. Check empty upload
    if not raw_bytes or len(raw_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty. Please select a valid image.",
        )

    # 2. Check maximum byte size
    if len(raw_bytes) > settings.MAX_FILE_SIZE_BYTES:
        max_mb = settings.MAX_FILE_SIZE_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE if hasattr(status, "HTTP_413_CONTENT_TOO_LARGE") else 413,
            detail=f"File exceeds maximum allowed size of {max_mb:.0f}MB.",
        )

    # 3. Check magic bytes
    if not verify_magic_bytes(raw_bytes):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Supported formats are JPG, JPEG, PNG, and WEBP.",
        )

    # 4. Open image safely with Pillow
    try:
        buffer = io.BytesIO(raw_bytes)
        img = Image.open(buffer)
        img_format = img.format or "UNKNOWN"
        
        # Verify decoding integrity
        img.verify()
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file appears to be corrupted or is not a valid image.",
        )

    # Re-open image since verify() requires reopening for actual operations
    buffer.seek(0)
    img = Image.open(buffer)

    # 5. Check dimensions and total pixel count
    width, height = img.size
    total_pixels = width * height

    if total_pixels > settings.MAX_IMAGE_PIXELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image resolution ({width}x{height} = {total_pixels:,} pixels) exceeds maximum limit of {settings.MAX_IMAGE_PIXELS:,} pixels.",
        )

    if width > settings.MAX_IMAGE_DIMENSION or height > settings.MAX_IMAGE_DIMENSION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image dimensions ({width}x{height}) exceed maximum allowed dimension of {settings.MAX_IMAGE_DIMENSION}px.",
        )

    # 6. Correct EXIF orientation if present
    try:
        img = ImageOps.exif_transpose(img)
    except Exception:
        # Fallback if EXIF orientation metadata is malformed
        pass

    # 7. Normalize color modes
    # Convert CMYK, Palette, Grayscale to RGB or RGBA so segmentation model gets standard color channels
    if img.mode not in ("RGB", "RGBA"):
        if "A" in img.mode:
            img = img.convert("RGBA")
        else:
            img = img.convert("RGB")

    return img, img_format
