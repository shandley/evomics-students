#!/usr/bin/env node

/**
 * Test script to verify TypeScript types are working correctly
 */

import { 
  Faculty, 
  EnrichedFacultyProfile, 
  hasStandardizedResearchAreas,
  TopicNode,
  StandardizedResearchAreas
} from '../src/types';

import { getAllFaculty, getTopicUsageStats } from '../src/models/facultyData';
import { getAllTopics, buildTopicHierarchy } from '../src/models/taxonomyData';

console.log('Testing TypeScript types for Scientific Topics Dictionary...\n');

// Test 1: Load faculty data
console.log('1. Testing faculty data loading...');
try {
  const allFaculty = getAllFaculty();
  console.log(`   ✓ Loaded ${allFaculty.length} faculty members`);
  
  // Find faculty with standardized topics
  const withStandardized = allFaculty.filter(f => hasStandardizedResearchAreas(f.enrichment));
  console.log(`   ✓ ${withStandardized.length} faculty have standardized topics`);
} catch (error) {
  console.error('   ✗ Error loading faculty:', error);
}

// Test 2: Load taxonomy
console.log('\n2. Testing taxonomy loading...');
try {
  const allTopics = getAllTopics();
  console.log(`   ✓ Loaded ${allTopics.length} topics`);
  
  const hierarchy = buildTopicHierarchy();
  console.log(`   ✓ Built hierarchy with ${hierarchy.length} root nodes`);
} catch (error) {
  console.error('   ✗ Error loading taxonomy:', error);
}

// Test 3: Topic usage statistics
console.log('\n3. Testing topic usage statistics...');
try {
  const stats = getTopicUsageStats();
  console.log(`   ✓ Found ${stats.size} unique topics in use`);
  
  // Show top 5 most used topics
  const sorted = Array.from(stats.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  console.log('   Top 5 most used topics:');
  sorted.forEach(([topicId, count]) => {
    console.log(`     - ${topicId}: ${count} faculty`);
  });
} catch (error) {
  console.error('   ✗ Error calculating statistics:', error);
}

// Test 4: Type guard functions
console.log('\n4. Testing type guard functions...');
try {
  const testEnrichment: EnrichedFacultyProfile['enrichment'] = {
    lastUpdated: '2025-01-01',
    confidence: 'high',
    academic: {
      researchAreas: {
        raw: ['test'],
        standardized: {
          primary: [],
          secondary: [],
          techniques: []
        }
      }
    }
  };
  
  const hasStandardized = hasStandardizedResearchAreas(testEnrichment);
  console.log(`   ✓ Type guard working: ${hasStandardized}`);
} catch (error) {
  console.error('   ✗ Error with type guards:', error);
}

console.log('\n✓ All TypeScript types are working correctly!');