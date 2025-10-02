import React from "react";
import { Link } from "react-router-dom";
import { Testimonial } from "../../interfaces/navigatorIntfs";
import ContactForm from "./ContactForm";


const HomePage: React.FC<{ testimonials: Testimonial[] }> = ({ testimonials }) => (
    <div className="homepage">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Transform Your Hiring with Fair Chance Navigator 2.0</h1>
          <p>The comprehensive platform for developing inclusive hiring strategies that open doors for justice-impacted candidates while strengthening your workforce.</p>
          <div className="hero-actions">
            <Link to="/program" className="cta-primary">Start Your Journey</Link>
            <Link to="#learn-more" className="cta-secondary">Learn More</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="stat-highlight">
            <span className="stat-number">85%</span>
            <span className="stat-label">Retention Rate</span>
          </div>
          <div className="stat-highlight">
            <span className="stat-number">500+</span>
            <span className="stat-label">Companies Trained</span>
          </div>
          <div className="stat-highlight">
            <span className="stat-number">95%</span>
            <span className="stat-label">Satisfaction Score</span>
          </div>
        </div>
      </section>
  
      <section id="learn-more" className="description-section">
        <div className="container">
          <h2>Why Fair Chance Hiring Matters</h2>
          <div className="description-grid">
            <div className="description-item">
              <div className="description-icon">🎯</div>
              <h3>Business Impact</h3>
              <p>Companies with inclusive hiring practices see 25% higher retention rates and improved team performance.</p>
            </div>
            <div className="description-item">
              <div className="description-icon">⚖️</div>
              <h3>Legal Compliance</h3>
              <p>Stay compliant with fair chance legislation while building a stronger, more diverse workforce.</p>
            </div>
            <div className="description-item">
              <div className="description-icon">🌟</div>
              <h3>Social Impact</h3>
              <p>Help break the cycle of recidivism while accessing a motivated, loyal talent pool.</p>
            </div>
          </div>
        </div>
      </section>
  
      <section className="testimonials-section">
        <div className="container">
          <h2>Success Stories</h2>
          <div className="testimonials-grid">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-rating">
                  {'★'.repeat(testimonial.rating)}
                </div>
                <p>"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.company}</span>
                </div>
                {testimonial.videoUrl && (
                  <button className="play-testimonial">▶ Watch Video</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
  
      <section className="contact-section">
        <div className="container">
          <div className="contact-content">
            <div className="contact-info">
              <h2>Get Started Today</h2>
              <p>Ready to transform your hiring practices? Contact us to learn more about Fair Chance Navigator 2.0.</p>
              <div className="contact-details">
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <span>info@fairchancenavigator.com</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <span>(555) 123-4567</span>
                </div>
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );

  export default HomePage;