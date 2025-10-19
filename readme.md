# 🎓 Title Allocation System

A comprehensive **web-based system** designed to manage student project title allocations, supervisor assignments, custom/proposed title proposals, and second marker assignments. The system supports role-based access (Admin, Supervisor, Student), enforces deadlines, and uses a custom algorithm inspired from Gale–Shapley algorithm for stable matching with supervisor capacity constraints.

---

## 🚀 Features

### 🧠 Core Allocation Logic
- **Comprehensive Allocation Algorithm**:
  - Handles regular preferences using an enhanced Gale-Shapley algorithm.
  - Supports custom titles with supervisor approval and capacity checks.
  - Automatically allocates students without preferences.
  - Ensures no supervisor is over capacity.
  - Generates detailed allocation statistics.

### 🧑‍🏫 Supervisor & Title Management
- Supervisors can:
  - Submit, edit, and delete titles.
  - View allocation results.
  - Manage capacity constraints.

### 🎓 Student Preferences
- Students can:
  - Submit exactly 5 ranked preferences.
  - Propose custom titles with supervisor details.
  - View allocation results once published.

### 🛡️ Admin Controls
- Run allocation process with validation.
- Approve/reject custom titles.
- Resolve capacity conflicts.
- Publish/unpublish allocations.
- Assign supervisors manually or auto-assign.
- Generate Excel reports with VIVA plans and statistics.

### 📊 Reporting
- Excel export includes:
  - Allocation summary.
  - Supervisor capacity utilization.
  - Second marker assignments.

### 🔐 Authentication & Roles
- JWT-based login system.
- Role-based access control for students, supervisors, and admins.

### 🔔 Notifications
- Students receive allocation notifications.
- Mark notifications as read individually or in bulk.

---

## 🧱 Tech Stack

| Layer | Technologies |
|--------|----------------|
|**Backend** | Node.js, Express, MongoDB|
|**Frontend** | HTML, TailwindCSS, jQuery, SweetAlert2|
|**Authentication** | JWT|
|**Reporting** | XLSX (Excel export)|

---

## 📂 Folder Structure

```
backend/
  ├── controllers/
  ├── models/
  ├── routes/
  ├── middleware/
  ├── config/
frontend/
  ├── css/
  ├── js/
  └── index.html
```

---

## 🛠️ Setup Instructions

1. Clone the repo:
   ```bash
   git clone https://github.com/mrinalsharma14/title-allocation.git
   cd title-allocation
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   PORT=5000
   MONGODB_URI=your_mongo_uri
   JWT_SECRET=your_jwt_secret
   DB_NAME=title_allocation
   JWT_EXPIRES_IN=24h
   CLIENT_URL=http://localhost:5000
   ```

4. Start the server:
   ```bash
   nodemon
   ```

---

## 📦 Bulk User Upload

Use `users_template.csv` to bulk upload students and supervisors. Ensure:
- Supervisor capacity matches total student count.
- Roles: `student`, `supervisor`, `admin`

---

## ⚙️ Allocation Workflow

1. Students submit preferences and custom titles.
2. Admin reviews and approves custom titles.
3. Admin runs allocation algorithm.
4. System assigns titles using Gale–Shapley.
5. Supervisor and second marker assignments are made.
6. Reports are generated and notifications sent.

---

## 📌 Notes

- Allocation only runs if total supervisor capacity matches student count.  
- Custom titles require admin approval and supervisor capacity validation.  
- Second markers are assigned to balance workload and minimize new pairings.
