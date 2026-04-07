import os
import sys
import re
import html
import spacy
import argparse
from pathlib import Path

MODEL_PATH = (Path(__file__).resolve().parent / "model_trf" / "model-best").as_posix()
NLP_MAX_CHARS_DEFAULT = 12000

# ---------------------------------------------------------------------------
# Rule-based post-processing to complement the NER model
# ---------------------------------------------------------------------------

PHONE_RE = re.compile(r"(?<!\d)(\+?\d[\d\s\-\.]{6,14}\d)(?!\d)")
EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
LINKEDIN_RE = re.compile(r"(?:https?:/{1,2})?(?:www\.)?linkedin\.com/in/[\w\-]+", re.I)
GITHUB_RE = re.compile(r"(?:https?:/{1,2})?(?:www\.)?github\.com/[\w\-]+", re.I)
YEAR_RANGE_RE = re.compile(r"(\d{2}/\d{4})\s*[–—-]\s*(\d{2}/\d{4})")
GRAD_YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")
CERTIFICATE_START_RE = re.compile(
    r"^(?:certificat(?:e)?|attestation)(?:\s+of|\s+de|\s+d'|\s+en)?\b",
    re.I,
)

SECTION_HEADERS = {
    "profile",
    "professional experience",
    "experiences professionnelles",
    "skills",
    "compétences",
    "competences",
    "projects",
    "education",
    "formation",
    "certificates",
    "certificats",
    "interests",
    "loisirs",
    "awards",
    "prix",
    "languages",
    "langage",
    "langages",
    "coordonnées",
    "coordonnees",
}

KNOWN_LOCATIONS = [
    "Tunisia", "Tunisie", "Monastir", "Mahdia", "Sousse", "Tunis", "Sfax",
    "Skanes", "Nabeul", "Bizerte", "Gabès", "Kairouan", "Bengaluru",
    "Bangalore", "Hyderabad", "Chennai", "Pune", "Mumbai", "New Delhi",
    "Delhi", "Kolkata", "Paris", "Lyon", "France", "India",
]

KNOWN_DESIGNATIONS = [
    "Desktop Developer", "Software Engineer", "Data Scientist",
    "Data Analyst", "Machine Learning Engineer", "DevOps Engineer",
    "Backend Developer", "Full Stack Developer", "Frontend Developer",
    "Full Stack Web Developer", "Full Stack & Data Science",
    "Mobile Developer", "QA Engineer", "System Administrator",
    "Project Manager", "Intern", "Trainee", "Consultant",
]


def normalize_url(url):
    url = url.strip().rstrip(".,;)")
    if url.lower().startswith("https:/") and not url.lower().startswith("https://"):
        return "https://" + url[len("https:/"):].lstrip("/")
    if url.lower().startswith("http:/") and not url.lower().startswith("http://"):
        return "http://" + url[len("http:/"):].lstrip("/")
    if not re.match(r"^https?://", url, re.I):
        return "https://" + url.lstrip("/")
    return url


def extract_certificates(text):
    lines = [line.strip() for line in text.splitlines()]
    certificates = []
    current = []

    for line in lines:
        if not line:
            if current:
                certificates.append(" ".join(current))
                current = []
            continue

        lowered = line.lower()
        if lowered in SECTION_HEADERS:
            if current:
                certificates.append(" ".join(current))
                current = []
            continue

        if CERTIFICATE_START_RE.match(line):
            if current:
                certificates.append(" ".join(current))
            current = [line]
            continue

        if current:
            current.append(line)

    if current:
        certificates.append(" ".join(current))

    return certificates


