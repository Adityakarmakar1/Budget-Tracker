/*
 * Gemini AI client for financial analysis.
 * Uses the REST API directly — no SDK needed.
 */

const GEMINI_API_KEY = 'AIzaSyCjmGvGkYZQpRugx2XYdKbfpOfCvXL0T58';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface AISummary {
  summary: string;
  healthScore: number; // 0-100
  healthLabel: string; // e.g. "Excellent", "Good", "Needs Attention"
  insights: {
    title: string;
    description: string;
    severity: 'good' | 'warning' | 'bad';
    metric?: string;
  }[];
  recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  categoryAnalysis: {
    category: string;
    observation: string;
    suggestion: string;
  }[];
  spendingPattern: string;
  savingsTips: string[];
}

interface AnalysisInput {
  summary: { income: number; expense: number; net: number; savingsRate: number };
  prevSummary?: { income: number; expense: number; net: number; savingsRate: number };
  trend: { label: string; income: number; expense: number; net: number }[];
  slices: { category: string; value: number; share: number }[];
  statuses: { category: string; limit: number; spent: number; remaining: number; pct: number; over: boolean }[];
  recentTransactions: { type: string; amount: number; category: string; description: string; date: string }[];
  monthLabel: string;
}

function buildPrompt(data: AnalysisInput): string {
  const { summary, prevSummary, trend, slices, statuses, recentTransactions, monthLabel } = data;

  const trendStr = trend.map(t => `${t.label}: income $${t.income.toFixed(0)}, expense $${t.expense.toFixed(0)}, net $${t.net.toFixed(0)}`).join('; ');
  const slicesStr = slices.map(s => `${s.category}: $${s.value.toFixed(0)} (${(s.share*100).toFixed(0)}%)`).join('; ');
  const budgetsStr = statuses.map(b => `${b.category}: limit $${b.limit.toFixed(0)}, spent $${b.spent.toFixed(0)} (${(b.pct*100).toFixed(0)}%) ${b.over ? 'OVER' : 'ok'}`).join('; ');
  const txnsStr = recentTransactions.slice(0, 20).map(t => `${t.date} ${t.type} $${t.amount.toFixed(2)} ${t.category} - ${t.description}`).join('\n');
  const prevStr = prevSummary ? `Previous month: income $${prevSummary.income.toFixed(0)}, expense $${prevSummary.expense.toFixed(0)}, net $${prevSummary.net.toFixed(0)}, savings ${(prevSummary.savingsRate*100).toFixed(0)}%` : 'No previous month data';

  return `You are a expert financial advisor AI. Analyze this personal finance data for the month of ${monthLabel}.

CURRENT MONTH SUMMARY:
- Income: $${summary.income.toFixed(2)}
- Expenses: $${summary.expense.toFixed(2)}
- Net (savings): $${summary.net.toFixed(2)}
- Savings rate: ${(summary.savingsRate*100).toFixed(1)}%

${prevStr}

6-MONTH TREND:
${trendStr}

SPENDING BY CATEGORY (this month):
${slicesStr || 'No spending recorded'}

BUDGET STATUS:
${budgetsStr || 'No budgets set'}

RECENT TRANSACTIONS (latest 20):
${txnsStr || 'No transactions'}

Provide a thorough financial analysis. Respond with ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "summary": "2-3 sentence overall financial health assessment",
  "healthScore": <number 0-100>,
  "healthLabel": "<Excellent|Good|Fair|Needs Attention|Critical>",
  "insights": [
    {"title": "short title", "description": "1-2 sentence explanation", "severity": "<good|warning|bad>", "metric": "optional short metric like '$1,200 saved'"}
  ],
  "recommendations": [
    {"title": "actionable title", "description": "specific advice", "priority": "<high|medium|low>"}
  ],
  "categoryAnalysis": [
    {"category": "category name", "observation": "what you noticed", "suggestion": "specific suggestion"}
  ],
  "spendingPattern": "2-3 sentence analysis of spending patterns and trends",
  "savingsTips": ["tip 1", "tip 2", "tip 3", "tip 4"]
}

Provide 4-6 insights, 3-5 recommendations, and analyze the top spending categories. Be specific and use actual numbers from the data. If there is no data, say so gracefully.`;
}

export async function analyzeFinances(data: AnalysisInput): Promise<AISummary> {
  const prompt = buildPrompt(data);

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errText.slice(0, 200)}`);
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini');

  // Parse the JSON response
  let parsed: AISummary;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Try to extract JSON from the text
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse AI response');
    parsed = JSON.parse(match[0]);
  }

  // Validate / sanitize
  return {
    summary: parsed.summary ?? 'Analysis unavailable.',
    healthScore: Math.max(0, Math.min(100, parsed.healthScore ?? 50)),
    healthLabel: parsed.healthLabel ?? 'Fair',
    insights: Array.isArray(parsed.insights) ? parsed.insights : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    categoryAnalysis: Array.isArray(parsed.categoryAnalysis) ? parsed.categoryAnalysis : [],
    spendingPattern: parsed.spendingPattern ?? '',
    savingsTips: Array.isArray(parsed.savingsTips) ? parsed.savingsTips : [],
  };
}
