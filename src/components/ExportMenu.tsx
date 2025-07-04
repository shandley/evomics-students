import React, { useState } from 'react';
import type { StudentProfile, Workshop } from '../types/student';
import { 
  exportToCSV, 
  generateStudentSummaryCSV, 
  generateCountryStatsCSV, 
  generateInstitutionStatsCSV,
  getCurrentTimestamp 
} from '../utils/exportUtils';

interface ExportMenuProps {
  profiles: StudentProfile[];
  workshops: { [key: string]: Workshop };
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ profiles, workshops }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportStudentSummary = () => {
    const data = generateStudentSummaryCSV(profiles, workshops);
    exportToCSV(data, `evomics-student-summary-${getCurrentTimestamp()}`);
    setIsOpen(false);
  };

  const handleExportCountryStats = () => {
    const data = generateCountryStatsCSV(profiles, workshops);
    exportToCSV(data, `evomics-country-statistics-${getCurrentTimestamp()}`);
    setIsOpen(false);
  };

  const handleExportInstitutionStats = () => {
    const data = generateInstitutionStatsCSV(profiles, workshops);
    exportToCSV(data, `evomics-institution-statistics-${getCurrentTimestamp()}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg border border-white/20 text-white transition-colors duration-200 flex items-center gap-2"
        title="Export data"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Export Data</h3>
              
              <div className="space-y-2">
                <button
                  onClick={handleExportStudentSummary}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">Student Summary</div>
                    <div className="text-xs text-gray-500">Individual student data (CSV)</div>
                  </div>
                </button>

                <button
                  onClick={handleExportCountryStats}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">Country Statistics</div>
                    <div className="text-xs text-gray-500">Aggregated by country (CSV)</div>
                  </div>
                </button>

                <button
                  onClick={handleExportInstitutionStats}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">Institution Statistics</div>
                    <div className="text-xs text-gray-500">Aggregated by institution (CSV)</div>
                  </div>
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Chart exports available on individual visualizations
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};