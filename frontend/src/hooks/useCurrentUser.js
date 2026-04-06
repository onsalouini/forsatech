export function useCurrentUser() {
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
}