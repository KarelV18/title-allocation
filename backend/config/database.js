// const { MongoClient } = require('mongodb');

// let db = null;

// const connectDB = async () => {
//   try {
//     const client = new MongoClient(process.env.MONGODB_URI || 'mongodb+srv://msharma_db:Tit13_system@cluster0.ddd6yk5.mongodb.net/test?retryWrites=true&w=majority');
//     await client.connect();
//     db = client.db();
//     console.log('MongoDB Connected');

//     // Create indexes
//     await db.collection('users').createIndex({ username: 1 }, { unique: true });
//     await db.collection('titles').createIndex({ supervisorId: 1 });
//     await db.collection('preferences').createIndex({ studentId: 1 }, { unique: true });
//     await db.collection('allocations').createIndex({ studentId: 1 }, { unique: true });

//     return db;
//   } catch (error) {
//     console.error('Database connection error:', error);
//     process.exit(1);
//   }
// };

// const getDB = () => {
//   if (!db) {
//     throw new Error('Database not initialized');
//   }
//   return db;
// };

// module.exports = { connectDB, getDB };

const { MongoClient } = require('mongodb');

let db = null;

const connectDB = async () => {
  try {
    // Validate environment variables
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const client = new MongoClient(process.env.MONGODB_URI, {
      // Connection options for better security and performance
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
    });

    await client.connect();

    // Use database name from environment or default
    const dbName = process.env.DB_NAME || 'title_allocation';
    db = client.db(dbName);

    console.log('MongoDB Connected successfully');

    // Create indexes
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('titles').createIndex({ supervisorId: 1 });
    await db.collection('preferences').createIndex({ studentId: 1 }, { unique: true });
    await db.collection('allocations').createIndex({ studentId: 1 }, { unique: true });

    return db;
  } catch (error) {
    console.error('Database connection error:', error.message);

    // Not exposing database errors in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database connection failed');
    } else {
      throw error;
    }
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
};

module.exports = { connectDB, getDB };