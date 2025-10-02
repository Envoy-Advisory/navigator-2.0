import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Module, User } from "../../../interfaces/navigatorIntfs";


const ModuleDetail: React.FC<{
    modules: Module[];
    setModules: React.Dispatch<React.SetStateAction<Module[]>>;
    currentUser: User;
  }> = ({ modules, setModules, currentUser }) => {
    const location = useLocation();
    const moduleId = location.pathname.split('/').pop();
    const module = modules.find(m => m.id === moduleId);
  
    if (!module) return <div>Module not found</div>;
  
    return (
      <div className="module-detail">
        <Link to="/modules" className="back-btn">← Back to Modules</Link>
  
        <div className="module-header">
          <span className="module-icon-large">{module.icon}</span>
          <h2>{module.title}</h2>
          <p>{module.description}</p>
        </div>
  
        <div className="module-content">
          <div className="content-section">
            <h3>Worksheets & Activities</h3>
            {module.worksheets.length > 0 ? (
              <div className="worksheets-list">
                {module.worksheets.map(worksheet => (
                  <div key={worksheet.id} className="worksheet-item">
                    <h4>{worksheet.title}</h4>
                    <p>{worksheet.questions.length} questions</p>
                    <Link to={`/worksheet/${worksheet.id}`} className="worksheet-btn">
                      {worksheet.responses[currentUser.id] ? 'Edit Response' : 'Complete Worksheet'}
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p>No worksheets available for this module yet.</p>
            )}
          </div>
  
          <div className="content-section">
            <h3>Resources</h3>
            <div className="resources-list">
              <div className="resource-item">
                <span>📄</span>
                <div>
                  <h4>Implementation Guide</h4>
                  <p>Step-by-step instructions for {module.title.toLowerCase()}</p>
                  <button className="download-btn">Download PDF</button>
                </div>
              </div>
              <div className="resource-item">
                <span>🎥</span>
                <div>
                  <h4>Training Video</h4>
                  <p>Expert-led session on best practices</p>
                  <button className="play-btn">Watch Video</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  export default ModuleDetail;