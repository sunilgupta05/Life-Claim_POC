// Tests the pure parsing/discovery parts of the migration engine (roadmap 0.1)
// without touching a database.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { versionOf, parseMigration, discoverMigrations } = require('../../src/db/migrator');

describe('migrator (pure parsing)', () => {
  let dir;
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mig-test-'));
    fs.writeFileSync(
      path.join(dir, '0001_first.sql'),
      '-- @UP\nCREATE TABLE a (id INT);\n\n-- @DOWN\nDROP TABLE a;\n'
    );
    fs.writeFileSync(
      path.join(dir, '0002_second.sql'),
      '-- @UP\nCREATE TABLE b (id INT);\n\n-- @DOWN\n' // empty DOWN
    );
    fs.writeFileSync(path.join(dir, '.template.sql'), '-- @UP\n\n-- @DOWN\n'); // dotfile, must be ignored
  });
  afterAll(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  describe('versionOf', () => {
    test('extracts the zero-padded leading token', () => {
      expect(versionOf('0001_baseline_schema')).toBe('0001');
      expect(versionOf('0042_add_widget')).toBe('0042');
    });
    test('falls back to the whole name when there is no leading number', () => {
      expect(versionOf('weird_name')).toBe('weird_name');
    });
  });

  describe('parseMigration', () => {
    test('splits @UP / @DOWN and computes a checksum', () => {
      const m = parseMigration(path.join(dir, '0001_first.sql'));
      expect(m.up).toContain('CREATE TABLE a');
      expect(m.down).toContain('DROP TABLE a');
      expect(m.checksum).toMatch(/^[0-9a-f]{64}$/); // sha-256 hex
    });
    test('reports an empty @DOWN section (irreversible migration)', () => {
      const m = parseMigration(path.join(dir, '0002_second.sql'));
      expect(m.up).toContain('CREATE TABLE b');
      expect(m.down).toBe('');
    });
    test('throws when the @UP marker is missing', () => {
      const bad = path.join(dir, '0003_bad.sql');
      fs.writeFileSync(bad, 'CREATE TABLE c (id INT);');
      expect(() => parseMigration(bad)).toThrow(/@UP/);
    });
  });

  describe('discoverMigrations', () => {
    test('lists .sql files in order and ignores dotfiles', () => {
      const found = discoverMigrations(dir).filter((m) => m.name !== '0003_bad');
      const names = found.map((m) => m.name);
      expect(names).toContain('0001_first');
      expect(names).toContain('0002_second');
      expect(names).not.toContain('.template');
      // sorted ascending
      expect(names.indexOf('0001_first')).toBeLessThan(names.indexOf('0002_second'));
    });
    test('returns [] for a non-existent directory', () => {
      expect(discoverMigrations(path.join(dir, 'does-not-exist'))).toEqual([]);
    });
  });
});
