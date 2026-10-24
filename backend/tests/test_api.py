import io
from PIL import Image
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings


@pytest.fixture(scope="session")
def client():
    """Test client fixture that triggers FastAPI lifespan (model loading)."""
    with TestClient(app) as test_client:
        yield test_client


def create_test_image(format="JPEG", size=(120, 120), color=(255, 0, 0)) -> bytes:
    """Helper to generate in-memory test images."""
    img = Image.new("RGB", size, color=color)
    buffer = io.BytesIO()
    img.save(buffer, format=format)
    return buffer.getvalue()


def test_health_endpoint(client):
    """Test /api/health returns 200 with model readiness information."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model_ready" in data
    assert data["model_ready"] is True
    assert "model_name" in data


def test_remove_background_empty_file(client):
    """Test uploading an empty file returns 400."""
    files = {"file": ("empty.jpg", b"", "image/jpeg")}
    response = client.post("/api/remove-background", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_remove_background_corrupted_file(client):
    """Test uploading random non-image bytes returns 400."""
    files = {"file": ("corrupt.jpg", b"NOT_AN_IMAGE_DATA_1234567890", "image/jpeg")}
    response = client.post("/api/remove-background", files=files)
    assert response.status_code == 400
    assert "invalid" in response.json()["detail"].lower() or "format" in response.json()["detail"].lower()


def test_remove_background_valid_jpeg(client):
    """Test uploading a valid JPEG image and receiving transparent PNG output."""
    jpeg_bytes = create_test_image(format="JPEG", size=(100, 100), color=(100, 150, 200))
    files = {"file": ("test.jpg", jpeg_bytes, "image/jpeg")}
    response = client.post("/api/remove-background", files=files)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert "image-background-removed.png" in response.headers.get("content-disposition", "")
    assert "x-processing-time-ms" in response.headers

    # Verify returned image is valid PNG with Alpha channel
    out_img = Image.open(io.BytesIO(response.content))
    assert out_img.format == "PNG"
    assert out_img.mode == "RGBA"
    assert out_img.size == (100, 100)


def test_remove_background_valid_png(client):
    """Test uploading a valid PNG image."""
    png_bytes = create_test_image(format="PNG", size=(80, 80), color=(50, 100, 150))
    files = {"file": ("test.png", png_bytes, "image/png")}
    response = client.post("/api/remove-background", files=files)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"

    out_img = Image.open(io.BytesIO(response.content))
    assert out_img.format == "PNG"
    assert out_img.mode == "RGBA"
    assert out_img.size == (80, 80)


def test_remove_background_valid_webp(client):
    """Test uploading a valid WEBP image."""
    webp_bytes = create_test_image(format="WEBP", size=(90, 90), color=(80, 180, 80))
    files = {"file": ("test.webp", webp_bytes, "image/webp")}
    response = client.post("/api/remove-background", files=files)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    out_img = Image.open(io.BytesIO(response.content))
    assert out_img.format == "PNG"
    assert out_img.mode == "RGBA"
    assert out_img.size == (90, 90)


def test_remove_background_with_refine_edges(client):
    """Test uploading with refine_edges flag."""
    png_bytes = create_test_image(format="PNG", size=(64, 64), color=(200, 50, 50))
    files = {"file": ("test.png", png_bytes, "image/png")}
    data = {"refine_edges": "true"}
    response = client.post("/api/remove-background", files=files, data=data)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    out_img = Image.open(io.BytesIO(response.content))
    assert out_img.mode == "RGBA"
    assert out_img.size == (64, 64)


def test_remove_background_with_main_subject_only(client):
    """Test uploading with main_subject_only flag."""
    png_bytes = create_test_image(format="PNG", size=(64, 64), color=(100, 200, 100))
    files = {"file": ("test.png", png_bytes, "image/png")}
    data = {"main_subject_only": "true"}
    response = client.post("/api/remove-background", files=files, data=data)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    out_img = Image.open(io.BytesIO(response.content))
    assert out_img.mode == "RGBA"
    assert out_img.size == (64, 64)


def test_remove_background_oversized_file(client, monkeypatch):
    """Test uploading a file that exceeds MAX_FILE_SIZE_BYTES returns 413."""
    # Temporarily set MAX_FILE_SIZE_BYTES to 500 bytes for test
    monkeypatch.setattr(settings, "MAX_FILE_SIZE_BYTES", 500)
    jpeg_bytes = create_test_image(format="JPEG", size=(100, 100))
    assert len(jpeg_bytes) > 500
    
    files = {"file": ("oversized.jpg", jpeg_bytes, "image/jpeg")}
    response = client.post("/api/remove-background", files=files)
    assert response.status_code == 413
    assert "exceeds" in response.json()["detail"].lower()
