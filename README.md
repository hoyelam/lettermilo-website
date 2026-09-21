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

`Check website` runs on pushes and pull requests. It verifies both the custom-domain
layout and the GitHub project-site layout, including page links, assets, and metadata.

`Publish GitHub Pages` is **manual**. Pushing to `main` does not publish the website.
When ready, use Actions → Publish GitHub Pages → Run workflow, with branch `main`:

```sh
gh workflow run pages.yml --repo hoyelam/lettermilo-website --ref main
```

The workflow reads the configured Pages address, builds and checks the site, then deploys
`dist/` to `https://lettermilo.com/`. It also supports the GitHub project-site address
`https://hoyelam.github.io/lettermilo-website/` when no custom domain is configured,
including the project path in navigation and asset URLs. If configuring a fresh
repository, choose **GitHub Actions** as its Pages source under Settings → Pages.

To check the project URL locally:

```sh
SITE_BASE_URL=https://hoyelam.github.io/lettermilo-website python3 build.py
SITE_BASE_URL=https://hoyelam.github.io/lettermilo-website python3 scripts/check_site.py
```

Run the default build again for the root-level local preview. See GitHub's
[custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Domain configuration

The website uses **https://lettermilo.com/**. Cloudflare manages the domain and DNS;
GitHub Pages hosts the site. Domain ownership is verified on the `hoyelam` GitHub account.

Cloudflare records use **DNS only**, with TTL set to **Auto**:

| Type | Name | Destination |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `hoyelam.github.io` |

Keep the `_github-pages-challenge-hoyelam` TXT record: it proves domain ownership.
The repository's Pages custom domain is `lettermilo.com`, with **Enforce HTTPS** enabled.
GitHub manages the certificate and redirects `www` to the main domain.
With an Actions deployment, the Pages setting controls the domain; a `CNAME` file is not needed.

After publishing, check `/`, `/privacy/`, `/terms/`, `/support/`, and an unknown path.
The app links use the same domain. GitHub's [custom-domain guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
covers DNS and certificate troubleshooting.

## Content and artwork

- `site.json`: company details, last-updated date, and intended canonical URL.
- `src/pages/`: page content.
- `static/`: styles, Peekaboo branding, and app artwork.
- `build.py`: shared shell and URL generation; `SITE_BASE_URL` overrides the intended URL.
- `scripts/check_site.py`: generated-site checks.

The iOS repository owns the Blender source and high-resolution master. After changing
branding there, copy `AssetsSource/Branding/web/` into this repository's `static/` directory.
The app is not required to build or publish the website.

## Sample word game

The homepage includes three picture-word rounds from the iPad app: **mat, map, tap**.
Players choose a word, retry freely, hear the recorded word, and replay the game.
Sound starts only after interaction and can be switched off. The demo does not use the
microphone, record answers, or save progress.

`static/word-demo.js` controls the game. `static/demo/` contains the original word PNGs
and Piksel narration clips copied from the iOS app's `LetterMilo/Resources/` directory.
Audio and images resolve relative to the script, including on a GitHub project URL.
No JavaScript package installation is required. The rest of the site works without
JavaScript; the sample displays an explanation when JavaScript is disabled.

To check a change, build the site, run `python3 scripts/check_site.py`, then try a wrong
answer, a correct answer, all three rounds, replay, sound off, and keyboard navigation
at both desktop and mobile widths. Also verify the game can finish if audio is unavailable.

## Before publishing

Keep the privacy policy aligned with the deployed hosting and app telemetry setup,
including request logs, Sentry/Mixpanel retention, and privacy declarations. Keep the
coming-soon copy until there is an App Store listing. Contact: Hoye Lam / Kin-Yee,
`hoyelam@kin-yee.com`; Netherlands Chamber of Commerce number 75399423.

The [iOS launch checklist](https://github.com/hoyelam/LetterMilo/blob/main/Docs/LaunchReadiness.md)
tracks the remaining app and store work.
