class SupervisorDashboard {
    constructor() {
        this.init();
    }

    init() {
        this.loadDashboard();
        this.attachEventListeners();
    }

    attachEventListeners() {
        $(document).on('click', '#add-title-btn', () => this.showAddTitleModal());
        $(document).on('submit', '#add-title-form', (e) => this.handleAddTitle(e));
        $(document).on('click', '#bulk-add-titles-btn', () => this.showBulkAddTitlesModal());
        $(document).on('click', '.delete-title', (e) => this.deleteTitle(e));
        $(document).on('click', '#view-students-btn', () => this.loadStudentAllocations());
        $(document).on('click', '#view-titles-btn', () => this.loadMyTitles());
    }

    loadDashboard() {
        const content = $('#content');
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

        $('#view-titles-card').on('click', () => this.loadMyTitles());
        $('#view-students-card').on('click', () => this.loadStudentAllocations());

        // Load titles by default
        this.loadMyTitles();
    }

    async loadMyTitles() {
        try {
            const response = await $.ajax({
                url: '/api/titles',
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });

            let html = `
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">My Proposed Titles</h2>
            <div class="space-x-2">
                <button id="add-title-btn" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Add Single Title
                </button>
                <button id="bulk-add-titles-btn" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                    Bulk Add Titles
                </button>
            </div>
        </div>
        <div class="overflow-x-auto">
`;

            if (response.length === 0) {
                html += `
                    <div class="text-center py-8 text-gray-500">
                        <p>You haven't proposed any titles yet.</p>
                        <p class="mt-2">Click "Add New Title" to get started.</p>
                    </div>
                `;
            } else {
                html += `
                    <table class="min-w-full table-auto">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="px-4 py-2 text-left">Title</th>
                                <th class="px-4 py-2 text-left">Description</th>
                                <th class="px-4 py-2 text-left">Status</th>
                                <th class="px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                response.forEach(title => {
                    html += `
                        <tr class="border-t">
                            <td class="px-4 py-2">${title.title}</td>
                            <td class="px-4 py-2">${title.description}</td>
                            <td class="px-4 py-2">
                                <span class="px-2 py-1 rounded text-xs font-semibold ${title.status === 'approved' ? 'bg-green-100 text-green-800' :
                            title.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                        }">
                                    ${title.status}
                                </span>
                            </td>
                            <td class="px-4 py-2">
                                <button class="delete-title bg-red-500 text-white px-3 py-1 rounded text-sm" data-id="${title._id}">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    `;
                });

                html += `</tbody></table>`;
            }

            html += `</div></div>`;
            $('#supervisor-content').html(html);
        } catch (error) {
            console.error('Error loading titles:', error);
            $('#supervisor-content').html('<div class="text-red-500">Error loading titles</div>');
        }
    }

    showAddTitleModal() {
        const modalHtml = `
            <div id="add-title-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-96">
                    <h3 class="text-xl font-bold mb-4">Add New Title</h3>
                    <form id="add-title-form">
                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-2">Title *</label>
                            <input type="text" id="title-input" class="w-full border rounded px-3 py-2" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-2">Description</label>
                            <textarea id="description-input" class="w-full border rounded px-3 py-2" rows="4"></textarea>
                        </div>
                        <div class="flex justify-end space-x-2">
                            <button type="button" id="cancel-add-title" class="px-4 py-2 border rounded hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                Add Title
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        $('body').append(modalHtml);

        $('#cancel-add-title').on('click', () => {
            $('#add-title-modal').remove();
        });
    }

    showBulkAddTitlesModal() {
        const modalHtml = `
        <div id="bulk-add-titles-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
                <h3 class="text-xl font-bold mb-4">Bulk Add Titles</h3>
                
                <div class="flex space-x-4 mb-6">
                    <button id="csv-upload-tab" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                        CSV Upload
                    </button>
                    <button id="text-input-tab" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                        Text Input
                    </button>
                </div>
                
                <!-- CSV Upload Section -->
                <div id="csv-upload-section">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Upload CSV File</label>
                        <input type="file" id="csv-file" accept=".csv" class="w-full border rounded px-3 py-2">
                    </div>
                    <div class="text-sm text-gray-600 mb-4">
                        <p><strong>CSV Format:</strong> Each line should contain a title (required) and optional description separated by comma</p>
                        <p><strong>Example:</strong> "Machine Learning Applications,Exploring ML in healthcare"</p>
                    </div>
                    <div class="mb-4">
                        <button id="download-csv-template" class="text-blue-500 hover:text-blue-700 text-sm">
                            📥 Download CSV Template
                        </button>
                    </div>
                </div>
                
                <!-- Text Input Section -->
                <div id="text-input-section" class="hidden">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Enter Titles (one per line)</label>
                        <textarea id="titles-textarea" class="w-full border rounded px-3 py-2 h-64" 
                                  placeholder="Enter each title on a new line. You can optionally add a description after a comma.
                                  
Example:
Machine Learning Applications, Exploring ML in healthcare
Web Development Trends
Data Analysis Techniques, Advanced statistical methods
Cybersecurity Fundamentals"></textarea>
                    </div>
                    <div class="text-sm text-gray-600 mb-4">
                        <p><strong>Format:</strong> One title per line. Add description after comma (optional)</p>
                    </div>
                </div>
                
                <div class="flex justify-between items-center mb-4">
                    <span id="titles-count" class="text-sm text-gray-600">Titles detected: 0</span>
                    <button id="preview-titles" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                        Preview Titles
                    </button>
                </div>
                
                <!-- Preview Section -->
                <div id="preview-section" class="hidden mb-4">
                    <h4 class="font-semibold mb-2">Preview (First 5 titles):</h4>
                    <div id="preview-list" class="bg-gray-50 p-3 rounded max-h-32 overflow-y-auto text-sm"></div>
                </div>
                
                <div class="flex justify-end space-x-2">
                    <button type="button" id="cancel-bulk-add" class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="button" id="submit-bulk-titles" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Add Titles
                    </button>
                </div>
            </div>
        </div>
    `;

        $('body').append(modalHtml);

        // Tab functionality
        $('#csv-upload-tab').on('click', () => {
            $('#csv-upload-tab').removeClass('bg-gray-200 text-gray-700').addClass('bg-blue-500 text-white');
            $('#text-input-tab').removeClass('bg-blue-500 text-white').addClass('bg-gray-200 text-gray-700');
            $('#csv-upload-section').removeClass('hidden');
            $('#text-input-section').addClass('hidden');
            this.updateTitlesCount();
        });

        $('#text-input-tab').on('click', () => {
            $('#text-input-tab').removeClass('bg-gray-200 text-gray-700').addClass('bg-blue-500 text-white');
            $('#csv-upload-tab').removeClass('bg-blue-500 text-white').addClass('bg-gray-200 text-gray-700');
            $('#text-input-section').removeClass('hidden');
            $('#csv-upload-section').addClass('hidden');
            this.updateTitlesCount();
        });

        // Download CSV template
        $('#download-csv-template').on('click', (e) => {
            e.preventDefault();
            this.downloadCSVTemplate();
        });

        // Update titles count on input
        $('#titles-textarea').on('input', () => this.updateTitlesCount());
        $('#csv-file').on('change', () => this.updateTitlesCount());

        // Preview titles
        $('#preview-titles').on('click', () => this.previewTitles());

        // Cancel button
        $('#cancel-bulk-add').on('click', () => {
            SweetAlert.close(); // Close any open SweetAlert dialogs
            $('#bulk-add-titles-modal').remove();
        });

        // Submit button
        $('#submit-bulk-titles').on('click', () => this.handleBulkTitlesSubmit());

    }

    downloadCSVTemplate() {
        const csvContent = `title,description
"Machine Learning Applications","Exploring machine learning in healthcare and finance"
"Web Development Trends","Modern frameworks and best practices"
"Data Analysis Techniques","Advanced statistical methods and visualization"
"Cybersecurity Fundamentals","Network security and threat prevention"
"Artificial Intelligence","Ethical considerations and future applications"

# Instructions:
# - First line is header (title,description)
# - Each subsequent line should contain a title and optional description
# - Use quotes if your text contains commas
# - Remove these instruction lines before uploading`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'titles_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    updateTitlesCount() {
        const titles = this.extractTitlesFromInput();
        $('#titles-count').text(`Titles detected: ${titles.length}`);
    }

    extractTitlesFromInput() {
        const isCSVMode = !$('#csv-upload-section').hasClass('hidden');

        if (isCSVMode) {
            const file = $('#csv-file')[0].files[0];
            if (!file) return [];

            // For now, we'll handle CSV by reading the file directly in handleBulkTitlesSubmit
            // This is a placeholder - the actual parsing will happen in handleBulkTitlesSubmit
            return []; // We'll handle CSV files separately in the submit function
        } else {
            const text = $('#titles-textarea').val();
            if (!text.trim()) return [];

            return text.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const [title, ...descParts] = line.split(',');
                    return {
                        title: title.trim(),
                        description: descParts.join(',').trim() || 'No description provided'
                    };
                });
        }
    }

    async previewTitles() {
        const isCSVMode = !$('#csv-upload-section').hasClass('hidden');
        let titles = [];

        if (isCSVMode) {
            const file = $('#csv-file')[0].files[0];
            if (!file) {
                await SweetAlert.error('Please select a CSV file first.');
                return;
            }

            try {
                titles = await this.parseCSVFile(file);
            } catch (error) {
                await SweetAlert.error('Error reading CSV file: ' + error.message);
                return;
            }
        } else {
            titles = this.extractTitlesFromInput();
        }

        const previewList = $('#preview-list');
        const previewSection = $('#preview-section');

        if (titles.length === 0) {
            previewList.html('<div class="text-red-500">No titles detected</div>');
            previewSection.removeClass('hidden');
            return;
        }

        let previewHtml = '';
        titles.slice(0, 5).forEach((titleObj, index) => {
            previewHtml += `<div class="mb-2 p-2 bg-white rounded border">
            <strong>${index + 1}.</strong> ${titleObj.title}
            ${titleObj.description ? `<br><span class="text-gray-600">${titleObj.description}</span>` : ''}
        </div>`;
        });

        if (titles.length > 5) {
            previewHtml += `<div class="text-gray-500 text-center">... and ${titles.length - 5} more titles</div>`;
        }

        previewList.html(previewHtml);
        previewSection.removeClass('hidden');
        $('#titles-count').text(`Titles detected: ${titles.length}`);
    }
