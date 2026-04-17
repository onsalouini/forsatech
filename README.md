# AIR - MERN Starter

## Structure

- `frontend` : React + Vite
- `backend` : Node.js + Express

## Installation

Toutes les dépendances ont déjà été installées.

## Démarrage en développement

Depuis la racine `AIR` :

```bash
npm run dev
```

Cela lance :
- Frontend sur `http://localhost:5173`
- Backend sur `http://localhost:5000`

## Commandes utiles

```bash
pour active notre model il faut mettre cette commande 
"Set-Location e:\AIR\analyse-cv; .\.venv\Scripts\python.exe -m uvicorn api:app --host 127.0.0.1 --port 8001"
npm run dev:frontend
npm run dev:backend
npm run build
npm start
```

## Endpoint de test API

`GET http://localhost:5000/api/health`

## Service Python analyse-cv

Pour démarrer le service d'analyse CV (FastAPI) sur `http://127.0.0.1:8001` :

```powershell
& "e:\AIR\analyse-cv\.venv\Scripts\python.exe" -m uvicorn api:app --app-dir "e:\AIR\analyse-cv" --host 127.0.0.1 --port 8001 --reload
```
git lfs install
git pull origin main
git lfs pull