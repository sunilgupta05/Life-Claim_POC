// orgProfileService — branding save + defaults fallback (roadmap 0.2 / 2.1).

jest.mock('../../src/dataAccess/orgProfileDao', () => ({
  getActiveOrgProfile: jest.fn(),
  updateActiveOrgProfile: jest.fn().mockResolvedValue(true),
}));

const dao = require('../../src/dataAccess/orgProfileDao');
const svc = require('../../src/services/orgProfileService');

beforeEach(() => svc.clearCache());

describe('orgProfileService.save (2.1 branding)', () => {
  test('persists via the DAO then hot-reloads the cache', async () => {
    dao.getActiveOrgProfile.mockResolvedValue({
      ORG_NAME: 'Acme', ORG_CODE: 'ACME', BRAND_COLORS: { primary: '#111111' },
    });
    const profile = await svc.save({ name: 'Acme', colors: { primary: '#111111' } });

    expect(dao.updateActiveOrgProfile).toHaveBeenCalledWith(expect.objectContaining({ name: 'Acme' }));
    expect(profile.name).toBe('Acme');
    expect(profile.colors.primary).toBe('#111111');
    expect(svc.getOrgProfile().name).toBe('Acme'); // cache updated
  });

  test('mapRow merges brand colours over the defaults', async () => {
    dao.getActiveOrgProfile.mockResolvedValue({
      ORG_NAME: 'Acme', ORG_CODE: 'ACME', BRAND_COLORS: { primary: '#222222' },
    });
    const p = await svc.load({ silent: true });
    expect(p.colors.primary).toBe('#222222');           // overridden
    expect(p.colors.text).toBe(svc.DEFAULTS.colors.text); // default preserved
  });
});

describe('orgProfileService fallback', () => {
  test('falls back to built-in defaults when the table is missing', async () => {
    dao.getActiveOrgProfile.mockRejectedValue(
      Object.assign(new Error('missing'), { code: 'ORG_PROFILE_TABLE_MISSING' })
    );
    const p = await svc.load({ silent: true });
    expect(p.source).toBe('default');
    expect(p.name).toBe(svc.DEFAULTS.name);
  });
});
