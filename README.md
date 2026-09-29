# Task Lane Company — Careers Application Site

A production-oriented recruiting site designed for GitHub Pages with a private Supabase backend.

## What is included
- Professional role landing page
- Five-step application form with browser draft saving
- UTM/source capture for job-board attribution
- Optional, disclosed affiliate/partner assessment module
- Direct non-affiliate assessment route
- Applicant privacy, affiliate disclosure and accessibility pages
- Cloudflare Turnstile anti-bot verification
- Private Supabase database + private résumé storage
- Duplicate-submission guard
- Optional Resend email notification
- GitHub Pages deployment workflow
- Custom-domain support

## Important launch gate
`config.js` ships with `staging: true`. While staging is true, form submission is disabled.

Do **not** set `assessmentPartner.enabled` and `merchantApprovedApplicantTraffic` to true until the merchant has approved this exact traffic source in writing. Applicants are economically motivated by the possibility of employment, so treating job-applicant traffic as ordinary editorial affiliate traffic is risky and may violate an affiliate program's incentive/traffic-quality rules.

## Launch sequence
1. Confirm the legal entity name, then configure the remaining service credentials in `config.js` (Supabase, Cloudflare Turnstile, and the merchant-approved affiliate link).
2. Create a Supabase project dedicated to recruiting data.
3. Run `backend/supabase/schema.sql` in the Supabase SQL editor.
4. Deploy `backend/supabase/functions/submit-application` as an Edge Function.
5. Set Edge Function secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `ALLOWED_ORIGIN`; optionally `RESEND_API_KEY`, `NOTIFY_EMAIL`, `FROM_EMAIL`.
6. Create a Cloudflare Turnstile widget for the final careers domain and paste its site key into `config.js`.
7. Test application submission and confirm records/resumés are private.
8. Replace the privacy-notice effective date and obtain local legal review for your exact hiring jurisdictions.
9. Set `staging: false`.
10. Deploy to GitHub Pages and attach the custom domain.

## Job-board tracking links
Use a different source query string for each posting, e.g.:

`https://careers.example.com/apply.html?source=indeed&utm_source=indeed&utm_medium=job_board&utm_campaign=role_slug`

The form stores these values with the application so you can compare which job board produces qualified applicants.

## Security notes
- Never put the Supabase service-role key, Turnstile secret, Resend key or other private credentials in GitHub Pages files.
- The résumé bucket is private; no public storage policy is created.
- Restrict Supabase dashboard access to staff who actually review applications.
- Résumés are untrusted files. Keep endpoint/desktop malware protection enabled before opening attachments.
- Delete application records according to the retention policy you publish.
