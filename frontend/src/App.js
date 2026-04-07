import React, { useState } from 'react';
import Projects from './components/Projects';
import TaskBoard from './components/TaskBoard';
import './App.css';

function App() {
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand" onClick={() => setSelectedProject(null)} style={{ cursor: 'pointer' }}>
          <div className="brand-dot">⬡</div>
          Taskflow
        </div>
        <div className="header-right">
          {selectedProject && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedProject(null)}>
              ← All Projects
            </button>
          )}
        </div>
      </header>
      <main className="app-main">
        {!selectedProject ? (
          <Projects onSelectProject={setSelectedProject} />
        ) : (
          <TaskBoard project={selectedProject} onBack={() => setSelectedProject(null)} />
        )}
      </main>
    </div>
  );
}

export default App;
