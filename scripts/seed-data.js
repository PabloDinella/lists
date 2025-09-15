#!/usr/bin/env node

/**
 * Simple CLI script to create seed data for the GTD app
 * 
 * Usage:
 *   npm run seed-data [user-id]
 *   
 * Examples:
 *   npm run seed-data 123e4567-e89b-12d3-a456-426614174000
 *   npm run seed-data --clear 123e4567-e89b-12d3-a456-426614174000
 */

import { createSeedData, clearUserData } from './src/lib/seed-data.js';

const args = process.argv.slice(2);
const isClear = args.includes('--clear');
const userId = args.find(arg => !arg.startsWith('--'));

if (!userId) {
  console.error('Error: User ID is required');
  console.log('Usage: npm run seed-data [user-id]');
  console.log('       npm run seed-data --clear [user-id]');
  process.exit(1);
}

// Validate UUID format (basic check)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(userId)) {
  console.error('Error: Invalid UUID format for user ID');
  process.exit(1);
}

async function main() {
  try {
    if (isClear) {
      console.log(`Clearing all data for user: ${userId}`);
      await clearUserData(userId);
      console.log('✅ Data cleared successfully!');
    } else {
      console.log(`Creating seed data for user: ${userId}`);
      const nodeIdMap = await createSeedData(userId);
      console.log('✅ Seed data created successfully!');
      console.log(`📊 Created ${nodeIdMap.size} nodes`);
      
      // Log some key node IDs for reference
      console.log('\n📋 Key node IDs:');
      const keyNodes = ['Inbox', 'Next actions', 'Projects', 'Contexts', 'Areas of focus'];
      keyNodes.forEach(nodeName => {
        const id = nodeIdMap.get(nodeName);
        if (id) {
          console.log(`  ${nodeName}: ${id}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
