import React from "react";


const FAQ: React.FC = () => (
    <div className="faq-page">
      <div className="container">
        <h1>Frequently Asked Questions</h1>
  
        <div className="faq-list">
          <div className="faq-item">
            <h3>What is Fair Chance Navigator 2.0?</h3>
            <p>Fair Chance Navigator 2.0 is a comprehensive platform designed to help employers develop inclusive hiring strategies for justice-impacted candidates. It provides training modules, tools, and resources to create fair and effective hiring practices.</p>
          </div>
  
          <div className="faq-item">
            <h3>How long does it take to complete the program?</h3>
            <p>The complete program typically takes 4-6 weeks to finish, depending on your pace and organization size. Each module can be completed in 1-2 hours.</p>
          </div>
  
          <div className="faq-item">
            <h3>Can my team collaborate on the platform?</h3>
            <p>Yes! Premium and Enterprise plans include team collaboration features, allowing multiple users from your organization to work together and share progress.</p>
          </div>
  
          <div className="faq-item">
            <h3>Is my data secure?</h3>
            <p>Absolutely. We use industry-standard encryption and security measures to protect all user data. Your information is never shared with third parties without your explicit consent.</p>
          </div>
  
          <div className="faq-item">
            <h3>Do you offer support?</h3>
            <p>Yes, we provide email support for all users, with priority support available for Premium and Enterprise customers. We also offer live chat during business hours.</p>
          </div>
        </div>
      </div>
    </div>
  );
  export default FAQ;