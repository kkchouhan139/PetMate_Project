import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const Careers = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await API.get('/jobs');
        setJobs(response.data || []);
      } catch (error) {
        toast.error('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Careers</h1>
        <p className="text-gray-600">Open positions at PetMate</p>
      </div>
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No open roles right now.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div key={job._id} className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{job.title}</h3>
                <span className={`text-xs px-2 py-1 rounded ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                  {job.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{job.department || 'General'}</p>
              <p className="text-sm text-gray-600 mb-4">{job.location || 'Remote'} {job.type ? `• ${job.type}` : ''}</p>
              <p className="text-gray-700 text-sm mb-3">{job.description}</p>
              {job.requirements?.length > 0 && (
                <ul className="list-disc ml-5 text-sm text-gray-700">
                  {job.requirements.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Careers;
