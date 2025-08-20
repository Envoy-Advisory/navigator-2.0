
import React, { useState, useEffect } from 'react';
import './ArticleViewer.css';

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

const ArticleViewer: React.FC = () => {
  const [modules, setModules] = useState<CMSModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<CMSModule | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<CMSArticle | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      // For now, we'll use the same endpoint but without authentication
      // In a real implementation, you'd create a public endpoint
      const response = await fetch('/api/modules/public');
      
      if (response.ok) {
        const data = await response.json();
        setModules(data);
      } else {
        // Fallback to the authenticated endpoint for now
        console.log('Public endpoint not available, using authenticated endpoint');
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
      // For now, we'll use the same endpoint but without authentication
      // In a real implementation, you'd create a public endpoint
      const response = await fetch(`/api/modules/${moduleId}/articles/public`);
      
      if (response.ok) {
        const articles = await response.json();
        setModules(prev => prev.map(module => 
          module.id === moduleId 
            ? { ...module, articles }
            : module
        ));
      } else {
        console.log('Public articles endpoint not available');
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setArticlesLoading(false);
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
    }
    
    setExpandedModules(newExpanded);
    setSelectedModule(module);
  };

  const selectArticle = (article: CMSArticle) => {
    setSelectedArticle(article);
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
                  Module {module.moduleNumber}: {module.moduleName}
                </span>
                <span className="module-number">{module.moduleNumber}</span>
              </button>
              
              {expandedModules.has(module.id) && (
                <div className="articles-submenu">
                  {articlesLoading && selectedModule?.id === module.id ? (
                    <div className="loading-articles">
                      <div className="loading-spinner"></div>
                      Loading articles...
                    </div>
                  ) : module.articles && module.articles.length > 0 ? (
                    module.articles.map(article => (
                      <button
                        key={article.id}
                        className={`article-nav-item ${selectedArticle?.id === article.id ? 'active' : ''}`}
                        onClick={() => selectArticle(article)}
                      >
                        {article.articleName}
                      </button>
                    ))
                  ) : (
                    <div className="no-articles-message">
                      No articles available
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <main className="article-content">
        {selectedArticle ? (
          <>
            <header className="article-content-header">
              <h1>{selectedArticle.articleName}</h1>
              <p className="article-breadcrumb">
                Module {selectedModule?.moduleNumber}: {selectedModule?.moduleName}
                <span className="breadcrumb-separator">›</span>
                {selectedArticle.articleName}
              </p>
            </header>
            <div className="article-content-body">
              <div 
                className="article-text"
                dangerouslySetInnerHTML={{ 
                  __html: '<p>' + formatContent(selectedArticle.content) + '</p>' 
                }}
              />
            </div>
          </>
        ) : (
          <div className="article-placeholder">
            <div className="select-module-icon">📚</div>
            <h2>Welcome to Fair Chance Navigator</h2>
            <p>Select a module from the navigation to explore articles and learning materials.</p>
            <p>Each module contains comprehensive guides to help you build inclusive hiring strategies.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArticleViewer;
