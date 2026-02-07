// server/scripts/remove-unique-index.js
// Remove the problematic unique index and let application logic handle duplicates

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function removeUniqueIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const chatsCollection = db.collection('chats');

    console.log('📋 CURRENT INDEXES:');
    const indexes = await chatsCollection.indexes();
    indexes.forEach(index => {
      console.log(`  ${index.name}:`, JSON.stringify(index.key));
      if (index.unique) console.log(`    ⚠️  unique constraint`);
    });
    console.log('');

    console.log('🗑️  REMOVING UNIQUE INDEX ON PARTICIPANTS...\n');
    
    // Drop the problematic unique index
    try {
      await chatsCollection.dropIndex('participants_listingId_unique');
      console.log('✅ Dropped participants_listingId_unique');
    } catch (err) {
      console.log('⚠️  Index not found');
    }
    
    try {
      await chatsCollection.dropIndex('participants_1_listingId_1');
      console.log('✅ Dropped participants_1_listingId_1');
    } catch (err) {
      console.log('⚠️  Index not found');
    }
    
    console.log('\n✅ UNIQUE INDEX REMOVED!\n');
    
    console.log('📋 REMAINING INDEXES:');
    const remaining = await chatsCollection.indexes();
    remaining.forEach(index => {
      console.log(`  ${index.name}:`, JSON.stringify(index.key));
    });
    console.log('');
    
    console.log('✅ NOW CREATING NON-UNIQUE INDEX FOR PERFORMANCE...\n');
    
    // Create a NON-unique index for performance (not for uniqueness)
    await chatsCollection.createIndex(
      { participants: 1, listingId: 1 },
      { unique: false, name: 'participants_listing_index' }
    );
    
    console.log('✅ Created non-unique index for query performance\n');
    
    console.log('📋 FINAL INDEXES:');
    const finalIndexes = await chatsCollection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  ${index.name}:`, JSON.stringify(index.key));
      if (index.unique) {
        console.log(`    ✓ unique`);
      } else if (index.name !== '_id_') {
        console.log(`    ℹ️  non-unique (for performance only)`);
      }
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ FIX COMPLETE!');
    console.log('='.repeat(70));
    console.log('\nYour chat route already has the logic to prevent duplicates:');
    console.log('  1. It queries for existing chats before creating');
    console.log('  2. If duplicate error occurs, it fetches the existing chat');
    console.log('  3. Multiple users CAN now message about the same item!\n');
    console.log('🔄 RESTART YOUR SERVER and test!\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

removeUniqueIndex();
