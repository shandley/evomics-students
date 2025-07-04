import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';
import type { StudentProfile } from '../types/student';

interface InteractiveTimelineProps {
  profiles: StudentProfile[];
  workshops: { [key: string]: any };
}

// Import the raw student data to access location information
import studentData from '../data/studentData.json';

export const InteractiveTimeline: React.FC<InteractiveTimelineProps> = ({ 
  profiles, 
  workshops 
}) => {
  const [showLocationBreakdown, setShowLocationBreakdown] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const timelineData = useMemo(() => {
    const yearData: { [year: number]: { 
      year: number;
      total: number;
      wog: number;
      wpsg: number;
      wphylo: number;
    }} = {};

    // Track unique students per year per workshop
    const uniqueStudentsByYearWorkshop: { [year: number]: { [workshopId: string]: Set<string> } } = {};

    profiles.forEach(profile => {
      Object.entries(profile.participations).forEach(([workshopId, years]) => {
        years.forEach(year => {
          if (!uniqueStudentsByYearWorkshop[year]) {
            uniqueStudentsByYearWorkshop[year] = {};
          }
          if (!uniqueStudentsByYearWorkshop[year][workshopId]) {
            uniqueStudentsByYearWorkshop[year][workshopId] = new Set();
          }
          uniqueStudentsByYearWorkshop[year][workshopId].add(profile.student.id);
        });
      });
    });

    // Convert to counts
    Object.entries(uniqueStudentsByYearWorkshop).forEach(([yearStr, workshops]) => {
      const year = parseInt(yearStr);
      yearData[year] = { year, total: 0, wog: 0, wpsg: 0, wphylo: 0 };
      
      Object.entries(workshops).forEach(([workshopId, studentSet]) => {
        const count = studentSet.size;
        if (workshopId === 'wog') yearData[year].wog = count;
        else if (workshopId === 'wpsg') yearData[year].wpsg = count;
        else if (workshopId === 'wphylo') yearData[year].wphylo = count;
      });
      
      // Total is sum of workshop participations (can be > unique students if students attend multiple workshops)
      yearData[year].total = yearData[year].wog + yearData[year].wpsg + yearData[year].wphylo;
    });

    return Object.values(yearData).sort((a, b) => a.year - b.year);
  }, [profiles]);

  // Location breakdown analysis using raw participation data
  const locationData = useMemo(() => {
    const locationsByYear: { [year: number]: { [location: string]: { [workshopId: string]: number } } } = {};
    
    // Process raw participations to get location data
    studentData.participations.forEach(participation => {
      const { year, location, workshopId } = participation;
      
      // Only include focused workshops
      if (!['wog', 'wpsg', 'wphylo'].includes(workshopId)) return;
      
      if (!locationsByYear[year]) locationsByYear[year] = {};
      if (!locationsByYear[year][location]) locationsByYear[year][location] = {};
      
      locationsByYear[year][location][workshopId] = (locationsByYear[year][location][workshopId] || 0) + 1;
    });

    return locationsByYear;
  }, []);

  // Location breakdown for selected year
  const selectedYearLocationData = useMemo(() => {
    if (!selectedYear || !locationData[selectedYear]) return [];
    
    return Object.entries(locationData[selectedYear]).map(([location, workshops]) => {
      const total = Object.values(workshops).reduce((sum: number, count: number) => sum + count, 0);
      return {
        location: location.length > 30 ? location.substring(0, 30) + '...' : location,
        fullLocation: location,
        total,
        ...workshops
      };
    }).sort((a, b) => b.total - a.total);
  }, [selectedYear, locationData]);

  const cumulativeData = useMemo(() => {
    const uniqueStudentsByYear: { [year: number]: Set<string> } = {};
    
    profiles.forEach(profile => {
      Object.values(profile.participations).forEach(years => {
        years.forEach(year => {
          if (!uniqueStudentsByYear[year]) {
            uniqueStudentsByYear[year] = new Set();
          }
          uniqueStudentsByYear[year].add(profile.student.id);
        });
      });
    });

    const sortedYears = Object.keys(uniqueStudentsByYear).map(Number).sort();
    let cumulativeStudents = 0;
    const allStudentsSeen = new Set<string>();

    return sortedYears.map(year => {
      // Add new students from this year
      uniqueStudentsByYear[year].forEach(studentId => {
        if (!allStudentsSeen.has(studentId)) {
          allStudentsSeen.add(studentId);
          cumulativeStudents++;
        }
      });

      return {
        year,
        cumulativeStudents,
        newStudents: uniqueStudentsByYear[year].size
      };
    });
  }, [profiles]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const year = parseInt(label);
      const locationCount = locationData[year] ? Object.keys(locationData[year]).length : 0;
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Year: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey === 'wog' ? 'WoG' : 
                 entry.dataKey === 'wpsg' ? 'WPSG' : 
                 entry.dataKey === 'wphylo' ? 'WPhylo' : 
                 entry.name}: ${entry.value}`}
            </p>
          ))}
          {locationCount > 0 && (
            <p className="text-xs text-gray-500 mt-1 border-t pt-1">
              {locationCount} location{locationCount !== 1 ? 's' : ''} • Click year to see breakdown
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Timeline Analysis</h3>
          <div className="flex items-center gap-4">
            {selectedYear && (
              <button
                onClick={() => setSelectedYear(null)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Selection
              </button>
            )}
            <button
              onClick={() => setShowLocationBreakdown(!showLocationBreakdown)}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                showLocationBreakdown
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              {showLocationBreakdown ? 'Hide' : 'Show'} Location Analysis
            </button>
          </div>
        </div>
        {selectedYear && (
          <div className="mt-2 text-sm text-gray-600">
            Showing location breakdown for {selectedYear}
          </div>
        )}
      </div>

      {/* Annual Participation Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Annual Workshop Participation</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="year" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="wog" 
                stroke="#2563eb" 
                strokeWidth={3}
                name="WoG"
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4, cursor: 'pointer' }}
                onClick={(data) => setSelectedYear(data.year)}
              />
              <Line 
                type="monotone" 
                dataKey="wpsg" 
                stroke="#9333ea" 
                strokeWidth={3}
                name="WPSG"
                dot={{ fill: '#9333ea', strokeWidth: 2, r: 4, cursor: 'pointer' }}
                onClick={(data) => setSelectedYear(data.year)}
              />
              <Line 
                type="monotone" 
                dataKey="wphylo" 
                stroke="#059669" 
                strokeWidth={3}
                name="WPhylo"
                dot={{ fill: '#059669', strokeWidth: 2, r: 4, cursor: 'pointer' }}
                onClick={(data) => setSelectedYear(data.year)}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Track participation trends across the three core workshop series over time.
        </p>
      </div>

      {/* Cumulative Student Growth */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cumulative Student Community Growth</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="year" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-medium text-gray-900">{`Year: ${label}`}</p>
                        <p className="text-sm text-blue-600">
                          {`New Students: ${payload.find((p: any) => p.dataKey === 'newStudents')?.value || 0}`}
                        </p>
                        <p className="text-sm text-green-600">
                          {`Total Alumni: ${payload.find((p: any) => p.dataKey === 'cumulativeStudents')?.value || 0}`}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar 
                dataKey="newStudents" 
                fill="#3b82f6" 
                name="New Students"
                radius={[2, 2, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="cumulativeStudents" 
                stroke="#059669" 
                strokeWidth={3}
                name="Total Alumni"
                dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Shows how the Evomics student community has grown over time, with new students each year and cumulative alumni count.
        </p>
      </div>

      {/* Location Breakdown */}
      {showLocationBreakdown && selectedYear && selectedYearLocationData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Workshop Locations in {selectedYear}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Location Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedYearLocationData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="location" 
                    type="category" 
                    width={100}
                    fontSize={10}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-sm">
                            <p className="font-medium text-gray-900 text-sm">{data.fullLocation}</p>
                            <p className="text-sm text-gray-600">Total: {data.total} students</p>
                            <div className="mt-1 space-y-1">
                              {data.wog && <p className="text-xs text-blue-600">WoG: {data.wog}</p>}
                              {data.wpsg && <p className="text-xs text-purple-600">WPSG: {data.wpsg}</p>}
                              {data.wphylo && <p className="text-xs text-green-600">WPhylo: {data.wphylo}</p>}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Location Summary */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Location Summary</h4>
              <div className="space-y-3">
                {selectedYearLocationData.map((location, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-3">
                    <div className="font-medium text-sm text-gray-900">
                      {location.fullLocation}
                    </div>
                    <div className="text-sm text-gray-600">
                      {location.total} students total
                    </div>
                    <div className="flex gap-4 text-xs mt-1">
                      {location.wog && (
                        <span className="text-blue-600">WoG: {location.wog}</span>
                      )}
                      {location.wpsg && (
                        <span className="text-purple-600">WPSG: {location.wpsg}</span>
                      )}
                      {location.wphylo && (
                        <span className="text-green-600">WPhylo: {location.wphylo}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Multi-Location Analysis:</strong> {selectedYear} shows workshops held in{' '}
              {selectedYearLocationData.length} different location{selectedYearLocationData.length !== 1 ? 's' : ''}, 
              demonstrating the global reach and regional adaptation of Evomics training programs.
            </p>
          </div>
        </div>
      )}

      {/* Location Analysis Overview */}
      {showLocationBreakdown && !selectedYear && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Multi-Location Workshop Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(locationData)
              .filter(([year, locations]) => Object.keys(locations).length > 1)
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .slice(0, 6)
              .map(([year, locations]) => (
                <div 
                  key={year}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedYear(parseInt(year))}
                >
                  <div className="text-lg font-semibold text-blue-600">{year}</div>
                  <div className="text-sm text-gray-600">
                    {Object.keys(locations).length} locations
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Object.values(locations).reduce((sum: number, workshops: any) => 
                      sum + Object.values(workshops).reduce((s: number, c: number) => s + c, 0), 0
                    )} total students
                  </div>
                </div>
              ))}
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Click on any year to see detailed location breakdown. Years with multiple locations indicate 
            coordinated workshop offerings across different regions.
          </p>
        </div>
      )}
    </div>
  );
};