# Deployment Guide - Web Crawler Application

## Overview
This guide covers deploying the Web Crawler application in various environments including development, staging, and production.

## Prerequisites

### System Requirements
- **Docker** 20.10+ and Docker Compose 2.0+
- **Node.js** 18+ (for local development)
- **Go** 1.21+ (for local development)
- **MySQL** 8.0+ (or use Docker container)
- **Git** for version control

### Hardware Requirements
- **Minimum**: 2 CPU cores, 4GB RAM, 20GB storage
- **Recommended**: 4 CPU cores, 8GB RAM, 50GB SSD storage
- **Production**: 8+ CPU cores, 16GB+ RAM, 100GB+ SSD storage

## Quick Start

### 1. Development Environment

```powershell
# Windows users
.\dev.ps1 install    # Install dependencies
.\dev.ps1 dev        # Start development services
.\dev.ps1 frontend   # Start frontend (separate terminal)
.\dev.ps1 backend    # Start backend (separate terminal)
```

```bash
# Linux/Mac users
make install         # Install dependencies
make dev            # Start development services
make frontend       # Start frontend (separate terminal)
make backend        # Start backend (separate terminal)
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Database: localhost:3307
- phpMyAdmin: http://localhost:8081

### 2. Production Environment

```bash
# Clone repository
git clone <repository-url>
cd WebCrawlerApp

# Start production stack
docker-compose up -d

# Check health
docker-compose ps
```

**Access Points:**
- Application: http://localhost:3000
- API: http://localhost:8080
- Database: localhost:3306

## Environment Configuration

### Environment Variables

#### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:8080/api
VITE_ENABLE_DEV_TOOLS=false
VITE_USE_MOCK_DATA=false
```

#### Backend (.env)
```bash
# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_USER=webcrawler
DB_PASSWORD=your_secure_password
DB_NAME=webcrawler

# Server Configuration
PORT=8080
GIN_MODE=release

# Security
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Performance
MAX_CONCURRENT_CRAWLS=10
CRAWL_TIMEOUT=60
```

## Deployment Scenarios

### Scenario 1: Docker Compose (Recommended)

**Advantages:**
- Easy setup and management
- Consistent environment
- Built-in networking
- Volume persistence

**Steps:**
1. Clone repository
2. Configure environment variables
3. Run `docker-compose up -d`
4. Configure reverse proxy (if needed)

### Scenario 2: Kubernetes

**For larger scale deployments:**

```yaml
# Example Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webcrawler-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: webcrawler-api
  template:
    metadata:
      labels:
        app: webcrawler-api
    spec:
      containers:
      - name: webcrawler-api
        image: webcrawler-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          value: "mysql-service"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: webcrawler-secrets
              key: jwt-secret
```

### Scenario 3: Cloud Deployment

#### AWS ECS/Fargate
- Use provided Dockerfiles
- Configure RDS for MySQL
- Use Application Load Balancer
- Store secrets in AWS Secrets Manager

#### Google Cloud Run
- Build and push to Container Registry
- Deploy frontend to Cloud Storage + CDN
- Use Cloud SQL for MySQL
- Configure IAM and secrets

#### Azure Container Instances
- Use Azure Container Registry
- Deploy to Container Instances
- Use Azure Database for MySQL
- Configure Application Gateway

## Database Setup

### MySQL Configuration

#### Production Settings
```sql
-- Performance tuning for production
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
SET GLOBAL innodb_log_file_size = 268435456;     -- 256MB
SET GLOBAL max_connections = 200;
SET GLOBAL query_cache_size = 67108864;          -- 64MB
```

#### Backup Strategy
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec webcrawler-mysql mysqldump \
  -u root -p$MYSQL_ROOT_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  webcrawler > backup_$DATE.sql

# Upload to cloud storage
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
```

#### Monitoring Queries
```sql
-- Check database size
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'webcrawler'
GROUP BY table_schema;

-- Check crawl statistics
SELECT 
  status,
  COUNT(*) as count,
  AVG(TIMESTAMPDIFF(SECOND, created_at, crawled_at)) as avg_duration_seconds
FROM crawl_results 
WHERE crawled_at IS NOT NULL
GROUP BY status;
```

## Security Configuration

### SSL/TLS Setup

#### Nginx with Let's Encrypt
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Firewall Configuration
```bash
# UFW firewall rules
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3306/tcp  # Block direct database access
ufw deny 8080/tcp  # Block direct API access
ufw enable
```

## Monitoring and Logging

### Prometheus + Grafana Setup
```yaml
# Add to docker-compose.yml
  grafana:
    image: grafana/grafana:latest
    container_name: webcrawler-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
```

### Application Logs
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Log rotation
echo '{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}' > /etc/docker/daemon.json
```

## Performance Optimization

### Backend Optimization
- Enable Go build optimizations
- Use connection pooling for database
- Implement caching with Redis
- Configure proper timeouts

### Frontend Optimization
- Enable gzip compression
- Use CDN for static assets
- Implement code splitting
- Optimize bundle size

### Database Optimization
- Create proper indexes
- Configure query cache
- Use read replicas for scale
- Implement connection pooling

## Backup and Recovery

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
docker exec webcrawler-mysql mysqldump \
  -u root -p$MYSQL_ROOT_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  webcrawler > $BACKUP_DIR/webcrawler_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/webcrawler_$DATE.sql

# Remove old backups
find $BACKUP_DIR -name "webcrawler_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Upload to cloud (optional)
# aws s3 cp $BACKUP_DIR/webcrawler_$DATE.sql.gz s3://your-backup-bucket/
```

### Recovery Process
```bash
# Stop application
docker-compose down

# Restore database
gunzip -c backup_file.sql.gz | docker exec -i webcrawler-mysql mysql -u root -p$MYSQL_ROOT_PASSWORD webcrawler

# Start application
docker-compose up -d
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check MySQL status
docker-compose logs mysql

# Test connection
docker exec -it webcrawler-mysql mysql -u root -p

# Check network connectivity
docker network ls
docker network inspect webcrawler_default
```

#### 2. Frontend Build Failures
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check build logs
npm run build
```

#### 3. API Authentication Issues
```bash
# Check JWT secret configuration
echo $JWT_SECRET

# Verify token generation
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

#### 4. Performance Issues
```bash
# Check resource usage
docker stats

# Check database performance
docker exec -it webcrawler-mysql mysql -u root -p -e "SHOW PROCESSLIST;"

# Check application logs
docker-compose logs backend | grep -i error
```

### Health Checks
```bash
# API health
curl -f http://localhost:8080/health

# Database health
docker exec webcrawler-mysql mysqladmin ping -h localhost -u root -p

# Frontend health
curl -f http://localhost:3000/
```

## Maintenance

### Regular Tasks
1. **Daily**: Check application logs and health
2. **Weekly**: Database backup verification
3. **Monthly**: Security updates and dependency updates
4. **Quarterly**: Performance review and optimization

### Update Process
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# Verify deployment
./dev.ps1 health  # or make health
```

This deployment guide provides comprehensive instructions for setting up the Web Crawler application in various environments with proper security, monitoring, and maintenance procedures.
