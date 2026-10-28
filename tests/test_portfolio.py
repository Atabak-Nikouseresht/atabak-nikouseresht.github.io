from __future__ import annotations

import json
import re
import unittest
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
CASE_PATH = "projects/fraud-risk/index.html"


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.anchors: list[dict[str, str]] = []
        self.nav_links: list[dict[str, str]] = []
        self.images: list[dict[str, str]] = []
        self.meta: list[dict[str, str]] = []
        self.links: list[dict[str, str]] = []
        self.title = ""
        self.text: list[str] = []
        self._in_nav = False
        self._anchor: dict[str, str] | None = None
        self._in_title = False
        self._json_ld: list[str] = []
        self._in_json_ld = False
        self._script_text = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key: value or "" for key, value in attrs}
        if data.get("id"):
            self.ids.append(data["id"])
        if tag == "nav" and data.get("id") == "site-nav":
            self._in_nav = True
        if tag == "a":
            self._anchor = {"href": data.get("href", ""), "text": "", **data}
            self.anchors.append(self._anchor)
            if self._in_nav:
                self.nav_links.append(self._anchor)
        if tag == "img":
            self.images.append(data)
        if tag == "link":
            self.links.append(data)
        if tag == "meta":
            self.meta.append(data)
        if tag == "title":
            self._in_title = True
        if tag == "script" and data.get("type") == "application/ld+json":
            self._in_json_ld = True
            self._script_text = ""

    def handle_endtag(self, tag: str) -> None:
        if tag == "a":
            self._anchor = None
        elif tag == "nav":
            self._in_nav = False
        elif tag == "title":
            self._in_title = False
        elif tag == "script" and self._in_json_ld:
            self._json_ld.append(self._script_text)
            self._in_json_ld = False

    def handle_data(self, data: str) -> None:
        self.text.append(data)
        if self._anchor is not None:
            self._anchor["text"] += data
        if self._in_title:
            self.title += data
        if self._in_json_ld:
            self._script_text += data


def parse_page(path: Path) -> PageParser:
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def resolve_local_path(page_path: Path, href: str) -> tuple[Path, str]:
    parsed = urlsplit(href)
    raw_path = unquote(parsed.path)
    if raw_path.startswith("/"):
        target = ROOT / raw_path.lstrip("/")
    elif raw_path:
        target = (page_path.parent / raw_path).resolve()
    else:
        target = page_path
    if target.is_dir() or (raw_path.endswith("/") and not target.suffix):
        target = target / "index.html"
    return target, unquote(parsed.fragment)


class PortfolioAcceptanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.pages = {
            "index.html": parse_page(ROOT / "index.html"),
            CASE_PATH: parse_page(ROOT / CASE_PATH) if (ROOT / CASE_PATH).exists() else None,
        }
        cls.css = (ROOT / "styles.css").read_text(encoding="utf-8")
        cls.js = (ROOT / "script.js").read_text(encoding="utf-8")

    def test_case_study_page_exists_with_one_h1(self) -> None:
        self.assertIsNotNone(self.pages[CASE_PATH], "Create projects/fraud-risk/index.html")
        page = self.pages[CASE_PATH]
        source = (ROOT / CASE_PATH).read_text(encoding="utf-8")
        self.assertEqual(len(re.findall(r"<h1\b", source, re.I)), 1)
        self.assertIn("IEEE-CIS Fraud Detection", page.title)

    def test_home_navigation_is_concise_and_about_preserves_content(self) -> None:
        home = self.pages["index.html"]
        labels = [" ".join(link["text"].split()) for link in home.nav_links]
        self.assertEqual(labels, ["Projects", "Research", "Experience", "About", "Contact"])
        for page_name in ("index.html", CASE_PATH):
            markup = (ROOT / page_name).read_text(encoding="utf-8")
            nav_start = markup.index('<nav id="site-nav"')
            nav_end = markup.index("</nav>", nav_start)
            nav_markup = markup[nav_start:nav_end]
            self.assertLess(nav_start, markup.index('id="menu-toggle"'))
            if page_name == CASE_PATH:
                self.assertNotIn('aria-current="page"', nav_markup)
        self.assertIn("id=\"about\"", (ROOT / "index.html").read_text(encoding="utf-8"))
        text = " ".join(home.text).lower()
        self.assertIn("education", text)
        self.assertIn("skills", text)

    def test_homepage_links_to_the_case_study_and_current_evaluation(self) -> None:
        home = self.pages["index.html"]
        hrefs = {anchor["href"] for anchor in home.anchors}
        self.assertIn("/projects/fraud-risk/", hrefs)
        self.assertTrue(any("current_evaluation.md" in href for href in hrefs))

    def test_secondary_project_cards_use_consistent_evidence_fields(self) -> None:
        source = (ROOT / "index.html").read_text(encoding="utf-8")
        cards = re.findall(r'<article class="project-card">(.*?)</article>', source, re.S)
        self.assertEqual(len(cards), 3)
        for card in cards:
            for field in ("Problem", "Method", "Results", "Professional relevance", "Tools"):
                self.assertIn(f"<dt>{field}</dt>", card)
            self.assertIn('class="project-evidence-label"', card)
        self.assertRegex(self.css, r"\.project-grid\{[^}]*align-items:start")
        self.assertIn("@media(max-width:1080px){.project-grid{grid-template-columns:1fr}}", self.css)

    def test_case_study_metadata_is_unique_and_canonical(self) -> None:
        page = self.pages[CASE_PATH]
        if page is None:
            self.skipTest("case-study page has not been implemented yet")
        canonical = next((link.get("href") for link in page.links if "canonical" in link.get("rel", "").split()), None)
        self.assertEqual(canonical, "https://atabak-nikouseresht.github.io/projects/fraud-risk/")
        self.assertTrue(page.title)
        self.assertNotEqual(page.title, self.pages["index.html"].title)
        home_description = next((meta.get("content", "") for meta in self.pages["index.html"].meta if meta.get("name") == "description"), "")
        case_description = next((meta.get("content", "") for meta in page.meta if meta.get("name") == "description"), "")
        self.assertTrue(80 <= len(home_description) <= 160)
        self.assertTrue(80 <= len(case_description) <= 160)
        self.assertNotEqual(home_description, case_description)
        self.assertNotIn(page.title, case_description)
        self.assertTrue(any(meta.get("property") == "og:url" and meta.get("content") == canonical for meta in page.meta))

    def test_case_study_covers_authoritative_metrics_and_limitations(self) -> None:
        page = self.pages[CASE_PATH]
        if page is None:
            self.skipTest("case-study page has not been implemented yet")
        text = " ".join(page.text)
        for claim in ("0.887546", "0.805437", "0.480197", "0.173031", "0.927242", "0.870558", "0.656369", "0.306390", "0.005008", "0.004580", "calibration-partition XGBoost ECE", "final-evaluation ECE", "feature timing", "label maturation", "entity-disjoint", "not a production"):
            self.assertIn(claim.lower(), text.lower(), f"Missing evidence or limitation: {claim}")

    def test_case_study_links_current_results_and_protocol(self) -> None:
        page = self.pages[CASE_PATH]
        if page is None:
            self.skipTest("case-study page has not been implemented yet")
        hrefs = " ".join(anchor["href"] for anchor in page.anchors)
        for evidence in ("ieee-fraud-detection-xgboost", "current_evaluation.json", "current_evaluation.md", "phase2-evaluation.md", "7148defa53109f6e47cc6993d6fbc4bd55d9c3ef"):
            self.assertIn(evidence, hrefs)

    def test_sitemap_lists_the_case_study(self) -> None:
        sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
        self.assertIn("https://atabak-nikouseresht.github.io/projects/fraud-risk/", sitemap)
        ET.fromstring(sitemap)

    def test_case_tables_override_homepage_column_sizing_and_explain_mobile_scroll(self) -> None:
        source = (ROOT / CASE_PATH).read_text(encoding="utf-8")
        self.assertIn(".case-table{table-layout:auto;", self.css)
        self.assertIn(".case-table-wide{min-width:760px}", self.css)
        self.assertIn('class="case-table-hint"', source)
        self.assertIn("aria-describedby=\"budget-table-hint\"", source)

    def test_app_preview_is_large_and_keyboard_enlargeable(self) -> None:
        home = self.pages["index.html"]
        images = [image for image in home.images if image.get("src", "").endswith("fraud-detection-streamlit-preview.webp")]
        self.assertEqual(len(images), 1)
        preview = images[0]
        self.assertTrue(preview.get("alt"))
        self.assertIsNotNone(
            re.search(r"\.app-preview\s*\{[^}]*width:\s*min\(100%,\s*420px\)", self.css),
            "App preview must display at up to 420px while remaining fluid",
        )
        source = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('class="project-app-layout"', source)
        self.assertIn(
            "@media(min-width:761px) and (max-width:1080px){.project-app-layout{display:grid",
            self.css,
        )
        self.assertTrue(any(
            anchor.get("href") == preview.get("src")
            and anchor.get("target") == "_blank"
            and "noopener" in anchor.get("rel", "").split()
            for anchor in home.anchors
        ), "Preview should link to its full-size image in a safe new tab")

    def test_important_review_chart_labels_are_at_least_12px(self) -> None:
        match = re.search(r"\.review-budget-row\s*\{([^}]*)\}", self.css)
        self.assertIsNotNone(match, "review-budget-row CSS rule is required")
        size = re.search(r"font-size:\s*(\d+)px", match.group(1))
        self.assertIsNotNone(size, "review-budget-row must declare a readable font size")
        self.assertGreaterEqual(int(size.group(1)), 12)

    def test_all_local_links_and_images_resolve_and_have_safe_names(self) -> None:
        for page_name, page in self.pages.items():
            if page is None:
                self.fail(f"Missing page {page_name}")
            self.assertEqual(len(page.ids), len(set(page.ids)), f"{page_name}: duplicate id")
            page_path = ROOT / page_name
            for anchor in page.anchors:
                href = anchor.get("href", "").strip()
                if anchor.get("target") == "_blank":
                    self.assertIn("noopener", anchor.get("rel", "").split(), f"{page_name}: unsafe new-tab link {href}")
                if not href or href.startswith(("https://", "http://", "mailto:", "tel:")):
                    continue
                target, fragment = resolve_local_path(page_path, href)
                self.assertTrue(target.is_file(), f"{page_name}: missing target for {href}")
                if fragment:
                    target_page = parse_page(target) if target.suffix.lower() in (".html", ".htm") else None
                    self.assertIsNotNone(target_page, f"{page_name}: fragment target is not HTML: {href}")
                    self.assertIn(fragment, target_page.ids, f"{page_name}: missing fragment target {href}")
            for image in page.images:
                self.assertIn("alt", image, f"{page_name}: image missing alt attribute")
                self.assertTrue(image.get("width", "").isdigit(), f"{page_name}: image width must reserve layout space")
                self.assertTrue(image.get("height", "").isdigit(), f"{page_name}: image height must reserve layout space")
                if not image.get("alt"):
                    self.assertEqual(image.get("aria-hidden"), "true", f"{page_name}: empty alt should be decorative")
                src = image.get("src", "")
                if src and not src.startswith(("https://", "http://", "data:")):
                    target, _ = resolve_local_path(page_path, src)
                    self.assertTrue(target.is_file(), f"{page_name}: missing image {src}")

    def test_structured_data_is_valid_json_for_each_page(self) -> None:
        expected = {"index.html": "Person", CASE_PATH: "TechArticle"}
        for page_name, page in self.pages.items():
            self.assertIsNotNone(page, f"Missing page {page_name}")
            structured = [json.loads(block) for block in page._json_ld]
            self.assertTrue(structured, f"{page_name}: missing structured data")
            self.assertEqual(structured[0].get("@type"), expected[page_name])

    def test_script_guards_cross_page_navigation_and_focuses_fragment_targets(self) -> None:
        self.assertIn("if (!href.startsWith('#')) return;", self.js)
        self.assertIn("document.querySelectorAll('a[href^=\"#\"]')", self.js)
        self.assertIn("window.location.hash", self.js)
        self.assertIn("getElementById", self.js)

    def test_reduced_motion_and_focus_styles_remain(self) -> None:
        self.assertIn(":focus-visible", self.css)
        self.assertIn("prefers-reduced-motion:reduce", self.css)


if __name__ == "__main__":
    unittest.main(verbosity=2)
