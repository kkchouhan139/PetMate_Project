import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut } from 'lucide-react';
import LogoutModal from './LogoutModal';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out successfully! 👋');
      setShowLogoutModal(false);
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary-600 flex items-center">
            PetMate 🐾
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">Dashboard</Link>
                <Link to="/search" className="text-gray-700 hover:text-primary-600 transition-colors">Search</Link>
                <Link to="/matches" className="text-gray-700 hover:text-primary-600 transition-colors">Matches</Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-primary-600 transition-colors">Admin</Link>
                )}
                {user?.role !== 'admin' && (
                  <Link to="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors">
                    <User className="w-4 h-4 text-gray-600" />
                    <span>{user?.name}</span>
                  </Link>
                )}
                <button 
                  onClick={() => setShowLogoutModal(true)} 
                  className="btn-primary flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600 transition-colors">Login</Link>
                <Link to="/register" className="btn-primary">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link to="/dashboard" className="block py-2 text-gray-700">Dashboard</Link>
                <Link to="/search" className="block py-2 text-gray-700">Search</Link>
                <Link to="/matches" className="block py-2 text-gray-700">Matches</Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="block py-2 text-gray-700">Admin</Link>
                )}
                {user?.role !== 'admin' && (
                  <Link to="/profile" className="block py-2 text-gray-700">Profile</Link>
                )}
                <button onClick={() => setShowLogoutModal(true)} className="block py-2 text-red-600">Logout</button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to="/login" className="block py-2 text-gray-700">Login</Link>
                <Link to="/register" className="block py-2 text-primary-600">Sign Up</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
    
    <LogoutModal 
      isOpen={showLogoutModal}
      onClose={() => setShowLogoutModal(false)}
      onConfirm={handleLogout}
      loading={loggingOut}
    />
    </>
  );
};

export default Navbar;
