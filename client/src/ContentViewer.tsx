import React, { useState, useEffect } from 'react';
import './ContentViewer.css';

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

interface CMSModule {
  id: number;
  moduleNumber: number;
  moduleName: string;
  articles?: CMSArticle[];
  forms?: CMSForm[];
}

interface CMSArticle {
  id: number;
  moduleId: number;
  articleName: string;
  content: string;
  position?: number;
}

interface CMSForm {
  id: number;
  moduleId: number;
  formName: string;
  questions: FormQuestion[];
  position?: number;
}

interface FormQuestion {
  id: string;
  type: 'yesno' | 'checkbox' | 'dropdown' | 'text';
  question: string;
  options?: string[];
  required?: boolean;
}

interface FormResponse {
  id: number;
  formId: number;
  userId: number;
  answers: { [questionId: string]: any };
  created_at: string;
  updated_at: string;
}

interface OrganizationFormResponses {
  organizationUsers: User[];
  responses: FormResponse[];
}

interface ContentViewerProps {
  currentUser: User;
}

const ContentViewer: React.FC<ContentViewerProps> = ({ currentUser }) => {
  const [modules, setModules] = useState<CMSModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<CMSModule | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<CMSArticle | null>(null);
  const [selectedForm, setSelectedForm] = useState<CMSForm | null>(null);
  const [formResponse, setFormResponse] = useState<FormResponse | null>(null);
  const [formAnswers, setFormAnswers] = useState<{ [questionId: string]: any }>({});
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [organizationResponses, setOrganizationResponses] = useState<OrganizationFormResponses | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showOrganizationView, setShowOrganizationView] = useState(false);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/modules/authenticated', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setModules(data);
      } else {
        console.error('Failed to fetch modules');
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async (moduleId: number) => {
    setContentLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/modules/${moduleId}/articles/authenticated`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const articles = await response.json();
        setModules(prev => prev.map(module => 
          module.id === moduleId 
            ? { ...module, articles }
            : module
        ));
      } else {
        console.error('Failed to fetch articles');
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const fetchForms = async (moduleId: number) => {
    setContentLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/modules/${moduleId}/forms/authenticated`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const forms = await response.json();
        setModules(prev => prev.map(module => 
          module.id === moduleId 
            ? { ...module, forms }
            : module
        ));
      } else {
        console.error('Failed to fetch forms');
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const fetchFormResponse = async (formId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/forms/${formId}/response`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setFormResponse(data);
          setFormAnswers(data.answers || {});
        } else {
          setFormResponse(null);
          setFormAnswers({});
        }
      }
    } catch (error) {
      console.error('Error fetching form response:', error);
    }
  };

  const fetchOrganizationFormResponses = async (formId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/forms/${formId}/organization-responses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: OrganizationFormResponses = await response.json();
        setOrganizationResponses(data);
      } else {
        console.error('Failed to fetch organization form responses');
        setOrganizationResponses(null);
      }
    } catch (error) {
      console.error('Error fetching organization form responses:', error);
      setOrganizationResponses(null);
    }
  };

  const fetchUserFormResponse = async (formId: number, userId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/forms/${formId}/user/${userId}/response`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: FormResponse = await response.json();
        setFormResponse(data);
        setFormAnswers(data.answers || {});
      } else {
        console.error(`Failed to fetch form response for user ${userId}`);
        setFormResponse(null);
        setFormAnswers({});
      }
    } catch (error) {
      console.error(`Error fetching form response for user ${userId}:`, error);
      setFormResponse(null);
      setFormAnswers({});
    }
  };

  const saveUserFormResponse = async (formId: number, userId: number, answers: { [questionId: string]: any }) => {
    try {
      setContentLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/forms/${formId}/user/${userId}/response`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers })
      });

      if (response.ok) {
        const data: FormResponse = await response.json();
        setFormResponse(data);
        alert('User form response saved successfully!');
        await fetchOrganizationFormResponses(formId); // Refresh organization responses
      } else {
        alert('Failed to save user form response');
      }
    } catch (error) {
      console.error('Error saving user form response:', error);
      alert('Error saving user form response');
    } finally {
      setContentLoading(false);
    }
  };

  const toggleModule = (module: CMSModule) => {
    const isExpanded = expandedModules.has(module.id);
    const newExpanded = new Set(expandedModules);

    if (isExpanded) {
      newExpanded.delete(module.id);
    } else {
      newExpanded.add(module.id);
      if (!module.articles) {
        fetchArticles(module.id);
      }
      if (!module.forms) {
        fetchForms(module.id);
      }
    }

    setExpandedModules(newExpanded);
    setSelectedModule(module);
  };

  const selectArticle = (article: CMSArticle) => {
    setSelectedArticle(article);
    setSelectedForm(null);
  };

  const selectForm = (form: CMSForm) => {
    setSelectedForm(form);
    setSelectedArticle(null);
    setShowOrganizationView(false);
    setSelectedUserId(null);
    fetchFormResponse(form.id);
    if (currentUser.organizationId) {
      fetchOrganizationFormResponses(form.id);
    }
  };

  const handleFormAnswerChange = (questionId: string, value: any) => {
    setFormAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveFormResponse = async () => {
    if (!selectedForm) return;

    if (showOrganizationView && selectedUserId) {
      await saveUserFormResponse(selectedForm.id, selectedUserId, formAnswers);
    } else {
      try {
        setContentLoading(true);
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/forms/${selectedForm.id}/response`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ answers: formAnswers })
        });

        if (response.ok) {
          const data = await response.json();
          setFormResponse(data);
          if (currentUser.organizationId) {
            await fetchOrganizationFormResponses(selectedForm.id);
          }
        }
      } catch (error) {
        console.error('Error saving form response:', error);
      } finally {
        setContentLoading(false);
      }
    }
  };

  const formatContent = (content: string) => {
    // Basic markdown-like formatting
    let formatted = content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>')
      .replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>')
      .replace(/# (.*?)(\n|$)/g, '<h1>$1</h1>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />');

    // Handle both data URLs and traditional file paths
    formatted = formatted.replace(/src="\/uploads\//g, (match, offset, string) => {
      const beforeMatch = string.substring(Math.max(0, offset - 50), offset);
      if (beforeMatch.includes('data:')) return match;
      return 'src="/api/uploads/';
    });
    formatted = formatted.replace(/src="uploads\//g, (match, offset, string) => {
      const beforeMatch = string.substring(Math.max(0, offset - 50), offset);
      if (beforeMatch.includes('data:')) return match;
      return 'src="/api/uploads/';
    });

    return formatted;
  };

  const renderFormQuestion = (question: FormQuestion) => {
    const answer = formAnswers[question.id];

    switch (question.type) {
      case 'yesno':
        return (
          <div className="form-question" key={question.id}>
            <label className="question-label">
              {question.question}
              {question.required && <span className="required">*</span>}
            </label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name={question.id}
                  value="yes"
                  checked={answer === 'yes'}
                  onChange={(e) => handleFormAnswerChange(question.id, e.target.value)}
                />
                Yes
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name={question.id}
                  value="no"
                  checked={answer === 'no'}
                  onChange={(e) => handleFormAnswerChange(question.id, e.target.value)}
                />
                No
              </label>
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="form-question" key={question.id}>
            <label className="question-label">
              {question.question}
              {question.required && <span className="required">*</span>}
            </label>
            <div className="checkbox-group">
              {question.options?.map(option => (
                <label key={option} className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={Array.isArray(answer) && answer.includes(option)}
                    onChange={(e) => {
                      const currentAnswers = Array.isArray(answer) ? answer : [];
                      if (e.target.checked) {
                        handleFormAnswerChange(question.id, [...currentAnswers, option]);
                      } else {
                        handleFormAnswerChange(question.id, currentAnswers.filter(a => a !== option));
                      }
                    }}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        );

      case 'dropdown':
        return (
          <div className="form-question" key={question.id}>
            <label className="question-label">
              {question.question}
              {question.required && <span className="required">*</span>}
            </label>
            <select
              value={answer || ''}
              onChange={(e) => handleFormAnswerChange(question.id, e.target.value)}
              className="form-select"
            >
              <option value="">Select an option...</option>
              {question.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );

      case 'text':
        return (
          <div className="form-question" key={question.id}>
            <label className="question-label">
              {question.question}
              {question.required && <span className="required">*</span>}
            </label>
            <textarea
              value={answer || ''}
              onChange={(e) => handleFormAnswerChange(question.id, e.target.value)}
              className="form-textarea"
              rows={4}
            />
          </div>
        );

      default:
        return null;
    }
  };



  if (loading) {
    return (
      <div className="content-viewer">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          Loading modules...
        </div>
      </div>
    );
  }

  return (
    <div className="content-viewer">
      <nav className="content-nav">
        <div className="content-nav-header">
          <h2>Learning Modules</h2>
          <p>Browse articles and forms by module</p>
        </div>

        <ul className="modules-nav-list">
          {modules.map(module => (
            <li key={module.id} className="module-nav-item">
              <button
                className={`module-nav-button ${selectedModule?.id === module.id ? 'active' : ''}`}
                onClick={() => toggleModule(module)}
                aria-expanded={expandedModules.has(module.id)}
              >
                <span>
                  {module.moduleName}
                </span>
                <span className="module-number">{module.moduleNumber}</span>
              </button>

              {expandedModules.has(module.id) && (
                <div className="content-submenu">
                  {contentLoading && selectedModule?.id === module.id ? (
                    <div className="loading-content">
                      <div className="loading-spinner"></div>
                      Loading content...
                    </div>
                  ) : (
                    <>
                      {module.articles && module.articles.length > 0 && (
                        <>
                          <div className="content-type-header">Articles</div>
                          {module.articles.map(article => (
                            <button
                              key={`article-${article.id}`}
                              className={`content-nav-item ${selectedArticle?.id === article.id ? 'active' : ''}`}
                              onClick={() => selectArticle(article)}
                            >
                              📄 {article.articleName}
                            </button>
                          ))}
                        </>
                      )}

                      {module.forms && module.forms.length > 0 && (
                        <>
                          <div className="content-type-header">Forms</div>
                          {module.forms.map(form => (
                            <button
                              key={`form-${form.id}`}
                              className={`content-nav-item ${selectedForm?.id === form.id ? 'active' : ''}`}
                              onClick={() => selectForm(form)}
                            >
                              📋 {form.formName}
                            </button>
                          ))}
                        </>
                      )}

                      {(!module.articles || module.articles.length === 0) && 
                       (!module.forms || module.forms.length === 0) && (
                        <div className="no-content-message">
                          No content available
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <main className="content-main">
        {selectedArticle ? (
          <>
            <header className="content-header">
              <h1>{selectedArticle.articleName}</h1>
              <p className="content-breadcrumb">
                {selectedModule?.moduleName}
                <span className="breadcrumb-separator">›</span>
                {selectedArticle.articleName}
              </p>
            </header>
            <div className="content-body">
              <div 
                className="article-text"
                dangerouslySetInnerHTML={{ 
                  __html: '<p>' + formatContent(selectedArticle.content) + '</p>' 
                }}
              />
            </div>
          </>
        ) : selectedForm ? (
          <>
            <div className="form-content">
              <div className="form-header">
                <h2>{selectedForm.formName}</h2>
                {currentUser.organizationId && (
                  <div className="organization-controls">
                    <button 
                      onClick={() => {
                        setShowOrganizationView(!showOrganizationView);
                        setSelectedUserId(null);
                        if (!showOrganizationView) {
                          setFormAnswers({});
                          setFormResponse(null);
                        } else {
                          fetchFormResponse(selectedForm.id);
                        }
                      }}
                      className={showOrganizationView ? 'org-btn active' : 'org-btn'}
                    >
                      {showOrganizationView ? 'My Response' : 'Organization View'}
                    </button>
                  </div>
                )}
              </div>

              {showOrganizationView && organizationResponses && (
                <div className="organization-section">
                  <h3>Organization Members</h3>
                  <div className="user-selector">
                    {organizationResponses.organizationUsers.map(user => {
                      const userResponse = organizationResponses.responses.find(r => r.userId === user.id);
                      const isSelected = selectedUserId === user.id;
                      return (
                        <div 
                          key={user.id} 
                          className={`user-card ${isSelected ? 'selected' : ''} ${userResponse ? 'has-response' : ''}`}
                          onClick={() => {
                            setSelectedUserId(user.id);
                            fetchUserFormResponse(selectedForm.id, user.id);
                          }}
                        >
                          <div className="user-info">
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                          </div>
                          <div className="response-status">
                            {userResponse ? (
                              <span className="completed">✓ Completed</span>
                            ) : (
                              <span className="pending">○ Pending</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedUserId && (
                    <div className="editing-user">
                      <h4>Editing response for: {organizationResponses.organizationUsers.find(u => u.id === selectedUserId)?.name}</h4>
                    </div>
                  )}
                </div>
              )}

              <div className="form-questions">
                {selectedForm.questions.map((question, index) => (
                  <div key={question.id || index} className="form-question">
                    <label className="question-label">
                      {question.question}
                      {question.required && <span className="required">*</span>}
                    </label>

                    <div className="question-input">
                      {question.type === 'text' && (
                        <input
                          type="text"
                          value={(formAnswers[question.id] as string) || ''}
                          onChange={(e) => handleFormAnswerChange(question.id, e.target.value)}
                          className="form-input"
                          placeholder="Enter your answer..."
                          required={question.required}
                        />
                      )}

                      {question.type === 'textarea' && (
                        <textarea
                          value={(formAnswers[question.id] as string) || ''}
                          onChange={(e) => handleFormAnswerChange(question.id, e.target.value)}
                          className="form-textarea"
                          placeholder="Enter your answer..."
                          rows={4}
                          required={question.required}
                        />
                      )}

                      {(question.type === 'dropdown' || question.type === 'select') && question.options && (
                        <select
                          value={(formAnswers[question.id] as string) || ''}
                          onChange={(e) => handleFormAnswerChange(question.id, e.target.value)}
                          className="form-select"
                          required={question.required}
                        >
                          <option value="">Select an option...</option>
                          {question.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}

                      {question.type === 'checkbox' && question.options && (
                        <div className="checkbox-group">
                          {question.options.map(option => (
                            <label key={option} className="checkbox-option">
                              <input
                                type="checkbox"
                                checked={(formAnswers[question.id] as string[])?.includes(option) || false}
                                onChange={(e) => {
                                  const currentAnswers = formAnswers[question.id] as string[] || [];
                                  const newAnswers = e.target.checked
                                    ? [...currentAnswers, option]
                                    : currentAnswers.filter(ans => ans !== option);
                                  handleFormAnswerChange(question.id, newAnswers);
                                }}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {question.type === 'yesno' && (
                        <div className="radio-group">
                          <label className="radio-option">
                            <input
                              type="radio"
                              name={question.id}
                              value="yes"
                              checked={formAnswers[question.id] === 'yes'}
                              onChange={(e) => handleFormAnswerChange(question.id, e.target.value)}
                            />
                            Yes
                          </label>
                          <label className="radio-option">
                            <input
                              type="radio"
                              name={question.id}
                              value="no"
                              checked={formAnswers[question.id] === 'no'}
                              onChange={(e) => handleFormAnswerChange(question.id, e.target.value)}
                            />
                            No
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="question-meta">
                      <span className="question-type">Type: {question.type}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button 
                  onClick={saveFormResponse} 
                  className="complete-action-btn"
                  disabled={contentLoading}
                >
                  {contentLoading ? 'Saving...' : 'Complete This Action'}
                </button>
              </div>

              {formResponse && !showOrganizationView && (
                <div className="form-response-info">
                  <p className="form-status">
                    Last saved: {new Date(formResponse.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="content-placeholder">
            <div className="select-module-icon">📚</div>
            <h2>Welcome to Fair Chance Navigator</h2>
            <p>Select a module from the navigation to explore articles and forms.</p>
            <p>Each module contains comprehensive guides and interactive forms to help you build inclusive hiring strategies.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ContentViewer;