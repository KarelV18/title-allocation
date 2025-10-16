# Title Allocation System

A web application for allocating project titles to students using the Gale-Shapley algorithm.

## Features

- **Three User Roles**: Admin, Supervisor, Student
- **Title Management**: Supervisors can propose titles, Admins can approve/reject
- **Student Preferences**: Students select top 5 title preferences
- **Automatic Allocation**: Gale-Shapley algorithm with first-come-first-served tie-breaking
- **Excel Report Generation**: Download allocation results
- **Responsive Design**: Works on desktop, tablet, and mobile

## Technology Stack

- **Frontend**: HTML, CSS (Tailwind), JavaScript, jQuery
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (native driver)
- **Authentication**: JWT with bcrypt password hashing

## Installation

1. Extract the zip file
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install


   title-allocation
├── .gitignore
├── backend
    ├── config
    │   └── database.js
    ├── controllers
    │   ├── allocationController.js
    │   └── authController.js
    ├── middleware
    │   └── auth.js
    ├── models
    │   ├── Allocation.js
    │   ├── Preference.js
    │   ├── SystemSettings.js
    │   ├── Title.js
    │   └── User.js
    ├── routes
    │   ├── allocationRoutes.js
    │   ├── authRoutes.js
    │   ├── capacityConflictRoutes.js
    │   ├── customTitleRoutes.js
    │   ├── notificationRoutes.js
    │   ├── preferenceRoutes.js
    │   ├── reportRoutes.js
    │   ├── supervisorAssignmentRoutes.js
    │   ├── systemSettingsRoutes.js
    │   ├── titleRoutes.js
    │   └── userRoutes.js
    └── server.js
├── create_admin.js
├── frontend
    ├── css
    │   └── styles.css
    ├── index.html
    └── js
    │   ├── admin.js
    │   ├── app.js
    │   ├── auth.js
    │   ├── student.js
    │   ├── supervisor.js
    │   └── utils.js
├── package-lock.json
├── package.json
├── readme.md
├── test_mongo.js
└── users_template.csv