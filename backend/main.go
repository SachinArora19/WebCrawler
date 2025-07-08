package main

import (
	"log"

	"webcrawler/config"
	"webcrawler/handlers"
	"webcrawler/middleware"
	"webcrawler/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Load configuration and initialize database
	cfg := config.LoadConfig()

	// Initialize services
	crawlerService := services.NewCrawlerService(cfg.DB)
	authService := services.NewAuthService()

	// Initialize handlers
	crawlHandler := handlers.NewCrawlHandler(crawlerService)
	authHandler := handlers.NewAuthHandler(authService)

	// Setup Gin router
	router := gin.Default()

	// CORS configuration
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = cfg.AllowedOrigins
	corsConfig.AllowCredentials = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	
	router.Use(cors.New(corsConfig))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "Web Crawler API is running"})
	})

	// Auth routes
	auth := router.Group("/api/auth")
	{
		auth.POST("/login", authHandler.Login)
		auth.POST("/register", authHandler.Register)
	}

	// Protected API routes
	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// URL management
		api.POST("/urls", crawlHandler.SubmitURL)
		api.GET("/urls", crawlHandler.GetAllCrawls)
		api.GET("/urls/:id", crawlHandler.GetCrawlResult)
		api.DELETE("/urls/:id", crawlHandler.DeleteCrawl)

		// Crawl operations
		api.POST("/urls/:id/start", crawlHandler.StartCrawl)
		api.POST("/urls/:id/stop", crawlHandler.StopCrawl)

		// Bulk operations
		api.POST("/urls/bulk-delete", crawlHandler.BulkDelete)
		api.POST("/urls/bulk-start", crawlHandler.BulkStart)

		// Statistics
		api.GET("/stats", crawlHandler.GetStats)
	}

	// Get port from config
	port := cfg.Port

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
