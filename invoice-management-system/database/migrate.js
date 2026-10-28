/**
 * Database Migration Runner
 * 
 * Runs all pending migrations in database/migrations in chronological order.
 * Tracks executed migrations in the SequelizeMeta table.
 */

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const { sequelize, ensureDatabaseExists } = require('../src/config/database');

async function runMigrations() {
  console.log('[Migration] Starting database migration process...');

  // Ensure target database exists
  await ensureDatabaseExists();

  const queryInterface = sequelize.getQueryInterface();

  // Create SequelizeMeta table if not exists to track executed migrations
  await queryInterface.createTable('SequelizeMeta', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true
    }
  });

  // Fetch already executed migrations
  const [executedRows] = await sequelize.query('SELECT name FROM SequelizeMeta');
  const executedNames = new Set(executedRows.map(r => r.name));

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.js'))
    .sort();

  let executedCount = 0;

  for (const file of files) {
    if (executedNames.has(file)) {
      console.log(`[Migration] Already executed: ${file}`);
      continue;
    }

    console.log(`[Migration] Applying migration: ${file}...`);
    const migration = require(path.join(migrationsDir, file));

    // Execute migration within a transaction
    const transaction = await sequelize.transaction();
    try {
      await migration.up(queryInterface, Sequelize);
      await sequelize.query(
        'INSERT INTO SequelizeMeta (name) VALUES (:name)',
        {
          replacements: { name: file },
          transaction
        }
      );
      await transaction.commit();
      console.log(`[Migration] Successfully applied: ${file}`);
      executedCount++;
    } catch (err) {
      await transaction.rollback();
      console.error(`[Migration Error] Failed to apply ${file}: ${err.message}`);
      throw err;
    }
  }

  if (executedCount === 0) {
    console.log('[Migration] Database is up to date. No pending migrations.');
  } else {
    console.log(`[Migration] Successfully applied ${executedCount} migration(s).`);
  }
}

// Run directly when invoked as a script
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('[Migration] Process finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration Error]', err);
      process.exit(1);
    });
}

module.exports = runMigrations;
