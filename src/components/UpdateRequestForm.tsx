import React, { useState } from 'react';
import type { EnrichedFacultyProfile } from '../types';

interface UpdateRequestFormProps {
  profile: EnrichedFacultyProfile;
  onClose: () => void;
}

export const UpdateRequestForm: React.FC<UpdateRequestFormProps> = ({ profile, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    affiliation: profile.enrichment?.professional?.affiliation || '',
    title: profile.enrichment?.professional?.title || '',
    department: profile.enrichment?.professional?.department || '',
    website: profile.enrichment?.professional?.labWebsite || '',
    orcid: profile.enrichment?.academic?.orcid || '',
    researchAreas: (() => {
      const areas = profile.enrichment?.academic?.researchAreas;
      if (!areas) return '';
      if (Array.isArray(areas)) return areas.join(', ');
      return areas.raw?.join(', ') || '';
    })(),
    bio: profile.enrichment?.profile?.shortBio || '',
    consent: false
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      // In production, this would POST to your backend
      // For now, we'll save to localStorage and show success
      const updates = JSON.parse(localStorage.getItem('facultyUpdates') || '[]');
      updates.push({
        facultyId: profile.faculty.id,
        timestamp: new Date().toISOString(),
        ...formData
      });
      localStorage.setItem('facultyUpdates', JSON.stringify(updates));
      
      setStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h2 className="text-2xl font-bold">Update Your Information</h2>
          <p className="text-white/90 mt-1">
            Help us keep your profile current and accurate
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Email for verification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="your.email@university.edu"
            />
            <p className="text-xs text-gray-500 mt-1">For verification purposes only</p>
          </div>

          {/* Professional Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-gray-900">Professional Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Affiliation
              </label>
              <input
                type="text"
                value={formData.affiliation}
                onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="University of Example"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professional Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Professor, Associate Professor, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Department of Biology"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lab/Personal Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.edu/lab"
              />
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-gray-900">Academic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ORCID ID
              </label>
              <input
                type="text"
                value={formData.orcid}
                onChange={(e) => setFormData({ ...formData, orcid: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0000-0000-0000-0000"
                pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Research Areas
              </label>
              <input
                type="text"
                value={formData.researchAreas}
                onChange={(e) => setFormData({ ...formData, researchAreas: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="genomics, evolution, bioinformatics (comma-separated)"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple areas with commas</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Brief description of your research and interests..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </div>

          {/* Consent */}
          <div className="pt-4 border-t">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                checked={formData.consent}
                onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                I consent to having this information displayed publicly on the Evomics Faculty Alumni page
              </span>
            </label>
          </div>

          {/* Status messages */}
          {status === 'success' && (
            <div className="bg-green-50 text-green-800 p-4 rounded-md">
              Thank you! Your information has been submitted for review.
            </div>
          )}
          
          {status === 'error' && (
            <div className="bg-red-50 text-red-800 p-4 rounded-md">
              An error occurred. Please try again later.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={status === 'submitting' || status === 'success'}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'submitting' ? 'Submitting...' : 'Submit Update Request'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};