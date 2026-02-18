import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-8 h-8 text-primary-500" />
              <span className="text-2xl font-bold">PetMate</span>
            </div>
            <p className="text-gray-300">
              Connecting pet owners for breeding, companionship, and friendship. 
              Find the perfect match for your furry friend.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/search" className="text-gray-300 hover:text-white transition-colors">Search Pets</Link></li>
              <li><Link to="/register" className="text-gray-300 hover:text-white transition-colors">Join Now</Link></li>
              <li><Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/careers" className="text-gray-300 hover:text-white transition-colors">Careers</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Safety Tips</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <a
                href="mailto:sakshamswaroop0812@gmail.com"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 text-primary-500" />
                <span>sakshamswaroop0812@gmail.com</span>
              </a>
              <a
                href="tel:+916200085360"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4 text-primary-500" />
                <span>6200085360</span>
              </a>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-primary-500" />
                <span className="text-gray-300">Available Nationwide</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-5 pt-5 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            Â© 2024 PetMate. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



