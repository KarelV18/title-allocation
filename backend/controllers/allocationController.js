const Allocation = require('../models/Allocation');
const Preference = require('../models/Preference');
const Title = require('../models/Title');
const User = require('../models/User');
const { ObjectId } = require('mongodb');

// Correct Gale-Shapley Algorithm Implementation
class GaleShapleyAllocation {
  constructor(students, titles) {
    this.students = students;
    this.titles = titles;
    this.allocations = new Map(); // titleId -> student
    this.studentMatches = new Map(); // studentId -> titleId
    this.titleCapacity = new Map();

    // Initialize capacity - each title can only be allocated to one student
    titles.forEach(title => {
      this.titleCapacity.set(title._id.toString(), 1);
    });

    // Store student preferences in proper format
    this.studentPreferences = new Map();
    this.titlePreferences = new Map(); // For tracking which students want which titles

    students.forEach(student => {
      // Sort preferences by rank (1 = highest priority)
      const sortedPrefs = student.preferences.sort((a, b) => a.rank - b.rank);
      this.studentPreferences.set(student.studentId.toString(), sortedPrefs);
    });

    // Build title preferences based on student submission time (first come first served)
    this.buildTitlePreferences();
  }

  

  buildTitlePreferences() {
    // For each title, build a list of students who want it, ordered by submission time
    this.titles.forEach(title => {
      const titleId = title._id.toString();
      const studentsWantingThisTitle = [];

      this.students.forEach(student => {
        const prefs = this.studentPreferences.get(student.studentId.toString());
        const prefForThisTitle = prefs.find(p => p.titleId.toString() === titleId);

        if (prefForThisTitle) {
          studentsWantingThisTitle.push({
            studentId: student.studentId,
            studentName: student.studentName,
            studentUsername: student.studentUsername,
            rank: prefForThisTitle.rank,
            submittedAt: student.submittedAt
          });
        }
      });

      // Sort by: 1) preference rank, 2) submission time (earlier first)
      studentsWantingThisTitle.sort((a, b) => {
        if (a.rank !== b.rank) {
          return a.rank - b.rank; // Lower rank (1) is better
        }
        return new Date(a.submittedAt) - new Date(b.submittedAt); // Earlier submission is better
      });

      this.titlePreferences.set(titleId, studentsWantingThisTitle);
    });
  }

  run() {
    let freeStudents = [...this.students];
    const proposals = new Map(); // Track how many proposals each student has made

    // Initialize proposals counter
    this.students.forEach(student => {
      proposals.set(student.studentId.toString(), 0);
    });

    while (freeStudents.length > 0) {
      const student = freeStudents[0];
      const studentId = student.studentId.toString();
      const proposalIndex = proposals.get(studentId);
      const preferences = this.studentPreferences.get(studentId);

      // If student has proposed to all preferences, they remain unmatched
      if (proposalIndex >= preferences.length) {
        freeStudents.shift();
        continue;
      }

      const preferredTitle = preferences[proposalIndex];
      const titleId = preferredTitle.titleId.toString();

      if (!this.allocations.has(titleId)) {
        // Title is free, allocate to student
        this.allocations.set(titleId, student);
        this.studentMatches.set(studentId, titleId);
        freeStudents.shift();
      } else {
        // Title is already allocated, check if this student has higher priority
        const currentStudent = this.allocations.get(titleId);
        const currentStudentId = currentStudent.studentId.toString();

        // Get the preference list for this title
        const titlePrefList = this.titlePreferences.get(titleId);

        // Find positions of current and proposing student in title's preference list
        const currentStudentIndex = titlePrefList.findIndex(s => s.studentId.toString() === currentStudentId);
        const newStudentIndex = titlePrefList.findIndex(s => s.studentId.toString() === studentId);

        // If new student has better position (lower index = higher preference)
        if (newStudentIndex < currentStudentIndex) {
          // Replace current student with new student
          this.allocations.set(titleId, student);
          this.studentMatches.set(studentId, titleId);

          // Remove old match and add old student back to free list
          this.studentMatches.delete(currentStudentId);
          freeStudents.shift(); // Remove new student from free list
          freeStudents.push(currentStudent); // Add old student back to free list

          // Reset proposal counter for the rejected student
          proposals.set(currentStudentId, proposals.get(currentStudentId) + 1);
        } else {
          // Current student keeps the title, move to next preference
          proposals.set(studentId, proposalIndex + 1);
        }
      }
    }

    return this.getAllocations();
  }

  getAllocations() {
    const results = [];

    for (const [titleId, student] of this.allocations) {
      const title = this.titles.find(t => t._id.toString() === titleId);
      if (title) {
        results.push({
          studentId: student.studentId,
          studentName: student.studentName,
          studentUsername: student.studentUsername,
          titleId: title._id,
          title: title.title,
          supervisorId: title.supervisorId,
          supervisorName: title.supervisorName,
          isCustomTitle: false,
          preferenceRank: this.getPreferenceRank(student.studentId.toString(), titleId)
        });
      }
    }

    // Handle unmatched students (shouldn't happen with proper preferences)
    const matchedStudentIds = new Set(Array.from(this.studentMatches.keys()));
    this.students.forEach(student => {
      const studentId = student.studentId.toString();
      if (!matchedStudentIds.has(studentId)) {
        console.log(`Student ${student.studentName} was not allocated any title`);
      }
    });

    return results;
  }

