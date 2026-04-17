/**
 * Vercel Serverless Function — Gemini API 프록시
 *
 * 역할: 브라우저에서 받은 요청을 Gemini API로 전달하고 응답을 반환.
 *       API 키는 Vercel 환경변수(GEMINI_API_KEY)에서만 읽으므로
 *       클라이언트에 노출되지 않습니다.
 */
export default async function handler(req, res) {
  // CORS 헤더 (같은 Vercel 도메인이면 불필요하지만 로컬 개발용으로 추가)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Vercel 환경변수에서 API 키 읽기 (절대 클라이언트에 전달하지 않음)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다. Vercel 대시보드에서 추가해 주세요.',
    });
  }

  const { model = 'gemini-2.5-flash-preview-04-17', contents, generationConfig } = req.body;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({
        error: data?.error?.message || '알 수 없는 Gemini API 오류',
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: `서버 오류: ${err.message}` });
  }
}
