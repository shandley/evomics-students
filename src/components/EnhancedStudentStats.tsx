import React, { useMemo } from 'react';
import type { StudentProfile, Workshop } from '../types/student';

interface EnhancedStudentStatsProps {
  profiles: StudentProfile[];
  workshops: { [key: string]: Workshop };
}

export const EnhancedStudentStats: React.FC<EnhancedStudentStatsProps> = ({ profiles, workshops }) => {
  const stats = useMemo(() => {
    const countries = new Set<string>();
    const institutions = new Set<string>();
    const workshopParticipation: { [key: string]: number } = {};
    let totalParticipations = 0;
    
    // Get current year for "recent" calculations
    const currentYear = new Date().getFullYear();
    
    // Get all unique years across all workshops
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
      
      // Count workshop participations
      Object.entries(profile.participations).forEach(([workshopId, years]) => {
        if (years.length > 0) {
          workshopParticipation[workshopId] = (workshopParticipation[workshopId] || 0) + years.length;
          totalParticipations += years.length;
        }
      });
    });

    // Calculate average years per student
    const avgYears = profiles.length > 0
      ? (profiles.reduce((sum, p) => sum + p.statistics.totalYears, 0) / profiles.length).toFixed(1)
      : '0';

    // Count students by workshop (similar to faculty site)
    const workshopCounts = Object.keys(workshops).reduce((acc, workshopId) => {
      acc[workshopId] = profiles.filter(p => p.participations[workshopId]?.length > 0).length;
      return acc;
    }, {} as { [key: string]: number });

    // Find most popular workshop
    const popularWorkshop = Object.entries(workshopCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalStudents: profiles.length,
      totalCountries: countries.size,
      totalInstitutions: institutions.size,
      totalParticipations,
      yearRange,
      avgYears,
      workshopCounts,
      popularWorkshop: popularWorkshop ? {
        name: workshops[popularWorkshop[0]]?.shortName || popularWorkshop[0],
        count: popularWorkshop[1]
      } : null,
      workshopBreakdown: Object.entries(workshopCounts)
        .map(([workshopId, count]) => ({
          workshop: workshops[workshopId],
          count,
          percentage: ((count / profiles.length) * 100).toFixed(0)
        }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count)
    };
  }, [profiles, workshops]);

  return (
    <div className="mb-8">
      {/* Top Stats Grid - matching faculty site exactly */}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Workshops</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{Object.values(workshops).filter(w => w.active).length}</p>
              <p className="text-sm text-gray-500 mt-1">Current series</p>
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
              <p className="text-sm font-medium text-gray-600">Avg. Years/Student</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.avgYears}</p>
              <p className="text-sm text-gray-500 mt-1">Participation depth</p>
            </div>
            <div className="text-orange-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Workshop Breakdown - matching faculty site style */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Students by Workshop</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {stats.workshopBreakdown.map(({ workshop, count, percentage }) => {
            // Use same color scheme as faculty site
            const getWorkshopColor = (shortName: string) => {
              switch (shortName) {
                case 'WoG': return 'text-blue-600';
                case 'WPSG': return 'text-purple-600';
                case 'WPhylo': return 'text-green-600';
                default: return 'text-gray-600';
              }
            };

            return (
              <div key={workshop?.id} className="text-center">
                <div className={`text-4xl font-bold ${getWorkshopColor(workshop?.shortName || '')}`}>
                  {count}
                </div>
                <div className="font-medium text-gray-900 mt-1">{workshop?.shortName}</div>
                <div className="text-sm text-gray-600 mt-1">{workshop?.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {percentage}% of total
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};