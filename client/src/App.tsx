import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Form } from 'react-router-dom';
import ArticleViewer from './components/Articles/ArticleViewer';
import {  Module, Testimonial, User } from './interfaces/navigatorIntfs';
import FormViewer from './components/Forms/FormViewer';

import EmbeddedContent from './components/Content/EmbededContent';
import FAQ from './components/Content/FaqContent';
import TermsConditions from './components/Content/TermsConditions';
import PrivacyPolicy from './components/Content/PrivacyPolicy';

import Redirect from './components/Login/Redirect';
import WorksheetEditor from './components/Articles/WorkSheetEditor';
import TeamCollaboration from './components/Teams/TeamCollaboration';
import FormBuilder from './components/Forms/FormBuilder';
import HomePage from './components/Layout/HomePage';

import Header from './components/Layout/Header';
import ProgramPage from './components/Content/ProgramPage';
import Dashboard from './components/Layout/Dashboard';
import ModulesPage from './components/Articles/Modules/ModulesPage';
import ModuleDetail from './components/Articles/Modules/ModuleDetail';

import AdminPanel from './components/Admin/AdminPanel';

import './App.css';

// Login and Registration Modal Components (defined before App to avoid hoisting issues)
const LoginModal: React.FC<{
  onLogin: (email: string, password: string) => Promise<void>;
  onClose: () => void;
  onSwitchToRegister: () => void;
}> = ({ onLogin, onClose, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Login to Your Account</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-switch">
          Don't have an account?
          <button onClick={onSwitchToRegister} className="switch-btn">Sign up here</button>
        </p>
      </div>
    </div>
  );
};

