import { X, ExternalLink, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CrawlResult } from '../types';
import { formatDate, formatUrl } from '../utils';

interface DetailModalProps {
  result: CrawlResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DetailModal({ result, isOpen, onClose }: DetailModalProps) {
  if (!isOpen || !result) return null;

  const linkData = [
    { name: 'Internal Links', value: result.internalLinksCount, color: '#3b82f6' },
    { name: 'External Links', value: result.externalLinksCount, color: '#10b981' },
    { name: 'Broken Links', value: result.brokenLinksCount, color: '#ef4444' },
  ];

  const headingData = Object.entries(result.headingCounts).map(([level, count]) => ({
    level: level.toUpperCase(),
    count,
  }));

  const getStatusBadge = (status: string) => {
    const statusClass = status === 'completed' ? 'status-success' :
                       status === 'error' ? 'status-error' :
                       status === 'running' ? 'status-processing' :
                       status === 'queued' ? 'status-pending' : 'status-warning';
    
    return (
      <span className={`status ${statusClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: '90vw', maxWidth: '1000px' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Crawl Details</h2>
            <p className="text-sm text-gray-600" style={{ marginTop: '0.25rem' }}>
              Analysis for {formatUrl(result.url)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Basic Info */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                Basic Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label">URL</label>
                  <div className="flex items-center gap-2">
                    <span style={{ wordBreak: 'break-all', fontSize: '0.875rem' }}>{result.url}</span>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3b82f6', textDecoration: 'none' }}
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                <div>
                  <label className="form-label">Title</label>
                  <p style={{ fontSize: '0.875rem' }}>{result.title || 'No title found'}</p>
                </div>

                <div>
                  <label className="form-label">HTML Version</label>
                  <p style={{ fontSize: '0.875rem' }}>{result.htmlVersion || 'Not detected'}</p>
                </div>

                <div>
                  <label className="form-label">Login Form</label>
                  <span className={result.hasLoginForm ? 'status-success' : 'status-warning'}>
                    {result.hasLoginForm ? 'Present' : 'Not found'}
                  </span>
                </div>

                <div>
                  <label className="form-label">Crawled At</label>
                  <p style={{ fontSize: '0.875rem' }}>{formatDate(result.crawledAt)}</p>
                </div>
              </div>
            </div>

            {/* Status and Link Summary */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                Status & Summary
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label">Status</label>
                  {getStatusBadge(result.status)}
                </div>

                {result.errorMessage && (
                  <div>
                    <label className="form-label">Error Message</label>
                    <div className="alert alert-error">
                      <AlertTriangle size={16} />
                      {result.errorMessage}
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label">Link Summary</label>
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '1rem', 
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Internal Links:</span>
                      <span className="text-sm font-medium" style={{ color: '#3b82f6' }}>
                        {result.internalLinksCount}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">External Links:</span>
                      <span className="text-sm font-medium" style={{ color: '#10b981' }}>
                        {result.externalLinksCount}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Broken Links:</span>
                      <span className="text-sm font-medium" style={{ color: '#ef4444' }}>
                        {result.brokenLinksCount}
                      </span>
                    </div>
                    <div className="flex justify-between" style={{ 
                      borderTop: '1px solid #e2e8f0', 
                      paddingTop: '0.5rem' 
                    }}>
                      <span className="text-sm font-medium">Total Links:</span>
                      <span className="text-sm font-medium">
                        {result.internalLinksCount + result.externalLinksCount + result.brokenLinksCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {/* Link Distribution Pie Chart */}
            <div style={{ 
              background: '#f8fafc', 
              padding: '1.5rem', 
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                Link Distribution
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={linkData.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {linkData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Heading Structure Bar Chart */}
            <div style={{ 
              background: '#f8fafc', 
              padding: '1.5rem', 
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                Heading Structure
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={headingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Broken Links */}
          {result.brokenLinks && result.brokenLinks.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                Broken Links
              </h3>
              <div className="alert alert-error">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {result.brokenLinks.map((link, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <span className="status status-error" style={{ fontSize: '0.75rem' }}>
                        {link.statusCode}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.875rem', wordBreak: 'break-all', margin: 0 }}>
                          {link.url}
                        </p>
                        {link.text && (
                          <p style={{ 
                            fontSize: '0.75rem', 
                            color: '#6b7280', 
                            margin: '0.25rem 0 0 0' 
                          }}>
                            Link text: "{link.text}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
