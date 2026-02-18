import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, MapPin, Phone, Shield, Trash2, XCircle, Plus } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [deletingPetId, setDeletingPetId] = useState(null);
  const [petToDelete, setPetToDelete] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    district: '',
    state: '',
    addressLine: '',
    lat: '',
    lng: '',
    allowChat: true,
    hidePhone: true
  });
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, petsRes] = await Promise.all([
          API.get('/users/profile'),
          API.get('/pets/my-pets')
        ]);
        setProfile(profileRes.data);
        setPets(petsRes.data || []);
        setFormData({
          name: profileRes.data?.name || '',
          phone: profileRes.data?.phone || '',
          city: profileRes.data?.location?.city || '',
          district: profileRes.data?.location?.district || '',
          state: profileRes.data?.location?.state || profileRes.data?.location?.area || '',
          addressLine: profileRes.data?.location?.addressLine || '',
          lat: profileRes.data?.location?.geo?.coordinates?.[1] || '',
          lng: profileRes.data?.location?.geo?.coordinates?.[0] || '',
          allowChat: profileRes.data?.contactPreferences?.allowChat ?? true,
          hidePhone: profileRes.data?.contactPreferences?.hidePhone ?? true
        });
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteProfile = async () => {
    setDeleting(true);
    try {
      const response = await API.delete('/users/profile');
      setProfile((prev) => ({
        ...prev,
        deletionScheduledAt: response.data.deletionScheduledAt,
        deletedAt: response.data.deletedAt
      }));
      toast.success('Profile deletion scheduled');
      setShowDeleteConfirm(false);
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule deletion');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    setCanceling(true);
    try {
      const response = await API.post('/users/profile/cancel-deletion');
      setProfile(response.data.user);
      toast.success('Deletion canceled');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel deletion');
    } finally {
      setCanceling(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        location: {
          city: formData.city,
          district: formData.district,
          state: formData.state,
          addressLine: formData.addressLine,
          coordinates: formData.lat && formData.lng ? { lat: formData.lat, lng: formData.lng } : undefined
        },
        contactPreferences: {
          allowChat: formData.allowChat,
          hidePhone: formData.hidePhone
        }
      };
      const response = await API.put('/users/profile', payload);
      setProfile(response.data);
      toast.success('Profile updated');
      setEditOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location not supported in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setFormData((prev) => ({
          ...prev,
          lat,
          lng
        }));
        try {
          const response = await API.get(`/users/reverse-geocode?lat=${lat}&lng=${lng}`);
          const { addressLine, city, district, state } = response.data || {};
          setFormData((prev) => ({
            ...prev,
            addressLine: addressLine || prev.addressLine,
            city: city || prev.city,
            district: district || prev.district,
            state: state || prev.state
          }));
          toast.success('Location updated');
        } catch (error) {
          toast.error('Location set, but address not found');
        }
      },
      () => {
        toast.error('Unable to access location');
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  };

  const handleDeletePet = async (petId) => {
    setDeletingPetId(petId);
    try {
      await API.delete(`/pets/${petId}`);
      setPets((prev) => prev.filter((pet) => pet._id !== petId));
      toast.success('Pet profile deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete pet');
    } finally {
      setDeletingPetId(null);
      setPetToDelete(null);
    }
  };
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Profile not found</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const deletionDate = profile.deletedAt ? new Date(profile.deletedAt) : null;

  return (
    <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">My Profile</h1>
          <p className="text-gray-600">Manage your personal details and pets</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/add-pet" className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Pet</span>
          </Link>
        </div>
      </div>

      {profile.deletedAt && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            Your profile is scheduled for deletion on{' '}
            <span className="font-semibold">{deletionDate?.toLocaleDateString()}</span>. You can cancel before that date.
          </p>
          <button
            onClick={handleCancelDeletion}
            disabled={canceling}
            className="mt-3 btn-secondary"
          >
            {canceling ? 'Canceling...' : 'Cancel Deletion'}
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              <button
                onClick={() => setEditOpen(true)}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                Edit
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{profile.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">
                    {[
                      profile.location?.addressLine,
                      profile.location?.city,
                      profile.location?.district,
                      profile.location?.state || profile.location?.area
                    ].filter(Boolean).join(', ') || 'Location not provided'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Verification</p>
                  <p className={`font-medium ${profile.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                    {profile.isVerified ? 'Verified' : 'Not verified'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My Pets ({pets.length})</h2>
              <Link to="/add-pet" className="text-primary-600 hover:text-primary-700">
                Add Pet
              </Link>
            </div>
            {pets.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No pets added yet.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {pets.map((pet) => (
                  <div key={pet._id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow flex items-center justify-between gap-3">
                    <Link to={`/pet/${pet._id}`} className="flex items-center space-x-3">
                      <img
                        src={pet.photos?.[0]?.url || '/placeholder-pet.jpg'}
                        alt={pet.name}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium">{pet.name}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {pet.breed} • {pet.species}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => setPetToDelete(pet)}
                      disabled={deletingPetId === pet._id}
                      className="text-sm text-red-600 hover:text-red-700"
                      title="Delete pet"
                    >
                      {deletingPetId === pet._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card border border-red-200">
            <h2 className="text-xl font-semibold mb-3 text-red-600">Danger Zone</h2>
            <p className="text-sm text-gray-600 mb-4">
              Deleting your account will schedule permanent deletion after 30 days. You can cancel within that period.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Profile</span>
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <XCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold">Confirm Profile Deletion</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Your profile will be scheduled for deletion and permanently removed after 30 days. You can cancel within that period.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProfile}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
                disabled={deleting}
              >
                {deleting ? 'Scheduling...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={Boolean(petToDelete)}
        onClose={() => setPetToDelete(null)}
        title="Delete Pet Profile"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete {petToDelete?.name}? This will remove the pet profile from search.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setPetToDelete(null)}
            className="flex-1 btn-secondary"
            disabled={deletingPetId === petToDelete?._id}
          >
            Cancel
          </button>
          <button
            onClick={() => handleDeletePet(petToDelete?._id)}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
            disabled={deletingPetId === petToDelete?._id}
          >
            {deletingPetId === petToDelete?._id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Full Address</label>
            <input
              type="text"
              value={formData.addressLine}
              onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
              className="input-field mt-1"
              placeholder="House no, street, landmark"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="input-field mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600">State</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="input-field mt-1"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button onClick={handleUseLocation} className="btn-secondary">
              Use Current Location
            </button>
            {(formData.lat && formData.lng) && (
              <span className="text-xs text-gray-500">
                Location set for distance search
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              id="allowChat"
              type="checkbox"
              checked={formData.allowChat}
              onChange={(e) => setFormData({ ...formData, allowChat: e.target.checked })}
            />
            <label htmlFor="allowChat" className="text-sm text-gray-700">
              Allow chat requests
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="hidePhone"
              type="checkbox"
              checked={formData.hidePhone}
              onChange={(e) => setFormData({ ...formData, hidePhone: e.target.checked })}
            />
            <label htmlFor="hidePhone" className="text-sm text-gray-700">
              Hide phone number
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setEditOpen(false)}
              className="flex-1 btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              className="flex-1 btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
