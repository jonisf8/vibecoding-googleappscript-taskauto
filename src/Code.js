/**
 * ======================================================================
 * AGENTIC WORKFLOW: ROUTER & WORKER (FINAL COMPLETE VERSION)
 * ======================================================================
 * Features: Configuration loaded securely from Script Properties. Hardened 
 * against all known API size/format errors (Tasks and Email Subject).
 */

// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
  // These variables are populated dynamically in validateConfig()
  taskListId: null, 
  apiKey: null,
  
  modelId: 'gemini-2.5-flash',
  maxTasks: 5,
  rateLimitMs: 2000, 
  skipKeywords: ['book', 'call', 'pay', 'schedule', 'buy', 'order', 'clean', 'fix'],
};

// ==========================================
// MAIN TRIGGER (The Cron Job)
// ==========================================

function main() {
  // CRITICAL: Ensure configuration is loaded securely
  validateConfig(); 
  console.log('--- Starting Agentic Workflow...');

  try {
    const tasks = Tasks.Tasks.list(CONFIG.taskListId, { 
      showCompleted: false, 
      maxResults: CONFIG.maxTasks 
    });

    if (!tasks.items || tasks.items.length === 0) return console.log('--- No active tasks found.');

    for (const task of tasks.items) {
      // Skip tasks previously marked as failed
      if (task.title.startsWith('FAILED_TASK')) continue; 

      // 🛑 CRITICAL FIX: Create a safe copy of the task object 
      const taskCopy = JSON.parse(JSON.stringify(task)); 
      
      const originalTitle = taskCopy.title;
      // Preprocess the title for safe logging/internal reference
      taskCopy.title = preprocessTitle(originalTitle); 

      if (isSimpleTask(taskCopy.title)) {
        console.log(`--- Skipping simple task: "${taskCopy.title}"`);
        completeTask(taskCopy, taskCopy.title); // Use the preprocessed title for simple skips
        continue;
      }

      try {
        const decision = routeTaskIntent(originalTitle);
        console.log(`--- Strategy: ${decision.action} | Role: ${decision.worker_role}`);

        // 2. Worker: Execute Research
        const researchRaw = executeWorkerAgent(originalTitle, decision);
        
        if (researchRaw) {
            console.log(`--- Worker Output: Received ${researchRaw.length} characters.`);
        } else {
            console.warn(`--- Worker Output: Received no content.`);
        }

        if (researchRaw) {
          // Send email report (hyper-aggressively truncated subject)
          sendReportEmail(originalTitle, researchRaw, decision);
          
          // 🆕 FINAL FIX: Use the ORIGINAL title if the current title is the generic fallback, 
          // allowing completeTask to generate a descriptive 50-character title.
          const titleToUse = (taskCopy.title === "LongSummary") ? originalTitle : taskCopy.title;
          
          completeTask(taskCopy, titleToUse); 
          
        } else {
          failTask(taskCopy, "AI returned no content."); 
        }
      } catch (e) {
        // If any processing (including email) fails, call failTask with the SAFE taskCopy
        failTask(taskCopy, `Processing error: ${e.toString()}`);
      }
      
      Utilities.sleep(CONFIG.rateLimitMs);
    }
  } catch (e) {
    console.error(`--- CRITICAL SYSTEM ERROR: ${e.toString()}`);
  }
}

// ==========================================
// AGENT 1: THE ROUTER
// ==========================================
function routeTaskIntent(userTask) {
  const systemInstruction = `
    Role: Workflow Architect.
    Task: Analyze the user request: "${userTask}".
    Goal: Decide the best strategy and write instructions for a subordinate worker.
    
    Categories:
    - SUMMARY: For URLs, "read this", "paper on...", specific documents.
    - BRAINSTORM: For "ideas for", "how to", vague concepts, creative needs.
    - SKIP: For chores (buy milk, schedule meeting, email Bob).
    
    Output JSON ONLY:
    {
      "action": "EXECUTE" or "SKIP",
      "reasoning": "One sentence explaining why you chose this strategy.",
      "worker_role": "Role Name (e.g., Creative Strategist)", 
      "worker_instructions": "Precise, step-by-step instructions for the worker to generate the content..."
    }
  `;
  
  const response = callGemini(systemInstruction, "Classify this task.");
  
  try {
    const cleanJson = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.warn("Router JSON parse failed. Defaulting to General Research.");
    return { 
      action: "EXECUTE", 
      reasoning: "Router failed to output JSON. Fallback used.",
      worker_role: "General Researcher",
      worker_instructions: "Analyze the topic creatively and suggest next steps."
    };
  }
}

