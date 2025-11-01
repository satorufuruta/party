var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
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
  static {
    __name(this, "PerformanceEntry");
  }
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
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
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
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
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
var Performance = class {
  static {
    __name(this, "Performance");
  }
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
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
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
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
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
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
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
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
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
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
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
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
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
  // --- attached interfaces ---
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
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
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
  // internals
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

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var isWorkerdProcessV2 = globalThis.Cloudflare.compatibilityFlags.enable_nodejs_process_v2;
var unenvProcess = new Process({
  env: globalProcess.env,
  // `hrtime` is only available from workerd process v2
  hrtime: isWorkerdProcessV2 ? workerdProcess.hrtime : hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  // Always implemented by workerd
  env,
  // Only implemented in workerd v2
  hrtime: hrtime3,
  // Always implemented by workerd
  nextTick
} = unenvProcess;
var {
  _channel,
  _disconnect,
  _events,
  _eventsCount,
  _handleQueue,
  _maxListeners,
  _pendingMessage,
  _send,
  assert: assert2,
  disconnect,
  mainModule
} = unenvProcess;
var {
  // @ts-expect-error `_debugEnd` is missing typings
  _debugEnd,
  // @ts-expect-error `_debugProcess` is missing typings
  _debugProcess,
  // @ts-expect-error `_exiting` is missing typings
  _exiting,
  // @ts-expect-error `_fatalException` is missing typings
  _fatalException,
  // @ts-expect-error `_getActiveHandles` is missing typings
  _getActiveHandles,
  // @ts-expect-error `_getActiveRequests` is missing typings
  _getActiveRequests,
  // @ts-expect-error `_kill` is missing typings
  _kill,
  // @ts-expect-error `_linkedBinding` is missing typings
  _linkedBinding,
  // @ts-expect-error `_preload_modules` is missing typings
  _preload_modules,
  // @ts-expect-error `_rawDebug` is missing typings
  _rawDebug,
  // @ts-expect-error `_startProfilerIdleNotifier` is missing typings
  _startProfilerIdleNotifier,
  // @ts-expect-error `_stopProfilerIdleNotifier` is missing typings
  _stopProfilerIdleNotifier,
  // @ts-expect-error `_tickCallback` is missing typings
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  availableMemory,
  // @ts-expect-error `binding` is missing typings
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  // @ts-expect-error `domain` is missing typings
  domain,
  emit,
  emitWarning,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  // @ts-expect-error `initgroups` is missing typings
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  memoryUsage,
  // @ts-expect-error `moduleLoadList` is missing typings
  moduleLoadList,
  off,
  on,
  once,
  // @ts-expect-error `openStdin` is missing typings
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  // @ts-expect-error `reallyExit` is missing typings
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = isWorkerdProcessV2 ? workerdProcess : unenvProcess;
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
var generatePublicId = /* @__PURE__ */ __name(() => {
  const createFromBytes = /* @__PURE__ */ __name((bytes) => {
    bytes[6] = bytes[6] & 15 | 64;
    bytes[8] = bytes[8] & 63 | 128;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }, "createFromBytes");
  if (typeof globalThis.crypto !== "undefined") {
    if (typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    if (typeof globalThis.crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      return createFromBytes(bytes);
    }
  }
  const fallback = new Uint8Array(16);
  for (let index = 0; index < fallback.length; index += 1) {
    fallback[index] = Math.floor(Math.random() * 256);
  }
  return createFromBytes(fallback);
}, "generatePublicId");
var UserRepository = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "UserRepository");
  }
  async upsert(user) {
    const publicId = user.public_id ?? generatePublicId();
    await this.db.prepare(
      `INSERT INTO users (id, name, display_name, public_id)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, display_name = excluded.display_name`
    ).bind(user.id, user.name, user.display_name, publicId).run();
  }
  async getById(id) {
    return await this.db.prepare(
      `SELECT id, name, display_name, public_id, created_at, updated_at
         FROM users
         WHERE id = ?`
    ).bind(id).first();
  }
  async list() {
    const stmt = this.db.prepare(
      `SELECT id, name, display_name, public_id, created_at, updated_at
       FROM users
       ORDER BY created_at ASC`
    );
    const { results } = await stmt.all();
    return results;
  }
  async getByPublicId(publicId) {
    return await this.db.prepare(
      `SELECT id, name, display_name, public_id, created_at, updated_at
         FROM users
         WHERE public_id = ?`
    ).bind(publicId).first();
  }
  async findByNameParts(familyName, givenName) {
    const last = familyName.trim();
    const first = givenName.trim();
    if (!last || !first) return null;
    const displayWithSpace = `${last} ${first}`;
    const displayWithoutSpace = `${last}${first}`;
    return await this.db.prepare(
      `SELECT id, name, display_name, public_id, created_at, updated_at
         FROM users
         WHERE display_name IN (?, ?)
            OR name IN (?, ?)
         ORDER BY created_at ASC
         LIMIT 1`
    ).bind(displayWithSpace, displayWithoutSpace, displayWithSpace, displayWithoutSpace).first();
  }
};
var QuizRepository = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "QuizRepository");
  }
  async list(options = {}) {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const stmt = this.db.prepare(
      `SELECT id, title, description, created_at, updated_at
         FROM quizzes
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
    ).bind(limit, offset);
    const { results } = await stmt.all();
    return results;
  }
  async getById(id) {
    return await this.db.prepare(
      `SELECT id, title, description, created_at, updated_at
         FROM quizzes
         WHERE id = ?`
    ).bind(id).first();
  }
  async create(record) {
    await this.db.prepare(
      `INSERT INTO quizzes (id, title, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
    ).bind(
      record.id,
      record.title,
      record.description,
      record.created_at,
      record.updated_at
    ).run();
  }
};
var QuestionRepository = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "QuestionRepository");
  }
  async listByQuiz(quizId) {
    const stmt = this.db.prepare(
      `SELECT id, quiz_id, text, order_index, time_limit_sec, reveal_duration_sec, pending_result_sec, created_at, updated_at
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
      `INSERT INTO questions (id, quiz_id, text, order_index, time_limit_sec, reveal_duration_sec, pending_result_sec, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      record.id,
      record.quiz_id,
      record.text,
      record.order_index,
      record.time_limit_sec,
      record.reveal_duration_sec,
      record.pending_result_sec,
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
var SessionRepository = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "SessionRepository");
  }
  async create(record) {
    await this.db.prepare(
      `INSERT INTO sessions (id, quiz_id, status, auto_progress, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           quiz_id = excluded.quiz_id,
           status = excluded.status,
           auto_progress = excluded.auto_progress,
           updated_at = excluded.updated_at`
    ).bind(
      record.id,
      record.quiz_id,
      record.status,
      record.auto_progress,
      record.created_at,
      record.updated_at
    ).run();
  }
  async updateStatus(sessionId, status, autoProgress) {
    await this.db.prepare(
      `UPDATE sessions
         SET status = ?, auto_progress = ?, updated_at = ?
         WHERE id = ?`
    ).bind(status, autoProgress, (/* @__PURE__ */ new Date()).toISOString(), sessionId).run();
  }
  async getById(sessionId) {
    return await this.db.prepare(
      `SELECT id, quiz_id, status, auto_progress, created_at, updated_at
         FROM sessions
         WHERE id = ?`
    ).bind(sessionId).first();
  }
};
var AnswerRepository = class {
  constructor(db) {
    this.db = db;
  }
  static {
    __name(this, "AnswerRepository");
  }
  async recordAnswer(record) {
    await this.db.prepare(
      `INSERT INTO answers (id, session_id, question_id, user_id, choice_id, submitted_at, elapsed_ms, is_correct)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(session_id, question_id, user_id)
         DO UPDATE SET choice_id = excluded.choice_id, submitted_at = excluded.submitted_at, elapsed_ms = excluded.elapsed_ms, is_correct = excluded.is_correct`
    ).bind(
      record.id,
      record.session_id,
      record.question_id,
      record.user_id,
      record.choice_id,
      record.submitted_at,
      record.elapsed_ms,
      record.is_correct
    ).run();
  }
  async listBySession(sessionId) {
    const stmt = this.db.prepare(
      `SELECT id, session_id, question_id, user_id, choice_id, submitted_at, elapsed_ms, is_correct
         FROM answers
         WHERE session_id = ?`
    ).bind(sessionId);
    const { results } = await stmt.all();
    return results;
  }
};

