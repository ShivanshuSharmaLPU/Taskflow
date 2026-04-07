const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, query, validationResult } = require('express-validator');
const db = require('../db');

// POST /projects/:project_id/tasks
router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('due_date').optional().isDate().withMessage('Invalid date format')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { project_id } = req.params;
  db.get('SELECT id FROM projects WHERE id = ?', [project_id], (err, project) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { title, description, status = 'todo', priority = 'medium', due_date } = req.body;
    db.run(
      'INSERT INTO tasks (project_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [project_id, title, description || null, status, priority, due_date || null],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, row) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json(row);
        });
      }
    );
  });
});

// GET /projects/:project_id/tasks
router.get('/', [
  query('status').optional().isIn(['todo', 'in-progress', 'done']),
  query('sort').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { project_id } = req.params;
  const { status, sort = 'asc', page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  db.get('SELECT id FROM projects WHERE id = ?', [project_id], (err, project) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    let whereClause = 'WHERE project_id = ?';
    const params = [project_id];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const countParams = [...params];
    db.get(`SELECT COUNT(*) as total FROM tasks ${whereClause}`, countParams, (err, countRow) => {
      if (err) return res.status(500).json({ error: err.message });

      // FIX: SQLite does not support NULLS LAST — use CASE expression instead
      const sortDir = sort === 'desc' ? 'DESC' : 'ASC';
      const orderClause = `CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ${sortDir}`;
      const sqlQuery = `SELECT * FROM tasks ${whereClause} ORDER BY ${orderClause} LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), offset);

      db.all(sqlQuery, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          data: rows,
          pagination: {
            total: countRow.total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(countRow.total / parseInt(limit))
          }
        });
      });
    });
  });
});

// PUT /tasks/:id
router.put('/:id', [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().isString(),
  body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('due_date').optional().isDate().withMessage('Invalid date format')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, task) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { title, description, status, priority, due_date } = req.body;
    const updated = {
      title: title !== undefined ? title : task.title,
      description: description !== undefined ? description : task.description,
      status: status !== undefined ? status : task.status,
      priority: priority !== undefined ? priority : task.priority,
      due_date: due_date !== undefined ? due_date : task.due_date
    };

    db.run(
      'UPDATE tasks SET title=?, description=?, status=?, priority=?, due_date=? WHERE id=?',
      [updated.title, updated.description, updated.status, updated.priority, updated.due_date, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, row) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(row);
        });
      }
    );
  });
});

// DELETE /tasks/:id
router.delete('/:id', (req, res) => {
  db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, task) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Task deleted successfully' });
    });
  });
});

module.exports = router;
