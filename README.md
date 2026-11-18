# VendBI-new-website

Portable VendBI marketing website built with Astro, TypeScript and Tailwind CSS. Static pages plus one Cloudflare Pages Function for secure enquiry delivery. **Local source only: no site registered, public deployment performed, or DNS changed.**

## Develop and verify

Requires Node.js 22.12+ (tested with Node 24), npm.

```sh
npm ci
npm run dev
ASTRO_TELEMETRY_DISABLED=1 npm run build
npm test
npm run check:links
npm run preview
```

`dist/` contains the generated site. `npm run dev` and `preview` serve static pages; they do not run Pages Functions. For end-to-end form testing use `npx wrangler pages dev dist` after a build and supply local secrets in ignored `.dev.vars`. Put public build variables in ignored `.env` before building. On hosts with a restricted home directory, use `npm ci --cache /workspace/work/npm-cache` (or another writable cache) and `ASTRO_TELEMETRY_DISABLED=1` as shown.

## Architecture

- `src/pages/`: all public pages, three practical resource guides, sitemap and 404.
- `src/layouts/Layout.astro`: shared desktop/mobile navigation, footer, metadata, canonical URLs and factual structured data.
- `src/components/`: reusable logo treatment, illustrative dashboard, FAQ, CTA and enquiry forms.
- `src/styles/global.css`: responsive design system; Tailwind v4 enabled through Vite. System fonts avoid third-party font requests.
- `functions/api/leads.js`: Cloudflare Pages endpoint. Never part of client JavaScript.
- `tests/`: meaningful lead validation and delivery failure/success-path tests.
- `scripts/check-links.mjs`: verifies generated routes, assets, anchors, titles and portal links.

## Forms: deliberately disabled until configured

Set `PUBLIC_LEADS_ENABLED=true` and `PUBLIC_TURNSTILE_SITE_KEY` at build time only after privacy/legal approval and delivery testing. Put `LEAD_WEBHOOK_URL` (HTTPS), optional `LEAD_WEBHOOK_TOKEN` and `TURNSTILE_SECRET_KEY` in Cloudflare Pages secret bindings. See `.env.example`. Never put a secret in a `PUBLIC_` variable. Do not commit `.env` or `.dev.vars`.

Create Turnstile site keys for the chosen preview/production hostnames. Each form uses its kind (`demo`, `vbn`, `contact`) as the Turnstile action. Tokens are verified server-side against the hostname and action. Endpoint also applies same-origin checks, field limits, consent validation, a honeypot, minimum completion time and a bounded body size. Configure Cloudflare rate limiting for `/api/leads` if abuse warrants it; no durable application rate counter is included.

The webhook receives `{kind,name,company,email,phone,location,fleet,interest,screens,locations,hardware,message,consent,consentVersion,receivedAt,source}`. Route `kind` to separate demo, VBN and contact pipelines. It must return 2xx only after durable storage/queue acceptance. Acknowledgement email, deduplication and notification delivery belong in the configured CRM/automation backend; they are not silently simulated. Do not log personal data. Update `consentVersion` when publishing the approved privacy notice. Timeout retries can duplicate a lead; configure backend deduplication.

No configured backend exists in this deliverable. The website displays an honest unavailable notice and disabled submission buttons. Automated tests mock verification and delivery; real lead storage, Turnstile and notifications require integration testing.

## Cloudflare Pages + GitHub (after approval)

1. Create a **private** GitHub repository named `Vendbi-new-website`, add this directory and push the initial commit. Remote creation requires connected GitHub access; the local repository is independent.
2. Create a Cloudflare Pages project linked to that repository. Framework: Astro; build command `npm run build`; output directory `dist`; root: repository root; Node version 24.
3. Pages automatically deploys `functions/` alongside `dist/`. A plain static upload alone does **not** enable form delivery. If using the CLI, run `npx wrangler pages deploy dist` from the repository root with `functions/` present.
4. Configure separate Preview and Production bindings and public build variables. Keep preview forms disabled unless using a dedicated test pipeline.
5. Add `X-Robots-Tag: noindex` to preview deployment responses through a preview-only headers override or access-protect the staging project. Production robots intentionally allow Googlebot, Bingbot and OAI-SearchBot. Do not expose staging to indexing. No staging deployment has been created.
6. Test approved copy, forms, notification routing, accessibility, mobile layouts, portal destination and redirects before release. Approval is required before publishing or connecting a live domain.
7. Only after approval, connect the intended marketing host(s). Preserve existing email, nameservers and all `app.vendbi.com` records. Choose `www` as canonical and configure the marketing apex redirect independently. Back up current marketing DNS/site and keep the previous deployment for rollback.

### Portal is strictly out of scope

Every page has a prominent `Portal Login` pointing directly to **https://app.vendbi.com/ops/** in the desktop header, mobile menu and footer. Links use same-tab navigation and never proxy credentials. No portal login UI, authentication, backend or subdomain configuration is implemented. No DNS commands or infrastructure mutation scripts are included. Test the portal link again immediately before release; do not bypass an access challenge or attempt authentication.

## Content and release decisions

See `CONTENT-REVIEW.md`. The attached blueprint is a strategic proposal, not product verification. Its Framer recommendation does not override the user's explicit Astro requirement. The direct user homepage subheadline is retained. VBN remains interest-only; no earnings estimates, fabricated pricing, testimonials, clients, integrations or first-in-region claims appear.

The homepage and platform preview now use actual screenshots sourced from the official VendBI app listings. Feature sections show the corresponding published views. See SCREENSHOT-SOURCES.md for provenance; listing example figures are not customer results. Header and footer use the user-approved AI-edited horizontal logo based on supplied brand references, exported as transparent PNG and optimized WebP. The footer uses the white reversed variant directly on navy. The favicon uses the icon portion. This is raster artwork rather than an original vector master. Shared SVG and PNG Open Graph artwork are included; metadata uses the 1200×630 PNG for social-platform compatibility.

Canonical URLs target `https://www.vendbi.com/`. SoftwareApplication schema is omitted until supported feature and commercial details are verified. Organization, breadcrumbs and visible-content FAQ schema are supplied. No analytics/cookies integration is enabled by default. Review the existing site's complete URL inventory before adding final migration redirects; only `/faq`, `/vbn` and `/login` convenience redirects are supplied.
