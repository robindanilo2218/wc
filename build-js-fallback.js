const fs = require('fs');
const path = require('path');

// Root directories to search for JSON files
const targetDirs = [
  path.join(__dirname, 'worldcup.json-master')
];

function getVariableName(dirName, fileName) {
  // Extract year from directory name (e.g., '1930')
  const year = dirName.match(/\d{4}/)?.[0] || 'generic';
  
  if (fileName === 'worldcup.json') {
    return `wcData_${year}`;
  } else if (fileName === 'worldcup.teams.json') {
    return `wcTeams_${year}`;
  } else if (fileName === 'worldcup.stadiums.json') {
    return `wcStadiums_${year}`;
  } else if (fileName === 'worldcup.quali_playoffs.json') {
    return `wcQualiPlayoffs_${year}`;
  } else if (fileName === 'worldcup.groups.json') {
    return `wcGroups_${year}`;
  } else if (fileName === 'worldcup.standings.json') {
    return `wcStandings_${year}`;
  } else if (fileName === 'clubworldcup.json') {
    return `wcClub_${year}`;
  }
  
  // Generic fallback
  const cleanName = fileName.replace('.json', '').replace(/[^a-zA-Z0-9]/g, '_');
  return `wc_${cleanName}_${year}`;
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      // Skip package.json and manifest.json
      if (entry.name === 'package.json' || entry.name === 'manifest.json') {
        continue;
      }
      
      try {
        const jsonContent = fs.readFileSync(fullPath, 'utf8');
        // Validate JSON
        JSON.parse(jsonContent);
        
        const parentDirName = path.basename(dirPath);
        const varName = getVariableName(parentDirName, entry.name);
        
        const jsFileName = entry.name.replace('.json', '.js');
        const jsFilePath = path.join(dirPath, jsFileName);
        
        const jsContent = `// Auto-generated JS wrapper for offline file:// support\nwindow.${varName} = ${jsonContent.trim()};\n`;
        fs.writeFileSync(jsFilePath, jsContent, 'utf8');
        
        console.log(`[SUCCESS] Generated ${varName} in ${jsFileName}`);
      } catch (e) {
        console.error(`[ERROR] Failed to process ${fullPath}:`, e.message);
      }
    }
  }
}

console.log('--- STARTING JS FALLBACK GENERATOR ---');
for (const dir of targetDirs) {
  console.log(`Scanning directory: ${dir}`);
  processDirectory(dir);
}
console.log('--- GENERATOR FINISHED ---');
