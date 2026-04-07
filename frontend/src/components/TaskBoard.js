import React, { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '../api';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#6c63ff' },
  { key: 'in-progress', label: 'In Progress', color: '#f59e0b' },
  { key: 'done', label: 'Done', color: '#10b981' },
];

const PRIORITY_CLASS = { low: 'priority-low', medium: 'priority-medium', high: 'priority-high' };

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  // Fix UTC offset bug: parse as local date
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const today = new Date(); today.setHours(0,0,0,0);
  const isOverdue = d < today;
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label, isOverdue };
}

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const due = formatDueDate(task.due_date);

  return (
    <div className="task-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <p className="task-card-title">{task.title}</p>
        <div className="task-actions">
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(task)} title="Edit">✏</button>
          <button className="btn btn-danger btn-icon btn-sm" onClick={() => onDelete(task.id)} title="Delete">✕</button>
        </div>
      </div>
      {task.description && <p className="task-card-desc">{task.description}</p>}
      <div className="task-card-meta">
        <div className="task-card-left">
          <span className={`priority-badge ${PRIORITY_CLASS[task.priority]}`}>{task.priority}</span>
          {due && (
            <span className={`due-date ${due.isOverdue ? 'overdue' : ''}`}>
              📅 {due.label}{due.isOverdue ? ' !' : ''}
            </span>
          )}
        </div>
        <select
          className="input input-sm"
          value={task.status}
          onChange={e => onStatusChange(task.id, e.target.value)}
          style={{ width: 'auto', fontSize: '0.73rem', padding: '3px 6px', marginBottom: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
  );
}

function QuickAddForm({ onAdd, onCancel, defaultStatus }) {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', due_date: '', status: defaultStatus
  });

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onAdd(form);
  };

  return (
    <div className="quick-add-form">
      <input className="input" placeholder="Task title *" value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onCancel(); }}
        autoFocus />
      <textarea className="input" placeholder="Description (optional)" value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
        rows={2} style={{ resize: 'none' }} />
      <div className="form-row" style={{ marginBottom: 8 }}>
        <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        <input className="input" type="date" value={form.due_date}
          onChange={e => setForm({ ...form, due_date: e.target.value })} />
      </div>
      <div className="form-actions">
        <button className="btn btn-primary btn-sm" onClick={handleSubmit}>Add Task</button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function EditForm({ task, onSave, onCancel }) {
  const [data, setData] = useState({ ...task });

  return (
    <div className="task-edit-form">
      <input className="input" placeholder="Task title *" value={data.title}
        onChange={e => setData({ ...data, title: e.target.value })} autoFocus />
      <textarea className="input" placeholder="Description" value={data.description || ''}
        onChange={e => setData({ ...data, description: e.target.value })}
        rows={2} style={{ resize: 'none' }} />
      <div className="form-row" style={{ marginBottom: 8 }}>
        <select className="input" value={data.status} onChange={e => setData({ ...data, status: e.target.value })}>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select className="input" value={data.priority} onChange={e => setData({ ...data, priority: e.target.value })}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input className="input" type="date" value={data.due_date || ''}
          onChange={e => setData({ ...data, due_date: e.target.value })} />
      </div>
      <div className="form-actions">
        <button className="btn btn-primary btn-sm" onClick={() => onSave(data)}>Save</button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function TaskBoard({ project, onBack }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editTask, setEditTask] = useState(null);
  const [quickAddCol, setQuickAddCol] = useState(null); // which column is open for quick add
  const [sortOrder, setSortOrder] = useState('asc');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTasks(project.id, { sort: sortOrder, limit: 100 });
      setTasks(res.data.data);
    } catch (e) {
      setError('Failed to load tasks');
    }
    setLoading(false);
  }, [project.id, sortOrder]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAdd = async (form) => {
    try {
      await createTask(project.id, form);
      setQuickAddCol(null);
      setError('');
      fetchTasks();
    } catch (e) {
      setError(e.response?.data?.errors?.[0]?.msg || 'Failed to create task');
    }
  };

  const handleEdit = async (data) => {
    try {
      await updateTask(data.id, data);
      setEditTask(null);
      setError('');
      fetchTasks();
    } catch (e) {
      setError(e.response?.data?.errors?.[0]?.msg || 'Failed to update task');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      fetchTasks();
    } catch (e) {
      setError('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      fetchTasks();
    } catch (e) {
      setError('Failed to update status');
    }
  };

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div>
      <div className="task-board-header">
        <div className="project-breadcrumb" onClick={onBack}>
          ← Projects
        </div>
        <h1 className="task-board-title">{project.name}</h1>
        {project.description && <p className="task-board-desc">{project.description}</p>}
      </div>

      {error && <div className="alert alert-error">⚠ {error} <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setError('')}>✕</button></div>}

      <div className="kanban-controls">
        <div className="kanban-filters">
          <span className="filter-label">
            Sort by due date:
            <select className="input input-sm" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option value="asc">Earliest first</option>
              <option value="desc">Latest first</option>
            </select>
          </span>
        </div>
        <span className="text-muted">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</span>
      </div>

      {loading ? (
        <div className="loading"><span className="spinner"></span>Loading tasks...</div>
      ) : (
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const colTasks = tasksByStatus(col.key);
            return (
              <div key={col.key} className="kanban-column">
                <div className="column-header">
                  <div className="column-header-left">
                    <div className="column-dot" style={{ background: col.color }}></div>
                    <span className="column-title">{col.label}</span>
                  </div>
                  <span className="column-count">{colTasks.length}</span>
                </div>

                <div className="column-tasks">
                  {colTasks.length === 0 && quickAddCol !== col.key && (
                    <div className="empty-state" style={{ padding: '20px 10px' }}>
                      <p style={{ fontSize: '0.78rem' }}>No tasks here</p>
                    </div>
                  )}
                  {colTasks.map(task => (
                    editTask?.id === task.id ? (
                      <EditForm key={task.id} task={editTask} onSave={handleEdit} onCancel={() => setEditTask(null)} />
                    ) : (
                      <TaskCard key={task.id} task={task}
                        onEdit={(t) => { setEditTask(t); setQuickAddCol(null); }}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                      />
                    )
                  ))}
                </div>

                {quickAddCol === col.key ? (
                  <QuickAddForm defaultStatus={col.key} onAdd={handleAdd} onCancel={() => setQuickAddCol(null)} />
                ) : (
                  <button className="add-task-btn" onClick={() => { setQuickAddCol(col.key); setEditTask(null); }}>
                    + Add task
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
