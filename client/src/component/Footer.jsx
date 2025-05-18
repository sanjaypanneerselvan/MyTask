import React from 'react';
import './Footer.css'; 
const Footer = () => {
  return (
    <footer className="text-center py-3 bg-dark text-light mt-auto">
      <p>&copy; {new Date().getFullYear()} Developed by Sanjay Panneerselvan & Swetha Ramamoorthi. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
