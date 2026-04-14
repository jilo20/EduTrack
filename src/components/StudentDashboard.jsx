<<<<<<< HEAD
import React, { useState } from "react";

export default function StudentDashboard() {
  const [activePage, setActivePage] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div style={appStyle}>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
      />

      {/* NAVBAR */}
      <div style={navbar}>
        <div style={leftNav}>
          <i
            className="fas fa-bars"
            style={icon}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          ></i>
          <h1 style={logoText}>Student Dashboard</h1>
        </div>

        <div style={rightNav}>
          <span style={navItem} onClick={() => setActivePage("subjects")}>
            <i className="fas fa-book"></i> Subjects
          </span>
          <span style={navItem} onClick={() => setActivePage("reports")}>
            <i className="fas fa-chart-line"></i> Reports
          </span>
          <span style={navItem} onClick={() => setActivePage("profile")}>
            <i className="fas fa-user"></i> Profile
          </span>
          <span style={navItem}>
            <i className="fas fa-bell"></i>
          </span>
          <button style={logoutBtn}>
            <i className="fas fa-right-from-bracket"></i> Logout
          </button>
        </div>
      </div>

      <div style={layoutContainer}>
        {isSidebarOpen && (
          <div style={sidebar}>
            <div style={sideItem} onClick={() => setActivePage("home")}>
              <i className="fas fa-house"></i> Home
            </div>
            <div style={sideItem} onClick={() => setActivePage("subjects")}>
              <i className="fas fa-book"></i> Subjects
            </div>
            <div style={sideItem} onClick={() => setActivePage("evaluations")}>
              <i className="fas fa-pen"></i> Evaluations
            </div>
            <div style={sideItem} onClick={() => setActivePage("reports")}>
              <i className="fas fa-chart-line"></i> Reports
            </div>
            <div style={sideItem} onClick={() => setActivePage("profile")}>
              <i className="fas fa-user"></i> Profile
            </div>
          </div>
        )}

        <div style={mainArea}>
          {activePage === "home" && <Home />}
          {activePage === "subjects" && <Subjects />}
          {activePage === "evaluations" && <Evaluations />}
          {activePage === "reports" && <Reports />}
          {activePage === "profile" && <Profile />}
        </div>
      </div>
    </div>
  );
}

/* ================= PAGES ================= */

function Home() {
  return (
    <div>
      <h2 style={sectionTitle}>Overview</h2>
      <div style={cardGrid}>
        <div style={card}>Average Grade: 90%</div>
        <div style={card}>Subjects: 5</div>
        <div style={card}>Completed: 12</div>
        <div style={card}>Pending: 3</div>
      </div>
    </div>
  );
}

function Subjects() {
  return (
    <div>
      <h2 style={sectionTitle}>Subjects</h2>
      <div style={cardGrid}>
        <div style={card}>Math - 80%</div>
        <div style={card}>Science - 75%</div>
        <div style={card}>English - 90%</div>
      </div>
    </div>
  );
}

function Evaluations() {
  return (
    <div>
      <h2 style={sectionTitle}>Evaluations</h2>

      <div style={tableContainer}>
        <table style={table}>
          <thead>
            <tr>
              <th style={thTd}>Subject</th>
              <th style={thTd}>Activity</th>
              <th style={thTd}>Score</th>
              <th style={thTd}>Remarks</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td style={thTd}>Math</td>
              <td style={thTd}>Quiz 1</td>
              <td style={{ ...thTd, textAlign: "center" }}>90</td>
              <td style={{ ...thTd, ...good }}>Good</td>
            </tr>

            <tr>
              <td style={thTd}>Science</td>
              <td style={thTd}>Exam</td>
              <td style={{ ...thTd, textAlign: "center" }}>85</td>
              <td style={{ ...thTd, ...pass }}>Pass</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Reports() {
  return (
    <div>
      <h2 style={sectionTitle}>Reports</h2>

      <div style={cardGrid}>
        <div style={reportCard}>
          <i className="fas fa-file"></i>
          <h3>Generate Report</h3>
        </div>

        <div style={reportCard}>
          <i className="fas fa-chart-line"></i>
          <h3>Performance Graph</h3>
        </div>

        <div style={reportCard}>
          <i className="fas fa-download"></i>
          <h3>Download PDF</h3>
        </div>
      </div>
    </div>
  );
}

function Profile() {
  return (
    <div>
      <h2 style={sectionTitle}>Profile</h2>
      <div style={card}>Name: Juan Dela Cruz</div>
    </div>
  );
}

/* ================= STYLES ================= */

const appStyle = {
  fontFamily: "'Aachen', monospace",
  backgroundColor: "#F7F7F7",
  minHeight: "100vh",
  fontWeight: "bold",
};

const navbar = {
  background: "#2563EB",
  padding: "8px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const leftNav = { display: "flex", alignItems: "center", gap: "10px" };
const logoText = { color: "#fff", fontWeight: "900" };
const icon = { color: "#fff", cursor: "pointer" };

const rightNav = { display: "flex", gap: "15px", alignItems: "center" };
const navItem = { color: "#fff", cursor: "pointer" };

const logoutBtn = {
  backgroundColor: "#F59E0B",
  border: "none",
  padding: "6px 12px",
  color: "#fff",
  borderRadius: "6px",
};

const layoutContainer = { display: "flex" };

const sidebar = {
  width: "220px",
  backgroundColor: "#fff",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const sideItem = {
  padding: "10px",
  display: "flex",
  gap: "10px",
  cursor: "pointer",
};

const mainArea = { flex: 1, padding: "20px" };

const sectionTitle = {
  color: "#2563EB",
  fontWeight: "900",
};

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "15px",
};

const card = {
  backgroundColor: "#fff",
  padding: "15px",
  borderRadius: "10px",
};

const tableContainer = {
  background: "#fff",
  padding: "15px",
  borderRadius: "10px",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
};

const thTd = {
  padding: "12px",
  borderBottom: "1px solid #ddd",
};

const good = { color: "#16A34A" };
const pass = { color: "#F59E0B" };

const reportCard = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  textAlign: "center",
  cursor: "pointer",
};
=======
import React from 'react';
import { Typography, Box } from '@mui/material';

const StudentDashboard = () => {
    return (
        <Box>
            <Typography variant="h5">Welcome to your Dashboard Jilo!</Typography>
        </Box>
    );
};

export default StudentDashboard;
>>>>>>> a531a76ee5770ed6feb1cd3bb3d52089790b7cb3
