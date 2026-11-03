# Invoice Generator public mobile application

This is the clean public-edition mobile application. It is intentionally
separate from the private OurWorldTT business application and does not contain
its logo, sectors, departments, loyalty program, staff login, or QR scanner.

## Current capabilities

- Create invoices and receipts
- Use light, dark, or automatic system appearance with an orange-and-white theme
- Save client presets and load only their name, phone, and email into a document
- Save a typed or drawn account signature for optional PDF inclusion
- Store development records locally on the device
- Search document history
- Preview, print/save, and share documents
- Upload a per-user business logo with type and size validation
- Maintain business profile details
- Open a voluntary PayPal support flow once its URL is configured
- Package the web application for Android and iOS with Capacitor

Local storage remains available only while `authMode` is `development`. The
public API foundation in `backend/` provides authenticated, user-isolated
profile and document storage for OW Login Portal mode.

## Public infrastructure identity

- Repository: `OurWorldTT/owf-invoice-generator`
- Edition identifier: `public`
- Neon project: `OW Invoice Generator Public` (`gentle-flower-08749127`)
- Database: `invoice_public`
- User-brand bucket: `user-brand-assets`

The public API health check rejects any database name other than
`invoice_public`. The browser also rejects a backend that does not identify
itself as the public edition. Business credentials, staff accounts, and the
business API must never be configured here.

## Backend

Deploy `backend/` as its own Vercel project and configure the variables shown
in `backend/.env.example`. Apply `backend/sql/001-public-api-foundation.sql`
followed by `backend/sql/002-profile-signatures-presets-audit.sql` with a
direct/unpooled connection after rehearsing both on a Neon branch.

The OW Login Portal must expose an OIDC-compatible JWKS URL, issuer, and audience. The
API validates signed access tokens and uses the token subject as the only user
identity. No passwords or client secrets are stored in this repository.

## Run and test

```powershell
npm install
npm test
npm run build
```

Open `dist/index.html` through a local static server for browser testing.

## Android

```powershell
npx cap add android
npm run sync:android
npx cap open android
```

## iOS

Run these commands on macOS with Xcode installed:

```bash
npx cap add ios
npm run sync:ios
npx cap open ios
```

## OW Login Portal integration boundary

`config.js` currently uses `authMode: 'development'` so the project remains
locally testable before the public identity provider values are issued. To enforce
login in production, set `authMode` to `ow-login`, set `apiBaseUrl`, and provide
the public authorization URL, token URL, client ID, redirect URI, and scopes in
the `loginPortal*` fields. Do not place a client secret in this file. The browser
uses Authorization Code with PKCE; the Vercel API validates the signed access
token and scopes every query to its subject.

## PayPal

Set `paypalDonateUrl` in `config.js` only after the final PayPal contribution
destination is known. PayPal remains the payment processor and source of truth.

## Database

The canonical schema is included at `database/schema.sql`. Never embed a Neon
connection string in the mobile bundle. Only the server-side Vercel API may
connect to Neon.
