.PHONY: help backend admin analytics frontend client all

help:
	@echo "Targets:"
	@echo "  backend      Run API            http://localhost:4000"
	@echo "  frontend     Run quiz client    http://localhost:3000"
	@echo "  admin        Run admin console  http://localhost:3001"
	@echo "  analytics    Run analytics      http://localhost:3003"
	@echo "  all          Run all four (parallel)"

backend:
	@echo "Backend → http://localhost:4000"
	cd backend && npm run dev

frontend: client
client:
	@echo "Client → http://localhost:3000"
	cd client && npm run dev

admin:
	@echo "Admin → http://localhost:3001"
	cd admin && npm run dev

analytics:
	@echo "Analytics → http://localhost:3003"
	cd analytics && npm run dev

all:
	$(MAKE) -j4 backend frontend admin analytics
