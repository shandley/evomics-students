import { useState, useEffect, useMemo } from 'react';
import type { StudentProfile, Workshop } from '../types/student';
import studentDataJson from '../data/studentData.json';
import workshopsJson from '../data/workshops.json';

export function useStudentData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load and process student data
  const profiles = useMemo(() => {
    try {
      const data = studentDataJson as any;
      return data.profiles.map((profile: any) => ({
        student: profile.student,
        participations: profile.participations,
        statistics: profile.statistics
      })) as StudentProfile[];
    } catch (err) {
      console.error('Error processing student data:', err);
      return [];
    }
  }, []);

  // Load workshops
  const workshops = useMemo(() => {
    return workshopsJson as { [key: string]: Workshop };
  }, []);

  useEffect(() => {
    // Simulate loading time
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