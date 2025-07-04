import { useState, useEffect, useMemo } from 'react';
import type { StudentProfile, Workshop } from '../types/student';
import studentDataJson from '../data/studentData.json';
import workshopsJson from '../data/workshops.json';

// Focus on the 3 main workshops that match the faculty site
const FOCUSED_WORKSHOPS = ['wog', 'wpsg', 'wphylo'];

export function useFocusedStudentData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter workshops to only include the 3 main ones
  const workshops = useMemo(() => {
    const allWorkshops = workshopsJson as { [key: string]: Workshop };
    const filtered: { [key: string]: Workshop } = {};
    
    FOCUSED_WORKSHOPS.forEach(id => {
      if (allWorkshops[id]) {
        filtered[id] = {
          ...allWorkshops[id],
          active: true // Mark as active since these are our focus
        };
      }
    });
    
    return filtered;
  }, []);

  // Filter student profiles to only include those who participated in focused workshops
  const profiles = useMemo(() => {
    try {
      const data = studentDataJson as any;
      const allProfiles = data.profiles.map((profile: any) => ({
        student: profile.student,
        participations: profile.participations,
        statistics: profile.statistics
      })) as StudentProfile[];

      // Filter to only include students who participated in our focused workshops
      const focusedProfiles = allProfiles.filter(profile => {
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

      return focusedProfiles;
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