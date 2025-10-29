var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// .wrangler/tmp/bundle-sfkrZu/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// node_modules/unenv/dist/runtime/_internal/utils.mjs
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
__name(PerformanceEntry, "PerformanceEntry");
var PerformanceMark = /* @__PURE__ */ __name(class PerformanceMark2 extends PerformanceEntry {
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
}, "PerformanceMark");
var PerformanceMeasure = class extends PerformanceEntry {
  entryType = "measure";
};
__name(PerformanceMeasure, "PerformanceMeasure");
var PerformanceResourceTiming = class extends PerformanceEntry {
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
__name(PerformanceResourceTiming, "PerformanceResourceTiming");
var PerformanceObserverEntryList = class {
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
__name(PerformanceObserverEntryList, "PerformanceObserverEntryList");
var Performance = class {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
__name(Performance, "Performance");
var PerformanceObserver = class {
  __unenv__ = true;
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
__name(PerformanceObserver, "PerformanceObserver");
__publicField(PerformanceObserver, "supportedEntryTypes", []);
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now2 = Date.now();
  const seconds = Math.trunc(now2 / 1e3);
  const nanos = now2 % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
import { Socket } from "node:net";
var ReadStream = class extends Socket {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  isRaw = false;
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
  isTTY = false;
};
__name(ReadStream, "ReadStream");

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
import { Socket as Socket2 } from "node:net";
var WriteStream = class extends Socket2 {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  columns = 80;
  rows = 24;
  isTTY = false;
};
__name(WriteStream, "WriteStream");

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class extends EventEmitter {
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return "";
  }
  get versions() {
    return {};
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  ref() {
  }
  unref() {
  }
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: () => 0 });
  mainModule = void 0;
  domain = void 0;
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};
__name(Process, "Process");

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var { exit, platform, nextTick } = getBuiltinModule(
  "node:process"
);
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  nextTick
});
var {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  finalization,
  features,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  on,
  off,
  once,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// src/server/db/client.ts
var getDatabase = /* @__PURE__ */ __name((env2) => env2.PARTY_DB, "getDatabase");

// src/server/db/repositories.ts
var QuestionRepository = class {
  constructor(db) {
    this.db = db;
  }
  async listByQuiz(quizId) {
    const stmt = this.db.prepare(
      `SELECT id, quiz_id, text, order_index, time_limit_sec, reveal_duration_sec, created_at, updated_at
         FROM questions
         WHERE quiz_id = ?
         ORDER BY order_index ASC`
    ).bind(quizId);
    const { results } = await stmt.all();
    return results;
  }
  async getChoices(questionId) {
    const stmt = this.db.prepare(
      `SELECT id, question_id, text, is_correct, created_at, updated_at
         FROM choices
         WHERE question_id = ?
         ORDER BY id`
    ).bind(questionId);
    const { results } = await stmt.all();
    return results;
  }
  async createQuestion(record, choices) {
    await this.db.prepare(
      `INSERT INTO questions (id, quiz_id, text, order_index, time_limit_sec, reveal_duration_sec, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      record.id,
      record.quiz_id,
      record.text,
      record.order_index,
      record.time_limit_sec,
      record.reveal_duration_sec,
      record.created_at,
      record.updated_at
    ).run();
    for (const choice of choices) {
      await this.db.prepare(
        `INSERT INTO choices (id, question_id, text, is_correct, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        choice.id,
        choice.question_id,
        choice.text,
        choice.is_correct,
        choice.created_at,
        choice.updated_at
      ).run();
    }
  }
};
__name(QuestionRepository, "QuestionRepository");
var AnswerRepository = class {
  constructor(db) {
    this.db = db;
  }
  async recordAnswer(record) {
    await this.db.prepare(
      `INSERT INTO answers (id, session_id, question_id, user_id, choice_id, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(session_id, question_id, user_id)
         DO UPDATE SET choice_id = excluded.choice_id, submitted_at = excluded.submitted_at`
    ).bind(
      record.id,
      record.session_id,
      record.question_id,
      record.user_id,
      record.choice_id,
      record.submitted_at
    ).run();
  }
  async listBySession(sessionId) {
    const stmt = this.db.prepare(
      `SELECT id, session_id, question_id, user_id, choice_id, submitted_at
         FROM answers
         WHERE session_id = ?`
    ).bind(sessionId);
    const { results } = await stmt.all();
    return results;
  }
};
__name(AnswerRepository, "AnswerRepository");

// workers/index.ts
var workers_default = {
  async fetch(request, env2, _ctx) {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") === "websocket" && url.pathname.startsWith("/ws/sessions/")) {
      return handleSessionWebSocket(request, env2);
    }
    if (url.pathname === "/healthz") {
      return new Response("ok", { status: 200 });
    }
    if (url.pathname.startsWith("/api/sessions/")) {
      return handleSessionApi(request, env2);
    }
    return new Response("Not Found", { status: 404 });
  }
};
async function handleSessionApi(request, env2) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 3) {
    return new Response(JSON.stringify({ error: { code: "invalid_path", message: "Missing session segment" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }
  const sessionId = segments[2];
  const action = segments[3] ?? "state";
  const stub = getSessionStub(env2, sessionId);
  const requestInit = {
    method: request.method,
    headers: request.headers,
    body: request.body
  };
  const targetUrl = new URL(url.toString());
  targetUrl.pathname = `/${action}`;
  return await stub.fetch(targetUrl.toString(), requestInit);
}
__name(handleSessionApi, "handleSessionApi");
var getSessionStub = /* @__PURE__ */ __name((env2, sessionId) => {
  const id = env2.QUIZ_ROOM_DO.idFromName(sessionId);
  return env2.QUIZ_ROOM_DO.get(id);
}, "getSessionStub");
async function handleSessionWebSocket(request, env2) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 3) {
    return new Response("Missing session id", { status: 400 });
  }
  const sessionId = segments[2];
  const stub = getSessionStub(env2, sessionId);
  const forwardUrl = new URL(`/ws/${sessionId}${url.search}`, "https://do.internal");
  const forwarded = new Request(forwardUrl.toString(), request);
  return await stub.fetch(forwarded);
}
__name(handleSessionWebSocket, "handleSessionWebSocket");
function now() {
  return Date.now();
}
__name(now, "now");
var DEFAULT_REVEAL_DURATION_MS = 5e3;
var workerLog = /* @__PURE__ */ __name((...args) => {
  console.log("[QuizRoom]", ...args);
}, "workerLog");
var workerError = /* @__PURE__ */ __name((...args) => {
  console.error("[QuizRoom]", ...args);
}, "workerError");
var QuizRoomDurableObject = class {
  state;
  env;
  snapshot;
  connections = /* @__PURE__ */ new Map();
  questions = [];
  alarmMeta = null;
  constructor(state, env2) {
    this.state = state;
    this.env = env2;
    this.snapshot = {
      sessionId: "",
      quizId: "",
      status: "idle",
      questionIndex: -1,
      currentQuestionId: null,
      questionStartedAt: null,
      questionDeadline: null,
      autoProgress: true,
      participants: {},
      pendingResults: {}
    };
    this.state.blockConcurrencyWhile(async () => {
      const [storedSession, storedQuestions, storedAlarm] = await Promise.all([
        this.state.storage.get("session"),
        this.state.storage.get("questions"),
        this.state.storage.get("alarm_meta")
      ]);
      if (storedSession) {
        this.snapshot = storedSession;
        this.snapshot.currentQuestionId ??= null;
        this.snapshot.pendingResults ??= {};
        this.snapshot.participants ??= {};
        this.snapshot.autoProgress ??= true;
        for (const participant of Object.values(this.snapshot.participants)) {
          participant.answers ??= {};
        }
        workerLog("Restored session snapshot", {
          sessionId: this.snapshot.sessionId,
          status: this.snapshot.status,
          questionIndex: this.snapshot.questionIndex
        });
      }
      if (storedQuestions) {
        this.questions = storedQuestions.map((question) => ({
          ...question,
          revealDurationSec: question.revealDurationSec ?? DEFAULT_REVEAL_DURATION_MS / 1e3
        }));
        workerLog("Restored question cache", { count: this.questions.length });
      }
      if (storedAlarm) {
        this.alarmMeta = storedAlarm;
        await this.state.storage.setAlarm(storedAlarm.scheduledAt);
        workerLog("Restored pending alarm", storedAlarm);
      }
    });
  }
  async fetch(request) {
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }
    const url = new URL(request.url);
    workerLog("HTTP request", { method: request.method, pathname: url.pathname });
    switch (url.pathname) {
      case "/initialize":
        return this.handleInitializeRequest(request);
      case "/state":
        return this.handleStateRequest();
      case "/start":
        return this.handleStartRequest();
      case "/advance":
        return this.handleAdvanceRequest(request);
      case "/cancel":
        return this.handleCancelRequest();
      default:
        workerError("Unknown DO endpoint", { method: request.method, pathname: url.pathname });
        return new Response(JSON.stringify({ error: { code: "not_found", message: "Unknown DO endpoint" } }), {
          status: 404,
          headers: { "content-type": "application/json" }
        });
    }
  }
  async handleInitializeRequest(request) {
    const payload = await safeJson(request);
    const sessionId = typeof payload?.sessionId === "string" ? payload.sessionId : void 0;
    const quizId = typeof payload?.quizId === "string" ? payload.quizId : void 0;
    const autoProgressPayload = typeof payload?.autoProgress === "boolean" ? payload.autoProgress : void 0;
    if (!sessionId || !quizId) {
      workerError("Initialize payload missing identifiers", { sessionId, quizId });
      return new Response(
        JSON.stringify({ error: { code: "invalid_payload", message: "sessionId and quizId are required" } }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    if (this.snapshot.sessionId && this.snapshot.sessionId !== sessionId) {
      workerError("Initialize conflict", {
        currentSessionId: this.snapshot.sessionId,
        requestedSessionId: sessionId
      });
      return new Response(
        JSON.stringify({ error: { code: "session_conflict", message: "Session already bound to another ID" } }),
        { status: 409, headers: { "content-type": "application/json" } }
      );
    }
    const db = getDatabase(this.env);
    const questionRepo = new QuestionRepository(db);
    const questionRecords = await questionRepo.listByQuiz(quizId);
    if (questionRecords.length === 0) {
      workerError("Quiz has no questions", { quizId });
      return new Response(
        JSON.stringify({ error: { code: "quiz_empty", message: "Quiz has no questions" } }),
        { status: 422, headers: { "content-type": "application/json" } }
      );
    }
    workerLog("Initializing session", {
      sessionId,
      quizId,
      questionCount: questionRecords.length,
      autoProgress: autoProgressPayload
    });
    const questions = [];
    let order = 0;
    for (const record of questionRecords) {
      const choices = await questionRepo.getChoices(record.id);
      questions.push({
        id: record.id,
        orderIndex: order,
        text: record.text,
        timeLimitSec: record.time_limit_sec,
        revealDurationSec: record.reveal_duration_sec ?? DEFAULT_REVEAL_DURATION_MS / 1e3,
        choices: choices.map((choice) => ({
          id: choice.id,
          text: choice.text,
          isCorrect: choice.is_correct === 1
        }))
      });
      order += 1;
    }
    this.snapshot.sessionId = sessionId;
    this.snapshot.quizId = quizId;
    this.snapshot.status = "lobby";
    this.snapshot.questionIndex = -1;
    this.snapshot.currentQuestionId = null;
    this.snapshot.questionStartedAt = null;
    this.snapshot.questionDeadline = null;
    this.snapshot.pendingResults = {};
    if (typeof autoProgressPayload === "boolean") {
      this.snapshot.autoProgress = autoProgressPayload;
    }
    this.questions = questions;
    await this.persistState();
    await this.setAlarmMetadata(null);
    workerLog("Session initialized", {
      sessionId: this.snapshot.sessionId,
      quizId: this.snapshot.quizId,
      autoProgress: this.snapshot.autoProgress,
      questionCount: this.questions.length
    });
    return new Response(null, { status: 202 });
  }
  async handleStateRequest() {
    return new Response(JSON.stringify(this.snapshot), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
  async handleStartRequest() {
    if (!this.snapshot.sessionId) {
      workerError("Start requested before initialization");
      return new Response(
        JSON.stringify({ error: { code: "session_not_initialized", message: "Initialize the session first" } }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    if (this.questions.length === 0) {
      workerError("Start requested with empty question list", { sessionId: this.snapshot.sessionId });
      return new Response(
        JSON.stringify({ error: { code: "quiz_empty", message: "No questions available" } }),
        { status: 412, headers: { "content-type": "application/json" } }
      );
    }
    if (this.snapshot.status !== "lobby" && this.snapshot.status !== "idle") {
      workerError("Start request in invalid state", {
        sessionId: this.snapshot.sessionId,
        status: this.snapshot.status
      });
      return new Response(JSON.stringify({ error: { code: "session_conflict", message: "Session already started" } }), {
        status: 409,
        headers: { "content-type": "application/json" }
      });
    }
    workerLog("Starting quiz", {
      sessionId: this.snapshot.sessionId,
      totalQuestions: this.questions.length
    });
    await this.startQuestion(0);
    workerLog("Quiz started", { sessionId: this.snapshot.sessionId });
    return new Response(null, { status: 202 });
  }
  async handleAdvanceRequest(request) {
    if (!this.snapshot.sessionId) {
      workerError("Advance requested before initialization");
      return new Response(JSON.stringify({ error: { code: "session_not_initialized", message: "Session not initialized" } }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }
    const payload = await safeJson(request);
    const action = payload?.action ?? "next";
    workerLog("Advance request", {
      sessionId: this.snapshot.sessionId,
      status: this.snapshot.status,
      action,
      questionIndex: this.snapshot.questionIndex,
      payload
    });
    switch (action) {
      case "next":
        if (this.snapshot.status === "question") {
          await this.finishCurrentQuestion({ skipAutoProgress: true });
        }
        if (this.hasNextQuestion()) {
          await this.startQuestion(this.snapshot.questionIndex + 1);
        } else {
          await this.finalizeQuiz();
        }
        break;
      case "skip":
        if (typeof payload?.questionIndex === "number") {
          if (this.snapshot.status === "question") {
            await this.finishCurrentQuestion({ skipAutoProgress: true });
          }
          if (!this.getQuestion(payload.questionIndex)) {
            workerError("Skip action out of range", {
              requestedIndex: payload.questionIndex,
              total: this.questions.length
            });
            return new Response(
              JSON.stringify({ error: { code: "invalid_action", message: "Question index out of range" } }),
              { status: 400, headers: { "content-type": "application/json" } }
            );
          }
          workerLog("Skipping to question", {
            sessionId: this.snapshot.sessionId,
            targetIndex: payload.questionIndex
          });
          await this.startQuestion(payload.questionIndex);
        } else {
          workerError("Skip action missing index");
          return new Response(
            JSON.stringify({ error: { code: "invalid_payload", message: "questionIndex is required for skip" } }),
            { status: 400, headers: { "content-type": "application/json" } }
          );
        }
        break;
      case "forceEnd":
        workerLog("Force ending current question", {
          sessionId: this.snapshot.sessionId,
          questionIndex: this.snapshot.questionIndex
        });
        await this.finishCurrentQuestion();
        break;
      default:
        workerError("Advance action unknown", { action });
        return new Response(JSON.stringify({ error: { code: "invalid_action", message: `Unknown action: ${action}` } }), {
          status: 400,
          headers: { "content-type": "application/json" }
        });
    }
    workerLog("Advance request processed", {
      sessionId: this.snapshot.sessionId,
      currentIndex: this.snapshot.questionIndex,
      status: this.snapshot.status
    });
    return new Response(null, { status: 202 });
  }
  async handleCancelRequest() {
    workerLog("Cancel request", { sessionId: this.snapshot.sessionId });
    await this.finalizeQuiz();
    workerLog("Session cancelled", { sessionId: this.snapshot.sessionId });
    return new Response(null, { status: 202 });
  }
  handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const connectionId = crypto.randomUUID();
    const context2 = { id: connectionId, socket: server };
    try {
      const url = new URL(request.url);
      workerLog("WebSocket upgrade", { pathname: url.pathname, search: url.search });
    } catch {
      workerLog("WebSocket upgrade", { url: request.url });
    }
    server.accept();
    server.addEventListener("message", (event) => this.onMessage(context2, event));
    server.addEventListener("close", () => this.onClose(context2));
    server.addEventListener("error", () => this.onClose(context2));
    this.connections.set(connectionId, context2);
    workerLog("WebSocket connection accepted", {
      connectionId,
      totalConnections: this.connections.size
    });
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
  async onMessage(context2, event) {
    const data = event.data;
    if (typeof data !== "string") {
      this.sendError(context2, "invalid_payload", "Messages must be JSON strings");
      workerError("Non-string message received", { connectionId: context2.id });
      return;
    }
    let message;
    try {
      message = JSON.parse(data);
    } catch (error3) {
      this.sendError(context2, "invalid_json", "Unable to parse message JSON");
      workerError("Failed to parse message JSON", { connectionId: context2.id, data, error: error3 });
      return;
    }
    workerLog("Message received", {
      connectionId: context2.id,
      role: context2.role,
      type: message.type
    });
    switch (message.type) {
      case "join_session":
        await this.handleJoinSession(context2, message);
        break;
      case "request_sync":
        this.handleSyncRequest(context2);
        break;
      case "submit_answer":
        await this.handleSubmitAnswer(context2, message);
        break;
      case "heartbeat":
        this.handleHeartbeat(context2);
        break;
      case "admin_control":
        await this.handleAdminControl(context2, message);
        break;
      default:
        this.sendError(context2, "unknown_type", `Unsupported message type: ${message.type}`);
    }
  }
  async handleJoinSession(context2, message) {
    context2.role = message.role;
    context2.userId = message.userId;
    workerLog("Join session", {
      connectionId: context2.id,
      sessionId: message.sessionId,
      role: message.role,
      userId: message.userId
    });
    if (!this.snapshot.sessionId) {
      this.snapshot.sessionId = message.sessionId;
    }
    if (message.role === "participant" && message.userId) {
      const participant = this.snapshot.participants[message.userId] ?? {
        userId: message.userId,
        displayName: message.displayName ?? message.userId,
        connected: true,
        lastSeen: now(),
        answers: {}
      };
      participant.connected = true;
      participant.lastSeen = now();
      participant.displayName = message.displayName ?? participant.displayName;
      participant.answers ??= {};
      this.snapshot.participants[message.userId] = participant;
      await this.persistState();
      workerLog("Participant joined", {
        sessionId: this.snapshot.sessionId,
        userId: message.userId,
        displayName: participant.displayName
      });
    }
    if (message.role === "admin") {
      await this.persistState();
      workerLog("Admin connected", {
        sessionId: this.snapshot.sessionId,
        connectionId: context2.id
      });
    }
    this.handleSyncRequest(context2);
  }
  handleSyncRequest(context2) {
    if (!context2.socket || context2.socket.readyState !== 1) {
      workerError("Sync request skipped due to socket state", {
        connectionId: context2.id,
        readyState: context2.socket?.readyState
      });
      return;
    }
    workerLog("Syncing session state", {
      connectionId: context2.id,
      role: context2.role,
      sessionId: this.snapshot.sessionId
    });
    const participants = Object.values(this.snapshot.participants);
    const payload = {
      status: this.snapshot.status,
      quizId: this.snapshot.quizId,
      questionIndex: this.snapshot.questionIndex,
      questionDeadline: this.snapshot.questionDeadline,
      autoProgress: this.snapshot.autoProgress,
      participants
    };
    this.send(context2, { type: "session_ready", sessionId: this.snapshot.sessionId, timestamp: now(), ...payload });
    const currentQuestion = this.getCurrentQuestion();
    if (this.snapshot.status === "question" && currentQuestion) {
      const questionPayload = {
        questionIndex: this.snapshot.questionIndex,
        deadline: this.snapshot.questionDeadline,
        question: this.toParticipantQuestion(currentQuestion)
      };
      this.send(context2, { type: "question_start", sessionId: this.snapshot.sessionId, timestamp: now(), ...questionPayload });
    }
    if (this.snapshot.status === "reveal" && currentQuestion) {
      const summary = this.snapshot.pendingResults[currentQuestion.id];
      this.send(context2, {
        type: "question_end",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        questionIndex: this.snapshot.questionIndex
      });
      if (summary) {
        const summaryPayload = {
          questionIndex: this.snapshot.questionIndex,
          totals: summary.totals,
          correctChoiceIds: summary.correctChoiceIds
        };
        this.send(context2, { type: "question_summary", sessionId: this.snapshot.sessionId, timestamp: now(), ...summaryPayload });
      }
    }
    if (context2.role === "admin") {
      const adminPayload = {
        ...payload,
        questionStartedAt: this.snapshot.questionStartedAt,
        pendingResults: this.snapshot.pendingResults,
        questions: this.questions
      };
      this.send(context2, { type: "admin_session_state", sessionId: this.snapshot.sessionId, timestamp: now(), ...adminPayload });
    }
  }
  async handleSubmitAnswer(context2, message) {
    if (context2.role !== "participant" || !context2.userId) {
      this.sendError(context2, "not_authorized", "Submit answer allowed for participants only");
      workerError("Answer submission rejected: unauthorized", {
        connectionId: context2.id,
        role: context2.role
      });
      return;
    }
    const participant = this.snapshot.participants[context2.userId];
    if (!participant) {
      this.sendError(context2, "not_registered", "Participant not registered in session");
      workerError("Answer submission rejected: participant not registered", {
        sessionId: this.snapshot.sessionId,
        userId: context2.userId
      });
      return;
    }
    if (this.snapshot.status !== "question") {
      this.sendError(context2, "answer_closed", "Answer window closed");
      workerError("Answer submission outside active question", {
        sessionId: this.snapshot.sessionId,
        userId: context2.userId,
        status: this.snapshot.status
      });
      return;
    }
    const question = this.getCurrentQuestion();
    if (!question || question.id !== message.questionId) {
      this.sendError(context2, "invalid_action", "Question does not match current state");
      workerError("Answer submission for non-current question", {
        sessionId: this.snapshot.sessionId,
        userId: context2.userId,
        messageQuestionId: message.questionId,
        currentQuestionId: question?.id
      });
      return;
    }
    const correctChoiceIds = question.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id);
    const isCorrect = correctChoiceIds.includes(message.choiceId);
    const submittedAt = now();
    workerLog("Answer submitted", {
      sessionId: this.snapshot.sessionId,
      userId: context2.userId,
      questionId: question.id,
      choiceId: message.choiceId,
      isCorrect
    });
    participant.answers ??= {};
    participant.answers[question.id] = {
      choiceId: message.choiceId,
      submittedAt,
      isCorrect
    };
    participant.lastSeen = submittedAt;
    this.snapshot.participants[context2.userId] = participant;
    await this.persistState();
    const answerRepo = new AnswerRepository(getDatabase(this.env));
    await answerRepo.recordAnswer({
      id: crypto.randomUUID(),
      session_id: this.snapshot.sessionId,
      question_id: question.id,
      user_id: context2.userId,
      choice_id: message.choiceId,
      submitted_at: new Date(submittedAt).toISOString()
    });
    this.send(context2, {
      type: "answer_result",
      sessionId: this.snapshot.sessionId,
      timestamp: submittedAt,
      questionIndex: this.snapshot.questionIndex,
      isCorrect,
      correctChoiceId: correctChoiceIds[0] ?? "",
      choiceId: message.choiceId,
      questionId: question.id,
      userId: context2.userId
    });
  }
  handleHeartbeat(context2) {
    if (!context2.userId) {
      return;
    }
    const participant = this.snapshot.participants[context2.userId];
    if (!participant) {
      return;
    }
    participant.lastSeen = now();
  }
  async handleAdminControl(context2, message) {
    if (context2.role !== "admin") {
      this.sendError(context2, "not_authorized", "Admin control requires admin role");
      workerError("Admin control rejected: unauthorized", {
        connectionId: context2.id,
        action: message.action
      });
      return;
    }
    workerLog("Admin control", {
      sessionId: this.snapshot.sessionId,
      action: message.action,
      questionIndex: message.questionIndex
    });
    switch (message.action) {
      case "startQuiz":
        await this.relayControlResponse(await this.handleStartRequest(), context2);
        break;
      case "forceEndQuestion":
        await this.relayControlResponse(
          await this.handleAdvanceRequest(
            new Request("https://do/internal", { method: "POST", body: JSON.stringify({ action: "forceEnd" }), headers: { "content-type": "application/json" } })
          ),
          context2
        );
        break;
      case "skipToQuestion":
        await this.relayControlResponse(
          await this.handleAdvanceRequest(
            new Request("https://do/internal", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ action: "skip", questionIndex: message.questionIndex })
            })
          ),
          context2
        );
        break;
      default:
        this.sendError(context2, "invalid_action", `Unsupported admin action: ${message.action}`);
        workerError("Unsupported admin action", { action: message.action });
    }
  }
  onClose(context2) {
    this.connections.delete(context2.id);
    workerLog("Connection closed", {
      connectionId: context2.id,
      role: context2.role,
      remainingConnections: this.connections.size
    });
    if (context2.role === "participant" && context2.userId) {
      const participant = this.snapshot.participants[context2.userId];
      if (participant) {
        participant.connected = false;
        participant.lastSeen = now();
      }
    }
  }
  async persistState() {
    await Promise.all([
      this.state.storage.put("session", this.snapshot),
      this.state.storage.put("questions", this.questions)
    ]);
  }
  send(context2, payload) {
    if (context2.socket.readyState === 1) {
      context2.socket.send(JSON.stringify(payload));
    }
  }
  sendError(context2, code, message) {
    this.send(context2, { type: "error", code, message, sessionId: this.snapshot.sessionId, timestamp: now() });
  }
  broadcast(payload, audience = "all") {
    for (const connection of this.connections.values()) {
      if (audience === "all" || connection.role === audience) {
        this.send(connection, payload);
      }
    }
  }
  toParticipantQuestion(question) {
    return {
      id: question.id,
      text: question.text,
      choices: question.choices.map((choice) => ({ id: choice.id, text: choice.text }))
    };
  }
  getQuestion(index) {
    if (index < 0 || index >= this.questions.length) {
      return void 0;
    }
    return this.questions[index];
  }
  getCurrentQuestion() {
    return this.getQuestion(this.snapshot.questionIndex);
  }
  hasNextQuestion() {
    return this.snapshot.questionIndex + 1 < this.questions.length;
  }
  async startQuestion(index) {
    const question = this.getQuestion(index);
    if (!question) {
      await this.finalizeQuiz();
      return;
    }
    await this.setAlarmMetadata(null);
    this.snapshot.status = "question";
    this.snapshot.questionIndex = index;
    this.snapshot.currentQuestionId = question.id;
    this.snapshot.questionStartedAt = now();
    this.snapshot.questionDeadline = question.timeLimitSec > 0 ? this.snapshot.questionStartedAt + question.timeLimitSec * 1e3 : null;
    delete this.snapshot.pendingResults[question.id];
    workerLog("Question started", {
      sessionId: this.snapshot.sessionId,
      questionIndex: index,
      questionId: question.id,
      timeLimitSec: question.timeLimitSec,
      revealDurationSec: question.revealDurationSec,
      deadline: this.snapshot.questionDeadline
    });
    await this.persistState();
    if (this.snapshot.questionDeadline) {
      await this.setAlarmMetadata({
        type: "question_deadline",
        questionIndex: index,
        scheduledAt: this.snapshot.questionDeadline
      });
    }
    this.broadcastQuestionStart(question);
  }
  async finishCurrentQuestion(options = {}) {
    const { skipAutoProgress = false } = options;
    if (this.snapshot.status !== "question") {
      workerLog("finishCurrentQuestion called outside question phase", {
        status: this.snapshot.status,
        sessionId: this.snapshot.sessionId
      });
      return;
    }
    const question = this.getCurrentQuestion();
    if (!question) {
      await this.finalizeQuiz();
      return;
    }
    await this.setAlarmMetadata(null);
    const summary = this.computeSummary(question);
    this.snapshot.status = "reveal";
    this.snapshot.questionDeadline = null;
    this.snapshot.pendingResults[question.id] = summary;
    workerLog("Question finished", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex,
      questionId: question.id,
      skipAutoProgress,
      totals: summary.totals,
      correctChoices: summary.correctChoiceIds
    });
    await this.persistState();
    this.broadcastQuestionEnd(question, summary);
    if (!skipAutoProgress && this.snapshot.autoProgress) {
      const revealDelayMs = Math.max(
        0,
        (question.revealDurationSec ?? DEFAULT_REVEAL_DURATION_MS / 1e3) * 1e3
      );
      if (this.hasNextQuestion()) {
        if (revealDelayMs === 0) {
          workerLog("Auto-progressing immediately to next question", {
            sessionId: this.snapshot.sessionId,
            nextIndex: this.snapshot.questionIndex + 1
          });
          await this.startQuestion(this.snapshot.questionIndex + 1);
        } else {
          await this.setAlarmMetadata({
            type: "reveal_to_next",
            questionIndex: this.snapshot.questionIndex,
            scheduledAt: now() + revealDelayMs
          });
          workerLog("Scheduled auto-progress", {
            sessionId: this.snapshot.sessionId,
            delayMs: revealDelayMs,
            nextIndex: this.snapshot.questionIndex + 1
          });
        }
      }
    }
  }
  computeSummary(question) {
    const totals = {};
    for (const participant of Object.values(this.snapshot.participants)) {
      const answer = participant.answers?.[question.id];
      if (!answer) {
        continue;
      }
      totals[answer.choiceId] = (totals[answer.choiceId] ?? 0) + 1;
    }
    const correctChoiceIds = question.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id);
    return {
      questionId: question.id,
      totals,
      correctChoiceIds
    };
  }
  async finalizeQuiz() {
    await this.setAlarmMetadata(null);
    this.snapshot.status = "finished";
    this.snapshot.questionDeadline = null;
    this.snapshot.currentQuestionId = null;
    await this.persistState();
    workerLog("Quiz finalized", { sessionId: this.snapshot.sessionId });
    this.broadcast({ type: "quiz_finish", sessionId: this.snapshot.sessionId, timestamp: now() }, "all");
  }
  broadcastQuestionStart(question) {
    const payload = {
      questionIndex: this.snapshot.questionIndex,
      deadline: this.snapshot.questionDeadline,
      question: this.toParticipantQuestion(question)
    };
    workerLog("Broadcasting question_start", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex
    });
    this.broadcast({ type: "question_start", sessionId: this.snapshot.sessionId, timestamp: now(), ...payload }, "all");
  }
  broadcastQuestionEnd(question, summary) {
    workerLog("Broadcasting question_end", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex
    });
    this.broadcast(
      { type: "question_end", sessionId: this.snapshot.sessionId, timestamp: now(), questionIndex: this.snapshot.questionIndex },
      "all"
    );
    workerLog("Broadcasting question_summary", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex,
      totals: summary.totals
    });
    this.broadcast(
      {
        type: "question_summary",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        questionIndex: this.snapshot.questionIndex,
        totals: summary.totals,
        correctChoiceIds: summary.correctChoiceIds
      },
      "all"
    );
  }
  async relayControlResponse(response, context2) {
    if (response.status < 400) {
      return;
    }
    let message = `Action failed (status ${response.status})`;
    try {
      const data = await response.clone().json();
      message = data.error?.message ?? message;
    } catch {
      try {
        const text = await response.clone().text();
        if (text) {
          message = text;
        }
      } catch {
      }
    }
    workerError("Admin control action failed", {
      sessionId: this.snapshot.sessionId,
      status: response.status,
      message
    });
    this.sendError(context2, "action_failed", message);
  }
  async setAlarmMetadata(meta) {
    this.alarmMeta = meta;
    const setAlarm = this.state.storage.setAlarm;
    if (meta) {
      await this.state.storage.put("alarm_meta", meta);
      await setAlarm(meta.scheduledAt);
      workerLog("Alarm scheduled", meta);
    } else {
      await this.state.storage.delete("alarm_meta");
      await setAlarm();
      workerLog("Alarm cleared", { sessionId: this.snapshot.sessionId });
    }
  }
  async alarm() {
    const meta = this.alarmMeta ?? await this.state.storage.get("alarm_meta");
    if (!meta) {
      workerLog("Alarm triggered with no metadata", { sessionId: this.snapshot.sessionId });
      return;
    }
    await this.setAlarmMetadata(null);
    workerLog("Alarm firing", {
      sessionId: this.snapshot.sessionId,
      meta,
      status: this.snapshot.status,
      questionIndex: this.snapshot.questionIndex
    });
    switch (meta.type) {
      case "question_deadline":
        if (this.snapshot.status === "question" && this.snapshot.questionIndex === meta.questionIndex) {
          await this.finishCurrentQuestion();
        }
        break;
      case "reveal_to_next":
        if (this.snapshot.status === "reveal" && this.hasNextQuestion()) {
          await this.startQuestion(this.snapshot.questionIndex + 1);
        } else if (!this.hasNextQuestion()) {
          await this.finalizeQuiz();
        }
        break;
      default:
        break;
    }
  }
};
__name(QuizRoomDurableObject, "QuizRoomDurableObject");
async function safeJson(request) {
  const text = await request.text();
  if (!text) {
    workerLog("safeJson received empty body", {});
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error3) {
    workerError("safeJson failed to parse body", { error: error3 });
    return null;
  }
}
__name(safeJson, "safeJson");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-sfkrZu/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = workers_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-sfkrZu/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  QuizRoomDurableObject,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
