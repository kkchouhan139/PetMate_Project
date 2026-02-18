import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Filter, MapPin, Heart, Eye } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Search = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    species: '',
    breed: '',
    gender: '',
    city: '',
    district: '',
    state: '',
    radius: '',
    minAge: '',
    maxAge: '',
    size: '',
    vaccinated: '',
    sortBy: 'createdAt',
    page: 1
  });
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const [myPets, setMyPets] = useState([]);
  const [activePetId, setActivePetId] = useState('');
  const userId = user?.id || user?._id;
  const hasShownGeoToastRef = React.useRef(false);
  const [profileCoords, setProfileCoords] = useState(null);

  useEffect(() => {
    fetchPets();
  }, [filters]);

  useEffect(() => {
    const fetchMyPets = async () => {
      if (!user) return;
      try {
        const [petsRes, profileRes] = await Promise.all([
          API.get('/pets/my-pets'),
          API.get('/users/profile')
        ]);
        setMyPets(petsRes.data || []);
        if (petsRes.data?.length) {
          setActivePetId(petsRes.data[0]._id);
        }
        const coords = profileRes.data?.location?.geo?.coordinates;
        if (coords?.length === 2) {
          setProfileCoords({ lng: coords[0], lat: coords[1] });
        }
      } catch (error) {
        // Handle auth errors silently (user logged out)
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          setMyPets([]);
          setActivePetId('');
          setProfileCoords(null);
        }
      }
    };
    fetchMyPets();
  }, [user]);

  const fetchPets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      let hasGeo = false;

      // Add user location for radius search
      if (filters.radius && navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              params.append('lat', position.coords.latitude);
              params.append('lng', position.coords.longitude);
              hasGeo = true;
              resolve();
            },
            () => resolve(),
            { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
          );
        });
      }
      if (filters.radius && !hasGeo && profileCoords) {
        params.append('lat', profileCoords.lat);
        params.append('lng', profileCoords.lng);
        hasGeo = true;
      }

      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          if (key === 'radius' && !hasGeo) return;
          params.append(key, filters[key]);
        }
      });

      if (filters.radius && !hasGeo && !hasShownGeoToastRef.current) {
        hasShownGeoToastRef.current = true;
        toast.error('Enable location to use distance filter');
      }
      
      const response = await API.get(`/pets?${params}`);
      setPets(response.data.pets);
      setPagination(response.data.pagination);
    } catch (error) {
      // Handle auth errors silently
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        toast.error('Failed to fetch pets');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const sendInterest = async (petId, targetPetId) => {
    try {
      await API.post('/matches/interest', { petId, targetPetId });
      toast.success('Interest sent! 💕');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send interest');
    }
  };

  const breedOptions = {
    dog: ['Labrador', 'Golden Retriever', 'German Shepherd', 'Bulldog', 'Mixed Breed'],
    cat: ['Persian', 'Siamese', 'Maine Coon', 'British Shorthair', 'Mixed Breed'],
    bird: ['Parrot', 'Canary', 'Budgie', 'Cockatiel'],
    rabbit: ['Holland Lop', 'Netherland Dwarf', 'Mixed Breed']
  };

  return (
    <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Find Your Pet's Perfect Match 🔍</h1>
        
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or breed..."
              className="input-field pl-10"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {user && myPets.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
            <label className="text-sm text-gray-600">Send interests as:</label>
            <select
              value={activePetId}
              onChange={(e) => setActivePetId(e.target.value)}
              className="input-field max-w-xs"
            >
              {myPets.map((pet) => (
                <option key={pet._id} value={pet._id}>
                  {pet.name} - {pet.breed}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="card mb-6">
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              <select
                value={filters.species}
                onChange={(e) => handleFilterChange('species', e.target.value)}
                className="input-field"
              >
                <option value="">All Species</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="rabbit">Rabbit</option>
              </select>

              <select
                value={filters.breed}
                onChange={(e) => handleFilterChange('breed', e.target.value)}
                className="input-field"
              >
                <option value="">All Breeds</option>
                {filters.species && breedOptions[filters.species]?.map(breed => (
                  <option key={breed} value={breed}>{breed}</option>
                ))}
              </select>

              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="input-field"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              <select
                value={filters.size}
                onChange={(e) => handleFilterChange('size', e.target.value)}
                className="input-field"
              >
                <option value="">All Sizes</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
              </select>

              <input
                type="text"
                placeholder="City"
                className="input-field"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />

              <input
                type="text"
                placeholder="District"
                className="input-field"
                value={filters.district}
                onChange={(e) => handleFilterChange('district', e.target.value)}
              />

              <input
                type="text"
                placeholder="State"
                className="input-field"
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
              />

              <select
                value={filters.radius}
                onChange={(e) => handleFilterChange('radius', e.target.value)}
                className="input-field"
              >
                <option value="">Any Distance</option>
                <option value="5">Within 5km</option>
                <option value="10">Within 10km</option>
                <option value="25">Within 25km</option>
                <option value="50">Within 50km</option>
              </select>

              <input
                type="number"
                placeholder="Min Age"
                className="input-field"
                value={filters.minAge}
                onChange={(e) => handleFilterChange('minAge', e.target.value)}
              />

              <input
                type="number"
                placeholder="Max Age"
                className="input-field"
                value={filters.maxAge}
                onChange={(e) => handleFilterChange('maxAge', e.target.value)}
              />

              <select
                value={filters.vaccinated}
                onChange={(e) => handleFilterChange('vaccinated', e.target.value)}
                className="input-field"
              >
                <option value="">All Vaccination Status</option>
                <option value="true">Vaccinated Only</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Searching for pets...</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pets.map(pet => (
              <div key={pet._id} className="card hover:shadow-lg transition-shadow">
                <div className="relative mb-4">
                  <img
                    src={pet.photos.find(p => p.isMain)?.url || pet.photos[0]?.url || '/placeholder-pet.jpg'}
                    alt={pet.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {pet.views || 0}
                  </div>
                  {pet.vaccination?.isVaccinated && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                      Vaccinated
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">{pet.name}</h3>
                    <span className="text-sm text-gray-500 capitalize">{pet.gender}</span>
                  </div>
                  
                  <p className="text-gray-600 capitalize">{pet.breed} • {pet.species}</p>
                  <p className="text-sm text-gray-500">{pet.age.years}y {pet.age.months}m • {pet.size}</p>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    {[
                      pet.owner?.location?.city,
                      pet.owner?.location?.district,
                      pet.owner?.location?.state || pet.owner?.location?.area
                    ].filter(Boolean).join(', ') || 'Location not provided'}
                  </div>
                  
                  {pet.temperament?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {pet.temperament.slice(0, 3).map(trait => (
                        <span key={trait} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs capitalize">
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-2">
                    <Link
                      to={`/pet/${pet._id}`}
                      className="flex-1 btn-secondary text-center text-sm py-2"
                    >
                      View Profile
                    </Link>
                    {user && (
                      <button
                        onClick={() => {
                          if (!activePetId) {
                            toast.error('Please add a pet first');
                            return;
                          }
                          sendInterest(activePetId, pet._id);
                        }}
                        className="btn-primary px-3 py-2"
                        disabled={pet.owner?._id === userId}
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              {pagination.hasPrev && (
                <button
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  className="btn-secondary"
                >
                  Previous
                </button>
              )}
              
              <span className="flex items-center px-4 py-2 bg-gray-100 rounded">
                Page {pagination.current} of {pagination.pages}
              </span>
              
              {pagination.hasNext && (
                <button
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  className="btn-secondary"
                >
                  Next
                </button>
              )}
            </div>
          )}

          {pets.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No pets found matching your criteria.</p>
              <p className="text-gray-400 mt-2">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Search;
