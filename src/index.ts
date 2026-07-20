import dotenv from 'dotenv';
import app from './app';
import { ensureTodosTable } from './models/todoModel';

dotenv.config();

const port = Number(process.env.PORT || 3001);

async function startServer(): Promise<void> {
  try {
    await ensureTodosTable();
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to start server:', message);
    process.exit(1);
  }
}

void startServer();
