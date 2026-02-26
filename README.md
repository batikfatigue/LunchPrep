<div align="center">

# LunchPrep

Convert Singapore bank statement CSVs into clean, import-ready files for **Lunch Money** — with intelligent, batch transaction categorisation powered by **Google Gemini**.

<br/>

<img alt="license: MIT" src="https://img.shields.io/badge/license-MIT-green" />
<img alt="for: Lunch Money" src="https://img.shields.io/badge/for-Lunch%20Money-00A86B" />
<img alt="AI: Google Gemini" src="https://img.shields.io/badge/AI-Google%20Gemini-4285F4" />
<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6" />

</div>

---

## Overview

LunchPrep helps you transform raw DBS bank CSV exports into a format ready for seamless import into [Lunch Money](https://lunchmoney.app). It uses **Google Gemini** to intelligently suggest categories for every transaction.

### Privacy First

All CSV parsing and financial data processing happens **entirely in your browser** — no bank data is ever sent to or stored on the server. Before any AI categorisation call, real names and account numbers are replaced with realistic placeholders. Your original data is restored locally before export.

You can also use **Bring Your Own Key (BYOK)** mode: enter your personal Gemini API key in the app settings to route AI calls directly from your browser to Google, bypassing the shared server proxy entirely.

### How it works

1. **Upload** — Export your DBS statement CSV from internet banking and drop it in.
2. **Review** — Gemini AI categorises every transaction. Edit payees, notes, or categories inline.
3. **Export** — Download a Lunch Money-compatible CSV and import it in one click.

---

## Environment Variables

All variables are passed at **runtime** (never at build time).

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes *(hosted mode)* | — | Server-side Gemini API key for the `/api/categorise` proxy |
| `GEMINI_MODEL` | No | `gemini-2.5-flash-lite` | Gemini model name to use |
| `RATE_LIMIT_RPM` | No | `10` | Max requests per minute per IP on the server proxy |

> **BYOK mode:** If users provide their own Gemini API key in the app, `GEMINI_API_KEY` is not required on the server.

---

## Local Development

### Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- A **Gemini API key** — [aistudio.google.com](https://aistudio.google.com/)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/batikfatigue/lunchprep.git
cd lunchprep

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# 4. Start the development server
npm run dev
# → http://localhost:3000
```

### Available scripts

```bash
npm run dev      # Development server with hot reload
npm run build    # Production build
npm run start    # Start production server (after build)
npm run lint     # Run ESLint
npm test         # Run Vitest unit tests (watch mode)
npm test -- --run  # Run tests once (CI mode)
```

---

## Docker (Self-Hosting)

The Docker image uses a 3-stage multi-stage build for a minimal production image (~150 MB).

### Build

```bash
docker build -t lunchprep .
```

### Run

```bash
docker run \
  -p 3000:3000 \
  -e GEMINI_API_KEY=your-api-key-here \
  -e RATE_LIMIT_RPM=20 \
  lunchprep
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Optional variables:** `GEMINI_MODEL` and `RATE_LIMIT_RPM` can be omitted to use defaults.

### Docker Compose (optional)

```yaml
# docker-compose.yml
services:
  lunchprep:
    image: lunchprep
    build: .
    ports:
      - "3000:3000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - RATE_LIMIT_RPM=20
    restart: unless-stopped
```

```bash
GEMINI_API_KEY=your-key docker compose up
```

---

## Google Cloud Run Deployment

> **Free tier:** Use `us-central1` to stay within Cloud Run's always-free quota — 2 million requests, 360,000 GB-seconds of memory, and 180,000 vCPU-seconds per month. With `--min-instances=0` the service scales to zero when idle, so you pay nothing during quiet periods.

> **Note:** `gcr.io` (Google Container Registry) is deprecated. Use **Artifact Registry** (`REGION-docker.pkg.dev`) instead.

### Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`) installed and authenticated
- A GCP project with **Cloud Run** and **Artifact Registry** APIs enabled:
  ```bash
  gcloud services enable run.googleapis.com artifactregistry.googleapis.com
  ```

### Steps

```bash
# 1. Set your project — use us-central1 for the free tier
export PROJECT_ID=your-gcp-project-id
export REGION=us-central1
export REPO=lunchprep
export IMAGE=$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/lunchprep

# 2. Create the Artifact Registry repository (one-time setup)
gcloud artifacts repositories create $REPO \
  --repository-format=docker \
  --location=$REGION

# 3. Authenticate Docker with Artifact Registry
gcloud auth configure-docker $REGION-docker.pkg.dev

# 4. Build and push the image
docker build -t $IMAGE .
docker push $IMAGE

# 5. Deploy to Cloud Run (scales to zero, 512 MB is plenty for this app)
gcloud run deploy lunchprep \
  --image $IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2 \
  --set-env-vars "GEMINI_API_KEY=your-api-key-here,RATE_LIMIT_RPM=20"
```

Cloud Run automatically handles:
- HTTPS termination
- Scaling to zero when idle (`--min-instances=0`) — no charges between visits
- Health checks on `HOSTNAME=0.0.0.0:3000` (configured in the Dockerfile)

---

## Vercel Deployment

1. **Fork** this repository to your GitHub account.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your fork.
3. In the **Environment Variables** section, add:
   - `GEMINI_API_KEY` = your Gemini API key
   - *(optional)* `GEMINI_MODEL`, `RATE_LIMIT_RPM`
4. Click **Deploy**.

Vercel automatically detects Next.js and applies optimal build settings.

---

## Adding More Banks

LunchPrep is built to be extensible. Adding support for OCBC, UOB, or other Singapore banks requires implementing the `BankParser` interface and registering it in `src/lib/parsers/registry.ts`.

See [CONTRIBUTING.md](./CONTRIBUTING.md#adding-a-new-bank-parser) for a step-by-step guide.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 + TypeScript (strict) |
| UI | shadcn/ui + Tailwind CSS 4 |
| CSV parsing | PapaParse (client-side) |
| AI | Gemini 2.5 Flash-Lite via `@google/generative-ai` |
| Testing | Vitest |
| Deploy | Vercel (primary), Docker / Google Cloud Run (self-hosted) |

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on local setup, code style, adding bank parsers, and the pull request process.

---

## License

MIT — see [LICENSE](./LICENSE) for details.