  getPreferenceRank(studentId, titleId) {
    const prefs = this.studentPreferences.get(studentId);
    const pref = prefs.find(p => p.titleId.toString() === titleId);
    return pref ? pref.rank : null;
  }
}

// Add method to calculate supervisor remaining capacity
const calculateSupervisorCapacity = (allocations, supervisors) => {
    const capacityMap = new Map();
    
    supervisors.forEach(supervisor => {
        capacityMap.set(supervisor._id.toString(), {
            capacity: supervisor.capacity || 0,
            current: 0,
            remaining: supervisor.capacity || 0
        });
    });
    
    allocations.forEach(allocation => {
        const supervisorId = allocation.supervisorId.toString();
        if (capacityMap.has(supervisorId)) {
            capacityMap.get(supervisorId).current++;
            capacityMap.get(supervisorId).remaining--;
        }
    });
    
    return capacityMap;
};

// Modified allocation algorithm to handle supervisor capacity
class EnhancedGaleShapleyAllocation extends GaleShapleyAllocation {
    constructor(students, titles, supervisors) {
        super(students, titles);
        this.supervisors = supervisors;
        this.supervisorCapacity = new Map();
        
        // Initialize supervisor capacity
        supervisors.forEach(supervisor => {
            this.supervisorCapacity.set(supervisor._id.toString(), {
                capacity: supervisor.capacity || 0,
                current: 0,
                remaining: supervisor.capacity || 0
            });
        });
    }

    run() {
        let freeStudents = [...this.students];
        const proposals = new Map();
        const unmatchedStudents = [];

        // Initialize proposals counter
        this.students.forEach(student => {
            proposals.set(student.studentId.toString(), 0);
        });

        while (freeStudents.length > 0) {
            const student = freeStudents[0];
            const studentId = student.studentId.toString();
            const proposalIndex = proposals.get(studentId);
            const preferences = this.studentPreferences.get(studentId);

            // If student has proposed to all preferences, they remain unmatched
            if (proposalIndex >= preferences.length) {
                unmatchedStudents.push(freeStudents.shift());
                continue;
            }

            const preferredTitle = preferences[proposalIndex];
            const titleId = preferredTitle.titleId.toString();
            const title = this.titles.find(t => t._id.toString() === titleId);
            
            if (!title) {
                proposals.set(studentId, proposalIndex + 1);
                continue;
            }

            const supervisorId = title.supervisorId.toString();
            const supervisorCap = this.supervisorCapacity.get(supervisorId);

            if (!this.allocations.has(titleId) && supervisorCap.remaining > 0) {
                // Title is free and supervisor has capacity
                this.allocations.set(titleId, student);
                this.studentMatches.set(studentId, titleId);
                supervisorCap.current++;
                supervisorCap.remaining--;
                freeStudents.shift();
            } else {
                // Title is allocated or supervisor has no capacity
                proposals.set(studentId, proposalIndex + 1);
            }
        }

        return {
            allocations: this.getAllocations(),
            unmatchedStudents: unmatchedStudents
        };
    }
}


  // Update the custom title allocation section in runAllocation function
