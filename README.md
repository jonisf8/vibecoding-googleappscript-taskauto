
# GAS-TaskAutomation

_Last updated: 2 February 2026_

>A Google Apps Script project for automating tasks in Google Workspace using an agentic workflow with Gmail, Google Tasks and Gemini API endpoint.

## Features

- **Agentic Workflow**: Multi-agent system (Router and Worker) for intelligent task routing and execution
- **Gmail Integration**: Automated email reporting of task results
- **Google Tasks API**: Seamless task list management and updates
- **Gemini API**: Advanced LLM capabilities for task analysis and execution
- **Local Testing**: Comprehensive Jest test suite for development and CI/CD
- **Error Handling**: Robust failure handling with detailed logging
- **Configurable**: Easy setup via Script Properties and tunable parameters


## Workflow Overview

The solution is organized into several key blocks:

1. **To-Do List Analysis**: Loads configuration, fetches tasks, skips failed or simple tasks, and preprocesses titles.
2. **Router Agent**: Classifies each task and decides the best strategy (execute or skip), assigning a worker role and instructions.
3. **Worker Agent**: Executes the main work for the task (e.g., research, summarization) and returns the result.
4. **Result Handling & Reporting**: Sends an email report and marks the task as complete or failed, with robust error handling.
5. **Utilities & API Connectors**: Helper functions for configuration, formatting, and API calls (e.g., Gemini, Gmail).

To-Do List Analysis → Router Agent → Worker Agent → Result Handling & Reporting

## Deployment (Google Apps Script)

1. Open https://script.google.com and create a new project.
2. Copy the contents of `src/Code.js` into the Apps Script editor.
3. In the Apps Script UI set the Script Properties (`Project Settings` → `Script properties`) for `GEMINI_API_KEY` and `TASK_LIST_ID`.
4. Create a time-driven trigger for the `main` function (e.g., every 10 minutes) or run manually for testing.

## Configuration

- The script expects two Script Properties (set in Google Apps Script):
	- `GEMINI_API_KEY` — API key for the Google Generative Language / Gemini API.
	- `TASK_LIST_ID` — The Google Tasks list ID used by the automation.
- Optional settings to review in `src/Code.js`:
	- `modelId` — model used for generation (default `gemini-2.5-flash`).
	- `maxTasks` / `rateLimitMs` — runtime limits to control load and pacing.

## Modifying the code - Quick start

```bash
# Clone the repository
git clone https://github.com/jonisf8/vibecoding-googleappscript-taskauto.git
cd vibecoding-googleappscript-taskauto

# Run tests locally
cd tests
npm install
npm test

# Or run from root
./scripts/test.sh
```

## Repository Structure

Current repository folder contents:

```
vibecoding-googleappscript-taskauto/
├── .git/                          # Git metadata
├── LICENSE                        # MIT License
├── README.md                      # Project documentation
├── src/
│   └── Code.js                   # Main Google Apps Script implementation
├── tests/                         # Test suite (isolated environment)
│   ├── Code.test.js              # Jest unit tests (21 tests)
│   ├── utilities.js              # Testable utility functions
│   ├── jest.config.js            # Jest configuration
│   ├── TEST_SETUP.md             # Testing setup guide
│   ├── package.json              # NPM dependencies
│   ├── package-lock.json         # Locked versions
│   └── node_modules/             # Installed packages
├── scripts/
│   └── test.sh                   # Test runner wrapper
└── bckp/
    └── Code_Experiments-GH300.js # Backup/experimental code
```

## Testing & Local Development

The project includes a comprehensive test suite using Jest for local development and CI/CD integration. See [tests/TEST_SETUP.md](tests/TEST_SETUP.md) for detailed testing documentation.

## Contributing

- Fork the repo, create a feature branch, and open a pull request.
- Keep changes focused and include a short description of behavioral changes.
- For significant changes, include a short testing note describing how to validate in Apps Script.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.