def rule_based_extras(text, existing_ents):
    """Return list of (text, label) that the NER model missed."""
    existing_texts = {e.text.strip().lower() for e in existing_ents}
    existing_labels = {}
    for e in existing_ents:
        existing_labels.setdefault(e.label_, set()).add(e.text.strip().lower())

    extras = []

    # Phone numbers
    for m in PHONE_RE.finditer(text):
        phone = m.group(1).strip()
        if phone.lower() not in existing_texts and len(phone) >= 8:
            extras.append((phone, "Phone Number"))

    # Emails the model missed
    for m in EMAIL_RE.finditer(text):
        if m.group().lower() not in existing_labels.get("Email Address", set()):
            extras.append((m.group(), "Email Address"))

    # LinkedIn
    for m in LINKEDIN_RE.finditer(text):
        extras.append((normalize_url(m.group()), "LinkedIn"))

    # GitHub
    for m in GITHUB_RE.finditer(text):
        extras.append((normalize_url(m.group()), "GitHub"))

    # Locations
    for loc in KNOWN_LOCATIONS:
        pattern = re.compile(r"\b" + re.escape(loc) + r"\b", re.I)
        if pattern.search(text) and loc.lower() not in existing_labels.get("Location", set()):
            extras.append((loc, "Location"))

    # Designations the model missed
    for des in KNOWN_DESIGNATIONS:
        pattern = re.compile(r"\b" + re.escape(des) + r"\b", re.I)
        if pattern.search(text) and des.lower() not in existing_labels.get("Designation", set()):
            extras.append((des, "Designation"))

    # Companies: lines right after date ranges (common CV pattern)
    # Only keep short, capitalized company-like names
    lines = text.split("\n")
    for i, line in enumerate(lines):
        if YEAR_RANGE_RE.search(line) and i + 1 < len(lines):
            candidate = lines[i + 1].strip()
            if (2 < len(candidate) < 40
                    and not YEAR_RANGE_RE.search(candidate)
                    and candidate.lower() not in existing_labels.get("Companies worked at", set())
                    and candidate.lower() not in existing_labels.get("Designation", set())
                    and not any(d.lower() == candidate.lower() for d in KNOWN_DESIGNATIONS)
                    # Filter out descriptions / sentences
                    and " " not in candidate or candidate[0].isupper()
                    and not any(w in candidate.lower() for w in [
                        "project", "page", "design", "module", "interface",
                        "chatbot", "application", "website", "dashboard",
                        "admin", "responsive", "landing", "portfolio",
                        "smart", "manage", "features", "rebuilt",
                    ])):
                extras.append((candidate, "Companies worked at"))

    # Certificates
    for cert in extract_certificates(text):
        if len(cert) >= 10 and cert.lower() not in existing_texts:
            extras.append((cert, "Certificate"))

    # Deduplicate
    seen = set()
    unique = []
    for txt, lbl in extras:
        key = (txt.lower(), lbl)
        if key not in seen:
            seen.add(key)
            unique.append((txt, lbl))
    return unique


def clean_entity(text):
    """Clean up an entity text."""
    return text.strip().strip(",;:.").strip()


def read_with_tika(cv_path):
    """Extract text with Apache Tika from PDF/Word/PPT/Excel and others."""
    from tika import parser

    parsed = parser.from_file(cv_path)
    content = (parsed or {}).get("content") or ""
    return content.strip()


def read_plain_text(cv_path):
    with open(cv_path, "r", encoding="utf-8") as f:
        return f.read()


