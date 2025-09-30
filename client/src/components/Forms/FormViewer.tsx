import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { User, Module } from '../../interfaces/navigatorIntfs';

const FormViewer: React.FC<{ currentUser: User; modules: Module[]; forms: any[] }> = ({ currentUser, modules, forms }) => {
    const location = useLocation();
    const moduleId = location.pathname.split('/').pop();
    const module = modules.find(m => m.id === moduleId);
    const form = forms.find(f => f.moduleId === moduleId);
  
    const [formResponses, setFormResponses] = useState<{ [questionId: string]: string | string[] }>({});
    const [submitted, setSubmitted] = useState(false);
  
    if (!module || !form) return <div>Form or Module not found</div>;
  
    const handleAnswerChange = (questionId: string, answer: string | string[]) => {
      setFormResponses({ ...formResponses, [questionId]: answer });
    };
  
    const handleSubmitForm = async () => {
      try {
        const response = await fetch('/api/forms/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            formId: form.id,
            userId: currentUser.id,
            answers: formResponses,
          }),
        });
  
        if (response.ok) {
          setSubmitted(true);
          alert('Form submitted successfully!');
        } else {
          alert('Failed to submit form. Please try again.');
        }
      } catch (error) {
        console.error('Form submission error:', error);
        alert('An error occurred. Please try again.');
      }
    };
  
    return (
      <div className="form-viewer">
        <div className="form-header">
          <Link to={`/module/${moduleId}`} className="back-btn">← Back to Module</Link>
          <h2>{form.title}</h2>
        </div>
  
        <div className="form-content">
          {form.questions.map((question, index) => (
            <div key={question.id} className="form-question">
              <label className="question-label">
                {question.text}
                {question.required && <span className="required">*</span>}
              </label>
  
              {question.type === 'text' && (
                <input
                  type="text"
                  value={formResponses[question.id] as string || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="form-input"
                  required={question.required}
                />
              )}
  
              {question.type === 'textarea' && (
                <textarea
                  value={formResponses[question.id] as string || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="form-textarea"
                  rows={4}
                  required={question.required}
                />
              )}
  
              {(question.type === 'select') && question.options && (
                <select
                  value={formResponses[question.id] as string || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  required={question.required}
                  className="form-select"
                >
                  {question.required && <option value="">Select an option</option>}
                  {question.options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}
  
              {question.type === 'checkbox' && question.options && (
                <div className="form-checkbox-group">
                  {question.options.map(option => (
                    <label key={option} className="form-option-label">
                      <input
                        type="checkbox"
                        checked={(formResponses[question.id] as string[])?.includes(option) || false}
                        onChange={(e) => {
                          const currentAnswers = formResponses[question.id] as string[] || [];
                          const newAnswers = e.target.checked
                            ? [...currentAnswers, option]
                            : currentAnswers.filter(ans => ans !== option);
                          handleAnswerChange(question.id, newAnswers);
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
  
        <div className="form-actions">
          <button onClick={handleSubmitForm} className="submit-btn" disabled={submitted}>
            {submitted ? 'Submitted' : 'Submit Form'}
          </button>
        </div>
      </div>
    );
  };

export default FormViewer;