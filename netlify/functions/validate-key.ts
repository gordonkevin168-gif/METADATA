import { GoogleGenAI } from '@google/genai';

export const handler = async (event: any) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { apiKey, model = 'gemini-3.8-flash' } = JSON.parse(event.body || '{}');
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 5) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ valid: false, message: 'Format API Key tidak valid' }),
      };
    }

    const testAi = new GoogleGenAI({ apiKey: apiKey.trim() });
    const response = await testAi.models.generateContent({
      model,
      contents: 'Respond with OK only.',
    });

    if (response.text) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid: true,
          message: `API Key valid dan berhasil diverifikasi dengan model ${model}!`,
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ valid: false, message: 'Tidak menerima respon dari Gemini' }),
    };
  } catch (err: any) {
    const errorMessage = err?.message || 'Gagal memverifikasi API Key';
    const isQuota = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED');
    return {
      statusCode: isQuota ? 429 : 400,
      headers,
      body: JSON.stringify({
        valid: false,
        isQuota,
        message: isQuota ? 'Quota API Key telah habis (429).' : errorMessage,
      }),
    };
  }
};
