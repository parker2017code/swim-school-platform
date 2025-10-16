// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const apiEndpoints = {
  auth: {
    register: `${API_BASE_URL}/api/auth/register`,
    login: `${API_BASE_URL}/api/auth/login`,
    me: `${API_BASE_URL}/api/auth/me`,
  },
  courses: `${API_BASE_URL}/api/courses`,
  locations: `${API_BASE_URL}/api/locations`,
  schedules: `${API_BASE_URL}/api/schedules`,
  calendarEvents: `${API_BASE_URL}/api/calendar-events`,
  subscriptions: `${API_BASE_URL}/api/subscriptions`,
  admin: {
    dashboard: `${API_BASE_URL}/api/admin/dashboard`,
    subscriptions: `${API_BASE_URL}/api/admin/subscriptions`,
    rosters: (scheduleId: string) => `${API_BASE_URL}/api/admin/rosters/${scheduleId}`,
  },
};
