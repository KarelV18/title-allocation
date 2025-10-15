const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class Preference {
  static collection() {
    return getDB().collection('preferences');
  }

  static async create(preferenceData) {
    const preference = {
      studentId: new ObjectId(preferenceData.studentId),
      preferences: preferenceData.preferences.map(pref => ({
        titleId: new ObjectId(pref.titleId),
        rank: pref.rank,
        title: pref.title,
        supervisorName: pref.supervisorName
      })),
      customTitle: preferenceData.customTitle ? {
        title: preferenceData.customTitle.title,
        supervisorName: preferenceData.customTitle.supervisorName,
        supervisorUsername: preferenceData.customTitle.supervisorUsername,
        status: 'pending', // pending, approved, rejected
        approvedSupervisorId: null,
        approvedAt: null,
        rejectedReason: null
      } : null,
      submittedAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection().insertOne(preference);
    return { ...preference, _id: result.insertedId };
  }

  static async findByStudent(studentId) {
    return await this.collection().findOne({ studentId: new ObjectId(studentId) });
  }

  static async getAll() {
    return await this.collection().find().toArray();
  }

  static async update(studentId, updateData) {
    return await this.collection().updateOne(
      { studentId: new ObjectId(studentId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
  }

  static async updateCustomTitleStatus(studentId, status, approvedSupervisorId = null, rejectedReason = null) {
    const updateData = {
      'customTitle.status': status,
      'customTitle.updatedAt': new Date(),
      updatedAt: new Date()
    };

    if (status === 'approved' && approvedSupervisorId) {
      updateData['customTitle.approvedSupervisorId'] = new ObjectId(approvedSupervisorId);
      updateData['customTitle.approvedAt'] = new Date();
    }

    if (status === 'rejected' && rejectedReason) {
      updateData['customTitle.rejectedReason'] = rejectedReason;
    }

    return await this.collection().updateOne(
      { studentId: new ObjectId(studentId) },
      { $set: updateData }
    );
  }

  static async getByCustomTitleStatus(status) {
    return await this.collection().find({
      'customTitle.status': status
    }).toArray();
  }

  static async deleteByStudent(studentId) {
    return await this.collection().deleteOne({ studentId: new ObjectId(studentId) });
  }
}

module.exports = Preference;