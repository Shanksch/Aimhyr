export const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
}

export function withCors<T extends Response>(res: T) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v as string))
  return res
}
