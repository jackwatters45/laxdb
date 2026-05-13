import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

import { HttpRouter } from "effect/unstable/http";

import { emptyRequestContext } from "../request-context";

export interface TestServer {
  url: string;
  server: Server;
  cleanup: () => Promise<void>;
}

function createHeaders(req: IncomingMessage) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
      continue;
    }

    headers.set(key, value);
  }

  return headers;
}

function readRequestBody(req: IncomingMessage): Promise<Buffer | null> {
  if (req.method === "GET" || req.method === "HEAD") {
    return Promise.resolve(null);
  }

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });
}

export async function startNodeHttpTestServer(
  routes: Parameters<typeof HttpRouter.toWebHandler>[0],
): Promise<TestServer> {
  const { handler, dispose } = HttpRouter.toWebHandler(routes);

  const handleRequest = async (req: IncomingMessage, res: ServerResponse) => {
    const request = new Request(`http://localhost${req.url ?? "/"}`, {
      method: req.method,
      headers: createHeaders(req),
      body: await readRequestBody(req),
    });

    const response = await handler(request, emptyRequestContext);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    const responseBody = await response.arrayBuffer();
    res.end(Buffer.from(responseBody));
  };

  const server = createServer((req, res) => {
    void handleRequest(req, res).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      res.statusCode = 500;
      res.end(message);
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const url = `http://localhost:${String(port)}`;

  return {
    url,
    server,
    cleanup: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      await dispose();
    },
  };
}
