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
import { formatDate, formatUrl, getStatusColor, cn } from '../utils';
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
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header with search and filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <h2 className="text-xl font-semibold text-gray-900">Crawl Results</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search URLs or titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              onClick={() => bulkStart.mutate(selectedIds)}
              disabled={bulkStart.isPending}
              className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
            >
              <Play className="h-3 w-3 mr-1" />
              Start ({selectedIds.length})
            </button>
            
            <button
              onClick={() => bulkStop.mutate(selectedIds)}
              disabled={bulkStop.isPending}
              className="inline-flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
            >
              <Square className="h-3 w-3 mr-1" />
              Stop ({selectedIds.length})
            </button>
            
            <button
              onClick={() => rerunAnalysis.mutate(selectedIds)}
              disabled={rerunAnalysis.isPending}
              className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Re-run ({selectedIds.length})
            </button>
            
            <button
              onClick={() => bulkDelete.mutate(selectedIds)}
              disabled={bulkDelete.isPending}
              className="inline-flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('url')}
              >
                <div className="flex items-center gap-1">
                  URL
                  <SortIcon field="url" />
                </div>
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Title
                  <SortIcon field="title" />
                </div>
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('internalLinksCount')}
              >
                <div className="flex items-center gap-1">
                  Internal Links
                  <SortIcon field="internalLinksCount" />
                </div>
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('externalLinksCount')}
              >
                <div className="flex items-center gap-1">
                  External Links
                  <SortIcon field="externalLinksCount" />
                </div>
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('brokenLinksCount')}
              >
                <div className="flex items-center gap-1">
                  Broken Links
                  <SortIcon field="brokenLinksCount" />
                </div>
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('crawledAt')}
              >
                <div className="flex items-center gap-1">
                  Crawled At
                  <SortIcon field="crawledAt" />
                </div>
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((result) => (
              <tr key={result.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(result.id)}
                    onChange={() => handleSelectResult(result.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900 truncate max-w-xs" title={result.url}>
                      {formatUrl(result.url)}
                    </span>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 truncate max-w-xs" title={result.title}>
                    {result.title || 'No title'}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusColor(result.status)
                  )}>
                    {result.status}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {result.internalLinksCount}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {result.externalLinksCount}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    'text-sm',
                    result.brokenLinksCount > 0 ? 'text-red-600 font-medium' : 'text-gray-900'
                  )}>
                    {result.brokenLinksCount}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(result.crawledAt)}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewDetails(result)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {result.status === 'queued' || result.status === 'error' ? (
                      <button
                        onClick={() => startCrawl.mutate(result.id)}
                        disabled={startCrawl.isPending}
                        className="text-green-600 hover:text-green-900"
                        title="Start crawling"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    ) : result.status === 'running' ? (
                      <button
                        onClick={() => stopCrawl.mutate(result.id)}
                        disabled={stopCrawl.isPending}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Stop crawling"
                      >
                        <Square className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => startCrawl.mutate(result.id)}
                        disabled={startCrawl.isPending}
                        className="text-blue-600 hover:text-blue-900"
                        title="Re-run analysis"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteCrawlResult.mutate(result.id)}
                      disabled={deleteCrawlResult.isPending}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {sortedData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {data.length === 0 ? 'No crawl results yet. Add a URL to get started.' : 'No results match your search criteria.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
