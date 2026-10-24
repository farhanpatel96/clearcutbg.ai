# ClearCut AI — Backend API

FastAPI service powering **ClearCut AI**, an AI-driven image background remover with zero permanent storage, volatile memory processing, and ONNX Runtime inference.

## 🚀 Technologies

- **Framework**: FastAPI 0.115+
- **ASGI Server**: Uvicorn
- **AI Engine**: `rembg` with U²-Net (`u2net` / `u2netp` / `isnet-general-use`) via ONNX Runtime
- **Image Processing**: Pillow (PIL)
- **Configuration & Validation**: Pydantic Settings v2
- **Concurrency & Rate Limiting**: Async Semaphore pool & `slowapi`
- **Testing**: Pytest & HTTPX (`TestClient`)

## 📋 Prerequisites

- **Python 3.10+** (Python 3.11, 3.12, 3.13, or 3.14 recommended)
- `pip` package manager

## 🛠️ Local Development Setup

### 1. Create and Activate Virtual Environment

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env` (optional; defaults work out-of-the-box for local development):
```powershell
# Windows
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

### 4. Start Backend Server

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

The API will be available at:
- **Base URL**: `http://127.0.0.1:8001`
- **Interactive Swagger Docs**: `http://127.0.0.1:8001/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8001/redoc`

> **Note on First Startup**: When the model initializes for the first time, `rembg` automatically downloads the model weights (`u2net.onnx` ~176 MB or `u2netp.onnx` ~4.5 MB) to `~/.rembg/models/` and caches them locally. Subsequent starts load from local cache instantly.

---

## 📡 API Endpoints

### 1. `GET /api/health`
Health check and AI model readiness indicator.

**Response (200 OK):**
```json
{
  "status": "ok",
  "model_ready": true,
  "model_name": "u2net",
  "version": "1.0.0"
}
```

### 2. `POST /api/remove-background`
Accepts an image and returns a transparent PNG stream.

- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file` (*required*, File): Image file (`.jpg`, `.jpeg`, `.png`, `.webp`) up to 15 MB.
  - `refine_edges` (*optional*, boolean): Enables alpha matting edge refinement for complex hair and fur. Default: `false`.
  - `main_subject_only` (*optional*, boolean): Isolates the primary subject and eliminates secondary objects. Default: `false`.

**Response (200 OK):**
- **Content-Type**: `image/png`
- **Headers**:
  - `Content-Disposition`: `inline; filename="image-background-removed.png"`
  - `X-Processing-Time-Ms`: Inference time in milliseconds (e.g. `245.8`)

**Error Responses:**
- `400 Bad Request`: Empty file, corrupted image, or unsupported image format.
- `413 Content Too Large`: Image file exceeds the 15 MB limit.
- `429 Too Many Requests`: Client exceeded the 30 requests/minute rate limit.
- `503 Service Unavailable`: AI model busy or initializing.

---

## 🧪 Automated Testing

Run the automated test suite with pytest:

```bash
# Windows
.\venv\Scripts\pytest -v

# macOS / Linux
pytest -v
```

The test suite validates:
- API health and model readiness
- Rejection of empty or corrupted payloads
- JPEG, PNG, and WebP background removal with 32-bit RGBA transparency output
- Alpha matting edge refinement flag
- Main subject isolation flag
- 413 maximum file size enforcement

---

## 🔒 Security & Privacy

1. **Memory-Only Processing**: Images are decoded in volatile RAM (`io.BytesIO`) and discarded immediately upon response completion. No files are written to disk.
2. **Magic Bytes Validation**: Verifies image headers to prevent malicious payloads disguised as images.
3. **Resource Safeguards**: Limits uploads to 15 MB, 25 Megapixels, and 6,000 px dimensions.
4. **Concurrency Protection**: An async Semaphore pool restricts parallel AI model inferences (default: 2) to protect CPU and RAM.
