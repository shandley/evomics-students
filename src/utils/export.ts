import type { EnrichedFacultyProfile, Workshop } from '../types';

export function exportToCSV(
  profiles: EnrichedFacultyProfile[], 
  workshops: { [key: string]: Workshop },
  filename: string = 'evomics-faculty-export.csv'
): void {
  // Create CSV header
  const headers = [
    'First Name',
    'Last Name',
    'Title',
    'Affiliation',
    'Department',
    'Website',
    'ORCID',
    'Research Areas',
    'Bio',
    'Total Years',
    'First Year',
    'Last Year',
    'Workshops',
    'Workshop Years Detail'
  ];

  // Create CSV rows
  const rows = profiles.map(profile => {
    const { faculty, participations, statistics, enrichment } = profile;
    
    // Get workshop details
    const workshopNames = Object.keys(participations)
      .map(id => workshops[id]?.shortName)
      .filter(Boolean)
      .join('; ');
    
    const workshopYears = Object.entries(participations)
      .map(([id, years]) => {
        const workshop = workshops[id];
        if (!workshop) return '';
        return `${workshop.shortName}: ${years.sort((a, b) => a - b).join(', ')}`;
      })
      .filter(Boolean)
      .join('; ');

    return [
      faculty.firstName,
      faculty.lastName,
      enrichment?.professional?.title || '',
      enrichment?.professional?.affiliation || '',
      enrichment?.professional?.department || '',
      enrichment?.professional?.labWebsite || '',
      enrichment?.academic?.orcid || '',
      (() => {
        const areas = enrichment?.academic?.researchAreas;
        if (!areas) return '';
        if (Array.isArray(areas)) return areas.join(', ');
        return areas.raw?.join(', ') || '';
      })(),
      enrichment?.profile?.shortBio?.replace(/"/g, '""') || '', // Escape quotes
      statistics.totalYears,
      statistics.firstYear,
      statistics.lastYear,
      workshopNames,
      workshopYears
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => 
      row.map(cell => {
        // Handle different types and escape quotes
        const value = cell === null || cell === undefined ? '' : String(cell);
        return `"${value.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Modern browsers
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(link.href);
}

export function generateFilename(filters: any): string {
  const parts = ['evomics-faculty'];
  const date = new Date().toISOString().split('T')[0];
  
  if (filters.workshops.length > 0) {
    parts.push(filters.workshops.join('-'));
  }
  
  if (filters.year) {
    parts.push(filters.year.toString());
  }
  
  if (filters.search) {
    parts.push(filters.search.replace(/\s+/g, '-').toLowerCase());
  }
  
  parts.push(date);
  
  return `${parts.join('_')}.csv`;
}