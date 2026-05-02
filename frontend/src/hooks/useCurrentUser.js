import { useState, useEffect, useCallback } from 'react';

const readUser = () => {
  try {
    const recruiterRaw = localStorage.getItem('airRecruiter');
    if (recruiterRaw) {
      const r = JSON.parse(recruiterRaw);
      return {
        role: 'recruiter',
        id: String(r._id || r.id || ''),
        name: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
      };
    }
    const candidateRaw = localStorage.getItem('airCandidate');
    if (candidateRaw) {
      const c = JSON.parse(candidateRaw);
      return {
        role: 'candidate',
        id: String(c._id || c.id || ''),
        name: `${c.firstName || ''} ${c.lastName || ''}`.trim(),
      };
    }
  } catch {
    // corrupted localStorage
  }
  return null;
};

// Stable serialization to compare users without object reference issues
const serializeUser = (u) => u ? `${u.role}:${u.id}:${u.name}` : 'null';

export function useCurrentUser() {
  const [user, setUser] = useState(readUser);
  const [serialized, setSerialized] = useState(() => serializeUser(readUser()));

  useEffect(() => {
    const onStorageChange = () => {
      const newUser = readUser();
      const newSerialized = serializeUser(newUser);
      // Only update state if user actually changed
      setSerialized((prev) => {
        if (prev === newSerialized) return prev;
        setUser(newUser);
        return newSerialized;
      });
    };

    window.addEventListener('storage', onStorageChange);
    window.addEventListener('localStorageChange', onStorageChange);

    return () => {
      window.removeEventListener('storage', onStorageChange);
      window.removeEventListener('localStorageChange', onStorageChange);
    };
  }, []);

  return user;
}