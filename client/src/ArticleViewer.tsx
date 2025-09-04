import React, { useState, useEffect } from 'react';
import './ArticleViewer.css';

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
  forms?: CMSForm[]; // Added forms to CMSModule
}

interface CMSArticle {
  id: number;
  moduleId: number;
  articleName: string;
  content: string;
  position?: number;
}

// Define CMSForm interface
interface CMSForm {
  id: number;
  moduleId: number;
  formName: string;
  description?: string;
  questions?: FormQuestion[];
}

interface FormQuestion {
  id: number;
  formId: number;
  text: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
  options?: string[];
  required: boolean;
}

interface FormResponse {
  id: number;
  formId: number;
  userId: number;
  answers: { [questionId: string]: string | string[] };
  created_at: string;
  updated_at: string;
}

interface ArticleViewerProps {
  currentUser: User;
}

const ArticleViewer: React.FC<ArticleViewerProps> = ({ currentUser }) => {
  const [modules, setModules] = useState<CMSModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<CMSModule | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<CMSArticle | null>(null);
  const [selectedForm, setSelectedForm] = useState<CMSForm | null>(null); // Added selectedForm state
  const [formAnswers, setFormAnswers] = useState<{ [questionId: string]: string | string[] }>({});
  const [formResponse, setFormResponse] = useState<FormResponse | null>(null);
  const [savingResponse, setSavingResponse] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [formsLoading, setFormsLoading] = useState(false); // Added formsLoading state

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
    setArticlesLoading(true);
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
      setArticlesLoading(false);
    }
  };

  // Function to fetch forms for a module
  const fetchForms = async (moduleId: number) => {
    setFormsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/modules/${moduleId}/forms/authenticated`, { // Assuming this endpoint exists
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
      setFormsLoading(false);
    }
  };

  const toggleModule = (module: CMSModule) => {
    const isExpanded = expandedModules.has(module.id);
    const newExpanded = new Set(expandedModules);

    if (isExpanded) {
      newExpanded.delete(module.id);
    } else {
      newExpanded.add(module.id);
      // Fetch articles if not already loaded
      if (!module.articles) {
        fetchArticles(module.id);
      }
      // Fetch forms if not already loaded
      if (!module.forms) {
        fetchForms(module.id);
      }
    }

    setExpandedModules(newExpanded);
    setSelectedModule(module);
    // Clear selected article and form when module is toggled
    setSelectedArticle(null);
    setSelectedForm(null);
  };

  const selectArticle = (article: CMSArticle) => {
    setSelectedArticle(article);
    setSelectedForm(null); // Clear selected form when an article is selected
  };

  // Function to fetch existing form response
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
      } else {
        setFormResponse(null);
        setFormAnswers({});
      }
    } catch (error) {
      console.error('Error fetching form response:', error);
      setFormResponse(null);
      setFormAnswers({});
    }
  };

  // Function to handle selecting a form
  const selectForm = (form: CMSForm) => {
    setSelectedForm(form);
    setSelectedArticle(null); // Clear selected article when a form is selected
    fetchFormResponse(form.id); // Fetch existing responses when selecting a form
  };

  // Function to handle form input changes
  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setFormAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Function to save form response
  const saveFormResponse = async () => {
    if (!selectedForm) return;

    setSavingResponse(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/forms/${selectedForm.id}/response`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: formAnswers
        })
      });

      if (response.ok) {
        const savedResponse = await response.json();
        setFormResponse(savedResponse);
        alert('Your responses have been saved successfully!');
      } else {
        throw new Error('Failed to save response');
      }
    } catch (error) {
      console.error('Error saving form response:', error);
      alert('Failed to save responses. Please try again.');
    } finally {
      setSavingResponse(false);
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
    // Only convert relative URLs to API endpoints, leave data URLs unchanged
    formatted = formatted.replace(/src="\/uploads\//g, (match, offset, string) => {
      // Check if this is part of a data URL
      const beforeMatch = string.substring(Math.max(0, offset - 50), offset);
      if (beforeMatch.includes('data:')) return match;
      return 'src="/api/uploads/';
    });
    formatted = formatted.replace(/src="uploads\//g, (match, offset, string) => {
      // Check if this is part of a data URL
      const beforeMatch = string.substring(Math.max(0, offset - 50), offset);
      if (beforeMatch.includes('data:')) return match;
      return 'src="/api/uploads/';
    });

    return formatted;
  };

  if (loading) {
    return (
      <div className="article-viewer">
        <div className="loading-articles">
          <div className="loading-spinner"></div>
          Loading modules...
        </div>
      </div>
    );
  }

  return (
    <div className="article-viewer">
      <nav className="article-nav">
        <div className="article-nav-header">
          <h2>Learning Modules</h2>
          <p>Browse articles by module</p>
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
                  {/* Articles Section */}
                  <div className="content-type-header">Articles</div>
                  {articlesLoading && selectedModule?.id === module.id ? (
                    <div className="loading-content">
                      <div className="loading-spinner"></div>
                      Loading articles...
                    </div>
                  ) : module.articles && module.articles.length > 0 ? (
                    module.articles.map(article => (
                      <button
                        key={`article-${article.id}`}
                        className={`content-nav-item ${selectedArticle?.id === article.id ? 'active' : ''}`}
                        onClick={() => selectArticle(article)}
                      >
                        📄 {article.articleName}
                      </button>
                    ))
                  ) : (
                    <div className="no-content-message">
                      No articles available
                    </div>
                  )}

                  {/* Actions Section */}
                  <div className="content-type-header">Actions</div>
                  {formsLoading && selectedModule?.id === module.id ? (
                    <div className="loading-content">
                      <div className="loading-spinner"></div>
                      Loading actions...
                    </div>
                  ) : module.forms && module.forms.length > 0 ? (
                    module.forms.map(form => (
                      <button
                        key={`form-${form.id}`}
                        className={`content-nav-item ${selectedForm?.id === form.id ? 'active' : ''}`}
                        onClick={() => selectForm(form)}
                      >
                        📋 {form.formName}
                      </button>
                    ))
                  ) : (
                    <div className="no-content-message">
                      No actions available
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <main className="article-main">
        {selectedArticle ? (
          <>
            <div className="article-header">
              <div className="breadcrumb">
                <span>{selectedModule?.moduleName}</span>
                <span> → </span>
                <span>Articles</span>
                <span> → </span>
                <span>{selectedArticle.articleName}</span>
              </div>
              <h1>{selectedArticle.articleName}</h1>
            </div>

            <div className="article-body">
              <div 
                className="article-content"
                dangerouslySetInnerHTML={{
                  __html: '<p>' + formatContent(selectedArticle.content) + '</p>'
                }}
              />
            </div>
          </>
        ) : selectedForm ? (
          <>
            <div className="article-header">
              <div className="breadcrumb">
                <span>{selectedModule?.moduleName}</span>
                <span> → </span>
                <span>Actions</span>
                <span> → </span>
                <span>{selectedForm.formName}</span>
              </div>
              <h1>{selectedForm.formName}</h1>
            </div>

            <div className="article-body">
              <div className="form-preview">
                <p className="form-description">{selectedForm.description || 'This action contains questions to help guide your planning and implementation.'}</p>

                <div className="form-questions-preview">
                  {selectedForm.questions?.map((question, index) => (
                    <div key={question.id || index} className="question-preview">
                      <div className="question-header">
                        <h4>Question {index + 1}</h4>
                        {question.required && <span className="required-indicator">Required</span>}
                      </div>
                      <p className="question-text">{question.text}</p>
                      
                      <div className="question-input">
                        {question.type === 'text' && (
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Enter your answer..."
                            value={(formAnswers[question.id?.toString() || index.toString()] as string) || ''}
                            onChange={(e) => handleAnswerChange(question.id?.toString() || index.toString(), e.target.value)}
                          />
                        )}

                        {question.type === 'textarea' && (
                          <textarea
                            className="form-textarea"
                            placeholder="Enter your answer..."
                            rows={4}
                            value={(formAnswers[question.id?.toString() || index.toString()] as string) || ''}
                            onChange={(e) => handleAnswerChange(question.id?.toString() || index.toString(), e.target.value)}
                          />
                        )}

                        {(question.type === 'select' || question.type === 'dropdown') && question.options && (
                          <select 
                            className="form-select"
                            value={(formAnswers[question.id?.toString() || index.toString()] as string) || ''}
                            onChange={(e) => handleAnswerChange(question.id?.toString() || index.toString(), e.target.value)}
                          >
                            <option value="">Select an option...</option>
                            {question.options.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        )}

                        {question.type === 'checkbox' && question.options && (
                          <div className="checkbox-group">
                            {question.options.map(option => {
                              const currentAnswers = (formAnswers[question.id?.toString() || index.toString()] as string[]) || [];
                              return (
                                <label key={option} className="checkbox-option">
                                  <input
                                    type="checkbox"
                                    checked={currentAnswers.includes(option)}
                                    onChange={(e) => {
                                      const questionKey = question.id?.toString() || index.toString();
                                      const current = (formAnswers[questionKey] as string[]) || [];
                                      let newAnswers;
                                      if (e.target.checked) {
                                        newAnswers = [...current, option];
                                      } else {
                                        newAnswers = current.filter(item => item !== option);
                                      }
                                      handleAnswerChange(questionKey, newAnswers);
                                    }}
                                  />
                                  <span>{option}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {question.type === 'radio' && question.options && (
                          <div className="radio-group">
                            {question.options.map(option => (
                              <label key={option} className="radio-option">
                                <input
                                  type="radio"
                                  name={`question-${question.id || index}`}
                                  value={option}
                                  checked={(formAnswers[question.id?.toString() || index.toString()] as string) === option}
                                  onChange={(e) => handleAnswerChange(question.id?.toString() || index.toString(), e.target.value)}
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      
                    </div>
                  ))}
                </div>

                <div className="form-actions">
                  <button 
                    className="start-form-btn"
                    onClick={saveFormResponse}
                    disabled={savingResponse}
                  >
                    {savingResponse ? 'Saving...' : 'Complete This Action'}
                  </button>
                </div>

                {formResponse && (
                  <div className="form-response-info">
                    <p className="form-status">
                      Last saved: {new Date(formResponse.updated_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="welcome-content">
            <div className="welcome-icon">
              📚
            </div>
            <h1>Welcome to Fair Chance Navigator</h1>
            <p>Select a module from the navigation to explore articles and learning materials.</p>
            <p>Each module contains comprehensive guides to help you build inclusive hiring strategies.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArticleViewer;