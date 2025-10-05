import React, { useState } from "react";

const ContactForm: React.FC = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      company: '',
      message: ''
    });
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Handle form submission
      alert('Thank you for your message! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', company: '', message: '' });
    };
  
    return (
      <form className="contact-form" onSubmit={handleSubmit}>
        <h3>Contact Us</h3>
        <input
          type="text"
          placeholder="Your Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
        <input
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Company Name"
          value={formData.company}
          onChange={(e) => setFormData({...formData, company: e.target.value})}
        />
        <textarea
          placeholder="How can we help you?"
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          required
        ></textarea>
        <button type="submit" className="submit-btn">Send Message</button>
      </form>
    );
  };

  export default ContactForm;