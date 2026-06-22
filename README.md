# ForsaTech - MERN Starter

## Structure

- `frontend` : React + Vite
- `backend` : Node.js + Express

## Installation

Toutes les dépendances ont déjà été installées.

## Demarrage en developpement

Depuis la racine `AIR` :

```bash
npm run dev
```

Cela lance :
- Frontend sur `http://localhost:5173`
- Backend sur `http://localhost:5000`

## Commandes utiles

```bash
npm run dev:frontend
npm run dev:backend
npm run build
npm start
```

## Service Python analyse-cv

Pour demarrer le service FastAPI sur `http://127.0.0.1:8001` :

```powershell
Set-Location e:\AIR\analyse-cv
& ".\.venv\Scripts\python.exe" -m uvicorn api:app --host 127.0.0.1 --port 8001 --
```reload

## Format standard des resultats modele

L'endpoint `POST /extract` renvoie maintenant une reponse structuree et stable :

```json
{
	"success": true,
	"model": "cv-extractor-spacy-v1",
	"timestamp": "2026-04-22T10:30:00Z",
	"input": {
		"file_name": "cv_john_doe.pdf",
		"translate": false,
		"target_lang": "en"
	},
	"results": {
		"translation": {
			"applied": false,
			"from": "fr",
			"to": "en"
		},
		"source_preview": "...",
		"entities": {
			"skills": ["Python", "React"],
			"email": ["john.doe@email.com"]
		},
		"model_metrics": {
			"accuracy": 0.98,
			"precision": 0.95,
			"recall": 0.94,
			"f1": 0.945
		},
		"total_entities": 12
	},
	"warnings": [],
	"errors": null
}
```

## Endpoint de test API

`GET http://localhost:5000/api/health`

## Git LFS

```bash
git lfs install
git pull origin main
git lfs pull
```
