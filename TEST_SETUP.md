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
 PASS  tests/Code.test.js
  URL Detection
    ✓ detects HTTPS URLs (1 ms)
    ✓ detects HTTP URLs
    ✓ rejects non-URL strings (1 ms)
  Title Preprocessing
    ✓ handles long URLs by extracting hostname
    ✓ truncates long text to 80 characters
    ✓ preserves short titles unchanged
    ✓ handles malformed URLs gracefully
  Simple Task Detection
    ✓ identifies tasks with skip keywords (1 ms)
    ✓ allows complex tasks without skip keywords
    ✓ is case-insensitive
  String Cleaning
    ✓ removes non-ASCII characters
    ✓ trims whitespace
    ✓ handles empty strings
  Markdown to HTML Conversion
    ✓ converts headers to HTML (1 ms)
    ✓ converts bold text
    ✓ converts bullet lists
    ✓ handles complex markdown
  Router Response Parsing
    ✓ parses valid JSON responses
    ✓ handles JSON wrapped in code blocks
    ✓ provides fallback for invalid JSON
    ✓ has consistent fallback structure

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
```

## Project Structure

```
vibecoding-googleappscript-taskauto/
├── package.json              # Dependencies & scripts (at root)
├── src/
│   └── Code.js              # Original Google Apps Script code
├── tests/
│   ├── Code.test.js         # Jest tests
│   ├── utilities.js         # Testable utility functions (exported)
│   └── jest.config.js       # Jest configuration
└── bckp/
    └── Code_Experiments-GH300.js
```

## Notes

- **package.json** is at the project root (required by npm)
- **jest.config.js** is in the tests directory and configured to find tests there
- **utilities.js** exports all testable functions so they can be imported in Jest
- **Code.js** remains unchanged for Google Apps Script deployment
- Tests use Jest's standard `describe()`, `test()`, and `expect()` syntax
- All tests are isolated and don't require external APIs (no Gemini key needed)
