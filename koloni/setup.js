const fs = require('fs');
const path = require('path');

// Define the folders and files to create
const structure = {
    'src': {
        'components': {},
        'styles': {},
        'utils': {},
    },
    'public': {
        'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Koloni</title>\n</head>\n<body>\n    <div id="app"></div>\n</body>\n</html>',
    },
    'package.json': '{ "name": "koloni", "version": "1.0.0", "main": "index.js" }',
    'README.md': '# Koloni Project\n\nThis is the Koloni project.\n',
    // Add more files as needed
};

// Function to create files and directories
function createStructure(basePath, structure) {
    for (const [key, value] of Object.entries(structure)) {
        const currentPath = path.join(basePath, key);
        if (typeof value === 'object') {
            // Create directory
            fs.mkdirSync(currentPath, { recursive: true });
            createStructure(currentPath, value);
        } else {
            // Create file
            fs.writeFileSync(currentPath, value);
            console.log(`Created: ${currentPath}`);
        }
    }
}

// Start creating the structure
createStructure(__dirname, structure);
console.log('Setup complete!');
