# Development Setup Guide

## Prerequisites
1. **Node.js 18+** - For the React frontend
2. **Go 1.21+** - For the backend API
3. **MySQL 8.0+** - For the database
4. **Git** - For version control

## Quick Start (Development)

### 1. Database Setup
```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE webcrawler;

-- Create user (optional)
CREATE USER 'webcrawler'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON webcrawler.* TO 'webcrawler'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Go dependencies
go mod tidy

# Copy environment file
copy .env.example .env

# Edit .env with your database credentials
# Start the server
go run main.go
```

Backend will start on http://localhost:8080

### 3. Frontend Setup
```bash
# In the root directory
npm install

# Copy environment file
copy .env.example .env

# Start development server
npm run dev
```

Frontend will start on http://localhost:5173

### 4. Login
Use these credentials to test:
- Username: `admin`
- Password: `password`

## Using Docker (Production)

### Option 1: Full Stack with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Individual Docker Containers

#### Database
```bash
docker run -d \
  --name webcrawler-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=webcrawler \
  -p 3306:3306 \
  mysql:8.0
```

#### Backend
```bash
cd backend
docker build -t webcrawler-api .
docker run -d \
  --name webcrawler-api \
  --link webcrawler-mysql:mysql \
  -p 8080:8080 \
  webcrawler-api
```

#### Frontend
```bash
docker build -f Dockerfile.frontend -t webcrawler-frontend .
docker run -d \
  --name webcrawler-frontend \
  -p 3000:80 \
  webcrawler-frontend
```

## Testing the Application

### 1. Submit a URL
- Navigate to http://localhost:5173
- Login with admin/password
- Enter a URL (e.g., https://example.com)
- Click "Submit URL"

### 2. Start Crawling
- Click the "Start" button next to your submitted URL
- Watch the status change to "Running" then "Completed"

### 3. View Results
- Click "View Details" to see the crawl analysis
- Check the broken links, heading counts, etc.

## API Testing

You can also test the API directly:

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### Submit URL (with token)
```bash
curl -X POST http://localhost:8080/api/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"url":"https://example.com"}'
```

### Get All URLs
```bash
curl -X GET http://localhost:8080/api/urls \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Common Issues

1. **Database connection error**
   - Make sure MySQL is running
   - Check credentials in .env file
   - Ensure database exists

2. **CORS errors**
   - Check ALLOWED_ORIGINS in backend .env
   - Verify frontend API URL configuration

3. **Port conflicts**
   - Change ports in .env files if needed
   - Make sure ports are not in use

4. **Authentication issues**
   - Clear browser storage
   - Check JWT secret configuration

### Logs

**Backend logs:**
```bash
# If running with go run
# Logs appear in terminal

# If running with Docker
docker logs webcrawler-api
```

**Frontend logs:**
```bash
# Development server logs in terminal
# Browser console for runtime errors
```

## Development Tips

1. **Hot Reload**: Both frontend (Vite) and backend (with air) support hot reload
2. **API Documentation**: Visit http://localhost:8080/health for API status
3. **Database Inspection**: Use MySQL Workbench or phpMyAdmin
4. **React DevTools**: Install React Developer Tools browser extension

## Production Deployment

For production deployment, see the main README.md file for detailed instructions on:
- Environment variable configuration
- Security considerations
- Performance optimization
- Monitoring and logging
