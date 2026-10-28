/**
 * Database Seeder Runner
 * 
 * Runs all seeders in database/seeders to populate sample data.
 */

const fs = require('fs');
const path = require('path');
const { sequelize, ensureDatabaseExists } = require('../src/config/database');

async function runSeeders() {
  console.log('[Seeder] Starting database seeding...');
  await ensureDatabaseExists();

  const queryInterface = sequelize.getQueryInterface();
  const seedersDir = path.join(__dirname, 'seeders');
  const files = fs.readdirSync(seedersDir)
    .filter(f => f.endsWith('.js'))
    .sort();

  for (const file of files) {
    console.log(`[Seeder] Running: ${file}...`);
    const seeder = require(path.join(seedersDir, file));
    await seeder.up(queryInterface);
  }

  console.log('[Seeder] Database seeding finished successfully.');
}

if (require.main === module) {
  runSeeders()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seeder Error]', err);
      process.exit(1);
    });
}

module.exports = runSeeders;
