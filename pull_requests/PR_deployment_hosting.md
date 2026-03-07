# PR Description: Phase 4: Deployment & Open Source

## Description
This PR marks the completion of Phase 4 (Deployment & Hosting). It focuses on making LunchPrep production-ready through Dockerization, comprehensive documentation for self-hosting, and enhancing the initial user experience with a "Privacy First" landing hero.

The application is now prepared for deployment to Google Cloud Run (utilizing GCP credits) or Vercel, and is ready for open-source release with proper licensing and contribution guidelines.

## Changes
- **Dockerization for Hosting**:
  - Implemented a optimized multi-stage `Dockerfile` (node:20-alpine) for minimal image footprint.
  - Configured Next.js `standalone` output mode in `next.config.ts`.
  - Added `.dockerignore` to exclude development artifacts.
- **Landing Experience**:
  - Added `LandingHero` component (`src/components/landing-hero.tsx`) to explain the app's value, privacy model, and usage flow.
  - Integrated `LandingHero` into the main application shell.
- **Project Documentation**:
  - Revamped `README.md` with detailed local development, Docker, GCP Cloud Run, and Vercel hosting guides.
  - Added MIT `LICENSE` and `CONTRIBUTING.md`.
  - Created Phase 4 design specification (`PRPs/phase4-deployment-open-source.md`).
- **Roadmap & Planning**:
  - Updated `docs/todo.md` and `INITIAL.md` to reflect the final deployment strategy.

## Type of Change
- [x] New feature (Landing Hero, Dockerization)
- [ ] Bug fix
- [x] Refactor (Standalone build config)
- [x] Documentation (README, LICENSE, CONTRIBUTING, Design Docs)

## Testing
- Verified local production build via `npm run build`.
- Verified Docker build and local container execution.
- Added and ran tests for the new landing components (logic and rendering).