// functions/api/_lib.ts
var json = /* @__PURE__ */ __name((data, init = {}) => {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
}, "json");
var errorJson = /* @__PURE__ */ __name((status, code, message, details) => json({ error: { code, message, details } }, { status }), "errorJson");
var formatRoute = /* @__PURE__ */ __name((request) => {
  const { method } = request;
  let pathname = "unknown";
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    pathname = request.url;
  }
  return `${method} ${pathname}`;
}, "formatRoute");
var logInfo = /* @__PURE__ */ __name((request, message, details) => {
  const route = formatRoute(request);
  if (typeof details === "undefined") {
    console.log(`[API] ${route} :: ${message}`);
  } else {
    console.log(`[API] ${route} :: ${message}`, details);
  }
}, "logInfo");
var logError = /* @__PURE__ */ __name((request, message, details) => {
  const route = formatRoute(request);
  if (typeof details === "undefined") {
    console.error(`[API] ${route} :: ${message}`);
  } else {
    console.error(`[API] ${route} :: ${message}`, details);
  }
}, "logError");
var parseRequestBody = /* @__PURE__ */ __name(async (request) => {
  try {
    const text = await request.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}, "parseRequestBody");
var getSessionStub = /* @__PURE__ */ __name((env2, sessionId) => {
  const id = env2.QUIZ_ROOM_DO.idFromName(sessionId);
  return env2.QUIZ_ROOM_DO.get(id);
}, "getSessionStub");
var forwardToDo = /* @__PURE__ */ __name(async (stub, path, init = {}) => {
  const url = new URL(path, "https://do.internal");
  return await stub.fetch(url.toString(), init);
}, "forwardToDo");

// functions/api/quizzes/index.ts
var onRequest = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
  const db = getDatabase(env2);
  const quizRepo = new QuizRepository(db);
  const questionRepo = new QuestionRepository(db);
  if (request.method === "GET") {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "20");
    const offset = Number(url.searchParams.get("offset") ?? "0");
    logInfo(request, "Fetching quiz list", { limit, offset });
    const quizzes = await quizRepo.list({ limit, offset });
    logInfo(request, "Quiz list fetched", { count: quizzes.length });
    return json({ quizzes, pagination: { limit, offset } });
  }
  if (request.method === "POST") {
    const payload = await parseRequestBody(request);
    if (!payload) {
      logError(request, "Invalid JSON payload for quiz creation");
      return errorJson(400, "invalid_payload", "Body must be valid JSON");
    }
    if (!payload.title || !Array.isArray(payload.questions) || payload.questions.length === 0) {
      logError(request, "Quiz creation validation failed", {
        title: payload.title,
        questionCount: payload.questions?.length ?? 0
      });
      return errorJson(400, "validation_failed", "Quiz title and at least one question are required");
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const quizId = crypto.randomUUID();
    const quizRecord = {
      id: quizId,
      title: payload.title,
      description: payload.description ?? null,
      created_at: nowIso,
      updated_at: nowIso
    };
    await quizRepo.create(quizRecord);
    for (let index = 0; index < payload.questions.length; index += 1) {
      const questionInput = payload.questions[index];
      if (!questionInput.text || !Array.isArray(questionInput.choices) || questionInput.choices.length === 0) {
        return errorJson(400, "validation_failed", "Each question must have text and choices");
      }
      const questionId = crypto.randomUUID();
      const questionRecord = {
        id: questionId,
        quiz_id: quizId,
        text: questionInput.text,
        order_index: index,
        time_limit_sec: Math.max(0, questionInput.timeLimitSec ?? 0),
        reveal_duration_sec: Math.max(0, questionInput.revealDurationSec ?? 5),
        pending_result_sec: Math.max(0, questionInput.pendingResultSec ?? 5),
        created_at: nowIso,
        updated_at: nowIso
      };
      const choices = questionInput.choices.map((choice) => ({
        id: crypto.randomUUID(),
        question_id: questionId,
        text: choice.text,
        is_correct: choice.isCorrect ? 1 : 0,
        created_at: nowIso,
        updated_at: nowIso
      }));
      await questionRepo.createQuestion(questionRecord, choices);
    }
    logInfo(request, "Quiz created", { quizId, questionCount: payload.questions.length });
    return json({ id: quizId, title: quizRecord.title }, { status: 201 });
  }
  return errorJson(405, "method_not_allowed", "Unsupported method");
}, "onRequest");