const RegistrationModal: React.FC<{
  onRegister: (name: string, email: string, password: string, organization: string) => Promise<void>;
  onClose: () => void;
  onSwitchToLogin: () => void;
}> = ({ onRegister, onClose, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onRegister(formData.name, formData.email, formData.password, formData.organization);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Create Your Account</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Organization Name"
            value={formData.organization}
            onChange={(e) => setFormData({...formData, organization: e.target.value})}
            required
          />
          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account?
          <button onClick={onSwitchToLogin} className="switch-btn">Login here</button>
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState<boolean>(false);

  // Mock data initialization
  const [modules, setModules] = useState<Module[]>([
    {
      id: 'planning',
      title: 'Planning',
      description: 'Strategic planning for inclusive hiring initiatives',
      icon: '📋',
      completed: false,
      locked: false,
      worksheets: [
        {
          id: 'planning-worksheet-1',
          moduleId: 'planning',
          title: 'Strategic Planning Assessment',
          questions: [
            { id: 'q1', text: 'What are your current hiring challenges?', type: 'textarea', required: true },
            { id: 'q2', text: 'How many justice-impacted candidates have you hired in the past year?', type: 'text', required: true },
            { id: 'q3', text: 'What resources do you currently have for inclusive hiring?', type: 'textarea', required: false }
          ],
          responses: {},
          isShared: false,
          lastModified: new Date()
        }
      ]
    },
    {
      id: 'policies',
      title: 'Fair Chance Policies',
      description: 'Develop and implement fair chance hiring policies',
      icon: '⚖️',
      completed: false,
      locked: false,
      worksheets: [
        {
          id: 'policies-worksheet-1',
          moduleId: 'policies',
          title: 'Policy Development Checklist',
          questions: [
            { id: 'q1', text: 'Does your organization have a written fair chance policy?', type: 'multiple_choice', options: ['Yes', 'No', 'In Development'], required: true },
            { id: 'q2', text: 'List any legal considerations for your jurisdiction', type: 'textarea', required: true }
          ],
          responses: {},
          isShared: false,
          lastModified: new Date()
        }
      ]
    },
    {
      id: 'experience',
      title: 'Candidate Experience',
      description: 'Create positive experiences for justice-impacted candidates',
      icon: '👥',
      completed: false,
      locked: false,
      worksheets: []
    },
    {
      id: 'training',
      title: 'Staff Training & Readiness',
      description: 'Prepare your team for inclusive hiring practices',
      icon: '🎓',
      completed: false,
      locked: false,
      worksheets: []
    },
    {
      id: 'partnerships',
      title: 'Recruiting & Retention Partnerships',
      description: 'Build strategic partnerships for sustainable hiring',
      icon: '🤝',
      completed: false,
      locked: false,
      worksheets: []
    },
    {
      id: 'measurement',
      title: 'Measurement & Integration',
      description: 'Track progress and integrate best practices',
      icon: '📊',
      completed: false,
      locked: false,
      worksheets: []
    },
    {
      id: 'implementation',
      title: 'Implementation & Review',
      description: 'Execute plans and conduct regular reviews',
      icon: '🔄',
      completed: false,
      locked: false,
      worksheets: []
    }
  ]);

  const [testimonials] = useState<Testimonial[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      company: 'TechCorp Solutions',
      text: 'Fair Chance Navigator transformed our hiring process. We\'ve successfully hired 15 justice-impacted candidates who have become valuable team members.',
      rating: 5
    },
    {
      id: '2',
      name: 'Michael Chen',
      company: 'Green Industries',
      text: 'The step-by-step guidance made implementing fair chance policies straightforward and legally compliant.',
      videoUrl: '#',
      rating: 5
    },
    {
      id: '3',
      name: 'Dr. Lisa Rodriguez',
      company: 'Healthcare United',
      text: 'Our retention rates for justice-impacted hires are now above 90%. This platform provided the tools we needed.',
      rating: 5
    }
  ]);

  // State for forms
  const [forms, setForms] = useState<any>([]); // identify type for forms

  useEffect(() => {
    // Check for existing auth token and verify it
    const verifyToken = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await fetch('/api/verify', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setCurrentUser(data.user);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.error('Token verification error:', error);
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        // Store JWT token in localStorage
        localStorage.setItem('authToken', data.token);
        setCurrentUser(data.user);
        setShowLoginForm(false);
        alert('Login successful!');
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Please try again.');
    }
  };

  const register = async (name: string, email: string, password: string, organization: string) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, organization }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT token in localStorage
        localStorage.setItem('authToken', data.token);
        setCurrentUser(data.user);
        setShowRegistrationForm(false);
        alert('Registration successful!');
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Network error. Please try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading Fair Chance Navigator...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Header
          currentUser={currentUser}
          onLogin={() => setShowLoginForm(true)}
          onLogout={logout}
        />

        <Routes>
          <Route path="/" element={<HomePage testimonials={testimonials} />} />
          <Route path="/program" element={<ProgramPage />} />
          <Route path="/articles" element={
            currentUser ? <ArticleViewer currentUser={currentUser} /> : <Redirect to="/" />
          } />
          {/* Route for Forms */}
          <Route path="/forms/:moduleId" element={
            currentUser ? <FormViewer currentUser={currentUser} modules={modules} forms={forms} /> : <Redirect to="/" />
          } />
          <Route path="/dashboard" element={
            currentUser ? <Dashboard currentUser={currentUser} modules={modules} /> : <Redirect to="/" />
          } />
          <Route path="/modules" element={
            currentUser ? <ModulesPage modules={modules} setModules={setModules} currentUser={currentUser} /> : <Redirect to="/" />
          } />
          <Route path="/module/:id" element={
            currentUser ? <ModuleDetail modules={modules} setModules={setModules} currentUser={currentUser} /> : <Redirect to="/" />
          } />
          <Route path="/worksheet/:id" element={
            currentUser ? <WorksheetEditor modules={modules} setModules={setModules} currentUser={currentUser} /> : <Redirect to="/" />
          } />
          <Route path="/team" element={
            currentUser ? <TeamCollaboration currentUser={currentUser} /> : <Redirect to="/" />
          } />
          <Route path="/admin" element={
            currentUser?.role === 'admin' ? <AdminPanel modules={modules} setModules={setModules} /> : <Redirect to="/" />
          } />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/embed/:courseId" element={<EmbeddedContent />} />
        </Routes>

        {showLoginForm && (
          <LoginModal
            onLogin={login}
            onClose={() => setShowLoginForm(false)}
            onSwitchToRegister={() => {
              setShowLoginForm(false);
              setShowRegistrationForm(true);
            }}
          />
        )}

        {showRegistrationForm && (
          <RegistrationModal
            onRegister={register}
            onClose={() => setShowRegistrationForm(false)}
            onSwitchToLogin={() => {
              setShowRegistrationForm(false);
              setShowLoginForm(true);
            }}
          />
        )}
      </div>
    </Router>
  );
};

export default App;