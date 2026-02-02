/**
 * AGENTIC WORKFLOW: Router & Worker
 * Reviewed copy with clearer, consistent comments and small readability improvements.
 * - Preserves original behavior.
 * - Improves comment style (JSDoc-like) so comments are fully readable.
 * - Avoids changing logic unless required for clarity.
 */

// Configuration object for runtime settings. Load secrets from Script Properties.
const CONFIG = {
  // Populated in validateConfig()
  taskListId: null,
  apiKey: null,

  // Default model and runtime limits
  modelId: 'gemini-2.5-flash',
  maxTasks: 5,
  rateLimitMs: 2000,

  // Keywords that indicate the task is a simple/chores type and should be skipped
  skipKeywords: ['book', 'call', 'pay', 'schedule', 'buy', 'order', 'clean', 'fix'],
};

/**
 * Main entry point (cron trigger).
 * Loads configuration, iterates active tasks and routes them through the router and worker.
 */
function main() {
  validateConfig();
  console.log('Starting Agentic Workflow...');

  try {
    const tasks = Tasks.Tasks.list(CONFIG.taskListId, {
      showCompleted: false,
      maxResults: CONFIG.maxTasks,
    });

    if (!tasks.items || tasks.items.length === 0) {
      console.log('No active tasks found.');
      return;
    }

    for (const task of tasks.items) {
      // Skip tasks that were previously marked as failed by the system
      if (task.title && task.title.startsWith('FAILED_TASK')) continue;

      // Work with a safe deep copy to avoid accidental mutation of the original object
      const taskCopy = JSON.parse(JSON.stringify(task));

      const originalTitle = taskCopy.title || '';

      // Preprocess title for safe logging and internal references
      taskCopy.title = preprocessTitle(originalTitle);

      if (isSimpleTask(taskCopy.title)) {
        console.log(`Skipping simple task: "${taskCopy.title}"`);
        // Mark simple tasks as completed (uses the preprocessed title)
        completeTask(taskCopy, taskCopy.title);
        continue;
      }

      try {
        // Router decides whether to execute or skip and provides worker instructions
        const decision = routeTaskIntent(originalTitle);
        console.log(`Strategy: ${decision.action} | Role: ${decision.worker_role}`);

        // Worker executes the task based on router instructions
        const researchRaw = executeWorkerAgent(originalTitle, decision);

        if (researchRaw) {
          console.log(`Worker output length: ${researchRaw.length} characters.`);
          sendReportEmail(originalTitle, researchRaw, decision);

          // If the preprocessed title is a generic fallback, prefer the original title for completion
          const titleToUse = taskCopy.title === 'LongSummary' ? originalTitle : taskCopy.title;
          completeTask(taskCopy, titleToUse);
        } else {
          failTask(taskCopy, 'AI returned no content.');
        }
      } catch ( e ) {
        // Any error during processing should mark the task as failed with a safe title
        failTask(taskCopy, `Processing error: ${e.toString()}`);
      }

      Utilities.sleep(CONFIG.rateLimitMs);
    }
  } catch (e) {
    console.error(`CRITICAL SYSTEM ERROR: ${e.toString()}`);
  }
}

// -------------------------
// Router agent
// -------------------------
/**
 * Analyze the user-provided task text and return a JSON decision object.
 * The returned object should contain: action, reasoning, worker_role, worker_instructions.
 * If parsing fails, a safe default decision is returned.
 */
function routeTaskIntent(userTask) {
  const systemInstruction = `
    Role: Workflow Architect.
    Task: Analyze the user request: "${userTask}".
    Goal: Decide the best strategy and write instructions for a subordinate worker.

    Categories:
    - SUMMARY: For URLs, "read this", "paper on...", specific documents.
    - BRAINSTORM: For "ideas for", "how to", vague concepts, creative needs.
    - SKIP: For simple chores (buy milk, schedule meeting, email Bob).

    Output JSON ONLY:
    {
      "action": "EXECUTE" or "SKIP",
      "reasoning": "One sentence explaining why you chose this strategy.",
      "worker_role": "Role Name (e.g., Creative Strategist)",
      "worker_instructions": "Precise, step-by-step instructions for the worker to generate the content..."
    }
  `;

  const response = callGemini(systemInstruction, 'Classify this task.');

  try {
    const cleanJson = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.warn('Router JSON parse failed. Defaulting to General Research.');
    return {
      action: 'EXECUTE',
      reasoning: 'Router failed to output JSON. Fallback used.',
      worker_role: 'General Researcher',
      worker_instructions: 'Analyze the topic creatively and suggest next steps.',
    };
  }
}

// -------------------------
// Worker agent
// -------------------------
/**
 * Execute the worker instructions for the given topic and return the text output.
 * Output should be Markdown-formatted text.
 */
function executeWorkerAgent(topic, decision) {
  const instruction = `
    ${decision.worker_instructions}

    Additional Constraints:
    1. Format using Markdown (bolding, lists, headers).
    2. Avoid filler words; be concise.
    3. Include 3-5 actionable next steps.
    4. If providing links, prefer high-authority sources.
  `;

  return callGemini(instruction, `Topic: "${topic}"`);
}

