export async function onRequest(context) {
  const { request, params } = context;

  const url = new URL(request.url);

  // 去掉 /api 前缀
  const targetUrl = `https://foodh-production.up.railway.app/api/${params.path.join('/')}${url.search}`;

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });

  return response;
}