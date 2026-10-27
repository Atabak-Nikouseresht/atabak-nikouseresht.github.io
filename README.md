# Atabak Nikouseresht — professional portfolio

A zero-build, responsive portfolio for an MSc student in Applied Economics and Markets at the University of Bologna, focused on financial risk and data analytics. Built with semantic HTML, CSS and vanilla JavaScript; no dependencies, backend, tracking scripts or external font requests.

## Local preview

Open `index.html` directly, or run `python -m http.server 8000` and visit `http://localhost:8000`.

## Deployment

GitHub Pages serves this repository from `main` at `https://atabak-nikouseresht.github.io/`. The root `.nojekyll` and Google Search Console verification artifact are preserved. `sitemap.xml` and `robots.txt` describe the public homepage.

## Content accuracy

- The IEEE-CIS case study reports the corrected retrospective temporal evaluation: XGBoost ROC-AUC 0.887546, average precision 0.480197 and top-1% batch precision 0.870558. The fixed-budget scenario is an evaluation result, not an operational policy or loss-savings claim; feature timing and label maturity remain uncertain, and customer-level generalization was not tested.
- The Streamlit project demonstrates a local interface around a saved scikit-learn pipeline. Its form accepts eight fields while the legacy fitted transformer actively uses six; training provenance and real-world predictive performance are not established.
- The collaborative Portfolio Theory report applies diversification, mean–variance optimization, CAPM and Black–Litterman. It remains an archival academic report; its repository includes errata and does not provide source data or runnable analysis code.
- Hermes Crypto Lab demonstrates market-data processing, backtesting, research controls and versioned simulated execution. It is in frozen forward paper validation; its records do not represent live orders.
- Supporting econometrics projects are collaborative archival studies using ARDL/VAR and OLS/logit methods. Their reports and errata are public, while complete reproduction data/code are not included.
- The MSc is in progress; no graduation date or transcript is published.

A one-page professional resume is linked from the hero and Contact section. The site also links to the professional LinkedIn profile and public contact email.

## Maintenance

- `index.html`: content, canonical/SEO metadata, Open Graph/Twitter card metadata and Person schema.
- `styles.css`: responsive layout, dark/light theme tokens, focus states and reduced-motion rules.
- `script.js`: system-aware theme persistence and accessible mobile navigation; unenhanced pages keep section navigation visible when JavaScript is disabled.
- `assets/social-preview.png`: 1200×630 navy social preview image.
- `assets/fraud-detection-streamlit-preview.webp`: static screenshot captured from the locally run Streamlit app; it shows form defaults, not a prediction result.
- `assets/education-highskill-age-distribution.webp`: cropped, authentic descriptive chart excerpt from the linked public project report; it is not a newly computed result.

No analytics, visitor identifiers, or external font assets are loaded.
