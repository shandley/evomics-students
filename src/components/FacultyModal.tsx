import React, { useEffect, useRef } from 'react';
import type { EnrichedFacultyProfile, Workshop } from '../types';
import { TopicDisplay } from './TopicDisplay';

interface FacultyModalProps {
  profile: EnrichedFacultyProfile | null;
  workshops: { [key: string]: Workshop };
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export const FacultyModal: React.FC<FacultyModalProps> = ({
  profile,
  workshops,
  isOpen,
  onClose,
  onNavigate
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && onNavigate) {
        onNavigate('prev');
      } else if (e.key === 'ArrowRight' && onNavigate) {
        onNavigate('next');
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, onNavigate]);

  if (!isOpen || !profile) return null;

  const { faculty, participations, statistics, enrichment } = profile;
  const fullName = `${faculty.firstName} ${faculty.lastName}`;

  // Create timeline visualization data
  const allYears = new Set<number>();
  Object.values(participations).flat().forEach(year => allYears.add(year));
  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);
  const yearRange = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-slideUp"
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h2 id="modal-title" className="text-2xl font-bold mb-1">{fullName}</h2>
          
          {enrichment?.professional && (
            <div className="text-white/90">
              {enrichment.professional.title && (
                <p className="text-lg">{enrichment.professional.title}</p>
              )}
              {enrichment.professional.affiliation && (
                <p className="text-sm">{enrichment.professional.affiliation}</p>
              )}
              {enrichment.professional.department && (
                <p className="text-sm">{enrichment.professional.department}</p>
              )}
            </div>
          )}
          
          {/* Confidence indicator */}
          {enrichment && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                ${enrichment.confidence === 'high' ? 'bg-green-200 text-green-800' : 
                  enrichment.confidence === 'medium' ? 'bg-yellow-200 text-yellow-800' : 
                  'bg-gray-200 text-gray-800'}`}>
                Data confidence: {enrichment.confidence}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {/* Links */}
          <div className="mb-6 flex flex-wrap gap-4">
            {enrichment?.professional?.labWebsite && (
              <a
                href={enrichment.professional.labWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Lab Website
              </a>
            )}
            
            {enrichment?.academic?.orcid && (
              <a
                href={`https://orcid.org/${enrichment.academic.orcid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.516.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.303v7.444h2.297c2.5 0 3.872-1.866 3.872-3.722 0-1.856-1.372-3.722-3.872-3.722h-2.297z"/>
                </svg>
                ORCID: {enrichment.academic.orcid}
              </a>
            )}
          </div>

          {/* Bio */}
          {enrichment?.profile?.shortBio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-gray-700">{enrichment.profile.shortBio}</p>
              {enrichment.profile.source && (
                <p className="text-xs text-gray-500 mt-1">Source: {enrichment.profile.source}</p>
              )}
            </div>
          )}

          {/* Statistics */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Teaching Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{statistics.totalYears}</p>
                <p className="text-sm text-gray-600">Total Years</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{statistics.workshopCount}</p>
                <p className="text-sm text-gray-600">Workshops</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{statistics.firstYear}</p>
                <p className="text-sm text-gray-600">First Year</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{statistics.lastYear}</p>
                <p className="text-sm text-gray-600">Last Year</p>
              </div>
            </div>
          </div>

          {/* Research Areas with Topics */}
          <div className="mb-6">
            <TopicDisplay profile={profile} variant="modal" />
          </div>

          {/* Workshop Participation */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Workshop Participation</h3>
            {Object.entries(participations).map(([workshopId, years]) => {
              const workshop = workshops[workshopId];
              if (!workshop) return null;

              const colors = {
                wog: 'bg-blue-500',
                wpsg: 'bg-purple-500',
                wphylo: 'bg-green-500'
              };

              return (
                <div key={workshopId} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{workshop.name}</h4>
                    <span className="text-sm text-gray-600">{years.length} years</span>
                  </div>
                  
                  {/* Timeline visualization */}
                  <div className="flex gap-1 mb-2 overflow-x-auto pb-2">
                    {yearRange.map(year => (
                      <div
                        key={year}
                        className={`w-6 h-6 rounded-sm flex-shrink-0 ${
                          years.includes(year) 
                            ? colors[workshopId as keyof typeof colors] || 'bg-gray-500'
                            : 'bg-gray-200'
                        }`}
                        title={year.toString()}
                      />
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Years: {years.sort((a, b) => a - b).join(', ')}
                  </p>
                </div>
              );
            })}
          </div>


          {/* Data Attribution */}
          {enrichment && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Professional information last updated: {new Date(enrichment.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* No enrichment fallback */}
          {!enrichment && (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600">Additional information not yet available for this faculty member.</p>
            </div>
          )}
          
          {/* Update Request Button - Always visible */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">
              {enrichment ? 'Is this information outdated or incorrect?' : 'Help us add information for this faculty member'}
            </p>
            <a
              href={`mailto:fourthculture@gmail.com?subject=Faculty Profile Update Request - ${fullName}&body=I would like to update my faculty profile information.%0A%0AName: ${fullName}%0AFaculty ID: ${faculty.id}%0A%0APlease send me the update form link.`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {enrichment ? 'Request Update' : 'Add Information'}
            </a>
          </div>
        </div>

        {/* Navigation buttons */}
        {onNavigate && (
          <div className="absolute top-1/2 -translate-y-1/2 flex justify-between w-full px-4 pointer-events-none">
            <button
              onClick={() => onNavigate('prev')}
              className="pointer-events-auto bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all"
              aria-label="Previous faculty member"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => onNavigate('next')}
              className="pointer-events-auto bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all"
              aria-label="Next faculty member"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};