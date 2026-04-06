import { useState, useEffect } from 'react';

export function useCurrentUser() {
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

  const [user, setUser] = useState(readUser);

  useEffect(() => {
    // Fires when localStorage changes in ANOTHER tab
    const onStorage = () => setUser(readUser());
    window.addEventListener('storage', onStorage);

    // Fires when localStorage changes in the SAME tab
    const onLocalChange = () => setUser(readUser());
    window.addEventListener('localStorageChange', onLocalChange);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('localStorageChange', onLocalChange);
    };
  }, []);

  return user;
}