#!/usr/bin/env node

// List of faculty to find ORCID IDs for
const facultyToSearch = [
  { id: 'leonard-guy', name: 'Guy Leonard', affiliation: 'University of Oxford' },
  { id: 'marcet-houben-marina', name: 'Marina Marcet-Houben', affiliation: 'Barcelona Supercomputing Center' },
  { id: 'mcdonald-daniel', name: 'Daniel McDonald', affiliation: 'University of Colorado Boulder' },
  { id: 'bank-claudia', name: 'Claudia Bank', affiliation: 'SIB Swiss Institute of Bioinformatics' },
  { id: 'catchen-julian', name: 'Julian Catchen', affiliation: 'University of Illinois' },
  { id: 'kubatko-laura', name: 'Laura Kubatko', affiliation: 'Ohio State University' },
  { id: 'malinsky-milan', name: 'Milan Malinsky', affiliation: 'University of Basel' },
  { id: 'matschiner-michael', name: 'Michael Matschiner', affiliation: 'Natural History Museum, University of Oslo' },
  { id: 'marchet-camille', name: 'Camille Marchet', affiliation: 'CNRS / University of Lille' },
  { id: 'bielawski-joseph', name: 'Joseph Bielawski', affiliation: 'Dalhousie University' }
];

console.log('Faculty ORCID Search List');
console.log('='.repeat(80));
console.log('\nSearch for ORCID IDs using:');
console.log('1. Google Scholar');
console.log('2. University faculty pages');
console.log('3. ORCID search: https://orcid.org/orcid-search/search');
console.log('4. ResearchGate profiles\n');

facultyToSearch.forEach((faculty, index) => {
  console.log(`${index + 1}. ${faculty.name}`);
  console.log(`   ID: ${faculty.id}`);
  console.log(`   Affiliation: ${faculty.affiliation}`);
  console.log(`   Search query: "${faculty.name}" "${faculty.affiliation}" ORCID`);
  console.log(`   ORCID search: https://orcid.org/orcid-search/search?searchQuery=${encodeURIComponent(faculty.name)}`);
  console.log('');
});

console.log('\nExample update format for facultyEnriched.json:');
console.log('"academic": {');
console.log('  "orcid": "0000-0000-0000-0000",');
console.log('  "researchAreas": [...]');
console.log('}');