// functions/api/quizzes/[quizId].ts
var onRequest2 = /* @__PURE__ */ __name(async ({ request, env: env2, params }) => {
  if (request.method !== "GET") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }
  const rawQuizId = params.quizId;
  if (typeof rawQuizId !== "string" || rawQuizId.length === 0) {
    logError(request, "Missing quizId parameter", { params });
    return errorJson(400, "invalid_path", "quizId is required");
  }
  const quizId = rawQuizId;
  logInfo(request, "Fetching quiz detail", { quizId });
  const db = getDatabase(env2);
  const quizRepo = new QuizRepository(db);
  const questionRepo = new QuestionRepository(db);
  const quiz = await quizRepo.getById(quizId);
  if (!quiz) {
    logError(request, "Quiz not found", { quizId });
    return errorJson(404, "quiz_not_found", "Quiz not found");
  }
  const questions = await questionRepo.listByQuiz(quizId);
  const enriched = await Promise.all(
    questions.map(async (question) => {
      const choices = await questionRepo.getChoices(question.id);
      return {
        id: question.id,
        text: question.text,
        orderIndex: question.order_index,
        timeLimitSec: question.time_limit_sec,
        revealDurationSec: question.reveal_duration_sec,
        pendingResultSec: question.pending_result_sec,
        choices: choices.map((choice) => ({
          id: choice.id,
          text: choice.text,
          isCorrect: choice.is_correct === 1
        }))
      };
    })
  );
  const responsePayload = {
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      createdAt: quiz.created_at,
      questions: enriched
    }
  };
  logInfo(request, "Quiz detail returned", { quizId, questionCount: enriched.length });
  return json(responsePayload);
}, "onRequest");

// functions/api/quizzes/[quizId]/sessions.ts
var onRequest3 = /* @__PURE__ */ __name(async ({ request, env: env2, params }) => {
  if (request.method !== "POST") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }
  const rawQuizId = params.quizId;
  if (typeof rawQuizId !== "string" || rawQuizId.length === 0) {
    logError(request, "Missing quizId for session creation", { params });
    return errorJson(400, "invalid_path", "quizId is required");
  }
  const quizId = rawQuizId;
  const payload = await parseRequestBody(request);
  const autoProgress = payload?.autoProgress ?? true;
  const requestedSessionId = payload?.sessionId?.trim() || env2.DEFAULT_SESSION_ID || null;
  const sessionId = requestedSessionId ?? crypto.randomUUID();
  logInfo(request, "Creating session", { quizId, autoProgress, sessionId, requestedSessionId });
  const db = getDatabase(env2);
  const sessionRepo = new SessionRepository(db);
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  await sessionRepo.create({
    id: sessionId,
    quiz_id: quizId,
    status: "lobby",
    auto_progress: autoProgress ? 1 : 0,
    created_at: nowIso,
    updated_at: nowIso
  });
  const stub = getSessionStub(env2, sessionId);
  const initializeResponse = await forwardToDo(stub, "/initialize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId, quizId, autoProgress })
  });
  if (initializeResponse.status >= 400) {
    const message = await initializeResponse.text();
    logError(request, "Durable Object initialization failed", {
      sessionId,
      status: initializeResponse.status,
      message
    });
    return errorJson(initializeResponse.status, "initialize_failed", message || "Failed to initialize session");
  }
  const responsePayload = {
    sessionId,
    quizId,
    autoProgress,
    status: "lobby"
  };
  logInfo(request, "Session created", responsePayload);
  return json(responsePayload, { status: 201 });
}, "onRequest");

// functions/api/users/index.ts
var onRequest4 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
  if (request.method !== "GET") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }
  logInfo(request, "Fetching user list");
  try {
    const db = getDatabase(env2);
    const userRepo = new UserRepository(db);
    const users = await userRepo.list();
    logInfo(request, "User list fetched", { count: users.length });
    return json({ users });
  } catch (error3) {
    logError(request, "Failed to fetch user list", { error: error3 instanceof Error ? error3.message : String(error3) });
    return errorJson(500, "internal_error", "Failed to fetch user list");
  }
}, "onRequest");

// functions/api/users/[userId].ts
var onRequest5 = /* @__PURE__ */ __name(async ({ request, env: env2, params }) => {
  if (request.method !== "GET") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }
  const rawUserId = params.userId;
  if (typeof rawUserId !== "string" || rawUserId.length === 0) {
    logError(request, "Missing userId parameter", { params });
    return errorJson(400, "invalid_path", "userId is required");
  }
  const userId = rawUserId;
  logInfo(request, "Fetching user detail", { userId });
  try {
    const db = getDatabase(env2);
    const userRepo = new UserRepository(db);
    const user = await userRepo.getById(userId);
    if (!user) {
      logError(request, "User not found", { userId });
      return errorJson(404, "user_not_found", "User not found");
    }
    logInfo(request, "User detail returned", { userId });
    return json({ user });
  } catch (error3) {
    logError(request, "Failed to fetch user detail", {
      userId,
      error: error3 instanceof Error ? error3.message : String(error3)
    });
    return errorJson(500, "internal_error", "Failed to fetch user detail");
  }
}, "onRequest");

