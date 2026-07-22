import dotenv from 'dotenv';
import app from './app';
import { ensureTodosTable } from './models/todoModel';

dotenv.config();

const port = Number(process.env.PORT || 3001);
const databaseRetryDelay = Math.max(500, Number(process.env.DB_RETRY_DELAY_MS) || 2000);

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

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

void startServer();
