import type { CrawlResult, ApiResponse } from '../types';

// Mock data for development and testing
const mockCrawlResults: CrawlResult[] = [
  {
    id: '1',
    url: 'https://example.com',
    title: 'Example Domain',
    htmlVersion: 'HTML5',
    headingCounts: { h1: 1, h2: 3, h3: 5, h4: 2, h5: 0, h6: 0 },
    internalLinksCount: 12,
    externalLinksCount: 8,
    brokenLinksCount: 1,
    hasLoginForm: false,
    status: 'completed',
    crawledAt: new Date().toISOString(),
    brokenLinks: [
      {
        url: 'https://example.com/broken-link',
        statusCode: 404,
        text: 'Broken Link Text'
      }
    ]
  },
  {
    id: '2',
    url: 'https://github.com',
    title: 'GitHub: Let\'s build from here',
    htmlVersion: 'HTML5',
    headingCounts: { h1: 1, h2: 4, h3: 8, h4: 3, h5: 1, h6: 0 },
    internalLinksCount: 45,
    externalLinksCount: 12,
    brokenLinksCount: 0,
    hasLoginForm: true,
    status: 'running',
    crawledAt: new Date(Date.now() - 3600000).toISOString(),
    brokenLinks: []
  },
  {
    id: '3',
    url: 'https://stackoverflow.com',
    title: 'Stack Overflow - Where Developers Learn',
    htmlVersion: 'HTML5',
    headingCounts: { h1: 1, h2: 6, h3: 12, h4: 8, h5: 2, h6: 1 },
    internalLinksCount: 89,
    externalLinksCount: 23,
    brokenLinksCount: 2,
    hasLoginForm: true,
    status: 'completed',
    crawledAt: new Date(Date.now() - 7200000).toISOString(),
    brokenLinks: [
      {
        url: 'https://stackoverflow.com/old-link',
        statusCode: 410,
        text: 'Old documentation'
      },
      {
        url: 'https://external-site.com/missing',
        statusCode: 404,
        text: 'External resource'
      }
    ]
  },
  {
    id: '4',
    url: 'https://invalid-site.com',
    title: '',
    htmlVersion: '',
    headingCounts: { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 },
    internalLinksCount: 0,
    externalLinksCount: 0,
    brokenLinksCount: 0,
    hasLoginForm: false,
    status: 'error',
    errorMessage: 'Failed to connect to the website. Connection timeout.',
    crawledAt: new Date(Date.now() - 10800000).toISOString(),
    brokenLinks: []
  },
  {
    id: '5',
    url: 'https://pending-site.com',
    title: '',
    htmlVersion: '',
    headingCounts: { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 },
    internalLinksCount: 0,
    externalLinksCount: 0,
    brokenLinksCount: 0,
    hasLoginForm: false,
    status: 'queued',
    crawledAt: new Date().toISOString(),
    brokenLinks: []
  }
];

// Mock API service for development
export const mockCrawlerApi = {
  getCrawlResults: async (): Promise<ApiResponse<CrawlResult[]>> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      data: mockCrawlResults,
      success: true,
      message: 'Results fetched successfully'
    };
  },

  getCrawlResult: async (id: string): Promise<ApiResponse<CrawlResult>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = mockCrawlResults.find(r => r.id === id);
    if (!result) {
      throw new Error('Result not found');
    }
    
    return {
      data: result,
      success: true,
      message: 'Result fetched successfully'
    };
  },

  submitUrl: async (request: { url: string }): Promise<ApiResponse<CrawlResult>> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newResult: CrawlResult = {
      id: Date.now().toString(),
      url: request.url,
      title: '',
      htmlVersion: '',
      headingCounts: { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 },
      internalLinksCount: 0,
      externalLinksCount: 0,
      brokenLinksCount: 0,
      hasLoginForm: false,
      status: 'queued',
      crawledAt: new Date().toISOString(),
      brokenLinks: []
    };
    
    mockCrawlResults.unshift(newResult);
    
    return {
      data: newResult,
      success: true,
      message: 'URL submitted successfully'
    };
  },

  startCrawl: async (id: string): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = mockCrawlResults.find(r => r.id === id);
    if (result) {
      result.status = 'running';
    }
    
    return {
      data: undefined,
      success: true,
      message: 'Crawl started successfully'
    };
  },

  stopCrawl: async (id: string): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = mockCrawlResults.find(r => r.id === id);
    if (result) {
      result.status = 'queued';
    }
    
    return {
      data: undefined,
      success: true,
      message: 'Crawl stopped successfully'
    };
  },

  deleteCrawlResult: async (id: string): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = mockCrawlResults.findIndex(r => r.id === id);
    if (index > -1) {
      mockCrawlResults.splice(index, 1);
    }
    
    return {
      data: undefined,
      success: true,
      message: 'Result deleted successfully'
    };
  },

  bulkStart: async (ids: string[]): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ids.forEach(id => {
      const result = mockCrawlResults.find(r => r.id === id);
      if (result) {
        result.status = 'running';
      }
    });
    
    return {
      data: undefined,
      success: true,
      message: 'Bulk start completed successfully'
    };
  },

  bulkStop: async (ids: string[]): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ids.forEach(id => {
      const result = mockCrawlResults.find(r => r.id === id);
      if (result) {
        result.status = 'queued';
      }
    });
    
    return {
      data: undefined,
      success: true,
      message: 'Bulk stop completed successfully'
    };
  },

  bulkDelete: async (ids: string[]): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ids.forEach(id => {
      const index = mockCrawlResults.findIndex(r => r.id === id);
      if (index > -1) {
        mockCrawlResults.splice(index, 1);
      }
    });
    
    return {
      data: undefined,
      success: true,
      message: 'Bulk delete completed successfully'
    };
  },

  rerunAnalysis: async (ids: string[]): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ids.forEach(id => {
      const result = mockCrawlResults.find(r => r.id === id);
      if (result) {
        result.status = 'running';
      }
    });
    
    return {
      data: undefined,
      success: true,
      message: 'Bulk re-run completed successfully'
    };
  },
};
