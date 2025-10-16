# 🎓 Title Allocation System

A comprehensive **web-based system** for managing student project title allocations, supervisor assignments, custom title proposals, and second marker assignments.  
Built with **Node.js**, **MongoDB**, and a **JavaScript frontend** using **TailwindCSS**, **jQuery**, and **SweetAlert2**.

---

## 🚀 Features

### 🔐 Authentication & Roles
- JWT-based secure login
- Role-based access for **Admin**, **Supervisor**, and **Student**

### 📋 Student Preferences
- Submit **exactly 5 ranked title preferences**
- Propose **custom titles** with supervisor suggestions
- Enforces submission **deadlines**

### 🧠 Allocation Engine
- Implements the **Gale–Shapley Algorithm** for stable matching
- Handles **supervisor capacity constraints**
- Supports **custom titles**, **unmatched students**, and **allocation statistics**

### 👨‍🏫 Supervisor Assignment
- **Manual and auto-assignment** for unmatched students
- Real-time **supervisor capacity tracking**

### 🧪 Second Marker Assignment
- Balances supervisor workload
- Prevents **self-marking**
- Minimizes **unique supervisor pairs**

### 📊 Reporting
- **Excel export** with:
  - Allocation summary  
  - Supervisor capacity utilization  
  - Viva plan with second marker assignments

### 🔔 Notifications
- Students receive **allocation notifications**
- Supports **mark as read** or **bulk clear**

### ⚙️ Admin Dashboard
- Manage titles, users, preferences, and system settings
- Resolve **capacity conflicts**
- View and filter **finalized allocations**

---

## 🧱 Tech Stack

| Layer | Technologies |
|--------|----------------|
| **Backend** | Node.js, Express, MongoDB |
| **Frontend** | HTML, TailwindCSS, jQuery, SweetAlert2 |
| **Authentication** | JWT |
| **Data Export** | XLSX (Excel) |

---

## 📁 Project Structure

```
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
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/mrinalsharma14/title-allocation-system.git
cd title-allocation-system
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Configure Environment
Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### 4️⃣ Start the Server
```bash
node backend/server.js
```

### 5️⃣ Access the Application
Open your browser and go to:  
👉 [http://localhost:5000](http://localhost:5000)

---

## 👥 Bulk User Upload

Use the provided `users_template.csv` to upload student and supervisor data.

✅ **Ensure the following:**
- Supervisor capacity matches total student count  
- Roles are correctly assigned (`student`, `supervisor`, `admin`)  

---

## 🔄 Allocation Workflow

1. Students submit preferences  
2. Admin runs the allocation process  
3. System assigns titles using **Gale–Shapley algorithm**  
4. Unmatched students are flagged for **manual assignment**  
5. **Second markers** are automatically distributed  
6. **Reports** are generated for export  
