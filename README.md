# Cloudflare Workers NODE_ENV Bug - Minimum Reproducible Example

This repository demonstrates a bug in Cloudflare Workers where `process.env.NODE_ENV` returns `undefined` despite the environment variable being present and accessible through other methods.

## 🐛 Bug Summary

**Issue**: `process.env.NODE_ENV` returns `undefined` while `Reflect.get(process.env, 'NODE_ENV')` correctly returns the expected value.

**Environment**: Cloudflare Workers runtime via `wrangler dev`

## 🚀 How to Reproduce

1. **Clone and setup**:
   ```bash
   git clone <this-repo>
   cd cf-worker-node-env
   bun install
   ```

2. **Start the development server**:
   ```bash
   wrangler dev --ip=127.0.0.1 --env development --port 1234
   ```

3. **Trigger the bug**:
   - Open your browser to the local development URL (typically `http://localhost:1234`)
   - Or make a curl request: `curl http://localhost:1234`

4. **Observe the console output** showing:
   - ✅ `NODE_ENV` exists in `process.env`
   - ✅ `NODE_ENV` is enumerable and has a property descriptor
   - ❌ `process.env.NODE_ENV` returns `undefined`
   - ❌ `process.env['NODE_ENV']` returns `undefined`
   - ✅ `Reflect.get(process.env, 'NODE_ENV')` correctly returns `'development'`

## 📋 Expected vs Actual Behavior

### Expected
```javascript
process.env.NODE_ENV; // Should return 'development'
process.env['NODE_ENV']; // Should return 'development'
Reflect.get(process.env, 'NODE_ENV'); // Should return 'development'
```

### Actual
```javascript
process.env.NODE_ENV; // Returns undefined ❌
process.env['NODE_ENV']; // Returns undefined ❌
Reflect.get(process.env, 'NODE_ENV'); // Returns 'development' ✅
```

## 🔍 Key Evidence

The bug is particularly puzzling because:

1. **NODE_ENV exists**: `Object.keys(process.env)` includes `'NODE_ENV'`
2. **Property checks pass**: `'NODE_ENV' in process.env` returns `true`
3. **Descriptor exists**: `Object.getOwnPropertyDescriptor(process.env, 'NODE_ENV')` shows the property with correct value
4. **Other env vars work**: All other environment variables work correctly with standard property access
5. **Reflect.get works**: Only `Reflect.get()` can successfully retrieve the NODE_ENV value

## 🔧 Workaround

Until this bug is fixed, use:
```javascript
const nodeEnv = Reflect.get(process.env, 'NODE_ENV');
```

Instead of:
```javascript
const nodeEnv = process.env.NODE_ENV; // This returns undefined
```

## 📁 Project Structure

- `src/index.ts` - Main worker file with comprehensive bug reproduction tests
- `wrangler.jsonc` - Wrangler configuration
- `package.json` - Dependencies and scripts

## 🛠 Technical Details

- **Runtime**: Cloudflare Workers
- **Tool**: Wrangler CLI
- **Issue**: Appears to be a bug in the `process.env` Proxy implementation's `get` trap specifically for the `NODE_ENV` property
- **Scope**: Only affects `NODE_ENV`; other environment variables work correctly

## 📞 Contact

This is a minimal reproducible example for a bug report to Cloudflare Workers team.