// functions/_cookies.ts
var QUIZ_USER_COOKIE_NAME = "quiz_user";
var QUIZ_USER_COOKIE_MAX_AGE_SEC = 60 * 60 * 3;
var cookieAttributes = [
  "Path=/quiz",
  `Max-Age=${QUIZ_USER_COOKIE_MAX_AGE_SEC}`,
  "HttpOnly",
  "Secure",
  "SameSite=Lax"
];
var formatExpires = /* @__PURE__ */ __name((maxAge) => new Date(Date.now() + maxAge * 1e3).toUTCString(), "formatExpires");
var createCookie = /* @__PURE__ */ __name((value, options) => {
  const maxAge = options?.maxAge ?? QUIZ_USER_COOKIE_MAX_AGE_SEC;
  const parts = [
    `${QUIZ_USER_COOKIE_NAME}=${value}`,
    ...cookieAttributes.filter((attribute) => !attribute.startsWith("Max-Age")),
    `Max-Age=${maxAge}`,
    `Expires=${maxAge <= 0 ? (/* @__PURE__ */ new Date(0)).toUTCString() : formatExpires(maxAge)}`
  ];
  return parts.join("; ");
}, "createCookie");
var buildQuizUserCookie = /* @__PURE__ */ __name((publicId) => createCookie(publicId), "buildQuizUserCookie");
var getQuizUserCookie = /* @__PURE__ */ __name((request) => {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";").map((part) => part.trim());
  for (const pair of pairs) {
    const [key, ...rest] = pair.split("=");
    if (key === QUIZ_USER_COOKIE_NAME) {
      return rest.join("=");
    }
  }
  return null;
}, "getQuizUserCookie");
var uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// functions/quiz/[publicId].ts
var redirectResponse = /* @__PURE__ */ __name((request, status, cookie) => {
  const url = new URL(request.url);
  const headers = new Headers({
    Location: `${url.origin}/quiz`,
    "Cache-Control": "no-store"
  });
  if (cookie) {
    headers.append("Set-Cookie", cookie);
  }
  return new Response(null, { status, headers });
}, "redirectResponse");
var onRequest6 = /* @__PURE__ */ __name(async ({ request, env: env2, params }) => {
  const rawPublicId = params.publicId;
  if (typeof rawPublicId !== "string" || rawPublicId.trim().length === 0) {
    logError(request, "Missing publicId parameter", { params });
    return redirectResponse(request, 302);
  }
  const publicId = rawPublicId.trim().toLowerCase();
  if (!uuidPattern.test(publicId)) {
    logError(request, "Invalid publicId format", { publicId });
    return redirectResponse(request, 302);
  }
  try {
    const db = getDatabase(env2);
    const userRepo = new UserRepository(db);
    const user = await userRepo.getByPublicId(publicId);
    if (!user) {
      logError(request, "User not found for publicId", { publicId });
      return redirectResponse(request, 302);
    }
    logInfo(request, "Authenticated via publicId", {
      userId: user.id,
      publicId
    });
    return redirectResponse(request, 303, buildQuizUserCookie(user.public_id));
  } catch (error3) {
    logError(request, "Failed to resolve publicId", {
      publicId,
      error: error3 instanceof Error ? error3.message : String(error3)
    });
    return redirectResponse(request, 302);
  }
}, "onRequest");

// functions/quiz/api/users/me.ts
var onRequest7 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
  if (request.method !== "GET") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }
  const cookiePublicId = getQuizUserCookie(request);
  if (!cookiePublicId) {
    logError(request, "Missing quiz_user cookie");
    return errorJson(401, "unauthorized", "quiz_user cookie is required");
  }
  if (!uuidPattern.test(cookiePublicId)) {
    logError(request, "Invalid quiz_user cookie format", { cookiePublicId });
    return errorJson(400, "invalid_cookie", "quiz_user cookie is invalid");
  }
  try {
    const db = getDatabase(env2);
    const userRepo = new UserRepository(db);
    const user = await userRepo.getByPublicId(cookiePublicId);
    if (!user) {
      logError(request, "User not found for quiz_user cookie", {
        publicId: cookiePublicId
      });
      return errorJson(404, "user_not_found", "User not found");
    }
    logInfo(request, "Resolved user from quiz_user cookie", {
      userId: user.id,
      publicId: user.public_id
    });
    const response = json({ user });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error3) {
    logError(request, "Failed to resolve quiz_user cookie", {
      publicId: cookiePublicId,
      error: error3 instanceof Error ? error3.message : String(error3)
    });
    return errorJson(500, "internal_error", "Failed to resolve quiz_user cookie");
  }
}, "onRequest");

// functions/quiz/api/users/identify.ts
var normalizeInput = /* @__PURE__ */ __name((value) => {
  if (typeof value !== "string") return "";
  return value.trim();
}, "normalizeInput");
var onRequest8 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
  if (request.method !== "POST") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }
  const payload = await parseRequestBody(request);
  const familyName = normalizeInput(payload?.familyName);
  const givenName = normalizeInput(payload?.givenName);
  if (!familyName || !givenName) {
    logError(request, "Invalid identify payload", { payload });
    return errorJson(400, "validation_failed", "familyName and givenName are required");
  }
  try {
    const db = getDatabase(env2);
    const userRepo = new UserRepository(db);
    const user = await userRepo.findByNameParts(familyName, givenName);
    if (!user) {
      logError(request, "User not found for provided names", { familyName, givenName });
      return errorJson(404, "user_not_found", "\u53C2\u52A0\u8005\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
    }
    logInfo(request, "Identified user by names", { userId: user.id, publicId: user.public_id });
    const response = json({ user });
    response.headers.append("Set-Cookie", buildQuizUserCookie(user.public_id));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error3) {
    logError(request, "Failed to identify user", {
      familyName,
      givenName,
      error: error3 instanceof Error ? error3.message : String(error3)
    });
    return errorJson(500, "internal_error", "\u5185\u90E8\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F");
  }
}, "onRequest");

