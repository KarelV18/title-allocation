class StudentDashboard {
    constructor() {
        this.apiCache = window.apiCache;
        this.init();
    }

    init() {
        this.loadDashboard();
        this.attachEventListeners();
        this.checkAllocationStatus();
        this.checkNotifications();

    }

    attachEventListeners() {
        $(document).on('click', '#select-preferences-btn', () => this.loadTitleSelection());
        $(document).on('click', '#view-allocation-btn', () => this.loadMyAllocation());
        $(document).on('click', '.preference-title', (e) => this.selectTitle(e));
        $(document).on('click', '#submit-preferences-btn', () => this.submitPreferences());
        $(document).on('click', '#add-custom-title-btn', () => this.toggleCustomTitle());
        $(document).on('click', '#cancel-custom-title', () => this.toggleCustomTitle());
        $(document).on('submit', '#custom-title-form', (e) => this.handleCustomTitle(e));
    }

    async loadDashboard() {
        try {

            const [settings, allocation, canEditResponse] = await Promise.all([
                this.apiCache.call('/api/system-settings').catch(() => ({ preferenceDeadline: null, allocationCompleted: false })),
                this.apiCache.call('/api/allocations').catch(() => null),
                this.apiCache.call('/api/system-settings/can-edit-preferences').catch(() => ({ canEdit: true, allocationCompleted: false }))
            ]);
            // const [settings, allocation, canEditResponse] = await Promise.all([
            //     $.ajax({
            //         url: '/api/system-settings',
            //         method: 'GET',
            //         headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            //     }).catch(() => ({ preferenceDeadline: null, allocationCompleted: false })),

            //     $.ajax({
            //         url: '/api/allocations',
            //         method: 'GET',
            //         headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            //     }).catch(() => null),

            //     $.ajax({
            //         url: '/api/system-settings/can-edit-preferences',
            //         method: 'GET',
            //         headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            //     }).catch(() => ({ canEdit: true, allocationCompleted: false }))
            // ]);

            const canEditPreferences = canEditResponse.canEdit;
            const allocationCompleted = settings.allocationCompleted;
            const hasAllocation = allocation !== null;

            let html = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">`;

            // Select Preferences Card - show if deadline hasn't passed
            if (canEditPreferences) {
                html += `
            <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="select-preferences-card">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold">Select Preferences</h3>
                </div>
                <p class="text-gray-600 text-sm mb-2">Choose your top 5 title preferences</p>
                ${hasAllocation ? `
                    <p class="text-xs text-blue-600">✓ You can update your existing preferences</p>
                ` : ''}
                ${settings.preferenceDeadline ? `
                    <p class="text-xs text-orange-600 mt-1">
                        ⏰ Deadline: ${new Date(settings.preferenceDeadline).toLocaleString()}
                    </p>
                ` : ''}
            </div>
            `;
            }

            // My Allocation Card - show if allocation exists or allocation is completed
            if (hasAllocation || allocationCompleted) {
                const cardClass = hasAllocation ?
                    (allocation.isCustomTitle ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200') :
                    'bg-gray-50 border border-gray-200';

                const iconColor = hasAllocation ? 'text-green-600' : 'text-gray-600';
                const statusText = hasAllocation ?
                    (allocation.isCustomTitle ? 'Custom Title Allocated' : 'Title Allocated') :
                    'View Allocation Status';

                html += `
            <div class="${cardClass} p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" id="view-allocation-card">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 ${hasAllocation ? 'bg-green-100' : 'bg-gray-100'} rounded-full flex items-center justify-center mr-3">
                        <svg class="w-5 h-5 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold">My Allocation</h3>
                </div>
                <p class="text-gray-600 text-sm mb-2">${hasAllocation ? 'View your allocated title and supervisor' : 'Check your allocation status'}</p>
                <p class="text-xs ${hasAllocation ? 'text-green-600' : 'text-gray-600'} font-semibold">${statusText}</p>
            </div>
            `;
            }

            // If no cards are available, show appropriate message
            if (!canEditPreferences && !(hasAllocation || allocationCompleted)) {
                html = `
            <div class="bg-white rounded-lg shadow p-6 text-center col-span-2">
                <div class="py-8">
                    <div class="text-4xl mb-4">⏳</div>
                    <h3 class="text-xl font-semibold text-gray-700 mb-2">Allocation in Progress</h3>
                    <p class="text-gray-600">The project allocation process is currently underway. Please check back later.</p>
                </div>
            </div>
            `;
            }

            html += `</div><div id="student-content" class="mt-6"></div>`;
            $('#content').html(html);

            // Attach event listeners conditionally
            if (canEditPreferences) {
                $('#select-preferences-card').on('click', () => this.loadTitleSelection());
            }
            if (hasAllocation || allocationCompleted) {
                $('#view-allocation-card').on('click', () => this.loadMyAllocation());
            }

            // Auto-load appropriate content
            if (hasAllocation) {
                this.loadMyAllocation();
            } else if (canEditPreferences) {
                this.loadTitleSelection();
            } else if (allocationCompleted) {
                this.loadMyAllocation();
            }
        } catch (error) {
            console.error('Error loading student dashboard:', error);
            $('#content').html(`
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-center py-8 text-red-500">
                <p>Error loading dashboard. Please refresh the page.</p>
            </div>
        </div>
        `);
        }
    }

    async checkAllocationStatus() {
        try {
            const allocation = await $.ajax({
                url: '/api/allocations',
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });

            if (allocation) {
                $('#view-allocation-card').addClass('bg-green-50 border-green-200');
            }
        } catch (error) {
            // Allocation not found, that's fine
        }
    }

    renderTitlesBySupervisor(titles, existingPreferences) {
        // Group titles by supervisor
        const titlesBySupervisor = {};
        titles.forEach(title => {
            if (!titlesBySupervisor[title.supervisorName]) {
                titlesBySupervisor[title.supervisorName] = [];
            }
            titlesBySupervisor[title.supervisorName].push(title);
        });

        let titlesHtml = '';

        Object.keys(titlesBySupervisor).forEach(supervisorName => {
            const supervisorTitles = titlesBySupervisor[supervisorName];
            titlesHtml += `
            <div class="mb-4 border rounded-lg overflow-hidden supervisor-group">
                <div class="bg-gray-100 p-4 font-semibold cursor-pointer flex justify-between items-center supervisor-header">
                    <span>${supervisorName}</span>
                    <svg class="w-5 h-5 transform transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
                <div class="supervisor-titles">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        `;

            supervisorTitles.forEach(title => {
                const isSelected = existingPreferences?.preferences?.some(pref =>
                    pref.titleId === title._id
                );

                titlesHtml += `
                <div class="border rounded-lg p-4 cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    } preference-title" 
                data-id="${title._id}" 
                data-title="${title.title}" 
                data-supervisor="${title.supervisorName}"
                data-search-text="${title.title.toLowerCase()}">
                    <h4 class="font-semibold ${isSelected ? 'text-blue-700' : ''}">${title.title}</h4>
                    <p class="text-sm text-gray-600 mt-1">${title.description}</p>
                    ${isSelected ? '<p class="text-xs text-blue-600 font-semibold mt-1 selected-indicator">Selected</p>' : ''}
                </div>
            `;
            });

            titlesHtml += `
                    </div>
                </div>
            </div>
        `;
        });

        $('#titles-accordion').html(titlesHtml);

        // Set up accordion functionality
        $('.supervisor-header').on('click', function () {
            const $titles = $(this).next('.supervisor-titles');
            const $icon = $(this).find('svg');
            $titles.slideToggle();
            $icon.toggleClass('rotate-180');
        });
    }

    // Add search functionality setup
    setupSearchFunctionality() {
        $('#search-titles').on('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            this.filterTitles(searchTerm);
        });

        // Add clear search on escape key
        $('#search-titles').on('keydown', (e) => {
            if (e.key === 'Escape') {
                $('#search-titles').val('');
                this.filterTitles('');
            }
        });
    }

    // Add method to filter titles
    filterTitles(searchTerm) {
        if (!searchTerm) {
            this.showAllTitles();
            $('#search-results-count').addClass('hidden');
            $('#no-titles-message').addClass('hidden');
            return;
        }

        let matchCount = 0;

        // Hide all titles and supervisor groups first
        $('.preference-title').addClass('hidden');
        $('.supervisor-group').addClass('hidden');

        // Show titles that match the search
        $('.preference-title').each(function () {
            const titleText = $(this).data('search-text');
            if (titleText.includes(searchTerm)) {
                $(this).removeClass('hidden');
                matchCount++;

                // Show the parent supervisor group
                $(this).closest('.supervisor-group').removeClass('hidden');

                // Expand the supervisor section for search results
                $(this).closest('.supervisor-group').find('.supervisor-titles').slideDown();
                $(this).closest('.supervisor-group').find('.supervisor-header svg').addClass('rotate-180');
            }
        });

        // Update search results count
        $('#matches-count').text(matchCount);
        $('#search-results-count').removeClass('hidden');

        // Show no results message if no matches
        if (matchCount === 0) {
            $('#no-titles-message').removeClass('hidden');
        } else {
            $('#no-titles-message').addClass('hidden');
        }
    }

    // Add method to show all titles
    showAllTitles() {
        $('.preference-title').removeClass('hidden');
        $('.supervisor-group').removeClass('hidden');

        // Expand all supervisor sections by default
        $('.supervisor-titles').slideDown();
        $('.supervisor-header svg').addClass('rotate-180');
    }

    async loadTitleSelection() {
        try {
            const canEditResponse = await this.apiCache.call('/api/system-settings/can-edit-preferences');
            // Check if still allowed to edit
            // const canEditResponse = await $.ajax({
            //     url: '/api/system-settings/can-edit-preferences',
            //     method: 'GET',
            //     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            // });

            if (!canEditResponse.canEdit) {
                await SweetAlert.error(
                    'Editing Disabled',
                    'The deadline for editing preferences has passed. You can no longer modify your preferences.'
                );
                this.loadDashboard(); // Go back to dashboard
                return;
            }

            const [supervisors, existingPreferences, titles, settings] = await Promise.all([
                this.loadSupervisors(),
                this.apiCache.call('/api/preferences').catch(() => null),
                this.apiCache.call('/api/titles'),
                this.apiCache.call('/api/system-settings').catch(() => ({ preferenceDeadline: null }))
            ]);

            // Continue with existing title selection loading...
            // Load supervisors for dropdown and grouping
            // const supervisors = await this.loadSupervisors();

            // // Check if student already has preferences
            // const existingPreferences = await $.ajax({
            //     url: '/api/preferences',
            //     method: 'GET',
            //     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            // });

            // // Get available titles
            // const titles = await $.ajax({
            //     url: '/api/titles',
            //     method: 'GET',
            //     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            // });

            const approvedTitles = titles.filter(title => title.status === 'approved');

            // Store titles for search functionality
            this.allApprovedTitles = approvedTitles;

            // Build supervisor options for custom title dropdown
            const supervisorOptions = supervisors.map(supervisor =>
                `<option value="${supervisor.name}" data-username="${supervisor.username}">${supervisor.name}</option>`
            ).join('');


            // Get system settings for deadline display
            // const settings = await $.ajax({
            //     url: '/api/system-settings',
            //     method: 'GET',
            //     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            // }).catch(() => ({ preferenceDeadline: null }));

            let html = `
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">Select Your Top 5 Title Preferences</h2>
                    ${settings.preferenceDeadline ? `
                        <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                            <p class="text-blue-700 text-sm">
                                <strong>Deadline:</strong> ${new Date(settings.preferenceDeadline).toLocaleString()}
                            </p>
                        </div>
                    ` : ''}
                </div>
                
                ${existingPreferences ? `
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p class="text-yellow-800">You have already submitted your preferences. You can update them until the deadline.</p>
                    </div>
                ` : ''}

                <!-- Search Bar -->
                <div class="mb-6">
                    <div class="relative">
                        <input type="text" id="search-titles" 
                               placeholder="Search titles by name..." 
                               class="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <div id="search-results-count" class="text-sm text-gray-600 mt-2 hidden">
                        Found <span id="matches-count">0</span> titles matching your search
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-3">Available Titles</h3>
                    <div id="titles-accordion">
                        <!-- Titles will be loaded here by renderTitlesBySupervisor -->
                    </div>
                    <div id="no-titles-message" class="text-center py-8 text-gray-500 hidden">
                        <p>No titles found matching your search.</p>
                        <p class="mt-2">Try different search terms or clear your search.</p>
                    </div>
                </div>

                <!-- Rest of the existing title selection HTML remains the same -->
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 class="text-lg font-semibold mb-4">Your Selected Preferences</h3>
                    <div id="selected-preferences" class="space-y-3">
                        ${this.renderSelectedPreferences(existingPreferences?.preferences || [])}
                    </div>
                    <div class="mt-4 text-sm text-gray-600">
                        <p>Rank 1 is your most preferred title, Rank 5 is your least preferred.</p>
                        <p>Drag to reorder your preferences (highest to lowest).</p>
                    </div>
                </div>

                <div class="mb-6">
                    <button id="add-custom-title-btn" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                        Suggest Custom Title (Optional)
                    </button>
                    <div id="custom-title-section" class="hidden mt-4 bg-purple-50 rounded-lg p-4">
                        <form id="custom-title-form">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-2">Custom Title *</label>
                                    <input type="text" id="custom-title-input" class="w-full border rounded px-3 py-2" 
                                           placeholder="Enter your proposed title">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-2">Preferred Supervisor *</label>
                                    <select id="custom-supervisor-input" class="w-full border rounded px-3 py-2" required>
                                        <option value="">Select a supervisor</option>
                                        ${supervisorOptions}
                                    </select>
                                </div>
                            </div>
                            <div class="flex justify-end space-x-2 mt-4">
                                <button type="button" id="cancel-custom-title" class="px-4 py-2 border rounded hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                                    Add Custom Title
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-600">
                        ${settings.preferenceDeadline ? `
                            <p>⏰ You can edit preferences until: <strong>${new Date(settings.preferenceDeadline).toLocaleString()}</strong></p>
                        ` : 'No deadline set'}
                    </div>
                    <button id="submit-preferences-btn" class="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            ${this.selectedPreferences?.length === 5 ? '' : 'disabled'}>
                        ${existingPreferences ? 'Update Preferences' : 'Submit Preferences'}
                    </button>
                </div>
            </div>
        `;

            $('#student-content').html(html);

            // Render titles by supervisor
            this.renderTitlesBySupervisor(this.allApprovedTitles, existingPreferences);

            // Initialize drag and drop for preferences
            this.initDragAndDrop();

            // If existing preferences, load them
            if (existingPreferences) {
                this.selectedPreferences = existingPreferences.preferences.map(pref => ({
                    titleId: pref.titleId,
                    title: pref.title,
                    supervisorName: pref.supervisorName,
                    rank: pref.rank
                }));
                this.customTitle = existingPreferences.customTitle;
                this.updateSelectedPreferencesUI();
            } else {
                this.selectedPreferences = [];
                this.customTitle = null;
            }

            // Set up search functionality
            this.setupSearchFunctionality();

        } catch (error) {
            console.error('Error loading title selection:', error);
            $('#student-content').html('<div class="text-red-500">Error loading available titles</div>');
        }
    }

    // async loadSupervisors() {
    //     try {
    //         const response = await $.ajax({
    //             url: '/api/users/supervisors',
    //             method: 'GET',
    //             headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    //         });
    //         return response;
    //     } catch (error) {
    //         console.error('Error loading supervisors:', error);
    //         return [];
    //     }
    // }
    async loadSupervisors() {
        return await this.apiCache.call('/api/users/supervisors');
    }

    renderSelectedPreferences(preferences) {
        if (preferences.length === 0) {
            return '<p class="text-gray-500">No titles selected yet. Click on titles above to add them to your preferences.</p>';
        }

        const sortedPreferences = [...preferences].sort((a, b) => a.rank - b.rank);

        let html = '<div id="preferences-list" class="space-y-2">';
        sortedPreferences.forEach(pref => {
            html += `
                <div class="flex items-center justify-between bg-white border rounded-lg p-3 cursor-move preference-item" data-id="${pref.titleId}">
                    <div>
                        <span class="font-semibold text-blue-600">Rank ${pref.rank}:</span>
                        <span class="ml-2">${pref.title}</span>
                        <span class="text-sm text-gray-500 ml-2">(Supervisor: ${pref.supervisorName})</span>
                    </div>
                    <button class="text-red-500 hover:text-red-700 remove-preference" data-id="${pref.titleId}">
                        Remove
                    </button>
                </div>
            `;
        });
        html += '</div>';

        return html;
    }

    initDragAndDrop() {
        const preferencesList = document.getElementById('preferences-list');
        if (!preferencesList) return;

        new Sortable(preferencesList, {
            animation: 150,
            onEnd: (evt) => {
                this.updateRanks();
            }
        });

        // Add remove button handlers
        $(document).on('click', '.remove-preference', (e) => {
            e.stopPropagation();
            const titleId = $(e.target).data('id');
            this.removePreference(titleId);
        });
    }

    selectTitle(e) {
        // If already have 5 preferences, show error
        if (this.selectedPreferences.length >= 5) {
            SweetAlert.error(
                'Maximum selections reached',
                'You can only select 5 titles. Please remove a title first if you want to select a different one.'
            );
            return;
        }

        const titleId = $(e.currentTarget).data('id');
        const title = $(e.currentTarget).data('title');
        const supervisor = $(e.currentTarget).data('supervisor');

        // Check if already selected
        const existingIndex = this.selectedPreferences.findIndex(pref => pref.titleId === titleId);

        if (existingIndex !== -1) {
            // Already selected, show info message
            SweetAlert.info('Title already selected', 'This title is already in your preferences.');
            return;
        }

        // Add to preferences with next available rank
        this.selectedPreferences.push({
            titleId: titleId,
            title: title,
            supervisorName: supervisor,
            rank: this.selectedPreferences.length + 1
        });

        this.updateSelectedPreferencesUI();
        this.updateSubmitButton();

        // Auto-expand the supervisor section when a title is selected
        $(e.currentTarget).closest('.supervisor-group').find('.supervisor-titles').slideDown();
        $(e.currentTarget).closest('.supervisor-group').find('.supervisor-header svg').addClass('rotate-180');
    }


    // Update the removePreference method
    removePreference(titleId) {
        // Remove from selected preferences
        this.selectedPreferences = this.selectedPreferences.filter(pref => pref.titleId !== titleId);

        // Update ranks and UI
        this.updateRanks();
        this.updateSelectedPreferencesUI(); // This will now properly update the title cards

        // Show appropriate message
        const remaining = 5 - this.selectedPreferences.length;
        if (remaining > 0) {
            const titleWord = remaining === 1 ? 'title' : 'titles';
            SweetAlert.info('Title removed', `You can now select ${remaining} more ${titleWord} to complete your 5 preferences.`);
        }
    }


    updateRanks() {
        // Update ranks based on current order in UI
        const preferenceItems = $('#preferences-list .preference-item');
        preferenceItems.each((index, element) => {
            const titleId = $(element).data('id');
            const preference = this.selectedPreferences.find(pref => pref.titleId === titleId);
            if (preference) {
                preference.rank = index + 1;
            }
        });

        this.updateSelectedPreferencesUI();
    }

    updateSelectedPreferencesUI() {
        const sortedPreferences = [...this.selectedPreferences].sort((a, b) => a.rank - b.rank);
        $('#selected-preferences').html(this.renderSelectedPreferences(sortedPreferences));
        this.initDragAndDrop();

        // Update visual states of title cards - FIXED VERSION
        $('.preference-title').each((index, element) => {
            const titleId = $(element).data('id');
            const isSelected = this.selectedPreferences.some(pref => pref.titleId === titleId);

            // Remove all selection indicators first
            $(element).removeClass('bg-blue-50 border-blue-300');
            $(element).find('h4').removeClass('text-blue-700');
            $(element).find('.selected-indicator').remove();

            // Add selection indicators if selected
            if (isSelected) {
                $(element).addClass('bg-blue-50 border-blue-300');
                $(element).find('h4').addClass('text-blue-700');
                $(element).append('<p class="text-xs text-blue-600 font-semibold mt-1 selected-indicator">Selected</p>');
            }
        });

        this.updateSubmitButton();
    }

    async checkNotifications() {
        try {
            const notifications = await $.ajax({
                url: '/api/notifications/unread',
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });

            if (notifications.length > 0) {
                this.showNotificationAlert(notifications);
            }
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }

    showNotificationAlert(notifications) {
        const notificationCount = notifications.length;
        const titleWord = notificationCount === 1 ? 'title' : 'titles';

        Swal.fire({
            icon: 'info',
            title: 'Allocation Update!',
            html: `
            <p>You have been allocated to ${notificationCount} project ${titleWord}.</p>
            <p class="mt-2 text-sm text-gray-600">Check "My Allocation" to view your assigned project and supervisor.</p>
        `,
            confirmButtonText: 'View My Allocation',
            showCancelButton: true,
            cancelButtonText: 'Mark as Read',
            allowOutsideClick: false
        }).then((result) => {
            if (result.isConfirmed) {
                this.loadMyAllocation();
            }

            // Mark all as read regardless of user choice
            this.markAllNotificationsAsRead();
        });
    }

    async markAllNotificationsAsRead() {
        try {
            await $.ajax({
                url: '/api/notifications/mark-all-read',
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    }


    updateSubmitButton() {
        const submitBtn = $('#submit-preferences-btn');
        const count = this.selectedPreferences.length;

        // Check if we have existing preferences from the server
        const hasExistingPreferences = this.selectedPreferences.length > 0 &&
            this.selectedPreferences.some(pref => pref._id); // Check if any preference has an _id from server

        if (count === 5) {
            submitBtn.prop('disabled', false);
            submitBtn.removeClass('bg-gray-400 hover:bg-gray-400');
            submitBtn.addClass('bg-green-500 hover:bg-green-600');
            submitBtn.text(hasExistingPreferences ? 'Update Preferences' : 'Submit Preferences');
        } else {
            submitBtn.prop('disabled', true);
            submitBtn.removeClass('bg-green-500 hover:bg-green-600');
            submitBtn.addClass('bg-gray-400 hover:bg-gray-400');
            submitBtn.text(`Select ${5 - count} more`);
        }
    }

    toggleCustomTitle() {
        $('#custom-title-section').toggleClass('hidden');
    }

    handleCustomTitle(e) {
        e.preventDefault();

        const title = $('#custom-title-input').val().trim();
        const supervisorSelect = $('#custom-supervisor-input');
        const supervisorName = supervisorSelect.val();
        const supervisorUsername = supervisorSelect.find('option:selected').data('username');

        if (!title || !supervisorName) {
            SweetAlert.error('Please fill in both custom title and select a supervisor');
            return;
        }

        this.customTitle = {
            title: title,
            supervisorName: supervisorName,
            supervisorUsername: supervisorUsername
        };

        this.toggleCustomTitle();
        SweetAlert.success('Custom title suggestion added!');
    }

    // Update the submitPreferences method with better validation messages
    async submitPreferences() {
        // Enhanced validation for exactly 5 titles
        if (this.selectedPreferences.length < 5) {
            const missing = 5 - this.selectedPreferences.length;
            const titleWord = missing === 1 ? 'title' : 'titles';
            await SweetAlert.error(
                `Incomplete Preferences`,
                `You have selected ${this.selectedPreferences.length} titles. Please select ${missing} more ${titleWord} to continue.`
            );
            return;
        }

        if (this.selectedPreferences.length > 5) {
            await SweetAlert.error(
                'Too Many Titles Selected',
                `You have selected ${this.selectedPreferences.length} titles. The system requires exactly 5 preferences. Please remove ${this.selectedPreferences.length - 5} title(s).`
            );
            return;
        }

        // Validate that all preferences have unique ranks
        const ranks = this.selectedPreferences.map(p => p.rank);
        const uniqueRanks = new Set(ranks);
        if (uniqueRanks.size !== 5) {
            await SweetAlert.error('Ranking Error', 'Please ensure all 5 preferences have unique ranks from 1 to 5.');
            return;
        }

        try {
            const preferencesData = {
                preferences: this.selectedPreferences.map(pref => ({
                    titleId: pref.titleId,
                    rank: pref.rank,
                    title: pref.title,
                    supervisorName: pref.supervisorName
                })),
                customTitle: this.customTitle
            };

            await $.ajax({
                url: '/api/preferences',
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                contentType: 'application/json',
                data: JSON.stringify(preferencesData)
            });

            await SweetAlert.success('Preferences submitted successfully!');

            // Invalidate cache for allocations and preferences
            window.apiCache.invalidateRelatedCache('/api/preferences', 'POST');

            setTimeout(() => {
                this.loadMyAllocation();
            }, 2000);
        } catch (error) {
            await SweetAlert.error('Error submitting preferences: ' + (error.responseJSON?.message || 'Unknown error'));
        }
    }


    // Update the loadMyAllocation method to show custom title status
async loadMyAllocation() {
    try {
        const [allocationResponse, settings, preferences] = await Promise.all([
            this.apiCache.call('/api/allocations').catch(() => null),
            this.apiCache.call('/api/system-settings').catch(() => ({ allocationCompleted: false })),
            this.apiCache.call('/api/preferences').catch(() => null)
        ]);

        // Handle the allocation response - it could be an array or a single object
        let allocation = null;
        if (Array.isArray(allocationResponse)) {
            // If it's an array, take the first element (student should only have one allocation)
            allocation = allocationResponse.length > 0 ? allocationResponse[0] : null;
        } else {
            // If it's already an object or null, use it directly
            allocation = allocationResponse;
        }

        let html = `
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-2xl font-bold mb-6">My Project Allocation</h2>
        `;

        // Check if allocation process has been completed
        if (!settings.allocationCompleted) {
            html += `
            <div class="text-center py-8">
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 inline-block">
                    <svg class="w-12 h-12 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="text-yellow-800 font-semibold">Allocation In Progress</p>
                    <p class="mt-2 text-yellow-700">The project allocation process is currently running. Please check back later.</p>
                </div>
            </div>
        `;
        } else if (!allocation || !allocation.title) {
            // Allocation completed but no allocation found for this student OR allocation exists but has no title
            html += `
            <div class="text-center py-8">
                <div class="bg-red-50 border border-red-200 rounded-lg p-6 inline-block">
                    <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <p class="text-red-800 font-semibold">No Allocation Found</p>
                    <p class="mt-2 text-red-700">You were not allocated to any project title.</p>
                    <p class="mt-2 text-sm text-red-600">Please contact the administrator for assistance.</p>
                </div>
            </div>
        `;
        } else {
            // SUCCESS: Student has an allocation
            const hasCustomTitle = preferences && preferences.customTitle;
            const customTitleStatus = hasCustomTitle ? preferences.customTitle.status : null;

            html += `
            <div class="max-w-4xl mx-auto">
                ${hasCustomTitle ? `
                <div class="mb-6 p-4 border rounded-lg ${customTitleStatus === 'approved' ? 'bg-green-50 border-green-200' :
                            customTitleStatus === 'rejected' ? 'bg-red-50 border-red-200' :
                                'bg-yellow-50 border-yellow-200'
                        }">
                    <h3 class="font-semibold mb-2 flex items-center">
                        <svg class="w-5 h-5 mr-2 ${customTitleStatus === 'approved' ? 'text-green-600' : customTitleStatus === 'rejected' ? 'text-red-600' : 'text-yellow-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Custom Title Status
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <strong>Title:</strong> ${preferences.customTitle.title}
                        </div>
                        <div>
                            <strong>Status:</strong> 
                            <span class="font-semibold ${customTitleStatus === 'approved' ? 'text-green-700' :
                            customTitleStatus === 'rejected' ? 'text-red-700' :
                                'text-yellow-700'
                        }">
                                ${customTitleStatus ? customTitleStatus.charAt(0).toUpperCase() + customTitleStatus.slice(1) : 'Pending'}
                            </span>
                        </div>
                        ${customTitleStatus === 'approved' ? `
                            <div class="md:col-span-2 text-green-700">
                                <strong>✓ Approved!</strong> You were allocated to your custom title.
                            </div>
                        ` : ''}
                        ${customTitleStatus === 'rejected' ? `
                            <div class="md:col-span-2">
                                <p class="text-red-700"><strong>Rejected:</strong> ${preferences.customTitle.rejectedReason || 'No reason provided'}</p>
                                <p class="text-red-600 text-sm mt-1">You were allocated based on your regular preferences.</p>
                            </div>
                        ` : ''}
                        ${customTitleStatus === 'pending' ? `
                            <div class="md:col-span-2 text-yellow-700">
                                Your custom title is still pending admin approval. You were allocated based on your regular preferences.
                            </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <div class="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold text-green-800">Project Allocated!</h3>
                        <p class="text-green-600 mt-1">Congratulations on your project assignment</p>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div class="bg-white rounded-lg p-4 border">
                                <div class="flex items-center mb-2">
                                    <svg class="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <span class="font-semibold">Project Title</span>
                                </div>
                                <p class="text-lg text-gray-800 pl-7">${allocation.title}${allocation.isCustomTitle ? ' *' : ''}</p>
                            </div>

                            <div class="bg-white rounded-lg p-4 border">
                                <div class="flex items-center mb-2">
                                    <svg class="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                    <span class="font-semibold">Supervisor</span>
                                </div>
                                <p class="text-lg text-gray-800 pl-7">${allocation.supervisorName || 'Not Assigned'}</p>
                                ${allocation.needsSupervisor ? `
                                    <p class="text-sm text-yellow-600 mt-1 pl-7">⚠️ Supervisor assignment pending</p>
                                ` : ''}
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="bg-white rounded-lg p-4 border">
                                <div class="flex items-center mb-2">
                                    <svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
                                    </svg>
                                    <span class="font-semibold">Student Information</span>
                                </div>
                                <div class="space-y-2 pl-7">
                                    <p><strong>ID:</strong> ${allocation.studentUsername}</p>
                                    <p><strong>Name:</strong> ${allocation.studentName}</p>
                                </div>
                            </div>

                            <div class="bg-white rounded-lg p-4 border">
                                <div class="flex items-center mb-2">
                                    <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <span class="font-semibold">Allocation Details</span>
                                </div>
                                <div class="space-y-2 pl-7">
                                    <p><strong>Type:</strong> ${allocation.isCustomTitle ? 'Custom Title' : 'Title from Project List'}</p>
                                    <p><strong>Allocated:</strong> ${allocation.allocatedAt ? new Date(allocation.allocatedAt).toLocaleDateString() : 'N/A'}</p>
                                    ${allocation.preferenceRank ? `<p><strong>Preference Rank:</strong> ${allocation.preferenceRank}</p>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    ${allocation.isCustomTitle ? `
                        <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p class="text-sm text-blue-800 flex items-center">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <strong>Note: </strong>This is a title you proposed and was approved by the administrator.
                            </p>
                        </div>
                    ` : ''}

                    ${allocation.needsSupervisor ? `
                        <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p class="text-sm text-yellow-800 flex items-center">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                                <strong>Attention:</strong> Your project title is awaiting supervisor assignment. The administrator will assign a supervisor shortly.
                            </p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        }

        html += `</div>`;
        $('#student-content').html(html);
    } catch (error) {
        console.error('Error loading allocation:', error);
        $('#student-content').html(`
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-2xl font-bold mb-6">My Allocation</h2>
            <div class="text-center py-8 text-red-500">
                <p>Error loading allocation information. Please try again later.</p>
            </div>
        </div>
        `);
    }
}

    showSuccess(message) {
        const successHtml = `
            <div class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                ${message}
            </div>
        `;
        $('body').append(successHtml);
        setTimeout(() => {
            $('.fixed.top-4.right-4').remove();
        }, 3000);
        SweetAlert.success(message);
    }
}