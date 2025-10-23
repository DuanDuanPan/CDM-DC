import { jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import TbomRelationChips from '@/components/tbom/relations/TbomRelationChips';
import type { TbomProject, TbomTest, TbomRun } from '@/components/tbom/types';
import type { TbomSelection } from '@/components/tbom/TbomExplorerClient';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

const baseProject: TbomProject = {
  project_id: 'P-1',
  type: '结构振动',
  title: '结构振动评估',
  objectives: '测试说明',
  input_docs: [],
  baseline_id: 'BL-1',
  relations: [
    { kind: 'requirement', ref_id: 'REQ-001' },
    { kind: 'ebom', ref_id: 'EBOM-001' },
    { kind: 'simulation', ref_id: 'SIM-001' },
  ],
};

const baseTest: TbomTest = {
  test_id: 'T-1',
  project_id: 'P-1',
  name: '振动试验',
  purpose: '验证结构',
  spec_refs: [],
  ebom_node_id: 'EBN-001',
  ebom_path: 'ROOT/NODE',
};

const baseRun: TbomRun = {
  run_id: 'R-1',
  test_id: 'T-1',
  run_index: 1,
  status: 'completed',
  planned_at: '2025-10-20T09:00:00Z',
  executed_at: '2025-10-20T10:00:00Z',
  operator: 'testerA',
  environment: {},
  test_item_sn: 'SN-01',
  assembly_bom_id: 'ASSY-01',
  attachments: [],
  ebom_node_id: 'EBN-001',
};

const buildSelection = (): TbomSelection => ({
  level: 'run',
  project: baseProject,
  test: baseTest,
  run: baseRun,
});

describe('TbomRelationChips', () => {
  beforeEach(() => {
    pushMock.mockClear();
    window.localStorage.clear();
    window.open = jest.fn();
  });

  it('renders accessible chips with labels and fallback text', () => {
    render(<TbomRelationChips selection={buildSelection()} />);

    expect(screen.getByRole('button', { name: /需求关联/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /设计\/EBOM/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /仿真视图/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /实物追溯/ })).toBeInTheDocument();
  });

  it('navigates via router and persists context when clicking a chip', () => {
    render(<TbomRelationChips selection={buildSelection()} />);

    fireEvent.click(screen.getByRole('button', { name: /需求关联/ }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const targetUrl = pushMock.mock.calls[0][0] as string;
    expect(targetUrl).toContain('module=structure');
    expect(targetUrl).toContain('domain=requirement');
    expect(targetUrl).toContain('requirementId=REQ-001');

    expect(window.localStorage.getItem('tbom.context')).not.toBeNull();
    expect(window.localStorage.getItem('tbom.filters')).not.toBeNull();
  });

  it('marks chips as unavailable when relation data is missing', () => {
    const projectWithoutRelations: TbomProject = { ...baseProject, relations: [] };
    const selection: TbomSelection = {
      level: 'run',
      project: projectWithoutRelations,
      test: baseTest,
      run: { ...baseRun, test_item_sn: undefined, assembly_bom_id: undefined },
    };

    render(<TbomRelationChips selection={selection} />);

    const requirementChip = screen.getByRole('button', { name: /需求关联/ });
    expect(requirementChip).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: /实物追溯/ })).toHaveAttribute('aria-disabled', 'true');
  });
});
