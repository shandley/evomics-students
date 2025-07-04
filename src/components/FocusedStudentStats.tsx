import React, { useMemo } from 'react';
import type { StudentProfile, Workshop } from '../types/student';

interface FocusedStudentStatsProps {
  profiles: StudentProfile[];
  workshops: { [key: string]: Workshop };
}

export const FocusedStudentStats: React.FC<FocusedStudentStatsProps> = ({ profiles, workshops }) => {
  const stats = useMemo(() => {
    const countries = new Set<string>();
    const institutions = new Set<string>();
    let totalParticipations = 0;
    
    // Get all unique years across focused workshops
    const allYears = new Set<number>();
    profiles.forEach(profile => {
      Object.values(profile.participations).flat().forEach(year => allYears.add(year));
    });
    const yearRange = allYears.size > 0 
      ? Math.max(...allYears) - Math.min(...allYears) + 1 
      : 0;

    profiles.forEach(profile => {
      countries.add(profile.student.country);
      institutions.add(profile.student.institution);
      totalParticipations += profile.statistics.totalYears;
    });

    // Calculate average students per year
    const avgStudentsPerYear = yearRange > 0
      ? (totalParticipations / yearRange).toFixed(0)
      : '0';

    // Count students by workshop (matching faculty site exactly)
    const workshopCounts = Object.keys(workshops).reduce((acc, workshopId) => {
      acc[workshopId] = profiles.filter(p => p.participations[workshopId]?.length > 0).length;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalStudents: profiles.length,
      totalCountries: countries.size,
      totalInstitutions: institutions.size,
      totalParticipations,
      yearRange,
      avgStudentsPerYear,
      workshopCounts
    };
  }, [profiles, workshops]);

  // Workshop details matching faculty site order and colors
  const workshopDetails = [
    {
      id: 'wog',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'wpsg', 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'wphylo',
      color: 'text-green-600', 
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <div className="mb-8">
      {/* Top Stats Grid - expanded to include workshop stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
              <p className="text-sm text-gray-500 mt-1">Across all workshops</p>
            </div>
            <div className="text-primary-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Workshops</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">3</p>
              <p className="text-sm text-gray-500 mt-1">Core series</p>
            </div>
            <div className="text-secondary-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Years of Excellence</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.yearRange}</p>
              <p className="text-sm text-gray-500 mt-1">Continuous education</p>
            </div>
            <div className="text-green-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Students/Year</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.avgStudentsPerYear}</p>
              <p className="text-sm text-gray-500 mt-1">Annual participation</p>
            </div>
            <div className="text-orange-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Workshop Statistics as compact cards */}
        {workshopDetails.map((detail) => {
          const workshop = workshops[detail.id];
          const count = stats.workshopCounts[detail.id] || 0;
          const percentage = stats.totalStudents > 0 
            ? Math.round((count / stats.totalStudents) * 100)
            : 0;

          // Workshop-specific icons
          const workshopIcon = detail.id === 'wog' 
            ? <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            : detail.id === 'wpsg'
            ? <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            : <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 012-2h6.5l4.5 4.5" />
              </svg>;

          return (
            <div key={detail.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{workshop?.shortName}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{count}</p>
                  <p className="text-sm text-gray-500 mt-1">{percentage}% of total</p>
                </div>
                <div className={detail.color}>
                  {workshopIcon}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};