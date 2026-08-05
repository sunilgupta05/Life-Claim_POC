// Jest config for the backend (roadmap 0.5 — test harness).
// CommonJS project, so no transform is needed. Tests live under tests/.
// The two existing scripts/*-e2e.js are standalone runners, NOT Jest tests,
// and are intentionally excluded from this config.
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  clearMocks: true,

  // Coverage is opt-in via `npm run test:coverage` (and enforced in CI).
  collectCoverageFrom: [
    'src/util/convertCase.js',
    'src/util/formatProductName.js',
    'src/util/superuserRoles.js',
    'src/util/keycloakRoles.js',
    'src/middleware/httpMethodFilter.js',
    'src/config/configService.js',
    'src/config/configBus.js',
    'src/db/migrator.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'lcov'],

  // Two tiers of thresholds:
  //  - Pure, dependency-free code is held to a HIGH bar.
  //  - Infra-dependent modules (their DB/Redis code paths need real infra and are
  //    exercised by integration checks, not unit tests) get a regression FLOOR so
  //    the unit-testable parts can't silently rot. Raise these as coverage grows.
  coverageThreshold: {
    './src/util/': { statements: 90, branches: 70, functions: 95, lines: 90 },
    './src/middleware/httpMethodFilter.js': {
      statements: 100, branches: 100, functions: 100, lines: 100,
    },
    './src/config/configService.js': {
      statements: 40, branches: 35, functions: 35, lines: 40,
    },
    './src/config/configBus.js': {
      statements: 30, branches: 25, functions: 40, lines: 30,
    },
    './src/db/migrator.js': {
      statements: 15, branches: 9, functions: 18, lines: 15,
    },
  },
};
