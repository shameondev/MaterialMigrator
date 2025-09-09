const { MigrationTool } = require('./dist/migrate.js');
const fs = require('fs');

const config = {
  projectRoot: '/tmp',
  writeFiles: false,
  include: [],
  exclude: [],
  dryRun: true,
  verbose: true,
  preserveOriginal: false,
  useCn: true,
  customThemeMapping: {},
  customPropertyMapping: {},
  maxWarningsPerFile: 50,
  failOnErrors: false,
  generateReport: false,
};

const inputFile = '__tests__/integration/migration-tests/edge-cases/mixed-convertible.input.tsx';
const inputCode = fs.readFileSync(inputFile, 'utf-8');

console.log('=== INPUT ===');
console.log(inputCode);

const migrationTool = new MigrationTool(config);

migrationTool.migrate([inputFile]).then(results => {
  console.log('\n=== OUTPUT ===');
  // The output will be in the results or we need to get it differently
  // Let's just run the transformation directly
}).catch(console.error);