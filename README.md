# Invoice Simple public mobile starter

This is the clean public-edition mobile application. It is intentionally
separate from the private OurWorldTT business application and does not contain
its logo, sectors, departments, loyalty program, staff login, or QR scanner.

## Current capabilities

- Create invoices and receipts
- Store development records locally on the device
- Search document history
- Preview, print/save, and share documents
- Upload a per-user business logo with type and size validation
- Maintain business profile details
- Open a voluntary PayPal support flow once its URL is configured
- Package the web application for Android and iOS with Capacitor

Local storage is development-only. Before public release, document and profile
operations must use the Vercel API and the existing public Neon database.

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

## OW Central integration boundary

`config.js` currently uses `authMode: 'development'`. Do not place client
secrets in this file. When OW Central is ready, configure its public login URL
and implement Authorization Code with PKCE plus universal/app links. The Vercel
API must validate the signed access token and scope every query to its subject.

## PayPal

Set `paypalDonateUrl` in `config.js` only after the final PayPal contribution
destination is known. PayPal remains the payment processor and source of truth.

## Database

The canonical schema is included at `database/schema.sql`. Never embed a Neon
connection string in the mobile bundle. Only the server-side Vercel API may
connect to Neon.
