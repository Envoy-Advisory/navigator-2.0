
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

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

interface AdminModule {
  id: number;
  moduleNumber: number;
  moduleName: string;
  articles: AdminArticle[];
  created_at: string;
  updated_at: string;
}

interface AdminArticle {
  id: number;
  moduleId: number;
  articleName: string;
  content: string;
  created_at: string;
  updated_at: string;
  module?: AdminModule;
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
          <Route path="/admin/console" element={
            currentUser?.role === 'admin' ? <AdminConsole currentUser={currentUser} /> : <Redirect to="/" />
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

const AdminPanel: React.FC<{
  modules: Module[];
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
}> = ({ modules, setModules }) => {
  const handleDuplicateModule = (moduleId: string) => {
    const moduleToClone = modules.find(m => m.id === moduleId);
    if (moduleToClone) {
      const clonedModule: Module = {
        ...moduleToClone,
        id: `${moduleId}-copy-${Date.now()}`,
        title: `${moduleToClone.title} (Copy)`,
        completed: false,
        organizationType: 'custom',
        cohortId: `cohort-${Date.now()}`
      };
      setModules(prev => [...prev, clonedModule]);
      alert('Module duplicated successfully!');
    }
  };

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      <p>Manage content, users, and system settings</p>

      <div className="admin-sections">
        <div className="admin-section">
          <h3>Content Management</h3>
          <div className="admin-actions">
            <Link to="/admin/console" className="admin-btn">Admin Console</Link>
            <button className="admin-btn">Manage Worksheets</button>
            <button className="admin-btn">Upload Resources</button>
          </div>
        </div>

        <div className="admin-section">
          <h3>Module Duplication</h3>
          <p>Create copies of modules for different organization types or cohorts</p>
          <div className="module-list">
            {modules.slice(0, 3).map(module => (
              <div key={module.id} className="admin-module-item">
                <span>{module.title}</span>
                <button 
                  onClick={() => handleDuplicateModule(module.id)}
                  className="duplicate-btn"
                >
                  Duplicate
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-section">
          <h3>User Management</h3>
          <div className="admin-stats">
            <div className="admin-stat">
              <span className="stat-number">150</span>
              <span className="stat-label">Total Users</span>
            </div>
            <div className="admin-stat">
              <span className="stat-number">25</span>
              <span className="stat-label">Organizations</span>
            </div>
            <div className="admin-stat">
              <span className="stat-number">85%</span>
              <span className="stat-label">Completion Rate</span>
            </div>
          </div>
        </div>

        <div className="admin-section">
          <h3>Embed Settings</h3>
          <p>Generate embed codes for partner sites</p>
          <div className="embed-generator">
            <select className="embed-select">
              <option>Select Course to Embed</option>
              <option>Complete Program</option>
              <option>Planning Module</option>
              <option>Policies Module</option>
            </select>
            <button className="generate-btn">Generate Embed Code</button>
          </div>
        </div>
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

const AdminConsole: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<AdminModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingModule, setEditingModule] = useState<AdminModule | null>(null);
  const [editingArticle, setEditingArticle] = useState<AdminArticle | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);

  const [moduleForm, setModuleForm] = useState({
    moduleNumber: '',
    moduleName: ''
  });

  const [articleForm, setArticleForm] = useState({
    articleName: '',
    content: ''
  });

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
        setModules(data);
      } else {
        alert('Failed to fetch modules');
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      alert('Error fetching modules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(moduleForm),
      });

      if (response.ok) {
        setModuleForm({ moduleNumber: '', moduleName: '' });
        setShowModuleForm(false);
        fetchModules();
      } else {
        alert('Failed to create module');
      }
    } catch (error) {
      console.error('Error creating module:', error);
      alert('Error creating module');
    }
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/modules/${editingModule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(moduleForm),
      });

