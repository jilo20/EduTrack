import React from 'react';

const NavigationBar = () => {
  const primary = '#2563EB';   // Blue
  const accent = '#F59E0B';    // Amber

  return (
    <nav style={{
      backgroundColor: primary,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.8rem 2rem',
      color: '#FFFFFF',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      {}
      <div style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '1px' }}>
        EduTrack
      </div>
      
      <ul style={{ display: 'flex', listStyle: 'none', gap: '30px', margin: 0, padding: 0 }}>
        <li><a href="#student" style={{ color: '#FFFFFF', textDecoration: 'none', fontWeight: '500' }}>Student</a></li>
        <li><a href="#teacher" style={{ color: '#FFFFFF', textDecoration: 'none', fontWeight: '500' }}>Teacher</a></li>
        <li><a href="#admin" style={{ color: '#FFFFFF', textDecoration: 'none', fontWeight: '500' }}>Admin</a></li>
      </ul>

      <div>
        <button style={{ 
          backgroundColor: accent, 
          padding: '8px 20px', 
          border: 'none', 
          borderRadius: '5px', 
          color: '#FFFFFF', 
          fontWeight: 'bold', 
          cursor: 'pointer' 
        }}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default NavigationBar;