import React, { useState, useEffect } from 'react';

interface Student {
  id: string;
  name: string;
  email: string;
  attended?: boolean;
}

interface AttendanceTrackingProps {
  scheduleId: string;
  token: string;
}

export default function AttendanceTracking({ scheduleId, token }: AttendanceTrackingProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [scheduleId]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/attendance/${scheduleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
    setLoading(false);
  };

  const handleToggleAttendance = (studentId: string) => {
    setStudents(students.map(s =>
      s.id === studentId ? { ...s, attended: !s.attended } : s
    ));
    setSaved(false);
  };

  const handleSaveAttendance = async () => {
    try {
      for (const student of students) {
        await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            scheduleId,
            userId: student.id,
            attended: student.attended || false,
            notes: ''
          })
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving attendance:', err);
    }
  };

  const styles = {
    container: { maxWidth: '800px', margin: '0 auto', padding: '20px' },
    header: { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#333' },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: '20px',
      background: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      overflow: 'hidden'
    },
    th: {
      background: '#667eea',
      color: 'white',
      padding: '15px',
      textAlign: 'left' as const,
      fontWeight: 'bold'
    },
    td: {
      padding: '15px',
      borderBottom: '1px solid #eee'
    },
    checkbox: {
      width: '20px',
      height: '20px',
      cursor: 'pointer'
    },
    button: {
      background: '#667eea',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      marginRight: '10px'
    },
    successMsg: {
      background: '#d4edda',
      color: '#155724',
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '20px'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>✅ Anwesenheit Markieren</h2>

      {saved && (
        <div style={styles.successMsg}>
          ✅ Anwesenheit gespeichert
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : students.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
          <p>Keine Studierenden für diese Sitzung</p>
        </div>
      ) : (
        <div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>E-Mail</th>
                <th style={styles.th}>Anwesend</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td style={styles.td}>{student.name}</td>
                  <td style={styles.td}>{student.email}</td>
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      style={styles.checkbox}
                      checked={student.attended || false}
                      onChange={() => handleToggleAttendance(student.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button style={styles.button} onClick={handleSaveAttendance}>
            💾 Speichern
          </button>
        </div>
      )}
    </div>
  );
}
