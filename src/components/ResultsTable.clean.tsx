import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Play, 
  Square, 
  Trash2, 
  RotateCcw,
  ExternalLink,
  Eye
} from 'lucide-react';
import type { CrawlResult } from '../types';
import { formatDate, formatUrl } from '../utils';
import { useStartCrawl, useStopCrawl, useDeleteCrawlResult, useBulkOperations } from '../hooks/useCrawler';

interface ResultsTableProps {
  data: CrawlResult[];
  onViewDetails: (result: CrawlResult) => void;
}

type SortField = keyof CrawlResult | 'totalLinks';
type SortDirection = 'asc' | 'desc';

export function ResultsTable({ data, onViewDetails }: ResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>('crawledAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const startCrawl = useStartCrawl();
  const stopCrawl = useStopCrawl();
  const deleteCrawlResult = useDeleteCrawlResult();
  const { bulkStart, bulkStop, bulkDelete, rerunAnalysis } = useBulkOperations();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(result => result.id));
    }
  };

  const handleSelectResult = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  // Filter data
  const filteredData = data.filter(result => {
    const matchesSearch = result.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || result.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    if (sortField === 'totalLinks') {
      aValue = a.internalLinksCount + a.externalLinksCount;
      bValue = b.internalLinksCount + b.externalLinksCount;
    } else {
      aValue = a[sortField] as string | number;
      bValue = b[sortField] as string | number;
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
    }
    if (typeof bValue === 'string') {
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp size={16} /> : 
      <ChevronDown size={16} />;
  };

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

  if (!data.length) {
    return (
      <div className="card text-center" style={{ padding: '3rem' }}>
        <h3 className="text-gray-600 mb-4">No crawl results yet</h3>
        <p className="text-gray-600">Submit a URL above to start crawling and analyzing websites.</p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header with search and filters */}
      <div className="card-header">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">Crawl Results</h2>
          
          <div className="flex gap-4">
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }} 
              />
              <input
                type="text"
                placeholder="Search URLs or titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem', minWidth: '250px' }}
              />
            </div>
            
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
              style={{ minWidth: '120px' }}
            >
              <option value="all">All Status</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedIds.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => bulkStart.mutate(selectedIds)}
              disabled={bulkStart.isPending}
              className="btn btn-sm"
              style={{ background: '#dcfce7', color: '#166534' }}
            >
              <Play size={14} />
              Start ({selectedIds.length})
            </button>
            
            <button
              onClick={() => bulkStop.mutate(selectedIds)}
              disabled={bulkStop.isPending}
              className="btn btn-sm"
              style={{ background: '#fef3c7', color: '#92400e' }}
            >
              <Square size={14} />
              Stop ({selectedIds.length})
            </button>
            
            <button
              onClick={() => rerunAnalysis.mutate(selectedIds)}
              disabled={rerunAnalysis.isPending}
              className="btn btn-sm"
              style={{ background: '#dbeafe', color: '#1e40af' }}
            >
              <RotateCcw size={14} />
              Rerun ({selectedIds.length})
            </button>
            
            <button
              onClick={() => bulkDelete.mutate(selectedIds)}
              disabled={bulkDelete.isPending}
              className="btn btn-sm btn-danger"
            >
              <Trash2 size={14} />
              Delete ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th 
                onClick={() => handleSort('url')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <div className="flex items-center gap-2">
                  URL
                  <SortIcon field="url" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('title')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <div className="flex items-center gap-2">
                  Title
                  <SortIcon field="title" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('status')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <div className="flex items-center gap-2">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('totalLinks')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <div className="flex items-center gap-2">
                  Links
                  <SortIcon field="totalLinks" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('crawledAt')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <div className="flex items-center gap-2">
                  Crawled At
                  <SortIcon field="crawledAt" />
                </div>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((result) => (
              <tr key={result.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(result.id)}
                    onChange={() => handleSelectResult(result.id)}
                  />
                </td>
                <td>
                  <div style={{ maxWidth: '300px' }}>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      style={{ textDecoration: 'none' }}
                    >
                      <span style={{ wordBreak: 'break-all' }}>
                        {formatUrl(result.url)}
                      </span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </td>
                <td>
                  <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {result.title || 'No title'}
                  </div>
                </td>
                <td>
                  {getStatusBadge(result.status)}
                </td>
                <td>
                  <div className="text-sm">
                    <div>Internal: {result.internalLinksCount}</div>
                    <div>External: {result.externalLinksCount}</div>
                    <div className="font-medium">Total: {result.internalLinksCount + result.externalLinksCount}</div>
                  </div>
                </td>
                <td className="text-sm text-gray-600">
                  {result.crawledAt ? formatDate(result.crawledAt) : 'Not crawled'}
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewDetails(result)}
                      className="btn btn-sm btn-secondary"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                    
                    {result.status === 'queued' || result.status === 'error' ? (
                      <button
                        onClick={() => startCrawl.mutate(result.id)}
                        disabled={startCrawl.isPending}
                        className="btn btn-sm"
                        style={{ background: '#dcfce7', color: '#166534' }}
                        title="Start Crawl"
                      >
                        <Play size={14} />
                      </button>
                    ) : result.status === 'running' ? (
                      <button
                        onClick={() => stopCrawl.mutate(result.id)}
                        disabled={stopCrawl.isPending}
                        className="btn btn-sm"
                        style={{ background: '#fef3c7', color: '#92400e' }}
                        title="Stop Crawl"
                      >
                        <Square size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => rerunAnalysis.mutate([result.id])}
                        disabled={rerunAnalysis.isPending}
                        className="btn btn-sm"
                        style={{ background: '#dbeafe', color: '#1e40af' }}
                        title="Rerun Analysis"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteCrawlResult.mutate(result.id)}
                      disabled={deleteCrawlResult.isPending}
                      className="btn btn-sm btn-danger"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedData.length === 0 && filteredData.length === 0 && (
        <div className="text-center" style={{ padding: '2rem' }}>
          <p className="text-gray-600">No results found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
