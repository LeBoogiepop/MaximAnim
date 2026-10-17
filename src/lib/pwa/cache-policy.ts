/** Private API responses must never fall through to generic cross-origin caches. */
export function isPrivateRequest(request: Request, url: URL, appOrigin: string): boolean {
  return request.headers.has("authorization") || request.headers.has("apikey") ||
    (url.origin !== appOrigin && request.credentials === "include");
}
