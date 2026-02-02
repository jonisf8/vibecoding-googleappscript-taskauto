# Setup & Run Locally

## Installation

```bash
cd tests
npm install
```

This installs Jest and its dependencies in the `/tests` directory.

## Running Tests

**From root directory:**
```bash
./scripts/test.sh              # Run all tests
./scripts/test.sh --watch      # Watch mode
./scripts/test.sh --coverage   # Coverage report
```

**From tests directory:**
```bash
cd tests
npm test                       # Run all tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report
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
├── src/
│   └── Code.js                    # Original Google Apps Script code
├── tests/
│   ├── package.json               # NPM dependencies
│   ├── package-lock.json          # Locked versions
│   ├── node_modules/              # Installed packages
│   ├── Code.test.js               # Jest tests
│   ├── utilities.js               # Testable utility functions
│   └── jest.config.js             # Jest configuration
├── scripts/
│   └── test.sh                    # Test runner wrapper (from root)
├── README.md
├── TEST_SETUP.md
└── bckp/
    └── Code_Experiments-GH300.js
```

## Notes

- **All testing dependencies are isolated in `/tests`** (package.json, node_modules, etc.)
- **Run tests from root** using `./scripts/test.sh` or `cd tests && npm test`
- **jest.config.js** is configured to find tests in the same directory
- **utilities.js** exports all testable functions for Jest
- **Code.js** remains in `/src` unchanged for Google Apps Script deployment
- Tests use Jest's standard `describe()`, `test()`, and `expect()` syntax
- All tests are isolated and don't require external APIs (no Gemini key needed)
