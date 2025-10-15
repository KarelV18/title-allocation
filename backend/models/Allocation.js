const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class Allocation {
  static collection() {
    return getDB().collection('allocations');
  }

  static async create(allocationData) {
    const allocation = {
      studentId: new ObjectId(allocationData.studentId),
      studentName: allocationData.studentName,
      studentUsername: allocationData.studentUsername,
      titleId: new ObjectId(allocationData.titleId),
      title: allocationData.title,
      supervisorId: new ObjectId(allocationData.supervisorId),
      supervisorName: allocationData.supervisorName,
      isCustomTitle: allocationData.isCustomTitle || false,
      allocatedAt: new Date()
    };

    const result = await this.collection().insertOne(allocation);
    return { ...allocation, _id: result.insertedId };
  }

  static async findByStudent(studentId) {
    return await this.collection().findOne({ studentId: new ObjectId(studentId) });
  }

  static async findBySupervisor(supervisorId) {
    return await this.collection().find({ supervisorId: new ObjectId(supervisorId) }).toArray();
  }

static async getAll() {
    try {
        return await this.collection().find().toArray();
    } catch (error) {
        console.error('Error getting all allocations:', error);
        throw error;
    }
}

  static async deleteAll() {
    return await this.collection().deleteMany({});
  }

  static async isTitleAllocated(titleId) {
    const allocation = await this.collection().findOne({ titleId: new ObjectId(titleId) });
    return !!allocation;
  }
}

module.exports = Allocation;