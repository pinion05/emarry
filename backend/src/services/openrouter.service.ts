// backend/src/services/openrouter.service.ts
interface EmailData {
  subject: string;
  from: string;
  snippet: string;
}

export async function summarizeEmails(emails: EmailData[]): Promise<string> {
  const prompt = `다음 이메일들을 3문장 이내로 요약해주세요. 중요한 내용 위주로 정리해주세요:\n\n${
    emails.map((e, i) =>
      `${i + 1}. ${e.subject} (${e.from})\n${e.snippet}`
    ).join('\n\n')
  }`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://emarry.app',
        'X-Title': 'emarry'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-nano-30b-a3b:free',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter error:', error);
    throw error;
  }
}
