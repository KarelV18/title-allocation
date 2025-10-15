const { getDB } = require('../config/database');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

class User {
  static collection() {
    return getDB().collection('users');
  }

  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = {
      username: userData.username,
      password: hashedPassword,
      role: userData.role,
      name: userData.name || userData.fullName, // Handle both name and fullName
      email: userData.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection().insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  static async findByUsername(username) {
    return await this.collection().findOne({ username });
  }

  static async findById(id) {
    if (typeof id === 'string') {
      id = new ObjectId(id);
    }
    return await this.collection().findOne({ _id: id });
  }

  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    if (typeof userId === 'string') {
      userId = new ObjectId(userId);
    }
    return await this.collection().updateOne(
      { _id: userId },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAllByRole(role) {
    return await this.collection().find({ role }).toArray();
  }

  static async getAll() {
    return await this.collection().find().toArray();
  }
}

module.exports = User;