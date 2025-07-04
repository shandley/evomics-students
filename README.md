# Evomics Student Alumni Directory

Interactive web application showcasing student alumni from Evomics workshops, featuring 2,386+ students from 50+ countries across multiple workshop series spanning 2008-2018.

**Live Site**: https://shandley.github.io/evomics-students/ *(Coming Soon)*

## Key Features

### Core Functionality
- **Student Directory**: Interactive cards displaying participation history and institutional affiliations
- **Advanced Search & Filtering**: Search by name, filter by workshop, year, country, and institution
- **Data Visualization**: Geographic distribution maps, institutional networks, and timeline visualizations
- **Data Export**: CSV downloads with dynamic filenames based on current filters
- **URL State Management**: Shareable filtered views via URL parameters

### Student-Specific Features
- **Global Reach**: Students from 50+ countries and hundreds of institutions
- **Institution Analysis**: Universities, research institutes, and government agencies
- **Career Tracking**: Alumni networking and professional development paths
- **Regional Clustering**: Geographic distribution and regional cohorts
- **Responsive Design**: Optimized for desktop and mobile, iframe-embeddable for WordPress

### Current Data Coverage
- **Workshop on Molecular Evolution**: 283+ students, 2008
- **Workshop on Genomics**: 400+ students, 2011-2017
- **Workshop on Population & Speciation Genomics**: 100+ students, 2016
- **Workshop on Phylogenomics**: 50+ students, 2017
- **Workshop on Microbiome and Transcriptome Analysis**: 200+ students, 2018

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development

The app runs on http://localhost:5173 by default.

### WordPress Integration
Planned embed code for evomics.org:

```html
<iframe 
  src="https://shandley.github.io/evomics-students/" 
  width="100%" 
  height="800px" 
  frameborder="0"
  title="Evomics Student Alumni">
</iframe>
```

## Deployment

**Planned**: GitHub Pages with automated CI/CD
- Push to main branch triggers automatic deployment
- Will be live at: https://shandley.github.io/evomics-students/

## Adding New Workshop Data
1. Update TSV file with new student records
2. Run data conversion script to update JSON
3. Add students to `studentData.json`
4. Add participations to the participations array
5. Update `workshops.json` with new workshop info

## Tech Stack
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Static JSON data (API-ready architecture)