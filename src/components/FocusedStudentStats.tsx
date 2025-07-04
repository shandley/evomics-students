import React, { useMemo } from 'react';
import type { StudentProfile, Workshop } from '../types/student';

interface FocusedStudentStatsProps {
  profiles: StudentProfile[];
  workshops: { [key: string]: Workshop };
}

export const FocusedStudentStats: React.FC<FocusedStudentStatsProps> = ({ profiles, workshops }) => {
  const stats = useMemo(() => {
    // Focus only on active workshops (the main 3)
    const focusedWorkshops = Object.keys(workshops).filter(id => workshops[id].active);
    
    // Filter profiles to only include those who participated in focused workshops
    const focusedProfiles = profiles.filter(profile => {
      return focusedWorkshops.some(workshopId => 
        profile.participations[workshopId] && profile.participations[workshopId].length > 0
      );
    });
    
    const countries = new Set<string>();
    const institutions = new Set<string>();
    let totalParticipations = 0;
    
    // Get all unique years across focused workshops only
    const allYears = new Set<number>();
    focusedProfiles.forEach(profile => {
      focusedWorkshops.forEach(workshopId => {
        if (profile.participations[workshopId]) {
          profile.participations[workshopId].forEach(year => allYears.add(year));
        }
      });
    });
    const yearRange = allYears.size > 0 
      ? Math.max(...allYears) - Math.min(...allYears) + 1 
      : 0;

    focusedProfiles.forEach(profile => {
      countries.add(profile.student.country);
      institutions.add(profile.student.institution);
      // Count only participations in focused workshops
      focusedWorkshops.forEach(workshopId => {
        if (profile.participations[workshopId]) {
          totalParticipations += profile.participations[workshopId].length;
        }
      });
    });

    // Calculate average students per year
    const avgStudentsPerYear = yearRange > 0
      ? (totalParticipations / yearRange).toFixed(0)
      : '0';

    // Count students by focused workshop only
    const workshopCounts = focusedWorkshops.reduce((acc, workshopId) => {
      acc[workshopId] = profiles.filter(p => p.participations[workshopId]?.length > 0).length;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalStudents: focusedProfiles.length,
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
      {/* Top Stats Grid - core metrics only */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      </div>
    </div>
  );
};