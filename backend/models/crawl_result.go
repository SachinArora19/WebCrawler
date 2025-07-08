package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CrawlStatus string

const (
	StatusQueued    CrawlStatus = "queued"
	StatusRunning   CrawlStatus = "running"
	StatusCompleted CrawlStatus = "completed"
	StatusError     CrawlStatus = "error"
)

type CrawlResult struct {
	ID                  string         `json:"id" gorm:"primaryKey"`
	URL                 string         `json:"url" gorm:"not null;index"`
	Title               string         `json:"title"`
	HTMLVersion         string         `json:"htmlVersion"`
	H1Count             int            `json:"-" gorm:"column:h1_count"`
	H2Count             int            `json:"-" gorm:"column:h2_count"`
	H3Count             int            `json:"-" gorm:"column:h3_count"`
	H4Count             int            `json:"-" gorm:"column:h4_count"`
	H5Count             int            `json:"-" gorm:"column:h5_count"`
	H6Count             int            `json:"-" gorm:"column:h6_count"`
	InternalLinksCount  int            `json:"internalLinksCount"`
	ExternalLinksCount  int            `json:"externalLinksCount"`
	BrokenLinksCount    int            `json:"brokenLinksCount"`
	HasLoginForm        bool           `json:"hasLoginForm"`
	Status              CrawlStatus    `json:"status" gorm:"default:'queued'"`
	ErrorMessage        *string        `json:"errorMessage,omitempty"`
	CrawledAt           time.Time      `json:"crawledAt"`
	CreatedAt           time.Time      `json:"-"`
	UpdatedAt           time.Time      `json:"-"`
	DeletedAt           gorm.DeletedAt `json:"-" gorm:"index"`
	BrokenLinks         []BrokenLink   `json:"brokenLinks" gorm:"foreignKey:CrawlResultID"`
}

type BrokenLink struct {
	ID             uint   `json:"-" gorm:"primaryKey"`
	CrawlResultID  string `json:"-" gorm:"not null;index"`
	URL            string `json:"url" gorm:"not null"`
	StatusCode     int    `json:"statusCode"`
	Text           string `json:"text"`
	CreatedAt      time.Time      `json:"-"`
}

type HeadingCounts struct {
	H1 int `json:"h1"`
	H2 int `json:"h2"`
	H3 int `json:"h3"`
	H4 int `json:"h4"`
	H5 int `json:"h5"`
	H6 int `json:"h6"`
}

type CrawlResultResponse struct {
	ID                  string        `json:"id"`
	URL                 string        `json:"url"`
	Title               string        `json:"title"`
	HTMLVersion         string        `json:"htmlVersion"`
	HeadingCounts       HeadingCounts `json:"headingCounts"`
	InternalLinksCount  int           `json:"internalLinksCount"`
	ExternalLinksCount  int           `json:"externalLinksCount"`
	BrokenLinksCount    int           `json:"brokenLinksCount"`
	HasLoginForm        bool          `json:"hasLoginForm"`
	Status              CrawlStatus   `json:"status"`
	ErrorMessage        *string       `json:"errorMessage,omitempty"`
	CrawledAt           time.Time     `json:"crawledAt"`
	BrokenLinks         []BrokenLink  `json:"brokenLinks"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (cr *CrawlResult) BeforeCreate(tx *gorm.DB) error {
	if cr.ID == "" {
		cr.ID = uuid.New().String()
	}
	if cr.CrawledAt.IsZero() {
		cr.CrawledAt = time.Now()
	}
	return nil
}

// GetHeadingCounts returns the heading counts as a structured object
func (cr *CrawlResult) GetHeadingCounts() HeadingCounts {
	return HeadingCounts{
		H1: cr.H1Count,
		H2: cr.H2Count,
		H3: cr.H3Count,
		H4: cr.H4Count,
		H5: cr.H5Count,
		H6: cr.H6Count,
	}
}

// SetHeadingCounts sets the heading counts from a structured object
func (cr *CrawlResult) SetHeadingCounts(counts HeadingCounts) {
	cr.H1Count = counts.H1
	cr.H2Count = counts.H2
	cr.H3Count = counts.H3
	cr.H4Count = counts.H4
	cr.H5Count = counts.H5
	cr.H6Count = counts.H6
}

// ToResponse converts CrawlResult to CrawlResultResponse for JSON output
func (cr *CrawlResult) ToResponse() CrawlResultResponse {
	return CrawlResultResponse{
		ID:                  cr.ID,
		URL:                 cr.URL,
		Title:               cr.Title,
		HTMLVersion:         cr.HTMLVersion,
		HeadingCounts:       cr.GetHeadingCounts(),
		InternalLinksCount:  cr.InternalLinksCount,
		ExternalLinksCount:  cr.ExternalLinksCount,
		BrokenLinksCount:    cr.BrokenLinksCount,
		HasLoginForm:        cr.HasLoginForm,
		Status:              cr.Status,
		ErrorMessage:        cr.ErrorMessage,
		CrawledAt:           cr.CrawledAt,
		BrokenLinks:         cr.BrokenLinks,
	}
}
