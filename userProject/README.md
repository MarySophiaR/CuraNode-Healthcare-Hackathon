# CuraNode - Integrated Emergency Response System

## Prerequisites
- Node.js (v18+)
- MongoDB (running locally on port 27017)

## Getting Started

### 1. Start the Backend Server
Open a terminal and run:
```bash
cd backend
npm install
npm run dev
```
The server will start on `http://localhost:5000`.

To seed the initial hospital data (required for demo), visit `http://localhost:5000/api/seed-hospitals` in your browser or use curl.

### 2. Start the Frontend Application
Open a **new** terminal window and run:
```bash
cd frontend
npm install
npm run dev
```
The application will start on `http://localhost:5173`.

## Features
- **Landing Page**: Overview of services.
- **Login/Register**: Secure JWT authentication.
- **Emergency Mode**: Real-time hospital finding & ambulance tracking.
- **Dashboard**: Access to smart hospital finder, symptom checker, and health records.

## Demo Accounts
Register a new account at `/register` to access the Dashboard.
