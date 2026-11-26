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

    // Every-launch intro animation renders immediately and can be skipped or auto-completes <= 5s
    const introOverlay = screen.getByLabelText(/SilentWatch launch intro/i);
    expect(introOverlay).toBeInTheDocument();
    await user.click(introOverlay);

    // What's New modal appears on fresh install / new release
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Open Dashboard/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Open Dashboard/i }));

    // Opens directly into Overview dashboard (no in-app setup wizard)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    });

    // No "Collapse rail" text in sidebar; icon-only toggle works
    expect(screen.queryByText(/Collapse rail/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Collapse sidebar/i }));
    expect(screen.getByRole('button', { name: /Expand sidebar/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Expand sidebar/i }));

    // Open Ctrl+K Command Palette
    await user.keyboard('{Control>}k{/Control}');
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Command Palette/i })).toBeInTheDocument();
    });
    await user.keyboard('{Escape}');

    // Navigate to Behavior Explorer and verify canvas renders without blanking
    await user.click(screen.getByRole('button', { name: /Behavior Explorer/i }));
    await waitFor(() => {
      expect(screen.getByText(/Event Inspector/i)).toBeInTheDocument();
      expect(screen.getByText(/DLL Cluster/i)).toBeInTheDocument();
    });

    // Verify Demo Fixture toggle is removed and compact Search... trigger is rendered
    expect(screen.queryByRole('button', { name: /Demo Fixture/i })).not.toBeInTheDocument();
    expect(screen.getByText('Search...')).toBeInTheDocument();

    // Navigate to Apple-style Settings and verify category tabs switch views
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await waitFor(() => {
      expect(screen.getByText(/Background Monitoring Service/i)).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Updates & Release Reel/i }));
    await waitFor(() => {
      expect(screen.getByText(/GitHub Releases Auto-Update/i)).toBeInTheDocument();
    });

    // Navigate to System Status and verify concise diagnostics
    await user.click(screen.getByRole('button', { name: /System Status/i }));
    await waitFor(() => {
      expect(screen.getByText(/Storage & IPC/i)).toBeInTheDocument();
    });
  });
});
