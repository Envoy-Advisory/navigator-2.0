
#!/usr/bin/env ts-node

import { prisma, resetDatabase, closeDatabase } from './database';

async function runMigration() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'reset':
        console.log('Resetting database...');
        await resetDatabase();
        console.log('Database reset completed');
        break;
        
      case 'status':
        console.log('Checking database status...');
        const userCount = await prisma.user.count();
        const orgCount = await prisma.organization.count();
        console.log(`Users: ${userCount}, Organizations: ${orgCount}`);
        break;

      case 'seed':
        console.log('Seeding database...');
        // Create a sample organization
        const org = await prisma.organization.create({
          data: {
            name: 'Sample Organization',
            subscription_type: 'premium'
          }
        });
        console.log('Sample organization created:', org.name);
        break;
        
      default:
        console.log('Available commands:');
        console.log('  reset  - Reset database (clear all data)');
        console.log('  status - Show current database status');
        console.log('  seed   - Add sample data');
    }
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await closeDatabase();
    process.exit(0);
  }
}

runMigration();
