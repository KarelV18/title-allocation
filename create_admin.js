require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://msharma_db:Tit13_system@cluster0.ddd6yk5.mongodb.net/title-allocation?retryWrites=true&w=majority';

async function createAdmin() {
  let client;
  
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      name: 'System Administrator',
      email: 'm.sharma@mdx.ac.mu',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(adminUser);
    console.log('Admin user created successfully with ID:', result.insertedId);

  } catch (err) {
    console.error('Error creating admin user:', err);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

createAdmin();