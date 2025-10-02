import React, { useState, useEffect } from "react";
import { Module, CMSModule, CMSArticle, FormQuestion } from "../../interfaces/navigatorIntfs";
import ArticleForm from "../Articles/ArticleForm";
import ModuleForm from "../Articles/Modules/ModuleForm";
import FormBuilder from "../Forms/FormBuilder";


const AdminPanel: React.FC<{
    modules: Module[];
    setModules: React.Dispatch<React.SetStateAction<Module[]>>;
  }> = ({ modules, setModules }) => {
    const [cmsModules, setCmsModules] = useState<CMSModule[]>([]);
    const [selectedModule, setSelectedModule] = useState<CMSModule | null>(null);
    const [articles, setArticles] = useState<CMSArticle[]>([]);
    const [forms, setForms] = useState<Record<string, any>>([]); // State for forms
    const [editingModule, setEditingModule] = useState<CMSModule | null>(null);
    const [editingArticle, setEditingArticle] = useState<CMSArticle | null>(null);
    const [editingForm, setEditingForm] = useState<Record<string, any> | null>(null); // State for editing a form
    const [showModuleForm, setShowModuleForm] = useState(false);
    const [showArticleForm, setShowArticleForm] = useState(false);
    const [showFormBuilder, setShowFormBuilder] = useState(false); // State for showing the form form
    const [articlesLoading, setArticlesLoading] = useState(false);
    const [formsLoading, setFormsLoading] = useState(false); // State for forms loading
    const [activeTab, setActiveTab] = useState<'articles' | 'actions'>('articles'); // Add activeTab state
  
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
      setArticlesLoading(true);
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
        } else {
          console.error('Failed to fetch articles');
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setArticlesLoading(false);
      }
    };
  
    // convert it to a hook call
    const fetchForms = async (moduleId: number) => {
      setFormsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/modules/${moduleId}/forms`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          setForms(data);
        } else {
          console.error('Failed to fetch forms');
        }
      } catch (error) {
        console.error('Error fetching forms:', error);
      } finally {
        setFormsLoading(false);
      }
    };
  
    // convert it to a hook call
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
  
    // convert it to a hook call
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
  
    // convert it to a hook call
    const handleDeleteModule = async (id: number) => {
      if (!confirm('Are you sure you want to delete this module? This will also delete all associated articles and forms.')) {
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
            setForms([]);
          }
          alert('Module deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting module:', error);
      }
    };
  
    // convert it to a hook call
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
  // convert it to a hook call
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
  
    // convert it to a hook call
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
  
    // Handlers for Forms
    const handleCreateForm = async (formDataToSave: { title: string; questions: FormQuestion[] }) => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/forms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            moduleId: selectedModule?.id,
            formName: formDataToSave.title,
            questions: formDataToSave.questions
          }),
        });
  
        if (response.ok) {
          if (selectedModule) {
            fetchForms(selectedModule.id);
          }
          setShowFormBuilder(false);
          alert('Form created successfully!');
        }
      } catch (error) {
        console.error('Error creating form:', error);
      }
    };
  
    const handleUpdateForm = async (id: string, formDataToSave: { title: string; questions: FormQuestion[] }) => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/forms/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            formName: formDataToSave.title,
            questions: formDataToSave.questions
          }),
        });
  
        if (response.ok) {
          if (selectedModule) {
            fetchForms(selectedModule.id);
          }
          setEditingForm(null);
          alert('Form updated successfully!');
        }
      } catch (error) {
        console.error('Error updating form:', error);
      }
    };
  
    const handleDeleteForm = async (id: string) => {
      if (!confirm('Are you sure you want to delete this form?')) {
        return;
      }
  
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/forms/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
  
        if (response.ok) {
          if (selectedModule) {
            fetchForms(selectedModule.id);
          }
          alert('Form deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting form:', error);
      }
    };
  
  
    const handleReorderArticles = async (reorderedArticles: CMSArticle[]) => {
      try {
        console.log('handleReorderArticles called with:', reorderedArticles);
  
        if (!reorderedArticles || reorderedArticles.length === 0) {
          console.error('No articles to reorder');
          return;
        }
  
        const validArticles = reorderedArticles.map(article => {
          console.log('Processing article:', article);
          if (!article || typeof article !== 'object') {
            console.warn('Skipping non-object:', article);
            return null;
          }
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
          setArticles(validArticles);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
          console.error('Failed to reorder articles:', errorData);
          alert(`Failed to reorder articles: ${errorData.error || 'Unknown error'}`);
          if (selectedModule) {
            fetchArticles(selectedModule.id);
          }
        }
      } catch (error) {
        console.error('Error reordering articles:', error);
        alert('Network error while reordering articles. Please try again.');
        if (selectedModule) {
          fetchArticles(selectedModule.id);
        }
      }
    };
  
    const selectModule = (module: CMSModule) => {
      setSelectedModule(module);
      fetchArticles(module.id);
      fetchForms(module.id); // Fetch forms when a module is selected
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
              <h3>{selectedModule ? `Content in ${selectedModule.moduleName}` : 'Select a module'}</h3>
              {selectedModule && (
                <>
                  <button onClick={() => setShowArticleForm(true)} className="add-btn">+ Add Article</button>
                  <button onClick={() => setShowFormBuilder(true)} className="add-btn">+ Add Action</button>
                </>
              )}
            </div>
  
            {selectedModule && (
              <>
                <div className="content-tabs">
                  <button 
                    className={`tab-button ${activeTab === 'articles' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('articles')}
                  >
                    Articles
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'actions' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('actions')}
                  >
                    Actions
                  </button>
                </div>
  
                {activeTab === 'articles' ? (
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
  
                            if (!draggedArticle || (!draggedArticle.id && draggedArticle.id !== 0)) {
                              console.error('Invalid article being dragged:', draggedArticle);
                              alert('Invalid article data. Please refresh the page and try again.');
                              return;
                            }
  
                            const articleId = typeof draggedArticle.id === 'string' ? parseInt(draggedArticle.id, 10) : draggedArticle.id;
                            if (isNaN(articleId) || articleId <= 0) {
                              console.error('Invalid article ID:', draggedArticle.id);
                              alert('Invalid article ID. Please refresh the page and try again.');
                              return;
                            }
  
                            const reorderedArticle = {
                              id: articleId,
                              moduleId: draggedArticle.moduleId,
                              articleName: draggedArticle.articleName,
                              content: draggedArticle.content
                            };
  
                            newArticles.splice(draggedIndex, 1);
                            newArticles.splice(targetIndex, 0, reorderedArticle);
  
                            console.log('New articles after reorder:', newArticles);
                            setArticles(newArticles);
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
                    {articles.length === 0 && (
                      <div className="no-content-message">
                        No articles in this module
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="forms-list">
                    {formsLoading ? (
                      <div className="loading-forms">
                        <div className="loading-spinner"></div>
                        Loading actions...
                      </div>
                    ) : forms.length > 0 ? (
                      forms.map((form:any, index:number) => (
                        <div key={form.id} className="form-item">
                          <div className="drag-handle">⋮⋮</div>
                          <div className="form-info">
                            <h4>{form.formName}</h4>
                            <p>{form.questions ? form.questions.length : 0} questions</p>
                          </div>
                          <div className="form-actions">
                            <button onClick={() => setEditingForm(form)} className="edit-btn">Edit</button>
                            <button onClick={() => handleDeleteForm(form.id)} className="delete-btn">Delete</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-content-message">
                        No actions in this module
                      </div>
                    )}
                  </div>
                )}
              </>
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
  
        {/* Form Form Modal */}
        {(showFormBuilder || editingForm) && selectedModule && (
          <FormBuilder
            form={editingForm}
            moduleId={selectedModule.id}
            onSave={editingForm ?
              (data) => handleUpdateForm(editingForm.id, data) :
              handleCreateForm
            }
            onCancel={() => {
              setShowFormBuilder(false);
              setEditingForm(null);
            }}
          />
        )}
      </div>
    );
  };

  export default AdminPanel;