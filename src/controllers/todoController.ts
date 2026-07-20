import type { NextFunction, Request, Response } from 'express';
import { deleteUploadedFiles } from '../config/upload';
import { createTodo, deleteTodo, getAllTodos, updateTodo } from '../models/todoModel';

type TodoParams = {
  id: string;
};

type TodoBody = {
  title?: string;
  completed?: boolean;
};

export async function listTodos(_request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const todos = await getAllTodos();
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

