import React, { useState } from 'react';

export default function Timetable() {
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(false);

  const sampleData = {
    faculties: [
      { id: 1, name: 'Dr. Alice Smith', min_hours_per_week: 0, max_hours_per_week: 20 },
      { id: 2, name: 'Prof. Bob Johnson', min_hours_per_week: 0, max_hours_per_week: 20 },
      { id: 3, name: 'Dr. Carol Davis', min_hours_per_week: 0, max_hours_per_week: 20 }
    ],
    sections: [
      { id: 1, name: 'CSE-A' },
      { id: 2, name: 'CSE-B' },
      { id: 3, name: 'IT-A' }
    ],
    classrooms: [
      { id: 1, name: 'Room-101' },
      { id: 2, name: 'Room-102' },
      { id: 3, name: 'Lab-201' }
    ],
    class_requirements: [
      { id: 1, faculty: 1, section: 1, subject: 'Mathematics', class_type: 'THEORY' },
      { id: 2, faculty: 2, section: 1, subject: 'Programming', class_type: 'LAB' },
      { id: 3, faculty: 3, section: 2, subject: 'Database', class_type: 'THEORY' },
      { id: 4, faculty: 1, section: 3, subject: 'Algorithms', class_type: 'THEORY' },
      { id: 5, faculty: 2, section: 2, subject: 'Web Development', class_type: 'LAB' }
    ],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periods: [1, 2, 3, 4, 5, 6, 7, 8],
    period_times: {
      1: ['09:00', '09:50'],
      2: ['10:00', '10:50'],
      3: ['11:00', '11:50'],
      4: ['12:00', '12:50'],
      5: ['14:00', '14:50'],
      6: ['15:00', '15:50'],
      7: ['16:00', '16:50'],
      8: ['17:00', '17:50']
    }
  };

  async function runSolver() {
    setLoading(true); // ✅ missing earlier
    try {
      const res = await fetch('http://localhost:5000/api/run-solver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData)
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.error) {
        console.error('Solver error:', data.error);
        alert(`Error: ${data.error}`);
      } else {
        setScheduled(data.scheduled); // update UI
        console.log('Solver status:', data.status);
      }
    } catch (err) {
      console.error('Error running solver:', err);
      alert(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={runSolver} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Timetable'}
      </button>

      {scheduled.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2>Generated Timetable</h2>
          <table style={{ 
            borderCollapse: 'collapse', 
            width: '100%', 
            border: '1px solid #ddd',
            marginTop: '10px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Day</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Period</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Time</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Subject</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Faculty</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Section</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Classroom</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {scheduled.map((classItem, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{classItem.day}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{classItem.period}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {classItem.start_time} - {classItem.end_time}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{classItem.subject}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {sampleData.faculties.find(f => f.id === classItem.faculty)?.name || `Faculty ${classItem.faculty}`}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {sampleData.sections.find(s => s.id === classItem.section)?.name || `Section ${classItem.section}`}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {sampleData.classrooms.find(c => c.id === classItem.classroom)?.name || `Room ${classItem.classroom}`}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{classItem.class_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {scheduled.length === 0 && !loading && (
        <div style={{ marginTop: '20px', color: '#666' }}>
          No timetable generated yet. Click the button above to generate one.
        </div>
      )}
    </div>
  );
}
