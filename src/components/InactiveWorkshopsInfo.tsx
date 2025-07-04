import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { StudentProfile } from '../types/student';

interface InactiveWorkshopsInfoProps {
  profiles: StudentProfile[];
  workshops: { [key: string]: any };
}

export const InactiveWorkshopsInfo: React.FC<InactiveWorkshopsInfoProps> = ({ 
  profiles, 
  workshops 
}) => {
  const inactiveWorkshopData = useMemo(() => {
    // Get inactive workshops with significant participation (≥50 students)
    const inactiveWorkshops = Object.entries(workshops)
      .filter(([id, workshop]) => !workshop.active)
      .map(([id, workshop]) => {
        // Count unique students for this workshop
        const uniqueStudents = profiles.filter(p => p.participations[id]?.length > 0).length;
        
        // Get year range
        const years = new Set<number>();
        profiles.forEach(profile => {
          if (profile.participations[id]?.length > 0) {
            profile.participations[id].forEach(year => years.add(year));
          }
        });
        const yearArray = Array.from(years).sort();
        
        // Count countries
        const countries = new Set<string>();
        profiles.forEach(profile => {
          if (profile.participations[id]?.length > 0) {
            countries.add(profile.student.country);
          }
        });
        
        return {
          id,
          workshop,
          uniqueStudents,
          yearRange: yearArray.length > 0 ? `${yearArray[0]} - ${yearArray[yearArray.length - 1]}` : 'N/A',
          totalYears: yearArray.length,
          countries: countries.size,
          peakYear: yearArray.length > 0 ? yearArray.reduce((peak, year) => {
            const yearCount = profiles.filter(p => p.participations[id]?.includes(year)).length;
            const peakCount = profiles.filter(p => p.participations[peak]?.includes(peak)).length;
            return yearCount > peakCount ? year : peak;
          }, yearArray[0]) : null
        };
      })
      .filter(data => data.uniqueStudents >= 50) // Only show workshops with significant participation
      .sort((a, b) => b.uniqueStudents - a.uniqueStudents);

    // Create timeline data for visualization
    const timelineData = inactiveWorkshops.map(data => ({
      workshop: data.workshop.shortName,
      students: data.uniqueStudents,
      years: data.totalYears,
      countries: data.countries
    }));

    return { inactiveWorkshops, timelineData };
  }, [profiles, workshops]);

  if (inactiveWorkshopData.inactiveWorkshops.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Historical Workshop Series</h2>
        <p className="text-gray-600">
          No inactive workshops with significant participation data found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Historical Workshop Series</h2>
        <p className="text-gray-600">
          Legacy workshops that have contributed significantly to the Evomics community. 
          These workshops are no longer active but represent important chapters in genomics education history.
        </p>
      </div>

      {/* Overview Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Participation Overview</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inactiveWorkshopData.timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="workshop" />
              <YAxis />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-medium text-gray-900">{label}</p>
                        <p className="text-sm text-gray-600">Students: {data.students}</p>
                        <p className="text-sm text-gray-600">Active Years: {data.years}</p>
                        <p className="text-sm text-gray-600">Countries: {data.countries}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="students" fill="#6b7280" name="Total Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Historical workshops with 50+ student participants, showing their contribution to the Evomics community.
        </p>
      </div>

      {/* Individual Workshop Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {inactiveWorkshopData.inactiveWorkshops.map((data, index) => {
          const colorMap = [
            'border-slate-200 bg-slate-50',
            'border-gray-200 bg-gray-50', 
            'border-zinc-200 bg-zinc-50',
            'border-stone-200 bg-stone-50'
          ];
          
          return (
            <div key={data.id} className={`border rounded-lg p-6 ${colorMap[index % colorMap.length]} relative`}>
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Inactive
                </span>
              </div>
              
              <div className="pr-16"> {/* Add padding for the badge */}
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {data.workshop.shortName}
                </h4>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {data.workshop.description}
                </p>
                
                <div className="space-y-3">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-xl font-bold text-gray-700">{data.uniqueStudents}</div>
                      <div className="text-xs text-gray-500">Students</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-xl font-bold text-gray-700">{data.countries}</div>
                      <div className="text-xs text-gray-500">Countries</div>
                    </div>
                  </div>
                  
                  {/* Timeline Info */}
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Active Period</div>
                    <div className="text-sm text-gray-600">{data.yearRange}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {data.totalYears} year{data.totalYears !== 1 ? 's' : ''} of operation
                    </div>
                  </div>
                  
                  {/* Started Year */}
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Established</div>
                    <div className="text-sm text-gray-600">{data.workshop.startYear}</div>
                    {data.workshop.startYear && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date().getFullYear() - data.workshop.startYear} years ago
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Impact Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">
              {inactiveWorkshopData.inactiveWorkshops.length}
            </div>
            <div className="text-sm text-gray-600">Legacy Workshops</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">
              {inactiveWorkshopData.inactiveWorkshops.reduce((sum, workshop) => sum + workshop.uniqueStudents, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Alumni</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">
              {Math.max(...inactiveWorkshopData.inactiveWorkshops.map(w => w.countries))}
            </div>
            <div className="text-sm text-gray-600">Max Countries (Single Workshop)</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">
              {inactiveWorkshopData.inactiveWorkshops.reduce((sum, workshop) => sum + workshop.totalYears, 0)}
            </div>
            <div className="text-sm text-gray-600">Combined Active Years</div>
          </div>
        </div>
      </div>
    </div>
  );
};