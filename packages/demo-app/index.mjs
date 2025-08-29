import express from 'express'
import { createTodoController } from './controllers/create-todo.mjs'

const app = express()
const port = 3000

app.use(express.json())

// In-memory storage for todos
export let todos = [
    {
        "id": 0,
        "title": "bd6eaa8a-ec6c-496f-a143-34723217a878",
        "completed": true
    }
]

let nextId = 1

// Create a new todo
app.post('/todos', createTodoController)

// Get all todos
app.get('/todos', (req, res) => {
    res.json(todos)
})

// Get a single todo by id
app.get('/todos/:id', (req, res) => {
    const id = parseInt(req.params.id, 10)
    const todo = todos.find(t => t.id === id)
    if (!todo) {
        return res.status(404).json({ error: 'Todo not found' })
    }
    res.json(todo)
})

// Update a todo by id
app.put('/todos/:id', (req, res) => {
    const id = parseInt(req.params.id, 10)
    const todo = todos.find(t => t.id === id)
    if (!todo) {
        return res.status(404).json({ error: 'Todo not found' })
    }
    const { title, completed } = req.body
    if (title !== undefined) todo.title = title
    if (completed !== undefined) todo.completed = completed
    res.json(todo)
})

// Delete a todo by id
app.delete('/todos/:id', (req, res) => {
    const id = parseInt(req.params.id, 10)
    const index = todos.findIndex(t => t.id === id)
    if (index === -1) {
        return res.status(404).json({ error: 'Todo not found' })
    }
    const deleted = todos.splice(index, 1)[0]
    res.json(deleted)
})

app.listen(port, () => {
    console.log(`Todo API listening at http://localhost:${port}`)
})
