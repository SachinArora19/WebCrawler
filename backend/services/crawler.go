package services

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"webcrawler/models"

	"github.com/google/uuid"
	"golang.org/x/net/html"
	"gorm.io/gorm"
)

type CrawlerService struct {
	db                  *gorm.DB
	maxConcurrentCrawls int
	crawlTimeout        time.Duration
	maxDepth            int
	maxPagesPerDomain   int
	activeCrawls        map[string]bool
	mutex               sync.RWMutex
}

type CrawlData struct {
	Title              string
	HTMLVersion        string
	HeadingCounts      models.HeadingCounts
	InternalLinks      []string
	ExternalLinks      []string
	BrokenLinks        []models.BrokenLink
	HasLoginForm       bool
}

func NewCrawlerService(db *gorm.DB) *CrawlerService {
	return &CrawlerService{
		db:                  db,
		maxConcurrentCrawls: 5,
		crawlTimeout:        30 * time.Second,
		maxDepth:            3,
		maxPagesPerDomain:   100,
		activeCrawls:        make(map[string]bool),
	}
}

// SubmitURL creates a new crawl result entry
func (cs *CrawlerService) SubmitURL(targetURL string) (*models.CrawlResult, error) {
	crawlResult := &models.CrawlResult{
		ID:        uuid.New().String(),
		URL:       targetURL,
		Status:    models.StatusQueued,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := cs.db.Create(crawlResult).Error; err != nil {
		return nil, err
	}

	return crawlResult, nil
}

// GetAllCrawls retrieves crawl results with pagination and filtering
func (cs *CrawlerService) GetAllCrawls(page, limit int, status, search, sortBy, sortOrder string) ([]models.CrawlResult, int64, error) {
	var crawls []models.CrawlResult
	var total int64

	query := cs.db.Model(&models.CrawlResult{}).Preload("BrokenLinks")

	// Apply filters
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if search != "" {
		query = query.Where("url LIKE ? OR title LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Count total
	query.Count(&total)

	// Apply sorting
	if sortBy == "" {
		sortBy = "created_at"
	}
	if sortOrder == "" {
		sortOrder = "desc"
	}
	query = query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder))

	// Apply pagination
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&crawls).Error; err != nil {
		return nil, 0, err
	}

	return crawls, total, nil
}

