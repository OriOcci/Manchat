export default async function handler(req, res) {
  // GET 요청 및 query 파라미터 확인
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  // Vercel 환경 변수에서 API 키 로드
  const apiKey = process.env.KAKAO_REST_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is not configured' });
  }

  try {
    const kakaoUrl = `https://dapi.kakao.com/v3/search/book?target=title&size=1&query=${encodeURIComponent(query)}`;
    const response = await fetch(kakaoUrl, {
      headers: {
        Authorization: `KakaoAK ${apiKey}`
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch from Kakao API' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
