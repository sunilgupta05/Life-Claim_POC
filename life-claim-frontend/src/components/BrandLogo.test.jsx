import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import BrandLogo from './BrandLogo';

// Smoke test: proves the React + jsdom + RTL pipeline renders a real component.
describe('BrandLogo', () => {
  it('renders a logo image', () => {
    const { container } = render(<BrandLogo />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
  });

  it('honours the mobile variant without crashing', () => {
    const { container } = render(<BrandLogo variant="mobile" />);
    expect(container.querySelector('img')).toBeTruthy();
  });
});
