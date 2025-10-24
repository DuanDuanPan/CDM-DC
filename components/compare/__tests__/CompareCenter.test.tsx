import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import CompareCenter from '../CompareCenter';

const mockGetRunTimeseries = jest.fn();

jest.mock('@/services/tbom', () => ({
  getRunTimeseries: (...args: unknown[]) => mockGetRunTimeseries(...args),
}));

describe('CompareCenter', () => {
  beforeAll(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    // @ts-expect-error test environment shim
    global.ResizeObserver = ResizeObserverMock;
  });

  beforeEach(() => {
    window.localStorage.clear();
    mockGetRunTimeseries.mockReset();
  });

  it('loads TBOM payload and hydrates test-sim compare view', async () => {
    mockGetRunTimeseries.mockResolvedValue([
      {
        channel: 'ACC_TOP_Z',
        unit: 'g',
        sampleRate: 200,
        samples: [
          { ts: '2025-10-20T08:00:00.000Z', value: 0.1 },
          { ts: '2025-10-20T08:00:00.005Z', value: 0.12 },
          { ts: '2025-10-20T08:00:00.010Z', value: 0.11 },
        ],
      },
    ]);

    render(<CompareCenter />);

    expect(screen.getByText(/可从运行详情一键送入 Compare/)).toBeInTheDocument();

    const payload = {
      runId: 'RUN-123',
      projectId: 'PROJ-9',
      testId: 'TEST-77',
      channels: [
        { channel: 'ACC_TOP_Z', unit: 'g', sampleRate: 200, min: -0.5, max: 0.8 },
      ],
      generatedAt: '2025-10-20T08:00:00Z',
    } as const;

    await act(async () => {
      window.dispatchEvent(new CustomEvent('tbom-compare:payload-updated', { detail: payload }));
    });

    expect(await screen.findByText(/来自 TBOM 的运行上下文/)).toBeInTheDocument();
    expect(screen.getByText(payload.runId)).toBeInTheDocument();
    expect(screen.getByText(payload.testId)).toBeInTheDocument();

    const modeSelect = screen.getByDisplayValue('方案对比');
    fireEvent.change(modeSelect, { target: { value: 'test-sim' } });

    await waitFor(() => {
      expect(screen.getByText(/试验 \/ 仿真数据源/)).toBeInTheDocument();
    });

    expect(screen.getByText(/运行 RUN-123 · 试验 TEST-77/)).toBeInTheDocument();
    expect(mockGetRunTimeseries).toHaveBeenCalledWith(payload.runId);
  });
});