// GetCrawlResult retrieves a specific crawl result
func (cs *CrawlerService) GetCrawlResult(id string) (*models.CrawlResult, error) {
	var crawlResult models.CrawlResult
	if err := cs.db.Preload("BrokenLinks").First(&crawlResult, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &crawlResult, nil
}

// DeleteCrawl deletes a crawl result
func (cs *CrawlerService) DeleteCrawl(id string) error {
	return cs.db.Delete(&models.CrawlResult{}, "id = ?", id).Error
}

// BulkDelete deletes multiple crawl results
func (cs *CrawlerService) BulkDelete(ids []string) error {
	return cs.db.Delete(&models.CrawlResult{}, "id IN ?", ids).Error
}

// BulkStart starts crawling for multiple URLs
func (cs *CrawlerService) BulkStart(ids []string) error {
	for _, id := range ids {
		if err := cs.StartCrawl(id); err != nil {
			log.Printf("Failed to start crawl for ID %s: %v", id, err)
		}
	}
	return nil
}

// GetStats returns crawling statistics
func (cs *CrawlerService) GetStats() (map[string]interface{}, error) {
	var stats struct {
		Total     int64
		Completed int64
		Queued    int64
		Running   int64
		Error     int64
	}

	cs.db.Model(&models.CrawlResult{}).Count(&stats.Total)
	cs.db.Model(&models.CrawlResult{}).Where("status = ?", models.StatusCompleted).Count(&stats.Completed)
	cs.db.Model(&models.CrawlResult{}).Where("status = ?", models.StatusQueued).Count(&stats.Queued)
	cs.db.Model(&models.CrawlResult{}).Where("status = ?", models.StatusRunning).Count(&stats.Running)
	cs.db.Model(&models.CrawlResult{}).Where("status = ?", models.StatusError).Count(&stats.Error)

	return map[string]interface{}{
		"totalCrawls":     stats.Total,
		"completedCrawls": stats.Completed,
		"queuedCrawls":    stats.Queued,
		"runningCrawls":   stats.Running,
		"errorCrawls":     stats.Error,
	}, nil
}

// StartCrawl starts the crawling process for a specific URL
func (cs *CrawlerService) StartCrawl(crawlResultID string) error {
	cs.mutex.Lock()
	if cs.activeCrawls[crawlResultID] {
		cs.mutex.Unlock()
		return fmt.Errorf("crawl already in progress for ID: %s", crawlResultID)
	}
	
	if len(cs.activeCrawls) >= cs.maxConcurrentCrawls {
		cs.mutex.Unlock()
		return fmt.Errorf("maximum concurrent crawls reached")
	}
	
	cs.activeCrawls[crawlResultID] = true
	cs.mutex.Unlock()

	// Start crawling in a goroutine
	go cs.performCrawl(crawlResultID)
	
	return nil
}

// StopCrawl stops the crawling process for a specific URL
func (cs *CrawlerService) StopCrawl(crawlResultID string) error {
	cs.mutex.Lock()
	defer cs.mutex.Unlock()
	
	delete(cs.activeCrawls, crawlResultID)
	
	// Update status to queued
	return cs.db.Model(&models.CrawlResult{}).Where("id = ?", crawlResultID).
		Update("status", models.StatusQueued).Error
}

func (cs *CrawlerService) performCrawl(crawlResultID string) {
	defer func() {
		cs.mutex.Lock()
		delete(cs.activeCrawls, crawlResultID)
		cs.mutex.Unlock()
	}()

	// Get crawl result from database
	var crawlResult models.CrawlResult
	if err := cs.db.First(&crawlResult, "id = ?", crawlResultID).Error; err != nil {
		log.Printf("Failed to find crawl result: %v", err)
		return
	}

	// Update status to running
	crawlResult.Status = models.StatusRunning
	cs.db.Save(&crawlResult)

	// Perform the actual crawling
	crawlData, err := cs.crawlURL(crawlResult.URL)
	if err != nil {
		log.Printf("Crawl failed for %s: %v", crawlResult.URL, err)
		
		// Update with error
		errMsg := err.Error()
		crawlResult.Status = models.StatusError
		crawlResult.ErrorMessage = &errMsg
		cs.db.Save(&crawlResult)
		return
	}

	// Update crawl result with data
	crawlResult.Title = crawlData.Title
	crawlResult.HTMLVersion = crawlData.HTMLVersion
	crawlResult.SetHeadingCounts(crawlData.HeadingCounts)
	crawlResult.InternalLinksCount = len(crawlData.InternalLinks)
	crawlResult.ExternalLinksCount = len(crawlData.ExternalLinks)
	crawlResult.BrokenLinksCount = len(crawlData.BrokenLinks)
	crawlResult.HasLoginForm = crawlData.HasLoginForm
	crawlResult.Status = models.StatusCompleted
	crawlResult.CrawledAt = time.Now()

	// Save the crawl result
	if err := cs.db.Save(&crawlResult).Error; err != nil {
		log.Printf("Failed to save crawl result: %v", err)
		return
	}

	// Save broken links
	for _, brokenLink := range crawlData.BrokenLinks {
		brokenLink.CrawlResultID = crawlResult.ID
		cs.db.Create(&brokenLink)
	}

	log.Printf("Crawl completed successfully for %s", crawlResult.URL)
}

func (cs *CrawlerService) crawlURL(targetURL string) (*CrawlData, error) {
	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: cs.crawlTimeout,
	}

	// Fetch the webpage
	resp, err := client.Get(targetURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch URL: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, resp.Status)
	}

	// Parse HTML
	doc, err := html.Parse(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %v", err)
	}

	crawlData := &CrawlData{
		HeadingCounts: models.HeadingCounts{},
		InternalLinks: []string{},
		ExternalLinks: []string{},
		BrokenLinks:   []models.BrokenLink{},
	}

	// Parse URL for domain comparison
	parsedURL, err := url.Parse(targetURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse target URL: %v", err)
	}

	// Extract data from HTML
	cs.extractHTMLData(doc, crawlData, parsedURL.Host, targetURL)

	// Check for broken links
	cs.checkBrokenLinks(crawlData, client)

	return crawlData, nil
}

