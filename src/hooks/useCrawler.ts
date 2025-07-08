import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crawlerApi, authApi } from '../services/api';
import type { CrawlRequest } from '../types';

export const useCrawlResults = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  return useQuery({
    queryKey: ['crawlResults', params],
    queryFn: () => crawlerApi.getCrawlResults(params),
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
};

export const useCrawlResult = (id: string) => {
  return useQuery({
    queryKey: ['crawlResult', id],
    queryFn: () => crawlerApi.getCrawlResult(id),
    enabled: !!id,
  });
};

export const useSubmitUrl = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: CrawlRequest) => crawlerApi.submitUrl(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlResults'] });
    },
  });
};

export const useStartCrawl = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => crawlerApi.startCrawl(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlResults'] });
    },
  });
};

export const useStopCrawl = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => crawlerApi.stopCrawl(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlResults'] });
    },
  });
};

export const useDeleteCrawlResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => crawlerApi.deleteCrawlResult(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlResults'] });
    },
  });
};

export const useBulkOperations = () => {
  const queryClient = useQueryClient();
  
  const bulkStart = useMutation({
    mutationFn: (ids: string[]) => crawlerApi.bulkStart(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlResults'] });
    },
  });

  const bulkStop = useMutation({
    mutationFn: (ids: string[]) => crawlerApi.bulkStop(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlResults'] });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => crawlerApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlResults'] });
    },
  });

  const rerunAnalysis = useMutation({
    mutationFn: (ids: string[]) => crawlerApi.rerunAnalysis(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlResults'] });
    },
  });

  return {
    bulkStart,
    bulkStop,
    bulkDelete,
    rerunAnalysis,
  };
};

export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => crawlerApi.getStats(),
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

export const useAuth = () => {
  const queryClient = useQueryClient();
  
  const login = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => 
      authApi.login(username, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlResults'] });
    },
  });

  const register = useMutation({
    mutationFn: ({ username, password, email }: { username: string; password: string; email: string }) => 
      authApi.register(username, password, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlResults'] });
    },
  });

  return { login, register };
};
