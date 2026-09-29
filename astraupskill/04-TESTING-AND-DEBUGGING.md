# Test the boundary and debug from observable effects

Run `npm test` from this project with Node 22.16 or the recorded compatible environment. The script uses Node's built-in test runner with TypeScript stripping. The [test file](../tests/boundaries.test.mjs) imports actual production modules, so changing the parser or orchestration changes the tested behavior. No browser, provider account or database is required for these focused checks. Native stripping executes syntax; it does not replace a separate TypeScript type check.

The invalid-request table tests null and array bodies, non-string and duplicate ingredients, unsupported times, fractional or out-of-range servings, invalid dietary choices and wrong boolean or skill types. Every such case asserts status 400 and a provider-call count of zero. The second assertion matters: an implementation that returns the correct error after making a paid request would still violate the intended boundary.

Provider tests use functions that return known values or throw. They check nested recipe shapes, repeated IDs, requested servings and time, missing-ingredient declarations, successful recovery on the second attempt, and a generic failure after two errors. These tests cannot prove network behavior or a real model's output quality. They establish how this application responds to provider outcomes.

Storage tests install a small in-memory localStorage fake and restore the original property after each synchronous scenario. They exercise invalid JSON, valid JSON of the wrong type, mixed valid and invalid entries, fifty-entry history retention, favorite toggling, denied storage and invalid writes. A key debugging observation is that reading a mixed collection must not rewrite the original storage string.

Try a fault-injection lab. Change the input parser to accept string servings, run the suite, and observe which assertion fails. Restore the code, then make the orchestrator return provider data without parsing. Find the test that distinguishes unchecked success from controlled failure. Finally, remove the array guard in storage and store `{}`. Trace the exception to its first consumer rather than adding catches to every component.

The [verification record](VERIFICATION.md) distinguishes executed evidence from limits. Type checking covers module integration and types when dependencies are available. Neither a passing focused suite nor type checking establishes browser rendering, accessibility, actual API credentials or deployment behavior. Preserve those distinctions in a pull-request description.
