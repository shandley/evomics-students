import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import type { StudentProfile } from '../types/student';

interface WorkshopComparisonsProps {
  profiles: StudentProfile[];
  workshops: { [key: string]: any };
}

export const WorkshopComparisons: React.FC<WorkshopComparisonsProps> = ({ 
  profiles, 
  workshops 
}) => {
  const workshopData = useMemo(() => {
    const data = {
      participation: [] as any[],
      geographic: [] as any[],
      crossWorkshop: [] as any[]
    };

    // Workshop participation breakdown
    const workshopCounts = { wog: 0, wpsg: 0, wphylo: 0 };
    const workshopCountries: { [key: string]: Set<string> } = { wog: new Set(), wpsg: new Set(), wphylo: new Set() };
    
    profiles.forEach(profile => {
      Object.keys(profile.participations).forEach(workshopId => {
        if (profile.participations[workshopId].length > 0) {
          if (workshopId in workshopCounts) {
            workshopCounts[workshopId as keyof typeof workshopCounts]++;
            workshopCountries[workshopId].add(profile.student.country);
          }
        }
      });
    });

    // Participation pie chart data
    data.participation = Object.entries(workshopCounts).map(([id, count]) => ({
      name: workshops[id]?.shortName || id,
      value: count,
      color: id === 'wog' ? '#2563eb' : id === 'wpsg' ? '#9333ea' : '#059669'
    }));

    // Geographic diversity by workshop
    data.geographic = Object.entries(workshopCountries).map(([id, countries]) => ({
      workshop: workshops[id]?.shortName || id,
      countries: countries.size,
      students: workshopCounts[id as keyof typeof workshopCounts],
      diversity: (countries.size / workshopCounts[id as keyof typeof workshopCounts] * 100).toFixed(1)
    }));

    // Cross-workshop participation analysis
    const crossParticipation: { [key: string]: number } = {};
    profiles.forEach(profile => {
      const participatedWorkshops = Object.keys(profile.participations)
        .filter(id => profile.participations[id].length > 0 && id in workshopCounts)
        .sort();
      
      if (participatedWorkshops.length > 0) {
        const key = participatedWorkshops.join(' + ');
        crossParticipation[key] = (crossParticipation[key] || 0) + 1;
      }
    });

    data.crossWorkshop = Object.entries(crossParticipation)
      .map(([combination, count]) => ({
        combination,
        count,
        percentage: ((count / profiles.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);

    return data;
  }, [profiles, workshops]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name || data.workshop || data.combination}</p>
          <p className="text-sm text-gray-600">
            {data.value ? `Students: ${data.value}` : 
             data.students ? `Students: ${data.students}` :
             `Count: ${data.count}`}
          </p>
          {data.countries && (
            <p className="text-sm text-gray-600">Countries: {data.countries}</p>
          )}
          {data.percentage && (
            <p className="text-sm text-gray-600">Percentage: {data.percentage}%</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Workshop Participation Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workshop Participation Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={workshopData.participation}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {workshopData.participation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Distribution of student participation across the three core workshops.
        </p>
      </div>

      {/* Geographic Diversity by Workshop */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Diversity by Workshop</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workshopData.geographic}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="workshop" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="countries" fill="#3b82f6" name="Countries" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Number of countries represented in each workshop series.
        </p>
      </div>

      {/* Cross-Workshop Participation */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cross-Workshop Participation Patterns</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workshopData.crossWorkshop}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="combination" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#059669" name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Shows how students participate across multiple workshops. Single workshop participation vs. cross-workshop engagement patterns.
        </p>
      </div>

      {/* Top Countries Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Participating Countries</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.keys(workshops).map(workshopId => {
            const countryStats: { [country: string]: number } = {};
            
            profiles.forEach(profile => {
              if (profile.participations[workshopId]?.length > 0) {
                countryStats[profile.student.country] = (countryStats[profile.student.country] || 0) + 1;
              }
            });

            const topCountries = Object.entries(countryStats)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5);

            const workshopColor = workshopId === 'wog' ? 'border-blue-200 bg-blue-50' :
                                workshopId === 'wpsg' ? 'border-purple-200 bg-purple-50' :
                                'border-green-200 bg-green-50';

            return (
              <div key={workshopId} className={`border rounded-lg p-4 ${workshopColor}`}>
                <h4 className="font-medium text-gray-900 mb-3">{workshops[workshopId]?.shortName}</h4>
                <div className="space-y-2">
                  {topCountries.map(([country, count], index) => (
                    <div key={country} className="flex justify-between text-sm">
                      <span className="text-gray-600">{index + 1}. {country}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};