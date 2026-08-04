// Vitest global setup (roadmap 0.5 — test harness skeleton).
// Adds jest-dom matchers (toBeInTheDocument, toHaveAttribute, ...) and clears
// the DOM between tests so component tests stay isolated.
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
