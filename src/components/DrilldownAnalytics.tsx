import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TreeMap, Cell } from 'recharts';
import type { StudentProfile } from '../types/student';

interface DrilldownAnalyticsProps {
  profiles: StudentProfile[];
  workshops: { [key: string]: any };
}

export const DrilldownAnalytics: React.FC<DrilldownAnalyticsProps> = ({ 
  profiles, 
  workshops 
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>('all');

  const analyticsData = useMemo(() => {
    // Filter by selected workshop if specified
    const filteredProfiles = selectedWorkshop === 'all' 
      ? profiles 
      : profiles.filter(p => p.participations[selectedWorkshop]?.length > 0);

    // Country statistics
    const countryStats: { [country: string]: {
      students: number;
      institutions: Set<string>;
      workshopBreakdown: { [workshopId: string]: number };
    }} = {};

    filteredProfiles.forEach(profile => {
      const country = profile.student.country;
      if (!countryStats[country]) {
        countryStats[country] = {
          students: 0,
          institutions: new Set(),
          workshopBreakdown: {}
        };
      }
      
      countryStats[country].students++;
      countryStats[country].institutions.add(profile.student.institution);
      
      Object.keys(profile.participations).forEach(workshopId => {
        if (profile.participations[workshopId].length > 0) {
          countryStats[country].workshopBreakdown[workshopId] = 
            (countryStats[country].workshopBreakdown[workshopId] || 0) + 1;
        }
      });
    });

    const topCountries = Object.entries(countryStats)
      .map(([country, stats]) => ({
        country,
        students: stats.students,
        institutions: stats.institutions.size,
        diversity: (stats.institutions.size / stats.students * 100).toFixed(1)
      }))
      .sort((a, b) => b.students - a.students)
      .slice(0, 15);

    // Institution statistics for selected country
    let institutionStats: any[] = [];
    if (selectedCountry) {
      const institutionCounts: { [institution: string]: number } = {};
      filteredProfiles
        .filter(p => p.student.country === selectedCountry)
        .forEach(profile => {
          institutionCounts[profile.student.institution] = 
            (institutionCounts[profile.student.institution] || 0) + 1;
        });

      institutionStats = Object.entries(institutionCounts)
        .map(([institution, count]) => ({ institution, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    // Institution diversity treemap data
    const institutionTreemapData = Object.entries(
      filteredProfiles.reduce((acc, profile) => {
        const key = `${profile.student.country} - ${profile.student.institution}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number })
    )
    .map(([name, value]) => ({ name, value, size: value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);

    return {
      topCountries,
      institutionStats,
      institutionTreemapData,
      countryStats
    };
  }, [profiles, selectedWorkshop, selectedCountry]);

  const COLORS = ['#2563eb', '#9333ea', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workshop Filter</label>
            <select
              value={selectedWorkshop}
              onChange={(e) => setSelectedWorkshop(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Workshops</option>
              {Object.entries(workshops).map(([id, workshop]) => (
                <option key={id} value={id}>{workshop.shortName}</option>
              ))}
            </select>
          </div>
          
          {selectedCountry && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selected Country</label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                  {selectedCountry}
                </span>
                <button
                  onClick={() => setSelectedCountry(null)}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Countries by Student Count
            {selectedWorkshop !== 'all' && ` (${workshops[selectedWorkshop]?.shortName})`}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.topCountries} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="country" 
                  type="category" 
                  width={80}
                  fontSize={12}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-medium text-gray-900">{label}</p>
                          <p className="text-sm text-gray-600">Students: {data.students}</p>
                          <p className="text-sm text-gray-600">Institutions: {data.institutions}</p>
                          <p className="text-sm text-gray-600">Diversity: {data.diversity}%</p>
                          <p className="text-xs text-blue-600 mt-1 cursor-pointer">
                            Click bar to drill down →
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="students" 
                  fill="#3b82f6"
                  onClick={(data) => setSelectedCountry(data.country)}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Click on any country bar to see institutional breakdown below.
          </p>
        </div>

        {/* Institution Breakdown for Selected Country */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedCountry 
              ? `Institutions in ${selectedCountry}`
              : 'Select a country to view institutions'
            }
          </h3>
          
          {selectedCountry ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.institutionStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="institution" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={10}
                  />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
                            <p className="font-medium text-gray-900 text-sm">{label}</p>
                            <p className="text-sm text-gray-600">Students: {payload[0].value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#9333ea" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p>Click on a country above to see institutional breakdown</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Institution Diversity Treemap */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Institutional Diversity Overview
          {selectedWorkshop !== 'all' && ` (${workshops[selectedWorkshop]?.shortName})`}
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <TreeMap
              data={analyticsData.institutionTreemapData}
              dataKey="size"
              ratio={4/3}
              stroke="#fff"
              fill="#8884d8"
            >
              {analyticsData.institutionTreemapData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </TreeMap>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Treemap showing relative sizes of institutional participation. Larger blocks = more students from that institution.
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analyticsData.topCountries.length}
            </div>
            <div className="text-sm text-gray-600">Countries Shown</div>
            <div className="text-xs text-gray-500 mt-1">
              (Top {analyticsData.topCountries.length} by student count)
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {selectedCountry ? analyticsData.institutionStats.length : analyticsData.institutionTreemapData.length}
            </div>
            <div className="text-sm text-gray-600">
              {selectedCountry ? 'Institutions in Country' : 'Top Institutions'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {selectedCountry ? `(in ${selectedCountry})` : '(globally)'}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {(analyticsData.topCountries.reduce((sum, country) => sum + parseFloat(country.diversity), 0) / analyticsData.topCountries.length).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Avg. Institutional Diversity</div>
            <div className="text-xs text-gray-500 mt-1">
              (institutions per student ratio)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};