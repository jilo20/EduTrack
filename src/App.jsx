import React from 'react';
<<<<<<< HEAD
=======
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
>>>>>>> a531a76ee5770ed6feb1cd3bb3d52089790b7cb3
import StudentDashboard from './components/StudentDashboard';
import './App.css';

function App() {
  return (
<<<<<<< HEAD
    <div className="App">
      {/* <Login /> */}
      <StudentDashboard />
    </div>
=======
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<StudentDashboard />} />
            {/* You can add more sub-routes here like /dashboard/performance */}
          </Route>
        </Routes>
      </div>
    </Router>
>>>>>>> a531a76ee5770ed6feb1cd3bb3d52089790b7cb3
  );
}

export default App;
