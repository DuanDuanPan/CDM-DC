import { useCallback, useMemo, useReducer } from 'react';
import type { AlignmentLogEntry, TestSimChannel, TestSimChannelKind, TestSimRun, TestSimState } from './types';
import { attachRunChannelMetadata, makeChannelKey } from './utils';

type Action =
  | { type: 'set-runs'; runs: TestSimRun[] }
  | { type: 'add-run'; run: TestSimRun }
  | { type: 'remove-run'; runId: string }
  | { type: 'toggle-run'; runId: string }
  | { type: 'select-channels'; channels: string[] }
  | { type: 'toggle-filter'; kind: TestSimChannelKind }
  | { type: 'set-loading'; value: boolean }
  | { type: 'set-error'; error: string | null }
  | { type: 'update-channel'; payload: { runId: string; channel: TestSimChannel } }
  | {
      type: 'set-alignment';
      channel: string;
      payload: { unitStatus?: 'aligned' | 'pending' | 'skipped'; sampleRateStatus?: 'aligned' | 'pending' | 'skipped'; notes?: string };
    }
  | { type: 'append-log'; entry: AlignmentLogEntry };

const initialState: TestSimState = {
  runs: [],
  selectedRunIds: [],
  selectedChannels: [],
  quickFilters: ['ACC'],
  alignment: {},
  alignmentLog: [],
  pending: false,
  error: null,
};

function reducer(state: TestSimState, action: Action): TestSimState {
  switch (action.type) {
    case 'set-runs': {
      const normalizedRuns = action.runs.map(attachRunChannelMetadata);
      const runIds = normalizedRuns.map((run) => run.runId);
      const existingChannel = state.selectedChannels.length
        ? state.selectedChannels
        : normalizedRuns.flatMap((run) => run.channels.slice(0, 1).map((channel) => channel.key ?? makeChannelKey(run.runId, channel.channel)));
      return {
        ...state,
        runs: normalizedRuns,
        selectedRunIds: runIds,
        selectedChannels: existingChannel,
      };
    }
    case 'add-run': {
      const candidate = attachRunChannelMetadata(action.run);
      const runs = state.runs.some((run) => run.runId === candidate.runId)
        ? state.runs.map((run) => (run.runId === candidate.runId ? candidate : run))
        : [...state.runs, candidate];
      return {
        ...state,
        runs,
        selectedRunIds: Array.from(new Set([...state.selectedRunIds, candidate.runId])),
      };
    }
    case 'remove-run': {
      const runs = state.runs.filter((run) => run.runId !== action.runId);
      return {
        ...state,
        runs,
        selectedRunIds: state.selectedRunIds.filter((id) => id !== action.runId),
      };
    }
    case 'toggle-run': {
      const exists = state.selectedRunIds.includes(action.runId);
      return {
        ...state,
        selectedRunIds: exists
          ? state.selectedRunIds.filter((id) => id !== action.runId)
          : [...state.selectedRunIds, action.runId],
      };
    }
    case 'select-channels': {
      return {
        ...state,
        selectedChannels: action.channels,
      };
    }
    case 'toggle-filter': {
      const exists = state.quickFilters.includes(action.kind);
      return {
        ...state,
        quickFilters: exists
          ? state.quickFilters.filter((id) => id !== action.kind)
          : [...state.quickFilters, action.kind],
      };
    }
    case 'update-channel': {
      const { runId, channel } = action.payload;
      const runs = state.runs.map((run) => {
        if (run.runId !== runId) return run;
        const channels = run.channels.map((item) => (item.channel === channel.channel ? channel : item));
        return { ...run, channels };
      });
      return {
        ...state,
        runs,
      };
    }
    case 'set-loading': {
      return {
        ...state,
        pending: action.value,
      };
    }
    case 'set-error': {
      return {
        ...state,
        error: action.error,
      };
    }
    case 'set-alignment': {
      const next = state.alignment[action.channel] ?? {
        channel: action.channel,
        unitStatus: 'pending',
        sampleRateStatus: 'pending',
      };
      return {
        ...state,
        alignment: {
          ...state.alignment,
          [action.channel]: {
            ...next,
            ...action.payload,
          },
        },
      };
    }
    case 'append-log': {
      return {
        ...state,
        alignmentLog: [action.entry, ...state.alignmentLog].slice(0, 100),
      };
    }
    default:
      return state;
  }
}

export function useTestSimCompare() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const selectedRuns = useMemo(
    () => state.runs.filter((run) => state.selectedRunIds.includes(run.runId)),
    [state.runs, state.selectedRunIds],
  );

  const selectedChannels = useMemo(() => {
    if (!state.selectedChannels.length) {
      return selectedRuns.flatMap((run) => run.channels);
    }
    const set = new Set(state.selectedChannels);
    return selectedRuns.flatMap((run) =>
      run.channels.filter((channel) => set.has(channel.key ?? makeChannelKey(run.runId, channel.channel))),
    );
  }, [selectedRuns, state.selectedChannels]);

  const setRuns = useCallback((runs: TestSimRun[]) => dispatch({ type: 'set-runs', runs }), []);
  const addRun = useCallback((run: TestSimRun) => dispatch({ type: 'add-run', run }), []);
  const removeRun = useCallback((runId: string) => dispatch({ type: 'remove-run', runId }), []);
  const toggleRun = useCallback((runId: string) => dispatch({ type: 'toggle-run', runId }), []);
  const selectChannels = useCallback((channels: string[]) => dispatch({ type: 'select-channels', channels }), []);
  const toggleFilter = useCallback((kind: TestSimChannelKind) => dispatch({ type: 'toggle-filter', kind }), []);
  const setLoading = useCallback((value: boolean) => dispatch({ type: 'set-loading', value }), []);
  const setError = useCallback((error: string | null) => dispatch({ type: 'set-error', error }), []);
  const updateChannel = useCallback((runId: string, channel: TestSimChannel) => dispatch({ type: 'update-channel', payload: { runId, channel } }), []);
  const updateAlignment = useCallback(
    (channel: string, payload: { unitStatus?: 'aligned' | 'pending' | 'skipped'; sampleRateStatus?: 'aligned' | 'pending' | 'skipped'; notes?: string }) =>
      dispatch({ type: 'set-alignment', channel, payload }),
    [],
  );
  const appendLog = useCallback((entry: AlignmentLogEntry) => dispatch({ type: 'append-log', entry }), []);

  return {
    state,
    selectedRuns,
    selectedChannels,
    setRuns,
    addRun,
    removeRun,
    toggleRun,
    selectChannels,
    toggleFilter,
    setLoading,
    setError,
    updateChannel,
    updateAlignment,
    appendLog,
  };
}
