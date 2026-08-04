// Jest config for the backend (roadmap 0.5 — test harness skeleton).
// CommonJS project, so no transform is needed. Tests live under tests/.
// The two existing scripts/*-e2e.js are standalone runners, NOT Jest tests,
// and are intentionally excluded from this config.
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  clearMocks: true,
  // Coverage is opt-in via `npm run test:coverage`. Scope it to the pure,
  // dependency-free modules the skeleton exercises today; widen as tests grow.
  collectCoverageFrom: [
    'src/util/convertCase.js',
    'src/util/formatProductName.js',
    'src/middleware/httpMethodFilter.js',
  ],
  coverageDirectory: 'coverage',
};
