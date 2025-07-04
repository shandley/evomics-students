import { useState, useEffect, useMemo } from 'react';
import type { StudentProfile, Workshop } from '../types/student';
import studentDataJson from '../data/studentData.json';
import workshopsJson from '../data/workshops.json';

// Focus on the 3 main workshops that match the faculty site
const FOCUSED_WORKSHOPS = ['wog', 'wpsg', 'wphylo'];

export function useFocusedStudentData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Return all workshops but mark focused ones as active
  const workshops = useMemo(() => {
    const allWorkshops = workshopsJson as { [key: string]: Workshop };
    const result: { [key: string]: Workshop } = {};
    
    Object.entries(allWorkshops).forEach(([id, workshop]) => {
      result[id] = {
        ...workshop,
        active: FOCUSED_WORKSHOPS.includes(id) ? true : workshop.active
      };
    });
    
    return result;
  }, []);

  // Include all student profiles but keep track of which are from focused workshops
  const profiles = useMemo(() => {
    try {
      const data = studentDataJson as any;
      const allProfiles = data.profiles.map((profile: any) => ({
        student: profile.student,
        participations: profile.participations,
        statistics: profile.statistics
      })) as StudentProfile[];

      return allProfiles;
    } catch (err) {
      console.error('Error processing focused student data:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      if (profiles.length > 0) {
        setLoading(false);
      } else {
        setError('Failed to load focused student data');
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