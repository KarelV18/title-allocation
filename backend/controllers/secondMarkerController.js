const Allocation = require('../models/Allocation');
const User = require('../models/User');
const { ObjectId } = require('mongodb');

class SecondMarkerAssignment {
    constructor(allocations, supervisors) {
        this.allocations = allocations;
        this.supervisors = supervisors;
        this.supervisorMap = new Map();
        this.assignments = new Map(); // studentId -> secondMarkerId
        this.supervisorWorkload = new Map(); // supervisorId -> { supervisionCount: number, secondMarkingCount: number }
        this.supervisorPairs = new Map(); // supervisorId -> Set of second markers they work with
    }

    initialize() {
        // Calculate supervision count for each supervisor
        this.supervisors.forEach(supervisor => {
            const supervisorId = supervisor._id.toString();
            const supervisionCount = this.allocations.filter(a => 
                a.supervisorId && a.supervisorId.toString() === supervisorId
            ).length;

            this.supervisorMap.set(supervisorId, supervisor);
            this.supervisorWorkload.set(supervisorId, {
                supervisionCount: supervisionCount,
                secondMarkingCount: 0,
                remainingCapacity: supervisionCount // for second marking
            });
            this.supervisorPairs.set(supervisorId, new Set());
        });
    }

    assignSecondMarkers() {
        this.initialize();

        // Group allocations by supervisor
        const allocationsBySupervisor = new Map();
        this.allocations.forEach(allocation => {
            if (allocation.supervisorId) {
                const supervisorId = allocation.supervisorId.toString();
                if (!allocationsBySupervisor.has(supervisorId)) {
                    allocationsBySupervisor.set(supervisorId, []);
                }
                allocationsBySupervisor.get(supervisorId).push(allocation);
            }
        });

        // Create a list of all supervisor pairs and their potential assignments
        const supervisorPairs = [];
        
        for (const [supervisorId, allocations] of allocationsBySupervisor) {
            const supervisorWorkload = this.supervisorWorkload.get(supervisorId);
            const requiredSecondMarkings = supervisorWorkload.supervisionCount;

            // Get potential second markers (all other supervisors with capacity)
            const potentialMarkers = Array.from(this.supervisorWorkload.entries())
                .filter(([markerId, workload]) => 
                    markerId !== supervisorId && 
                    workload.remainingCapacity > 0
                )
                .map(([markerId, workload]) => ({
                    markerId,
                    remainingCapacity: workload.remainingCapacity,
                    currentPairs: this.supervisorPairs.get(supervisorId).has(markerId) ? 1 : 0
                }));

            // Sort by existing pairs first (to minimize new pairs), then by capacity
            potentialMarkers.sort((a, b) => {
                if (b.currentPairs !== a.currentPairs) {
                    return b.currentPairs - a.currentPairs; // Prefer existing pairs
                }
                return b.remainingCapacity - a.remainingCapacity; // Then by capacity
            });

            supervisorPairs.push({
                supervisorId,
                allocations,
                requiredSecondMarkings,
                potentialMarkers
            });
        }

        // Sort supervisors by difficulty (fewest potential markers first)
        supervisorPairs.sort((a, b) => a.potentialMarkers.length - b.potentialMarkers.length);

        // Assign second markers using a greedy approach
        for (const pair of supervisorPairs) {
            this.assignForSupervisor(pair);
        }

        // Handle any remaining unassigned students
        this.handleRemainingAssignments();

        return this.getAssignmentResults();
    }

    assignForSupervisor({ supervisorId, allocations, requiredSecondMarkings, potentialMarkers }) {
        let assignedCount = 0;
        
        // Try to assign using existing pairs first
        for (const allocation of allocations) {
            if (assignedCount >= requiredSecondMarkings) break;

            const existingPairs = Array.from(this.supervisorPairs.get(supervisorId));
            const availableExisting = potentialMarkers.filter(marker => 
                existingPairs.includes(marker.markerId) && 
                marker.remainingCapacity > 0
            );

            if (availableExisting.length > 0) {
                const marker = availableExisting[0];
                this.assignStudent(allocation, marker.markerId);
                assignedCount++;
                marker.remainingCapacity--;
            }
        }

        // Assign remaining using new markers if needed
        for (const allocation of allocations) {
            if (assignedCount >= requiredSecondMarkings) break;
            if (this.assignments.has(allocation.studentId.toString())) continue;

            const availableMarker = potentialMarkers.find(marker => marker.remainingCapacity > 0);
            if (availableMarker) {
                this.assignStudent(allocation, availableMarker.markerId);
                assignedCount++;
                availableMarker.remainingCapacity--;
            }
        }
    }

