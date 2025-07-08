@echo off
cd /d "c:\Users\Sachin.Arora\OneDrive - Vertex, Inc\Documents\WebCrawlerApp\backend"
echo Starting Go Web Crawler API...
echo.
echo Make sure MySQL is running with the database 'webcrawler' created
echo Default login: admin/password
echo.
go run main.go
pause
