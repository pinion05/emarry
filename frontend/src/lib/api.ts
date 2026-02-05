const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchSummaries() {
  const response = await fetch(`${API_BASE}/api/summaries`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch summaries');
  return response.json();
}

export async function fetchCurrentUser() {
  const response = await fetch(`${API_BASE}/api/user/me`, { credentials: 'include' });
  if (!response.ok) return null;
  return response.json();
}
