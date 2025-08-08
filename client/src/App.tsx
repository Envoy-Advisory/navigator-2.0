
import React, { useState, useEffect } from 'react';
import './App.css';

interface Module {
  id: number;
  moduleNumber: number;
  moduleName: string;
  articles: Article[];
}

interface Article {
  id: number;
  moduleId: number;
  articleName: string;
  content: string;
}

interface ModuleFormData {
  moduleNumber: number;
  moduleName: string;
}

interface ArticleFormData {
  articleName: string;
  content: string;
}

function App() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await fetch(`${API_BASE}/modules`);
      if (response.ok) {
        const data = await response.json();
        setModules(data);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleSubmit = async (formData: ModuleFormData) => {
    try {
      const url = editingModule 
        ? `${API_BASE}/modules/${editingModule.id}`
        : `${API_BASE}/modules`;
      
      const method = editingModule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchModules();
        setShowModuleForm(false);
        setEditingModule(null);
      }
    } catch (error) {
      console.error('Error saving module:', error);
    }
  };

  const handleArticleSubmit = async (formData: ArticleFormData) => {
    if (!selectedModuleId && !editingArticle) return;

    try {
      const url = editingArticle 
        ? `${API_BASE}/articles/${editingArticle.id}`
        : `${API_BASE}/articles`;
      
      const method = editingArticle ? 'PUT' : 'POST';
      
      const body = editingArticle 
        ? formData
        : { ...formData, moduleId: selectedModuleId };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchModules();
        setShowArticleForm(false);
        setEditingArticle(null);
      }
    } catch (error) {
      console.error('Error saving article:', error);
    }
  };

  const deleteModule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this module? All articles will be deleted.')) return;
    
    try {
      const response = await fetch(`${API_BASE}/modules/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchModules();
        if (selectedModuleId === id) {
          setSelectedModuleId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting module:', error);
    }
  };

  const deleteArticle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/articles/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchModules();
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const selectedModule = modules.find(m => m.id === selectedModuleId);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Content Management Admin</h1>
      </header>

      <div className="admin-content">
        <div className="modules-section">
          <div className="section-header">
            <h2>Modules</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowModuleForm(true)}
            >
              Add Module
            </button>
          </div>

          <div className="modules-list">
            {modules.map(module => (
              <div 
                key={module.id} 
                className={`module-item ${selectedModuleId === module.id ? 'selected' : ''}`}
                onClick={() => setSelectedModuleId(module.id)}
              >
                <div className="module-info">
                  <h3>Module {module.moduleNumber}: {module.moduleName}</h3>
                  <p>{module.articles.length} articles</p>
                </div>
                <div className="module-actions">
                  <button 
                    className="btn btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingModule(module);
                      setShowModuleForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-small btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteModule(module.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedModule && (
          <div className="articles-section">
            <div className="section-header">
              <h2>Articles for Module {selectedModule.moduleNumber}</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowArticleForm(true)}
              >
                Add Article
              </button>
            </div>

            <div className="articles-list">
              {selectedModule.articles.map(article => (
                <div key={article.id} className="article-item">
                  <div className="article-info">
                    <h4>{article.articleName}</h4>
                    <p className="article-preview">
                      {article.content.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="article-actions">
                    <button 
                      className="btn btn-small"
                      onClick={() => {
                        setEditingArticle(article);
                        setShowArticleForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-small btn-danger"
                      onClick={() => deleteArticle(article.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModuleForm && (
        <ModuleForm
          module={editingModule}
          onSubmit={handleModuleSubmit}
          onCancel={() => {
            setShowModuleForm(false);
            setEditingModule(null);
          }}
        />
      )}

      {showArticleForm && (
        <ArticleForm
          article={editingArticle}
          onSubmit={handleArticleSubmit}
          onCancel={() => {
            setShowArticleForm(false);
            setEditingArticle(null);
          }}
        />
      )}
    </div>
  );
}

interface ModuleFormProps {
  module: Module | null;
  onSubmit: (data: ModuleFormData) => void;
  onCancel: () => void;
}

function ModuleForm({ module, onSubmit, onCancel }: ModuleFormProps) {
  const [formData, setFormData] = useState<ModuleFormData>({
    moduleNumber: module?.moduleNumber || 1,
    moduleName: module?.moduleName || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{module ? 'Edit Module' : 'Add Module'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Module Number:</label>
            <input
              type="number"
              value={formData.moduleNumber}
              onChange={(e) => setFormData({ ...formData, moduleNumber: parseInt(e.target.value) })}
              required
              min="1"
            />
          </div>
          <div className="form-group">
            <label>Module Name:</label>
            <input
              type="text"
              value={formData.moduleName}
              onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {module ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ArticleFormProps {
  article: Article | null;
  onSubmit: (data: ArticleFormData) => void;
  onCancel: () => void;
}

function ArticleForm({ article, onSubmit, onCancel }: ArticleFormProps) {
  const [formData, setFormData] = useState<ArticleFormData>({
    articleName: article?.articleName || '',
    content: article?.content || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{article ? 'Edit Article' : 'Add Article'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Article Name:</label>
            <input
              type="text"
              value={formData.articleName}
              onChange={(e) => setFormData({ ...formData, articleName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Content:</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={10}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {article ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