const runAllocation = async (req, res) => {
    try {
        // Clear previous allocations
        await Allocation.deleteAll();

        // Get all data
        const preferences = await Preference.getAll();
        const approvedTitles = await Title.getAllApproved();
        const students = await User.getAllByRole('student');
        const supervisors = await User.getAllByRole('supervisor');

        if (preferences.length === 0) {
            return res.status(400).json({ message: 'No student preferences found' });
        }

        if (approvedTitles.length === 0) {
            return res.status(400).json({ message: 'No approved titles found' });
        }

        // Handle APPROVED custom titles first
        const customTitleAllocations = [];
        const studentsWithApprovedCustomTitles = new Set();

        for (const pref of preferences) {
            if (pref.customTitle && pref.customTitle.status === 'approved') {
                const student = students.find(s => s._id.toString() === pref.studentId.toString());
                let supervisor;

                if (pref.customTitle.approvedSupervisorId) {
                    supervisor = await User.findById(pref.customTitle.approvedSupervisorId);
                } else {
                    supervisor = await User.findByUsername(pref.customTitle.supervisorUsername) ||
                        supervisors.find(s => s.name === pref.customTitle.supervisorName);
                }

                if (supervisor && student) {
                    customTitleAllocations.push({
                        studentId: pref.studentId,
                        studentName: student.name,
                        studentUsername: student.username,
                        titleId: new ObjectId(),
                        title: pref.customTitle.title + '*',
                        supervisorId: supervisor._id,
                        supervisorName: supervisor.name,
                        isCustomTitle: true,
                        isApprovedCustomTitle: true,
                        needsSupervisor: false
                    });
                    studentsWithApprovedCustomTitles.add(pref.studentId.toString());
                }
            }
        }

        // Prepare student data for regular allocation
        const studentData = await Promise.all(
            preferences
                .filter(pref => !studentsWithApprovedCustomTitles.has(pref.studentId.toString()))
                .map(async pref => {
                    const student = students.find(s => s._id.toString() === pref.studentId.toString());
                    return {
                        studentId: pref.studentId,
                        studentName: student?.name || 'Unknown',
                        studentUsername: student?.username || 'Unknown',
                        preferences: pref.preferences.sort((a, b) => a.rank - b.rank),
                        submittedAt: pref.submittedAt,
                        customTitle: pref.customTitle,
                        hasRejectedCustomTitle: pref.customTitle && pref.customTitle.status === 'rejected'
                    };
                })
        );

        // Run enhanced Gale-Shapley for regular titles
        let regularAllocations = [];
        let unmatchedStudents = [];
        
        if (studentData.length > 0) {
            const algorithm = new EnhancedGaleShapleyAllocation(studentData, approvedTitles, supervisors);
            const result = algorithm.run();
            regularAllocations = result.allocations;
            unmatchedStudents = result.unmatchedStudents;
        }

        // Handle students who couldn't be allocated due to capacity
        const needsSupervisorAllocations = [];
        for (const student of unmatchedStudents) {
            // Find their top 3 preferences
            const topPreferences = student.preferences.slice(0, 3);
            if (topPreferences.length > 0) {
                const preferredTitle = topPreferences[0];
                const title = approvedTitles.find(t => t._id.toString() === preferredTitle.titleId.toString());
                
                if (title) {
                    needsSupervisorAllocations.push({
                        studentId: student.studentId,
                        studentName: student.studentName,
                        studentUsername: student.studentUsername,
                        titleId: title._id,
                        title: title.title,
                        originalSupervisorId: title.supervisorId,
                        originalSupervisorName: title.supervisorName,
                        supervisorId: null, // Will be assigned by admin
                        supervisorName: null,
                        isCustomTitle: false,
                        needsSupervisor: true,
                        preferenceRank: preferredTitle.rank,
                        isTop3: true
                    });
                }
            }
        }

        // Combine all allocations
        const allAllocations = [...regularAllocations, ...customTitleAllocations, ...needsSupervisorAllocations];

        // Save allocations to database
        for (const allocation of allAllocations) {
            await Allocation.create(allocation);
        }

        // Generate allocation statistics
        const stats = {
            totalStudents: preferences.length,
            studentsWithApprovedCustomTitles: customTitleAllocations.length,
            studentsWithRegularAllocations: regularAllocations.length,
            studentsNeedingSupervisor: needsSupervisorAllocations.length,
            unmatchedStudents: unmatchedStudents.length,
            preferenceDistribution: calculatePreferenceStats(regularAllocations)
        };

        res.json({
            message: 'Allocation completed successfully',
            allocations: allAllocations.length,
            statistics: stats
        });
    } catch (error) {
        console.error('Allocation error:', error);
        res.status(500).json({ message: 'Allocation failed: ' + error.message });
    }
};


// Helper function to calculate preference statistics
function calculatePreferenceStats(allocations) {
  const stats = { rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0 };

  allocations.forEach(allocation => {
    if (allocation.preferenceRank === 1) stats.rank1++;
    else if (allocation.preferenceRank === 2) stats.rank2++;
    else if (allocation.preferenceRank === 3) stats.rank3++;
    else if (allocation.preferenceRank === 4) stats.rank4++;
    else if (allocation.preferenceRank === 5) stats.rank5++;
  });

  return stats;
}

const getAllocations = async (req, res) => {
  try {
    let allocations;

    if (req.user.role === 'student') {
      allocations = await Allocation.findByStudent(req.user._id);
    } else if (req.user.role === 'supervisor') {
      allocations = await Allocation.findBySupervisor(req.user._id);
    } else {
      allocations = await Allocation.getAll();
    }

    res.json(allocations || []);
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({ message: 'Failed to get allocations' });
  }
};

// Add allocation statistics endpoint
const getAllocationStats = async (req, res) => {
  try {
    const allocations = await Allocation.getAll();
    const preferences = await Preference.getAll();

    const stats = {
      totalStudents: preferences.length,
      allocatedStudents: allocations.length,
      unallocatedStudents: preferences.length - allocations.length,
      customTitles: allocations.filter(a => a.isCustomTitle).length
    };

    res.json(stats);
  } catch (error) {
    console.error('Get allocation stats error:', error);
    res.status(500).json({ message: 'Failed to get allocation statistics' });
  }
};

module.exports = { runAllocation, getAllocations, getAllocationStats };