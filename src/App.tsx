
import React, { useState, useEffect } from 'react';
import './App.css';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employer' | 'user';
  organization?: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  locked: boolean;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [modules, setModules] = useState<Module[]>([
    {
      id: 'planning',
      title: 'Planning',
      description: 'Strategic planning for inclusive hiring initiatives',
      icon: '📋',
      completed: false,
      locked: false
    },
    {
      id: 'policies',
      title: 'Fair Chance Policies',
      description: 'Develop and implement fair chance hiring policies',
      icon: '⚖️',
      completed: false,
      locked: false
    },
    {
      id: 'experience',
      title: 'Candidate Experience',
      description: 'Create positive experiences for justice-impacted candidates',
      icon: '👥',
      completed: false,
      locked: false
    },
    {
      id: 'training',
      title: 'Staff Training & Readiness',
      description: 'Prepare your team for inclusive hiring practices',
      icon: '🎓',
      completed: false,
      locked: false
    },
    {
      id: 'partnerships',
      title: 'Recruiting & Retention Partnerships',
      description: 'Build strategic partnerships for sustainable hiring',
      icon: '🤝',
      completed: false,
      locked: false
    },
    {
      id: 'measurement',
      title: 'Measurement & Integration',
      description: 'Track progress and integrate best practices',
      icon: '📊',
      completed: false,
      locked: false
    },
    {
      id: 'implementation',
      title: 'Implementation & Review',
      description: 'Execute plans and conduct regular reviews',
      icon: '🔄',
      completed: false,
      locked: false
    }
  ]);

  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    // Calculate progress based on completed modules
    const completedCount = modules.filter(module => module.completed).length;
    setProgress((completedCount / modules.length) * 100);
  }, [modules]);

  const mockLogin = () => {
    setCurrentUser({
      id: '1',
      name: 'Demo User',
      email: 'demo@company.com',
      role: 'employer',
      organization: 'Demo Organization'
    });
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const toggleModuleCompletion = (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, completed: !module.completed }
        : module
    ));
  };

  const renderHeader = () => (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <h1>Fair Chance Navigator 2.0</h1>
          <p>Building Inclusive Hiring Strategies</p>
        </div>
        <div className="user-info">
          {currentUser ? (
            <div className="user-menu">
              <span>Welcome, {currentUser.name}</span>
              <button onClick={logout} className="logout-btn">Logout</button>
            </div>
          ) : (
            <button onClick={mockLogin} className="login-btn">Demo Login</button>
          )}
        </div>
      </div>
    </header>
  );

  const renderNavigation = () => (
    <nav className="main-nav">
      <button 
        className={currentView === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => setCurrentView('dashboard')}
      >
        Dashboard
      </button>
      <button 
        className={currentView === 'modules' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => setCurrentView('modules')}
      >
        Learning Modules
      </button>
      <button 
        className={currentView === 'resources' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => setCurrentView('resources')}
      >
        Resources
      </button>
      <button 
        className={currentView === 'progress' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => setCurrentView('progress')}
      >
        Progress
      </button>
    </nav>
  );

  const renderDashboard = () => (
    <div className="dashboard">
      <div className="welcome-section">
        <h2>Welcome to Fair Chance Navigator 2.0</h2>
        <p>Your comprehensive toolkit for developing inclusive hiring strategies for justice-impacted candidates.</p>
        
        <div className="progress-overview">
          <h3>Your Progress</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p>{Math.round(progress)}% Complete ({modules.filter(m => m.completed).length} of {modules.length} modules)</p>
        </div>
      </div>

      <div className="quick-stats">
        <div className="stat-card">
          <h4>Modules Completed</h4>
          <span className="stat-number">{modules.filter(m => m.completed).length}</span>
        </div>
        <div className="stat-card">
          <h4>Total Modules</h4>
          <span className="stat-number">{modules.length}</span>
        </div>
        <div className="stat-card">
          <h4>Resources Available</h4>
          <span className="stat-number">25+</span>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Quick Start</h3>
        <p>Begin your journey with these essential steps:</p>
        <ul>
          <li>Complete the Planning module to establish your foundation</li>
          <li>Review Fair Chance Policies for legal compliance</li>
          <li>Download our assessment tools</li>
          <li>Schedule staff training sessions</li>
        </ul>
      </div>
    </div>
  );

  const renderModules = () => (
    <div className="modules-grid">
      <h2>Learning Modules</h2>
      <p>Complete these modules to build comprehensive inclusive hiring strategies.</p>
      
      <div className="modules-container">
        {modules.map((module) => (
          <div key={module.id} className={`module-card ${module.completed ? 'completed' : ''}`}>
            <div className="module-icon">{module.icon}</div>
            <h3>{module.title}</h3>
            <p>{module.description}</p>
            
            <div className="module-actions">
              <button 
                className="start-btn"
                onClick={() => setCurrentView(`module-${module.id}`)}
              >
                {module.completed ? 'Review' : 'Start'}
              </button>
              <button 
                className="complete-btn"
                onClick={() => toggleModuleCompletion(module.id)}
              >
                {module.completed ? '✓ Completed' : 'Mark Complete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderModuleDetail = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return <div>Module not found</div>;

    return (
      <div className="module-detail">
        <button 
          className="back-btn"
          onClick={() => setCurrentView('modules')}
        >
          ← Back to Modules
        </button>
        
        <div className="module-header">
          <span className="module-icon-large">{module.icon}</span>
          <h2>{module.title}</h2>
          <p>{module.description}</p>
        </div>

        <div className="module-content">
          <div className="content-section">
            <h3>Overview</h3>
            <p>This module provides comprehensive guidance on {module.title.toLowerCase()}. You'll learn best practices, legal considerations, and practical implementation strategies.</p>
          </div>

          <div className="content-section">
            <h3>Learning Objectives</h3>
            <ul>
              <li>Understand key principles and legal requirements</li>
              <li>Develop actionable strategies for your organization</li>
              <li>Access practical tools and templates</li>
              <li>Create implementation timelines</li>
            </ul>
          </div>

          <div className="content-section">
            <h3>Resources</h3>
            <div className="resources-list">
              <div className="resource-item">
                <span>📄</span>
                <div>
                  <h4>Implementation Guide</h4>
                  <p>Step-by-step instructions for {module.title.toLowerCase()}</p>
                  <button className="download-btn">Download PDF</button>
                </div>
              </div>
              <div className="resource-item">
                <span>🎥</span>
                <div>
                  <h4>Training Video</h4>
                  <p>Expert-led session on best practices</p>
                  <button className="play-btn">Watch Video</button>
                </div>
              </div>
              <div className="resource-item">
                <span>📋</span>
                <div>
                  <h4>Assessment Checklist</h4>
                  <p>Evaluate your current practices</p>
                  <button className="download-btn">Download Tool</button>
                </div>
              </div>
            </div>
          </div>

          <div className="module-actions">
            <button 
              className="complete-module-btn"
              onClick={() => {
                toggleModuleCompletion(module.id);
                setCurrentView('modules');
              }}
            >
              {module.completed ? 'Mark Incomplete' : 'Complete Module'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderResources = () => (
    <div className="resources">
      <h2>Resource Library</h2>
      <p>Download tools, templates, and guides to support your inclusive hiring initiatives.</p>
      
      <div className="resource-categories">
        <div className="category">
          <h3>Policy Templates</h3>
          <ul>
            <li><a href="#" download>Fair Chance Hiring Policy Template</a></li>
            <li><a href="#" download>Background Check Guidelines</a></li>
            <li><a href="#" download>Interview Process Guidelines</a></li>
          </ul>
        </div>
        
        <div className="category">
          <h3>Assessment Tools</h3>
          <ul>
            <li><a href="#" download>Organizational Readiness Assessment</a></li>
            <li><a href="#" download>Staff Training Evaluation</a></li>
            <li><a href="#" download>Candidate Experience Survey</a></li>
          </ul>
        </div>
        
        <div className="category">
          <h3>Training Materials</h3>
          <ul>
            <li><a href="#" download>Manager Training Presentation</a></li>
            <li><a href="#" download>HR Team Guidelines</a></li>
            <li><a href="#" download>Unconscious Bias Workshop</a></li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="progress-page">
      <h2>Your Progress</h2>
      
      <div className="progress-summary">
        <div className="progress-circle">
          <div className="circle">
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="progress-details">
          <h3>Overall Completion</h3>
          <p>{modules.filter(m => m.completed).length} of {modules.length} modules completed</p>
        </div>
      </div>

      <div className="module-progress">
        <h3>Module Status</h3>
        {modules.map(module => (
          <div key={module.id} className="progress-item">
            <span className="status-icon">
              {module.completed ? '✅' : '⏳'}
            </span>
            <span className="module-name">{module.title}</span>
            <span className="status-text">
              {module.completed ? 'Completed' : 'In Progress'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (currentView.startsWith('module-')) {
      const moduleId = currentView.replace('module-', '');
      return renderModuleDetail(moduleId);
    }

    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'modules':
        return renderModules();
      case 'resources':
        return renderResources();
      case 'progress':
        return renderProgress();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="App">
      {renderHeader()}
      {currentUser && renderNavigation()}
      <main className="main-content">
        {currentUser ? renderContent() : (
          <div className="landing-page">
            <div className="hero-section">
              <h2>Transform Your Hiring Practices</h2>
              <p>Build inclusive hiring strategies for justice-impacted candidates with our comprehensive toolkit.</p>
              <button onClick={mockLogin} className="cta-button">Get Started</button>
            </div>
            
            <div className="features">
              <div className="feature">
                <span className="feature-icon">📚</span>
                <h3>7 Core Modules</h3>
                <p>Comprehensive learning paths covering all aspects of inclusive hiring</p>
              </div>
              <div className="feature">
                <span className="feature-icon">🛠️</span>
                <h3>Practical Tools</h3>
                <p>Downloadable templates, checklists, and assessment tools</p>
              </div>
              <div className="feature">
                <span className="feature-icon">🎯</span>
                <h3>Step-by-Step Guidance</h3>
                <p>Clear implementation strategies with measurable outcomes</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
