import React, { useMemo } from 'react';
import type { StudentProfile, Workshop } from '../types/student';

interface StudentStatsProps {
  profiles: StudentProfile[];
  workshops: { [key: string]: Workshop };
}

export const StudentStats: React.FC<StudentStatsProps> = ({ profiles, workshops }) => {
  const stats = useMemo(() => {
    const countries = new Set<string>();
    const institutions = new Set<string>();
    const workshopParticipation: { [key: string]: number } = {};
    let totalParticipations = 0;
    
    // Get current year for "recent" calculations
    const currentYear = new Date().getFullYear();
    let recentStudents = 0;

    profiles.forEach(profile => {
      countries.add(profile.student.country);
      institutions.add(profile.student.institution);
      
      // Count workshop participations
      Object.entries(profile.participations).forEach(([workshopId, years]) => {
        if (years.length > 0) {
          workshopParticipation[workshopId] = (workshopParticipation[workshopId] || 0) + years.length;
          totalParticipations += years.length;
          
          // Count recent participants (last 3 years)
          if (years.some(year => year >= currentYear - 3)) {
            recentStudents++;
          }
        }
      });
    });

    // Find most popular workshop
    const popularWorkshop = Object.entries(workshopParticipation)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalStudents: profiles.length,
      totalCountries: countries.size,
      totalInstitutions: institutions.size,
      totalParticipations,
      recentStudents,
      popularWorkshop: popularWorkshop ? {
        name: workshops[popularWorkshop[0]]?.shortName || popularWorkshop[0],
        count: popularWorkshop[1]
      } : null,
      workshopBreakdown: Object.entries(workshopParticipation)
        .map(([workshopId, count]) => ({
          workshop: workshops[workshopId],
          count
        }))
        .sort((a, b) => b.count - a.count)
    };
  }, [profiles, workshops]);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: { value: string; positive?: boolean };
  }> = ({ title, value, subtitle, icon, trend }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.positive ? 'text-green-600' : 'text-blue-600'}`}>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className="text-primary-600">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle="Across all workshops"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
        />

        <StatCard
          title="Countries Represented"
          value={stats.totalCountries}
          subtitle="Global participation"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Institutions"
          value={stats.totalInstitutions}
          subtitle="Academic diversity"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />

        <StatCard
          title="Total Participations"
          value={stats.totalParticipations}
          subtitle={`Avg ${(stats.totalParticipations / stats.totalStudents).toFixed(1)} per student`}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* Workshop Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workshop Participation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.workshopBreakdown.map(({ workshop, count }) => {
            const percentage = ((count / stats.totalParticipations) * 100).toFixed(1);
            
            return (
              <div key={workshop?.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{workshop?.shortName}</div>
                  <div className="text-sm text-gray-600" title={workshop?.name}>
                    {workshop?.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary-600">{count}</div>
                  <div className="text-xs text-gray-500">{percentage}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};