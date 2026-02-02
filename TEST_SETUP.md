# Setup & Run Locally

## Installation

```bash
npm install
```

This installs Jest and its dependencies.

## Running Tests

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode (auto-rerun on file changes):**
```bash
npm run test:watch
```

**Run tests with coverage report:**
```bash
npm run test:coverage
```

## Test Output Example

```
 PASS  src/Code.test.js
  URL Detection
    ✓ detects HTTPS URLs (2 ms)
    ✓ detects HTTP URLs (1 ms)
    ✓ rejects non-URL strings (1 ms)
  Title Preprocessing
    ✓ handles long URLs by extracting hostname (1 ms)
    ✓ truncates long text to 80 characters (1 ms)
    ✓ preserves short titles unchanged (1 ms)
    ✓ handles malformed URLs gracefully (1 ms)
  Simple Task Detection
    ✓ identifies tasks with skip keywords (1 ms)
    ✓ allows complex tasks without skip keywords (1 ms)
    ✓ is case-insensitive (1 ms)
  String Cleaning
    ✓ removes non-ASCII characters (1 ms)
    ✓ trims whitespace (1 ms)
    ✓ handles empty strings (1 ms)
  Markdown to HTML Conversion
    ✓ converts headers to HTML (1 ms)
    ✓ converts bold text (1 ms)
    ✓ converts bullet lists (1 ms)
    ✓ handles complex markdown (1 ms)
  Router Response Parsing
    ✓ parses valid JSON responses (1 ms)
    ✓ handles JSON wrapped in code blocks (1 ms)
    ✓ provides fallback for invalid JSON (1 ms)
    ✓ has consistent fallback structure (1 ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
```

## Project Structure

```
vibecoding-googleappscript-taskauto/
├── package.json              # Dependencies & scripts
├── jest.config.js            # Jest configuration
├── src/
│   ├── Code.js              # Original Google Apps Script code
│   ├── utilities.js         # Testable utility functions (exported)
│   └── Code.test.js         # Jest tests
└── bckp/
    └── Code_Experiments-GH300.js
```

## Notes

- **utilities.js** exports all testable functions so they can be imported in Jest
- **Code.js** remains unchanged for Google Apps Script deployment
- Tests use Jest's standard `describe()`, `test()`, and `expect()` syntax
- All tests are isolated and don't require external APIs (no Gemini key needed)
