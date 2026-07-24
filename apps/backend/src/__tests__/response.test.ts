/* eslint-disable */

/**
 * __tests__/response.test.ts
 * Unit tests for shared/utils/response.ts helpers.
 * All helpers are pure functions over a res mock — no DB, no network.
 */
import {
  ok, created, noContent, error, badRequest,
  unauthorized, forbidden, notFound, conflict,
  validationError, serverError, paginate,
} from '../shared/utils/response';

/** Build a lightweight Express res mock */
function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.send   = jest.fn().mockReturnValue(res);
  return res;
}

describe('response helpers', () => {
  let res: any;
  beforeEach(() => { res = mockRes(); });

  test('ok() returns 200 with success: true', () => {
    ok(res, { id: 1 }, 'Done');
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: 1 });
    expect(body.message).toBe('Done');
    expect(body.timestamp).toBeDefined();
  });

  test('ok() with no args uses defaults', () => {
    ok(res);
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  test('created() returns 201', () => {
    created(res, { id: 99 });
    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(99);
  });

  test('noContent() returns 204 with no body', () => {
    noContent(res);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test('badRequest() returns 400 with success: false', () => {
    badRequest(res, 'Invalid input');
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toBe('Invalid input');
  });

  test('unauthorized() returns 401', () => {
    unauthorized(res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].success).toBe(false);
  });

  test('forbidden() returns 403', () => {
    forbidden(res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('notFound() returns 404', () => {
    notFound(res, 'User not found');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].message).toBe('User not found');
  });

  test('conflict() returns 409', () => {
    conflict(res, 'Email already taken');
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('validationError() returns 422 with errors array', () => {
    validationError(res, 'Validation failed', [{ field: 'email', message: 'Required' }]);
    expect(res.status).toHaveBeenCalledWith(422);
    const body = res.json.mock.calls[0][0];
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0].field).toBe('email');
  });

  test('serverError() returns 500', () => {
    serverError(res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('error() with custom status code', () => {
    error(res, 'Custom error', 418);
    expect(res.status).toHaveBeenCalledWith(418);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toBe('Custom error');
  });

  test('paginate() returns correct meta', () => {
    const items = [{ id: 1 }, { id: 2 }];
    paginate(res, items, { total: 100, page: 1, limit: 20 });
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.meta.total).toBe(100);
    expect(body.meta.pages).toBe(5);
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(20);
  });

  test('paginate() pre-computed pages is respected', () => {
    paginate(res, [], { total: 10, page: 1, limit: 5, pages: 2 });
    const body = res.json.mock.calls[0][0];
    expect(body.meta.pages).toBe(2);
  });
});
