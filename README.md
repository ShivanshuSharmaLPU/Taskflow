
# Project Management System

A full-stack project management system built with **Node.js + Express** (backend) and **React** (frontend).

---

## 🗂 Project Structure

```
project/
├── backend/       → Express API with SQLite
└── frontend/      → React UI
```

---

##  Setup Instructions

### Prerequisites
- Node.js v16+ installed
- npm installed

---

### Backend Setup

```bash
cd backend
npm install
npm start
```

Server runs on: **http://localhost:5000**

---

### Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
npm start
```

UI runs on: **http://localhost:3000**

---

##  API Documentation

### Base URL: `http://localhost:5000`

---

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects` | Create a project |
| GET | `/projects?page=1&limit=10` | Get all projects (paginated) |
| GET | `/projects/:id` | Get a project by ID |
| DELETE | `/projects/:id` | Delete a project |

**POST /projects body:**
```json
{
  "name": "My Project",
  "description": "Optional description"
}
```

---

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects/:project_id/tasks` | Create a task |
| GET | `/projects/:project_id/tasks` | Get tasks (filter/sort/paginate) |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |

**GET tasks query params:**
- `status` — filter by `todo`, `in-progress`, or `done`
- `sort` — sort by due_date: `asc` or `desc`
- `page` — page number (default: 1)
- `limit` — items per page (default: 10)

**POST /projects/:id/tasks body:**
```json
{
  "title": "Task title",
  "description": "Optional",
  "status": "todo",
  "priority": "medium",
  "due_date": "2025-01-31"
}
```

---

## ✅ Features

- ✅ CRUD for Projects and Tasks
- ✅ Pagination on projects and tasks
- ✅ Filter tasks by status
- ✅ Sort tasks by due_date (asc/desc)
- ✅ Input validation with error messages
- ✅ Proper error handling (400, 404, 500)
- ✅ SQLite database (no setup needed)
- ✅ React frontend consuming all APIs
=======
# Taskflow

