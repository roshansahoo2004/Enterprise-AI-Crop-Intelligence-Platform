const Groq = require('groq-sdk');

/**
 * Enterprise Groq Service Module
 * Handles Groq API interactions with model fallback and error resilience.
 */
class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.client = null;

    if (this.apiKey && this.apiKey !== 'your_groq_api_key_here') {
      try {
        this.client = new Groq({ apiKey: this.apiKey });
      } catch (err) {
        console.warn('[Groq Service] Failed to initialize Groq SDK:', err.message);
      }
    }

    // Models ordered by priority
    this.models = [
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'llama3-70b-8192',
      'mixtral-8x7b-32768'
    ];
  }

  /**
   * Generate AI Chat Completion via Groq SDK
   */
  async generateCompletion(systemPrompt, userMessages) {
    if (!this.client) {
      console.warn('[Groq Service] Client not initialized, skipping Groq execution');
      return null;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...userMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))
    ];

    for (const model of this.models) {
      try {
        const response = await this.client.chat.completions.create({
          messages,
          model,
          temperature: 0.4,
          max_tokens: 1024,
          top_p: 0.9
        });

        const reply = response.choices?.[0]?.message?.content;
        if (reply) {
          return {
            content: reply,
            modelUsed: model,
            source: 'Groq LLM'
          };
        }
      } catch (err) {
        console.warn(`[Groq Service] Model ${model} failed (${err.message}). Trying next fallback model...`);
      }
    }

    return null;
  }
}

module.exports = new GroqService();
