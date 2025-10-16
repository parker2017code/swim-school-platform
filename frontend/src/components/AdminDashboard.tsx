import React, { useState, useEffect } from 'react';

interface Course {
  id: string;
  typeName: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string;
  priceBrutto: number;
  maxStudents: number;
  status: string;
}

interface AdminDashboardProps {
  token: string;
  locationId: string;
}

export default function AdminDashboard({ token, locationId }: AdminDashboardProps) {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    courseTypeId: '', locationId: '', instructorId: '', startTime: '', endTime: '',
    daysOfWeek: '', priceNet: 0, priceBrutto: 0, maxStudents: 10
  });
  const [editingCourse, setEditingCourse] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, tab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, coursesRes, usersRes, paymentsRes] = await Promise.all([
        fetch('/api/admin/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/courses', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/payments', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (coursesRes.ok) setCourses(await coursesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
    setLoading(false);
  };

  const handleCreateCourse = async () => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('✅ Kurs erstellt!');
        setFormData({
          courseTypeId: '', locationId: '', instructorId: '', startTime: '', endTime: '',
          daysOfWeek: '', priceNet: 0, priceBrutto: 0, maxStudents: 10
        });
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error creating course:', err);
      alert('❌ Fehler beim Erstellen des Kurses');
    }
  };

  const handleUpdateCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('✅ Kurs aktualisiert!');
        setEditingCourse(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error updating course:', err);
    }
  };

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '20px' },
    tabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      borderBottom: '2px solid #ddd',
      overflowX: 'auto' as const
    },
    tab: (active: boolean) => ({
      padding: '12px 20px',
      background: active ? '#667eea' : 'white',
      color: active ? 'white' : '#333',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '4px',
      fontWeight: active ? 'bold' : 'normal',
      whiteSpace: 'nowrap' as const
    }),
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      textAlign: 'center' as const
    },
    statNumber: { fontSize: '32px', fontWeight: 'bold', color: '#667eea', margin: '10px 0' },
    form: {
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    input: {
      width: '100%',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      marginBottom: '10px',
      boxSizing: 'border-box' as const
    },
    button: {
      background: '#667eea',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
      marginRight: '10px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      background: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      overflow: 'hidden'
    },
    th: {
      background: '#667eea',
      color: 'white',
      padding: '12px',
      textAlign: 'left' as const,
      fontWeight: 'bold'
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #eee'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>🔧 Admin Dashboard</h1>

      <div style={styles.tabs}>
        <button style={styles.tab(tab === 'overview')} onClick={() => setTab('overview')}>
          📊 Übersicht
        </button>
        <button style={styles.tab(tab === 'courses')} onClick={() => setTab('courses')}>
          📚 Kurse
        </button>
        <button style={styles.tab(tab === 'users')} onClick={() => setTab('users')}>
          👥 Benutzer
        </button>
        <button style={styles.tab(tab === 'payments')} onClick={() => setTab('payments')}>
          💳 Zahlungen
        </button>
      </div>

      {loading && <div>Loading...</div>}

      {/* Overview Tab */}
      {tab === 'overview' && stats && (
        <div>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h3>📚 Kurse</h3>
              <div style={styles.statNumber}>{stats.totalCourses}</div>
            </div>
            <div style={styles.statCard}>
              <h3>📋 Buchungen</h3>
              <div style={styles.statNumber}>{stats.totalBookings}</div>
            </div>
            <div style={styles.statCard}>
              <h3>✅ Zahlungen</h3>
              <div style={styles.statNumber}>{stats.confirmedPayments}</div>
            </div>
            <div style={styles.statCard}>
              <h3>💰 Umsatz</h3>
              <div style={styles.statNumber}>€{stats.totalRevenue?.toFixed(2)}</div>
            </div>
            <div style={styles.statCard}>
              <h3>⏳ Ausstehend</h3>
              <div style={styles.statNumber}>€{stats.pendingPayments?.toFixed(2)}</div>
            </div>
            <div style={styles.statCard}>
              <h3>👥 Benutzer</h3>
              <div style={styles.statNumber}>{stats.totalUsers}</div>
            </div>
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {tab === 'courses' && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>➕ Neuen Kurs Erstellen</h2>
          <div style={styles.form}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <input style={styles.input} placeholder="Course Type ID" value={formData.courseTypeId}
                onChange={(e) => setFormData({ ...formData, courseTypeId: e.target.value })} />
              <input style={styles.input} placeholder="Location ID" value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })} />
              <input style={styles.input} placeholder="Instructor ID" value={formData.instructorId}
                onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })} />
              <input style={styles.input} type="time" placeholder="Start Time" value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
              <input style={styles.input} type="time" placeholder="End Time" value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
              <input style={styles.input} placeholder="Days (z.B. Mo,Mi)" value={formData.daysOfWeek}
                onChange={(e) => setFormData({ ...formData, daysOfWeek: e.target.value })} />
              <input style={styles.input} type="number" placeholder="Price Net" value={formData.priceNet}
                onChange={(e) => setFormData({ ...formData, priceNet: parseFloat(e.target.value) })} />
              <input style={styles.input} type="number" placeholder="Price Brutto" value={formData.priceBrutto}
                onChange={(e) => setFormData({ ...formData, priceBrutto: parseFloat(e.target.value) })} />
            </div>
            <button style={styles.button} onClick={handleCreateCourse}>
              ✅ Kurs Erstellen
            </button>
          </div>

          <h2 style={{ marginBottom: '20px', marginTop: '30px' }}>📚 Vorhandene Kurse</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Kursname</th>
                <th style={styles.th}>Uhrzeit</th>
                <th style={styles.th}>Tage</th>
                <th style={styles.th}>Preis</th>
                <th style={styles.th}>Max. Studenten</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td style={styles.td}>{course.typeName}</td>
                  <td style={styles.td}>{course.startTime}-{course.endTime}</td>
                  <td style={styles.td}>{course.daysOfWeek}</td>
                  <td style={styles.td}>€{course.priceBrutto}</td>
                  <td style={styles.td}>{course.maxStudents}</td>
                  <td style={styles.td}>{course.status}</td>
                  <td style={styles.td}>
                    <button style={{ ...styles.button, background: '#ffa500', padding: '5px 10px', marginRight: '5px' }}
                      onClick={() => setEditingCourse(course.id)}>
                      ✏️ Edit
                    </button>
                    <button style={{ ...styles.button, background: '#ff6b6b', padding: '5px 10px' }}>
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>E-Mail</th>
                <th style={styles.th}>Rolle</th>
                <th style={styles.th}>Beigetreten</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td style={styles.td}>{user.name}</td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}><strong>{user.role}</strong></td>
                  <td style={styles.td}>{new Date(user.createdAt).toLocaleDateString('de-DE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Benutzer</th>
                <th style={styles.th}>Kurs</th>
                <th style={styles.th}>Betrag</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Datum</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td style={styles.td}>{payment.userName}</td>
                  <td style={styles.td}>{payment.courseName}</td>
                  <td style={styles.td}>€{payment.amount?.toFixed(2)}</td>
                  <td style={styles.td}>
                    <span style={{
                      background: payment.status === 'paid' ? '#d4edda' : '#fff3cd',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {payment.status === 'paid' ? '✅ Bezahlt' : '⏳ Ausstehend'}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(payment.createdAt).toLocaleDateString('de-DE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
