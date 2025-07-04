import React from 'react';
import type { FacultyProfile, EnrichedFacultyProfile } from '../types';
import { TopicDisplay } from './TopicDisplay';
import { SearchHighlight } from './SearchHighlight';

interface FacultyCardProps {
  profile: FacultyProfile | EnrichedFacultyProfile;
  workshops: { [key: string]: { name: string; shortName: string } };
  onClick?: () => void;
  searchTerm?: string;
}

// Define workshop colors
const workshopColors = {
  wog: 'from-blue-500 to-cyan-600',
  wpsg: 'from-purple-500 to-pink-600',
  wphylo: 'from-green-500 to-emerald-600'
};

const workshopBadgeColors = {
  wog: 'bg-blue-100 text-blue-800 border-blue-200',
  wpsg: 'bg-purple-100 text-purple-800 border-purple-200',
  wphylo: 'bg-green-100 text-green-800 border-green-200'
};

export const FacultyCard: React.FC<FacultyCardProps> = ({ profile, workshops, onClick, searchTerm }) => {
  // Get primary workshop for gradient
  const primaryWorkshop = Object.keys(profile.participations)[0] || 'wog';
  const gradientClass = workshopColors[primaryWorkshop as keyof typeof workshopColors] || workshopColors.wog;
  
  return (
    <div 
      className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden animate-slide-up cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}>
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientClass}`}></div>
      
      <div className="p-6">
        {/* Header with name and years badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
              {profile.faculty.firstName} {profile.faculty.lastName}
            </h3>
            {profile.faculty.currentAffiliation && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">{profile.faculty.currentAffiliation}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${gradientClass} text-white shadow-sm`}>
              {profile.statistics.totalYears} {profile.statistics.totalYears === 1 ? 'year' : 'years'}
            </span>
          </div>
        </div>

        {/* Workshop participation */}
        <div className="space-y-3 mb-4">
          {Object.entries(profile.participations).map(([workshopId, years]) => {
            const badgeColor = workshopBadgeColors[workshopId as keyof typeof workshopBadgeColors] || workshopBadgeColors.wog;
            return (
              <div key={workshopId} className="group/workshop">
                <div className="flex items-center justify-between mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${badgeColor}`}>
                    {workshops[workshopId]?.shortName || workshopId}
                  </span>
                  <span className="text-xs text-gray-500">
                    {years.length} {years.length === 1 ? 'year' : 'years'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {years.map(year => (
                    <span
                      key={year}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-150"
                    >
                      {year}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Topics Display (if enriched profile) */}
        {'enrichment' in profile && (
          <TopicDisplay profile={profile as EnrichedFacultyProfile} variant="card" />
        )}
        
        {/* Search Highlight */}
        {searchTerm && 'enrichment' in profile && (
          <SearchHighlight profile={profile as EnrichedFacultyProfile} searchTerm={searchTerm} />
        )}

        {/* Footer with timeline info */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>First: {profile.statistics.firstYear}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <span>Latest: {profile.statistics.lastYear}</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};