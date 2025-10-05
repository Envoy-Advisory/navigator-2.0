import React from "react";
import { Link } from "react-router-dom";
import { User, Module } from "../../interfaces/navigatorIntfs";

const Dashboard: React.FC<{ currentUser: User; modules: Module[] }> = ({ currentUser, modules }) => {
    const completedModules = modules.filter(m => m.completed).length;
    const progress = (completedModules / modules.length) * 100;
  
    return (
      <div className="dashboard">
        <div className="welcome-section">
          <h2>Welcome back, {currentUser.name}</h2>
          <p>Continue your inclusive hiring journey</p>
  
          <div className="progress-overview">
            <h3>Your Progress</h3>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p>{Math.round(progress)}% Complete ({completedModules} of {modules.length} modules)</p>
          </div>
        </div>
  
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <Link to="/modules" className="action-btn">Continue Learning</Link>
              <Link to="/team" className="action-btn">Team Collaboration</Link>
              <Link to="/worksheet/planning-worksheet-1" className="action-btn">Complete Worksheet</Link>
            </div>
          </div>
  
          <div className="dashboard-card">
            <h3>Recent Activity</h3>
            <ul className="activity-list">
              <li>Completed Planning module worksheet</li>
              <li>Shared progress with team</li>
              <li>Downloaded policy template</li>
            </ul>
          </div>
  
          <div className="dashboard-card">
            <h3>Team Progress</h3>
            <p>Your organization has completed {completedModules} modules</p>
            <Link to="/team" className="view-team">View Team Dashboard</Link>
          </div>
        </div>
      </div>
    );
  };
  export default Dashboard;