import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';
import type { StudentProfile } from '../types/student';

interface InteractiveTimelineProps {
  profiles: StudentProfile[];
  workshops: { [key: string]: any };
}

export const InteractiveTimeline: React.FC<InteractiveTimelineProps> = ({ 
  profiles, 
  workshops 
}) => {
  const timelineData = useMemo(() => {
    const yearData: { [year: number]: { 
      year: number;
      total: number;
      wog: number;
      wpsg: number;
      wphylo: number;
    }} = {};

    profiles.forEach(profile => {
      Object.entries(profile.participations).forEach(([workshopId, years]) => {
        years.forEach(year => {
          if (!yearData[year]) {
            yearData[year] = { year, total: 0, wog: 0, wpsg: 0, wphylo: 0 };
          }
          
          yearData[year].total++;
          
          if (workshopId === 'wog') yearData[year].wog++;
          else if (workshopId === 'wpsg') yearData[year].wpsg++;
          else if (workshopId === 'wphylo') yearData[year].wphylo++;
        });
      });
    });

    return Object.values(yearData).sort((a, b) => a.year - b.year);
  }, [profiles]);

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
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
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
    </div>
  );
};