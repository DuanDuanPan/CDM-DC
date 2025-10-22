import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TbomImportWizard from '../import/TbomImportWizard';
import type { TbomImportWizardState } from '../import/types';
import type { TbomImportActions } from '../hooks/useTbomImportState';

const buildActions = (): TbomImportActions => ({
  open: jest.fn(),
  close: jest.fn(),
  selectContract: jest.fn(),
  selectFiles: jest.fn(),
  validate: jest.fn().mockResolvedValue(undefined),
  prepareMapping: jest.fn().mockResolvedValue(undefined),
  setStrategy: jest.fn(),
  execute: jest.fn().mockResolvedValue(undefined),
  showLog: jest.fn(),
  refreshLogs: jest.fn(),
  resetToStart: jest.fn(),
  dismissError: jest.fn(),
  goToStep: jest.fn(),
});

const baseState: TbomImportWizardState = {
  isOpen: true,
  step: 'contract',
  isProcessing: false,
  progressMessage: null,
  contractType: null,
  selectedFiles: [],
  validationReport: null,
  mappingState: null,
  summary: null,
  error: null,
  logs: [],
};

describe('TbomImportWizard', () => {
  it('renders step indicator and allows selecting contract', async () => {
    const actions = buildActions();
    const { rerender } = render(<TbomImportWizard state={baseState} actions={actions} />);

    expect(screen.getByRole('heading', { name: /TBOM 数据导入向导/ })).toBeInTheDocument();
    expect(screen.getByText('契约类型')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /最小上载包/ }));
    expect(actions.selectContract).toHaveBeenCalledWith('minimum-package');

    const selectedState: TbomImportWizardState = { ...baseState, contractType: 'minimum-package' };
    rerender(<TbomImportWizard state={selectedState} actions={actions} />);

    await userEvent.click(screen.getByRole('button', { name: '下一步' }));
    expect(actions.goToStep).toHaveBeenCalledWith('validation');
  });
});

