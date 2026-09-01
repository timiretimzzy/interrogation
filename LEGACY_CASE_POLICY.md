# Legacy Case Policy

Pre-gold-standard cases are retained as historical material and compatibility references only. They are explicitly excluded from active certification, future templates, architectural decisions, and quality benchmarks.

`src/data/cases/index.ts` exposes only deliberately authored synthetic cases through `cases`. Retired content is isolated in `legacyCases`; it may be loaded only by compatibility tests or explicit historical-reference work. Do not retrofit it to demonstrate new engine features or infer future case architecture from it.

Future flagship work must use synthetic fixtures and the gold-standard authoring documents as its authority.
