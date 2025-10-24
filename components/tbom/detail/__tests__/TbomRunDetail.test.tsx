import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import TbomRunDetail from '@/components/tbom/detail/TbomRunDetail';
import type { TbomAttachment, TbomRunEvent, TbomTestCardRow, TbomTimeseriesChannel } from '@/components/tbom/types';
import type { TbomProject, TbomRun, TbomTest } from '@/components/tbom/types';
import { ApiError } from '@/services/http';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('next/dynamic', () => () => {
  const Component = () => null;
  Component.displayName = 'DynamicCompareMock';
  return Component;
});

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div data-testid="chart">{children}</div>,
  LineChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  Legend: () => null,
  Line: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
  ReferenceArea: () => null,
}));

jest.mock('@/components/common/ImageViewer', () => ({
  __esModule: true,
  default: ({ src }: { src: string }) => <div data-testid="image-viewer">{src}</div>,
}));

jest.mock('@/components/common/PdfViewer', () => ({
  __esModule: true,
  default: ({ fileName }: { fileName: string }) => <div data-testid="pdf-viewer">{fileName}</div>,
}));

jest.mock('@/components/compare/CompareCenter', () => ({
  __esModule: true,
  default: () => <div data-testid="compare-center" />,
}));

const mockGetRunEvents = jest.fn();
const mockGetRunTimeseries = jest.fn();
const mockListRunAttachments = jest.fn();
const mockListRunTestCard = jest.fn();

jest.mock('@/services/tbom', () => ({
  getRunEvents: (...args: unknown[]) => mockGetRunEvents(...args),
  getRunTimeseries: (...args: unknown[]) => mockGetRunTimeseries(...args),
  listRunAttachments: (...args: unknown[]) => mockListRunAttachments(...args),
  listRunTestCard: (...args: unknown[]) => mockListRunTestCard(...args),
}));

const project: TbomProject = {
  project_id: 'P-1',
  type: '结构振动',
  title: '机匣组件结构振动评估',
  objectives: '验证结构',
  input_docs: [],
  baseline_id: 'BL-1',
  relations: [],
};

const testItem: TbomTest = {
  test_id: 'T-1',
  project_id: 'P-1',
  name: '随机+正弦扫描',
  purpose: '识别共振',
  spec_refs: [],
  ebom_node_id: 'EBN-001',
  ebom_path: 'ASSY-001/FRAME-A',
};

const run: TbomRun = {
  run_id: 'R-1',
  test_id: 'T-1',
  run_index: 1,
  status: 'completed',
  planned_at: '2025-10-20T09:00:00Z',
  executed_at: '2025-10-20T10:00:00Z',
  operator: 'testerA',
  environment: { table: 'shaker-A', temp: 23.5 },
  test_item_sn: 'SN-001',
  assembly_bom_id: 'ASSY-001',
  attachments: ['F-1'],
  ebom_node_id: 'EBN-001',
};

const attachments: TbomAttachment[] = [
  {
    file_id: 'F-1',
    type: 'image',
    path: '/files/run/photo.jpg',
    ts: '2025-10-20T10:05:00Z',
    desc: '样机布置照片',
    run_id: 'R-1',
  },
];

const events: TbomRunEvent[] = [
  {
    event_id: 'E-1',
    run_id: 'R-1',
    category: 'fault',
    severity: 'major',
    start_ts: '2025-10-20T10:05:10Z',
    end_ts: '2025-10-20T10:05:12Z',
    desc: '传感器短时过载',
    code: 'SAT',
  },
];

const testCardRows: TbomTestCardRow[] = [
  { run_id: 'R-1', param_name: '扫频范围', value: '5-2000', unit: 'Hz', source: '试验卡片' },
];

const timeseries: TbomTimeseriesChannel[] = [
  {
    channel: 'ACC_TOP_Z',
    unit: 'g',
    sampleRate: 200,
    samples: [
      { ts: '2025-10-20T10:00:00.000Z', value: 0.12 },
      { ts: '2025-10-20T10:00:00.005Z', value: 0.18 },
      { ts: '2025-10-20T10:00:00.010Z', value: 0.11 },
    ],
  },
  {
    channel: 'FORCE_IN',
    unit: 'kN',
    sampleRate: 200,
    samples: [
      { ts: '2025-10-20T10:00:00.000Z', value: 12.3 },
      { ts: '2025-10-20T10:00:00.005Z', value: 12.6 },
      { ts: '2025-10-20T10:00:00.010Z', value: 12.2 },
    ],
  },
];

