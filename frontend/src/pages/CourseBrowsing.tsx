// @ts-nocheck
import React, { useState, useEffect } from 'react';
import '../styles/CourseBrowsing.css';

export default function CourseBrowsing({ onNavigate, selectedLocation, onLocationChange, onAddToCart }) {
  const [courses, setCourses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [ageFilter, setAgeFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [selectedLocation, ageFilter, levelFilter]);

  const fetchLocations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/locations');
      const data = await response.json();
      setLocations(data);
      if (data.length > 0 && !selectedLocation) {
        onLocationChange(data[0].id);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/courses';
      const params = new URLSearchParams();
      if (selectedLocation) params.append('locationId', selectedLocation);
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url);
      let data = await response.json();

      if (ageFilter) data = data.filter(c => c.ageGroup === ageFilter);
      if (levelFilter) data = data.filter(c => c.level === levelFilter);

      setCourses(data);
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="course-browsing">
      <h1>📚 Verfügbare Kurse</h1>

      <div className="filters">
        <select value={selectedLocation} onChange={(e) => onLocationChange(e.target.value)} className="form-control">
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>📍 {loc.city} - {loc.name}</option>
          ))}
        </select>

        <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)} className="form-control">
          <option value="">👥 Alle Altersgruppen</option>
          <option value="3-4 Jahre">3-4 Jahre</option>
          <option value="4-5 Jahre">4-5 Jahre</option>
          <option value="6-8 Jahre">6-8 Jahre</option>
          <option value="Erwachsene">Erwachsene</option>
        </select>

        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="form-control">
          <option value="">📊 Alle Level</option>
          <option value="Anfänger">Anfänger</option>
          <option value="Fortgeschritten">Fortgeschritten</option>
          <option value="Alle">Alle</option>
        </select>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : courses.length === 0 ? (
        <p className="text-center">Keine Kurse gefunden</p>
      ) : (
        <div className="courses-grid">
          {courses.map(course => {
            const available = course.maxStudents - course.enrolledCount;
            const availabilityPercentage = (available / course.maxStudents) * 100;
            let availabilityStatus = 'Ausgebucht';
            let statusBadgeClass = 'badge-danger';
            if (availabilityPercentage >= 50) {
              availabilityStatus = 'Frei';
              statusBadgeClass = 'badge-success';
            } else if (availabilityPercentage > 0) {
              availabilityStatus = 'Wenige Plätze';
              statusBadgeClass = 'badge-warning';
            }
            return (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  <h3>{course.typeName}</h3>
                  <span className={`badge ${statusBadgeClass}`}>{availabilityStatus}</span>
                </div>
                <p><strong>👥 Altersgruppe:</strong> {course.ageGroup}</p>
                <p><strong>📊 Level:</strong> {course.level}</p>
                <p><strong>💰 Preis:</strong> €{course.priceBrutto} / Kurs</p>
                <div className="course-availability">
                  <div className="availability-bar">
                    <div
                      className="availability-fill"
                      style={{ width: `${availabilityPercentage}%` }}
                    ></div>
                  </div>
                  <p className="availability-text">{available} / {course.maxStudents} Plätze frei</p>
                </div>
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => onAddToCart(course.id, course.typeName, course.id, course.priceBrutto, availabilityStatus)}
                  disabled={available === 0}
                >
                  {available > 0 ? '🛒 Buchen' : '❌ Ausgebucht'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
