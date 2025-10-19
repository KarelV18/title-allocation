const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class SystemSettings {
    static collection() {
        return getDB().collection('systemsettings');
    }

    static async getSettings() {
        let settings = await this.collection().findOne({});
        if (!settings) {
            // Initialize with default settings
            settings = {
                preferenceDeadline: null,
                allocationCompleted: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await this.collection().insertOne(settings);
        }
        return settings;
    }

    static async updatePreferenceDeadline(deadline) {
        return await this.collection().updateOne(
            {},
            {
                $set: {
                    preferenceDeadline: new Date(deadline),
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
    }

    static async setAllocationCompleted(completed) {
        return await this.collection().updateOne(
            {},
            {
                $set: {
                    allocationCompleted: completed,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
    }

    static async isBeforeDeadline() {
        const settings = await this.getSettings();
        if (!settings.preferenceDeadline) {
            return true; // No deadline set, always allow
        }
        return new Date() < new Date(settings.preferenceDeadline);
    }

    static async updateTitleSubmissionDeadline(deadline) {
        return await this.collection().updateOne(
            {},
            {
                $set: {
                    titleSubmissionDeadline: new Date(deadline),
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
    }

    static async isBeforeTitleSubmissionDeadline() {
        const settings = await this.getSettings();
        if (!settings.titleSubmissionDeadline) {
            return true; // No deadline set, always allow
        }
        return new Date() < new Date(settings.titleSubmissionDeadline);
    }

    static async isAllocationCompleted() {
        const settings = await this.getSettings();
        return settings.allocationCompleted || false;
    }

    // Add new method for allocation publishing
    static async setAllocationPublished(published) {
        return await this.collection().updateOne(
            {},
            {
                $set: {
                    allocationPublished: published,
                    publishedAt: published ? new Date() : null,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
    }

    static async isAllocationPublished() {
        const settings = await this.getSettings();
        return settings.allocationPublished || false;
    }
}

module.exports = SystemSettings;