// ==========================================
// AGENT 2: THE WORKER
// ==========================================
function executeWorkerAgent(topic, decision) {
  const instruction = `
    ${decision.worker_instructions}
    
    Additional Constraints:
    1. Format using Markdown (bolding, lists, headers).
    2. NO filler words. Be concise.
    3. Include 3-5 Actionable Next Steps.
    4. If providing links, use high-authority sources.
  `;
  return callGemini(instruction, `Topic: "${topic}"`);
}

// ==========================================
// API CONNECTOR (Gemini)
// ==========================================
function callGemini(systemInstruction, userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.modelId}:generateContent?key=${CONFIG.apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    system_instruction: { parts: [{ text: systemInstruction }] }, 
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText()); 

  if (response.getResponseCode() !== 200) throw new Error(json.error?.message || 'API Error');
  return json.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

// ==========================================
// EMAIL REPORTER
// ==========================================
function sendReportEmail(subject, rawBody, decision) {
  const recipient = Session.getActiveUser().getEmail();
  const htmlContent = simpleMarkdownToHtml(rawBody);
  
  // 🛑 FINAL FIX: Implement hyper-aggressive 5-character truncation for the email subject (safe length).
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
    charset: 'UTF-8'
  });
}

// ==========================================
// UTILITIES
// ==========================================

function validateConfig() {
  CONFIG.apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  CONFIG.taskListId = PropertiesService.getScriptProperties().getProperty('TASK_LIST_ID');
  
  if (!CONFIG.apiKey) throw new Error("Missing 'GEMINI_API_KEY' in Script Properties.");
  if (!CONFIG.taskListId) throw new Error("Missing 'TASK_LIST_ID' in Script Properties.");
}

function isUrl(str) {
  return str.startsWith('http://') || str.startsWith('https://');
}

function preprocessTitle(title) {
  // If title is excessively long, check if it's a URL
  if (title.length > 80) { 
    if (isUrl(title)) {
      try {
        const urlObj = new URL(title);
        // Returns a safe title based on the domain name
        return `Summary: ${urlObj.hostname.substring(0, 50)}`; 
      } catch (e) {
        // Use an absolutely safe, simple fallback word (no symbols, no spaces)
        return "LongSummary"; 
      }
    } else {
      // If it's long text, truncate it safely for processing/logging
      return title.substring(0, 80) + '...';
    }
  }
  return title;
}

function isSimpleTask(title) {
  return CONFIG.skipKeywords.some(word => title.toLowerCase().includes(word));
}

// 🆕 UPDATED: completeTask now accepts a descriptiveTitle
function completeTask(task, descriptiveTitle = task.title) {
  try {
    // Use the descriptiveTitle (either original or preprocessed) and limit to 50 characters
    const safeTitle = descriptiveTitle.substring(0, 50) + (descriptiveTitle.length > 50 ? '...' : '');

    Tasks.Tasks.update({ 
      id: task.id, 
      title: safeTitle, 
      status: 'completed' 
    }, CONFIG.taskListId, task.id);
    
    // Log the final title written to the API
    console.log(`--- Task completed: ${safeTitle}`); 
  } catch (e) { 
    console.warn(`--- Failed to complete task: ${e}`); 
  }
}

function failTask(task, reason) {
  try {
    // Uses an absolute minimal title ("FAILED_TASK") to guarantee the API call succeeds.
    const safeFailTitle = `FAILED_TASK`; 
    
    Tasks.Tasks.update({ 
      id: task.id, 
      title: safeFailTitle, 
      status: 'needsAction' 
    }, CONFIG.taskListId, task.id);
    
    // Log the error using the pre-processed title for context
    console.error(`--- Task failed: ${task.title}. Reason: ${reason}`); 
  } catch (e) {
    console.error(`--- Double fail: Could not mark task as failed. Original reason: ${reason}`);
  }
}

function simpleMarkdownToHtml(md) {
  return md
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/\n/g, '<br>');
}

function cleanString(str) {
  return str.replace(/[^\x00-\x7F]/g, "").trim();
}

function logTaskListIds() {
  const lists = Tasks.Tasklists.list();
  lists.items.forEach(l => console.log(`ID: ${l.id} | Name: ${l.title}`));
}