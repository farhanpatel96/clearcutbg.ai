# ClearCut AI — Frontend Application

Modern, high-performance web interface for **ClearCut AI**, built with React 19, TypeScript, Tailwind CSS v4, and Vite.

## 🚀 Technologies

- **Framework**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite 8
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library + jsdom
- **Linter**: Oxlint

## 📋 Features

- **Drag & Drop & Clipboard Paste**: Easy image uploads with visual feedback.
- **Sample Presets**: Quick one-click testing with preloaded sample images.
- **Interactive Before / After Slider**: Draggable comparison viewer with full touch and keyboard accessibility.
- **View Mode Switcher**: Side-by-side, comparison slider, or transparent cutout only.
- **Custom Background Color Swatches**: Preview transparent cutouts on solid colors (White, Black, Gray, Indigo, Emerald, Amber, Rose) or standard alpha checkerboard.
- **Alpha Matting & Subject Filters**: Toggle edge refinement and subject isolation.
- **Real-Time Progress & Cancellation**: Live upload progress tracking and request abort support.
- **High-Resolution PNG Download**: One-click download of the 32-bit RGBA cutout.
- **Zero Data Retention Modal**: Educational privacy commitment dialog explaining memory-only processing.

## 🛠️ Local Development Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` (optional; Vite proxy handles local development automatically):

```bash
# Windows
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `""` (empty) | Base URL for API calls. Leave empty locally to use Vite proxy (`/api` -> `http://127.0.0.1:8001`). Set to your domain for remote backends. |

### 3. Start Development Server

```bash
npm run dev
```

Open `http://localhost:5174/` in your browser.

---

## 🧪 Automated Testing

Run the automated Vitest test suite:

```bash
npm test
```

Run test suite in watch mode:

```bash
npx vitest
```

Run linter:

```bash
npm run lint
```

---

## 📦 Production Build

Compile and bundle the frontend for production:

```bash
npm run build
```

The optimized static assets will be output to the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```
