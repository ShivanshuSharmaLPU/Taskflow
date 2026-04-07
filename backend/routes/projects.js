const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const db = require('../db');

// POST /projects
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional().isString()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  db.run(
    'INSERT INTO projects (name, description) VALUES (?, ?)',
    [name, description || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM projects WHERE id = ?', [this.lastID], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json(row);
      });
    }
  );
});

// GET /projects (with pagination + task counts)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  db.get('SELECT COUNT(*) as total FROM projects', (err, countRow) => {
    if (err) return res.status(500).json({ error: err.message });

    // FIX: Include task counts per status so frontend can show them without extra requests
    db.all(`
      SELECT p.*,
        COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo_count,
        SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) as inprogress_count,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_count
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        data: rows,
        pagination: {
          total: countRow.total,
          page,
          limit,
          totalPages: Math.ceil(countRow.total / limit)
        }
      });
    });
  });
});

// GET /projects/:id
router.get('/:id', (req, res) => {
  db.get(`
    SELECT p.*,
      COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo_count,
      SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) as inprogress_count,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_count
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    WHERE p.id = ?
    GROUP BY p.id
  `, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Project not found' });
    res.json(row);
  });
});

// DELETE /projects/:id
router.delete('/:id', (req, res) => {
  db.get('SELECT * FROM projects WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Project not found' });

    db.run('DELETE FROM projects WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Project deleted successfully' });
    });
  });
});

module.exports = router;
