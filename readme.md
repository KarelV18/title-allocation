# 🎓 Title Allocation System

A comprehensive web-based system for managing student project title allocations, supervisor assignments, custom title proposals, and second marker assignments. Built with **Node.js**, **MongoDB**, and a **JavaScript frontend** using **TailwindCSS**, **jQuery**, and **SweetAlert2**.

---

## 🚀 Features

### 🔐 Authentication & Roles
- JWT-based login system
- Role-based access: **Admin**, **Supervisor**, **Student**

### 📋 Student Preferences
- Submit exactly 5 ranked title preferences
- Propose custom titles with supervisor suggestions
- Deadline enforcement for preference submission

### 🧠 Allocation Engine
- **Gale-Shapley Algorithm** for stable matching
- Enhanced with **supervisor capacity constraints**
- Handles custom titles, unmatched students, and generates allocation statistics

### 👨‍🏫 Supervisor Assignment
- Manual and auto-assignment for unmatched allocations
- Real-time supervisor capacity tracking

### 🧪 Second Marker Assignment
- Balanced workload distribution
- Avoids self-marking and minimizes unique supervisor pairs

### 📊 Reporting
- Excel export with:
  - Allocation summary
  - Supervisor capacity utilization
  - VIVA plan with second marker assignments

### 🔔 Notifications
- Students receive allocation notifications
- Mark notifications as read or bulk clear

### ⚙️ Admin Dashboard
- Manage titles, users, preferences, system settings
- Resolve capacity conflicts
- View and filter finalized allocations
---

## 🧱 Tech Stack

- **Backend**: Node.js, Express, MongoDB
- **Frontend**: HTML, TailwindCSS, jQuery, SweetAlert2
- **Authentication**: JWT
- **Data Export**: XLSX (Excel)

---

## 📁 Project Structure
├── backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── frontend
│   ├── css/
│   ├── js/
│   └── index.html
├── create_admin.js
├── users_template.csv
├── package.json
└── README.md