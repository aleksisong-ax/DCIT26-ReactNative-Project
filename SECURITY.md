# Security policy

**Last reviewed:** 2026-11-26

**Repository:** StudyPrep, `aleksisong-ax/DCIT26-ReactNative-Project`

## Scope and architecture

StudyPrep is an Expo/React Native client with a static web export hosted on GitHub Pages. The repository contains no custom backend, database server, account system, or authentication/session implementation. The vocabulary screen makes HTTPS requests to Free Dictionary API for words from a fixed in-app list. App content and dictionary definitions are rendered as React Native `Text`, not inserted as raw HTML.

The review covered the tracked application source, Expo configuration, npm manifests/lockfile, GitHub Pages workflow, and reachable Git history. It included `npm audit` against the committed dependency lockfile. This is a source and dependency review, not a penetration test or a guarantee that the application is free of vulnerabilities. GitHub repository settings, Actions secrets, deployed hosting configuration, and user devices/data were not accessible for inspection.

## Security practices

- Do not commit API keys, passwords, private keys, signing credentials, or production data. `.gitignore` excludes local `.env*` files (except an intentionally safe `.env.example`) and common signing-key formats. Ignore rules do not replace secret scanning.
- The app currently requires **no project-specific environment variables or secrets**. The Pages workflow uses the automatically provided GitHub workflow token. If environment configuration is added later, keep credentials in GitHub Actions secrets or a local ignored file. Values prefixed with `EXPO_PUBLIC_` are included in client bundles and must never contain secrets.
- Personal materials are persisted in device/browser AsyncStorage. The app validates the saved JSON structure and duplicate IDs before rendering; if loading fails or data is malformed, it leaves the stored value untouched and disables create/delete rather than overwriting it.
- AsyncStorage is local and unencrypted. Users who can access the device or browser profile can access or change that data. Do not store sensitive information in StudyPrep.
- Dictionary words are URL-encoded before requests. Dictionary content is treated as text. Only curated words are requested; there is no app server receiving user-entered content.
- The Pages workflow sets no token permissions by default, grants the build job only repository and Pages read permissions, and grants Pages write plus OIDC token permissions only to the deploy job. Third-party actions are pinned to full commit SHAs. The workflow runs for pushes to `main` and manual dispatch; it does not run on pull requests.
- Keep Expo and transitive dependencies current, review `npm audit` results, and use the committed lockfile with `npm ci` for CI/reproducible installs.

## Audit findings and mitigations

### Dependency advisories

On 2026-11-26, `npm audit` reported **16 transitive advisories: 15 moderate and 1 high**. The only direct package reported by npm is Expo; the reported vulnerable implementation paths are in transitive Expo/Metro build and configuration dependencies, not application-defined server endpoints.

- **PostCSS high-severity advisories:** The SDK 53 Metro configuration pinned a vulnerable PostCSS 8.4 release. `package.json` now overrides `@expo/metro-config`'s PostCSS dependency to **8.5.33** (same major version), and the lockfile records that resolution. Re-run the web export and `npm audit` after changing this override or upgrading Expo.
- **Remaining high-severity advisory — `image-size`:** Metro currently resolves `image-size` 1.2.1, which npm flags for denial-of-service loops in JXL/HEIF/ICNS parsers. The installed Metro `Assets.js` path only identifies PNG, JPEG, BMP, GIF, WebP, PSD, SVG, TIFF, and KTX as image assets; it does not list those affected extensions. This narrows the current app's apparent exposure, but does **not** remove the dependency advisory or prove the vulnerable code is unreachable in every tool path. The dependency remains unresolved.
- **Moderate advisories:** npm reports issues in transitive Expo SDK 53 tooling and dependencies including `glob`, `minimatch`, `sucrase`, `uuid`, and `xcode`.

A non-forced `npm audit fix` did not resolve the remaining SDK 53 dependency tree. npm's proposed broad fix requires a breaking Expo upgrade from SDK 53 to 57. That migration was not applied because it changes the framework/native dependency set and needs its own compatibility review and platform testing. Do not run `npm audit fix --force` as an unreviewed production fix. Plan an Expo SDK upgrade, then rerun dependency and platform checks. Counts and fix paths can change; run `npm audit` against the current lockfile before release.

### Application review

- No custom server endpoints, SQL queries, shell execution, file upload handling, authentication, session cookies, or authorization rules exist in this project; those attack classes are not applicable to the current implementation. There is no app-controlled API server or CORS policy; browser requests to the dictionary service rely on that service's CORS behavior.
- User-created notes and quiz text are rendered using React Native text components. The source contains no raw HTML injection sink such as `dangerouslySetInnerHTML`.
- No repository-managed Content Security Policy or custom HTTP security-header configuration is present for GitHub Pages. Reassess this if raw HTML, external scripts, or sensitive interactions are added.
- AsyncStorage is not a security boundary. Its contents can be edited by the user or same-origin browser scripts; schema validation is intended to fail safely on malformed data, not to make local data confidential or tamper-proof.
- No hard-coded credential or private-key material was found by a heuristic scan of the working tree and all 17 reachable Git commits using common high-confidence credential patterns. This scan is not exhaustive and does not inspect GitHub-hosted secrets or every possible encoding.

## Known limitations

- Local data is unencrypted, unsynced, and not backed up. Clearing browser data, uninstalling the app, or losing a device may make it unavailable.
- There is no automated test suite or configured native store-build pipeline. A successful web export validates bundling, not device security or all runtime behavior.
- Dictionary availability and any rate limits are controlled by the external service. The client retries on failure but has no server-side rate limiter because there is no app backend.
- The dependency advisories listed above remain a release consideration, especially the transitive `image-size` high-severity advisory and the older Expo SDK toolchain.

## Required environment variables

None. No API key is required for the current Free Dictionary API requests. GitHub Actions receives its workflow token automatically; do not add a PAT or SSH private key to the repository.

## Reporting a vulnerability

Please do not publish exploit details, credentials, or sensitive user data in a public issue. If GitHub private vulnerability reporting or a private security advisory is enabled for this repository, use that channel. If it is not enabled, contact the repository maintainers privately through their GitHub profile and request a secure disclosure channel. Include the affected commit, impact, and concise reproduction steps, but redact secrets and personal data. If a credential is exposed, revoke/rotate it immediately and review the affected Git history and deployment secrets.