async testServerHealth() {
        try {
            const startTime = Date.now();
            const response = await $.ajax({
                url: '/api/titles',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                timeout: 10000
            });
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            return { healthy: true, responseTime };
        } catch (error) {
            return { healthy: false, error: error.message };
        }
    }

    async handleBulkTitlesSubmit() {
        const isCSVMode = !$('#csv-upload-section').hasClass('hidden');
        let titles = [];

        try {
            if (isCSVMode) {
                const file = $('#csv-file')[0].files[0];
                if (!file) {
                    await SweetAlert.error('Please select a CSV file to upload.');
                    return;
                }

                titles = await this.parseCSVFile(file);
            } else {
                titles = this.extractTitlesFromInput();
            }

            if (titles.length === 0) {
                await SweetAlert.error('No titles found to add. Please enter some titles or upload a CSV file.');
                return;
            }

            const result = await SweetAlert.confirm(
                'Add Multiple Titles?',
                `Are you sure you want to add ${titles.length} titles? This may take a few moments.`
            );

            const health = await this.testServerHealth();
            if (!health.healthy) {
                await SweetAlert.error('Server is not responding properly. Please try again later.');
                return;
            }

            if (health.responseTime > 5000) {
                await SweetAlert.warning('Server is responding slowly. Bulk title addition may take longer than expected.');
            }

            if (!result.isConfirmed) {
                return;
            }

            // Use SweetAlert.loading for the initial loading state
            SweetAlert.loading(`Adding ${titles.length} Titles`);

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (let i = 0; i < titles.length; i++) {
                const titleData = titles[i];
                const currentIndex = i + 1;
                const totalTitles = titles.length;

                // Update progress using Swal directly since SweetAlert doesn't have update method
                Swal.update({
                    html: `Adding ${totalTitles} Titles<br>
                       <div style="margin-top: 10px; font-size: 14px;">
                       Progress: ${currentIndex}/${totalTitles}<br>
                       Current: "${titleData.title.substring(0, 30)}${titleData.title.length > 30 ? '...' : ''}"<br>
                       Success: ${successCount}, Errors: ${errorCount}
                       </div>`
                });

                try {
                    await $.ajax({
                        url: '/api/titles',
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token'),
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({
                            title: titleData.title,
                            description: titleData.description
                        }),
                        timeout: 30000
                    });

                    successCount++;
                } catch (error) {
                    errorCount++;

                    let errorMessage = 'Unknown error';
                    if (error.responseJSON && error.responseJSON.message) {
                        errorMessage = error.responseJSON.message;
                    } else if (error.statusText) {
                        errorMessage = error.statusText;
                    } else if (error.status === 0) {
                        errorMessage = 'Network error';
                    }

                    errors.push(`"${titleData.title}": ${errorMessage}`);
                    continue;
                }

                if (i < titles.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            SweetAlert.close();

            if (errorCount === 0) {
                await SweetAlert.success(`Successfully added all ${successCount} titles!`);
            } else if (successCount > 0) {
                await SweetAlert.warning(
                    `Added ${successCount} titles successfully. ${errorCount} titles failed to add.`,
                    'Partial Success'
                );
            } else {
                await SweetAlert.error(`Failed to add all ${titles.length} titles.`, 'All Titles Failed');
            }

            $('#bulk-add-titles-modal').remove();
            this.loadMyTitles();

        } catch (outerError) {
            SweetAlert.close();
            await SweetAlert.error('Unexpected error during bulk title addition. Please try again.');
        }
    }

    async checkSupervisorPrivileges() {
        try {
            const user = JSON.parse(localStorage.getItem('user'));

            if (!user || user.role !== 'supervisor') {
                return false;
            }

            await $.ajax({
                url: '/api/titles',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                timeout: 10000
            });

            return true;

        } catch (error) {
            return false;
        }
    }
    // Update the server health check to use Swal consistently
/*
    async testServerHealth() {
        try {
            const startTime = Date.now();
            const response = await $.ajax({
                url: '/api/titles',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                timeout: 10000
            });
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            console.log(`Server health check: ${responseTime}ms response time`);
            return { healthy: true, responseTime };
        } catch (error) {
            console.error('Server health check failed:', error);
            return { healthy: false, error: error.message };
        }
    }

    async handleBulkTitlesSubmit() {
        console.log('Bulk titles submit started');

        const isCSVMode = !$('#csv-upload-section').hasClass('hidden');
        let titles = [];

        try {
            if (isCSVMode) {
                console.log('CSV mode detected');
                const file = $('#csv-file')[0].files[0];
                if (!file) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Please select a CSV file to upload.'
                    });
                    return;
                }

                try {
                    titles = await this.parseCSVFile(file);
                    console.log(`Parsed ${titles.length} titles from CSV`);
                } catch (error) {
                    console.error('CSV parsing error:', error);
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Error reading CSV file: ' + error.message
                    });
                    return;
                }
            } else {
                console.log('Text mode detected');
                titles = this.extractTitlesFromInput();
                console.log(`Extracted ${titles.length} titles from text`);
            }

            if (titles.length === 0) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No titles found to add. Please enter some titles or upload a CSV file.'
                });
                return;
            }

            const result = await Swal.fire({
                title: 'Add Multiple Titles?',
                text: `Are you sure you want to add ${titles.length} titles? This may take a few moments.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, add them!',
                cancelButtonText: 'Cancel'
            });

            // Add this right after the confirmation dialog, before starting the bulk addition:
            console.log('Checking server health...');
            const health = await this.testServerHealth();
            if (!health.healthy) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Server Error',
                    text: 'Server is not responding properly. Please try again later.'
                });
                return;
            }

            console.log(`Server response time: ${health.responseTime}ms`);
            if (health.responseTime > 5000) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Slow Server',
                    text: 'Server is responding slowly. Bulk title addition may take longer than expected.'
                });
            }

            if (!result.isConfirmed) {
                console.log('User cancelled bulk title addition');
                return;
            }

            console.log(`Starting to add ${titles.length} titles`);

            // Show loading alert using Swal (not SweetAlert)
            Swal.fire({
                title: `Adding ${titles.length} Titles`,
                html: 'Starting the process...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            console.log('Starting sequential title addition...');

            // Process titles one by one
            for (let i = 0; i < titles.length; i++) {
                const titleData = titles[i];
                const currentIndex = i + 1;
                const totalTitles = titles.length;

                console.log(`Processing title ${currentIndex}/${totalTitles}: "${titleData.title}"`);

                // Update progress in the alert
                Swal.update({
                    html: `Adding ${totalTitles} Titles<br>
                       <div style="margin-top: 10px; font-size: 14px;">
                       Progress: ${currentIndex}/${totalTitles}<br>
                       Current: "${titleData.title.substring(0, 30)}${titleData.title.length > 30 ? '...' : ''}"<br>
                       Success: ${successCount}, Errors: ${errorCount}
                       </div>`
                });

                try {
                    console.log(`Making API call for title: "${titleData.title}"`);

                    const response = await $.ajax({
                        url: '/api/titles',
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token'),
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({
                            title: titleData.title,
                            description: titleData.description
                        }),
                        timeout: 30000
                    });

                    console.log(`✅ Successfully added: "${titleData.title}"`, response);
                    successCount++;

                } catch (error) {
                    console.error(`❌ Failed to add: "${titleData.title}"`, error);
                    errorCount++;

                    let errorMessage = 'Unknown error';
                    if (error.responseJSON && error.responseJSON.message) {
                        errorMessage = error.responseJSON.message;
                    } else if (error.statusText) {
                        errorMessage = error.statusText;
                    } else if (error.status === 0) {
                        errorMessage = 'Network error';
                    }

                    errors.push(`"${titleData.title}": ${errorMessage}`);

                    // Continue with next title even if this one fails
                    continue;
                }

                // Small delay between requests
                if (i < titles.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            console.log(`✅ Completed: ${successCount} success, ${errorCount} errors`);

            // Close the loading alert
            Swal.close();

            // Show results
            if (errorCount === 0) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: `Successfully added all ${successCount} titles!`
                });
            } else if (successCount > 0) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Partial Success',
                    html: `Added ${successCount} titles successfully.<br>
                       ${errorCount} titles failed to add.`
                });
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'All Titles Failed',
                    html: `Failed to add all ${titles.length} titles.`
                });
            }

            $('#bulk-add-titles-modal').remove();
            this.loadMyTitles();

        } catch (outerError) {
            console.error('❌ Outer error in bulk title submission:', outerError);

            // Ensure loading alert is closed
            Swal.close();

            await Swal.fire({
                icon: 'error',
                title: 'Error',
                html: 'Unexpected error during bulk title addition.<br>Please try again.'
            });
        }
    }

    async checkSupervisorPrivileges() {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            console.log('Current user:', user);

            if (!user || user.role !== 'supervisor') {
                console.error('User does not have supervisor role:', user?.role);
                return false;
            }

            // Test if we can access the titles endpoint
            const response = await $.ajax({
                url: '/api/titles',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                timeout: 10000
            });

            console.log('Supervisor privileges confirmed, can access titles endpoint');
            return true;

        } catch (error) {
            console.error('Supervisor privilege check failed:', error);
            return false;
        }
    }
    */

    parseCSVFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const csvText = event.target.result;
                    console.log('CSV file content:', csvText);
                    const lines = csvText.split('\n').filter(line => line.trim() && !line.startsWith('#'));
                    const titles = [];

                    console.log(`Found ${lines.length} lines in CSV`);

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();

                        // Skip empty lines and header if it's the first line and contains "title"
                        if (i === 0 && line.toLowerCase().includes('title')) {
                            console.log('Skipping header line');
                            continue;
                        }

                        // Simple CSV parsing: split by comma, trim values
                        const parts = line.split(',').map(part => part.trim().replace(/^"|"$/g, ''));

                        if (parts.length >= 1 && parts[0]) {
                            const title = parts[0];
                            const description = parts.length >= 2 && parts[1] ? parts[1] : 'No description provided';

                            titles.push({
                                title: title,
                                description: description
                            });

                            console.log(`Parsed title: "${title}" with description: "${description}"`);
                        }
                    }

                    console.log(`Total titles parsed from CSV: ${titles.length}`);
                    resolve(titles);
                } catch (error) {
                    console.error('CSV parsing error:', error);
                    reject(new Error('Invalid CSV format: ' + error.message));
                }
            };
            reader.onerror = () => {
                console.error('File reading error');
                reject(new Error('Failed to read file'));
            };
            reader.readAsText(file);
        });
    }

    async handleAddTitle(e) {
        e.preventDefault();

        const title = $('#title-input').val();
        const description = $('#description-input').val();

        if (!title.trim()) {
            await SweetAlert.error('Please enter a title');
            return;
        }

        try {
            await $.ajax({
                url: '/api/titles',
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                contentType: 'application/json',
                data: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || 'No description provided'
                })
            });

            $('#add-title-modal').remove();
            this.loadMyTitles();
            this.showSuccess('Title added successfully! It will be reviewed by admin.');
            await SweetAlert.success('Title added successfully! It will be reviewed by admin.');

        } catch (error) {
            // alert('Error adding title: ' + (error.responseJSON?.message || 'Unknown error'));
            await SweetAlert.error('Error adding title: ' + (error.responseJSON?.message || 'Unknown error'));

        }
    }

    async deleteTitle(e) {
        const titleId = $(e.target).data('id');

        const result = await SweetAlert.confirm(
            'Delete Title?',
            'Are you sure you want to delete this title? This action cannot be undone.'
        );

        if (!result.isConfirmed) {
            return;
        }

        // if (!confirm('Are you sure you want to delete this title?')) {
        //     return;
        // }

        try {
            await $.ajax({
                url: `/api/titles/${titleId}`,
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });

            this.loadMyTitles();
            this.showSuccess('Title deleted successfully!');
            await SweetAlert.success('Title deleted successfully!');

        } catch (error) {
            await SweetAlert.error('Error deleting title: ' + (error.responseJSON?.message || 'Unknown error'));
            // alert('Error deleting title: ' + (error.responseJSON?.message || 'Unknown error'));
        }
    }

    async loadStudentAllocations() {
        try {
            const response = await $.ajax({
                url: '/api/allocations',
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });

            let html = `
                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-2xl font-bold mb-6">My Allocated Students</h2>
            `;

            if (!response || response.length === 0) {
                html += `
                    <div class="text-center py-8 text-gray-500">
                        <p>No students have been allocated to your titles yet.</p>
                        <p class="mt-2">After the allocation process runs, your students will appear here.</p>
                    </div>
                `;
            } else {
                html += `
                    <div class="overflow-x-auto">
                        <table class="min-w-full table-auto">
                            <thead>
                                <tr class="bg-gray-50">
                                    <th class="px-4 py-2 text-left">Student ID</th>
                                    <th class="px-4 py-2 text-left">Student Name</th>
                                    <th class="px-4 py-2 text-left">Allocated Title</th>
                                    <th class="px-4 py-2 text-left">Custom Title</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                response.forEach(allocation => {
                    html += `
                        <tr class="border-t">
                            <td class="px-4 py-2">${allocation.studentUsername}</td>
                            <td class="px-4 py-2">${allocation.studentName}</td>
                            <td class="px-4 py-2">${allocation.title}</td>
                            <td class="px-4 py-2">
                                ${allocation.isCustomTitle ?
                            '<span class="text-green-600 font-semibold">Yes</span>' :
                            '<span class="text-gray-500">No</span>'
                        }
                            </td>
                        </tr>
                    `;
                });

                html += `</tbody></table></div>`;
            }

            html += `</div>`;
            $('#supervisor-content').html(html);
        } catch (error) {
            console.error('Error loading student allocations:', error);
            $('#supervisor-content').html('<div class="text-red-500">Error loading student allocations</div>');
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