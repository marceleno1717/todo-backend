import { Router } from 'express';
import upload from '../config/upload';
import { addTodo, editTodo, listTodos, removeTodo } from '../controllers/todoController';

const router = Router();

router.get('/', listTodos);
router.post('/', upload.array('files'), addTodo);
router.put('/:id', editTodo);
router.delete('/:id', removeTodo);

export default router;

