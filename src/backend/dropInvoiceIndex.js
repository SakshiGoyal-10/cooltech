import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  
  try {
    await mongoose.connection.collection('invoices').dropIndex('invoiceId_1');
    console.log('✅ Successfully dropped invoiceId_1 index');
  } catch (err) {
    if (err.code === 27) {
      console.log('ℹ️  Index invoiceId_1 does not exist — nothing to drop');
    } else {
      console.error('❌ Error:', err.message);
    }
  }

  // Also list remaining indexes so you can verify
  const indexes = await mongoose.connection.collection('invoices').indexes();
  console.log('Remaining indexes:', indexes.map(i => i.name));
  
  await mongoose.disconnect();
  process.exit(0);
}

run();