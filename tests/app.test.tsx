import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '@/app/App';
import { ANIM_CATALOG } from '@/animations/motionTokens';

describe('SilentWatch Full Application Journey', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defines all 19 approved animations (ANIM-01 through ANIM-19)', () => {
    for (let i = 1; i <= 19; i++) {
      const id = `ANIM-${String(i).padStart(2, '0')}`;
      expect(ANIM_CATALOG[id]).toBeDefined();
    }
  });

  it('plays LaunchIntro, shows What\'s New showcase on first launch, opens directly to Overview, and navigates all screens cleanly', async () => {
    const user = userEvent.setup();
    render(<App />);

    const introOverlay = screen.getByLabelText(/SilentWatch launch intro/i);
    expect(introOverlay).toBeInTheDocument();
    await user.click(introOverlay);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Open Dashboard/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Open Dashboard/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    });

    expect(screen.queryByText(/Collapse rail/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Collapse sidebar/i }));
    expect(screen.getByRole('button', { name: /Expand sidebar/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Expand sidebar/i }));

    await user.keyboard('{Control>}k{/Control}');
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Command Palette/i })).toBeInTheDocument();
    });
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: /Behavior Explorer/i }));
    await waitFor(() => {
      expect(screen.getByText(/Event Inspector/i)).toBeInTheDocument();
      expect(screen.getByText(/DLL Cluster/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Demo Fixture/i }));
    await waitFor(() => {
      expect(screen.getByText('DEMO FIXTURE')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await waitFor(() => {
      expect(screen.getByText(/Background Monitoring Service/i)).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Updates & Release Reel/i }));
    await waitFor(() => {
      expect(screen.getByText(/GitHub Releases Auto-Update/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /System Status/i }));
    await waitFor(() => {
      expect(screen.getByText(/Storage & IPC/i)).toBeInTheDocument();
    });
  });
});
