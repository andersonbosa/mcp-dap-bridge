import { todos } from "../index.mjs"

export function createTodoController(req, res) {
    const { title, completed = false } = req.body
    if (!title) {
        return res.status(400).json({ error: 'Title is required' })
    }
    const todo = { id: nextId++, title, completed }
    todos.push(todo)
    res.status(201).json(todo)
}