    assignStudent(allocation, secondMarkerId) {
        const studentId = allocation.studentId.toString();
        const supervisorId = allocation.supervisorId.toString();

        this.assignments.set(studentId, secondMarkerId);
        
        // Update workload
        const markerWorkload = this.supervisorWorkload.get(secondMarkerId);
        markerWorkload.secondMarkingCount++;
        markerWorkload.remainingCapacity--;

        // Update pairs
        this.supervisorPairs.get(supervisorId).add(secondMarkerId);
        this.supervisorPairs.get(secondMarkerId).add(supervisorId);
    }

    handleRemainingAssignments() {
        // Get unassigned students
        const unassignedStudents = this.allocations.filter(allocation => 
            !this.assignments.has(allocation.studentId.toString())
        );

        for (const allocation of unassignedStudents) {
            const supervisorId = allocation.supervisorId.toString();
            
            // Find any available second marker (not the supervisor themselves)
            const availableMarker = Array.from(this.supervisorWorkload.entries())
                .find(([markerId, workload]) => 
                    markerId !== supervisorId && 
                    workload.remainingCapacity > 0
                );

            if (availableMarker) {
                this.assignStudent(allocation, availableMarker[0]);
            } else {
                console.warn(`Could not assign second marker for student: ${allocation.studentName}`);
            }
        }
    }

    getAssignmentResults() {
        const results = [];
        const statistics = {
            totalAssignments: this.assignments.size,
            supervisorPairStats: []
        };

        // Build results array
        this.allocations.forEach(allocation => {
            const studentId = allocation.studentId.toString();
            const secondMarkerId = this.assignments.get(studentId);
            const secondMarker = secondMarkerId ? this.supervisorMap.get(secondMarkerId) : null;

            results.push({
                studentId: allocation.studentId,
                studentUsername: allocation.studentUsername,
                studentName: allocation.studentName,
                studentEmail: allocation.studentEmail, // We'll need to fetch this
                title: allocation.title,
                supervisorId: allocation.supervisorId,
                supervisorName: allocation.supervisorName,
                secondMarkerId: secondMarkerId,
                secondMarkerName: secondMarker ? secondMarker.name : 'Not Assigned'
            });
        });

        // Calculate statistics
        this.supervisorPairs.forEach((pairs, supervisorId) => {
            const supervisor = this.supervisorMap.get(supervisorId);
            const workload = this.supervisorWorkload.get(supervisorId);
            
            statistics.supervisorPairStats.push({
                supervisorName: supervisor.name,
                supervisionCount: workload.supervisionCount,
                secondMarkingCount: workload.secondMarkingCount,
                uniquePairs: pairs.size,
                pairs: Array.from(pairs).map(markerId => this.supervisorMap.get(markerId).name)
            });
        });

        return {
            assignments: results,
            statistics: statistics
        };
    }
}

// Controller function to assign second markers
const assignSecondMarkers = async (req, res) => {
    try {
        const allocations = await Allocation.getAll();
        const supervisors = await User.getAllByRole('supervisor');

        // Filter allocations that have supervisors assigned
        const supervisedAllocations = allocations.filter(a => a.supervisorId);

        const assignmentEngine = new SecondMarkerAssignment(supervisedAllocations, supervisors);
        const results = assignmentEngine.assignSecondMarkers();

        res.json({
            message: 'Second markers assigned successfully',
            assignments: results.assignments,
            statistics: results.statistics
        });
    } catch (error) {
        console.error('Error assigning second markers:', error);
        res.status(500).json({ message: 'Error assigning second markers: ' + error.message });
    }
};

// Get second marker assignments
const getSecondMarkerAssignments = async (req, res) => {
    try {
        // In a real implementation, you might want to store assignments in database
        // For now, we'll calculate on the fly
        const allocations = await Allocation.getAll();
        const supervisors = await User.getAllByRole('supervisor');
        const supervisedAllocations = allocations.filter(a => a.supervisorId);

        const assignmentEngine = new SecondMarkerAssignment(supervisedAllocations, supervisors);
        const results = assignmentEngine.assignSecondMarkers();

        res.json(results.assignments);
    } catch (error) {
        console.error('Error fetching second marker assignments:', error);
        res.status(500).json({ message: 'Error fetching second marker assignments' });
    }
};

module.exports = {
    assignSecondMarkers,
    getSecondMarkerAssignments,
    SecondMarkerAssignment
};