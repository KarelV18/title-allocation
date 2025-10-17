# 🎓 Title Allocation System

A comprehensive **web-based system** designed to manage student project title allocations, supervisor assignments, custom title proposals, and second marker assignments in academic institutions. The system supports role-based access (Admin, Supervisor, Student), enforces deadlines, and uses the Gale–Shapley algorithm for stable matching with supervisor capacity constraints.

---

## 🚀 Features

### 🔐 Authentication & Roles
- JWT-based login system
- Role-based dashboards for Admin, Supervisor, and Student

### 🎓 Student Preferences
- Submit 5 ranked title preferences
- Propose custom titles with supervisor
- Deadline enforcement for submissions

### 📊 Allocation Engine
- Gale–Shapley algorithm with supervisor capacity constraints
- Handles unmatched students and custom title approvals
- Allocation statistics and preference distribution

### 👨‍🏫 Supervisor Assignment
- Manual and auto-assignment of supervisors
- Real-time capacity tracking
- Conflict resolution for over-capacity supervisors

### 🧑‍🏫 Second Marker Assignment
- Balanced workload distribution
- Avoids self-marking
- Supervisor pairing statistics

### 📢 Notifications
- Allocation alerts for students
- Mark notifications as read
- Bulk notification clearing

### 📈 Reporting
- Excel export with:
  - Allocation summary
  - Supervisor capacity
  - VIVA plan
  - Second marker statistics

### 🛠 Admin Dashboard
- Manage titles, users, preferences, custom titles
- Resolve capacity conflicts
- Set system deadlines and allocation status

---

## 🧰 Tech Stack

| Layer | Technologies |
|--------|----------------|
|**Backend** | Node.js, Express, MongoDB|
|**Frontend** | HTML, TailwindCSS, jQuery, SweetAlert2|
|**Authentication** | JWT|
|**Reporting** | XLSX (Excel export)|

---

## 📁 Project Structure

```
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── frontend/
│   ├── css/
│   ├── js/
│   ├── favicon/
│   └── index.html
├── users_template.csv
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/title-allocation.git
   cd title-allocation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root with:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=title_allocation
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=24h
   CLIENT_URL=http://localhost:5000
   ```

4. **Start the server**
   ```bash
   nodemon
   ```

5. **Access the app**
   Open http://localhost:5000 in your browser.

---

## 📦 Bulk User Upload

Use `users_template.csv` to bulk upload students and supervisors. Ensure:
- Supervisor capacity matches total student count.
- Roles: `student`, `supervisor`, `admin`
- Email format: university domain

---

## 📌 Allocation Workflow

1. Students submit preferences and custom titles.
2. Admin reviews and approves custom titles.
3. Admin runs allocation algorithm.
4. System assigns titles using Gale–Shapley.
5. Supervisor and second marker assignments are made.
6. Reports are generated and notifications sent.