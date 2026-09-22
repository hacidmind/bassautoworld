# BassAutoWorld

Next.js App Router MVP for vehicle discovery, sourcing and logistics requests, moderated reviews, and administration. Built with TypeScript, Tailwind CSS, MongoDB/Mongoose, Auth.js, Cloudinary, React Hook Form, Zod, GSAP and Anime.js.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Copy `.env.example` to `.env.local` if you do not already have local configuration. A locally generated Auth.js secret is present in this workspace; it is ignored by source control. Generate a separate secret for production.

Without a database, public marketing pages work, inventory and reviews show honest empty states, and form submissions return an explicit unavailable response. No request is claimed to be saved when storage is unavailable. WhatsApp is configured to **2347060558970**. Email and address intentionally remain unset.

## Connect the business services

1. Set `MONGODB_URI` to a MongoDB Atlas connection string with access to the application database. Requests use transactions, so a replica set is required. Give the database user only the permissions required for this database and configure Atlas network access for your deployment.
2. Set `AUTH_SECRET` to a strong random secret. Set `ADMIN_EMAIL` and a temporary `ADMIN_PASSWORD` of at least 14 characters, then run `npm run admin:create`. The script creates a super administrator and refuses to overwrite an existing user. Remove `ADMIN_PASSWORD` afterward. Public account registration is not provided.
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Uploads go directly from the browser to Cloudinary using server-signed, unique public IDs. Images are stored in Cloudinary; MongoDB stores metadata only. Supported selections: JPEG, PNG, WebP, HEIC and HEIF; browser upload limit: 15 MB per photo and 30 photos per vehicle. Configure account-level upload limits in Cloudinary as well.
4. Sign in at `/login`. In `/admin/settings`, enter the real contact information and social links. The supplied logo images were visible in the chat but were not available as binary files in the workspace. Upload the approved logo to Cloudinary and set its HTTPS URL in `logoUrl`; it replaces the temporary text wordmark in the header and footer.
5. Create real vehicle listings, upload photos, set their cover order, and publish them. Publishing requires an image. Public pages never seed demonstration vehicles or reviews.

Cloudinary uploads require live credentials to verify. Removing a saved vehicle image and saving the vehicle removes the unreferenced asset from Cloudinary. Cancelled edits or abandoned uploads can leave unused assets; review these in Cloudinary periodically. Archiving vehicles retains their images so they can be restored. Public review uploads are rate limited and remain unpublished until approval.

`TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are reserved configuration entries from the requested template; Turnstile is not enabled. Public requests currently use a honeypot, server-side Zod validation and a database-backed rate limiter. Review and upload endpoints have separate limits. Never expose the database URI, Auth secret or Cloudinary API secret as `NEXT_PUBLIC_` variables.

### MongoDB DNS troubleshooting

If MongoDB reports `querySrv ECONNREFUSED` while using `mongodb+srv://`, the network's DNS resolver may be refusing SRV queries. Set `MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8` in `.env.local` and restart the dev server. This optional setting changes DNS resolution within the Node.js process, including other libraries using Node's DNS resolver; it does not change Windows settings. Leave it unset on deployments with working DNS or private database DNS.

Run `npx tsx scripts/check-database.ts` to test the connection and `npm run admin:verify` to check that the configured administrator exists and is active. These checks do not change database records or print passwords. MongoDB's driver handles SRV discovery; a failed address lookup of the seed hostname alone does not mean the cluster is unreachable.

## Routes and workflows


- Public: `/`, `/cars`, `/cars/[slug]`, `/preorder`, `/inspection`, `/services`, `/services/importation`, `/services/auction-sourcing`, `/services/shipping`, `/services/clearing-forwarding`, `/services/trucking`, `/reviews`, `/about`, `/contact`.
- Admin: `/admin`, `/admin/vehicles`, `/admin/vehicles/new`, `/admin/vehicles/[id]`, `/admin/leads`, `/admin/inspections`, `/admin/preorders`, `/admin/service-requests`, `/admin/reviews`, `/admin/settings`.
- Each inspection, preorder and service request creates its centralized lead and specific request record in one transaction. A human-readable `BAW-YYYYMMDD-XXXXXXXX` reference is returned only after commit.
- Lead status and inspection scheduling status are separate. Reviews start as `PENDING`; only `APPROVED` reviews appear publicly.
- Every admin page and mutation checks the current active user and role on the server. Sessions expire after eight hours. Disable a user in the database to revoke access immediately.
- Vehicle inquiries and inspection links carry the stock number. Sold vehicles offer sourcing of a similar vehicle. WhatsApp links include the relevant context.
- Referrals and supported `utm_source` attribution attach to leads; there are no rewards or commissions.

The current client-side catalogue covers the 500 most recent published vehicles, displaying 12 per page. Admin lists cover the 200 most recent records. These explicit MVP limits should be replaced with server-side search and cursor pagination before inventory or lead volume exceeds them.

## Verification

```sh
npm run typecheck
npm test
npm run build
```