describe('TbomRunDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  const setupSuccessMocks = () => {
    mockGetRunEvents.mockResolvedValue(events);
    mockGetRunTimeseries.mockResolvedValue(timeseries);
    mockListRunAttachments.mockResolvedValue(attachments);
    mockListRunTestCard.mockResolvedValue(testCardRows);
  };

  it('renders run metadata, chart summary, and attachment list after loading', async () => {
    setupSuccessMocks();
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    try {
      render(<TbomRunDetail run={run} test={testItem} project={project} onClose={() => {}} />);

      expect(await screen.findByText('机匣组件结构振动评估 · 随机+正弦扫描')).toBeInTheDocument();
      expect(await screen.findByText('附件数量')).toBeInTheDocument();
      expect(await screen.findByText('样机布置照片')).toBeInTheDocument();
      expect(screen.getByText('ACC_TOP_Z')).toBeInTheDocument();
      expect(screen.getByText('FORCE_IN')).toBeInTheDocument();
      expect(screen.getByText('传感器短时过载')).toBeInTheDocument();
      expect(screen.getByText('扫频范围')).toBeInTheDocument();

      const container = screen.getByTestId('run-detail-dialog');
      expect(container).toHaveClass('rounded-3xl');

      const maximizeButton = screen.getByRole('button', { name: '最大化' });
      await userEvent.click(maximizeButton);
      expect(screen.getByRole('button', { name: '退出最大化' })).toBeInTheDocument();
      expect(container).toHaveClass('rounded-none');

      const compareButton = screen.getByRole('button', { name: /展开 Compare/i });
      await userEvent.click(compareButton);

      await waitFor(() => {
        expect(window.localStorage.getItem('tbomComparePayload')).not.toBeNull();
      });

      const broadcastCall = dispatchSpy.mock.calls.find(([event]) => event.type === 'tbom-compare:payload-updated');
      expect(broadcastCall).toBeDefined();
      const detail = (broadcastCall?.[0] as CustomEvent<any>).detail;
      expect(detail).toMatchObject({
        runId: run.run_id,
        testId: testItem.test_id,
        projectId: project.project_id,
      });
      expect(Array.isArray(detail.channels)).toBe(true);
      expect(detail.channels.length).toBe(timeseries.length);
    } finally {
      dispatchSpy.mockRestore();
    }
  });

  it('shows empty states when data sources are missing', async () => {
    mockGetRunEvents.mockResolvedValue([]);
    mockGetRunTimeseries.mockResolvedValue([]);
    mockListRunAttachments.mockResolvedValue([]);
    mockListRunTestCard.mockResolvedValue([]);

    render(<TbomRunDetail run={run} test={testItem} project={project} onClose={() => {}} />);

    expect(await screen.findByText('当前运行无异常事件，保持稳定。')).toBeInTheDocument();
    expect(screen.getByText('暂无时序数据，稍后可重新导入或检查数据源。')).toBeInTheDocument();
    expect(screen.getByText('暂无附件记录。')).toBeInTheDocument();
    expect(screen.getByText('暂无试验卡片参数记录。')).toBeInTheDocument();
  });

  it('renders error banner when services fail and allows retry', async () => {
    const error = new ApiError(500, 'MOCK_INTERNAL_ERROR');
    mockGetRunEvents.mockRejectedValue(error);
    mockGetRunTimeseries.mockRejectedValue(error);
    mockListRunAttachments.mockRejectedValue(error);
    mockListRunTestCard.mockRejectedValue(error);

    render(<TbomRunDetail run={run} test={testItem} project={project} onClose={() => {}} />);

    expect(await screen.findByText('运行详情加载失败')).toBeInTheDocument();

    setupSuccessMocks();

    await userEvent.click(screen.getByRole('button', { name: /重试/ }));

    await waitFor(() => {
      expect(mockGetRunEvents).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText('样机布置照片')).toBeInTheDocument();
  });

  it('persists TBOM filters when navigating via relation chips', async () => {
    setupSuccessMocks();
    const filters = {
      searchTerm: 'SN-001',
      typeFilter: '结构振动',
      statusFilter: ['completed' as const],
      structureSelection: 'EBN-001',
      expandedTreeIds: ['project:P-1'],
    };

    render(
      <TbomRunDetail
        run={run}
        test={testItem}
        project={{ ...project, relations: [{ kind: 'requirement', ref_id: 'REQ-123' }] }}
        filters={filters}
        onClose={() => {}}
      />,
    );

    const chip = await screen.findByRole('button', { name: /需求关联/ });
    await userEvent.click(chip);

    await waitFor(() => expect(window.localStorage.getItem('tbom.filters')).not.toBeNull());
    const storedFilters = JSON.parse(window.localStorage.getItem('tbom.filters') ?? '{}');
    expect(storedFilters).toMatchObject({
      searchTerm: filters.searchTerm,
      statusFilter: filters.statusFilter,
      structureSelection: filters.structureSelection,
    });
    expect(pushMock).toHaveBeenCalled();
  });
});
