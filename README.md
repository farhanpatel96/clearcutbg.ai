# ClearCut AI — AI Image Background Remover

> A production-ready, privacy-first web application that removes backgrounds from images with pixel-level precision using deep learning segmentation models (`u2net` / `u2netp` / `isnet-general-use`) via ONNX Runtime.

![ClearCut AI Banner](https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80)

---

## 🌟 Key Features

- **Genuine AI Segmentation**: Powered by deep learning U²-Net models via ONNX Runtime (not a canvas color-keying or heuristic trick).
- **Pixel-Level Precision**: Cleanly isolates complex edges, hair, fur, transparent accessories, and products.
- **100% Privacy & Zero Permanent Storage**: Images are processed strictly in volatile RAM (`io.BytesIO`) and immediately discarded. No databases, accounts, logins, or telemetry uploads.
- **Interactive Before / After Comparison**: Draggable comparison slider, side-by-side mode, and isolated cutout view.
- **Live Background Color Swatches**: Preview the transparent cutout on custom solid colors (White, Black, Gray, Indigo, Emerald, Amber, Rose) or standard alpha checkerboard.
- **Edge Refinement (Alpha Matting)**: Optional fine matting for intricate hair, fibers, and animal fur.
- **Main Subject Isolation**: Optional flag to isolate primary subjects and eliminate background people or clutter.
- **Full Quality Transparent PNG Download**: Preserves original image dimensions, colors, and 32-bit RGBA transparency.
- **Responsive Across All Devices**: Mobile-first layout with smooth controls tested on 320px–1440px viewports.
- **Controlled Concurrency & Rate Limiting**: Built-in semaphore worker pool and IP rate limiter to protect server resources.

---

## 🏗️ Project Architecture & Structure

```text
clearcut-ai/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx              # Brand logo, model readiness badge, privacy trigger
│   │   │   ├── UploadArea.tsx          # Drag & drop, validation, paste, sample presets
│   │   │   ├── BeforeAfterSlider.tsx   # Interactive draggable comparison slider
│   │   │   ├── ImagePreview.tsx        # View mode switcher & color swatches
│   │   │   ├── ProcessingIndicator.tsx # Upload & AI inference progress
│   │   │   ├── DownloadButton.tsx      # Transparent PNG download & reset flow
│   │   │   ├── ErrorMessage.tsx        # Friendly error handling & retry actions
│   │   │   └── PrivacyModal.tsx        # Memory-only privacy commitment modal
│   │   ├── services/
│   │   │   └── api.ts                  # XMLHttpRequest API client with upload progress
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript type definitions
│   │   ├── test/
│   │   │   ├── components.test.tsx     # Vitest + React Testing Library tests (6 tests)
│   │   │   └── setup.ts                # Test environment setup
│   │   ├── App.tsx                     # Core application orchestrator
│   │   ├── main.tsx                    # React entry point
│   │   └── index.css                   # Tailwind CSS v4 & custom checkerboard utilities
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── vite.config.ts                  # Vite + proxy + Vitest configuration
│   ├── tsconfig.json
│   ├── .env.example                    # Safe frontend environment variables template
│   └── README.md                       # Frontend-specific documentation
│
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI routes, CORS, rate limiting, error handlers
│   │   ├── config.py                   # Pydantic Settings & environment limits
│   │   ├── schemas.py                  # Pydantic API response models
│   │   ├── services/
│   │   │   └── background_remover.py   # AI session lifecycle, ONNX inference, concurrency pool
│   │   └── utils/
│   │       └── image_validation.py     # Magic bytes inspection, EXIF rotation, pixel limits
│   ├── tests/
│   │   └── test_api.py                 # Pytest automated test suite (9 tests)
│   ├── requirements.txt                # Python backend dependencies
│   ├── pytest.ini                      # Pytest test discovery configuration
│   ├── .env.example                    # Safe backend environment variables template
│   └── README.md                       # Backend-specific documentation
│
├── .gitignore                          # Comprehensive Git ignore rules (secrets, venv, caches)
├── README.md                           # Master project documentation
└── LICENSE                             # MIT Open Source License
```

### Technology Breakdown

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React icons, Vitest, React Testing Library.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, Pillow (PIL), `rembg` (U²-Net ONNX model), `onnxruntime`, `slowapi` (rate limiting), Pydantic v2, Pytest.

---

## 📋 Prerequisites

