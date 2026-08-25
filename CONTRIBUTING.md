# Contributing

Thanks for taking the time to improve Preagonal WebRC.

## Before opening a pull request

- Keep the change focused on the web client.
- Run `npm test` and `npm run build` from the repository root.
- Do not commit credentials, tokens, private server details, generated output, or machine-specific paths.
- Update the relevant tests when behavior changes.
- Keep GameServer endpoint additions in the typed API adapter; do not invent routes for server features that are not published.

## Pull requests

Describe what changed, why it changed, and how it was checked. Include screenshots for visual changes when they make the review easier. Call out any dependency or API contract changes explicitly.

## Code style

Follow the existing TypeScript, React, MUI, and CSS patterns. Prefer small focused components and typed boundaries over feature-specific workarounds. Keep the interface usable at desktop and narrow mobile widths.
