# Verification record

## September 15 follow-up

- All five browser workflows passed in 50.5 seconds against the isolated QA database after its server became ready.
- All eight input-validation tests passed.
- Public-page checks include the Featured Cars heading, its Browse Cars destination, and desktop/tablet/mobile layouts with the persistent scroll-driven hero animation.
- The first test attempt ran before the QA server was ready and failed with connection refused; the rerun above passed.
- No test fixtures were written to the configured business database.

## Confirmed

- The final Next.js production build and its TypeScript check passed.
- TypeScript checking passed.
- Eight input-validation regression tests passed, including moderation-state stripping, invalid request rejection, preorder requirements, inspection dates, and blank optional URLs.
- Public pages were checked at 1440, 768 and 390 pixels. The automated checks found no horizontal overflow or hydration errors after repairs.
- Contact, inspection, seven-step preorder and shipping forms persisted their records to a disposable MongoDB replica set and displayed committed reference numbers.
- Anonymous users were redirected from administration and rejected by the admin API.
- Admin sign-in, lead status changes and inspection progress changes persisted across page reloads.
- Reviews stayed private until approval, became visible after approval, and disappeared when hidden.
- Vehicle creation, editing, publication, image-viewer interaction, sold-vehicle calls to action, and archiving passed against the production build.
- The final full browser suite passed all five tests in 1.2 minutes against an isolated production server.
- A read-only ping to the user-configured MongoDB connection succeeded. No test records were written to that database.

## Repairs made during verification

- Switched the project to ES modules for Next.js compilation.
- Moved illustrative photographs into local assets after the remote image host was blocked during optimization.
- Changed the GSAP reveal implementation to avoid altering server-rendered attributes during hydration.
- Separated the preorder Continue and Submit controls so reaching the review step does not submit the request.
- Made optional URL validation safe for blank and malformed inputs.
- Restored inspection progress when reloading admin records.
- Corrected the ESM environment-loader import in setup scripts.
- Moved the final browser suite to the production build to avoid slow development compilation interrupting tests.

## External configuration still required

- Cloudinary credentials and live upload/deletion verification, including mobile Safari/Chrome and HEIC files.
- Initial administrator email/password provisioning.
- Exact supplied logo as an accessible image asset, replacing the temporary text wordmark.
- Exact Vercel account/project selection, deployment approval and deployment verification. Automatic approval review rejected deployment to an unspecified destination; no deployment was performed.
- Analytics account IDs if GA4 or Meta Pixel should be enabled.

WhatsApp is configured to **2347060558970**. Public email and address remain unset at the user's request. Browser integration fixtures are synthetic and are confined to the disposable local QA database.
