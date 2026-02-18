import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Camera, Upload, X } from 'lucide-react';
import API from '../utils/api';

const AddPet = () => {
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const species = watch('species');

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotos(prev => [...prev, {
          file,
          preview: e.target.result,
          isMain: prev.length === 0
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(prev => {
      const newPhotos = prev.filter((_, i) => i !== index);
      if (newPhotos.length > 0 && prev[index].isMain) {
        newPhotos[0].isMain = true;
      }
      return newPhotos;
    });
  };

  const setMainPhoto = (index) => {
    setPhotos(prev => prev.map((photo, i) => ({
      ...photo,
      isMain: i === index
    })));
  };

  const onSubmit = async (data) => {
    if (photos.length === 0) {
      toast.error('Please add at least one photo');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add pet data
      Object.keys(data).forEach(key => {
        if (key === 'temperament') {
          formData.append(key, JSON.stringify(data[key]));
        } else if (key === 'age') {
          formData.append('age[years]', data.age.years);
          formData.append('age[months]', data.age.months || 0);
        } else if (key === 'vaccination') {
          formData.append('vaccination[isVaccinated]', data.vaccination.isVaccinated);
          if (data.vaccination.lastVaccinationDate) {
            formData.append('vaccination[lastVaccinationDate]', data.vaccination.lastVaccinationDate);
          }
        } else {
          formData.append(key, data[key]);
        }
      });

      // Add photos
      photos.forEach((photo, index) => {
        formData.append('photos', photo.file);
        formData.append(`photoMeta[${index}]`, JSON.stringify({ isMain: photo.isMain }));
      });

      const response = await API.post('/pets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Pet profile created successfully! 🐾');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create pet profile');
    } finally {
      setLoading(false);
    }
  };

  const breedOptions = {
    dog: ['Labrador', 'Golden Retriever', 'German Shepherd', 'Bulldog', 'Poodle', 'Beagle', 'Rottweiler', 'Mixed Breed'],
    cat: ['Persian', 'Siamese', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Bengal', 'Russian Blue', 'Mixed Breed'],
    bird: ['Parrot', 'Canary', 'Budgie', 'Cockatiel', 'Lovebird', 'Finch'],
    rabbit: ['Holland Lop', 'Netherland Dwarf', 'Mini Rex', 'Lionhead', 'Mixed Breed'],
    other: ['Mixed Breed']
  };

  return (
    <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Add Your Pet 🐾</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pet Name *</label>
                <input
                  {...register('name', { required: 'Pet name is required' })}
                  className="input-field"
                  placeholder="Enter pet name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Species *</label>
                <select {...register('species', { required: 'Species is required' })} className="input-field">
                  <option value="">Select species</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="other">Other</option>
                </select>
                {errors.species && <p className="text-red-500 text-sm mt-1">{errors.species.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Breed *</label>
                <select {...register('breed', { required: 'Breed is required' })} className="input-field">
                  <option value="">Select breed</option>
                  {species && breedOptions[species]?.map(breed => (
                    <option key={breed} value={breed}>{breed}</option>
                  ))}
                </select>
                {errors.breed && <p className="text-red-500 text-sm mt-1">{errors.breed.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Gender *</label>
                <select {...register('gender', { required: 'Gender is required' })} className="input-field">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
              </div>
            </div>
          </div>

          {/* Age & Size */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Age & Size</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Age (Years) *</label>
                <input
                  type="number"
                  {...register('age.years', { required: 'Age is required', min: 0, max: 30 })}
                  className="input-field"
                  placeholder="0"
                />
                {errors.age?.years && <p className="text-red-500 text-sm mt-1">{errors.age.years.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Age (Months)</label>
                <input
                  type="number"
                  {...register('age.months', { min: 0, max: 11 })}
                  className="input-field"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('weight', { required: 'Weight is required', min: 0.1 })}
                  className="input-field"
                  placeholder="0.0"
                />
                {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Size *</label>
                <select {...register('size', { required: 'Size is required' })} className="input-field">
                  <option value="">Select size</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
                {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size.message}</p>}
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Photos (Max 5) *</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img src={photo.preview} alt="Pet" className="w-full h-32 object-cover rounded-lg" />
                  {photo.isMain && (
                    <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                      Main
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {!photo.isMain && (
                    <button
                      type="button"
                      onClick={() => setMainPhoto(index)}
                      className="absolute bottom-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded"
                    >
                      Set Main
                    </button>
                  )}
                </div>
              ))}
              
              {photos.length < 5 && (
                <label className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500">
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Add Photo</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Temperament */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Temperament</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['friendly', 'calm', 'playful', 'energetic', 'gentle', 'protective', 'shy', 'aggressive'].map(trait => (
                <label key={trait} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={trait}
                    {...register('temperament')}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{trait}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Vaccination */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Vaccination Status</h2>
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('vaccination.isVaccinated')}
                  className="rounded"
                />
                <span>My pet is vaccinated</span>
              </label>
              
              <div>
                <label className="block text-sm font-medium mb-2">Last Vaccination Date</label>
                <input
                  type="date"
                  {...register('vaccination.lastVaccinationDate')}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Create Pet Profile
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPet;
