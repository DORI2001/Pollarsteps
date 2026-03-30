BACKEND_DIR=backend_app
FRONTEND_DIR=frontend

install-backend:
	cd $(BACKEND_DIR) && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

install-frontend:
	cd $(FRONTEND_DIR) && npm install

dev-backend:
	cd $(BACKEND_DIR) && . .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd $(FRONTEND_DIR) && npm run dev -- --hostname 0.0.0.0 --port 3000

compose:
	docker compose up --build
