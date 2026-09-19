export function logRequest(req: Request) {
  const started = Date.now();
  const route = new URL(req.url).pathname;
  console.info(
    JSON.stringify({
      level: "info",
      event: "request-start",
      route,
      method: req.method,
    }),
  );
  return (status: number) =>
    console.info(
      JSON.stringify({
        level: status >= 500 ? "error" : "info",
        event: "request-complete",
        route,
        status,
        durationMs: Date.now() - started,
      }),
    );
}
export async function withRequestLog<T extends Response>(
  req: Request,
  operation: () => Promise<T>,
) {
  const complete = logRequest(req);
  try {
    const response = await operation();
    complete(response.status);
    return response;
  } catch (error) {
    complete(500);
    throw error;
  }
}
