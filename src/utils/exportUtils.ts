import type { StudentProfile, Workshop } from '../types/student';

// CSV Export functionality
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle arrays and objects
        if (Array.isArray(value)) return `"${value.join('; ')}"`;
        if (typeof value === 'object' && value !== null) return `"${JSON.stringify(value)}"`;
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Generate CSV data for different views
export function generateStudentSummaryCSV(profiles: StudentProfile[], workshops: { [key: string]: Workshop }) {
  const focusedWorkshops = Object.keys(workshops).filter(id => workshops[id].active);
  
  // Filter profiles to only include those who participated in focused workshops
  const focusedProfiles = profiles.filter(profile => {
    return focusedWorkshops.some(workshopId => 
      profile.participations[workshopId] && profile.participations[workshopId].length > 0
    );
  });

  return focusedProfiles.map(profile => {
    const participatedWorkshops = focusedWorkshops.filter(id => 
      profile.participations[id] && profile.participations[id].length > 0
    );

    return {
      country: profile.student.country,
      institution: profile.student.institution,
      totalWorkshops: participatedWorkshops.length,
      workshopsAttended: participatedWorkshops.map(id => workshops[id].shortName).join(', '),
      totalYears: focusedWorkshops.reduce((sum, id) => 
        sum + (profile.participations[id]?.length || 0), 0
      ),
      firstYear: profile.statistics.firstYear,
      lastYear: profile.statistics.lastYear,
      yearsActive: profile.statistics.lastYear - profile.statistics.firstYear + 1
    };
  });
}

export function generateCountryStatsCSV(profiles: StudentProfile[], workshops: { [key: string]: Workshop }) {
  const focusedWorkshops = Object.keys(workshops).filter(id => workshops[id].active);
  const countryStats: { [country: string]: {
    students: number;
    institutions: Set<string>;
    workshopBreakdown: { [workshopId: string]: number };
    totalParticipations: number;
  }} = {};

  profiles.forEach(profile => {
    const hasParticipation = focusedWorkshops.some(id => 
      profile.participations[id] && profile.participations[id].length > 0
    );
    
    if (!hasParticipation) return;

    const country = profile.student.country;
    if (!countryStats[country]) {
      countryStats[country] = {
        students: 0,
        institutions: new Set(),
        workshopBreakdown: {},
        totalParticipations: 0
      };
    }
    
    countryStats[country].students++;
    countryStats[country].institutions.add(profile.student.institution);
    
    focusedWorkshops.forEach(workshopId => {
      if (profile.participations[workshopId] && profile.participations[workshopId].length > 0) {
        countryStats[country].workshopBreakdown[workshopId] = 
          (countryStats[country].workshopBreakdown[workshopId] || 0) + 1;
        countryStats[country].totalParticipations += profile.participations[workshopId].length;
      }
    });
  });

  return Object.entries(countryStats)
    .map(([country, stats]) => ({
      country,
      totalStudents: stats.students,
      totalInstitutions: stats.institutions.size,
      totalParticipations: stats.totalParticipations,
      avgParticipationsPerStudent: (stats.totalParticipations / stats.students).toFixed(2),
      institutionalDiversity: ((stats.institutions.size / stats.students) * 100).toFixed(1) + '%',
      ...focusedWorkshops.reduce((acc, id) => {
        acc[`${workshops[id].shortName}_students`] = stats.workshopBreakdown[id] || 0;
        return acc;
      }, {} as { [key: string]: number })
    }))
    .sort((a, b) => b.totalStudents - a.totalStudents);
}

export function generateInstitutionStatsCSV(profiles: StudentProfile[], workshops: { [key: string]: Workshop }) {
  const focusedWorkshops = Object.keys(workshops).filter(id => workshops[id].active);
  const institutionStats: { [key: string]: {
    country: string;
    students: number;
    workshopBreakdown: { [workshopId: string]: number };
    totalParticipations: number;
  }} = {};

  profiles.forEach(profile => {
    const hasParticipation = focusedWorkshops.some(id => 
      profile.participations[id] && profile.participations[id].length > 0
    );
    
    if (!hasParticipation) return;

    const institution = profile.student.institution;
    if (!institutionStats[institution]) {
      institutionStats[institution] = {
        country: profile.student.country,
        students: 0,
        workshopBreakdown: {},
        totalParticipations: 0
      };
    }
    
    institutionStats[institution].students++;
    
    focusedWorkshops.forEach(workshopId => {
      if (profile.participations[workshopId] && profile.participations[workshopId].length > 0) {
        institutionStats[institution].workshopBreakdown[workshopId] = 
          (institutionStats[institution].workshopBreakdown[workshopId] || 0) + 1;
        institutionStats[institution].totalParticipations += profile.participations[workshopId].length;
      }
    });
  });

  return Object.entries(institutionStats)
    .map(([institution, stats]) => ({
      institution,
      country: stats.country,
      totalStudents: stats.students,
      totalParticipations: stats.totalParticipations,
      avgParticipationsPerStudent: (stats.totalParticipations / stats.students).toFixed(2),
      ...focusedWorkshops.reduce((acc, id) => {
        acc[`${workshops[id].shortName}_students`] = stats.workshopBreakdown[id] || 0;
        return acc;
      }, {} as { [key: string]: number })
    }))
    .sort((a, b) => b.totalStudents - a.totalStudents);
}

// Chart export functionality
export function downloadChartAsPNG(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // For SVG elements, we need to convert to canvas
  const svgElement = element.querySelector('svg');
  if (svgElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${filename}.png`;
          link.click();
          URL.revokeObjectURL(link.href);
        }
      });
      
      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  }
}

export function downloadChartAsSVG(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const svgElement = element.querySelector('svg');
  if (svgElement) {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.svg`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

// Generate current timestamp for filenames
export function getCurrentTimestamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
}