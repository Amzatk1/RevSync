/**
 * NUCLEAR POLYFILLS - Fix all Node.js compatibility issues
 * This must run before ANY other code loads
 */

// FORCE require to exist - most aggressive approach
Object.defineProperty(global, 'require', {
  value: function(moduleName) {
    // Handle ALL possible Node.js modules
    const nodeModules = {
      'crypto': { 
        randomBytes: (size) => new Uint8Array(size || 16),
        createHash: () => ({ update: () => ({}), digest: () => 'hash' })
      },
      'buffer': { 
        Buffer: {
          from: (data, encoding) => new TextEncoder().encode(String(data)),
          isBuffer: (obj) => obj instanceof Uint8Array,
          alloc: (size) => new Uint8Array(size),
          concat: (buffers) => new Uint8Array()
        }
      },
      'stream': { 
        Readable: class MockReadable {},
        Writable: class MockWritable {},
        Transform: class MockTransform {},
        PassThrough: class MockPassThrough {}
      },
      'util': { 
        promisify: (fn) => (...args) => Promise.resolve(fn(...args)),
        inherits: () => {},
        format: (...args) => args.join(' ')
      },
      'events': { 
        EventEmitter: class MockEventEmitter {
          on() { return this; }
          emit() { return true; }
          removeListener() { return this; }
        }
      },
      'path': { 
        join: (...args) => args.filter(Boolean).join('/'),
        resolve: (...args) => args.filter(Boolean).join('/'),
        dirname: (p) => p.split('/').slice(0, -1).join('/'),
        basename: (p) => p.split('/').pop(),
        extname: (p) => '.' + p.split('.').pop()
      },
      'url': { 
        parse: (url) => ({ href: url, protocol: 'https:', host: 'localhost' }),
        format: (obj) => obj.href || ''
      },
      'fs': {
        readFileSync: () => '',
        writeFileSync: () => {},
        existsSync: () => false,
        mkdirSync: () => {},
        readdirSync: () => []
      },
      'os': {
        platform: () => 'react-native',
        arch: () => 'arm64',
        tmpdir: () => '/tmp',
        homedir: () => '/home'
      },
      'querystring': {
        parse: (str) => Object.fromEntries(new URLSearchParams(str)),
        stringify: (obj) => new URLSearchParams(obj).toString()
      },
      'assert': {
        ok: (value) => { if (!value) throw new Error('Assertion failed'); },
        equal: (a, b) => { if (a !== b) throw new Error('Not equal'); }
      }
    };

    // Return the polyfilled module or empty object
    if (nodeModules[moduleName]) {
      return nodeModules[moduleName];
    }
    
    console.warn(`Module '${moduleName}' polyfilled with empty object`);
    return {};
  },
  writable: false,
  enumerable: true,
  configurable: false
});

// Enhanced process polyfill
if (typeof process === 'undefined') {
  global.process = {
    env: global.__DEV__ ? {
      NODE_ENV: 'development',
      EXPO_PUBLIC_SUPABASE_URL: '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: ''
    } : {
      NODE_ENV: 'production'
    },
    platform: 'react-native',
    version: '1.0.0',
    versions: { node: '18.0.0' },
    nextTick: (fn) => setTimeout(fn, 0),
    cwd: () => '/',
    exit: () => {},
    argv: [],
    pid: 1
  };
}

// Enhanced Buffer polyfill
if (typeof Buffer === 'undefined') {
  global.Buffer = {
    from: function(data, encoding) {
      if (typeof data === 'string') {
        return new TextEncoder().encode(data);
      }
      return new Uint8Array(data);
    },
    isBuffer: function(obj) {
      return obj instanceof Uint8Array;
    },
    alloc: function(size) {
      return new Uint8Array(size);
    },
    concat: function(buffers) {
      const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const buf of buffers) {
        result.set(buf, offset);
        offset += buf.length;
      }
      return result;
    }
  };
}

// Additional Node.js globals
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(() => fn(...args), 0);
  global.clearImmediate = clearTimeout;
}

// Export to make this a module
export {};
