import React from 'react';
import NavigationBar from './components/NavigationBar';
import './App.css';

function App() {
  return (
    <div className="App" style={{ backgroundColor: '#F7F7F7', minHeight: '100vh' }}>
      
      {}
      {/* <Login /> */}

      {/* Navigation Bar diri  */}
      <NavigationBar />

      <main style={{ padding: '20px', textAlign: 'center' }}>
         <h1 style={{ color: '#2563EB', marginTop: '50px' }}>EduTrack System Dashboard</h1>
         <p style={{ color: '#666' }}>Waiting for Student, Teacher, and Admin components...</p>
      </main>

    </div>
  );
}

export default App;
