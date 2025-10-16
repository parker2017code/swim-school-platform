import React, { useState, useEffect } from 'react';

interface Progress {
  id: string;
  courseTypeName: string;
  currentLevel: string;
  skillsAcquired: string;
  sessionsCompleted: number;
  totalSessions: number;
  progressPercentage: number;
  notes: string;
}

interface ProgressTrackingProps {
  userId: string;
  token: string;
  isInstructor?: boolean;
}

export default function ProgressTracking({ userId, token, isInstructor }: ProgressTrackingProps) {
  const [progressList, setProgressList] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ currentLevel: '', totalSessions: 0, notes: '' });

  useEffect(() => {
    fetchProgress();
  }, [userId]);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/progress/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProgressList(data);
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
    setLoading(false);
  };

  const handleUpdateProgress = async (progress: Progress) => {
    try {
      const response = await fetch('/api/admin/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          courseTypeId: progress.id,
          currentLevel: formData.currentLevel || progress.currentLevel,
          skillsAcquired: progress.skillsAcquired,
          totalSessions: formData.totalSessions || progress.totalSessions,
          notes: formData.notes || progress.notes
        })
      });

      if (response.ok) {
        setEditingId(null);
        setFormData({ currentLevel: '', totalSessions: 0, notes: '' });
        fetchProgress();
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const styles = {
    container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
    header: { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#333' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    card: {
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #eee'
    },
    progressBar: {
      background: '#f0f0f0',
      height: '10px',
      borderRadius: '5px',
      marginTop: '10px',
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #667eea, #764ba2)',
      borderRadius: '5px'
    },
    button: {
      background: '#667eea',
      color: 'white',
      border: 'none',
      padding: '10px 15px',
      borderRadius: '4px',
      cursor: 'pointer',
      marginTop: '10px',
      marginRight: '5px'
    },
    input: {
      width: '100%',
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      marginBottom: '10px',
      boxSizing: 'border-box' as const
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📈 Lernfortschritt</h2>

      {loading ? (
        <div>Loading...</div>
      ) : progressList.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
          <p>Noch kein Fortschritt verzeichnet</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {progressList.map(progress => (
            <div key={progress.id} style={styles.card}>
              <h3 style={{ margin: '0 0 10px 0' }}>{progress.courseTypeName}</h3>

              {editingId === progress.id ? (
                <div>
                  <label>Aktuelles Level</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.currentLevel || progress.currentLevel}
                    onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value })}
                    placeholder="z.B. Anfänger, Fortgeschritten"
                  />

                  <label>Gesamtsitzungen</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={formData.totalSessions || progress.totalSessions}
                    onChange={(e) => setFormData({ ...formData, totalSessions: parseInt(e.target.value) })}
                  />

                  <label>Anmerkungen</label>
                  <textarea
                    style={{ ...styles.input, minHeight: '60px' }}
                    value={formData.notes || progress.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Fortschritt und Bemerkungen..."
                  />

                  <button style={styles.button} onClick={() => handleUpdateProgress(progress)}>
                    ✅ Speichern
                  </button>
                  <button
                    style={{ ...styles.button, background: '#999' }}
                    onClick={() => setEditingId(null)}
                  >
                    ❌ Abbrechen
                  </button>
                </div>
              ) : (
                <div>
                  <p><strong>Level:</strong> {progress.currentLevel}</p>
                  <p><strong>Sitzungen:</strong> {progress.sessionsCompleted}/{progress.totalSessions}</p>
                  <p><strong>Fähigkeiten:</strong> {progress.skillsAcquired || 'N/A'}</p>

                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${progress.progressPercentage}%`
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
                    {Math.round(progress.progressPercentage)}% Fortschritt
                  </p>

                  {progress.notes && (
                    <p style={{ fontSize: '12px', color: '#999', marginTop: '10px', fontStyle: 'italic' }}>
                      📝 {progress.notes}
                    </p>
                  )}

                  {isInstructor && (
                    <button
                      style={styles.button}
                      onClick={() => {
                        setEditingId(progress.id);
                        setFormData({
                          currentLevel: progress.currentLevel,
                          totalSessions: progress.totalSessions,
                          notes: progress.notes
                        });
                      }}
                    >
                      ✏️ Bearbeiten
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
