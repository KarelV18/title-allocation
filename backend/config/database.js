const { MongoClient } = require('mongodb');

let db = null;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb+srv://msharma_db:Tit13_system@cluster0.ddd6yk5.mongodb.net/test?retryWrites=true&w=majority');
    await client.connect();
    db = client.db();
    console.log('MongoDB Connected');
    
    // Create indexes
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('titles').createIndex({ supervisorId: 1 });
    await db.collection('preferences').createIndex({ studentId: 1 }, { unique: true });
    await db.collection('allocations').createIndex({ studentId: 1 }, { unique: true });
    
    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

module.exports = { connectDB, getDB };