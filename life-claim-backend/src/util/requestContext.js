// src/util/requestContext.js
//
// Per-request context (roadmap 3.3/3.4). A single AsyncLocalStorage store carries
// the correlation id (and a few request attributes) through the async call chain
// so ANY code — a deep service, a DAO, the logger — can stamp the current
// request id without threading it through every function signature.
//
// Kept dependency-free (no logger/config import) so both the logger and the
// error handler can require it with no circular dependency.

const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

/** Run `fn` with a fresh context object bound for the duration of the request. */
function run(context, fn) {
  return storage.run(context, fn);
}

/** The current request's context object, or undefined outside a request. */
function getStore() {
  return storage.getStore();
}

/** Current correlation/request id, or undefined outside a request. */
function getRequestId() {
  const store = storage.getStore();
  return store ? store.requestId : undefined;
}

/** Merge fields into the current context (no-op outside a request). */
function set(fields) {
  const store = storage.getStore();
  if (store) Object.assign(store, fields);
}

module.exports = { storage, run, getStore, getRequestId, set };
