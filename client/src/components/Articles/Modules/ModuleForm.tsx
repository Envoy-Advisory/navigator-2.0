import React, { useState } from "react";
import { CMSModule } from "../../../interfaces/navigatorIntfs";

const ModuleForm: React.FC<{
    module?: CMSModule | null;
    onSave: (data: { moduleNumber: number; moduleName: string }) => void;
    onCancel: () => void;
  }> = ({ module, onSave, onCancel }) => {
    const [moduleNumber, setModuleNumber] = useState(module?.moduleNumber || 1);
    const [moduleName, setModuleName] = useState(module?.moduleName || '');
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({ moduleNumber, moduleName });
    };
  
    return (
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h3>{module ? 'Edit Module' : 'Create Module'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Module Number:</label>
              <input
                type="number"
                value={moduleNumber}
                onChange={(e) => setModuleNumber(parseInt(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label>Module Name:</label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="save-btn">Save</button>
              <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  export default ModuleForm;