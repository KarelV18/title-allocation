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


   title-allocation-system/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
├── frontend/
│   ├── css/
│   ├── js/
│   ├── pages/
│   └── index.html
├── package.json
└── README.md