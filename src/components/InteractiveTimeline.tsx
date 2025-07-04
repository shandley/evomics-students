import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart, AreaChart, Area } from 'recharts';
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
  const [showLocationView, setShowLocationView] = useState(false);

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

  // Enhanced timeline data with location breakdown
  const locationTimelineData = useMemo(() => {
    const yearLocationData: { [year: number]: { 
      year: number;
      total: number;
      wog: number;
      wpsg: number;
      wphylo: number;
      // WoG location breakdown
      wog_colorado: number;
      wog_czech: number;
      wog_smithsonian: number;
      wog_other: number;
      multiLocation: boolean;
    }} = {};

    // Process raw participations to get location data
    studentData.participations.forEach(participation => {
      const { year, location, workshopId, studentId } = participation;
      
      // Only include focused workshops
      if (!['wog', 'wpsg', 'wphylo'].includes(workshopId)) return;
      
      if (!yearLocationData[year]) {
        yearLocationData[year] = { 
          year, total: 0, wog: 0, wpsg: 0, wphylo: 0,
          wog_colorado: 0, wog_czech: 0, wog_smithsonian: 0, wog_other: 0,
          multiLocation: false
        };
      }
      
      // Count unique students per year per workshop (avoid double counting)
      const existingStudents = new Set<string>();
      
      // For WoG, break down by location
      if (workshopId === 'wog') {
        if (location.toLowerCase().includes('colorado')) {
          yearLocationData[year].wog_colorado++;
        } else if (location.toLowerCase().includes('czech') || location.toLowerCase().includes('krumlov')) {
          yearLocationData[year].wog_czech++;
        } else if (location.toLowerCase().includes('smithsonian') || location.toLowerCase().includes('washington')) {
          yearLocationData[year].wog_smithsonian++;
        } else {
          yearLocationData[year].wog_other++;
        }
      }
    });

    // Calculate totals and detect multi-location years
    Object.values(yearLocationData).forEach(data => {
      data.wog = data.wog_colorado + data.wog_czech + data.wog_smithsonian + data.wog_other;
      
      // Check if it's a multi-location year (more than one location has students)
      const locationCount = [data.wog_colorado, data.wog_czech, data.wog_smithsonian, data.wog_other]
        .filter(count => count > 0).length;
      data.multiLocation = locationCount > 1;
      
      data.total = data.wog + data.wpsg + data.wphylo;
    });

    return Object.values(yearLocationData).sort((a, b) => a.year - b.year);
  }, []);

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
              {locationCount} location{locationCount !== 1 ? 's' : ''} • Toggle location view above
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
          <button
            onClick={() => setShowLocationView(!showLocationView)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              showLocationView
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {showLocationView ? 'Hide' : 'Show'} Location View
          </button>
        </div>
      </div>

      {/* Annual Participation Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Annual Workshop Participation
          {showLocationView && (
            <span className="ml-2 text-sm font-normal text-blue-600">(Location View)</span>
          )}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {showLocationView ? (
              <AreaChart data={locationTimelineData}>
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
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-medium text-gray-900">{`Year: ${label}`}</p>
                          <div className="space-y-1 mt-2">
                            <p className="text-sm text-blue-600">WoG Total: {data.wog}</p>
                            {data.wog_smithsonian > 0 && (
                              <p className="text-xs text-blue-700 ml-2">• Smithsonian DC: {data.wog_smithsonian}</p>
                            )}
                            {data.wog_czech > 0 && (
                              <p className="text-xs text-blue-700 ml-2">• Czech Republic: {data.wog_czech}</p>
                            )}
                            {data.wog_colorado > 0 && (
                              <p className="text-xs text-blue-700 ml-2">• Colorado State: {data.wog_colorado}</p>
                            )}
                            {data.wog_other > 0 && (
                              <p className="text-xs text-blue-700 ml-2">• Other: {data.wog_other}</p>
                            )}
                            {data.wpsg > 0 && <p className="text-sm text-purple-600">WPSG: {data.wpsg}</p>}
                            {data.wphylo > 0 && <p className="text-sm text-green-600">WPhylo: {data.wphylo}</p>}
                            {data.multiLocation && (
                              <p className="text-xs text-orange-600 mt-1">⚡ Multi-location year</p>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {/* WoG stacked areas by location */}
                <Area 
                  type="monotone" 
                  dataKey="wog_smithsonian" 
                  stackId="wog"
                  stroke="#1e40af" 
                  fill="#1e40af"
                  name="WoG - Smithsonian DC"
                />
                <Area 
                  type="monotone" 
                  dataKey="wog_czech" 
                  stackId="wog"
                  stroke="#3b82f6" 
                  fill="#3b82f6"
                  name="WoG - Czech Republic"
                />
                <Area 
                  type="monotone" 
                  dataKey="wog_colorado" 
                  stackId="wog"
                  stroke="#60a5fa" 
                  fill="#60a5fa"
                  name="WoG - Colorado State"
                />
                <Area 
                  type="monotone" 
                  dataKey="wog_other" 
                  stackId="wog"
                  stroke="#93c5fd" 
                  fill="#93c5fd"
                  name="WoG - Other"
                />
                {/* Other workshops as areas */}
                <Area 
                  type="monotone" 
                  dataKey="wpsg" 
                  stroke="#9333ea" 
                  fill="rgba(147, 51, 234, 0.3)"
                  strokeWidth={2}
                  name="WPSG"
                />
                <Area 
                  type="monotone" 
                  dataKey="wphylo" 
                  stroke="#059669" 
                  fill="rgba(5, 150, 105, 0.3)"
                  strokeWidth={2}
                  name="WPhylo"
                />
              </AreaChart>
            ) : (
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
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="wpsg" 
                  stroke="#9333ea" 
                  strokeWidth={3}
                  name="WPSG"
                  dot={{ fill: '#9333ea', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="wphylo" 
                  stroke="#059669" 
                  strokeWidth={3}
                  name="WPhylo"
                  dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {showLocationView 
            ? "View WoG participation by location with stacked areas. Multi-location years show the distributed nature of workshop offerings."
            : "Track participation trends across the three core workshop series over time. Toggle location view to see geographic breakdown."
          }
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

    </div>
  );
};