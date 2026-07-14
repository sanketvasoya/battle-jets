const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/admin';

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error ${res.status}`);
  }
  return res.json();
}

export async function uploadFile(file: File, metadata?: Record<string, string>) {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      formData.append(key, value);
    }
  }
  const res = await fetch(`${API}/assets/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Upload failed ${res.status}`);
  }
  return res.json();
}
