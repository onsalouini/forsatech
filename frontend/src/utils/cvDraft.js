const DRAFT_KEY = 'airCandidateCvDraft'

const emptyDraft = {
	personal: {
		firstName: '',
		lastName: '',
		professionalTitle: '',
		email: '',
		phone: '',
		city: '',
		country: '',
		linkedin: '',
		portfolio: '',
		birthDate: '',
		nationality: '',
		profileImageDataUrl: '',
	},
	content: {
		professionalSummary: '',

		// legacy simple fields
		education: '',
		experience: '',
		skills: '',

		// structured fields
		educationItems: [],
		experienceItems: [],
		languages: [],
		certifications: [],
		projects: [],
		qualities: [],
		interests: [],
	},
	savedAt: '',
}

export function loadCvDraft() {
	try {
		const raw = localStorage.getItem(DRAFT_KEY)
		if (!raw) return { ...emptyDraft }
		const parsed = JSON.parse(raw)
		if (!parsed || typeof parsed !== 'object') return { ...emptyDraft }
		return {
			...emptyDraft,
			...parsed,
			personal: { ...emptyDraft.personal, ...(parsed.personal || {}) },
			content: { ...emptyDraft.content, ...(parsed.content || {}) },
		}
	} catch {
		return { ...emptyDraft }
	}
}

export function saveCvDraft(nextDraft) {
	try {
		const payload = {
			...loadCvDraft(),
			...nextDraft,
			savedAt: new Date().toISOString(),
		}
		localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
		return payload
	} catch {
		return null
	}
}

export function clearCvDraft() {
	try {
		localStorage.removeItem(DRAFT_KEY)
	} catch {
		// ignore
	}
}

export function getCvDraftKey() {
	return DRAFT_KEY
}
