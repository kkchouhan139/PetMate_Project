import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Search, Heart, MessageCircle, Eye, Edit } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [stats, setStats] = useState({ matches: 0, interests: 0, views: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [petsRes, matchesRes] = await Promise.all([
        API.get('/pets/my-pets').catch(() => ({ data: [] })),
        API.get('/matches').catch(() => ({ data: [] }))
      ]);
      
      setPets(petsRes.data);
      
      // Calculate stats
      const totalViews = petsRes.data.reduce((sum, pet) => sum + (pet.views || 0), 0);
      const totalInterests = petsRes.data.reduce((sum, pet) => sum + (pet.interests?.length || 0), 0);
      
      setStats({
        matches: matchesRes.data.length,
        interests: totalInterests,
        views: totalViews
      });
    } catch (error) {
      // Silent fail - dashboard should load even if some data fails
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {user?.name}! 🐾</h1>
        <p className="text-gray-600">Manage your pets and find perfect matches</p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100">Total Views</p>
              <p className="text-3xl font-bold">{stats.views}</p>
            </div>
            <Eye className="w-8 h-8 text-primary-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Interests Received</p>
              <p className="text-3xl font-bold">{stats.interests}</p>
            </div>
            <Heart className="w-8 h-8 text-red-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Active Matches</p>
              <p className="text-3xl font-bold">{stats.matches}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/add-pet" className="card hover:shadow-lg transition-shadow text-center">
          <Plus className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Add Pet</h3>
          <p className="text-gray-600">Create a new pet profile</p>
        </Link>
        
        <Link to="/search" className="card hover:shadow-lg transition-shadow text-center">
          <Search className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Search Pets</h3>
          <p className="text-gray-600">Find compatible matches</p>
        </Link>
        
        <Link to="/matches" className="card hover:shadow-lg transition-shadow text-center">
          <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">My Matches</h3>
          <p className="text-gray-600">View your pet matches</p>
        </Link>
        
        <Link to="/matches" className="card hover:shadow-lg transition-shadow text-center">
          <MessageCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Messages</h3>
          <p className="text-gray-600">Chat with other owners</p>
        </Link>
      </div>

      {/* My Pets */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h2 className="text-2xl font-bold">Your Pets ({pets.length})</h2>
          <Link to="/add-pet" className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Pet</span>
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading your pets...</p>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg mb-2">No pets added yet</p>
            <p className="mb-4">Add your first pet to start finding matches!</p>
            <Link to="/add-pet" className="btn-primary">
              Add Your First Pet
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map(pet => (
              <div key={pet._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="relative mb-4">
                  <img
                    src={pet.photos.find(p => p.isMain)?.url || pet.photos[0]?.url || '/placeholder-pet.jpg'}
                    alt={pet.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {pet.views || 0}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{pet.name}</h3>
                    <span className="text-sm text-gray-500 capitalize">{pet.gender}</span>
                  </div>
                  
                  <p className="text-gray-600 text-sm capitalize">{pet.breed} • {pet.species}</p>
                  <p className="text-xs text-gray-500">{pet.age.years}y {pet.age.months}m • {pet.size}</p>
                  
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Heart className="w-3 h-3 mr-1" />
                        {pet.interests?.length || 0}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        to={`/pet/${pet._id}`}
                        className="text-primary-600 hover:text-primary-700 p-1"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        className="text-gray-600 hover:text-gray-700 p-1"
                        title="Edit Pet"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