      if (response.ok) {
        setEditingModule(null);
        setModuleForm({ moduleNumber: '', moduleName: '' });
        fetchModules();
      } else {
        alert('Failed to update module');
      }
    } catch (error) {
      console.error('Error updating module:', error);
      alert('Error updating module');
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm('Are you sure you want to delete this module? This will also delete all its articles.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/modules/${moduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchModules();
        if (selectedModule?.id === moduleId) {
          setSelectedModule(null);
        }
      } else {
        alert('Failed to delete module');
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Error deleting module');
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...articleForm,
          moduleId: selectedModule.id
        }),
      });

      if (response.ok) {
        setArticleForm({ articleName: '', content: '' });
        setShowArticleForm(false);
        fetchModules();
      } else {
        alert('Failed to create article');
      }
    } catch (error) {
      console.error('Error creating article:', error);
      alert('Error creating article');
    }
  };

  const handleUpdateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/articles/${editingArticle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(articleForm),
      });

      if (response.ok) {
        setEditingArticle(null);
        setArticleForm({ articleName: '', content: '' });
        fetchModules();
      } else {
        alert('Failed to update article');
      }
    } catch (error) {
      console.error('Error updating article:', error);
      alert('Error updating article');
    }
  };

  const handleDeleteArticle = async (articleId: number) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchModules();
      } else {
        alert('Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Error deleting article');
    }
  };

  const startEditModule = (module: AdminModule) => {
    setEditingModule(module);
    setModuleForm({
      moduleNumber: module.moduleNumber.toString(),
      moduleName: module.moduleName
    });
  };

  const startEditArticle = (article: AdminArticle) => {
    setEditingArticle(article);
    setArticleForm({
      articleName: article.articleName,
      content: article.content
    });
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div><p>Loading admin console...</p></div>;
  }

  return (
    <div className="admin-console">
      <div className="console-header">
        <h1>Content Management Console</h1>
        <Link to="/admin" className="back-btn">← Back to Admin Panel</Link>
      </div>

      <div className="console-layout">
        <div className="modules-panel">
          <div className="panel-header">
            <h2>Modules</h2>
            <button 
              className="create-btn" 
              onClick={() => setShowModuleForm(true)}
            >
              + Create Module
            </button>
          </div>

          <div className="modules-list">
            {modules.map(module => (
              <div 
                key={module.id} 
                className={`module-item ${selectedModule?.id === module.id ? 'selected' : ''}`}
                onClick={() => setSelectedModule(module)}
              >
                <div className="module-info">
                  <h3>Module {module.moduleNumber}: {module.moduleName}</h3>
                  <p>{module.articles.length} articles</p>
                </div>
                <div className="module-actions">
                  <button onClick={(e) => { e.stopPropagation(); startEditModule(module); }}>Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="articles-panel">
          {selectedModule ? (
            <>
              <div className="panel-header">
                <h2>Articles for Module {selectedModule.moduleNumber}</h2>
                <button 
                  className="create-btn" 
                  onClick={() => setShowArticleForm(true)}
                >
                  + Create Article
                </button>
              </div>

              <div className="articles-list">
                {selectedModule.articles.map(article => (
                  <div key={article.id} className="article-item">
                    <div className="article-info">
                      <h4>{article.articleName}</h4>
                      <p>{article.content.substring(0, 100)}...</p>
                    </div>
                    <div className="article-actions">
                      <button onClick={() => startEditArticle(article)}>Edit</button>
                      <button onClick={() => handleDeleteArticle(article.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a module to view and manage its articles</p>
            </div>
          )}
        </div>
      </div>

      {/* Module Form Modal */}
      {(showModuleForm || editingModule) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingModule ? 'Edit Module' : 'Create New Module'}</h3>
            <form onSubmit={editingModule ? handleUpdateModule : handleCreateModule}>
              <input
                type="number"
                placeholder="Module Number"
                value={moduleForm.moduleNumber}
                onChange={(e) => setModuleForm({...moduleForm, moduleNumber: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Module Name"
                value={moduleForm.moduleName}
                onChange={(e) => setModuleForm({...moduleForm, moduleName: e.target.value})}
                required
              />
              <div className="form-actions">
                <button type="submit">{editingModule ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => {
                  setShowModuleForm(false);
                  setEditingModule(null);
                  setModuleForm({ moduleNumber: '', moduleName: '' });
                }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Article Form Modal */}
      {(showArticleForm || editingArticle) && (
        <div className="modal-overlay">
          <div className="modal-content article-modal">
            <h3>{editingArticle ? 'Edit Article' : 'Create New Article'}</h3>
            <form onSubmit={editingArticle ? handleUpdateArticle : handleCreateArticle}>
              <input
                type="text"
                placeholder="Article Name"
                value={articleForm.articleName}
                onChange={(e) => setArticleForm({...articleForm, articleName: e.target.value})}
                required
              />
              <textarea
                placeholder="Article Content"
                value={articleForm.content}
                onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                rows={10}
                required
              />
              <div className="form-actions">
                <button type="submit">{editingArticle ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => {
                  setShowArticleForm(false);
                  setEditingArticle(null);
                  setArticleForm({ articleName: '', content: '' });
                }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
