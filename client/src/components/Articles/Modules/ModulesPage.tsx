import React from "react";
import { Link } from "react-router-dom";
import { Module, User } from "../../../interfaces/navigatorIntfs";


const ModulesPage: React.FC<{
    modules: Module[];
    setModules: React.Dispatch<React.SetStateAction<Module[]>>;
    currentUser: User;
  }> = ({ modules, setModules, currentUser }) => {
    const toggleModuleCompletion = (moduleId: string) => {
      setModules(prev => prev.map(module =>
        module.id === moduleId
          ? { ...module, completed: !module.completed }
          : module
      ));
    };
  
    return (
      <div className="modules-page">
        <h2>Learning Modules</h2>
        <p>Complete these modules to build comprehensive inclusive hiring strategies.</p>
  
        <div className="modules-container">
          {modules.map((module) => (
            <div key={module.id} className={`module-card ${module.completed ? 'completed' : ''}`}>
              <div className="module-icon">{module.icon}</div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
  
              <div className="module-worksheets">
                {module.worksheets.length > 0 && (
                  <p>{module.worksheets.length} worksheet(s) available</p>
                )}
              </div>
  
              <div className="module-actions">
                <Link to={`/module/${module.id}`} className="start-btn">
                  {module.completed ? 'Review' : 'Start'}
                </Link>
                <button
                  className="complete-btn"
                  onClick={() => toggleModuleCompletion(module.id)}
                >
                  {module.completed ? '✓ Completed' : 'Mark Complete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  export default ModulesPage;