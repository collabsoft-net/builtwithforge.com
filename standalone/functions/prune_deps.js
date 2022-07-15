
const { writeFileSync } = require('fs');
const pkg = require('./package.json');

[ 'devDependencies', 'dependencies', 'peerDependencies', 'optionalDependencies' ].forEach(item => {
  if (pkg[item]) {
    Object.keys(pkg[item]).forEach((key) => {
      if(key.startsWith('@collabsoft')) {
        delete pkg[item][key];
      }
    });
  }
});

writeFileSync('./package.json', JSON.stringify(pkg, null, 2), 'utf-8');