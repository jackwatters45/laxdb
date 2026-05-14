import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

import { Context } from "effect";
import { HttpRouter } from "effect/unstable/http";

const emptyRequestContext = Context.empty() as Context.Context<unknown>;

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

function readRequestBody(
  req: IncomingMessage,
): Promise<Uint8Array<ArrayBuffer> | null> {
  if (req.method === "GET" || req.method === "HEAD") {
    return Promise.resolve(null);
  }

  return new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
    const chunks: Uint8Array<ArrayBuffer>[] = [];

    req.on("data", (chunk: Buffer) => {
      chunks.push(new Uint8Array(chunk));
    });
    req.on("end", () => {
      const length = chunks.reduce(
        (total, chunk) => total + chunk.byteLength,
        0,
      );
      const body = new Uint8Array(length);
      let offset = 0;

      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
      }

      resolve(body);
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
      method: req.method ?? "GET",
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
