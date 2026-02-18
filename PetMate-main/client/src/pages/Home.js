import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, MessageCircle, Shield } from 'lucide-react';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16 sm:py-20">
        <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            Find the Perfect Match for Your Pet 🐾
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with pet owners for breeding, companionship, and friendship. 
            Safe, verified, and trusted by thousands of pet parents.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-3">
              Get Started
            </Link>
            <Link to="/search" className="btn-secondary text-lg px-8 py-3">
              Browse Pets
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose PetMate Matches?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
              <p className="text-gray-600">Advanced filters by breed, location, age, and temperament</p>
            </div>
            <div className="text-center">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Perfect Matches</h3>
              <p className="text-gray-600">AI-powered matching based on compatibility</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Safe Chat</h3>
              <p className="text-gray-600">Secure in-app messaging with photo sharing</p>
            </div>
            <div className="text-center">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Profiles</h3>
              <p className="text-gray-600">All pets and owners are verified for safety</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Create Profile</h3>
              <p className="text-gray-600">Sign up and create detailed profiles for your pets with photos, breed info, and personality traits.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Find Matches</h3>
              <p className="text-gray-600">Browse through compatible pets in your area and send interests to owners you'd like to connect with.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Connect & Meet</h3>
              <p className="text-gray-600">Chat with other pet parents and arrange safe meetups for your furry friends to get acquainted.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-primary-100">Happy Pet Parents</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">25,000+</div>
              <div className="text-primary-100">Pet Profiles</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-primary-100">Successful Matches</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-primary-100">Cities Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Pet Parents Say</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary-600 font-semibold">S</span>
                </div>
                <div>
                  <h4 className="font-semibold">Sarah Johnson</h4>
                  <p className="text-gray-600 text-sm">Golden Retriever Owner</p>
                </div>
              </div>
              <p className="text-gray-700">"Found the perfect playmate for Max! The matching system really works. Both dogs get along amazingly well."</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary-600 font-semibold">M</span>
                </div>
                <div>
                  <h4 className="font-semibold">Mike Chen</h4>
                  <p className="text-gray-600 text-sm">Labrador Owner</p>
                </div>
              </div>
              <p className="text-gray-700">"Great platform for finding breeding partners. The verification process gives me confidence in the community."</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary-600 font-semibold">A</span>
                </div>
                <div>
                  <h4 className="font-semibold">Anna Rodriguez</h4>
                  <p className="text-gray-600 text-sm">Persian Cat Owner</p>
                </div>
              </div>
              <p className="text-gray-700">"Love how easy it is to connect with other cat parents nearby. Luna has made so many new friends!"</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-800 text-white py-16">
        <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Pet's Perfect Match?</h2>
          <p className="text-xl mb-8">Join thousands of happy pet parents today!</p>
          <Link to="/register" className="btn-primary text-lg px-8 py-3">
            Start Matching Now
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
