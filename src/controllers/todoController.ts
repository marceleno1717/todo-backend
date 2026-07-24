import type { NextFunction, Request, Response } from 'express';
import { deleteUploadedFiles } from '../config/upload';
import { createTodo, deleteTodo, getTodosPage, updateTodo } from '../models/todoModel';

type TodoParams = {
  id: string;
};

type TodoBody = {
  title?: string;
  completed?: boolean;
};

type ListTodosQuery = {
  page?: string;
  limit?: string;
};

function getPositiveInteger(value: string | undefined, fallback: number, maximum: number): number {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return Math.min(parsedValue, maximum);
}

export async function listTodos(
  request: Request<Record<string, never>, unknown, unknown, ListTodosQuery>,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = getPositiveInteger(request.query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = getPositiveInteger(request.query.limit, 10, 100);
    const todos = await getTodosPage(page, limit);
    response.json(todos);
  } catch (error) {
    next(error);
  }
}

export async function addTodo(
  request: Request<Record<string, never>, unknown, TodoBody>,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { title } = request.body;

    if (!title?.trim()) {
      response.status(400).json({ message: 'Title is required' });
      return;
    }

    const todo = await createTodo(title.trim(), request.files as Express.Multer.File[] | undefined);
    response.status(201).json(todo);
  } catch (error) {
    next(error);
  }
}

export async function editTodo(
  request: Request<TodoParams, unknown, TodoBody>,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = request.params;
    const { title, completed } = request.body;

    if (!title?.trim()) {
      response.status(400).json({ message: 'Title is required' });
      return;
    }

    const todo = await updateTodo(Number(id), title.trim(), Boolean(completed));

    if (!todo) {
      response.status(404).json({ message: 'Todo not found' });
      return;
    }

    response.json(todo);
  } catch (error) {
    next(error);
  }
}

export async function removeTodo(
  request: Request<TodoParams>,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await deleteTodo(Number(request.params.id));

    if (!result.deleted) {
      response.status(404).json({ message: 'Todo not found' });
      return;
    }

    deleteUploadedFiles(result.files);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}