func (cs *CrawlerService) extractHTMLData(n *html.Node, data *CrawlData, baseDomain string, baseURL string) {
	if n.Type == html.ElementNode {
		switch n.Data {
		case "html":
			// Check for HTML version in doctype or html tag
			for _, attr := range n.Attr {
				if attr.Key == "version" {
					data.HTMLVersion = "HTML " + attr.Val
				}
			}
			if data.HTMLVersion == "" {
				data.HTMLVersion = "HTML5" // Default assumption for modern pages
			}

		case "title":
			if n.FirstChild != nil {
				data.Title = strings.TrimSpace(n.FirstChild.Data)
			}

		case "h1":
			data.HeadingCounts.H1++
		case "h2":
			data.HeadingCounts.H2++
		case "h3":
			data.HeadingCounts.H3++
		case "h4":
			data.HeadingCounts.H4++
		case "h5":
			data.HeadingCounts.H5++
		case "h6":
			data.HeadingCounts.H6++

		case "a":
			for _, attr := range n.Attr {
				if attr.Key == "href" && attr.Val != "" {
					cs.categorizeLink(attr.Val, baseDomain, baseURL, data)
				}
			}

		case "form":
			// Check if this is a login form
			if cs.isLoginForm(n) {
				data.HasLoginForm = true
			}

		case "input":
			// Also check for password inputs as indicator of login form
			for _, attr := range n.Attr {
				if attr.Key == "type" && attr.Val == "password" {
					data.HasLoginForm = true
				}
			}
		}
	}

	// Recursively process child nodes
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		cs.extractHTMLData(c, data, baseDomain, baseURL)
	}
}

func (cs *CrawlerService) categorizeLink(href, baseDomain, baseURL string, data *CrawlData) {
	// Parse the link
	linkURL, err := url.Parse(href)
	if err != nil {
		return
	}

	// Make relative URLs absolute
	if linkURL.IsAbs() {
		if linkURL.Host == baseDomain {
			data.InternalLinks = append(data.InternalLinks, href)
		} else {
			data.ExternalLinks = append(data.ExternalLinks, href)
		}
	} else {
		// Resolve relative URL
		baseURLParsed, err := url.Parse(baseURL)
		if err != nil {
			return
		}
		resolvedURL := baseURLParsed.ResolveReference(linkURL)
		data.InternalLinks = append(data.InternalLinks, resolvedURL.String())
	}
}

func (cs *CrawlerService) isLoginForm(n *html.Node) bool {
	// Look for common login form indicators
	hasPasswordField := false
	hasUsernameField := false
	
	cs.checkLoginFormFields(n, &hasPasswordField, &hasUsernameField)
	
	return hasPasswordField && hasUsernameField
}

func (cs *CrawlerService) checkLoginFormFields(n *html.Node, hasPassword *bool, hasUsername *bool) {
	if n.Type == html.ElementNode && n.Data == "input" {
		inputType := ""
		inputName := ""
		inputId := ""
		
		for _, attr := range n.Attr {
			switch attr.Key {
			case "type":
				inputType = attr.Val
			case "name":
				inputName = strings.ToLower(attr.Val)
			case "id":
				inputId = strings.ToLower(attr.Val)
			}
		}
		
		if inputType == "password" {
			*hasPassword = true
		}
		
		if inputType == "text" || inputType == "email" {
			if strings.Contains(inputName, "user") || strings.Contains(inputName, "email") ||
			   strings.Contains(inputName, "login") || strings.Contains(inputId, "user") ||
			   strings.Contains(inputId, "email") || strings.Contains(inputId, "login") {
				*hasUsername = true
			}
		}
	}
	
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		cs.checkLoginFormFields(c, hasPassword, hasUsername)
	}
}

func (cs *CrawlerService) checkBrokenLinks(data *CrawlData, client *http.Client) {
	// Check a sample of links (to avoid too many requests)
	allLinks := append(data.InternalLinks, data.ExternalLinks...)
	
	// Limit to first 10 links to avoid overwhelming the server
	maxLinksToCheck := 10
	if len(allLinks) > maxLinksToCheck {
		allLinks = allLinks[:maxLinksToCheck]
	}
	
	for _, link := range allLinks {
		if cs.isLinkBroken(link, client) {
			// Get the status code
			resp, err := client.Head(link)
			statusCode := 0
			if err == nil {
				statusCode = resp.StatusCode
				resp.Body.Close()
			} else {
				statusCode = 0 // Connection error
			}
			
			data.BrokenLinks = append(data.BrokenLinks, models.BrokenLink{
				URL:        link,
				StatusCode: statusCode,
				Text:       "Link text", // In a real implementation, we'd extract the actual link text
			})
		}
	}
}

func (cs *CrawlerService) isLinkBroken(link string, client *http.Client) bool {
	// Quick HEAD request to check if link is accessible
	resp, err := client.Head(link)
	if err != nil {
		return true
	}
	defer resp.Body.Close()
	
	// Consider 4xx and 5xx as broken
	return resp.StatusCode >= 400
}

func (cs *CrawlerService) IsCrawlActive(crawlResultID string) bool {
	cs.mutex.RLock()
	defer cs.mutex.RUnlock()
	return cs.activeCrawls[crawlResultID]
}
