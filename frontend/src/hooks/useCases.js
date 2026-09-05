import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook to manage case listing, multi-parameter filtering, and pagination.
 */
export function useCases(initialParams = {}) {
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(initialParams.skip || 0);
  const [limit, setLimit] = useState(initialParams.limit || 20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState(initialParams.search || '');
  const [priority, setPriority] = useState(initialParams.priority || '');
  const [status, setStatus] = useState(initialParams.status || '');
  const [camp, setCamp] = useState(initialParams.camp || '');
  const [anomaly, setAnomaly] = useState(initialParams.has_anomaly || '');

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCases({
        search: search || undefined,
        priority: priority || undefined,
        status: status || undefined,
        camp: camp || undefined,
        has_anomaly: anomaly || undefined,
        skip,
        limit,
      });
      setCases(data.cases || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load screening cases.');
    } finally {
      setLoading(false);
    }
  }, [search, priority, status, camp, anomaly, skip, limit]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const resetFilters = () => {
    setSearch('');
    setPriority('');
    setStatus('');
    setCamp('');
    setAnomaly('');
    setSkip(0);
  };

  return {
    cases,
    total,
    skip,
    setSkip,
    limit,
    setLimit,
    loading,
    error,
    search,
    setSearch,
    priority,
    setPriority,
    status,
    setStatus,
    camp,
    setCamp,
    anomaly,
    setAnomaly,
    refetch: fetchCases,
    resetFilters,
  };
}

export default useCases;
