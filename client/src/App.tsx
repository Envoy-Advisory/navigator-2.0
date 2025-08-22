
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import ArticleViewer from './ArticleViewer';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employer' | 'user';
  organization?: string;
  organizationId?: string;
  createdAt: Date;
  lastLogin: Date;
}

interface Organization {
  id: string;
  name: string;
  members: string[];
  subscriptionType: 'basic' | 'premium' | 'enterprise';
  settings: {
    allowCollaboration: boolean;
    customBranding: boolean;
  };
}

interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  locked: boolean;
  worksheets: Worksheet[];
  organizationType?: string;
  cohortId?: string;
}

interface Worksheet {
  id: string;
  moduleId: string;
  title: string;
  questions: Question[];
  responses: { [userId: string]: WorksheetResponse };
  isShared: boolean;
  lastModified: Date;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'multiple_choice' | 'checkbox';
  options?: string[];
  required: boolean;
}

interface WorksheetResponse {
  userId: string;
  answers: { [questionId: string]: string | string[] };
  completedAt?: Date;
  lastModified: Date;
}

interface Testimonial {
  id: string;
  name: string;
  company: string;
  text: string;
  videoUrl?: string;
  rating: number;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

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

const Redirect: React.FC<{ to: string }> = ({ to }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate(to);
  }, [navigate, to]);

  return null;
};

const Header: React.FC<{
  currentUser: User | null;
  onLogin: () => void;
  onLogout: () => void;
}> = ({ currentUser, onLogin, onLogout }) => (
  <header className="app-header">
    <div className="header-content">
      <Link to="/" className="logo">
        <h1>Fair Chance Navigator 2.0</h1>
        <p>Building Inclusive Hiring Strategies</p>
      </Link>
      
      <nav className="header-nav">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/program" className="nav-link">Program</Link>
        {currentUser && <Link to="/articles" className="nav-link">Articles</Link>}
        {currentUser && <Link to="/dashboard" className="nav-link">Dashboard</Link>}
        <Link to="/faq" className="nav-link">FAQ</Link>
      </nav>

      <div className="user-info">
        {currentUser ? (
          <div className="user-menu">
            <span>Welcome, {currentUser.name}</span>
            <Link to="/team" className="team-btn">Team</Link>
            {currentUser.role === 'admin' && <Link to="/admin" className="admin-btn">Admin</Link>}
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        ) : (
          <button onClick={onLogin} className="login-btn">Login / Sign Up</button>
        )}
      </div>
    </div>
  </header>
);

