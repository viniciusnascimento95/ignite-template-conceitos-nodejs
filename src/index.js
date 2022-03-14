const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  let userExists = undefined;

  if (username) {
    userExists = users.find(user => user.username === username);
  }

  if (!userExists) {
    return response.status(404).json({ error: "User not found" });
  } else {
    request.user = userExists;
  }
  
  next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const usersExists = users.some(user => user.username === username);

  if (usersExists) {
    return response.status(400).json({ error: "User already exists" });
  }

  if (!name || !username) {
    return response.status(400).json({ error: "Name or username must be filled" });
  }
  
  const userModel = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(userModel);

  return response.status(201).json(userModel);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const todoModel = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  user.todos.push(todoModel);

  return response.status(201).json(todoModel);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id: todoId } = request.params;
  const { title: updatedTitle, deadline: updatedDeadline } = request.body;
  const { user } = request;

  const todoFound = user.todos.find(todo => todo.id === todoId);

  if (!todoFound) {
    return response.status(404).json({ error: "Todo not found" });
  }

  const updatedTodo = {
    ...todoFound,
    title: updatedTitle,
    deadline: updatedDeadline
  };

  const filteredTodoList = user.todos.filter(todo => todo.id !== todoId);

  user.todos = [...filteredTodoList, updatedTodo];

  return response.json(updatedTodo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id: todoId } = request.params;
  const { user } = request;

  const todoFound = user.todos.find(todo => todo.id === todoId);

  if (!todoFound) {
    return response.status(404).json({ error: "Todo not found" });
  }

  const finishedTodo = {
    ...todoFound,
    done: true
  };

  const filteredTodoList = user.todos.filter(todo => todo.id !== todoId);

  user.todos = [...filteredTodoList, finishedTodo]; 

  return response.json(finishedTodo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id: todoId } = request.params;
  const { user } = request;

  const todoFound = user.todos.some(todo => todo.id === todoId);

  if (!todoFound) {
    return response.status(404).json({ error: "Todo doesn't exists" });
  }

  user.todos = user.todos.filter(todo => todo.id !== todoId);

  return response.status(204).json(user.todos);
});

module.exports = app;