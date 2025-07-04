import { useState, useEffect, useMemo } from 'react';
import type { Student, StudentProfile, Workshop } from '../types';
import studentDataJson from '../data/studentData.json';
import workshopsJson from '../data/workshops.json';

export function useFacultyData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the profiles directly from the converted data
  const profiles = useMemo(() => {
    try {
      const data = studentDataJson as any;
      return data.profiles.map((profile: any) => ({
        student: profile.student,
        faculty: profile.student, // Compatibility layer
        participations: profile.participations,
        statistics: profile.statistics
      })) as StudentProfile[];
    } catch (err) {
      console.error('Error processing student data:', err);
      return [];
    }
  }, []);

  const workshops = useMemo(() => {
    return workshopsJson as { [key: string]: Workshop };
  }, []);

  useEffect(() => {
    // Simulate async loading
    const timer = setTimeout(() => {
      if (profiles.length > 0) {
        setLoading(false);
      } else {
        setError('Failed to load student data');
        setLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [profiles]);

  return {
    loading,
    error,
    profiles,
    workshops
  };
}