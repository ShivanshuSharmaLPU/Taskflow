import React, { useState, useEffect } from 'react';
import { getProjects, createProject, deleteProject } from '../api';

export default function Projects({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ name: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = async (p = 1) => {
    setLoading(true);
    try {
      const res = await getProjects(p, 12);
      setProjects(res.data.data);
      setPagination(res.data.pagination);
    } catch (e) {
      setError('Failed to load projects');
    }
    setLoading(false);
  };

  useEffect(() => { fetchProjects(page); }, [page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Project name is required');
    try {
      await createProject(form);
      setForm({ name: '', description: '' });
      setShowForm(false);
      setError('');
      fetchProjects(1);
      setPage(1);
    } catch (e) {
      setError(e.response?.data?.errors?.[0]?.msg || 'Failed to create project');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await deleteProject(id);
      fetchProjects(page);
    } catch (e) {
      setError('Failed to delete project');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Projects</h1>
          <p className="section-subtitle">{pagination.total || 0} project{pagination.total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setError(''); }}>
          {showForm ? '✕ Cancel' : '+ New Project'}
        </button>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {showForm && (
        <div className="form-panel">
          <h3>Create Project</h3>
          <input
            className="input"
            placeholder="Project name *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
          <textarea
            className="input"
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={2}
            style={{ resize: 'vertical' }}
          />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleCreate}>Create Project</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading"><span className="spinner"></span>Loading projects...</div>
      ) : (
        <>
          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <p>No projects yet. Create your first one!</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(p => (
                <div key={p.id} className="card project-card" onClick={() => onSelectProject(p)}>
                  <div className="project-card-top">
                    <h3 className="project-name">{p.name}</h3>
                    <button
                      className="btn btn-danger btn-icon btn-sm"
                      onClick={(e) => handleDelete(p.id, e)}
                      title="Delete project"
                    >✕</button>
                  </div>
                  <p className="project-desc">{p.description || 'No description'}</p>
                  <div className="project-stats">
                    {(p.todo_count > 0) && (
                      <span className="stat-pill todo">● {p.todo_count} todo</span>
                    )}
                    {(p.inprogress_count > 0) && (
                      <span className="stat-pill inprogress">● {p.inprogress_count} in progress</span>
                    )}
                    {(p.done_count > 0) && (
                      <span className="stat-pill done">✓ {p.done_count} done</span>
                    )}
                    {(p.task_count === 0) && (
                      <span className="stat-pill todo" style={{ opacity: 0.5 }}>No tasks yet</span>
                    )}
                  </div>
                  <div className="project-footer">
                    <span>Created {formatDate(p.created_at)}</span>
                    <span>{p.task_count || 0} task{p.task_count !== 1 ? 's' : ''} total</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
