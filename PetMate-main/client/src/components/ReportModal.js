import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const ReportModal = ({ isOpen, onClose, reportedUser, reportedPet }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reasons = [
    { value: 'fake_profile', label: 'Fake Profile' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'spam', label: 'Spam' },
    { value: 'scam', label: 'Scam' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !description.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await API.post('/reports', {
        reportedUser,
        reportedPet,
        reason,
        description: description.trim()
      });
      
      toast.success('Report submitted successfully');
      onClose();
      setReason('');
      setDescription('');
    } catch (error) {
      toast.error('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-full">
                <Flag className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Report Issue</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reason for reporting</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a reason</option>
                {reasons.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide details about the issue..."
                className="input-field h-24 resize-none"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;