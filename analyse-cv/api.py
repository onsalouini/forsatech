import os
import tempfile
from pathlib import Path
import spacy
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from test_cv import clean_entity, prepare_text_for_nlp, read_file, rule_based_extras, translate_text_if_needed

app = FastAPI(title="CV Extractor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_nlp = None
_MODEL_DIR = (Path(__file__).resolve().parent / "model_trf" / "model-best").as_posix()


def get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load(_MODEL_DIR)
    return _nlp


@app.get("/")
def root():
    return {"message": "CV Extractor API — POST /extract pour extraire les entités"}


@app.post("/extract")
async def extract(
    file: UploadFile = File(...),
    translate: bool = Form(False),
    target_lang: str = Form("en"),
):
    suffix = os.path.splitext(file.filename or "file.txt")[1] or ".txt"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        source_text = read_file(tmp_path)
        if not source_text.strip():
            raise HTTPException(
                status_code=400, detail="Aucun texte extrait du fichier."
            )

        nlp_text, translation_info = translate_text_if_needed(
            source_text, translate, target_lang
        )
        nlp_text, trim_info = prepare_text_for_nlp(nlp_text)
        if not nlp_text:
            raise HTTPException(status_code=400, detail="Texte exploitable vide après prétraitement.")

        nlp = get_nlp()
        doc = nlp(nlp_text)

        all_entities: list[dict] = []
        for ent in doc.ents:
            cleaned = clean_entity(ent.text)
            if len(cleaned) >= 2:
                all_entities.append({"text": cleaned, "label": ent.label_})

        for txt, lbl in rule_based_extras(nlp_text, doc.ents):
            all_entities.append({"text": txt, "label": lbl})

        # Run rule-based again on raw source to catch URLs/phones lost in translation
        if translate:
            for txt, lbl in rule_based_extras(source_text, doc.ents):
                all_entities.append({"text": txt, "label": lbl})

        seen: set = set()
        unique: list[dict] = []
        for e in all_entities:
            k = (e["text"].strip().lower(), e["label"])
            if k not in seen:
                seen.add(k)
                unique.append(e)

        grouped: dict[str, list[str]] = {}
        for e in unique:
            grouped.setdefault(e["label"], []).append(e["text"])

        return {
            "status": "ok",
            "translation": translation_info,
            "nlp_trim": trim_info,
            "source_preview": source_text[:700],
            "entities": grouped,
        }

    except HTTPException:
        raise
    except RuntimeError as exc:
        msg = str(exc)
        low = msg.lower()
        if "not enough memory" in low or "alloc_cpu" in low or "out of memory" in low:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Mémoire insuffisante pendant l'analyse du CV. "
                    "Réessayez avec un CV plus court/texte nettoyé ou augmentez la RAM disponible."
                ),
            )
        raise HTTPException(status_code=500, detail=msg)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        os.unlink(tmp_path)
