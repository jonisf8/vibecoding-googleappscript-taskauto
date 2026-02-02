
# GAS-TaskAutomation

_Last updated: 2 February 2026_

>A Google Apps Script project for automating tasks in Google Workspace using an agentic workflow.

## Features

- Automate repetitive tasks in Google Sheets, Docs, or other Google Workspace apps
- Intelligent task routing and execution using Google Gemini API
- Email reporting and robust error handling

## Workflow Overview

The solution is organized into several key blocks:

1. **To-Do List Analysis**: Loads configuration, fetches tasks, skips failed or simple tasks, and preprocesses titles.
2. **Router Agent**: Classifies each task and decides the best strategy (execute or skip), assigning a worker role and instructions.
3. **Worker Agent**: Executes the main work for the task (e.g., research, summarization) and returns the result.
4. **Result Handling & Reporting**: Sends an email report and marks the task as complete or failed, with robust error handling.
5. **Utilities & API Connectors**: Helper functions for configuration, formatting, and API calls (e.g., Gemini, Gmail).

## Usage

1. Copy the contents of `src/Code.js` into your Google Apps Script project.
2. Follow the comments in the code to configure and run your automation.


## Workflow Diagram

To-Do List Analysis → Router Agent → Worker Agent → Result Handling & Reporting → Utilities & API Connectors

## Repository Snapshot (2 February 2026)

Current repository folder contents:

- `.git/` (git metadata)
- `LICENSE` - MIT License
- `README.md` - Project documentation
- `src/` - Source code
  - `Code.js` - Main Google Apps Script implementation
- `tests/` - Test suite (isolated testing environment)
  - `Code.test.js` - Jest unit tests (21 tests)
  - `utilities.js` - Exported utility functions for testing
  - `jest.config.js` - Jest test configuration
  - `TEST_SETUP.md` - Testing setup guide
  - `package.json` - NPM dependencies for testing
  - `package-lock.json` - Locked dependency versions
  - `node_modules/` - Installed npm packages
- `scripts/` - Helper scripts
  - `test.sh` - Test runner (run from root: `./scripts/test.sh`)
- `bckp/` - Backup folder
  - `Code_Experiments-GH300.js`

## Setup

- Prerequisites: a Google account with access to Google Tasks and Google Apps Script, `git` installed locally.
- Clone the repository:

```bash
git clone https://github.com/jonisf8/vibecoding-googleappscript-taskauto.git
cd vibecoding-googleappscript-taskauto
```

## Configuration

- The script expects two Script Properties (set in Google Apps Script):
	- `GEMINI_API_KEY` — API key for the Google Generative Language / Gemini API.
	- `TASK_LIST_ID` — The Google Tasks list ID used by the automation.
- Optional settings to review in `src/Code.js`:
	- `modelId` — model used for generation (default `gemini-2.5-flash`).
	- `maxTasks` / `rateLimitMs` — runtime limits to control load and pacing.

## Deployment (Google Apps Script)

1. Open https://script.google.com and create a new project.
2. Copy the contents of `src/Code.js` into the Apps Script editor.
3. In the Apps Script UI set the Script Properties (`Project Settings` → `Script properties`) for `GEMINI_API_KEY` and `TASK_LIST_ID`.
4. Create a time-driven trigger for the `main` function (e.g., every 10 minutes) or run manually for testing.

## Testing & Local Development

### Local Testing with Jest

The project includes a comprehensive test suite using Jest for local development and CI/CD integration. See [tests/TEST_SETUP.md](tests/TEST_SETUP.md) for detailed testing documentation.

**Quick Start:**
```bash
cd tests
npm install
npm test
```

**Or from root:**
```bash
./scripts/test.sh
```

**Test Coverage:**
- 21 unit tests across 6 test suites
- URL detection, title preprocessing, task filtering, string cleaning, markdown conversion, and JSON parsing
- All tests pass with zero external dependencies required

### Google Apps Script Debugging

- Copy `src/Code.js` into Google Apps Script editor for cloud deployment
- Use `logTaskListIds()` in the Apps Script editor to list available task lists while debugging
- For rapid iteration: test utilities locally with Jest, then deploy to Apps Script

## Contributing

- Fork the repo, create a feature branch, and open a pull request.
- Keep changes focused and include a short description of behavioral changes.
- For significant changes, include a short testing note describing how to validate in Apps Script.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.