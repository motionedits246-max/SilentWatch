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

  it('renders Mindly-inspired 5-step onboarding on first launch and transitions to Helios dark dashboard', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/See what runs/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Get Started/i }));
    await waitFor(() => expect(screen.getByText(/Facts first/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByText(/Choose how deeply/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByText(/Quiet by/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => expect(screen.getByText(/Everything is ready/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Enter SilentWatch/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    });

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

    await user.click(screen.getByRole('button', { name: /System Status/i }));
    await waitFor(() => {
      expect(screen.getByText(/Collector Capabilities Matrix/i)).toBeInTheDocument();
    });
  });
});
