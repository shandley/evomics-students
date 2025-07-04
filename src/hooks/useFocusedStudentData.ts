import { useState, useEffect, useMemo } from 'react';
import type { StudentProfile, Workshop } from '../types/student';

// Focus on the 3 main workshops that match the faculty site
const FOCUSED_WORKSHOPS = ['wog', 'wpsg', 'wphylo'];

export function useFocusedStudentData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [workshops, setWorkshops] = useState<{ [key: string]: Workshop }>({});

  useEffect(() => {
    async function loadData() {
      try {
        // Dynamically import the data files
        const [studentDataModule, workshopsModule] = await Promise.all([
          import('../data/studentData.json'),
          import('../data/workshops.json')
        ]);

        const studentDataJson = studentDataModule.default;
        const workshopsJson = workshopsModule.default;

        // Process workshops
        const result: { [key: string]: Workshop } = {};
        Object.entries(workshopsJson as { [key: string]: Workshop }).forEach(([id, workshop]) => {
          result[id] = {
            ...workshop,
            active: FOCUSED_WORKSHOPS.includes(id) ? true : workshop.active
          };
        });
        setWorkshops(result);

        // Process profiles
        const data = studentDataJson as any;
        const allProfiles = data.profiles.map((profile: any) => ({
          student: profile.student,
          participations: profile.participations,
          statistics: profile.statistics
        })) as StudentProfile[];
        setProfiles(allProfiles);

        setLoading(false);
      } catch (err) {
        console.error('Error loading student data:', err);
        setError('Failed to load student data');
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return {
    loading,
    error,
    profiles,
    workshops
  };
}