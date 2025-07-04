import { useState, useEffect, useMemo } from 'react';
import type { StudentProfile, Workshop } from '../types/student';

// Focus on the 3 main workshops that match the faculty site
const FOCUSED_WORKSHOPS = ['wog', 'wpsg', 'wphylo'];

export function useFocusedStudentData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [workshops, setWorkshops] = useState<{ [key: string]: Workshop }>({});
  const [allProfiles, setAllProfiles] = useState<StudentProfile[]>([]);
  const [allWorkshops, setAllWorkshops] = useState<{ [key: string]: Workshop }>({});

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

        // Store all workshops (for Historical section)
        const allWorkshopsResult: { [key: string]: Workshop } = {};
        Object.entries(workshopsJson as { [key: string]: Workshop }).forEach(([id, workshop]) => {
          allWorkshopsResult[id] = workshop;
        });
        setAllWorkshops(allWorkshopsResult);

        // Process focused workshops only (for main dashboard)
        const focusedWorkshopsResult: { [key: string]: Workshop } = {};
        FOCUSED_WORKSHOPS.forEach(id => {
          if (allWorkshopsResult[id]) {
            focusedWorkshopsResult[id] = {
              ...allWorkshopsResult[id],
              active: true // Mark focused workshops as active
            };
          }
        });
        setWorkshops(focusedWorkshopsResult);

        // Store all profiles (for Historical section)
        const data = studentDataJson as any;
        const allProfilesData = data.profiles.map((profile: any) => ({
          student: profile.student,
          participations: profile.participations,
          statistics: profile.statistics
        })) as StudentProfile[];
        setAllProfiles(allProfilesData);

        // Filter profiles for main dashboard (only students who participated in focused workshops)
        const focusedProfiles = allProfilesData.filter(profile => {
          return FOCUSED_WORKSHOPS.some(workshopId => 
            profile.participations[workshopId] && profile.participations[workshopId].length > 0
          );
        }).map(profile => {
          // Filter participations to only include focused workshops
          const filteredParticipations: { [key: string]: number[] } = {};
          let totalYears = 0;
          let workshopCount = 0;
          const allYears: number[] = [];

          FOCUSED_WORKSHOPS.forEach(workshopId => {
            if (profile.participations[workshopId] && profile.participations[workshopId].length > 0) {
              filteredParticipations[workshopId] = profile.participations[workshopId];
              totalYears += profile.participations[workshopId].length;
              workshopCount++;
              allYears.push(...profile.participations[workshopId]);
            }
          });

          // Recalculate statistics for focused workshops only
          const statistics = {
            totalYears,
            workshopCount,
            firstYear: allYears.length > 0 ? Math.min(...allYears) : 0,
            lastYear: allYears.length > 0 ? Math.max(...allYears) : 0,
          };

          return {
            student: profile.student,
            participations: filteredParticipations,
            statistics
          };
        });
        setProfiles(focusedProfiles);

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
    profiles, // Focused profiles (main dashboard)
    workshops, // Focused workshops (main dashboard)
    allProfiles, // All profiles (Historical section)
    allWorkshops // All workshops (Historical section)
  };
}