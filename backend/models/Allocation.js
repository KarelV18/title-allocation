const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class Allocation {
  static collection() {
    return getDB().collection('allocations');
  }

  // Add new methods to Allocation model
  static async getNeedsSupervisor() {
    return await this.collection().find({ needsSupervisor: true }).toArray();
  }

  static async updateSupervisor(allocationId, supervisorId, supervisorName) {
    return await this.collection().updateOne(
      { _id: new ObjectId(allocationId) },
      {
        $set: {
          supervisorId: new ObjectId(supervisorId),
          supervisorName: supervisorName,
          needsSupervisor: false,
          assignedAt: new Date()
        }
      }
    );
  }

  // Update create method to include needsSupervisor field
  static async create(allocationData) {
    const allocation = {
      studentId: new ObjectId(allocationData.studentId),
      studentName: allocationData.studentName,
      studentUsername: allocationData.studentUsername,
      titleId: new ObjectId(allocationData.titleId),
      title: allocationData.title,
      supervisorId: allocationData.supervisorId ? new ObjectId(allocationData.supervisorId) : null,
      supervisorName: allocationData.supervisorName || null,
      originalSupervisorId: allocationData.originalSupervisorId ? new ObjectId(allocationData.originalSupervisorId) : null,
      originalSupervisorName: allocationData.originalSupervisorName || null,
      isCustomTitle: allocationData.isCustomTitle || false,
      needsSupervisor: allocationData.needsSupervisor || false,
      isTop3: allocationData.isTop3 || false,
      preferenceRank: allocationData.preferenceRank || null,
      notified: allocationData.notified || false, // Add this line
      allocatedAt: new Date()
    };

    const result = await this.collection().insertOne(allocation);
    return { ...allocation, _id: result.insertedId };
  }

  // Add method to mark allocation as notified
  static async markAsNotified(allocationId) {
    return await this.collection().updateOne(
      { _id: new ObjectId(allocationId) },
      { $set: { notified: true, notifiedAt: new Date() } }
    );
  }

  // Add method to get unread notifications for student
  static async getUnreadNotifications(studentId) {
    return await this.collection().find({
      studentId: new ObjectId(studentId),
      notified: false
    }).toArray();
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