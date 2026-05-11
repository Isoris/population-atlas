// tests/_dom_polyfill.mjs
//
// Minimal browser-DOM polyfill shared across the population-atlas smoke
// tests. Mirrors the inline polyfill used by the inversion-atlas smokes
// (e.g. smoke_review_page4_round5.mjs lines 60-105) but extracted to a
// shared module since the population-atlas pages use the SAME shape with
// minor extensions for page8/page9 (FileReader, Blob, URL.createObjectURL,
// localStorage).
//
// Exports:
//   installDom()        — install global document / window / localStorage
//   resetNodes()        — clear the id→node map between test cases
//   ensureNode(id)      — get-or-create a FakeNode by id
//   FakeNode            — the polyfill node class (for type checks)
//   FakeClassList       — the .classList polyfill

export class FakeClassList {
  constructor() { this._set = new Set(); }
  add(c) { this._set.add(c); }
  remove(c) { this._set.delete(c); }
  contains(c) { return this._set.has(c); }
  toggle(c, force) {
    if (force === true)  { this.add(c); return true; }
    if (force === false) { this.remove(c); return false; }
    if (this._set.has(c)) { this.remove(c); return false; }
    this.add(c); return true;
  }
}

export class FakeNode {
  constructor(id) {
    this.id = id;
    this.innerHTML = '';
    this.textContent = '';
    this.style = {
      display: '', background: '', borderColor: '',
      color: '', fontWeight: '', margin: '',
    };
    this.dataset = {};
    this._listeners = {};
    this.value = '';
    this.children = [];
    this.classList = new FakeClassList();
    // File-input shim — _onChangeFile() simulates a user picking a file.
    this.files = null;
  }
  addEventListener(evt, cb) {
    (this._listeners[evt] = this._listeners[evt] || []).push(cb);
  }
  removeEventListener(evt, cb) {
    const list = this._listeners[evt] || [];
    const idx = list.indexOf(cb);
    if (idx >= 0) list.splice(idx, 1);
  }
  dispatchEvent(evt) {
    const list = this._listeners[evt.type] || [];
    for (const cb of list) {
      try { cb({ target: this, ...evt }); } catch (_) {}
    }
  }
  click() {
    const list = this._listeners['click'] || [];
    for (const cb of list) { try { cb({ target: this }); } catch (_) {} }
  }
  appendChild(c) { this.children.push(c); return c; }
  removeChild(c) {
    const idx = this.children.indexOf(c);
    if (idx >= 0) this.children.splice(idx, 1);
    return c;
  }
  remove() { /* a-tag remove() shim used by _bpExportCsv / _fhhExportCsv */ }
  setAttribute(k, v) { this[k] = v; }
  getAttribute(k) { return this[k]; }
  querySelector(sel) {
    if (typeof sel !== 'string' || !sel.startsWith('#')) return null;
    return ensureNode(sel.slice(1));
  }
  querySelectorAll(_) { return []; }
}

const _nodes = new Map();

export function ensureNode(id) {
  if (!_nodes.has(id)) _nodes.set(id, new FakeNode(id));
  return _nodes.get(id);
}

export function resetNodes() { _nodes.clear(); }

class FakeFileReader {
  constructor() { this.onload = null; this.onerror = null; }
  readAsText(blob) {
    // blob is either a real Blob or our shim { _text }
    const text = (blob && typeof blob._text === 'string') ? blob._text :
                 (typeof blob === 'string' ? blob : '');
    setTimeout(() => {
      if (this.onload) this.onload({ target: { result: text } });
    }, 0);
  }
}

class FakeBlob {
  constructor(parts /* , opts */) {
    this._text = (parts || []).join('');
  }
}

class FakeURL {
  static createObjectURL(blob) {
    return 'blob://stub/' + Math.random().toString(36).slice(2);
  }
  static revokeObjectURL(_url) {}
}

class FakeLocalStorage {
  constructor() { this._map = new Map(); }
  getItem(k) { return this._map.has(k) ? this._map.get(k) : null; }
  setItem(k, v) { this._map.set(k, String(v)); }
  removeItem(k) { this._map.delete(k); }
  clear() { this._map.clear(); }
}

/**
 * Install global document, window, localStorage, FileReader, Blob, URL —
 * everything the population-atlas page modules might reach for during
 * mount/render. Idempotent.
 */
export function installDom() {
  globalThis.document = {
    body: ensureNode('body'),
    head: ensureNode('head'),
    getElementById: (id) => ensureNode(id),
    createElement: (tag) => new FakeNode(`<${tag}>`),
    querySelector: (sel) => {
      if (typeof sel !== 'string' || !sel.startsWith('#')) return null;
      return ensureNode(sel.slice(1));
    },
    querySelectorAll: (_) => [],
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  globalThis.window = globalThis;
  globalThis.localStorage = new FakeLocalStorage();
  globalThis.FileReader = FakeFileReader;
  globalThis.Blob = FakeBlob;
  globalThis.URL = FakeURL;
  globalThis.setTimeout = globalThis.setTimeout || ((cb, _) => cb());
  globalThis.requestAnimationFrame = globalThis.requestAnimationFrame || ((cb) => cb());
}
