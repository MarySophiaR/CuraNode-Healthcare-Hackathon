# CuraNode - Hospital & Emergency Management System

CuraNode is a comprehensive full-stack solution designed to streamline hospital operations and emergency response. It provides real-time tracking for ambulances, automated bed and resource management, and a robust appointment booking system.

## 🚀 Features

### 🚑 Emergency & Ambulance Tracking
- **Real-time Dispatch**: Instant alerts to hospitals when an emergency is reported.
- **Live Location Updates**: Real-time GPS tracking of dispatched ambulances via Socket.io.
- **Severity-based Routing**: Automated queue prioritizing critical patients.

### 🏥 Hospital Management
- **Resource Management**: Real-time tracking of available beds, ICU units, oxygen, and ambulances.
- **Dashboard Overview**: Comprehensive view of active appointments, pending emergencies, and resource levels.
- **Staff/Doctor Management**: Manage available doctors and hospital resources.

### 📅 Patient Services
- **Appointment Booking**: Easy-to-use interface for patients to book appointments.
- **Health Records**: Secure storage and access to patient medical history.
- **Symptom Checker**: Basic AI-driven symptom analysis (integrated).

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide React, Leaflet (Maps).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **Real-time**: Socket.io.
- **Authentication**: JWT & Bcrypt.js.

## 📦 Project Structure

```text
CuraNode/
├── hospital-dashboard/    # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main hospital dashboard views
│   │   ├── user-dashboard/# Patient-specific views
│   │   └── services/      # API and Socket integrations
├── hospital-system/       # Backend Node.js API
│   ├── models/            # MongoDB Schemas
│   ├── routes/            # API Endpoints
│   ├── services/          # Business logic (Emergency, etc.)
│   └── server.js          # Entry point
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally or via Atlas)

### 1. Clone & Install Dependencies
```bash
# Install root dependencies
npm install

# Install Frontend dependencies
cd hospital-dashboard
npm install

# Install Backend dependencies
cd ../hospital-system
npm install
```

### 2. Environment Configuration
Create a `.env` file in `hospital-system/`:
```env
MONGO_URI=mongodb://localhost:27017/curanode
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

## 🏃 Running the Application

### Start Backend
```bash
cd hospital-system
npm start
```

### Start Frontend
```bash
cd hospital-dashboard
npm run dev
```

The frontend will typically run at `http://localhost:5173/` (or the next available port), and the backend at `http://localhost:5000/`.

---
*Built with ❤️ for modern healthcare.*
