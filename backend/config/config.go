package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"webcrawler/models"

	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Config struct {
	DB               *gorm.DB
	Port             string
	JWTSecret        string
	AllowedOrigins   []string
	MaxConcurrentCrawls int
	CrawlTimeout     int
	MaxDepth         int
	MaxPagesPerDomain int
}

func LoadConfig() *Config {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	config := &Config{
		Port:      getEnv("PORT", "8080"),
		JWTSecret: getEnv("JWT_SECRET", "default-secret-change-in-production"),
	}

	// Parse allowed origins
	origins := getEnv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
	config.AllowedOrigins = strings.Split(origins, ",")

	// Parse crawler configuration
	config.MaxConcurrentCrawls = getEnvAsInt("MAX_CONCURRENT_CRAWLS", 5)
	config.CrawlTimeout = getEnvAsInt("CRAWL_TIMEOUT", 30)
	config.MaxDepth = getEnvAsInt("MAX_DEPTH", 3)
	config.MaxPagesPerDomain = getEnvAsInt("MAX_PAGES_PER_DOMAIN", 100)

	// Initialize database
	config.initDB()

	return config
}

func (c *Config) initDB() {
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "3306")
	dbUser := getEnv("DB_USER", "root")
	dbPassword := getEnv("DB_PASSWORD", "password")
	dbName := getEnv("DB_NAME", "webcrawler")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPassword, dbHost, dbPort, dbName)

	var err error
	c.DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected successfully")

	// Auto migrate the models
	err = c.DB.AutoMigrate(&models.CrawlResult{}, &models.BrokenLink{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database migration completed")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}
