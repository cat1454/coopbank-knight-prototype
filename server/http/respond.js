export function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

export function sendXml(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "text/xml; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(data);
}
