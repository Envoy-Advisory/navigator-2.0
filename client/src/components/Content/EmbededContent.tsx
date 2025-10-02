import React from "react";
import { useLocation } from "react-router-dom";

const EmbeddedContent: React.FC = () => {
    const location = useLocation();
    const courseId = location.pathname.split('/').pop();
  
    return (
      <div className="embedded-content">
        <div className="embed-header">
          <h2>Fair Chance Navigator 2.0</h2>
          <p>Embedded Course Content</p>
        </div>
  
        <div className="embed-body">
          <p>This is embedded content for course: {courseId}</p>
          <div className="embed-features">
            <div className="embed-feature">
              <h3>Interactive Learning</h3>
              <p>Engage with our comprehensive modules</p>
            </div>
            <div className="embed-feature">
              <h3>Track Progress</h3>
              <p>Monitor your learning journey</p>
            </div>
          </div>
  
          <div className="embed-cta">
            <p>Want the full experience?</p>
            <a href="/" className="embed-link">Visit Fair Chance Navigator 2.0</a>
          </div>
        </div>
      </div>
    );
  };
  export default EmbeddedContent;