def html_to_text(raw_html):
    text = raw_html or ""
    # Remove non-content blocks that bloat transformer input.
    text = re.sub(r"(?is)<(script|style|noscript).*?>.*?</\\1>", " ", text)
    text = re.sub(r"(?is)<!--.*?-->", " ", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_max_chars_from_env():
    raw = str(os.getenv("CV_NLP_MAX_CHARS", NLP_MAX_CHARS_DEFAULT)).strip()
    try:
        value = int(raw)
    except Exception:
        return NLP_MAX_CHARS_DEFAULT
    return max(2000, min(60000, value))


def prepare_text_for_nlp(text, max_chars=None):
    normalized = re.sub(r"\s+", " ", str(text or "")).strip()
    if not normalized:
        return "", "empty"

    limit = max_chars if isinstance(max_chars, int) and max_chars > 0 else parse_max_chars_from_env()
    if len(normalized) <= limit:
        return normalized, "none"

    # Cut on a word boundary to reduce noisy partial tokens.
    cut = normalized.rfind(" ", 0, limit)
    if cut < int(limit * 0.7):
        cut = limit
    clipped = normalized[:cut].strip()
    return clipped, f"truncated_to_{len(clipped)}_chars"


def read_file(cv_path):
    lower = cv_path.lower()
    if lower.endswith((".html", ".htm")):
        return html_to_text(read_plain_text(cv_path))

    # Use Tika for rich formats (pdf/docx/pptx/xlsx/etc.).
    if lower.endswith((
        ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".odt", ".rtf"
    )):
        return read_with_tika(cv_path)
    return read_plain_text(cv_path)


def translate_text_if_needed(text, enabled, target_lang="en"):
    """Translate text before inference when enabled. Returns (text, info)."""
    if not enabled:
        return text, "translation disabled"

    try:
        from googletrans import Translator
    except Exception as exc:
        return text, f"translation unavailable ({exc})"

    try:
        translator = Translator()
        detected = translator.detect(text)
        src_lang = getattr(detected, "lang", "unknown")
        if src_lang == target_lang:
            return text, f"already {target_lang}"
        translated = translator.translate(text, src=src_lang, dest=target_lang)
        translated_text = getattr(translated, "text", "") or text
        return translated_text, f"translated {src_lang} -> {target_lang}"
    except Exception as exc:
        return text, f"translation failed ({exc})"


def extract_entities(cv_path, translate=False, target_lang="en"):
    source_text = read_file(cv_path)
    nlp_text, translation_info = translate_text_if_needed(source_text, translate, target_lang)
    nlp_text, trim_info = prepare_text_for_nlp(nlp_text)

    nlp = spacy.load(MODEL_PATH)
    doc = nlp(nlp_text)

    # Collect NER entities
    all_entities = []
    for ent in doc.ents:
        cleaned = clean_entity(ent.text)
        if len(cleaned) >= 2:
            all_entities.append((cleaned, ent.label_))

    # Add rule-based extras on translated and original text to avoid missing URLs/phones.
    extras = rule_based_extras(nlp_text, doc.ents)
    extras.extend(rule_based_extras(source_text, doc.ents))
    all_entities.extend(extras)

    print(f"\n{'='*60}")
    print(f" Entités extraites du CV : {cv_path}")
    print(f" Prétraitement texte : {translation_info}")
    print(f" Taille texte NLP : {trim_info}")
    print(f"{'='*60}\n")

    if not all_entities:
        print("Aucune entité détectée.")
        return

    for txt, lbl in all_entities:
        print(f"  [{lbl:25s}]  {txt}")

    # Summary grouped by label
    print(f"\n{'='*60}")
    print(f" Résumé")
    print(f"{'='*60}")
    labels = {}
    for txt, lbl in all_entities:
        labels.setdefault(lbl, []).append(txt)

    # Deduplicate per label
    for label in labels:
        seen = set()
        unique = []
        for v in labels[label]:
            key = v.strip().lower()
            if key not in seen:
                seen.add(key)
                unique.append(v)
        labels[label] = unique

    for label, values in labels.items():
        print(f"\n  {label}:")
        for v in values:
            print(f"    - {v}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Extraction d'entités CV avec spaCy + Tika + traduction optionnelle"
    )
    parser.add_argument("cv_path", help="Chemin du CV (txt/pdf/docx/pptx/xlsx/...) ")
    parser.add_argument(
        "--translate",
        action="store_true",
        help="Traduire le texte avant l'inférence (googletrans)",
    )
    parser.add_argument(
        "--target-lang",
        default="en",
        help="Langue cible pour la traduction (défaut: en)",
    )
    args = parser.parse_args()

    if not args.cv_path:
        print("Usage: python test_cv.py <chemin_vers_cv> [--translate] [--target-lang en]")
        sys.exit(1)
    extract_entities(args.cv_path, translate=args.translate, target_lang=args.target_lang)
