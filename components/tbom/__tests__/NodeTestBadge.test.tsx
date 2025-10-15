import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NodeTestBadge from '@/components/tbom/structure/NodeTestBadge';

describe('NodeTestBadge', () => {
  it('supports keyboard focus with a readable accessible name', async () => {
    const user = userEvent.setup();

    render(<NodeTestBadge count={3} />);

    await user.tab();

    const badgeButton = screen.getByRole('button', {
      name: '查看挂接试验，计数 3',
    });

    expect(badgeButton).toHaveFocus();
    expect(badgeButton).toHaveAccessibleName('查看挂接试验，计数 3');
  });

  it('announces count changes through an aria-live region', () => {
    const { rerender } = render(<NodeTestBadge count={0} />);

    const liveRegion = screen.getByTestId('node-test-badge-live');

    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveTextContent('暂无挂接试验');

    rerender(<NodeTestBadge count={5} />);

    expect(screen.getByTestId('node-test-badge-live')).toHaveTextContent('共有 5 个试验');
  });
});
