const {
  isSuperUserRole,
  isSuperUserUsername,
  isRetiredAdminUsername,
  hasSuperUserRole,
  hasSuperUserAccess,
} = require('../../src/util/superuserRoles');

describe('superuserRoles', () => {
  describe('isSuperUserRole', () => {
    test.each(['superuser', 'super user', 'super-user', 'SUPER_USER', ' Super User '])(
      'treats %p as a superuser role',
      (role) => expect(isSuperUserRole(role)).toBe(true)
    );
    test.each(['assessor', 'admin', '', null, undefined])(
      'treats %p as NOT a superuser role',
      (role) => expect(isSuperUserRole(role)).toBe(false)
    );
  });

  describe('hasSuperUserRole', () => {
    test('true when the list contains a superuser role', () => {
      expect(hasSuperUserRole(['Assessor', 'superuser'])).toBe(true);
    });
    test('false for empty / non-superuser / non-array input', () => {
      expect(hasSuperUserRole([])).toBe(false);
      expect(hasSuperUserRole(['Assessor'])).toBe(false);
      expect(hasSuperUserRole(null)).toBe(false);
      expect(hasSuperUserRole('superuser')).toBe(false); // string, not array
    });
  });

  describe('username helpers', () => {
    test('isSuperUserUsername matches only "superuser" (case-insensitive)', () => {
      expect(isSuperUserUsername('superuser')).toBe(true);
      expect(isSuperUserUsername('SuperUser')).toBe(true);
      expect(isSuperUserUsername('admin')).toBe(false);
    });
    test('isRetiredAdminUsername flags the legacy admin account', () => {
      expect(isRetiredAdminUsername('admin')).toBe(true);
      expect(isRetiredAdminUsername('superuser')).toBe(false);
    });
  });

  describe('hasSuperUserAccess', () => {
    test('grants via role OR via superuser username', () => {
      expect(hasSuperUserAccess([], 'superuser')).toBe(true);
      expect(hasSuperUserAccess(['super user'], '')).toBe(true);
    });
    test('denies a normal user', () => {
      expect(hasSuperUserAccess(['Assessor'], 'bob')).toBe(false);
    });
  });
});
