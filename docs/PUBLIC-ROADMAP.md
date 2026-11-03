# Public edition roadmap

## Foundation — implemented on the current review branch

- Public/business edition and database identity guards
- OW Login Portal JWT verification boundary
- User-isolated profiles and documents
- Transactional invoice/receipt numbering
- Server-side financial validation
- Database-backed per-user rate limiting
- Search-ready document endpoint and health diagnostics
- Development local mode retained until OW Login Portal production values exist

## Next milestones

1. Complete OW Login Portal Authorization Code + PKCE client flow and deep links.
2. Add private logo upload/download through `user-brand-assets`.
3. Archive generated PDFs privately and return short-lived downloads.
4. Add camera OCR with cropping, confidence indicators, and confirmation.
5. Add QR/barcode lookup with permission recovery and typed fallback.
6. Add reporting, filters, CSV export, and currency-separated totals.
7. Add secure email/share links with expiry and revocation.
8. Add user-visible audit history and structured error monitoring.
9. Complete PWA offline drafts and Android validation before iOS packaging.