// workers/index.ts
var DEFAULT_DEV_CORS_ORIGINS = /* @__PURE__ */ new Set(["*"]);
var parseAllowedOrigins = /* @__PURE__ */ __name((env2) => {
  const raw = env2.CORS_ALLOWED_ORIGINS;
  if (!raw) {
    return DEFAULT_DEV_CORS_ORIGINS;
  }
  return new Set(
    raw.split(",").map((origin) => origin.trim()).filter((origin) => origin.length > 0)
  );
}, "parseAllowedOrigins");
var isSameOrigin = /* @__PURE__ */ __name((request, origin) => new URL(request.url).origin === origin, "isSameOrigin");
var resolveAllowedOrigin = /* @__PURE__ */ __name((request, env2) => {
  const origin = request.headers.get("Origin");
  if (!origin) {
    return null;
  }
  const allowed = parseAllowedOrigins(env2);
  if (allowed.has("*")) {
    return origin ?? "*";
  }
  if (isSameOrigin(request, origin) || allowed.has(origin)) {
    return origin;
  }
  return null;
}, "resolveAllowedOrigin");
var createCorsResponse = /* @__PURE__ */ __name((status, headers) => new Response(null, { status, headers }), "createCorsResponse");
var handleCorsPreflight = /* @__PURE__ */ __name((request, env2) => {
  const allowedOrigin = resolveAllowedOrigin(request, env2);
  if (!allowedOrigin) {
    return new Response(null, { status: 400 });
  }
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", allowedOrigin);
  if (allowedOrigin !== "*") {
    headers.append("Vary", "Origin");
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  const requestMethod = request.headers.get("Access-Control-Request-Method") ?? "GET,POST,PUT,DELETE,OPTIONS";
  headers.set("Access-Control-Allow-Methods", requestMethod);
  const requestHeaders = request.headers.get("Access-Control-Request-Headers");
  if (requestHeaders) {
    headers.set("Access-Control-Allow-Headers", requestHeaders);
  }
  headers.set("Access-Control-Max-Age", "600");
  return createCorsResponse(204, headers);
}, "handleCorsPreflight");
var applyCorsHeaders = /* @__PURE__ */ __name((request, env2, response) => {
  const allowedOrigin = resolveAllowedOrigin(request, env2);
  if (!allowedOrigin) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", allowedOrigin);
  if (allowedOrigin !== "*") {
    headers.append("Vary", "Origin");
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}, "applyCorsHeaders");
var worker = {
  async fetch(request, env2) {
    const url = new URL(request.url);
    const isQuizApiRequest = url.pathname.startsWith("/quiz/api/");
    const isApiRequest = url.pathname.startsWith("/api/") || isQuizApiRequest;
    if (isApiRequest && request.method === "OPTIONS") {
      return handleCorsPreflight(request, env2);
    }
    const origin = request.headers.get("Origin");
    if (isApiRequest && origin && !resolveAllowedOrigin(request, env2)) {
      return new Response("CORS origin denied", { status: 403 });
    }
    if (request.headers.get("Upgrade") === "websocket" && url.pathname.startsWith("/ws/sessions/")) {
      return handleSessionWebSocket(request, env2);
    }
    if (url.pathname.startsWith("/api/quizzes")) {
      const response = await handleQuizRoutes(request, env2, url);
      if (response) {
        return applyCorsHeaders(request, env2, response);
      }
    }
    if (url.pathname.startsWith("/api/users")) {
      const response = await handleUserRoutes(request, env2, url);
      if (response) {
        return applyCorsHeaders(request, env2, response);
      }
    }
    if (url.pathname.startsWith("/quiz/api/")) {
      const response = await handleParticipantApi(request, env2, url);
      if (response) {
        return applyCorsHeaders(request, env2, response);
      }
    }
    const inviteMatch = url.pathname.match(/^\/quiz\/([0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12})$/i);
    if (inviteMatch) {
      const publicId = inviteMatch[1];
      return await invokePagesFunction(onRequest6, request, env2, { publicId });
    }
    if (url.pathname === "/healthz") {
      const response = new Response("ok", { status: 200 });
      return isApiRequest ? applyCorsHeaders(request, env2, response) : response;
    }
    if (url.pathname.startsWith("/api/sessions/")) {
      const response = await handleSessionApi(request, env2);
      return applyCorsHeaders(request, env2, response);
    }
    const notFound = new Response("Not Found", { status: 404 });
    return isApiRequest ? applyCorsHeaders(request, env2, notFound) : notFound;
  }
};
var workers_default = worker;
var invokePagesFunction = /* @__PURE__ */ __name(async (handler, request, env2, params) => {
  const context2 = {
    request,
    env: env2,
    params,
    functionPath: "",
    waitUntil: /* @__PURE__ */ __name((promise) => {
      void promise;
    }, "waitUntil"),
    passThroughOnException: /* @__PURE__ */ __name(() => {
    }, "passThroughOnException"),
    next: /* @__PURE__ */ __name(async () => new Response("Not Found", { status: 404 }), "next"),
    data: {}
  };
  return await handler(context2);
}, "invokePagesFunction");
var normalizePathname = /* @__PURE__ */ __name((pathname) => {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}, "normalizePathname");
var handleQuizRoutes = /* @__PURE__ */ __name(async (request, env2, url) => {
  const pathname = normalizePathname(url.pathname);
  if (pathname === "/api/quizzes") {
    return await invokePagesFunction(onRequest, request, env2, {});
  }
  const sessionMatch = pathname.match(/^\/api\/quizzes\/([^/]+)\/sessions$/);
  if (sessionMatch) {
    const quizId = decodeURIComponent(sessionMatch[1]);
    return await invokePagesFunction(onRequest3, request, env2, { quizId });
  }
  const detailMatch = pathname.match(/^\/api\/quizzes\/([^/]+)$/);
  if (detailMatch) {
    const quizId = decodeURIComponent(detailMatch[1]);
    return await invokePagesFunction(onRequest2, request, env2, { quizId });
  }
  return null;
}, "handleQuizRoutes");
var handleUserRoutes = /* @__PURE__ */ __name(async (request, env2, url) => {
  const pathname = normalizePathname(url.pathname);
  if (pathname === "/api/users") {
    return await invokePagesFunction(onRequest4, request, env2, {});
  }
  const detailMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
  if (detailMatch) {
    const userId = decodeURIComponent(detailMatch[1]);
    return await invokePagesFunction(onRequest5, request, env2, { userId });
  }
  return null;
}, "handleUserRoutes");
var handleParticipantApi = /* @__PURE__ */ __name(async (request, env2, url) => {
  const pathname = normalizePathname(url.pathname);
  if (pathname === "/quiz/api/users/me") {
    return await invokePagesFunction(onRequest7, request, env2, {});
  }
  if (pathname === "/quiz/api/users/identify") {
    return await invokePagesFunction(onRequest8, request, env2, {});
  }
  return null;
}, "handleParticipantApi");
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
  const stub = getSessionStub2(env2, sessionId);
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
var getSessionStub2 = /* @__PURE__ */ __name((env2, sessionId) => {
  const id = env2.QUIZ_ROOM_DO.idFromName(sessionId);
  return env2.QUIZ_ROOM_DO.get(id);
}, "getSessionStub");
var normalizeAnswerSnapshot = /* @__PURE__ */ __name((answer) => {
  if (typeof answer.elapsedMs !== "number" || !Number.isFinite(answer.elapsedMs)) {
    answer.elapsedMs = 0;
  }
  if (answer.elapsedMs < 0) {
    answer.elapsedMs = 0;
  }
}, "normalizeAnswerSnapshot");
var recalculateParticipantTotals = /* @__PURE__ */ __name((participant) => {
  participant.answers ??= {};
  let score = 0;
  let totalElapsedMs = 0;
  for (const answer of Object.values(participant.answers)) {
    if (!answer) {
      continue;
    }
    normalizeAnswerSnapshot(answer);
    if (answer.isCorrect) {
      score += 1;
    }
    totalElapsedMs += answer.elapsedMs ?? 0;
  }
  participant.score = score;
  participant.totalElapsedMs = totalElapsedMs;
}, "recalculateParticipantTotals");
async function handleSessionWebSocket(request, env2) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 3) {
    return new Response("Missing session id", { status: 400 });
  }
  const sessionId = segments[2];
  const stub = getSessionStub2(env2, sessionId);
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
var DEFAULT_PENDING_RESULT_MS = 5e3;
var workerLog = /* @__PURE__ */ __name((...args) => {
  console.log("[QuizRoom]", ...args);
}, "workerLog");
var workerError = /* @__PURE__ */ __name((...args) => {
  console.error("[QuizRoom]", ...args);
}, "workerError");
var QuizRoomDurableObject = class {
  constructor(state, env2) {
    this.connections = /* @__PURE__ */ new Map();
    this.questions = [];
    this.alarmMeta = null;
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
      questionLockedAt: null,
      questionRevealAt: null,
      questionRevealEndsAt: null,
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
        this.snapshot.questionLockedAt ??= null;
        this.snapshot.questionRevealAt ??= null;
        this.snapshot.questionRevealEndsAt ??= null;
        this.snapshot.pendingResults ??= {};
        this.snapshot.participants ??= {};
        this.snapshot.autoProgress ??= true;
        for (const participant of Object.values(this.snapshot.participants)) {
          participant.answers ??= {};
          for (const answer of Object.values(participant.answers)) {
            if (answer) {
              normalizeAnswerSnapshot(answer);
            }
          }
          recalculateParticipantTotals(participant);
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
          revealDurationSec: question.revealDurationSec ?? DEFAULT_REVEAL_DURATION_MS / 1e3,
          pendingResultSec: question.pendingResultSec ?? DEFAULT_PENDING_RESULT_MS / 1e3
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
  static {
    __name(this, "QuizRoomDurableObject");
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
        pendingResultSec: record.pending_result_sec ?? DEFAULT_PENDING_RESULT_MS / 1e3,
        choices: choices.map((choice) => ({
          id: choice.id,
          text: choice.text,
          isCorrect: choice.is_correct === 1
        }))
      });
      order += 1;
    }
    const resetTimestamp = now();
    for (const participant of Object.values(this.snapshot.participants)) {
      participant.answers = {};
      participant.lastSeen = resetTimestamp;
      recalculateParticipantTotals(participant);
    }
    this.snapshot.sessionId = sessionId;
    this.snapshot.quizId = quizId;
    this.snapshot.status = "lobby";
    this.snapshot.questionIndex = -1;
    this.snapshot.currentQuestionId = null;
    this.snapshot.questionStartedAt = null;
    this.snapshot.questionDeadline = null;
    this.snapshot.questionLockedAt = null;
    this.snapshot.questionRevealAt = null;
    this.snapshot.questionRevealEndsAt = null;
    this.snapshot.pendingResults = {};
    if (typeof autoProgressPayload === "boolean") {
      this.snapshot.autoProgress = autoProgressPayload;
    }
    this.questions = questions;
    await this.persistState();
    await this.setAlarmMetadata(null);
    for (const connection of this.connections.values()) {
      this.handleSyncRequest(connection);
    }
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
          await this.lockCurrentQuestion({ immediateReveal: true, skipPending: true, skipAutoProgress: true });
        } else if (this.snapshot.status === "answers_locked") {
          await this.revealCurrentQuestion({ skipAutoProgress: true });
        } else if (this.snapshot.status === "reveal") {
          await this.setAlarmMetadata(null);
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
            await this.lockCurrentQuestion({ immediateReveal: true, skipPending: true, skipAutoProgress: true });
          } else if (this.snapshot.status === "answers_locked") {
            await this.revealCurrentQuestion({ skipAutoProgress: true });
          } else if (this.snapshot.status === "reveal") {
            await this.setAlarmMetadata(null);
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
        if (this.snapshot.status === "question") {
          await this.lockCurrentQuestion({ immediateReveal: true, skipPending: true });
        } else if (this.snapshot.status === "answers_locked") {
          await this.revealCurrentQuestion();
        }
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
        answers: {},
        score: 0,
        totalElapsedMs: 0
      };
      participant.connected = true;
      participant.lastSeen = now();
      participant.displayName = message.displayName ?? participant.displayName;
      participant.answers ??= {};
      recalculateParticipantTotals(participant);
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
      questionStartedAt: this.snapshot.questionStartedAt,
      questionLockedAt: this.snapshot.questionLockedAt,
      questionRevealAt: this.snapshot.questionRevealAt,
      questionRevealEndsAt: this.snapshot.questionRevealEndsAt,
      autoProgress: this.snapshot.autoProgress,
      participants
    };
    this.send(context2, { type: "session_ready", sessionId: this.snapshot.sessionId, timestamp: now(), ...payload });
    const currentQuestion = this.getCurrentQuestion();
    const activeStatuses = ["question", "answers_locked", "reveal"];
    if (currentQuestion && activeStatuses.includes(this.snapshot.status)) {
      const questionPayload = {
        questionIndex: this.snapshot.questionIndex,
        deadline: this.snapshot.questionDeadline,
        question: this.toParticipantQuestion(currentQuestion)
      };
      this.send(context2, { type: "question_start", sessionId: this.snapshot.sessionId, timestamp: now(), ...questionPayload });
    }
    if (currentQuestion && (this.snapshot.status === "answers_locked" || this.snapshot.status === "reveal")) {
      const lockedAt = this.snapshot.questionLockedAt ?? now();
      const revealAt = this.snapshot.questionRevealAt ?? lockedAt;
      this.send(context2, {
        type: "question_locked",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        questionIndex: this.snapshot.questionIndex,
        questionId: currentQuestion.id,
        lockedAt,
        revealAt
      });
    }
    if (currentQuestion && this.snapshot.status === "reveal") {
      const lockedAt = this.snapshot.questionLockedAt ?? now();
      const revealAt = this.snapshot.questionRevealAt ?? lockedAt;
      const revealEndsAt = this.snapshot.questionRevealEndsAt ?? revealAt;
      const summary = this.snapshot.pendingResults[currentQuestion.id] ?? this.computeSummary(currentQuestion);
      this.send(context2, {
        type: "question_reveal",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        questionIndex: this.snapshot.questionIndex,
        questionId: currentQuestion.id,
        revealAt,
        revealEndsAt,
        totals: summary.totals,
        correctChoiceIds: summary.correctChoiceIds
      });
      if (context2.role === "participant" && context2.userId) {
        const participant = this.snapshot.participants[context2.userId];
        const answer = participant?.answers?.[currentQuestion.id];
        if (participant && answer) {
          normalizeAnswerSnapshot(answer);
          this.send(context2, {
            type: "answer_result",
            sessionId: this.snapshot.sessionId,
            timestamp: now(),
            questionIndex: this.snapshot.questionIndex,
            isCorrect: Boolean(answer.isCorrect),
            correctChoiceId: summary.correctChoiceIds[0] ?? "",
            choiceId: answer.choiceId,
            questionId: currentQuestion.id,
            userId: participant.userId,
            elapsedMs: answer.elapsedMs ?? 0
          });
        }
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
    const questionStartedAt = this.snapshot.questionStartedAt ?? submittedAt;
    const elapsedMs = Math.max(0, submittedAt - questionStartedAt);
    workerLog("Answer submitted", {
      sessionId: this.snapshot.sessionId,
      userId: context2.userId,
      questionId: question.id,
      choiceId: message.choiceId,
      isCorrect,
      elapsedMs
    });
    participant.answers ??= {};
    participant.answers[question.id] = {
      choiceId: message.choiceId,
      submittedAt,
      isCorrect,
      elapsedMs
    };
    normalizeAnswerSnapshot(participant.answers[question.id]);
    recalculateParticipantTotals(participant);
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
      submitted_at: new Date(submittedAt).toISOString(),
      elapsed_ms: elapsedMs,
      is_correct: isCorrect ? 1 : 0
    });
    this.sendToParticipant(context2.userId, {
      type: "answer_received",
      sessionId: this.snapshot.sessionId,
      timestamp: submittedAt,
      questionIndex: this.snapshot.questionIndex,
      questionId: question.id,
      choiceId: message.choiceId,
      elapsedMs,
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
  sendToParticipant(userId, payload) {
    for (const connection of this.connections.values()) {
      if (connection.role === "participant" && connection.userId === userId) {
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
    this.snapshot.questionLockedAt = null;
    this.snapshot.questionRevealAt = null;
    this.snapshot.questionRevealEndsAt = null;
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
  async lockCurrentQuestion(options = {}) {
    const { immediateReveal = false, skipPending = false, skipAutoProgress = false } = options;
    if (this.snapshot.status !== "question") {
      workerLog("lockCurrentQuestion called outside question phase", {
        status: this.snapshot.status,
        sessionId: this.snapshot.sessionId
      });
      if (immediateReveal && (this.snapshot.status === "answers_locked" || this.snapshot.status === "reveal")) {
        await this.revealCurrentQuestion({ skipAutoProgress });
      }
      return;
    }
    const question = this.getCurrentQuestion();
    if (!question) {
      await this.finalizeQuiz();
      return;
    }
    await this.setAlarmMetadata(null);
    const lockedAt = now();
    const pendingDelayMs = skipPending ? 0 : Math.max(0, (question.pendingResultSec ?? DEFAULT_PENDING_RESULT_MS / 1e3) * 1e3);
    const revealDurationMs = Math.max(0, (question.revealDurationSec ?? DEFAULT_REVEAL_DURATION_MS / 1e3) * 1e3);
    const revealAt = lockedAt + pendingDelayMs;
    const revealEndsAt = revealAt + revealDurationMs;
    this.snapshot.status = "answers_locked";
    this.snapshot.questionDeadline = null;
    this.snapshot.questionLockedAt = lockedAt;
    this.snapshot.questionRevealAt = revealAt;
    this.snapshot.questionRevealEndsAt = revealEndsAt;
    workerLog("Question locked", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex,
      questionId: question.id,
      lockedAt,
      revealAt,
      pendingDelayMs,
      immediateReveal
    });
    await this.persistState();
    this.broadcastQuestionLocked(question, lockedAt, revealAt);
    if (!immediateReveal && pendingDelayMs > 0) {
      await this.setAlarmMetadata({
        type: "answers_locked_to_reveal",
        questionIndex: this.snapshot.questionIndex,
        scheduledAt: revealAt
      });
      workerLog("Scheduled reveal after pending window", {
        sessionId: this.snapshot.sessionId,
        questionIndex: this.snapshot.questionIndex,
        scheduledAt: revealAt
      });
      return;
    }
    await this.revealCurrentQuestion({ skipAutoProgress });
  }
  async revealCurrentQuestion(options = {}) {
    const { skipAutoProgress = false } = options;
    if (this.snapshot.status !== "answers_locked" && this.snapshot.status !== "question") {
      workerLog("revealCurrentQuestion called in non-lock state", {
        status: this.snapshot.status,
        sessionId: this.snapshot.sessionId
      });
      if (this.snapshot.status === "reveal" && skipAutoProgress) {
        await this.setAlarmMetadata(null);
      }
      return;
    }
    const question = this.getCurrentQuestion();
    if (!question) {
      await this.finalizeQuiz();
      return;
    }
    await this.setAlarmMetadata(null);
    const revealAt = this.snapshot.questionRevealAt ?? now();
    const revealEndsAt = this.snapshot.questionRevealEndsAt ?? revealAt + Math.max(0, (question.revealDurationSec ?? DEFAULT_REVEAL_DURATION_MS / 1e3) * 1e3);
    const summary = this.computeSummary(question);
    this.snapshot.status = "reveal";
    this.snapshot.questionLockedAt ??= revealAt;
    this.snapshot.questionRevealAt = revealAt;
    this.snapshot.questionRevealEndsAt = revealEndsAt;
    this.snapshot.pendingResults[question.id] = summary;
    workerLog("Question reveal", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex,
      questionId: question.id,
      revealAt,
      revealEndsAt,
      totals: summary.totals,
      correctChoices: summary.correctChoiceIds,
      skipAutoProgress
    });
    await this.persistState();
    this.broadcastQuestionReveal(question, summary, revealAt, revealEndsAt);
    this.broadcastAnswerResults(question, summary);
    if (!skipAutoProgress && this.snapshot.autoProgress) {
      if (this.hasNextQuestion()) {
        if (revealEndsAt <= now()) {
          workerLog("Auto-progressing immediately to next question after reveal", {
            sessionId: this.snapshot.sessionId,
            nextIndex: this.snapshot.questionIndex + 1
          });
          await this.startQuestion(this.snapshot.questionIndex + 1);
        } else {
          await this.setAlarmMetadata({
            type: "reveal_to_next",
            questionIndex: this.snapshot.questionIndex,
            scheduledAt: revealEndsAt
          });
          workerLog("Scheduled auto-progress after reveal", {
            sessionId: this.snapshot.sessionId,
            delayMs: Math.max(0, revealEndsAt - now()),
            nextIndex: this.snapshot.questionIndex + 1
          });
        }
      } else {
        if (revealEndsAt <= now()) {
          await this.finalizeQuiz();
        } else {
          await this.setAlarmMetadata({
            type: "reveal_to_next",
            questionIndex: this.snapshot.questionIndex,
            scheduledAt: revealEndsAt
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
    this.snapshot.questionStartedAt = null;
    this.snapshot.questionLockedAt = null;
    this.snapshot.questionRevealAt = null;
    this.snapshot.questionRevealEndsAt = null;
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
  broadcastQuestionLocked(question, lockedAt, revealAt) {
    workerLog("Broadcasting question_locked", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex,
      lockedAt,
      revealAt
    });
    this.broadcast(
      {
        type: "question_locked",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        questionIndex: this.snapshot.questionIndex,
        questionId: question.id,
        lockedAt,
        revealAt
      },
      "all"
    );
  }
  broadcastQuestionReveal(question, summary, revealAt, revealEndsAt) {
    workerLog("Broadcasting question_reveal", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex,
      revealAt,
      revealEndsAt,
      totals: summary.totals
    });
    this.broadcast(
      {
        type: "question_reveal",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        questionIndex: this.snapshot.questionIndex,
        questionId: question.id,
        revealAt,
        revealEndsAt,
        totals: summary.totals,
        correctChoiceIds: summary.correctChoiceIds
      },
      "all"
    );
  }
  broadcastAnswerResults(question, summary) {
    const correctChoiceId = summary.correctChoiceIds[0] ?? "";
    for (const participant of Object.values(this.snapshot.participants)) {
      const answer = participant.answers?.[question.id];
      if (!answer) {
        continue;
      }
      normalizeAnswerSnapshot(answer);
      const payload = {
        type: "answer_result",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        questionIndex: this.snapshot.questionIndex,
        isCorrect: Boolean(answer.isCorrect),
        correctChoiceId,
        choiceId: answer.choiceId,
        questionId: question.id,
        userId: participant.userId,
        elapsedMs: answer.elapsedMs ?? 0
      };
      this.sendToParticipant(participant.userId, payload);
    }
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
    if (meta) {
      await this.state.storage.put("alarm_meta", meta);
      await this.state.storage.setAlarm(meta.scheduledAt);
      workerLog("Alarm scheduled", meta);
    } else {
      await this.state.storage.delete("alarm_meta");
      await this.state.storage.deleteAlarm();
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
          await this.lockCurrentQuestion();
        }
        break;
      case "answers_locked_to_reveal":
        if ((this.snapshot.status === "answers_locked" || this.snapshot.status === "question") && this.snapshot.questionIndex === meta.questionIndex) {
          await this.revealCurrentQuestion();
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

// .wrangler/tmp/bundle-MLGhgW/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-MLGhgW/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker2) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker2;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker2.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker2.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker2,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker2.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker2.scheduled(controller, env2, ctx);
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
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
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
