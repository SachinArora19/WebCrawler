import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Globe, Activity, LogOut } from 'lucide-react';
import { UrlSubmissionForm } from './components/UrlSubmissionForm';
import { ResultsTable } from './components/ResultsTable';
import { DetailModal } from './components/DetailModal';
import { Login } from './components/Login';
import { useCrawlResults } from './hooks/useCrawler';
import { authApi } from './services/api';
import type { CrawlResult } from './types';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [selectedResult, setSelectedResult] = useState<CrawlResult | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(authApi.isAuthenticated());
  
  const { data: crawlResultsResponse, isLoading, error } = useCrawlResults();
  const crawlResults = crawlResultsResponse?.data?.data || [];

  useEffect(() => {
    setIsAuthenticated(authApi.isAuthenticated());
  }, []);

  const handleViewDetails = (result: CrawlResult) => {
    setSelectedResult(result);
    setIsDetailModalOpen(true);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authApi.logout();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedResult(null);
  };

  // Calculate statistics
  const stats = {
    total: crawlResults.length,
    completed: crawlResults.filter(r => r.status === 'completed').length,
    running: crawlResults.filter(r => r.status === 'running').length,
    queued: crawlResults.filter(r => r.status === 'queued').length,
    errors: crawlResults.filter(r => r.status === 'error').length,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="flex items-center justify-between" style={{ height: '4rem' }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center" style={{ 
                width: '2.5rem', 
                height: '2.5rem', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                color: 'white'
              }}>
                <Globe size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', margin: 0 }}>
                  Web Crawler
                </h1>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                  Website Analysis Tool
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity size={16} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
                  {stats.running > 0 ? `${stats.running} running` : 'Ready'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {/* Statistics */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div className="card text-center">
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
                {stats.total}
              </div>
              <div className="text-gray-600">Total URLs</div>
            </div>
            
            <div className="card text-center">
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981', marginBottom: '0.5rem' }}>
                {stats.completed}
              </div>
              <div className="text-gray-600">Completed</div>
            </div>
            
            <div className="card text-center">
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6', marginBottom: '0.5rem' }}>
                {stats.running}
              </div>
              <div className="text-gray-600">Running</div>
            </div>
            
            <div className="card text-center">
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.5rem' }}>
                {stats.queued}
              </div>
              <div className="text-gray-600">Queued</div>
            </div>
            
            <div className="card text-center">
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444', marginBottom: '0.5rem' }}>
                {stats.errors}
              </div>
              <div className="text-gray-600">Errors</div>
            </div>
          </div>

          {/* URL Submission Form */}
          <UrlSubmissionForm />

          {/* Error State */}
          {error && (
            <div className="alert alert-error">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <div>
                  <h3 className="font-medium">Error loading data</h3>
                  <p style={{ marginTop: '0.25rem' }}>
                    Unable to fetch crawl results. Please check your connection and try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="card text-center">
              <div className="loading">
                <div className="spinner"></div>
              </div>
              <p className="text-gray-600">Loading crawl results...</p>
            </div>
          )}

          {/* Results Table */}
          {!isLoading && !error && (
            <ResultsTable 
              data={crawlResults} 
              onViewDetails={handleViewDetails}
            />
          )}

          {/* Detail Modal */}
          <DetailModal
            result={selectedResult}
            isOpen={isDetailModalOpen}
            onClose={handleCloseDetailModal}
          />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