// -------------------------
// Gemini API connector
// -------------------------
/**
 * Call the Gemini (Generative Language) API and return the generated text.
 * Throws if the API returns a non-200 response.
 */
function callGemini(systemInstruction, userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.modelId}:generateContent?key=${CONFIG.apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    system_instruction: { parts: [{ text: systemInstruction }] },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());

  if (response.getResponseCode() !== 200) throw new Error(json.error?.message || 'API Error');
  return json.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

// -------------------------
// Email reporter
// -------------------------
/**
 * Send an email report to the script owner with a short, safe subject and HTML body.
 * Truncates long subjects aggressively to avoid downstream API/recipient failures.
 */
function sendReportEmail(subject, rawBody, decision) {
  const recipient = Session.getActiveUser().getEmail();
  const htmlContent = simpleMarkdownToHtml(rawBody);

  // Very short truncation limit to keep subjects safe across systems
  const TRUNCATION_LIMIT = 5;
  const truncatedSubjectContent = subject.substring(0, TRUNCATION_LIMIT);
  const isTruncated = subject.length > TRUNCATION_LIMIT;
  const shortSubject = truncatedSubjectContent + (isTruncated ? '...' : '');

  const safeSubject = cleanString(`Research: ${shortSubject}`);

  const emailHtml = `
    <div style="font-family: 'Helvetica', sans-serif; max-width: 650px; color: #333;">
      <div style="background:#4285f4; padding:15px; border-radius:5px 5px 0 0; color:white;">
        <h2 style="margin:0; font-size:18px;">Research Bot: ${cleanString(shortSubject)}</h2>
      </div>

      <div style="background:#f1f3f4; padding:12px; font-size:12px; color:#555; border-bottom:1px solid #ddd;">
        <strong>Strategy:</strong> ${decision.reasoning}<br>
        <strong>Role:</strong> ${decision.worker_role}
      </div>

      <div style="padding:20px; border:1px solid #ddd; border-top:none; background:white;">
        ${htmlContent}
      </div>

      <p style="font-size: 11px; color: #999; text-align: center; margin-top: 20px;">
        Automated by Google Apps Script & Gemini
      </p>
    </div>
  `;

  GmailApp.sendEmail(recipient, safeSubject, cleanString(rawBody), {
    htmlBody: emailHtml,
    charset: 'UTF-8',
  });
}

// -------------------------
// Utilities
// -------------------------
function validateConfig() {
  CONFIG.apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  CONFIG.taskListId = PropertiesService.getScriptProperties().getProperty('TASK_LIST_ID');

  if (!CONFIG.apiKey) throw new Error("Missing 'GEMINI_API_KEY' in Script Properties.");
  if (!CONFIG.taskListId) throw new Error("Missing 'TASK_LIST_ID' in Script Properties.");
}

function isUrl(str) {
  return str && (str.startsWith('http://') || str.startsWith('https://'));
}

/**
 * Preprocess long or potentially unsafe titles:
 * - If the title is a URL, return a safe summary using the hostname.
 * - If the title is very long text, truncate to 80 characters.
 * - Otherwise, return the title unchanged.
 */
function preprocessTitle(title) {
  if (!title) return '';

  if (title.length > 80) {
    if (isUrl(title)) {
      try {
        const urlObj = new URL(title);
        return `Summary: ${urlObj.hostname.substring(0, 50)}`;
      } catch (e) {
        return 'LongSummary';
      }
    } else {
      return title.substring(0, 80) + '...';
    }
  }
  return title;
}

function isSimpleTask(title) {
  if (!title) return false;
  return CONFIG.skipKeywords.some(word => title.toLowerCase().includes(word));
}

/**
 * Mark a task completed. Accepts an optional descriptiveTitle to improve the final title used.
 */
function completeTask(task, descriptiveTitle = task.title) {
  try {
    const safeTitle = (descriptiveTitle || '').substring(0, 50) + ((descriptiveTitle || '').length > 50 ? '...' : '');

    Tasks.Tasks.update({
      id: task.id,
      title: safeTitle,
      status: 'completed',
    }, CONFIG.taskListId, task.id);

    console.log(`Task completed: ${safeTitle}`);
  } catch (e) {
    console.warn(`Failed to complete task: ${e}`);
  }
}

/**
 * Mark a task as failed with a minimal safe title to avoid issues when updating.
 */
function failTask(task, reason) {
  try {
    const safeFailTitle = 'FAILED_TASK';

    Tasks.Tasks.update({
      id: task.id,
      title: safeFailTitle,
      status: 'needsAction',
    }, CONFIG.taskListId, task.id);

    console.error(`Task failed: ${task.title}. Reason: ${reason}`);
  } catch (e) {
    console.error(`Double fail: Could not mark task as failed. Original reason: ${reason}`);
  }
}

// Very small markdown-to-HTML converter tailored for simple outputs
function simpleMarkdownToHtml(md) {
  return (md || '')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/\n/g, '<br>');
}

function cleanString(str) {
  return (str || '').replace(/[^\x00-\x7F]/g, '').trim();
}

function logTaskListIds() {
  const lists = Tasks.Tasklists.list();
  lists.items.forEach(l => console.log(`ID: ${l.id} | Name: ${l.title}`));
}
