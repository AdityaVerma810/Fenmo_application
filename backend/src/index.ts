import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getEnv } from "./env.js";
import { ExpenseStore } from "./storage.js";
import { createApp } from "./app.js";

const env = getEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.isAbsolute(env.DATA_DIR) ? env.DATA_DIR : path.join(__dirname, "..", env.DATA_DIR);
const store = new ExpenseStore({ dataDir });
await store.init();

const app = createApp({ store, corsOrigin: env.CORS_ORIGIN });
const server = createServer(app);

server.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});

