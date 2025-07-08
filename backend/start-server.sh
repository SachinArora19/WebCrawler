#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Go Web Crawler API..."
echo ""
echo "Make sure MySQL is running with the database 'webcrawler' created"
echo "Default login: admin/password"
echo ""
go run main.go
