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

## App screenshots

`static/screenshots/` contains original 2064 × 2752 PNG captures of the iPad app,
with the current Peekaboo branding. Captured on 21 September 2026 using the
13-inch iPad Pro simulator and app source at `9fd0b11`. The wardrobe uses sample
progress. Device frames are CSS; the screenshots are not cropped or retouched.
Each image links to its full-resolution original and loads lazily on the homepage.

When the app changes, recapture these screens from the iOS repository before
updating the website. Check the gallery at desktop and mobile widths and open
each full-size image.

## Sample exercises

The homepage includes a letter exercise (**m**, choosing between a and m), followed
by a picture-word exercise (**mat**, choosing between map, mat, and tap).
Players can retry and replay freely. Sound starts only after interaction; muting it
shows the letter hint. The demo does not use the microphone or save progress.

`static/word-demo.js` controls the two exercises. The card keeps the same slots for
its prompt, answers, Milo, feedback, and action button in every state. Transitions
do not scroll the page or remove the answer row.

`static/demo/` contains original app imagery, Piksel narration, and the m phoneme.
The phoneme and its edits are CC BY-SA 3.0; attribution, source, and edit details
are in `static/demo/credits.txt`, linked beside the demo.

`static/demo/milo/` contains transparent WebP encodes of Milo's existing idle,
talking, listening, and native robot celebration animations. Animation starts
with the example, uses a fixed image box, and falls back to stills for reduced
motion, offscreen content, or a hidden tab. The Motion toggle lets visitors choose
animation or stills explicitly. The success dance plays once and holds.
Audio and images resolve relative to the script, including on a GitHub project URL.
The site has no JavaScript package dependencies.

To check a change, build, run `python3 scripts/check_site.py`, and test start,
wrong/correct letter, next, wrong/correct word, finish, and replay at desktop and
mobile widths. Check that the card height, control positions, and page scroll stay
stable. Also check sound off, audio failure, image retry, keyboard controls, and
reduced motion.

## Before publishing

Keep the privacy policy aligned with the deployed hosting and app telemetry setup,
including request logs, Sentry/Mixpanel retention, and privacy declarations. Keep the
coming-soon copy until there is an App Store listing. Contact: Hoye Lam / Kin-Yee,
`hoyelam@kin-yee.com`; Netherlands Chamber of Commerce number 75399423.

The [iOS launch checklist](https://github.com/hoyelam/LetterMilo/blob/main/Docs/LaunchReadiness.md)
tracks the remaining app and store work.
