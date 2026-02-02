
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

## Project Structure

- `src/Code.js` - Main script file
- `README.md` - Project documentation
- `LICENSE` - MIT License

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Workflow Diagram

To-Do List Analysis → Router Agent → Worker Agent → Result Handling & Reporting → Utilities & API Connectors