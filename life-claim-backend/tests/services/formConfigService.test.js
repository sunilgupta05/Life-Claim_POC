// formConfigService — per-form override resolution (roadmap 2.3).
const svc = require('../../src/services/formConfigService');

describe('formConfigService.getFormConfig', () => {
  test('maps overrides, distinguishing required null (inherit) from booleans', () => {
    svc.__setSnapshotForTests([
      { FORM_KEY: 'f1', FIELD_NAME: 'a', IS_VISIBLE: 0, IS_REQUIRED: null },
      { FORM_KEY: 'f1', FIELD_NAME: 'b', IS_VISIBLE: 1, IS_REQUIRED: 1 },
      { FORM_KEY: 'f2', FIELD_NAME: 'c', IS_VISIBLE: 1, IS_REQUIRED: 0 },
    ]);
    expect(svc.getFormConfig('f1')).toEqual({
      a: { visible: false, required: null },
      b: { visible: true, required: true },
    });
    expect(svc.getFormConfig('f2').c).toEqual({ visible: true, required: false });
    expect(svc.getFormConfig('none')).toEqual({});
  });

  test('getAllForms groups overrides by form', () => {
    svc.__setSnapshotForTests([{ FORM_KEY: 'f1', FIELD_NAME: 'a', IS_VISIBLE: 1, IS_REQUIRED: null }]);
    expect(svc.getAllForms()).toEqual({ f1: { a: { visible: true, required: null } } });
  });

  test('empty snapshot ⇒ no overrides (base schema applies on the frontend)', () => {
    svc.__setSnapshotForTests([]);
    expect(svc.getFormConfig('f1')).toEqual({});
    expect(svc.getAllForms()).toEqual({});
  });
});
