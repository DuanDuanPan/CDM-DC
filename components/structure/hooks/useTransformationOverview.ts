'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TransformationOverviewData } from '@/components/structure/types';

type HookState = {
  data: TransformationOverviewData | null;
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: HookState = {
  data: null,
  loading: true,
  error: null,
};

const MOCK_ENDPOINT = '/api/mock/xbom/transformation';

export function useTransformationOverview() {
  const [state, setState] = useState<HookState>(INITIAL_STATE);
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function load() {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await fetch(MOCK_ENDPOINT, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`MOCK_FETCH_FAILED_${response.status}`);
        }

        const payload = (await response.json()) as { data: TransformationOverviewData };
        if (!payload?.data) {
          throw new Error('MOCK_PAYLOAD_EMPTY');
        }

        if (isMounted) {
          setState({ data: payload.data, loading: false, error: null });
        }
      } catch (error) {
        if (!isMounted || controller.signal.aborted) {
          return;
        }
        const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
        setState({ data: null, loading: false, error: message });
      }
    }

    load();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [reloadToken]);

  const derived = useMemo(
    () => ({
      data: state.data,
      loading: state.loading,
      error: state.error,
      refresh,
    }),
    [state.data, state.loading, state.error, refresh]
  );

  return derived;
}
