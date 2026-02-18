import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MapPin, Calendar, Scale, Shield, Flag, Share2 } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/ReportModal';

const PetProfile = () => {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [myPets, setMyPets] = useState([]);
  const [activePetId, setActivePetId] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || user?._id;

  useEffect(() => {
    fetchPet();
  }, [id]);

  useEffect(() => {
    const fetchMyPets = async () => {
      if (!user) return;
      try {
        const response = await API.get('/pets/my-pets');
        setMyPets(response.data || []);
        if (response.data?.length) {
          setActivePetId(response.data[0]._id);
        }
      } catch (error) {
        // Silent fail
      }
    };
    fetchMyPets();
  }, [user]);

  const fetchPet = async () => {
    try {
      const response = await API.get(`/pets/${id}`);
      setPet(response.data);
    } catch (error) {
      toast.error('Pet not found');
      navigate('/search');
    } finally {
      setLoading(false);
    }
  };

  const sendInterest = async () => {
    if (!activePetId) {
      toast.error('Please add a pet first');
      navigate('/add-pet');
      return;
    }

    try {
      await API.post('/matches/interest', {
        petId: activePetId,
        targetPetId: id
      });
      toast.success('Interest sent! 🐾');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send interest');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading pet profile...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Pet not found</p>
          <button onClick={() => navigate('/search')} className="btn-primary mt-4">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const isOwner = userId && pet.owner._id === userId;
  const mainPhoto = pet.photos.find(p => p.isMain) || pet.photos[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100">
                <Share2 className="w-5 h-5" />
              </button>
              {!isOwner && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100"
                >
                  <Flag className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Photos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Main Photo */}
              <div className="relative h-64 sm:h-80 lg:h-96">
                <img
                  src={pet.photos[currentImageIndex]?.url || mainPhoto?.url || '/placeholder-pet.jpg'}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
                {pet.vaccination?.isVaccinated && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    <Shield className="w-4 h-4 inline mr-1" />
                    Vaccinated
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {pet.views || 0} views
                </div>
              </div>
              
              {/* Photo Thumbnails */}
              {pet.photos.length > 1 && (
                <div className="p-4 border-t">
                  <div className="flex space-x-2 overflow-x-auto">
                    {pet.photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                          currentImageIndex === index ? 'border-primary-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={`${pet.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description & Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-2xl font-bold mb-4">About {pet.name}</h2>
              
              {/* Basic Info Grid */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-medium">{pet.age.years} years {pet.age.months} months</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Scale className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Weight & Size</p>
                    <p className="font-medium">{pet.weight}kg • {pet.size}</p>
                  </div>
                </div>
              </div>

              {/* Temperament */}
              {pet.temperament?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Temperament</h3>
                  <div className="flex flex-wrap gap-2">
                    {pet.temperament.map(trait => (
                      <span key={trait} className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm capitalize">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Health Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Health Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Shield className={`w-5 h-5 ${
                      pet.vaccination?.isVaccinated ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <span className={pet.vaccination?.isVaccinated ? 'text-green-700' : 'text-red-700'}>
                      {pet.vaccination?.isVaccinated ? 'Vaccinated' : 'Not Vaccinated'}
                    </span>
                  </div>
                  
                  {pet.vaccination?.lastVaccinationDate && (
                    <p className="text-sm text-gray-600 ml-7">
                      Last vaccination: {new Date(pet.vaccination.lastVaccinationDate).toLocaleDateString()}
                    </p>
                  )}
                  
                  {pet.health?.notes && (
                    <div className="ml-7">
                      <p className="text-sm text-gray-500 mb-1">Health Notes:</p>
                      <p className="text-sm text-gray-700">{pet.health.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Owner Info & Actions */}
          <div className="space-y-6">
            {/* Pet Summary Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold mb-2">{pet.name}</h1>
                <p className="text-xl text-gray-600 capitalize">{pet.breed} • {pet.species}</p>
                <p className="text-lg text-gray-500 capitalize">{pet.gender}</p>
              </div>

              <div className="flex items-center justify-center space-x-2 text-gray-600 mb-6">
                <MapPin className="w-4 h-4" />
                <span>
                  {[
                    pet.owner.location?.city,
                    pet.owner.location?.district,
                    pet.owner.location?.state || pet.owner.location?.area
                  ].filter(Boolean).join(', ') || 'Location not provided'}
                </span>
              </div>

              {/* Action Buttons */}
              {!isOwner && user && (
                <div className="space-y-3">
                  {myPets.length > 0 && (
                    <select
                      value={activePetId}
                      onChange={(e) => setActivePetId(e.target.value)}
                      className="input-field"
                    >
                      {myPets.map((petItem) => (
                        <option key={petItem._id} value={petItem._id}>
                          {petItem.name} • {petItem.breed}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={sendInterest}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <Heart className="w-5 h-5" />
                    <span>Send Interest</span>
                  </button>
                </div>
              )}

              {!user && (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Login to send interest</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-primary w-full"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>

            {/* Owner Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Pet Parent</h3>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-lg">
                    {pet.owner.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{pet.owner.name}</p>
                  {pet.owner.isVerified && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Verified</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Member since {new Date(pet.owner.createdAt || Date.now()).getFullYear()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUser={pet.owner._id}
        reportedPet={pet._id}
      />
    </div>
  );
};

export default PetProfile;
