# Atabak Nikouseresht — professional portfolio

A zero-build, responsive portfolio for an MSc student in Applied Economics and Markets at the University of Bologna, focused on financial risk and data analytics. The homepage presents selected projects and ongoing research; `/projects/fraud-risk/` contains the evidence-backed IEEE-CIS case study. Built with semantic HTML, CSS and vanilla JavaScript; no production dependencies, backend, tracking scripts or external font requests.

## Local preview

Open `index.html` directly, or run `python -m http.server 8000` and visit `http://localhost:8000`.

## Deployment

GitHub Pages serves this repository from `main` at `https://atabak-nikouseresht.github.io/`. The root `.nojekyll` and Google Search Console verification artifact are preserved. `sitemap.xml` lists the homepage and the substantive fraud-risk case study; `robots.txt` points to the sitemap.

## Content accuracy

- The homepage and `/projects/fraud-risk/` report the corrected retrospective temporal evaluation: XGBoost ROC-AUC 0.887546, average precision 0.480197 and top-1% batch precision 0.870558. The fixed-budget scenario is an evaluation result, not an operational policy or loss-savings claim; feature timing and label maturity remain uncertain, and customer-level generalization was not tested.
- The Streamlit project demonstrates a local interface around a saved scikit-learn pipeline. Its form accepts eight fields while the legacy fitted transformer actively uses six; training provenance and real-world predictive performance are not established.
- The collaborative Portfolio Theory report applies diversification, mean–variance optimization, CAPM and Black–Litterman. It remains an archival academic report; its repository includes errata and does not provide source data or runnable analysis code.
- Hermes Crypto Lab demonstrates market-data processing, backtesting, research controls and versioned simulated execution. It is in frozen forward paper validation; its records do not represent live orders.
- Supporting econometrics projects are collaborative archival studies using ARDL/VAR and OLS/logit methods. Their reports and errata are public, while complete reproduction data/code are not included.
- The MSc is in progress; no graduation date or transcript is published.
- The Ongoing Research section states only a high-level thesis focus in banking digitalization and risk, based on public-source evidence. The research design remains in progress; no findings or causal claims are presented.

A one-page professional resume is linked from the hero and Contact section. The site also links to the professional LinkedIn profile and public contact email.

## Maintenance

- `index.html`: homepage content, research summary, selected project evidence, canonical/SEO metadata, Open Graph/Twitter metadata, Person schema, and favicon links.
- `projects/fraud-risk/index.html`: detailed IEEE-CIS case study with unique canonical/social metadata, TechArticle schema, accessible result tables and source links.
- `styles.css`: responsive layouts, theme-aware light/dark logo variants, theme tokens, focus states, reduced-motion rules, larger app preview and case-study components.
- `script.js`: system-aware theme persistence and accessible mobile navigation; cross-page fragment links focus their destination, and no-JavaScript section navigation remains available.
- `tests/test_portfolio.py` and `.github/workflows/portfolio-validation.yml`: standard-library structural/content checks and JavaScript syntax check on pull requests and pushes to `main`; no restricted model data or third-party test packages are fetched.
- `assets/logo-atabak-full.png`: transparent, high-resolution copy of the supplied horizontal mark, optimized from its already-transparent RGBA source.
- `assets/logo-atabak-full-dark.png`: same geometry and typography with the navy/blue palette lightened for contrast on dark surfaces; `*-small.webp` variants are used in the header.
- `assets/logo-atabak-mark.png`: transparent square crop of the supplied leaf/tree mark; a contrast variant is used in the footer.
- `favicon.svg`, `favicon.ico`, `assets/favicon-32.png`, and `apple-touch-icon.png`: derived from the original-colour mark on a pale icon tile. The SVG embeds the raster icon; no unfaithful full-wordmark vector was fabricated.
- `assets/social-preview.png`: 1200×630 navy social preview with the official leaf mark replacing the former abstract circle motif.
- `assets/fraud-detection-streamlit-preview.webp`: visible static screenshot captured from the locally run Streamlit app; it shows form defaults, not a prediction result.
- `assets/education-highskill-age-distribution.webp`: authentic archival descriptive chart excerpt from the linked public project report; it is not a newly computed result.

No analytics, visitor identifiers, or external font assets are loaded.

## Quality checks

Run the lightweight local checks from the repository root:

```bash
python -B -m unittest discover -s tests -v
node --check script.js
```

The GitHub Actions validation workflow runs the same checks. The checks verify page metadata, local links/assets, case-study evidence links, sitemap coverage, image alternatives, responsive-preview sizing, navigation labels and key published metrics; they do not attempt to certify research claims beyond the linked source artifacts.
