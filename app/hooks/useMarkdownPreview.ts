'use client';

import { useCallback, useState } from 'react';

type MarkdownState = {
  content: string;
  loading: boolean;
  error: string | null;
  visible: boolean;
};

const INITIAL_STATE: MarkdownState = {
  content: '',
  loading: false,
  error: null,
  visible: false,
};

export function useMarkdownPreview(docId: string) {
  const [state, setState] = useState<MarkdownState>(INITIAL_STATE);

  const open = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null, visible: true }));
    try {
      const response = await fetch(`/api/documents/${docId}`);
      if (!response.ok) {
        throw new Error(`DOC_FETCH_FAILED_${response.status}`);
      }
      const payload = (await response.json()) as { content?: string };
      if (!payload.content) {
        throw new Error('DOC_EMPTY_CONTENT');
      }
      setState({ content: payload.content, loading: false, error: null, visible: true });
    } catch (error) {
      setState({
        content: '',
        loading: false,
        visible: true,
        error: error instanceof Error ? error.message : 'DOC_UNKNOWN_ERROR',
      });
    }
  }, [docId]);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    content: state.content,
    loading: state.loading,
    error: state.error,
    visible: state.visible,
    open,
    close,
  };
}