Before setting up the project, make sure you have the following installed on your system:

1. **Python 3.10 or higher** (Python 3.11, 3.12, 3.13, or 3.14)
   - Verify: `python --version`
2. **Node.js 18 or higher** (Node.js 20+ LTS recommended) and **npm**
   - Verify: `node --version` and `npm --version`
3. **Git**
   - Verify: `git --version`

---

## 🚀 Step-by-Step Installation & Setup

### 1. Backend Setup & Run

Open a terminal (PowerShell on Windows, or bash/zsh on macOS/Linux) in the project root directory:

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create Python virtual environment
python -m venv venv

# 3. Activate the virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.\venv\Scripts\activate.bat
# macOS / Linux:
source venv/bin/activate

# 4. Install backend dependencies
pip install -r requirements.txt

# 5. (Optional) Configure environment variables
# Defaults work out of the box. To customize:
# Windows:
Copy-Item .env.example .env
# macOS/Linux:
cp .env.example .env

# 6. Start the FastAPI backend server
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

> **Note on First Startup**: When the model initializes for the first time, `rembg` automatically downloads the model weights (`u2net.onnx` ~176 MB or `u2netp.onnx` ~4.5 MB) to `~/.rembg/models/` and caches them locally. Subsequent startups load from disk cache instantly.

Verify the backend is running:
- Open your browser or run:
  ```bash
  curl http://127.0.0.1:8001/api/health
  ```
  Expected output:
  ```json
  {"status":"ok","model_ready":true,"model_name":"u2net","version":"1.0.0"}
  ```
- Interactive Swagger API Docs: `http://127.0.0.1:8001/docs`

---

### 2. Frontend Setup & Run

Open a **new, separate terminal** in the project root directory:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install npm dependencies
npm install

# 3. (Optional) Configure environment variables
# In local development, leave VITE_API_BASE_URL empty to use Vite's built-in proxy.
# Windows:
Copy-Item .env.example .env
# macOS/Linux:
cp .env.example .env

# 4. Start the Vite development server
npm run dev
```

The frontend will start at **`http://localhost:5174/`** (or `5173`) and automatically proxy `/api` requests to `http://127.0.0.1:8001`.

Open **`http://localhost:5174/`** in your browser to start using ClearCut AI!

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `ClearCut AI - Background Remover API` | Title of the API |
| `APP_ENV` | `development` | Environment mode (`development` or `production`) |
| `HOST` | `127.0.0.1` | Server bind address |
| `PORT` | `8001` | Server listening port |
| `CORS_ORIGINS` | `["http://localhost:5174", ...]` | Allowed frontend CORS origins (JSON array) |
| `MAX_FILE_SIZE_BYTES` | `15728640` (15 MB) | Maximum upload file size in bytes |
| `MAX_IMAGE_PIXELS` | `25000000` (25 MP) | Maximum allowed pixel count |
| `MAX_IMAGE_DIMENSION` | `6000` | Maximum width or height in pixels |
| `MAX_CONCURRENT_INFERENCES` | `2` | Max simultaneous AI model inferences |
| `MODEL_NAME` | `u2net` | AI model: `u2net` (default), `u2netp` (fast/lightweight), or `isnet-general-use` |
| `RATE_LIMIT_PER_MINUTE` | `30/minute` | Rate limit per client IP address |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `""` (empty) | Remote API URL. Leave empty in local dev to route through Vite proxy. |

---

## 🧪 Running Automated Tests

### Backend Tests (Pytest)

From the `backend/` directory with the virtual environment activated:

```bash
# Windows
.\venv\Scripts\pytest -v

# macOS / Linux
pytest -v
```

**Test Suite Coverage (9 automated tests):**
- `test_health_endpoint`: Verifies `/api/health` status and model readiness.
- `test_remove_background_empty_file`: Tests rejection of 0-byte uploads (HTTP 400).
- `test_remove_background_corrupted_file`: Tests rejection of non-image payload (HTTP 400).
- `test_remove_background_valid_jpeg`: Verifies transparent RGBA PNG generation from JPEG.
- `test_remove_background_valid_png`: Verifies transparent RGBA PNG generation from PNG.
- `test_remove_background_valid_webp`: Verifies transparent RGBA PNG generation from WebP.
- `test_remove_background_with_refine_edges`: Tests alpha matting edge refinement pipeline.
- `test_remove_background_with_main_subject_only`: Tests foreground subject isolation pipeline.
- `test_remove_background_oversized_file`: Enforces HTTP 413 file size limit protection.

