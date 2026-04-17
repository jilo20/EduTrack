import { useState } from "react";

function Teachers() {
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  const [studentForm, setStudentForm] = useState({
    name: "",
    grade: "",
    score: "",
    attendance: "",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    due: "",
    submitted: "",
    total: "",
  });

  const [studentError, setStudentError] = useState("");
  const [assignmentError, setAssignmentError] = useState("");

  // for tracking which assignment is being edited
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);

  // --- Computed Stats ---
  const avgScore =
    students.length > 0
      ? Math.round(students.reduce((total, s) => total + Number(s.score), 0) / students.length)
      : 0;

  const avgAttendance =
    students.length > 0
      ? Math.round(students.reduce((total, s) => total + Number(s.attendance), 0) / students.length)
      : 0;

  const atRisk = students.filter(
    (s) => s.status === "At Risk" || s.status === "Needs Attention"
  ).length;

  // --- Auto Status based on score ---
  const getStatus = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Needs Attention";
    return "At Risk";
  };

  const getStatusColor = (status) => {
    if (status === "Excellent") return "#16A34A";
    if (status === "Good") return "#2563EB";
    if (status === "Needs Attention") return "#F59E0B";
    if (status === "At Risk") return "#EF4444";
    return "#888";
  };

  // --- Add Student ---
  const handleAddStudent = () => {
    const { name, grade, score, attendance } = studentForm;

    if (!name || !grade || !score || !attendance) {
      setStudentError("Please fill in all fields.");
      return;
    }
    if (score < 0 || score > 100 || attendance < 0 || attendance > 100) {
      setStudentError("Score and attendance must be between 0 and 100.");
      return;
    }

    const newStudent = {
      id: Date.now(),
      name,
      grade,
      score: Number(score),
      attendance: Number(attendance),
      status: getStatus(Number(score)),
    };

    setStudents([...students, newStudent]);
    setStudentForm({ name: "", grade: "", score: "", attendance: "" });
    setStudentError("");
    setShowStudentForm(false);
  };

  // --- Add Assignment ---
  const handleAddAssignment = () => {
    const { title, due, submitted, total } = assignmentForm;

    if (!title || !due || !submitted || !total) {
      setAssignmentError("Please fill in all fields.");
      return;
    }
    if (Number(submitted) > Number(total)) {
      setAssignmentError("Submitted cannot be more than total.");
      return;
    }

    const newAssignment = {
      id: Date.now(),
      title,
      due,
      submitted: Number(submitted),
      total: Number(total),
    };

    setAssignments([...assignments, newAssignment]);
    setAssignmentForm({ title: "", due: "", submitted: "", total: "" });
    setAssignmentError("");
    setShowAssignmentForm(false);
  };

  // --- Edit Assignment: load data into form ---
  const handleEditAssignment = (a) => {
    setEditingAssignmentId(a.id);
    setAssignmentForm({
      title: a.title,
      due: a.due,
      submitted: String(a.submitted),
      total: String(a.total),
    });
    setAssignmentError("");
    setShowAssignmentForm(false); // close add form if open
  };

  // --- Save Edited Assignment ---
  const handleSaveEdit = () => {
    const { title, due, submitted, total } = assignmentForm;

    if (!title || !due || !submitted || !total) {
      setAssignmentError("Please fill in all fields.");
      return;
    }
    if (Number(submitted) > Number(total)) {
      setAssignmentError("Submitted cannot be more than total.");
      return;
    }

    setAssignments(
      assignments.map((a) =>
        a.id === editingAssignmentId
          ? { ...a, title, due, submitted: Number(submitted), total: Number(total) }
          : a
      )
    );

    setEditingAssignmentId(null);
    setAssignmentForm({ title: "", due: "", submitted: "", total: "" });
    setAssignmentError("");
  };

  // --- Cancel Edit ---
  const handleCancelEdit = () => {
    setEditingAssignmentId(null);
    setAssignmentForm({ title: "", due: "", submitted: "", total: "" });
    setAssignmentError("");
  };

  // --- Delete Student ---
  const handleDeleteStudent = (id) => {
    setStudents(students.filter((s) => s.id !== id));
  };

  // --- Delete Assignment ---
  const handleDeleteAssignment = (id) => {
    setAssignments(assignments.filter((a) => a.id !== id));
  };

  const filteredStudents = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || s.status === filter;
    return matchSearch && matchFilter;
  });

  const inputStyle = {
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif", background: "#F7F7F7" }}>

      {/* Sidebar */}
      <div style={{ width: 220, background: "#1E293B", color: "#fff", padding: "24px 0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #334155" }}>
          <h2 style={{ margin: 0, fontSize: 20, color: "#fff" }}>EduTracker</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94A3B8" }}>Teacher Portal</p>
        </div>
        <nav style={{ marginTop: 16 }}>
          {["Dashboard", "Students", "Assignments", "Attendance", "Settings"].map((item) => (
            <div
              key={item}
              style={{
                padding: "10px 20px",
                cursor: "pointer",
                color: item === "Dashboard" ? "#fff" : "#94A3B8",
                background: item === "Dashboard" ? "rgba(37,99,235,0.3)" : "transparent",
                borderLeft: item === "Dashboard" ? "3px solid #2563EB" : "3px solid transparent",
                fontSize: 14,
              }}
            >
              {item}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 28, overflowY: "auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, color: "#1E293B" }}>Teacher Dashboard</h1>
          <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 14 }}>
            Here's your class overview.
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, borderTop: "4px solid #2563EB" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>Total Students</p>
            <h2 style={{ margin: "8px 0 0", fontSize: 28, color: "#1E293B" }}>{students.length}</h2>
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, borderTop: "4px solid #16A34A" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>Class Average</p>
            <h2 style={{ margin: "8px 0 0", fontSize: 28, color: "#1E293B" }}>{avgScore}%</h2>
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, borderTop: "4px solid #F59E0B" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>Avg Attendance</p>
            <h2 style={{ margin: "8px 0 0", fontSize: 28, color: "#1E293B" }}>{avgAttendance}%</h2>
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, borderTop: "4px solid #EF4444" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>Needs Attention</p>
            <h2 style={{ margin: "8px 0 0", fontSize: 28, color: "#EF4444" }}>{atRisk}</h2>
          </div>
        </div>

        {/* ---- ASSIGNMENTS SECTION ---- */}
        <div style={{ background: "#fff", borderRadius: 10, padding: 20, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "#1E293B" }}>Assignments</h3>
            <button
              onClick={() => {
                setShowAssignmentForm(!showAssignmentForm);
                setEditingAssignmentId(null);
                setAssignmentForm({ title: "", due: "", submitted: "", total: "" });
                setAssignmentError("");
              }}
              style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              {showAssignmentForm ? "Cancel" : "+ Add Assignment"}
            </button>
          </div>

          {/* Add Assignment Form */}
          {showAssignmentForm && (
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: 14, color: "#1E293B" }}>New Assignment</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Title</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. Math Quiz 3"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Due Date</label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={assignmentForm.due}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, due: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Submitted</label>
                  <input
                    type="number"
                    style={inputStyle}
                    placeholder="0"
                    value={assignmentForm.submitted}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, submitted: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Total Students</label>
                  <input
                    type="number"
                    style={inputStyle}
                    placeholder="0"
                    value={assignmentForm.total}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, total: e.target.value })}
                  />
                </div>
              </div>
              {assignmentError && (
                <p style={{ color: "#EF4444", fontSize: 12, margin: "10px 0 0" }}>{assignmentError}</p>
              )}
              <button
                onClick={handleAddAssignment}
                style={{ marginTop: 14, background: "#16A34A", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Save Assignment
              </button>
            </div>
          )}

          {/* Edit Assignment Form */}
          {editingAssignmentId && (
            <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: 14, color: "#1E293B" }}>Edit Assignment</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Title</label>
                  <input
                    style={inputStyle}
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Due Date</label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={assignmentForm.due}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, due: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Submitted</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={assignmentForm.submitted}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, submitted: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Total Students</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={assignmentForm.total}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, total: e.target.value })}
                  />
                </div>
              </div>
              {assignmentError && (
                <p style={{ color: "#EF4444", fontSize: 12, margin: "10px 0 0" }}>{assignmentError}</p>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  onClick={handleSaveEdit}
                  style={{ background: "#F59E0B", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  style={{ background: "none", border: "1px solid #CBD5E1", color: "#64748B", borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Assignment Table */}
          {assignments.length === 0 ? (
            <p style={{ color: "#94A3B8", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
              No assignments yet. Click "+ Add Assignment" to get started.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "#64748B", fontWeight: 600 }}>Title</th>
                  <th style={{ padding: "10px 12px", color: "#64748B", fontWeight: 600 }}>Due Date</th>
                  <th style={{ padding: "10px 12px", color: "#64748B", fontWeight: 600 }}>Submitted</th>
                  <th style={{ padding: "10px 12px", color: "#64748B", fontWeight: 600 }}>Progress</th>
                  <th style={{ padding: "10px 12px", color: "#64748B", fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const pct = Math.round((a.submitted / a.total) * 100);
                  const isEditing = editingAssignmentId === a.id;
                  return (
                    <tr
                      key={a.id}
                      style={{ borderTop: "1px solid #F1F5F9", background: isEditing ? "#FFFBEB" : "transparent" }}
                    >
                      <td style={{ padding: "10px 12px", fontWeight: 500 }}>{a.title}</td>
                      <td style={{ padding: "10px 12px", color: "#64748B" }}>{a.due}</td>
                      <td style={{ padding: "10px 12px" }}>{a.submitted}/{a.total}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ background: "#F1F5F9", borderRadius: 99, height: 8, width: 120 }}>
                          <div style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: pct === 100 ? "#16A34A" : "#2563EB",
                            borderRadius: 99
                          }} />
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => handleEditAssignment(a)}
                            style={{ background: "none", border: "1px solid #F59E0B", color: "#F59E0B", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(a.id)}
                            style={{ background: "none", border: "1px solid #EF4444", color: "#EF4444", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ---- STUDENT SECTION ---- */}
        <div style={{ background: "#fff", borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "#1E293B" }}>Student List</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 12px", fontSize: 13, outline: "none" }}
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 12px", fontSize: 13 }}
              >
                <option value="All">All</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Needs Attention">Needs Attention</option>
                <option value="At Risk">At Risk</option>
              </select>
              <button
                onClick={() => setShowStudentForm(!showStudentForm)}
                style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                {showStudentForm ? "Cancel" : "+ Add Student"}
              </button>
            </div>
          </div>

          {/* Student Form */}
          {showStudentForm && (
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: 14, color: "#1E293B" }}>New Student</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Full Name</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. Maria Santos"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Grade</label>
                  <select
                    style={inputStyle}
                    value={studentForm.grade}
                    onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
                  >
                    <option value="">Select</option>
                    {["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Score (0-100)</label>
                  <input
                    type="number"
                    style={inputStyle}
                    placeholder="e.g. 88"
                    min="0"
                    max="100"
                    value={studentForm.score}
                    onChange={(e) => setStudentForm({ ...studentForm, score: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Attendance (0-100)</label>
                  <input
                    type="number"
                    style={inputStyle}
                    placeholder="e.g. 95"
                    min="0"
                    max="100"
                    value={studentForm.attendance}
                    onChange={(e) => setStudentForm({ ...studentForm, attendance: e.target.value })}
                  />
                </div>
              </div>
              {studentError && (
                <p style={{ color: "#EF4444", fontSize: 12, margin: "10px 0 0" }}>{studentError}</p>
              )}
              <p style={{ fontSize: 12, color: "#94A3B8", margin: "10px 0 0" }}>
                * Status is automatically set based on score: 90+ = Excellent, 80–89 = Good, 70–79 = Needs Attention, below 70 = At Risk
              </p>
              <button
                onClick={handleAddStudent}
                style={{ marginTop: 14, background: "#16A34A", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Save Student
              </button>
            </div>
          )}

          {/* Student Table */}
          {students.length === 0 ? (
            <p style={{ color: "#94A3B8", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
              No students yet. Click "+ Add Student" to get started.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "#64748B", fontWeight: 600 }}>Name</th>
                  <th style={{ padding: "10px 12px", color: "#64748B", fontWeight: 600 }}>Grade</th>
                  <th style={{ padding: "10px 12px", color: "#64748B", fontWeight: 600 }}>Score</th>
                  <th style={{ padding: "10px 12px", color: "#64748B", fontWeight: 600 }}>Attendance</th>
                  <th style={{ padding: "10px 12px", color: "#64748B", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "10px 12px", color: "#64748B", fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{s.name}</td>
                    <td style={{ padding: "10px 12px" }}>{s.grade}</td>
                    <td style={{ padding: "10px 12px" }}>{s.score}%</td>
                    <td style={{ padding: "10px 12px" }}>{s.attendance}%</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        background: getStatusColor(s.status) + "20",
                        color: getStatusColor(s.status),
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <button
                        onClick={() => handleDeleteStudent(s.id)}
                        style={{ background: "none", border: "1px solid #EF4444", color: "#EF4444", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {students.length > 0 && filteredStudents.length === 0 && (
            <p style={{ textAlign: "center", color: "#94A3B8", marginTop: 20 }}>No students found.</p>
          )}
        </div>

      </div>
    </div>
  );
}

export default Teachers;
