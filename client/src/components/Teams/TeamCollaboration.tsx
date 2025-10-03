import React, { useState } from "react";
import { User } from "../../interfaces/navigatorIntfs";


const TeamCollaboration: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [teamMembers] = useState([
      { id: '1', name: 'John Doe', role: 'HR Manager', progress: 75 },
      { id: '2', name: 'Jane Smith', role: 'Recruiter', progress: 60 },
      { id: '3', name: 'Mike Johnson', role: 'Team Lead', progress: 90 }
    ]);
  
    return (
      <div className="team-collaboration">
        <h2>Team Collaboration</h2>
        <p>Collaborate with your team members and track collective progress</p>
  
        <div className="team-stats">
          <div className="stat-card">
            <h3>Team Members</h3>
            <span className="stat-number">{teamMembers.length}</span>
          </div>
          <div className="stat-card">
            <h3>Average Progress</h3>
            <span className="stat-number">
              {Math.round(teamMembers.reduce((sum, member) => sum + member.progress, 0) / teamMembers.length)}%
            </span>
          </div>
          <div className="stat-card">
            <h3>Shared Worksheets</h3>
            <span className="stat-number">5</span>
          </div>
        </div>
  
        <div className="team-members">
          <h3>Team Members</h3>
          {teamMembers.map(member => (
            <div key={member.id} className="member-card">
              <div className="member-info">
                <h4>{member.name}</h4>
                <p>{member.role}</p>
              </div>
              <div className="member-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${member.progress}%` }}></div>
                </div>
                <span>{member.progress}%</span>
              </div>
            </div>
          ))}
        </div>
  
        <div className="shared-content">
          <h3>Shared Worksheets</h3>
          <div className="shared-worksheets">
            <div className="shared-item">
              <h4>Strategic Planning Assessment</h4>
              <p>Shared by {currentUser.name} • 2 responses</p>
              <button className="view-btn">View Responses</button>
            </div>
            <div className="shared-item">
              <h4>Policy Development Checklist</h4>
              <p>Shared by John Doe • 3 responses</p>
              <button className="view-btn">View Responses</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default TeamCollaboration;