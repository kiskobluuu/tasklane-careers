# Domain + GitHub Pages setup

## Careers site
This repository is configured for:

`https://careers.tasklaneco.com`

The repository root contains a `CNAME` file with `careers.tasklaneco.com`.

At the DNS provider for `tasklaneco.com`, create a CNAME record:

- Host/Name: `careers`
- Target: `<YOUR-GITHUB-USERNAME>.github.io`

Then enable GitHub Pages for the repository and set the custom domain to `careers.tasklaneco.com`. Enable HTTPS after DNS verification succeeds.

## Main company domain
`https://tasklaneco.com` is the main company domain. It may host the company homepage separately and link to `https://careers.tasklaneco.com` for recruiting.

If you intentionally want the apex domain to show the careers site instead, configure the apex records using GitHub Pages' current documented DNS values rather than duplicating the `CNAME` file.

## Contact
Recruiting/privacy contact currently configured as `tasklaneco@gmail.com`.
