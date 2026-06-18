export function createSseHub({ logSystem }) {
  let clients = [];

  function broadcast(data) {
    const payload = JSON.stringify(data);
    clients.forEach((res) => {
      res.write(`data: ${payload}\n\n`);
    });
  }

  function open(req, res, { onConnect, onDisconnect } = {}) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
    clients.push(res);
    logSystem(`Mobile app connected. Clients: ${clients.length}`);
    onConnect?.(clients.length);

    req.on("close", () => {
      clients = clients.filter((client) => client !== res);
      logSystem(`Mobile app disconnected. Clients: ${clients.length}`);
      onDisconnect?.(clients.length);
    });
  }

  return {
    broadcast,
    getClientCount() {
      return clients.length;
    },
    open,
  };
}
