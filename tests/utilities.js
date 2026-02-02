/**
 * ======================================================================
 * CODE MODULE: Exported functions for testing
 * ======================================================================
 * This is a testable version separating business logic from GAS APIs
 */

// Configuration object
const CONFIG = {
  taskListId: null,
  apiKey: null,
  modelId: 'gemini-2.5-flash',
  maxTasks: 5,
  rateLimitMs: 2000,
  skipKeywords: ['book', 'call', 'pay', 'schedule', 'buy', 'order', 'clean', 'fix'],
};

// ==========================================
// UTILITY FUNCTIONS (Testable)
// ==========================================

function isUrl(str) {
  return str.startsWith('http://') || str.startsWith('https://');
}

function preprocessTitle(title) {
  if (title.length > 80) {
    if (isUrl(title)) {
      try {
        const urlObj = new URL(title);
        return `Summary: ${urlObj.hostname.substring(0, 50)}`;
      } catch (e) {
        return "LongSummary";
      }
    } else {
      return title.substring(0, 80) + '...';
    }
  }
  return title;
}

function isSimpleTask(title) {
  return CONFIG.skipKeywords.some(word => title.toLowerCase().includes(word));
}

function cleanString(str) {
  return str.replace(/[^\x00-\x7F]/g, "").trim();
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

function parseRouterResponse(response) {
  try {
    const cleanJson = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    return {
      action: "EXECUTE",
      reasoning: "Router failed to output JSON. Fallback used.",
      worker_role: "General Researcher",
      worker_instructions: "Analyze the topic creatively and suggest next steps."
    };
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    isUrl,
    preprocessTitle,
    isSimpleTask,
    cleanString,
    simpleMarkdownToHtml,
    parseRouterResponse,
  };
}
