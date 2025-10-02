import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Module, User } from "../../interfaces/navigatorIntfs";

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

  export default WorksheetEditor;