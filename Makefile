# Web Crawler Application Makefile

.PHONY: help dev prod clean logs test build

# Default target
help:
	@echo "Available commands:"
	@echo "  dev          - Start development environment"
	@echo "  prod         - Start production environment"
	@echo "  build        - Build all Docker images"
	@echo "  clean        - Clean up containers and volumes"
	@echo "  logs         - Show logs from all services"
	@echo "  test         - Run tests"
	@echo "  db-only      - Start only database services"
	@echo "  frontend     - Start only frontend"
	@echo "  backend      - Start only backend"
	@echo "  migrate      - Run database migrations"
	@echo "  seed         - Seed database with sample data"

# Development environment
dev:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Services started:"
	@echo "  - MySQL Dev: localhost:3307"
	@echo "  - Redis Dev: localhost:6380"
	@echo "  - phpMyAdmin: http://localhost:8081"
	@echo "  - MailHog: http://localhost:8025"

# Production environment
prod:
	@echo "Starting production environment..."
	docker-compose up -d
	@echo "Services started:"
	@echo "  - Frontend: http://localhost:3000"
	@echo "  - Backend API: http://localhost:8080"
	@echo "  - MySQL: localhost:3306"

# Build all images
build:
	@echo "Building all Docker images..."
	docker-compose build --no-cache

# Clean up everything
clean:
	@echo "Stopping and removing all containers..."
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	@echo "Removing unused images..."
	docker image prune -f
	@echo "Removing unused volumes..."
	docker volume prune -f

# Show logs
logs:
	docker-compose logs -f

# Run tests
test:
	@echo "Running frontend tests..."
	npm test
	@echo "Running backend tests..."
	cd backend && go test ./...

# Database only
db-only:
	@echo "Starting database services only..."
	docker-compose -f docker-compose.dev.yml up -d mysql-dev redis-dev phpmyadmin

# Frontend development
frontend:
	@echo "Starting frontend development server..."
	npm run dev

# Backend development
backend:
	@echo "Starting backend development server..."
	cd backend && go run main.go

# Database migrations
migrate:
	@echo "Running database migrations..."
	cd backend && go run main.go -migrate

# Seed database
seed:
	@echo "Seeding database with sample data..."
	cd backend && go run main.go -seed

# Install dependencies
install:
	@echo "Installing frontend dependencies..."
	npm install
	@echo "Installing backend dependencies..."
	cd backend && go mod tidy

# Security scan
security:
	@echo "Running security audit..."
	npm audit
	cd backend && go list -json -m all | nancy sleuth

# Performance test
perf:
	@echo "Running performance tests..."
	# Add performance testing commands here

# Backup database
backup:
	@echo "Creating database backup..."
	docker exec webcrawler-mysql mysqldump -u root -prootpassword123 webcrawler > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Restore database
restore:
	@echo "Restoring database from backup..."
	@read -p "Enter backup file path: " backup_file; \
	docker exec -i webcrawler-mysql mysql -u root -prootpassword123 webcrawler < $$backup_file

# Docker health check
health:
	@echo "Checking service health..."
	docker-compose ps
	@echo "API Health:"
	curl -f http://localhost:8080/health || echo "API not healthy"
	@echo "Frontend Health:"
	curl -f http://localhost:3000/health || echo "Frontend not healthy"
