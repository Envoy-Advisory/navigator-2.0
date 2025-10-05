import React, { useState } from "react";
import { FormQuestion } from "../../interfaces/navigatorIntfs";


const FormBuilder: React.FC<{
    form?: Record<string, any> | null;
    moduleId: number;
    onSave: (data: { title: string; questions: FormQuestion[] }) => void;
    onCancel: () => void;
  }> = ({ form, moduleId, onSave, onCancel }) => {
    const [title, setTitle] = useState(form?.title || form?.formName || '');
    const [questions, setQuestions] = useState<FormQuestion[]>(form?.questions || [
      { id: 'q1', text: '', type: 'text', required: true }
    ]);
  
    const addQuestion = () => {
      setQuestions([...questions, { id: `q${questions.length + 1}`, text: '', type: 'text', required: true }]);
    };
  
    const updateQuestion = (id: string, field: keyof FormQuestion, value: any) => {
      setQuestions(questions.map(q => (q.id === id ? { ...q, [field]: value } : q)));
    };
  
    const removeQuestion = (id: string) => {
      setQuestions(questions.filter(q => q.id !== id));
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({ title, questions });
    };
  
    return (
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-content extra-large" onClick={(e) => e.stopPropagation()}>
          <h3>{form ? 'Edit Form' : 'Create Form'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Form Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
  
            <div className="form-group">
              <label>Questions:</label>
              {questions.map((question, index) => (
                <div key={question.id} className="question-editor">
                  <div className="question-header">
                    <h4>Question {index + 1}</h4>
                    <button type="button" onClick={() => removeQuestion(question.id)} className="remove-btn">-</button>
                  </div>
                  <input
                    type="text"
                    placeholder="Question Text"
                    value={question.text}
                    onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                    required
                  />
                  <div className="question-options-editor">
                    <label>Question Type:</label>
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(question.id, 'type', e.target.value as any)}
                    >
                      <option value="text">Open Text</option>
                      <option value="textarea">Long Text</option>
                      <option value="select">Dropdown (Select)</option>
                      <option value="checkbox">Checkbox (Multiple Choice)</option>
                    </select>
  
                    {(question.type === 'select' || question.type === 'checkbox') && (
                      <>
                        <label>Options (one per line):</label>
                        <textarea
                          value={question.options?.join('\n') || ''}
                          onChange={(e) => updateQuestion(question.id, 'options', e.target.value.split('\n'))}
                          rows={3}
                          placeholder="Option 1&#10;Option 2"
                        />
                      </>
                    )}
  
                    <label>
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                      />
                      Required
                    </label>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addQuestion} className="add-question-btn">+ Add Question</button>
            </div>
  
            <div className="form-actions">
              <button type="submit" className="save-btn">Save Form</button>
              <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  export default FormBuilder;