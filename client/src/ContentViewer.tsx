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
        }
      }
    } catch (error) {
      console.error('Error fetching form response:', error);
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
    setFormResponse(null);
    setFormAnswers({});
    fetchFormResponse(form.id);
  };

  const handleFormAnswerChange = (questionId: string, value: any) => {
    setFormAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const saveFormResponse = async () => {
    if (!selectedForm) return;

    try {
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
        alert('Form saved successfully!');
      } else {
        alert('Failed to save form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form');
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

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setFormAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSaveForm = async () => {
    if (!selectedForm) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/forms/${selectedForm.id}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answers: formAnswers
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFormResponse(data);
        alert('Form saved successfully!');
      } else {
        alert('Failed to save form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form');
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
            <header className="content-header">
              <h1>{selectedForm.formName}</h1>
              <p className="content-breadcrumb">
                {selectedModule?.moduleName}
                <span className="breadcrumb-separator">›</span>
                {selectedForm.formName}
              </p>
            </header>
            <div className="content-body">
              <div className="form-container">
                <div className="form-header">
                  <h2>{selectedForm.formName}</h2>
                  <p className="form-description">This action contains questions to help guide your planning and implementation.</p>
                </div>

                <div className="form-questions">
                  {selectedForm.questions.map((question, index) => (
                    <div key={question.id} className="form-question">
                      <div className="question-header">
                        <h3>Question {index + 1}</h3>
                        {question.required && <span className="required-badge">Required</span>}
                      </div>
                      <p className="question-text">{question.text}</p>

                      <div className="question-input">
                        {question.type === 'text' && (
                          <input
                            type="text"
                            value={(formAnswers[question.id] as string) || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="form-input"
                            placeholder="Enter your answer..."
                            required={question.required}
                          />
                        )}

                        {question.type === 'textarea' && (
                          <textarea
                            value={(formAnswers[question.id] as string) || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="form-textarea"
                            placeholder="Enter your answer..."
                            rows={4}
                            required={question.required}
                          />
                        )}

                        {question.type === 'select' && question.options && (
                          <select
                            value={(formAnswers[question.id] as string) || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
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
                                    handleAnswerChange(question.id, newAnswers);
                                  }}
                                />
                                <span>{option}</span>
                              </label>
                            ))}
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
                    onClick={handleSaveForm} 
                    className="complete-action-btn"
                    disabled={contentLoading}
                  >
                    {contentLoading ? 'Saving...' : 'Complete This Action'}
                  </button>
                </div>

                {formResponse && (
                  <div className="form-response-info">
                    <p className="form-status">
                      Last saved: {new Date(formResponse.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
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