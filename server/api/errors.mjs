export function jsonError(code, message, details) {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}

export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}
