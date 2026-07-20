import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import express from 'express';
import { deleteUploadedFiles, uploadDir } from './config/upload';
import todoRoutes from './routes/todoRoutes';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (_request: Request, response: Response) => {
  response.json({ status: 'ok' });
});

app.use('/api/todos', todoRoutes);

app.use((error: unknown, request: Request, response: Response, _next: NextFunction) => {
  console.error(error);

  if (request.files && Array.isArray(request.files)) {
    deleteUploadedFiles(request.files);
  }

  response.status(500).json({
    message: 'Internal server error'
  });
});

export default app;

