import { getDatabase } from '../config/database';
import { User } from '../types';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupDuplicateUsers() {
  try {
    const db = await getDatabase();
    const collection = db.collection<User>('users');

    console.log('🔍 Searching for duplicate users...');

    // Agrupar por clerkId e encontrar duplicatas
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: '$clerkId',
          count: { $sum: 1 },
          ids: { $push: '$_id' },
          docs: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          count: { $gt: 1 },
          _id: { $ne: null } // Ignorar clerkId nulos
        }
      }
    ]).toArray();

    if (duplicates.length === 0) {
      console.log('✅ No duplicate users found!');
      return;
    }

    console.log(`⚠️  Found ${duplicates.length} clerkIds with duplicates`);

    let totalDeleted = 0;

    for (const duplicate of duplicates) {
      const clerkId = duplicate._id;
      const docs = duplicate.docs as any[];
      
      console.log(`\n📋 Processing clerkId: ${clerkId}`);
      console.log(`   Found ${docs.length} duplicate entries`);

      // Ordenar por createdAt (manter o mais antigo)
      docs.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateA - dateB;
      });

      // Manter o primeiro (mais antigo) e deletar os outros
      const toKeep = docs[0];
      const toDelete = docs.slice(1);

      console.log(`   ✅ Keeping: ${toKeep._id} (created: ${toKeep.createdAt})`);
      
      for (const doc of toDelete) {
        console.log(`   ❌ Deleting: ${doc._id} (created: ${doc.createdAt})`);
        await collection.deleteOne({ _id: doc._id });
        totalDeleted++;
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} duplicate users.`);
  } catch (error) {
    console.error('❌ Error cleaning up duplicate users:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  cleanupDuplicateUsers()
    .then(() => {
      console.log('✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { cleanupDuplicateUsers };
