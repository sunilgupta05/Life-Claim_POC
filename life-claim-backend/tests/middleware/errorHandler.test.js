// tests/middleware/errorHandler.test.js
//
// Centralized error handling (roadmap 3.3): classify() maps common errors to the
// right HTTP semantics, and errorHandler() emits the stable
// { message, code, requestId } shape while hiding internals for 5xx.

process.env.LOG_TO_FILE = 'false';

const { classify, errorHandler, notFoundHandler } = require('../../src/middleware/errorHandler');
const { AppError, NotFoundError, ValidationError } = require('../../src/errors/AppError');

function mockRes() {
  return {
    statusCode: 200,
    headersSent: false,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    setHeader() {},
    on() {},
  };
}
const req = (over = {}) => ({ method: 'GET', originalUrl: '/api/x', path: '/api/x', id: 'req-1', ...over });

describe('classify()', () => {
  test('AppError keeps its status/code/expose', () => {
    const c = classify(new NotFoundError('nope'));
    expect(c).toMatchObject({ status: 404, code: 'NOT_FOUND', expose: true, message: 'nope' });
  });

  test('422 ValidationError', () => {
    expect(classify(new ValidationError('bad')).status).toBe(422);
  });

  test('malformed JSON body -> 400 BAD_JSON', () => {
    const err = new SyntaxError('Unexpected token');
    err.type = 'entity.parse.failed';
    expect(classify(err)).toMatchObject({ status: 400, code: 'BAD_JSON', expose: true });
  });

  test('open circuit breaker -> 503', () => {
    const err = new Error('Breaker is open');
    err.code = 'EOPENBREAKER';
    expect(classify(err).status).toBe(503);
  });

  test('upstream timeout -> 504', () => {
    const err = new Error('timeout'); err.code = 'ECONNABORTED';
    expect(classify(err).status).toBe(504);
  });

  test('connection refused -> 502', () => {
    const err = new Error('refused'); err.code = 'ECONNREFUSED';
    expect(classify(err).status).toBe(502);
  });

  test('legacy err.status is honoured', () => {
    const err = new Error('teapot'); err.status = 418;
    expect(classify(err)).toMatchObject({ status: 418, expose: true });
  });

  test('unknown error -> 500, not exposed', () => {
    expect(classify(new Error('kaboom'))).toMatchObject({ status: 500, expose: false });
  });
});

describe('errorHandler()', () => {
  test('4xx returns the real message + code + requestId', () => {
    const res = mockRes();
    errorHandler(new AppError(403, 'Forbidden zone', { code: 'FORBIDDEN' }), req(), res, () => {});
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ message: 'Forbidden zone', code: 'FORBIDDEN', requestId: 'req-1' });
  });

  test('5xx hides the internal message', () => {
    const res = mockRes();
    errorHandler(new Error('secret db string'), req(), res, () => {});
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Internal server error');
    expect(res.body.code).toBe('INTERNAL_ERROR');
    expect(res.body.requestId).toBe('req-1');
  });

  test('delegates when headers already sent', () => {
    const res = mockRes();
    res.headersSent = true;
    const next = jest.fn();
    errorHandler(new Error('late'), req(), res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('notFoundHandler()', () => {
  test('unknown /api route -> JSON 404', () => {
    const res = mockRes();
    notFoundHandler(req({ path: '/api/missing' }), res, () => {});
    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({ code: 'NOT_FOUND' });
  });

  test('non-/api path passes through to next', () => {
    const res = mockRes();
    const next = jest.fn();
    notFoundHandler(req({ path: '/dashboard' }), res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});
