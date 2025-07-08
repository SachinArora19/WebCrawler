export interface CrawlResult {
  id: string;
  url: string;
  title: string;
  htmlVersion: string;
  headingCounts: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
  };
  internalLinksCount: number;
  externalLinksCount: number;
  brokenLinksCount: number;
  hasLoginForm: boolean;
  status: 'queued' | 'running' | 'completed' | 'error';
  errorMessage?: string;
  crawledAt: string;
  brokenLinks: BrokenLink[];
}

export interface BrokenLink {
  url: string;
  statusCode: number;
  text: string;
}

export interface CrawlRequest {
  url: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
