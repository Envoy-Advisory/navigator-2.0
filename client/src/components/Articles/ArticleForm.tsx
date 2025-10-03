import React, { useState } from "react";
import { CMSArticle } from "../../interfaces/navigatorIntfs";


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
          const fileInfo = data.file;
          const fileUrl = fileInfo.url;
  
          if (file.type.startsWith('image/')) {
            insertAtCursor(`<img src="${fileUrl}" alt="${fileInfo.originalName}" style="max-width: 100%; height: auto;" />`);
          } else {
            insertAtCursor(`[${fileInfo.originalName}](${fileUrl})`);
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
                  placeholder="Start typing your article content... You can drop and drop images and files here!"
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

  export default ArticleForm;