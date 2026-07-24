import dotenv from 'dotenv';
import type { Server } from 'node:http';
import app from './app';
import { ensureTodosTable } from './models/todoModel';

dotenv.config();

const port = Number(process.env.PORT || 3001);
const databaseRetryDelay = Math.max(500, Number(process.env.DB_RETRY_DELAY_MS) || 2000);
let server: Server | undefined;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function startServer(): Promise<void> {
  while (true) {
    try {
      await ensureTodosTable();
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Database unavailable: ${message}. Retrying in ${databaseRetryDelay}ms.`);
      await wait(databaseRetryDelay);
    }
  }

  server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

function shutdown(signal: NodeJS.Signals): void {
  console.log(`${signal} received. Stopping server.`);

  if (!server) {
    process.exit(0);
  }

  server.close(() => process.exit(0));
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

void startServer();
