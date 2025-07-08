package handlers

import (
	"net/http"
	"strconv"

	"webcrawler/services"

	"github.com/gin-gonic/gin"
)

type CrawlHandler struct {
	crawlerService *services.CrawlerService
}

func NewCrawlHandler(crawlerService *services.CrawlerService) *CrawlHandler {
	return &CrawlHandler{
		crawlerService: crawlerService,
	}
}

type SubmitURLRequest struct {
	URL string `json:"url" binding:"required,url"`
}

type BulkOperationRequest struct {
	IDs []string `json:"ids" binding:"required"`
}

type StatsResponse struct {
	TotalCrawls     int64 `json:"totalCrawls"`
	CompletedCrawls int64 `json:"completedCrawls"`
	QueuedCrawls    int64 `json:"queuedCrawls"`
	RunningCrawls   int64 `json:"runningCrawls"`
	ErrorCrawls     int64 `json:"errorCrawls"`
}

// SubmitURL submits a new URL for crawling
func (h *CrawlHandler) SubmitURL(c *gin.Context) {
	var req SubmitURLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	crawlResult, err := h.crawlerService.SubmitURL(req.URL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit URL: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, crawlResult)
}

// GetAllCrawls retrieves all crawl results with pagination and filtering
func (h *CrawlHandler) GetAllCrawls(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	status := c.Query("status")
	search := c.Query("search")
	sortBy := c.DefaultQuery("sortBy", "createdAt")
	sortOrder := c.DefaultQuery("sortOrder", "desc")

	crawls, total, err := h.crawlerService.GetAllCrawls(page, limit, status, search, sortBy, sortOrder)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve crawls: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":       crawls,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}

// GetCrawlResult retrieves a specific crawl result by ID
func (h *CrawlHandler) GetCrawlResult(c *gin.Context) {
	id := c.Param("id")

	crawlResult, err := h.crawlerService.GetCrawlResult(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Crawl result not found"})
		return
	}

	c.JSON(http.StatusOK, crawlResult)
}

// DeleteCrawl deletes a crawl result
func (h *CrawlHandler) DeleteCrawl(c *gin.Context) {
	id := c.Param("id")

	err := h.crawlerService.DeleteCrawl(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete crawl: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Crawl deleted successfully"})
}

// StartCrawl starts crawling for a specific URL
func (h *CrawlHandler) StartCrawl(c *gin.Context) {
	id := c.Param("id")

	err := h.crawlerService.StartCrawl(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start crawl: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Crawl started successfully"})
}

// StopCrawl stops crawling for a specific URL
func (h *CrawlHandler) StopCrawl(c *gin.Context) {
	id := c.Param("id")

	err := h.crawlerService.StopCrawl(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stop crawl: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Crawl stopped successfully"})
}

// BulkDelete deletes multiple crawl results
func (h *CrawlHandler) BulkDelete(c *gin.Context) {
	var req BulkOperationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.crawlerService.BulkDelete(req.IDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete crawls: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Crawls deleted successfully"})
}

// BulkStart starts crawling for multiple URLs
func (h *CrawlHandler) BulkStart(c *gin.Context) {
	var req BulkOperationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.crawlerService.BulkStart(req.IDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start crawls: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Crawls started successfully"})
}

// GetStats returns crawling statistics
func (h *CrawlHandler) GetStats(c *gin.Context) {
	stats, err := h.crawlerService.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get stats: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