For repeatable browser integration tests, build first, then run the isolated production QA server in one terminal:

```sh
npm run build
npx tsx scripts/qa-server.ts
```

Then in another terminal:

```sh
npx playwright test
```

QA uses a disposable local MongoDB replica set on port 27028 and Next.js on port 3001. It never uses `MONGODB_URI` from your environment. Test-only credentials are embedded in the QA fixture, never created in the application database. The first run downloads a MongoDB test binary. `QA_BROWSER_PATH` can override the default Windows Chrome executable for another operating system. Stop the QA server when finished. Browser tests create synthetic records only in this disposable database. The publication test uses a Cloudinary sample fixture; it does **not** verify real image uploads.

If port 3001 is occupied, set `QA_PORT` to an available port in both terminals (for example, `$env:QA_PORT='3107'` in PowerShell). The QA server and browser tests both use `127.0.0.1` to avoid connecting to another app listening on IPv6 localhost.

## Vercel deployment

1. Import this repository into a Vercel project using the Next.js framework preset. Use Node.js 24 and the existing `npm run build` command. Do not use static export.
2. Configure the required environment variables for the correct Vercel environment. Use separate test and production database credentials. Set `NEXT_PUBLIC_SITE_URL` to the actual HTTPS domain; this drives canonical URLs, Open Graph metadata, robots and the sitemap.
3. Enable Vercel Web Analytics. Optionally set `NEXT_PUBLIC_GA_ID` and `NEXT_PUBLIC_META_PIXEL_ID` to enable the corresponding marketing scripts. Apply your business's consent configuration before enabling marketing trackers where required.
4. Deploy a preview, create the admin, upload a vehicle from mobile, submit each request type, moderate a review and check the saved records before promoting to production. Verify Cloudinary signing and deletion with the live account.

The GitHub repository is connected to the existing `bassautoworld` Vercel project; pushes to `main` trigger production deployment. Configure `MONGODB_URI`, `AUTH_SECRET`, and the three Cloudinary credentials in the Production environment. Set `NEXT_PUBLIC_SITE_URL` to the public HTTPS domain; Vercel's production domain is used as a fallback if the setting still points to localhost. Keep `ADMIN_PASSWORD` and the local DNS override out of Vercel. The admin bootstrap/reset scripts are local maintenance tools.

GitHub Actions runs type checking, unit tests, a production dependency audit and a build. The browser suite uses the isolated QA database described above. Public password-recovery endpoints are disabled until an email delivery flow is implemented; use `npm run admin:reset-password` for authorized recovery. Reset links and password hashes must never be logged.

Confirm the logo, public contact details, real inventory, image rights, and any published trust statements with the business. To roll back a release, promote the previous known-good deployment from the Vercel dashboard.

## Image credits

The two local marketing photographs are illustrative, not BassAutoWorld inventory:
- `public/images/hero.jpg`: image source https://images.unsplash.com/photo-1503376780353-7e6692767b70
- `public/images/automotive.jpg`: image source https://images.unsplash.com/photo-1492144534655-ae79c964c9d7

The supplied brand logo should replace the temporary text mark before launch.

## Simple vehicle publishing

From Admin, choose **Add a vehicle**, select photos from the phone or computer, fill in the essential vehicle details and description, then click **Save vehicle**. New vehicles show on the website by default. The app generates the stock number and listing URL. Optional specifications are under **More vehicle details**. Choose **Also feature on the homepage** to include a vehicle there.

Use **Manage vehicles ? Edit vehicle** to update text, add/remove photos or change the cover. Save applies changes to the public listing. Uncheck **Show on the website** to keep a draft. Archived vehicles remain hidden until restored. The first two lines of the description appear on public vehicle cards.

Photos upload automatically within Admin using the existing Cloudinary integration; the owner never needs to upload files on another website or copy image URLs. One-time developer setup requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in `.env.local` and in the hosting environment. Restart the app after configuring them. Without these credentials, photo uploads report that storage is not configured. The browser integration test stubs Cloudinary, while saving and reading listings use the isolated local database.

### URL photos and formatted descriptions

In the vehicle editor, paste direct public HTTP/HTTPS image links into **Add photos from URLs**, one per line, then choose **Add photos from URLs**. Wait for each photo preview, then click **Save vehicle** to update the website gallery. Pasted URLs that have not been imported must be uploaded or cleared before saving. Cloudinary imports copies, which can be made the cover or reordered alongside device uploads. JPG, PNG, WebP, HEIC, HEIF and AVIF photos are supported for both device uploads and URL imports. Links to web pages, private files or unsupported formats will show an error without removing existing photos.

The description editor supports paragraph, heading, sub-heading, bold, italic, underline, quote, bullet/numbered lists, clear formatting and undo/redo. Select text before applying inline formatting. Save preserves formatting on the vehicle detail page; cards and metadata use plain text. Existing plain-text descriptions continue to work. Formatted HTML is filtered on the server to the supported elements with no embedded scripts, media or arbitrary attributes.
