# Verification evidence and practical limits

The focused regression command is `node --experimental-strip-types --test tests/boundaries.test.mjs`, also exposed as `npm test`. It runs production request parsing, provider-response parsing, generation orchestration and browser-storage functions through Node's built-in test runner. The recorded run for this delivery uses Node 22.16.0. The command does not contact Anthropic, send notifications, access a database or require an installed browser. Read [the regression source](../tests/boundaries.test.mjs) rather than relying on a passing count alone.

The accepted result and captured output are linked in the final evidence section below. The suite contains forty-six cases covering invalid input, zero provider calls for rejected requests, normalization, malformed nested recipes, repeated IDs, requested time and servings, bounded retry, generic failures, corrupt storage, partial collection recovery, capped history and favorite toggling. These are runtime assertions against the modules used by the application, not searches for strings in the implementation.

A separate TypeScript check examines the project integration when its dependencies are installed. The explicit `.ts` imports used by the dependency-free tests are enabled by `allowImportingTsExtensions` with the existing no-emit configuration. TypeScript stripping alone does not perform that check. Installation and type-check records must be reported separately from test counts; installing packages is not a passing application test.

Several important limits remain. The focused tests do not execute the Next HTTP adapter, verify deployed proxy headers, certify the process-local rate limiter, render browser components, or validate a real provider response. They do not prove recipe quality or dietary suitability. Session-storage write failure in the existing submit flow and UI notification for local-storage failures are not redesigned in this bounded change. The provider SDK may also have its own retry policy independent of the application's two attempts.

Exact originals of the four changed baseline files are retained under [snapshots](snapshots). New production modules and tests are listed in the delivery manifest. Future maintainers should rerun the focused suite after changing validation bounds, public storage behavior or retry semantics, then add an integration check appropriate to any newly changed boundary. Do not silently upgrade the meaning of this evidence into a whole-application readiness claim.

## Accepted evidence

- [Result records](evidence/results.json): 46 passed, zero failed.
- [Boundary test output](evidence/crud-b01-boundaries.log).
- [TypeScript check output](evidence/crud-b01-typecheck-installed.log): exit 0, incremental disabled.
- Changed-file ESLint produced no diagnostics after more than ten minutes and was stopped; its unsuccessful command record is retained in results.json. No lint pass is claimed.
