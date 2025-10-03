import React, { useState } from "react";

const ProgramPage: React.FC = () => {
    const [couponCode, setCouponCode] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'enterprise'>('basic');
  
    const plans = {
      basic: { name: 'Basic', price: 99, features: ['7 Core Modules', 'Basic Support', 'Individual Account'] },
      premium: { name: 'Premium', price: 199, features: ['7 Core Modules', 'Team Collaboration', 'Priority Support', 'Advanced Analytics'] },
      enterprise: { name: 'Enterprise', price: 499, features: ['Everything in Premium', 'Custom Branding', 'Admin Dashboard', 'Content Duplication'] }
    };
  
    const handleEnrollment = () => {
      // Mock payment processing
      alert(`Enrolling in ${plans[selectedPlan].name} plan. You will have instant access after payment!`);
    };
  
    return (
      <div className="program-page">
        <section className="program-hero">
          <div className="container">
            <h1>Fair Chance Navigator 2.0 Program</h1>
            <p>Comprehensive training and tools for inclusive hiring excellence</p>
          </div>
        </section>
  
        <section className="program-overview">
          <div className="container">
            <h2>What You'll Learn</h2>
            <div className="overview-grid">
              <div className="overview-item">
                <h3>📋 Strategic Planning</h3>
                <p>Develop comprehensive plans for inclusive hiring initiatives</p>
              </div>
              <div className="overview-item">
                <h3>⚖️ Policy Development</h3>
                <p>Create legally compliant fair chance policies</p>
              </div>
              <div className="overview-item">
                <h3>👥 Candidate Experience</h3>
                <p>Design positive experiences for all candidates</p>
              </div>
              <div className="overview-item">
                <h3>🎓 Team Training</h3>
                <p>Prepare your staff for inclusive practices</p>
              </div>
            </div>
          </div>
        </section>
  
        <section className="pricing-section">
          <div className="container">
            <h2>Choose Your Plan</h2>
            <div className="pricing-grid">
              {Object.entries(plans).map(([key, plan]) => (
                <div
                  key={key}
                  className={`pricing-card ${selectedPlan === key ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan(key as any)}
                >
                  <h3>{plan.name}</h3>
                  <div className="price">${plan.price}/month</div>
                  <ul>
                    {plan.features.map((feature, index) => (
                      <li key={index}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
  
            <div className="enrollment-form">
              <h3>Enroll Now</h3>
              <div className="coupon-section">
                <input
                  type="text"
                  placeholder="Coupon Code (Optional)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button className="apply-coupon">Apply</button>
              </div>
              <button onClick={handleEnrollment} className="enroll-btn">
                Enroll in {plans[selectedPlan].name} - ${plans[selectedPlan].price}/month
              </button>
              <p className="instant-access">🚀 Instant access after payment</p>
            </div>
          </div>
        </section>
      </div>
    );
  };
  export default ProgramPage;