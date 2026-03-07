## FEATURE:
Prepare the Next.js 16 application for deployment and open-source release (Phase 4). This involves:
1. **Dockerization for Cloud Run**: Create a multi-stage `Dockerfile` using the `node:20-alpine` base image to containerize the application. Configure Next.js for a standalone production build to keep the image small and optimized for serverless environments like Google Cloud Run.
2. **Vercel Deployment Compatibility**: Ensure the codebase and environment variables (e.g., `GEMINI_API_KEY`, `RATE_LIMIT_RPM`) are structured correctly for a seamless fallback deployment to Vercel's Hobby Tier.
3. **Documentation & Open Source Prep**:
   - Write a new landing page hero section (`src/components/landing-hero.tsx`) explaining the tool's purpose, the privacy-first model (all processing in browser), and usage instructions before the user interacts with the upload UI.
   - Update `README.md` with comprehensive setup and self-hosting instructions (including the required `docker run` commands and GCP Cloud Run steps).
   - Add standard open-source boilerplate files: `LICENSE` (MIT) and `CONTRIBUTING.md`.

## EXAMPLES:
- Reference standard Next.js Dockerfile templates from the official Next.js deployment documentation to ensure optimal image size and caching strategies (dependency layer caching).
- The `README.md` should follow standard open-source formats, clearly defining prerequisites, required/optional environment variables, local development commands, and Docker usage.

## DOCUMENTATION:
- Next.js Deployment Docs (Standalone outout): https://nextjs.org/docs/app/building-your-application/deploying
- Dockerfile reference for Next.js: https://github.com/vercel/next.js/tree/canary/examples/with-docker
- Google Cloud Run Next.js Deployment: https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service
- Open Source Guides (for CONTRIBUTING.md): https://opensource.guide/

## OTHER CONSIDERATIONS:
- **Build Optimization**: The Docker image must leverage multi-stage builds (deps, builder, runner) to keep the final production image size minimal and secure.
- **Environment Variables**: Clearly document which environment variables are required at build time vs. runtime. Ensure the app gracefully handles missing optional variables (like the server-side `GEMINI_API_KEY` if the user is expected to use the BYOK feature).
- **Security Check**: Review `.dockerignore` to ensure `.env.local` or other sensitive dev files are not accidentally baked into the image.
- **Landing Page UX**: The explanatory text should highlight "Privacy First" prominently, reassuring users that their bank data never leaves their browser unless they explicitly provide a BYOK key.