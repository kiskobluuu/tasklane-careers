# Task Lane Company — Careers Application Site

A production-oriented recruiting site designed for GitHub Pages with a private Supabase backend.

The public application is intentionally streamlined to applicant details, experience/availability, and final review. It does not include product reviews, work-sample exercises, affiliate links, or monetized applicant actions.

## What is included
- Professional role landing page
- Three-step application form with browser draft saving
- UTM/source capture for job-board attribution
- Cloudflare Turnstile anti-bot verification
- Private Supabase database + private résumé storage
- Duplicate-submission guard
- Optional Resend email notification
- GitHub Pages deployment workflow
- Custom-domain support

## Important launch gate
`config.js` ships with `staging: true`. While staging is true, form submission is disabled.


## Launch sequence
1. Create a Supabase project dedicated to recruiting data.
2. Run `backend/supabase/schema.sql` in the Supabase SQL editor.
3. Deploy `backend/supabase/functions/submit-application` as an Edge Function.
4. Set Edge Function secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `ALLOWED_ORIGIN`; optionally `RESEND_API_KEY`, `NOTIFY_EMAIL`, `FROM_EMAIL`.
5. Create a Cloudflare Turnstile widget for the final careers domain and paste its site key into `config.js`.
6. Test application submission and confirm records/resumés are private.
7. Replace the privacy-notice effective date and obtain local legal review for your exact hiring jurisdictions.
8. Set `staging: false`.
9. Deploy to GitHub Pages and attach the custom domain.

## Job-board tracking links
Use a different source query string for each posting, e.g.:

`https://careers.tasklaneco.com/apply.html?source=indeed&utm_source=indeed&utm_medium=job_board&utm_campaign=role_slug`

The form stores these values with the application so you can compare which job board produces qualified applicants.

## Security notes
- Never put the Supabase service-role key, Turnstile secret, Resend key or other private credentials in GitHub Pages files.
- The résumé bucket is private; no public storage policy is created.
- Restrict Supabase dashboard access to staff who actually review applications.
- Résumés are untrusted files. Keep endpoint/desktop malware protection enabled before opening attachments.
- Delete application records according to the retention policy you publish.
