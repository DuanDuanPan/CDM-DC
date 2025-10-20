import { act, render, screen } from '@testing-library/react';
import CompareCenter from '../CompareCenter';

describe('CompareCenter', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('updates TBOM payload banner when receive same-tab broadcast', async () => {
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
  });
});
