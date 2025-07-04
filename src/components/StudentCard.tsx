import React from 'react';
import type { StudentProfile, Workshop } from '../types/student';

interface StudentCardProps {
  profile: StudentProfile;
  workshops: { [key: string]: Workshop };
  searchTerm?: string;
}

const workshopColors = {
  WoG: 'bg-blue-100 text-blue-800 border-blue-200',
  WPSG: 'bg-purple-100 text-purple-800 border-purple-200',  // Fixed: Purple to match faculty dashboard
  WPhylo: 'bg-green-100 text-green-800 border-green-200',   // Fixed: Green to match faculty dashboard
  WME: 'bg-orange-100 text-orange-800 border-orange-200',
  WCG: 'bg-pink-100 text-pink-800 border-pink-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200'
};

export const StudentCard: React.FC<StudentCardProps> = ({
  profile,
  workshops,
  searchTerm
}) => {
  const { student, participations, statistics } = profile;

  // Get workshop participation details
  const workshopParticipations = Object.entries(participations)
    .filter(([_, years]) => years.length > 0)
    .map(([workshopId, years]) => ({
      workshop: workshops[workshopId],
      years: years.sort((a, b) => b - a) // Most recent first
    }))
    .sort((a, b) => Math.max(...b.years) - Math.max(...a.years));

  // Highlight search terms
  const highlightText = (text: string, searchTerm?: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-primary-200 transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
              {highlightText(`${student.firstName} ${student.lastName}`, searchTerm)}
            </h3>
            <p className="text-sm text-gray-600 truncate" title={student.institution}>
              {highlightText(student.institution, searchTerm)}
            </p>
            <p className="text-sm text-gray-500">
              {highlightText(student.country, searchTerm)}
            </p>
          </div>
          
          {/* Stats Badge */}
          <div className="flex-shrink-0 text-center">
            <div className="text-lg font-bold text-primary-600">
              {statistics.totalYears}
            </div>
            <div className="text-xs text-gray-500">
              {statistics.totalYears === 1 ? 'year' : 'years'}
            </div>
          </div>
        </div>
      </div>

      {/* Workshop Badges */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-1.5">
          {workshopParticipations.map(({ workshop, years }, index) => {
            const colorClass = workshopColors[workshop?.shortName as keyof typeof workshopColors] || workshopColors.default;
            
            return (
              <div
                key={`${workshop?.id}-${index}`}
                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${colorClass}`}
                title={`${workshop?.name}: ${years.join(', ')}`}
              >
                <span className="font-semibold">{workshop?.shortName}</span>
                <span className="ml-1 opacity-75">
                  {years.length > 1 ? `${years.length}x` : years[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {statistics.workshopCount} {statistics.workshopCount === 1 ? 'workshop' : 'workshops'}
          </span>
          <span>
            {statistics.firstYear}
            {statistics.firstYear !== statistics.lastYear && ` - ${statistics.lastYear}`}
          </span>
        </div>
      </div>
    </div>
  );
};