/* 極簡健康檢查:回應本身即證明 Pages Functions 在邊緣正常服務。
   不碰 D1、不需認證、同源呼叫(Footer 狀態燈),故不掛 CORS。 */
export const onRequestGet = async (): Promise<Response> =>
  new Response(JSON.stringify({ status: 'ok', ts: new Date().toISOString() }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
