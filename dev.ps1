# Web Crawler Application - PowerShell Helper Script
param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "Web Crawler Application - Available Commands:" -ForegroundColor Green
    Write-Host ""
    Write-Host "  .\dev.ps1 dev          - Start development environment" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 prod         - Start production environment" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 build        - Build all Docker images" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 clean        - Clean up containers and volumes" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 logs         - Show logs from all services" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 test         - Run tests" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 db-only      - Start only database services" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 frontend     - Start only frontend" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 backend      - Start only backend" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 install      - Install all dependencies" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 health       - Check service health" -ForegroundColor Yellow
    Write-Host ""
}

function Start-DevEnvironment {
    Write-Host "Starting development environment..." -ForegroundColor Green
    docker-compose -f docker-compose.dev.yml up -d
    Write-Host ""
    Write-Host "Services started:" -ForegroundColor Green
    Write-Host "  - MySQL Dev: localhost:3307" -ForegroundColor Cyan
    Write-Host "  - Redis Dev: localhost:6380" -ForegroundColor Cyan
    Write-Host "  - phpMyAdmin: http://localhost:8081" -ForegroundColor Cyan
    Write-Host "  - MailHog: http://localhost:8025" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To start frontend: npm run dev" -ForegroundColor Yellow
    Write-Host "To start backend: cd backend && go run main.go" -ForegroundColor Yellow
}

function Start-ProdEnvironment {
    Write-Host "Starting production environment..." -ForegroundColor Green
    docker-compose up -d
    Write-Host ""
    Write-Host "Services started:" -ForegroundColor Green
    Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  - Backend API: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "  - MySQL: localhost:3306" -ForegroundColor Cyan
}

function Build-Images {
    Write-Host "Building all Docker images..." -ForegroundColor Green
    docker-compose build --no-cache
}

function Clean-Environment {
    Write-Host "Stopping and removing all containers..." -ForegroundColor Green
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
    Write-Host "Removing unused images..." -ForegroundColor Green
    docker image prune -f
    Write-Host "Removing unused volumes..." -ForegroundColor Green
    docker volume prune -f
}

function Show-Logs {
    docker-compose logs -f
}

function Run-Tests {
    Write-Host "Running frontend tests..." -ForegroundColor Green
    npm test
    Write-Host "Running backend tests..." -ForegroundColor Green
    Set-Location backend
    go test ./...
    Set-Location ..
}

function Start-DatabaseOnly {
    Write-Host "Starting database services only..." -ForegroundColor Green
    docker-compose -f docker-compose.dev.yml up -d mysql-dev redis-dev phpmyadmin
    Write-Host "Database services started:" -ForegroundColor Green
    Write-Host "  - MySQL Dev: localhost:3307" -ForegroundColor Cyan
    Write-Host "  - phpMyAdmin: http://localhost:8081" -ForegroundColor Cyan
    Write-Host "  - Redis Dev: localhost:6380" -ForegroundColor Cyan
}

function Start-Frontend {
    Write-Host "Starting frontend development server..." -ForegroundColor Green
    npm run dev
}

function Start-Backend {
    Write-Host "Starting backend development server..." -ForegroundColor Green
    Set-Location backend
    go run main.go
    Set-Location ..
}

function Install-Dependencies {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Green
    npm install
    Write-Host "Installing backend dependencies..." -ForegroundColor Green
    Set-Location backend
    go mod tidy
    Set-Location ..
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
}

function Check-Health {
    Write-Host "Checking service health..." -ForegroundColor Green
    docker-compose ps
    Write-Host ""
    Write-Host "API Health:" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 5
        Write-Host "✓ API is healthy" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ API not healthy" -ForegroundColor Red
    }
    
    Write-Host "Frontend Health:" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/" -TimeoutSec 5
        Write-Host "✓ Frontend is healthy" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Frontend not healthy" -ForegroundColor Red
    }
}

# Main command dispatcher
switch ($Command.ToLower()) {
    "help" { Show-Help }
    "dev" { Start-DevEnvironment }
    "prod" { Start-ProdEnvironment }
    "build" { Build-Images }
    "clean" { Clean-Environment }
    "logs" { Show-Logs }
    "test" { Run-Tests }
    "db-only" { Start-DatabaseOnly }
    "frontend" { Start-Frontend }
    "backend" { Start-Backend }
    "install" { Install-Dependencies }
    "health" { Check-Health }
    default { 
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Show-Help 
    }
}
