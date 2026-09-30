# Task Lane Careers — deployment and controlled test

The frontend has been aligned to the deployed Supabase `submit-application` function (JSON body, `applications` table, consent field names). The original design is unchanged.

## 1. Upload website
Upload the contents of this folder to the root of your GitHub Pages repository. Do not upload the outer ZIP folder as a subfolder. Commit to the publishing branch.

## 2. Test without opening applications to the public
`config.js` deliberately retains `staging: true`. On the deployed website, open:
`https://careers.tasklaneco.com/apply.html?role=research-operations-coordinator&test=1`
Use an email address you control and a clearly labeled test applicant name. Complete all steps and submit. The test bypass is **only a frontend UI gate**, not a backend authorization control. It must be removed before public launch.

## 3. Verify
In Supabase Table Editor, check `public.applications` for the test application, and `public.email_events` for the email status. In Resend, check email delivery and the test inbox. Do not assume email delivery solely because the form redirects to Thank You.

## 4. Before public launch
- Remove the `?test=1` staging bypass from `assets/application.js`.
- Add and enforce server-side anti-bot verification / rate limiting; the deployed function currently lacks Turnstile verification.
- Configure a private résumé storage bucket and backend upload handler before enabling résumé uploads (currently disabled).
- Confirm privacy retention/deletion procedures and administrator access controls.
- Confirm the actual paid positions, terms, and recruitment workflow match the public job descriptions.
- After end-to-end testing and the security checks, change `staging: true` to `staging: false` in `config.js` and redeploy.

## Important
The live function currently saves the applicant name as `full_name`, not separate first/last names. Interest and profile URLs are placed in `relevant_skills` to avoid losing information. Source/UTM values are not persisted by the currently deployed function. This package does not change the live Supabase function or its secrets.
