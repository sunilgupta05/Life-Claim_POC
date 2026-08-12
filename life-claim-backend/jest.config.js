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
    'src/services/rbacService.js',
    'src/middleware/requirePermission.js',
    'src/auth/authMethod.js',
    'src/auth/roleMapping.js',
    'src/auth/sessionIssuer.js',
    'src/auth/providers/ldapProvider.js',
    'src/auth/providers/oidcProvider.js',
    'src/auth/providers/samlProvider.js',
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
    // RBAC resolution logic is unit-tested; the DB write paths need real infra,
    // so this is a regression floor covering the pure/read paths (roadmap 1.1).
    './src/services/rbacService.js': {
      statements: 42, branches: 40, functions: 38, lines: 38,
    },
    './src/middleware/requirePermission.js': {
      statements: 90, branches: 80, functions: 100, lines: 90,
    },
    // Pluggable-auth resolver + role mapping are pure and well-covered (1.4).
    './src/auth/authMethod.js': {
      statements: 90, branches: 80, functions: 90, lines: 90,
    },
    './src/auth/roleMapping.js': {
      statements: 90, branches: 85, functions: 100, lines: 90,
    },
    // Provider login flows are exercised via mocked IdP libraries (1.4). Live
    // IdP integration testing happens at deploy time; these are regression floors.
    './src/auth/sessionIssuer.js': {
      statements: 90, branches: 65, functions: 90, lines: 90,
    },
    './src/auth/providers/ldapProvider.js': {
      statements: 85, branches: 60, functions: 60, lines: 85,
    },
    './src/auth/providers/oidcProvider.js': {
      statements: 78, branches: 65, functions: 90, lines: 82,
    },
    './src/auth/providers/samlProvider.js': {
      statements: 80, branches: 50, functions: 90, lines: 82,
    },
  },
};
