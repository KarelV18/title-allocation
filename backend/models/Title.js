const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class Title {
  static collection() {
    return getDB().collection('titles');
  }

  static async create(titleData) {
    const title = {
      title: titleData.title,
      description: titleData.description,
      supervisorId: new ObjectId(titleData.supervisorId),
      supervisorName: titleData.supervisorName,
      status: 'pending', // pending, approved, rejected
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection().insertOne(title);
    return { ...title, _id: result.insertedId };
  }

  static async findBySupervisor(supervisorId) {
    return await this.collection().find({ supervisorId: new ObjectId(supervisorId) }).toArray();
  }

  static async getAllApproved() {
    return await this.collection().find({ status: 'approved' }).toArray();
  }

  static async getAll() {
    return await this.collection().find().toArray();
  }

  static async updateStatus(titleId, status) {
    return await this.collection().updateOne(
      { _id: new ObjectId(titleId) },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      }
    );
  }

  static async update(titleId, updateData) {
    return await this.collection().updateOne(
      { _id: new ObjectId(titleId) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
  }

  static async delete(titleId) {
    return await this.collection().deleteOne({ _id: new ObjectId(titleId) });
  }

  static async findById(titleId) {
    return await this.collection().findOne({ _id: new ObjectId(titleId) });
  }
}

module.exports = Title;