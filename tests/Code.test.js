/**
 * ======================================================================
 * JEST UNIT TESTS: Agentic Workflow Router & Worker
 * ======================================================================
 * Framework: Jest (Node.js testing)
 * Run: npm test
 */

const {
  CONFIG,
  isUrl,
  preprocessTitle,
  isSimpleTask,
  cleanString,
  simpleMarkdownToHtml,
  parseRouterResponse,
} = require('./utilities');

describe('URL Detection', () => {
  test('detects HTTPS URLs', () => {
    expect(isUrl('https://example.com')).toBe(true);
  });

  test('detects HTTP URLs', () => {
    expect(isUrl('http://example.com')).toBe(true);
  });

  test('rejects non-URL strings', () => {
    expect(isUrl('just some text')).toBe(false);
  });
});

describe('Title Preprocessing', () => {
  test('handles long URLs by extracting hostname', () => {
    const longUrl = 'https://en.wikipedia.org/wiki/Artificial_intelligence';
    const result = preprocessTitle(longUrl);
    expect(result).toContain('wikipedia.org');
  });

  test('truncates long text to 80 characters', () => {
    const longText = 'a'.repeat(100);
    const result = preprocessTitle(longText);
    expect(result.length).toBeLessThanOrEqual(84); // 80 + '...'
    expect(result).toContain('...');
  });

  test('preserves short titles unchanged', () => {
    const shortTitle = 'Quick task';
    expect(preprocessTitle(shortTitle)).toBe('Quick task');
  });

  test('handles malformed URLs gracefully', () => {
    const malformedUrl = 'https://[invalid-url';
    const result = preprocessTitle(malformedUrl);
    expect(result).toBeDefined();
  });
});

describe('Simple Task Detection', () => {
  beforeEach(() => {
    CONFIG.skipKeywords = ['book', 'call', 'pay', 'schedule', 'buy', 'order', 'clean', 'fix'];
  });

  test('identifies tasks with skip keywords', () => {
    expect(isSimpleTask('buy milk from store')).toBe(true);
    expect(isSimpleTask('schedule a meeting')).toBe(true);
    expect(isSimpleTask('clean the house')).toBe(true);
  });

  test('allows complex tasks without skip keywords', () => {
    expect(isSimpleTask('analyze market trends for q1')).toBe(false);
    expect(isSimpleTask('research machine learning algorithms')).toBe(false);
  });

  test('is case-insensitive', () => {
    expect(isSimpleTask('BUY groceries')).toBe(true);
    expect(isSimpleTask('SCHEDULE meeting')).toBe(true);
  });
});

describe('String Cleaning', () => {
  test('removes non-ASCII characters', () => {
    const input = 'Hello™ Wörld©';
    const result = cleanString(input);
    expect(result).toBe('Hello Wrld');
  });

  test('trims whitespace', () => {
    const input = '  hello world  ';
    expect(cleanString(input)).toBe('hello world');
  });

  test('handles empty strings', () => {
    expect(cleanString('')).toBe('');
  });
});

describe('Markdown to HTML Conversion', () => {
  test('converts headers to HTML', () => {
    const markdown = '## Main Title';
    const result = simpleMarkdownToHtml(markdown);
    expect(result).toContain('<h2>');
    expect(result).toContain('Main Title');
  });

  test('converts bold text', () => {
    const markdown = '**important text**';
    const result = simpleMarkdownToHtml(markdown);
    expect(result).toContain('<b>important text</b>');
  });

  test('converts bullet lists', () => {
    const markdown = '* item one\n* item two';
    const result = simpleMarkdownToHtml(markdown);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
  });

  test('handles complex markdown', () => {
    const markdown = '## Title\n**Bold** text\n* List item';
    const result = simpleMarkdownToHtml(markdown);
    expect(result).toContain('<h2>');
    expect(result).toContain('<b>');
    expect(result).toContain('<li>');
  });
});

describe('Router Response Parsing', () => {
  test('parses valid JSON responses', () => {
    const validJson = JSON.stringify({
      action: "EXECUTE",
      reasoning: "Test reasoning",
      worker_role: "Researcher",
      worker_instructions: "Do research"
    });
    const result = parseRouterResponse(validJson);
    expect(result.action).toBe('EXECUTE');
    expect(result.worker_role).toBe('Researcher');
  });

  test('handles JSON wrapped in code blocks', () => {
    const jsonWithBlocks = '```json\n{"action": "EXECUTE", "reasoning": "test", "worker_role": "Role", "worker_instructions": "Do it"}\n```';
    const result = parseRouterResponse(jsonWithBlocks);
    expect(result.action).toBe('EXECUTE');
  });

  test('provides fallback for invalid JSON', () => {
    const invalidJson = 'This is not JSON at all!';
    const result = parseRouterResponse(invalidJson);
    expect(result.action).toBe('EXECUTE');
    expect(result.worker_role).toBe('General Researcher');
    expect(result.worker_instructions).toBeDefined();
  });

  test('has consistent fallback structure', () => {
    const result = parseRouterResponse('invalid');
    expect(result).toHaveProperty('action');
    expect(result).toHaveProperty('reasoning');
    expect(result).toHaveProperty('worker_role');
    expect(result).toHaveProperty('worker_instructions');
  });
})
