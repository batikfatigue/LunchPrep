/**
 * Empty stub module used as a Turbopack resolveAlias target.
 *
 * When dev-tools are excluded from the deployment (via .vercelignore),
 * Turbopack cannot resolve `@/dev-tools/*` imports even though they are
 * guarded by a build-time ternary. This stub satisfies the resolver so
 * the build succeeds; the ternary ensures it is never actually rendered.
 */
export default function EmptyStub() {
  return null;
}