const HomePage: React.FC<{ testimonials: Testimonial[] }> = ({ testimonials }) => (
  <div className="homepage">
    <section className="hero-section">
      <div className="hero-content">
        <h1>Transform Your Hiring with Fair Chance Navigator 2.0</h1>
        <p>The comprehensive platform for developing inclusive hiring strategies that open doors for justice-impacted candidates while strengthening your workforce.</p>
        <div className="hero-actions">
          <Link to="/program" className="cta-primary">Start Your Journey</Link>
          <Link to="#learn-more" className="cta-secondary">Learn More</Link>
        </div>
      </div>
      <div className="hero-visual">
        <div className="stat-highlight">
          <span className="stat-number">85%</span>
          <span className="stat-label">Retention Rate</span>
        </div>
        <div className="stat-highlight">
          <span className="stat-number">500+</span>
          <span className="stat-label">Companies Trained</span>
        </div>
        <div className="stat-highlight">
          <span className="stat-number">95%</span>
          <span className="stat-label">Satisfaction Score</span>
        </div>
      </div>
    </section>

    <section id="learn-more" className="description-section">
      <div className="container">
        <h2>Why Fair Chance Hiring Matters</h2>
        <div className="description-grid">
          <div className="description-item">
            <div className="description-icon">🎯</div>
            <h3>Business Impact</h3>
            <p>Companies with inclusive hiring practices see 25% higher retention rates and improved team performance.</p>
          </div>
          <div className="description-item">
            <div className="description-icon">⚖️</div>
            <h3>Legal Compliance</h3>
            <p>Stay compliant with fair chance legislation while building a stronger, more diverse workforce.</p>
          </div>
          <div className="description-item">
            <div className="description-icon">🌟</div>
            <h3>Social Impact</h3>
            <p>Help break the cycle of recidivism while accessing a motivated, loyal talent pool.</p>
          </div>
        </div>
      </div>
    </section>

    <section className="testimonials-section">
      <div className="container">
        <h2>Success Stories</h2>
        <div className="testimonials-grid">
          {testimonials.map(testimonial => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="testimonial-rating">
                {'★'.repeat(testimonial.rating)}
              </div>
              <p>"{testimonial.text}"</p>
              <div className="testimonial-author">
                <strong>{testimonial.name}</strong>
                <span>{testimonial.company}</span>
              </div>
              {testimonial.videoUrl && (
                <button className="play-testimonial">▶ Watch Video</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="contact-section">
      <div className="container">
        <div className="contact-content">
          <div className="contact-info">
            <h2>Get Started Today</h2>
            <p>Ready to transform your hiring practices? Contact us to learn more about Fair Chance Navigator 2.0.</p>
            <div className="contact-details">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <span>info@fairchancenavigator.com</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <span>(555) 123-4567</span>
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  </div>
);

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert('Thank you for your message! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', company: '', message: '' });
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <h3>Contact Us</h3>
      <input
        type="text"
        placeholder="Your Name"
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
        type="text"
        placeholder="Company Name"
        value={formData.company}
        onChange={(e) => setFormData({...formData, company: e.target.value})}
      />
      <textarea
        placeholder="How can we help you?"
        value={formData.message}
        onChange={(e) => setFormData({...formData, message: e.target.value})}
        required
      ></textarea>
      <button type="submit" className="submit-btn">Send Message</button>
    </form>
  );
};

const ProgramPage: React.FC = () => {
  const [couponCode, setCouponCode] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'enterprise'>('basic');

  const plans = {
    basic: { name: 'Basic', price: 99, features: ['7 Core Modules', 'Basic Support', 'Individual Account'] },
    premium: { name: 'Premium', price: 199, features: ['7 Core Modules', 'Team Collaboration', 'Priority Support', 'Advanced Analytics'] },
    enterprise: { name: 'Enterprise', price: 499, features: ['Everything in Premium', 'Custom Branding', 'Admin Dashboard', 'Content Duplication'] }
  };

  const handleEnrollment = () => {
    // Mock payment processing
    alert(`Enrolling in ${plans[selectedPlan].name} plan. You will have instant access after payment!`);
  };

  return (
    <div className="program-page">
      <section className="program-hero">
        <div className="container">
          <h1>Fair Chance Navigator 2.0 Program</h1>
          <p>Comprehensive training and tools for inclusive hiring excellence</p>
        </div>
      </section>

      <section className="program-overview">
        <div className="container">
          <h2>What You'll Learn</h2>
          <div className="overview-grid">
            <div className="overview-item">
              <h3>📋 Strategic Planning</h3>
              <p>Develop comprehensive plans for inclusive hiring initiatives</p>
            </div>
            <div className="overview-item">
              <h3>⚖️ Policy Development</h3>
              <p>Create legally compliant fair chance policies</p>
            </div>
            <div className="overview-item">
              <h3>👥 Candidate Experience</h3>
              <p>Design positive experiences for all candidates</p>
            </div>
            <div className="overview-item">
              <h3>🎓 Team Training</h3>
              <p>Prepare your staff for inclusive practices</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-section">
        <div className="container">
          <h2>Choose Your Plan</h2>
          <div className="pricing-grid">
            {Object.entries(plans).map(([key, plan]) => (
              <div 
                key={key} 
                className={`pricing-card ${selectedPlan === key ? 'selected' : ''}`}
                onClick={() => setSelectedPlan(key as any)}
              >
                <h3>{plan.name}</h3>
                <div className="price">${plan.price}/month</div>
                <ul>
                  {plan.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="enrollment-form">
            <h3>Enroll Now</h3>
            <div className="coupon-section">
              <input
                type="text"
                placeholder="Coupon Code (Optional)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button className="apply-coupon">Apply</button>
            </div>
            <button onClick={handleEnrollment} className="enroll-btn">
              Enroll in {plans[selectedPlan].name} - ${plans[selectedPlan].price}/month
            </button>
            <p className="instant-access">🚀 Instant access after payment</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const Dashboard: React.FC<{ currentUser: User; modules: Module[] }> = ({ currentUser, modules }) => {
  const completedModules = modules.filter(m => m.completed).length;
  const progress = (completedModules / modules.length) * 100;

  return (
    <div className="dashboard">
      <div className="welcome-section">
        <h2>Welcome back, {currentUser.name}</h2>
        <p>Continue your inclusive hiring journey</p>
        
        <div className="progress-overview">
          <h3>Your Progress</h3>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p>{Math.round(progress)}% Complete ({completedModules} of {modules.length} modules)</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/modules" className="action-btn">Continue Learning</Link>
            <Link to="/team" className="action-btn">Team Collaboration</Link>
            <Link to="/worksheet/planning-worksheet-1" className="action-btn">Complete Worksheet</Link>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Recent Activity</h3>
          <ul className="activity-list">
            <li>Completed Planning module worksheet</li>
            <li>Shared progress with team</li>
            <li>Downloaded policy template</li>
          </ul>
        </div>

        <div className="dashboard-card">
          <h3>Team Progress</h3>
          <p>Your organization has completed {completedModules} modules</p>
          <Link to="/team" className="view-team">View Team Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

const ModulesPage: React.FC<{
  modules: Module[];
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
  currentUser: User;
}> = ({ modules, setModules, currentUser }) => {
  const toggleModuleCompletion = (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, completed: !module.completed }
        : module
    ));
  };

  return (
    <div className="modules-page">
      <h2>Learning Modules</h2>
      <p>Complete these modules to build comprehensive inclusive hiring strategies.</p>
      
      <div className="modules-container">
        {modules.map((module) => (
          <div key={module.id} className={`module-card ${module.completed ? 'completed' : ''}`}>
            <div className="module-icon">{module.icon}</div>
            <h3>{module.title}</h3>
            <p>{module.description}</p>
            
            <div className="module-worksheets">
              {module.worksheets.length > 0 && (
                <p>{module.worksheets.length} worksheet(s) available</p>
              )}
            </div>
            
            <div className="module-actions">
              <Link to={`/module/${module.id}`} className="start-btn">
                {module.completed ? 'Review' : 'Start'}
              </Link>
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
};

const ModuleDetail: React.FC<{
  modules: Module[];
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
  currentUser: User;
}> = ({ modules, setModules, currentUser }) => {
  const location = useLocation();
  const moduleId = location.pathname.split('/').pop();
  const module = modules.find(m => m.id === moduleId);

  if (!module) return <div>Module not found</div>;

  return (
    <div className="module-detail">
      <Link to="/modules" className="back-btn">← Back to Modules</Link>
      
      <div className="module-header">
        <span className="module-icon-large">{module.icon}</span>
        <h2>{module.title}</h2>
        <p>{module.description}</p>
      </div>

      <div className="module-content">
        <div className="content-section">
          <h3>Worksheets & Activities</h3>
          {module.worksheets.length > 0 ? (
            <div className="worksheets-list">
              {module.worksheets.map(worksheet => (
                <div key={worksheet.id} className="worksheet-item">
                  <h4>{worksheet.title}</h4>
                  <p>{worksheet.questions.length} questions</p>
                  <Link to={`/worksheet/${worksheet.id}`} className="worksheet-btn">
                    {worksheet.responses[currentUser.id] ? 'Edit Response' : 'Complete Worksheet'}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p>No worksheets available for this module yet.</p>
          )}
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
          </div>
        </div>
      </div>
    </div>
  );
};

const WorksheetEditor: React.FC<{
  modules: Module[];
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
  currentUser: User;
}> = ({ modules, setModules, currentUser }) => {
  const location = useLocation();
  const worksheetId = location.pathname.split('/').pop();
  
  const worksheet = modules
    .flatMap(m => m.worksheets)
    .find(w => w.id === worksheetId);

  const [responses, setResponses] = useState<{ [questionId: string]: string | string[] }>({});
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    if (worksheet && worksheet.responses[currentUser.id]) {
      setResponses(worksheet.responses[currentUser.id].answers);
    }
  }, [worksheet, currentUser.id]);

  if (!worksheet) return <div>Worksheet not found</div>;

  const handleSave = () => {
    setModules(prev => prev.map(module => ({
      ...module,
      worksheets: module.worksheets.map(w => 
        w.id === worksheetId 
          ? {
              ...w,
              responses: {
                ...w.responses,
                [currentUser.id]: {
                  userId: currentUser.id,
                  answers: responses,
                  lastModified: new Date(),
                  completedAt: new Date()
                }
              },
              isShared: isShared
            }
          : w
      )
    })));
    alert('Worksheet saved successfully!');
  };

  return (
    <div className="worksheet-editor">
      <div className="worksheet-header">
        <Link to={`/module/${worksheet.moduleId}`} className="back-btn">← Back to Module</Link>
        <h2>{worksheet.title}</h2>
        <div className="worksheet-options">
          <label>
            <input 
              type="checkbox" 
              checked={isShared} 
              onChange={(e) => setIsShared(e.target.checked)} 
            />
            Share with team
          </label>
        </div>
      </div>

      <div className="worksheet-content">
        {worksheet.questions.map(question => (
          <div key={question.id} className="question-item">
            <label className="question-label">
              {question.text}
              {question.required && <span className="required">*</span>}
            </label>
            
            {question.type === 'text' && (
              <input
                type="text"
                value={responses[question.id] as string || ''}
                onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
                className="question-input"
              />
            )}
            
            {question.type === 'textarea' && (
              <textarea
                value={responses[question.id] as string || ''}
                onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
                className="question-textarea"
                rows={4}
              />
            )}
            
            {question.type === 'multiple_choice' && question.options && (
              <div className="question-options">
                {question.options.map(option => (
                  <label key={option} className="option-label">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={responses[question.id] === option}
                      onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="worksheet-actions">
        <button onClick={handleSave} className="save-btn">Save Worksheet</button>
        <button className="preview-btn">Preview</button>
      </div>
    </div>
  );
};

const TeamCollaboration: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [teamMembers] = useState([
    { id: '1', name: 'John Doe', role: 'HR Manager', progress: 75 },
    { id: '2', name: 'Jane Smith', role: 'Recruiter', progress: 60 },
    { id: '3', name: 'Mike Johnson', role: 'Team Lead', progress: 90 }
  ]);

  return (
    <div className="team-collaboration">
      <h2>Team Collaboration</h2>
      <p>Collaborate with your team members and track collective progress</p>

      <div className="team-stats">
        <div className="stat-card">
          <h3>Team Members</h3>
          <span className="stat-number">{teamMembers.length}</span>
        </div>
        <div className="stat-card">
          <h3>Average Progress</h3>
          <span className="stat-number">
            {Math.round(teamMembers.reduce((sum, member) => sum + member.progress, 0) / teamMembers.length)}%
          </span>
        </div>
        <div className="stat-card">
          <h3>Shared Worksheets</h3>
          <span className="stat-number">5</span>
        </div>
      </div>

      <div className="team-members">
        <h3>Team Members</h3>
        {teamMembers.map(member => (
          <div key={member.id} className="member-card">
            <div className="member-info">
              <h4>{member.name}</h4>
              <p>{member.role}</p>
            </div>
            <div className="member-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${member.progress}%` }}></div>
              </div>
              <span>{member.progress}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="shared-content">
        <h3>Shared Worksheets</h3>
        <div className="shared-worksheets">
          <div className="shared-item">
            <h4>Strategic Planning Assessment</h4>
            <p>Shared by {currentUser.name} • 2 responses</p>
            <button className="view-btn">View Responses</button>
          </div>
          <div className="shared-item">
            <h4>Policy Development Checklist</h4>
            <p>Shared by John Doe • 3 responses</p>
            <button className="view-btn">View Responses</button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CMSModule {
  id: number;
  moduleNumber: number;
  moduleName: string;
  articles?: CMSArticle[];
}

interface CMSArticle {
  id: number;
  moduleId: number;
  articleName: string;
  content: string;
  position?: number;
}

const AdminPanel: React.FC<{
  modules: Module[];
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
}> = ({ modules, setModules }) => {
  const [cmsModules, setCmsModules] = useState<CMSModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<CMSModule | null>(null);
  const [articles, setArticles] = useState<CMSArticle[]>([]);
  const [editingModule, setEditingModule] = useState<CMSModule | null>(null);
  const [editingArticle, setEditingArticle] = useState<CMSArticle | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);

  // Fetch modules on component mount
  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/modules', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCmsModules(data);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchArticles = async (moduleId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/modules/${moduleId}/articles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const handleCreateModule = async (moduleData: { moduleNumber: number; moduleName: string }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(moduleData),
      });

      if (response.ok) {
        fetchModules();
        setShowModuleForm(false);
        alert('Module created successfully!');
      }
    } catch (error) {
      console.error('Error creating module:', error);
    }
  };

  const handleUpdateModule = async (id: number, moduleData: { moduleNumber: number; moduleName: string }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/modules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(moduleData),
      });

      if (response.ok) {
        fetchModules();
        setEditingModule(null);
        alert('Module updated successfully!');
      }
    } catch (error) {
      console.error('Error updating module:', error);
    }
  };

  const handleDeleteModule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this module? This will also delete all associated articles.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/modules/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchModules();
        if (selectedModule?.id === id) {
          setSelectedModule(null);
          setArticles([]);
        }
        alert('Module deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting module:', error);
    }
  };

  const handleCreateArticle = async (articleData: { moduleId: number; articleName: string; content: string }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(articleData),
      });

      if (response.ok) {
        if (selectedModule) {
          fetchArticles(selectedModule.id);
        }
        setShowArticleForm(false);
        alert('Article created successfully!');
      }
    } catch (error) {
      console.error('Error creating article:', error);
    }
  };

  const handleUpdateArticle = async (id: number, articleData: { articleName: string; content: string }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(articleData),
      });

      if (response.ok) {
        if (selectedModule) {
          fetchArticles(selectedModule.id);
        }
        setEditingArticle(null);
        alert('Article updated successfully!');
      }
    } catch (error) {
      console.error('Error updating article:', error);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        if (selectedModule) {
          fetchArticles(selectedModule.id);
        }
        alert('Article deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const handleReorderArticles = async (reorderedArticles: CMSArticle[]) => {
    try {
      console.log('handleReorderArticles called with:', reorderedArticles);
      
      // Validate input data
      if (!reorderedArticles || reorderedArticles.length === 0) {
        console.error('No articles to reorder');
        return;
      }

      // Convert string IDs to numbers if necessary and validate
      const validArticles = reorderedArticles.map(article => {
        console.log('Processing article:', article);
        
        // Skip any non-article objects
        if (!article || typeof article !== 'object') {
          console.warn('Skipping non-object:', article);
          return null;
        }
        
        // Skip objects that don't look like articles
        if (typeof article.id === 'string' && article.id === 'reorder') {
          console.warn('Skipping reorder object:', article);
          return null;
        }
        
        return {
          ...article,
          id: typeof article.id === 'string' ? parseInt(article.id, 10) : article.id
        };
      }).filter((article): article is CMSArticle => {
        if (!article) return false;
        
        const hasValidId = article.id && !isNaN(article.id) && article.id > 0;
        const hasArticleName = !!article.articleName;
        const hasContent = !!article.content;
        const hasModuleId = !!article.moduleId;
        
        const isValid = !!hasValidId && hasArticleName && hasContent && hasModuleId;
        
        if (!isValid) {
          console.warn('Invalid article found:', article);
          console.warn('ID valid:', !!hasValidId, 'ID:', article.id);
          console.warn('Has articleName:', hasArticleName, 'articleName:', article.articleName);
          console.warn('Has content:', hasContent, 'content length:', article.content?.length);
          console.warn('Has moduleId:', hasModuleId, 'moduleId:', article.moduleId);
        }
        return isValid;
      });

      if (validArticles.length === 0) {
        console.error('No valid articles to reorder');
        alert('No valid articles found. Please refresh and try again.');
        if (selectedModule) {
          fetchArticles(selectedModule.id);
        }
        return;
      }

      if (validArticles.length !== reorderedArticles.length) {
        console.warn(`${reorderedArticles.length - validArticles.length} invalid articles were filtered out`);
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in again to reorder articles.');
        return;
      }

      const requestBody = {
        articles: validArticles.map((article, index) => ({
          id: article.id,
          position: index + 1
        }))
      };

      console.log('Sending reorder request:', requestBody);

      const response = await fetch('/api/articles/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Articles reordered successfully:', responseData);
        // Update local state with the reordered articles
        setArticles(validArticles);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        console.error('Failed to reorder articles:', errorData);
        alert(`Failed to reorder articles: ${errorData.error || 'Unknown error'}`);
        // Refresh articles to restore original order
        if (selectedModule) {
          fetchArticles(selectedModule.id);
        }
      }
    } catch (error) {
      console.error('Error reordering articles:', error);
      alert('Network error while reordering articles. Please try again.');
      // Refresh articles to restore original order
      if (selectedModule) {
        fetchArticles(selectedModule.id);
      }
    }
  };

  const selectModule = (module: CMSModule) => {
    setSelectedModule(module);
    fetchArticles(module.id);
  };

  return (
    <div className="admin-panel">
      <h2>Content Management System</h2>
      
      <div className="cms-layout">
        <div className="modules-panel">
          <div className="panel-header">
            <h3>Modules</h3>
            <button onClick={() => setShowModuleForm(true)} className="add-btn">+ Add Module</button>
          </div>
          
          <div className="modules-list">
            {cmsModules.map(module => (
              <div 
                key={module.id} 
                className={`module-item ${selectedModule?.id === module.id ? 'selected' : ''}`}
                onClick={() => selectModule(module)}
              >
                <div className="module-info">
                  <span className="module-number">#{module.moduleNumber}</span>
                  <span className="module-name">{module.moduleName}</span>
                </div>
                <div className="module-actions">
                  <button onClick={(e) => { e.stopPropagation(); setEditingModule(module); }} className="edit-btn">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }} className="delete-btn">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="articles-panel">
          <div className="panel-header">
            <h3>{selectedModule ? `Articles in ${selectedModule.moduleName}` : 'Select a module'}</h3>
            {selectedModule && (
              <button onClick={() => setShowArticleForm(true)} className="add-btn">+ Add Article</button>
            )}
          </div>
          
          {selectedModule && (
            <div className="articles-list">
              {articles.map((article, index) => (
                <div 
                  key={article.id} 
                  className="article-item"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', index.toString());
                    e.currentTarget.classList.add('dragging');
                  }}
                  onDragEnd={(e) => {
                    e.currentTarget.classList.remove('dragging');
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('drag-over');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('drag-over');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag-over');
                    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    const targetIndex = index;
                    
                    if (draggedIndex !== targetIndex && draggedIndex >= 0 && targetIndex >= 0 && draggedIndex < articles.length && targetIndex < articles.length) {
                      const newArticles = [...articles];
                      const draggedArticle = newArticles[draggedIndex];
                      
                      console.log('Drag and drop - draggedArticle:', draggedArticle);
                      console.log('Drag and drop - all articles:', articles);
                      
                      // Validate that the dragged article exists and has a valid ID
                      if (!draggedArticle || (!draggedArticle.id && draggedArticle.id !== 0)) {
                        console.error('Invalid article being dragged:', draggedArticle);
                        alert('Invalid article data. Please refresh the page and try again.');
                        return;
                      }
                      
                      // Ensure ID is a number
                      const articleId = typeof draggedArticle.id === 'string' ? parseInt(draggedArticle.id, 10) : draggedArticle.id;
                      if (isNaN(articleId) || articleId <= 0) {
                        console.error('Invalid article ID:', draggedArticle.id);
                        alert('Invalid article ID. Please refresh the page and try again.');
                        return;
                      }
                      
                      // Create the reordered article with validated data
                      const reorderedArticle = {
                        id: articleId,
                        moduleId: draggedArticle.moduleId,
                        articleName: draggedArticle.articleName,
                        content: draggedArticle.content
                      };
                      
                      newArticles.splice(draggedIndex, 1);
                      newArticles.splice(targetIndex, 0, reorderedArticle);
                      
                      console.log('New articles after reorder:', newArticles);
                      
                      // Update local state immediately for responsive UI
                      setArticles(newArticles);
                      
                      // Update article positions on server
                      handleReorderArticles(newArticles);
                    }
                  }}
                >
                  <div className="drag-handle">⋮⋮</div>
                  <div className="article-info">
                    <h4>{article.articleName}</h4>
                    <p>{article.content.length > 100 ? article.content.substring(0, 100) + '...' : article.content}</p>
                  </div>
                  <div className="article-actions">
                    <button onClick={() => setEditingArticle(article)} className="edit-btn">Edit</button>
                    <button onClick={() => handleDeleteArticle(article.id)} className="delete-btn">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Module Form Modal */}
      {(showModuleForm || editingModule) && (
        <ModuleForm
          module={editingModule}
          onSave={editingModule ? 
            (data) => handleUpdateModule(editingModule.id, data) : 
            handleCreateModule
          }
          onCancel={() => {
            setShowModuleForm(false);
            setEditingModule(null);
          }}
        />
      )}

      {/* Article Form Modal */}
      {(showArticleForm || editingArticle) && selectedModule && (
        <ArticleForm
          article={editingArticle}
          moduleId={selectedModule.id}
          onSave={editingArticle ? 
            (data) => handleUpdateArticle(editingArticle.id, data) : 
            handleCreateArticle
          }
          onCancel={() => {
            setShowArticleForm(false);
            setEditingArticle(null);
          }}
        />
      )}
    </div>
  );
};

const ModuleForm: React.FC<{
  module?: CMSModule | null;
  onSave: (data: { moduleNumber: number; moduleName: string }) => void;
  onCancel: () => void;
}> = ({ module, onSave, onCancel }) => {
  const [moduleNumber, setModuleNumber] = useState(module?.moduleNumber || 1);
  const [moduleName, setModuleName] = useState(module?.moduleName || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ moduleNumber, moduleName });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{module ? 'Edit Module' : 'Create Module'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Module Number:</label>
            <input
              type="number"
              value={moduleNumber}
              onChange={(e) => setModuleNumber(parseInt(e.target.value))}
              required
            />
          </div>
          <div className="form-group">
            <label>Module Name:</label>
            <input
              type="text"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="save-btn">Save</button>
            <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ArticleForm: React.FC<{
  article?: CMSArticle | null;
  moduleId: number;
  onSave: (data: any) => void;
  onCancel: () => void;
}> = ({ article, moduleId, onSave, onCancel }) => {
  const [articleName, setArticleName] = useState(article?.articleName || '');
  const [content, setContent] = useState(article?.content || '');
  const [isDragging, setIsDragging] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = article ? 
      { articleName, content } : 
      { moduleId, articleName, content };
    onSave(data);
  };

  const insertAtCursor = (text: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + text + content.substring(end);
      setContent(newContent);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    }
  };

  const formatText = (formatType: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      
      let formattedText = '';
      switch (formatType) {
        case 'bold':
          formattedText = `**${selectedText || 'bold text'}**`;
          break;
        case 'italic':
          formattedText = `*${selectedText || 'italic text'}*`;
          break;
        case 'underline':
          formattedText = `<u>${selectedText || 'underlined text'}</u>`;
          break;
        case 'heading1':
          formattedText = `# ${selectedText || 'Heading 1'}`;
          break;
        case 'heading2':
          formattedText = `## ${selectedText || 'Heading 2'}`;
          break;
        case 'heading3':
          formattedText = `### ${selectedText || 'Heading 3'}`;
          break;
        case 'link':
          const url = prompt('Enter URL:') || '#';
          formattedText = `[${selectedText || 'Link Text'}](${url})`;
          break;
        case 'video':
          const videoUrl = prompt('Enter video URL (YouTube, Vimeo, etc.):') || '';
          formattedText = `<video controls><source src="${videoUrl}" type="video/mp4">Video: ${videoUrl}</video>`;
          break;
        case 'size':
          const size = prompt('Enter font size (e.g., 18px, 1.5em):') || '18px';
          formattedText = `<span style="font-size: ${size}">${selectedText || 'sized text'}</span>`;
          break;
        default:
          return;
      }
      
      const newContent = content.substring(0, start) + formattedText + content.substring(end);
      setContent(newContent);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
      }, 0);
    }
  };

  const handleColorPicker = () => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      
      // Create a color input element
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = '#ff0000';
      colorInput.style.position = 'absolute';
      colorInput.style.top = '-9999px';
      document.body.appendChild(colorInput);
      
      colorInput.onchange = () => {
        const color = colorInput.value;
        const formattedText = `<span style="color: ${color}">${selectedText || 'colored text'}</span>`;
        const newContent = content.substring(0, start) + formattedText + content.substring(end);
        setContent(newContent);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
        }, 0);
        
        document.body.removeChild(colorInput);
      };
      
      colorInput.click();
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const fileUrl = data.url;
        
        if (file.type.startsWith('image/')) {
          insertAtCursor(`<img src="${fileUrl}" alt="${file.name}" style="max-width: 100%; height: auto;" />`);
        } else {
          insertAtCursor(`[${file.name}](${fileUrl})`);
        }
      } else {
        alert('Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    }
  };

  const triggerImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        handleFileUpload(target.files[0]);
      }
    };
    input.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/') || 
          file.type === 'application/pdf' || 
          file.type.includes('document') ||
          file.type.includes('word')) {
        handleFileUpload(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content extra-large" onClick={(e) => e.stopPropagation()}>
        <h3>{article ? 'Edit Article' : 'Create Article'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Article Name:</label>
            <input
              type="text"
              value={articleName}
              onChange={(e) => setArticleName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Content:</label>
            
            {/* Rich Text Toolbar */}
            <div className="rich-text-toolbar">
              <div className="toolbar-group">
                <button type="button" onClick={() => formatText('bold')} title="Bold">
                  <strong>B</strong>
                </button>
                <button type="button" onClick={() => formatText('italic')} title="Italic">
                  <em>I</em>
                </button>
                <button type="button" onClick={() => formatText('underline')} title="Underline">
                  <u>U</u>
                </button>
              </div>
              
              <div className="toolbar-group">
                <button type="button" onClick={() => formatText('heading1')} title="Heading 1">
                  H1
                </button>
                <button type="button" onClick={() => formatText('heading2')} title="Heading 2">
                  H2
                </button>
                <button type="button" onClick={() => formatText('heading3')} title="Heading 3">
                  H3
                </button>
              </div>
              
              <div className="toolbar-group">
                <button type="button" onClick={handleColorPicker} title="Text Color">
                  🎨
                </button>
                <button type="button" onClick={() => formatText('size')} title="Font Size">
                  📏
                </button>
              </div>
              
              <div className="toolbar-group">
                <button type="button" onClick={() => formatText('link')} title="Insert Link">
                  🔗
                </button>
                <button type="button" onClick={triggerImageUpload} title="Upload Image">
                  🖼️
                </button>
                <button type="button" onClick={() => formatText('video')} title="Insert Video">
                  🎬
                </button>
              </div>
              
              <div className="toolbar-group">
                <label className="file-upload-btn" title="Upload File">
                  📁
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={(e) => {
                      if (e.target.files) {
                        Array.from(e.target.files).forEach(handleFileUpload);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
            
            {/* Content Editor */}
            <div 
              className={`content-editor-container ${isDragging ? 'dragging' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <textarea
                id="content-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                placeholder="Start typing your article content... You can drag and drop images and files here!"
                required
              />
              {isDragging && (
                <div className="drop-overlay">
                  <div className="drop-message">
                    Drop files here to upload
                  </div>
                </div>
              )}
            </div>
            
            {/* Preview */}
            <div className="content-preview">
              <h4>Preview:</h4>
              <div 
                className="preview-content"
                dangerouslySetInnerHTML={{ 
                  __html: '<p>' + content
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>')
                    .replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>')
                    .replace(/# (.*?)(\n|$)/g, '<h1>$1</h1>')
                    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
                    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
                    .replace(/src="\/uploads\//g, 'src="/api/uploads/')
                    .replace(/src="uploads\//g, 'src="/api/uploads/') + '</p>'
                }}
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="save-btn">Save Article</button>
            <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

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

const FAQ: React.FC = () => (
  <div className="faq-page">
    <div className="container">
      <h1>Frequently Asked Questions</h1>
      
      <div className="faq-list">
        <div className="faq-item">
          <h3>What is Fair Chance Navigator 2.0?</h3>
          <p>Fair Chance Navigator 2.0 is a comprehensive platform designed to help employers develop inclusive hiring strategies for justice-impacted candidates. It provides training modules, tools, and resources to create fair and effective hiring practices.</p>
        </div>
        
        <div className="faq-item">
          <h3>How long does it take to complete the program?</h3>
          <p>The complete program typically takes 4-6 weeks to finish, depending on your pace and organization size. Each module can be completed in 1-2 hours.</p>
        </div>
        
        <div className="faq-item">
          <h3>Can my team collaborate on the platform?</h3>
          <p>Yes! Premium and Enterprise plans include team collaboration features, allowing multiple users from your organization to work together and share progress.</p>
        </div>
        
        <div className="faq-item">
          <h3>Is my data secure?</h3>
          <p>Absolutely. We use industry-standard encryption and security measures to protect all user data. Your information is never shared with third parties without your explicit consent.</p>
        </div>
        
        <div className="faq-item">
          <h3>Do you offer support?</h3>
          <p>Yes, we provide email support for all users, with priority support available for Premium and Enterprise customers. We also offer live chat during business hours.</p>
        </div>
      </div>
    </div>
  </div>
);

const PrivacyPolicy: React.FC = () => (
  <div className="policy-page">
    <div className="container">
      <h1>Privacy Policy</h1>
      <div className="policy-content">
        <section>
          <h2>Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, complete worksheets, or contact us for support.</p>
        </section>
        
        <section>
          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
        </section>
        
        <section>
          <h2>Information Sharing</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in specific circumstances outlined in this policy.</p>
        </section>
        
        <section>
          <h2>Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
        </section>
        
        <section>
          <h2>Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at privacy@fairchancenavigator.com</p>
        </section>
      </div>
    </div>
  </div>
);

const TermsConditions: React.FC = () => (
  <div className="policy-page">
    <div className="container">
      <h1>Terms and Conditions</h1>
      <div className="policy-content">
        <section>
          <h2>Acceptance of Terms</h2>
          <p>By accessing and using Fair Chance Navigator 2.0, you accept and agree to be bound by the terms and provision of this agreement.</p>
        </section>
        
        <section>
          <h2>Use License</h2>
          <p>Permission is granted to temporarily access the materials on Fair Chance Navigator 2.0 for personal, non-commercial transitory viewing only.</p>
        </section>
        
        <section>
          <h2>User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.</p>
        </section>
        
        <section>
          <h2>Prohibited Uses</h2>
          <p>You may not use our service for any unlawful purpose or to solicit others to perform prohibited conduct.</p>
        </section>
        
        <section>
          <h2>Limitation of Liability</h2>
          <p>In no event shall Fair Chance Navigator 2.0 or its suppliers be liable for any damages arising out of the use or inability to use the materials.</p>
        </section>
      </div>
    </div>
  </div>
);

const EmbeddedContent: React.FC = () => {
  const location = useLocation();
  const courseId = location.pathname.split('/').pop();

  return (
    <div className="embedded-content">
      <div className="embed-header">
        <h2>Fair Chance Navigator 2.0</h2>
        <p>Embedded Course Content</p>
      </div>
      
      <div className="embed-body">
        <p>This is embedded content for course: {courseId}</p>
        <div className="embed-features">
          <div className="embed-feature">
            <h3>Interactive Learning</h3>
            <p>Engage with our comprehensive modules</p>
          </div>
          <div className="embed-feature">
            <h3>Track Progress</h3>
            <p>Monitor your learning journey</p>
          </div>
        </div>
        
        <div className="embed-cta">
          <p>Want the full experience?</p>
          <a href="/" className="embed-link">Visit Fair Chance Navigator 2.0</a>
        </div>
      </div>
    </div>
  );
};

export default App;
