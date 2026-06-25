---
"decorated-factory": patch
---

Update the development tooling without changing the public API: restore `@changesets/cli` to `^2.31.0`, force `js-yaml ^5.1.0` via `overrides` (clears `npm audit`) and adjust the tests for vitest 4 (relative import and `emitDecoratorMetadata` turned off, since the library does not rely on `design:type`). No changes to `dist`.