### Frontend Tests (Vitest + React Testing Library)

From the `frontend/` directory:

```bash
cd frontend
npm test
```

**Test Suite Coverage (6 automated tests):**
- Header brand, free tool badge, and model ready indicator.
- UploadArea dropzone, input trigger, and sample presets.
- ErrorMessage render, retry, and dismiss callbacks.
- ProcessingIndicator honest progress display and user cancellation.
- DownloadButton PNG download and reset flow.
- BeforeAfterSlider accessibility and slider value attributes.

---

## 📦 Production Frontend Build

To compile the optimized, production-ready static assets:

```bash
cd frontend
npm run build
```

The compiled bundle is output to `frontend/dist/`. You can preview it locally using:

```bash
npm run preview
```

---

## 🔧 Common Troubleshooting

### 1. PowerShell Script Execution Policy Error (Windows)
**Error:** `.\venv\Scripts\Activate.ps1 cannot be loaded because running scripts is disabled on this system.`
**Solution:** Run this command once in PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then run `.\venv\Scripts\Activate.ps1` again. Alternatively, use the Command Prompt activate script: `.\venv\Scripts\activate.bat`.

### 2. First Run Model Download Takes Time
**Behavior:** On the very first image processing request, the server might take 15–30 seconds.
**Cause:** The deep learning model (`u2net.onnx` ~176 MB) is downloading automatically into `~/.rembg/models/`.
**Solution:** Wait for the initial download to complete. Once downloaded, all subsequent inferences process in under 1 second. For low-RAM environments, set `MODEL_NAME=u2netp` in `backend/.env` for a lightweight ~4.5 MB model.

### 3. Port Already in Use (Port 8001 or 5174)
**Error:** `[Errno 10048] error while attempting to bind on address ('127.0.0.1', 8001)`
**Solution:** Either kill the existing process or change the port in `backend/app/config.py` (or `backend/.env`) and update the proxy in `frontend/vite.config.ts`.
To find and kill the process holding port 8001 on Windows:
```powershell
Get-NetTCPConnection -LocalPort 8001 | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

### 4. CORS Error in Browser Console
**Error:** `Access to fetch at ... has been blocked by CORS policy`
**Solution:** Ensure the port where your frontend is running (e.g., `http://localhost:5174`) is included in `CORS_ORIGINS` in `backend/app/config.py` or `backend/.env`.

---

## 🛡️ Security & Privacy Architecture

1. **Volatile Memory Processing**:
   - Files are decoded into Pillow images directly in memory (`io.BytesIO`).
   - Images are **never** written to disk, database, or cloud storage.
2. **Immediate Eviction**:
   - Once the response stream ends, image byte arrays are garbage collected.
3. **Zero User Tracking**:
   - No login, signup, authentication tokens, cookies, or third-party telemetry scripts.
4. **Input Sanitization & Resource Protections**:
   - Magic bytes inspection (`\xff\xd8\xff` for JPEG, `\x89PNG` for PNG, `RIFF...WEBP` for WebP).
   - Maximum upload size: **15 MB** (`MAX_FILE_SIZE_BYTES`).
   - Maximum pixel resolution: **25 Megapixels** (`MAX_IMAGE_PIXELS`).
   - Maximum dimension: **6,000 px** (`MAX_IMAGE_DIMENSION`).
   - Semaphore concurrency limit: **2 concurrent AI inferences** to prevent CPU/RAM exhaustion.
   - Rate limiting: **30 requests/minute per client IP** (`slowapi`).
5. **No Secret Leaks**:
   - Secrets and environment-specific configs are kept in local `.env` files and strictly excluded from Git via `.gitignore`.
   - Safe `.env.example` templates are provided with placeholder values.

---

## 🚢 Deployment Notes

### Model Weight Pre-download (for Docker or CI/CD)
To pre-download the model weights during Docker image building:
```bash
python -c "from rembg import new_session; new_session('u2net')"
```

### Dockerfile Example (Backend)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the AI model to avoid latency on cold start
RUN python -c "from rembg import new_session; new_session('u2net')"

COPY backend/app ./app

EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Production Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve static frontend production build
    location / {
        root /var/www/clearcut/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to FastAPI
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 16M;
    }
}
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

Model weights and `rembg` are distributed under their respective open-source licenses (Apache 2.0 / MIT).
