class Auth {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    init() {
        if (this.token && this.user) {
            this.showMainApp();
        } else {
            this.showLogin();
        }

        $('#login-form').on('submit', (e) => this.handleLogin(e));
        $('#logout-btn').on('click', () => this.handleLogout());
    }

    async handleLogin(e) {
        e.preventDefault();

        const username = $('#username').val();
        const password = $('#password').val();

        try {
            const response = await $.ajax({
                url: '/api/auth/login',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ username, password })
            });

            this.token = response.token;
            this.user = response.user;

            localStorage.setItem('token', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));

            this.showMainApp();
        } catch (error) {
            await SweetAlert.error('Invalid Credentials');

            // $('#login-error').text('Invalid credentials').removeClass('hidden');
        }
    }

    handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;
        this.showLogin();
    }

    showLogin() {
        $('#login-page').removeClass('hidden');
        $('#main-app').addClass('hidden');
        $('#login-form')[0].reset();
        $('#login-error').addClass('hidden');
    }

    showMainApp() {
        $('#login-page').addClass('hidden');
        $('#main-app').removeClass('hidden');
        $('#user-info').text(`Welcome, ${this.user.name} (${this.user.role})`);
        $('#nav-title').text(`Title Allocation System - ${this.user.role.charAt(0).toUpperCase() + this.user.role.slice(1)} Dashboard`);

        // Load appropriate dashboard based on role
        this.loadDashboard();
    }

    loadDashboard() {
        const role = this.user.role;
        const content = $('#content');

        content.empty();

        switch (role) {
            case 'admin':
                this.loadAdminDashboard(content);
                break;
            case 'supervisor':
                this.loadSupervisorDashboard(content);
                break;
            case 'student':
                this.loadStudentDashboard(content);
                break;
            default:
                content.html('<p>Unknown user role</p>');
        }
    }

    loadAdminDashboard(content) {
        content.html(`
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="manage-titles-card">
            <h3 class="text-lg font-semibold mb-2">Title Management</h3>
            <p class="text-gray-600 text-sm">Manage and approve supervisor titles</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="manage-users-card">
            <h3 class="text-lg font-semibold mb-2">User Management</h3>
            <p class="text-gray-600 text-sm">Manage users and bulk upload</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="student-choices-card">
            <h3 class="text-lg font-semibold mb-2">Student Choices</h3>
            <p class="text-gray-600 text-sm">View all student preferences & custom titles</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="custom-titles-card">
            <h3 class="text-lg font-semibold mb-2">Custom Titles</h3>
            <p class="text-gray-600 text-sm">Manage student proposed custom titles</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="run-allocation-card">
            <h3 class="text-lg font-semibold mb-2">Allocation</h3>
            <p class="text-gray-600 text-sm">Run title allocation process</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="finalized-allocations-card">
            <h3 class="text-lg font-semibold mb-2">Finalized Allocations</h3>
            <p class="text-gray-600 text-sm">View complete allocation results</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="supervisor-assignment-card">
            <h3 class="text-lg font-semibold mb-2">Supervisor Assignment</h3>
            <p class="text-gray-600 text-sm">Assign supervisors to pending allocations</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="capacity-conflicts-card">
            <h3 class="text-lg font-semibold mb-2">Capacity Conflicts</h3>
            <p class="text-gray-600 text-sm">Resolve supervisor capacity issues</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="second-marker-card">
            <h3 class="text-lg font-semibold mb-2">Second Markers</h3>
            <p class="text-gray-600 text-sm">Assign second markers for VIVA examinations</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="cache-stats-card">
            <h3 class="text-lg font-semibold mb-2">Cache Statistics</h3>
            <p class="text-gray-600 text-sm">View system cache usage and performance</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="system-settings-card">
            <h3 class="text-lg font-semibold mb-2">System Settings</h3>
            <p class="text-gray-600 text-sm">Set deadlines and allocation status</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="generate-report-card">
            <h3 class="text-lg font-semibold mb-2">Reports</h3>
            <p class="text-gray-600 text-sm">Generate allocation reports</p>
        </div>
    </div>
    <div id="admin-content" class="mt-6"></div>
    `);

        // Add click handlers (existing ones remain the same)
        $('#manage-titles-card').on('click', () => {
            if (window.adminDashboard) {
                window.adminDashboard.loadTitleManagement();
            }
        });

        $('#manage-users-card').on('click', () => {
            if (window.adminDashboard) {
                window.adminDashboard.loadUserManagement();
            }
        });

        $('#student-choices-card').on('click', () => {
            if (window.adminDashboard) {
                window.adminDashboard.loadStudentChoices();
            }
        });

        $('#custom-titles-card').on('click', () => {
            if (window.adminDashboard) {
                window.adminDashboard.loadCustomTitles();
            }
        });

        $('#run-allocation-card').on('click', () => {
            if (window.adminDashboard) {
                window.adminDashboard.runAllocation();
            }
        });

        $('#supervisor-assignment-card').on('click', () => {
            if (window.adminDashboard) {
                window.adminDashboard.loadSupervisorAssignment();
            }
        });

        $('#capacity-conflicts-card').on('click', () => {
            if (window.adminDashboard) {
                window.adminDashboard.loadCapacityConflicts();
            }
        });

        // ADD THE NEW SECOND MARKER CARD HANDLER
        $('#second-marker-card').on('click', () => {
            if (window.adminDashboard) {
                window.adminDashboard.loadSecondMarkerAssignment();
            }
        });

        $('#system-settings-card').on('click', () => {
            if (window.adminDashboard) {
                window.adminDashboard.loadSystemSettings();
            }
        });

        $('#generate-report-card').on('click', () => {
            if (window.adminDashboard) {
                window.adminDashboard.generateReport();
            }
        });

        $('#finalized-allocations-card').on('click', () => {
            if (window.adminDashboard) {
                window.adminDashboard.loadFinalizedAllocations();
            }
        });

        $('#cache-stats-card').on('click', () => {
            if (window.adminDashboard) {
                window.adminDashboard.loadCacheStatistics();
            }
        });

        // Initialize admin dashboard
        if (typeof AdminDashboard !== 'undefined') {
            window.adminDashboard = new AdminDashboard();
            // Load student choices by default for better overview
            window.adminDashboard.loadStudentChoices();
        }
    }

    loadSupervisorDashboard(content) {
        content.html(`
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="view-titles-card">
                <h3 class="text-lg font-semibold mb-2">My Titles</h3>
                <p class="text-gray-600 text-sm">View and manage your proposed titles</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="view-students-card">
                <h3 class="text-lg font-semibold mb-2">My Students</h3>
                <p class="text-gray-600 text-sm">View students allocated to your titles</p>
            </div>
        </div>
        <div id="supervisor-content" class="mt-6"></div>
    `);

        $('#view-titles-card').on('click', () => {
            if (window.supervisorDashboard) {
                window.supervisorDashboard.loadMyTitles();
            }
        });

        $('#view-students-card').on('click', () => {
            if (window.supervisorDashboard) {
                window.supervisorDashboard.loadStudentAllocations();
            }
        });

        // Initialize supervisor dashboard
        if (typeof SupervisorDashboard !== 'undefined') {
            window.supervisorDashboard = new SupervisorDashboard();
        }
    }

    loadStudentDashboard(content) {
        content.html(`
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="select-preferences-card">
                <h3 class="text-lg font-semibold mb-2">Select Preferences</h3>
                <p class="text-gray-600 text-sm">Choose your top 5 title preferences</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="view-allocation-card">
                <h3 class="text-lg font-semibold mb-2">My Allocation</h3>
                <p class="text-gray-600 text-sm">View your allocated title and supervisor</p>
            </div>
        </div>
        <div id="student-content" class="mt-6"></div>
    `);

        $('#select-preferences-card').on('click', () => {
            if (window.studentDashboard) {
                window.studentDashboard.loadTitleSelection();
            }
        });

        $('#view-allocation-card').on('click', () => {
            if (window.studentDashboard) {
                window.studentDashboard.loadMyAllocation();
            }
        });

        // Initialize student dashboard
        if (typeof StudentDashboard !== 'undefined') {
            window.studentDashboard = new StudentDashboard();
        }
    }
}

// Initialize auth when document is ready
$(document).ready(() => {
    // Don't initialize if window.auth already exists (to avoid duplicates)
    if (!window.auth) {
        window.auth = new Auth();
    }
});