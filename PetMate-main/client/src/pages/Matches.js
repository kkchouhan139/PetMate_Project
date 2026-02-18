import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Check, X, Eye } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, petsRes] = await Promise.all([
        API.get('/matches'),
        API.get('/pets/my-pets')
      ]);
      
      setMatches(matchesRes.data);
      
      // Get interests received on user's pets
      const allInterests = [];
      petsRes.data.forEach(pet => {
        pet.interests?.forEach(interest => {
          allInterests.push({
            ...interest,
            targetPet: pet,
            id: interest._id
          });
        });
      });
      setInterests(allInterests);
    } catch (error) {
      toast.error('Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const handleInterest = async (interestId, petId, action) => {
    try {
      await API.put(`/matches/interest/${interestId}`, { action, petId });
      toast.success(`Interest ${action}! ${action === 'accepted' ? '💕' : ''}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update interest');
    }
  };

  if (loading) {
    return (
      <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4 py-8">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading matches...</p>
        </div>
      </div>
    );
  }

  const pendingInterests = interests.filter(i => i.status === 'pending');
  const acceptedMatches = matches.filter(m => m.status === 'matched');

  return (
    <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8">My Matches 💕</h1>
      
      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'received' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Interests Received ({pendingInterests.length})
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'matches' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          My Matches ({acceptedMatches.length})
        </button>
      </div>

      {/* Interests Received */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          {pendingInterests.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No pending interests</p>
              <p className="text-gray-400">When someone shows interest in your pets, they'll appear here.</p>
            </div>
          ) : (
            pendingInterests.map(interest => {
              const interestPet = interest.from && typeof interest.from === 'object' ? interest.from : null;
              const interestPetId = interestPet?._id || interest.from;
              const interestName = interestPet?.name || 'Unknown pet';
              const interestBreed = interestPet?.breed || 'Unknown breed';
              const interestSpecies = interestPet?.species || 'pet';
              const interestPhoto = interestPet?.photos?.[0]?.url || '/placeholder-pet.jpg';
              const createdAt = interest.createdAt ? new Date(interest.createdAt).toLocaleDateString() : 'Recently';
              return (
              <div key={interest.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <img
                    src={interestPhoto}
                    alt={interestName}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{interestName}</h3>
                    <p className="text-gray-600 capitalize">{interestBreed} • {interestSpecies}</p>
                    <p className="text-sm text-gray-500">
                      Interested in your pet: <span className="font-medium">{interest.targetPet.name}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {createdAt}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={interestPetId ? `/pet/${interestPetId}` : '/search'}
                      className="btn-secondary flex items-center space-x-1 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Link>
                    <button
                      onClick={() => handleInterest(interest.id, interest.targetPet._id, 'accepted')}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg flex items-center space-x-1"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleInterest(interest.id, interest.targetPet._id, 'rejected')}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center space-x-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
      )}

      {/* Accepted Matches */}
      {activeTab === 'matches' && (
        <div className="grid sm:grid-cols-2 gap-6">
          {acceptedMatches.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No matches yet</p>
              <p className="text-gray-400">Accept some interests to start chatting!</p>
            </div>
          ) : (
            acceptedMatches.map(match => {
              const userId = user?.id || user?._id;
              const pet1OwnerId = match.pet1.owner?._id || match.pet1.owner;
              const otherPet = pet1OwnerId?.toString() === userId ? match.pet2 : match.pet1;
              return (
                <div key={match._id} className="card">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={otherPet.photos?.[0]?.url || '/placeholder-pet.jpg'}
                      alt={otherPet.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{otherPet.name}</h3>
                      <p className="text-gray-600 capitalize">{otherPet.breed} • {otherPet.species}</p>
                      <p className="text-sm text-gray-500">
                        Matched on {new Date(match.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      to={`/pet/${otherPet._id}`}
                      className="flex-1 btn-secondary text-center"
                    >
                      View Profile
                    </Link>
                    <Link
                      to={`/chat/${match.chatId}`}
                      className="flex-1 btn-primary text-center flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat</span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Matches;
