import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL
});

// Projects
export const getProjects = (page = 1, limit = 10) =>
  API.get(`/projects?page=${page}&limit=${limit}`);

export const getProject = (id) => API.get(`/projects/${id}`);

export const createProject = (data) => API.post('/projects', data);

export const deleteProject = (id) => API.delete(`/projects/${id}`);

// Tasks
export const getTasks = (projectId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  return API.get(`/projects/${projectId}/tasks?${params.toString()}`);
};

export const createTask = (projectId, data) =>
  API.post(`/projects/${projectId}/tasks`, data);

export const updateTask = (taskId, data) =>
  API.put(`/tasks/${taskId}`, data);

export const deleteTask = (taskId) =>
  API.delete(`/tasks/${taskId}`);
