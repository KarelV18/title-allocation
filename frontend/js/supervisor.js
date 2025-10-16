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
                        <button id="add-title-btn" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Add New Title
                        </button>
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
        SweetAlert.success(message);
    }
    // showSuccess(message) {
    //     const successHtml = `
    //         <div class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
    //             ${message}
    //         </div>
    //     `;
    //     $('body').append(successHtml);
    //     setTimeout(() => {
    //         $('.fixed.top-4.right-4').remove();
    //     }, 3000);
    // }
}