# LetterMilo website

Landing page, privacy policy, terms, and support for LetterMilo. This repository is
independent of the [iOS app](https://github.com/hoyelam/LetterMilo).

Built with Python's standard library. No package installation, analytics, contact forms,
cookies, or external fonts. Milo and the artwork belong to Kin-Yee; all rights reserved.

## Build and preview

```sh
python3 build.py
python3 scripts/check_site.py
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

Open <http://127.0.0.1:8765/>. `dist/` is generated and ignored by Git.

## GitHub Pages

`Check website` runs on pushes and pull requests. It verifies both the future custom-domain
layout and the GitHub project-site layout, including page links, assets, and metadata.

`Publish GitHub Pages` is **manual**. Pushing to `main` does not publish the website.
When ready, use Actions → Publish GitHub Pages → Run workflow, with branch `main`:

```sh
gh workflow run pages.yml --repo hoyelam/lettermilo-website --ref main
```

The workflow reads the configured Pages address, builds and checks the site, then deploys
`dist/`. Before the domain is connected, the address is
`https://hoyelam.github.io/lettermilo-website/`. Navigation and asset URLs include the
project path. If configuring a fresh repository, choose **GitHub Actions** as its Pages
source under Settings → Pages.

To check the project URL locally:

```sh
SITE_BASE_URL=https://hoyelam.github.io/lettermilo-website python3 build.py
SITE_BASE_URL=https://hoyelam.github.io/lettermilo-website python3 scripts/check_site.py
```

Run the default build again for the root-level local preview. See GitHub's
[custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Connect lettermilo.com later

No `CNAME` or custom domain is configured before the domain is owned.

1. Purchase `lettermilo.com` and verify domain ownership in GitHub Pages.
2. Set `lettermilo.com` as the custom domain in this repository's Pages settings.
3. Configure the DNS records described in GitHub's
   [custom-domain guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
   For `www`, point a CNAME to `hoyelam.github.io`; use the documented apex records for `@`.
4. Enable **Enforce HTTPS** once the certificate is ready, then run the publishing workflow.
5. Check `/`, `/privacy/`, `/terms/`, `/support/`, and an unknown path. Verify the app's links
   from an iPad. The workflow automatically uses the custom-domain root without a repository prefix.

With an Actions deployment, the Pages setting controls the domain; a `CNAME` file is not needed.

## Content and artwork

- `site.json`: company details, last-updated date, and intended canonical URL.
- `src/pages/`: page content.
- `static/`: styles, Peekaboo branding, and app artwork.
- `build.py`: shared shell and URL generation; `SITE_BASE_URL` overrides the intended URL.
- `scripts/check_site.py`: generated-site checks.

The iOS repository owns the Blender source and high-resolution master. After changing
branding there, copy `AssetsSource/Branding/web/` into this repository's `static/` directory.
The app is not required to build or publish the website.

## Before publishing

Review the privacy draft against the final GitHub Pages hosting and app telemetry setup,
including request logs, Sentry/Mixpanel retention, and privacy declarations. Keep the
coming-soon copy until there is an App Store listing. Contact: Hoye Lam / Kin-Yee,
`hoyelam@kin-yee.com`; Netherlands Chamber of Commerce number 75399423.

The [iOS launch checklist](https://github.com/hoyelam/LetterMilo/blob/main/Docs/LaunchReadiness.md)
tracks the remaining app and store work.
