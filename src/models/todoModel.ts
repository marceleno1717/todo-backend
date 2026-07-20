import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { query } from '../config/db';

export type TodoFile = {
  id: number;
  todoId: number;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  url: string;
};

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  files: TodoFile[];
};

type TodoRow = RowDataPacket & {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
};

type TodoFileRow = RowDataPacket & {
  id: number;
  todoId: number;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
};

export async function ensureTodosTable(): Promise<void> {
  await query<ResultSetHeader>(`
    CREATE TABLE IF NOT EXISTS todos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query<ResultSetHeader>(`
    CREATE TABLE IF NOT EXISTS todo_files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      todo_id INT NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      stored_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(255) NOT NULL,
      size INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_todo_files_todo
        FOREIGN KEY (todo_id) REFERENCES todos(id)
        ON DELETE CASCADE
    )
  `);
}

async function attachFiles(todos: TodoRow[]): Promise<Todo[]> {
  if (todos.length === 0) {
    return [];
  }

  const fileRows = await query<TodoFileRow[]>(
    `SELECT id, todo_id AS todoId, original_name AS originalName,
            stored_name AS storedName, mime_type AS mimeType, size
     FROM todo_files
     WHERE todo_id IN (${todos.map(() => '?').join(',')})
     ORDER BY id ASC`,
    todos.map((todo) => todo.id)
  );

  const filesByTodoId = fileRows.reduce<Record<number, TodoFile[]>>((accumulator, file) => {
    if (!accumulator[file.todoId]) {
      accumulator[file.todoId] = [];
    }

    accumulator[file.todoId].push({
      id: file.id,
      todoId: file.todoId,
      originalName: file.originalName,
      storedName: file.storedName,
      mimeType: file.mimeType,
      size: file.size,
      url: `/uploads/${file.storedName}`
    });

    return accumulator;
  }, {});

  return todos.map((todo) => ({
    ...todo,
    files: filesByTodoId[todo.id] || []
  }));
}

async function getTodoById(id: number): Promise<Todo | null> {
  const todos = await query<TodoRow[]>(
    `SELECT id, title, completed, created_at AS createdAt
     FROM todos
     WHERE id = ?`,
    [id]
  );

  const todosWithFiles = await attachFiles(todos);
  return todosWithFiles[0] || null;
}

export async function getAllTodos(): Promise<Todo[]> {
  const todos = await query<TodoRow[]>(
    `SELECT id, title, completed, created_at AS createdAt
     FROM todos
     ORDER BY id DESC`
  );

  return attachFiles(todos);
}

export async function createTodo(title: string, files: Express.Multer.File[] = []): Promise<Todo | null> {
  const result = await query<ResultSetHeader>(
    'INSERT INTO todos (title, completed) VALUES (?, ?)',
    [title, false]
  );

  for (const file of files) {
    await query<ResultSetHeader>(
      `INSERT INTO todo_files (todo_id, original_name, stored_name, mime_type, size)
       VALUES (?, ?, ?, ?, ?)`,
      [result.insertId, file.originalname, file.filename, file.mimetype, file.size]
    );
  }

  return getTodoById(result.insertId);
}

export async function updateTodo(id: number, title: string, completed: boolean): Promise<Todo | null> {
  await query<ResultSetHeader>(
    'UPDATE todos SET title = ?, completed = ? WHERE id = ?',
    [title, completed, id]
  );

  return getTodoById(id);
}

export async function deleteTodo(id: number): Promise<{ deleted: boolean; files: Pick<TodoFile, 'storedName'>[] }> {
  const files = await query<Array<Pick<TodoFile, 'storedName'>>>(
    `SELECT stored_name AS storedName
     FROM todo_files
     WHERE todo_id = ?`,
    [id]
  );

  const result = await query<ResultSetHeader>('DELETE FROM todos WHERE id = ?', [id]);
  return {
    deleted: result.affectedRows > 0,
    files
  };
}

