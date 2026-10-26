# Personal portfolio — GitHub Pages starter

A zero-build, responsive portfolio website for Atabak Nikouseresht, built with vanilla HTML, CSS, and JavaScript. No frameworks, npm dependencies, API keys or paid hosting are needed.

## Publish

1. Create a **public** GitHub repository named `atabak-nikouseresht.github.io` (GitHub requires the username portion of a Pages user-site repository name to be lowercase).
2. Upload the **contents** of this folder directly to the root of the repository on `main` — specifically `index.html`, `styles.css`, `script.js`, `favicon.svg`, `README.md`, and `.nojekyll`.
3. In your repository, go to **Settings > Pages > Build and deployment**. Choose **Deploy from a branch**, branch `main`, folder `/(root)`, then **Save**.
4. Open `https://atabak-nikouseresht.github.io/` after deployment. GitHub says initial publishing can take up to 10 minutes.

## Local preview

Open `index.html` directly in a browser, or start a local static web server:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000 .

## Before sharing on LinkedIn or job applications

- Check every headline, affiliation, project result, and employment description for accuracy.
- The IEEE-CIS card uses current corrected temporal evaluation results: ROC-AUC ~0.888 and average precision ~0.480. Do **not** replace with historical or Kaggle leaderboard metrics without explaining their different evaluation conditions.
- Portfolio Theory was collaborative and is a report-only archival repository. Read its ERRATA.md before making any performance claims.
- Hermes Crypto Lab is paper trading / simulated execution only. Do not describe it as a profitable or live execution product.
- There is no personal email, phone, CV download, portrait or LinkedIn link in this starter: none was assumed or invented. Add verified contact links before broad distribution.
- Google Fonts are requested online (DM Sans, DM Mono, Instrument Serif); system fallbacks work offline.

## Customize

- Site content: `index.html`
- Colours, typography and spacing: `styles.css` (`:root` variables)
- Dark/light theme and mobile navigation: `script.js`
- Favicon: `favicon.svg`
- Page title, descriptions, and open-graph metadata: `index.html` `<head>`

## Deployment constraints

GitHub Pages serves static files; it is not an application server and doesn't run Python/PHP backends. Never put credentials, API keys, private documents, or client-sensitive data in this repository.

## Ownership and collaboration

README summaries of public repositories were checked against their GitHub contents on 2026-10-26. This project starter is separate from the existing repositories. No GitHub repo has been created or changed by preparation of this archive.
