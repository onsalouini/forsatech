import React, { useEffect, useMemo, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

const emptyOfferForm = {
	id: null,
	title: '',
	location: '',
	workMode: 'onsite',
	contractType: '',
	salary: '',
	description: '',
}

const emptyInterviewForm = {
	offerId: '',
	candidateId: '',
	candidateName: '',
	candidateEmail: '',
	scheduledAt: '',
	mode: 'Visio',
	meetingLink: '',
	location: '',
	notes: '',
}

function DashboardRec() {
	const navigate = useNavigate()
	const [calendarMonth, setCalendarMonth] = useState(() => {
		const now = new Date()
		return new Date(now.getFullYear(), now.getMonth(), 1)
	})
	const [selectedView, setSelectedView] = useState('dashboard')
	const [currentTime, setCurrentTime] = useState(new Date())
	const [recruiter, setRecruiter] = useState(null)
	const [offers, setOffers] = useState([])
	const [loadingOffers, setLoadingOffers] = useState(false)
	const [savingOffer, setSavingOffer] = useState(false)
	const [offerMessage, setOfferMessage] = useState('')
	const [offerError, setOfferError] = useState('')
	const [offerForm, setOfferForm] = useState(emptyOfferForm)
	const [companyForm, setCompanyForm] = useState({
		firstName: '',
		lastName: '',
		email: '',
		company: '',
		sector: '',
		country: '',
		companySize: '',
		plan: 'starter',
		registeredAt: '',
		profileImage: '',
	})
	const [companyMessage, setCompanyMessage] = useState('')
	const [companyError, setCompanyError] = useState('')
	const [settingsForm, setSettingsForm] = useState({
		language: 'fr',
		timezone: 'Africa/Tunis',
		dateFormat: 'dd/mm/yyyy',
		notifyNewCandidate: true,
		notifyInterviewReminder: true,
		notifyWeeklyReport: false,
	})
	const [settingsMessage, setSettingsMessage] = useState('')
	const [settingsError, setSettingsError] = useState('')
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	})
	const [passwordMessage, setPasswordMessage] = useState('')
	const [passwordError, setPasswordError] = useState('')
	const [savingPassword, setSavingPassword] = useState(false)
	const [candidacies, setCandidacies] = useState([])
	const [cvByCandidate, setCvByCandidate] = useState({})
	const [cvDetailsOpenByCandidate, setCvDetailsOpenByCandidate] = useState({})
	const [cvExtractionByCandidate, setCvExtractionByCandidate] = useState({})
	const [cvExtractionLoadingByCandidate, setCvExtractionLoadingByCandidate] = useState({})
	const [cvExtractionErrorByCandidate, setCvExtractionErrorByCandidate] = useState({})
	const [loadingCandidacies, setLoadingCandidacies] = useState(false)
	const [candidaciesError, setCandidaciesError] = useState('')
	const [interviews, setInterviews] = useState([])
	const [interviewForm, setInterviewForm] = useState(emptyInterviewForm)
	const [interviewMessage, setInterviewMessage] = useState('')
	const [interviewError, setInterviewError] = useState('')

	useEffect(() => {
		const storedRecruiter = localStorage.getItem('airRecruiter')
		if (!storedRecruiter) {
			navigate('/connexion')
			return
		}

		try {
			setRecruiter(JSON.parse(storedRecruiter))
		} catch (error) {
			localStorage.removeItem('airRecruiter')
			navigate('/connexion')
		}
	}, [navigate])

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(new Date())
		}, 1000)
		return () => clearInterval(interval)
	}, [])

	const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

	const fetchOffers = async (recruiterId) => {
		if (!recruiterId) return
		setLoadingOffers(true)
		setOfferError('')

		try {
			const response = await fetch(`${API_BASE}/offers?recruiterId=${recruiterId}`)
			const data = await response.json()

			if (!response.ok || !data.success) {
				setOfferError(data.message || 'Impossible de charger vos offres.')
				return
			}

			setOffers(data.offers || [])
		} catch (error) {
			setOfferError('Serveur indisponible. Verifiez que le backend tourne.')
		} finally {
			setLoadingOffers(false)
		}
	}

	const fetchRecruiterCandidacies = async (recruiterId) => {
		if (!recruiterId) return
		setLoadingCandidacies(true)
		setCandidaciesError('')

		try {
			const response = await fetch(`${API_BASE}/candidacies/recruiter/${recruiterId}`)
			const data = await response.json()

			if (!response.ok || !data.success) {
				setCandidaciesError(data.message || 'Impossible de charger les candidats.')
				setCandidacies([])
				return
			}

			setCandidacies(data.candidacies || [])
			await fetchCandidateCvs(data.candidacies || [])
		} catch (error) {
			setCandidaciesError('Serveur indisponible. Verifiez que le backend tourne.')
			setCandidacies([])
			setCvByCandidate({})
		} finally {
			setLoadingCandidacies(false)
		}
	}

	const fetchCandidateCvs = async (candidaciesList) => {
		const ids = Array.from(
			new Set(
				(candidaciesList || [])
					.map((c) => {
						const candidateRaw = c?.candidateId
						if (typeof candidateRaw === 'string') return candidateRaw
						return candidateRaw?._id || null
					})
					.filter(Boolean)
			)
		)

		if (ids.length === 0) {
			setCvByCandidate({})
			setCvDetailsOpenByCandidate({})
			setCvExtractionByCandidate({})
			setCvExtractionLoadingByCandidate({})
			setCvExtractionErrorByCandidate({})
			return
		}

		const entries = await Promise.all(
			ids.map(async (candidateId) => {
				try {
					const response = await fetch(`${API_BASE}/cv/by-candidate/${candidateId}`)
					const data = await response.json().catch(() => ({}))
					if (!response.ok || !data?.success || !data?.cv) {
						return [candidateId, { hasCv: false }]
					}

					const publicPath = data.cv?.uploadedFile?.path || ''
					const fullUrl = publicPath ? `${API_ORIGIN}${publicPath}` : ''
					return [
						candidateId,
						{
							hasCv: Boolean(fullUrl),
							url: fullUrl,
							source: data.cv?.source || '',
							fileName: data.cv?.uploadedFile?.originalName || data.cv?.uploadedFile?.fileName || 'CV',
							createdAt: data.cv?.createdAt || '',
							updatedAt: data.cv?.updatedAt || '',
						},
					]
				} catch {
					return [candidateId, { hasCv: false }]
				}
			})
		)

		setCvByCandidate(Object.fromEntries(entries))
		setCvDetailsOpenByCandidate((prev) => {
			const next = {}
			ids.forEach((id) => {
				next[id] = Boolean(prev[id])
			})
			return next
		})
		setCvExtractionByCandidate((prev) => {
			const next = {}
			ids.forEach((id) => {
				if (prev[id]) next[id] = prev[id]
			})
			return next
		})
		setCvExtractionLoadingByCandidate((prev) => {
			const next = {}
			ids.forEach((id) => {
				next[id] = Boolean(prev[id])
			})
			return next
		})
		setCvExtractionErrorByCandidate((prev) => {
			const next = {}
			ids.forEach((id) => {
				if (prev[id]) next[id] = prev[id]
			})
			return next
		})
	}

	const fetchCvExtraction = async (candidateId) => {
		if (!candidateId) return
		if (cvExtractionLoadingByCandidate[candidateId]) return

		setCvExtractionLoadingByCandidate((prev) => ({ ...prev, [candidateId]: true }))
		setCvExtractionErrorByCandidate((prev) => ({ ...prev, [candidateId]: '' }))

		try {
			const response = await fetch(`${API_BASE}/cv/extract/${candidateId}`)
			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				const parts = [data?.message, data?.error, data?.hint].filter(Boolean)
				throw new Error(parts.join(' — ') || 'Impossible d\'analyser le CV.')
			}
			setCvExtractionByCandidate((prev) => ({
				...prev,
				[candidateId]: data?.extraction || null,
			}))
		} catch (error) {
			setCvExtractionErrorByCandidate((prev) => ({
				...prev,
				[candidateId]: error?.message || 'Erreur serveur.',
			}))
		} finally {
			setCvExtractionLoadingByCandidate((prev) => ({ ...prev, [candidateId]: false }))
		}
	}

	useEffect(() => {
		if (recruiter?.id) {
			fetchOffers(recruiter.id)
			fetchRecruiterCandidacies(recruiter.id)
		}
	}, [recruiter])

	useEffect(() => {
		if (!recruiter?.id) return
		const storageKey = `airRecruiterInterviews:${recruiter.id}`
		const saved = localStorage.getItem(storageKey)
		if (!saved) {
			setInterviews([])
			return
		}
		try {
			const parsed = JSON.parse(saved)
			setInterviews(Array.isArray(parsed) ? parsed : [])
		} catch {
			setInterviews([])
		}
	}, [recruiter])

	useEffect(() => {
		if (!recruiter?.id) return
		const storageKey = `airRecruiterInterviews:${recruiter.id}`
		localStorage.setItem(storageKey, JSON.stringify(interviews))
	}, [interviews, recruiter])

	useEffect(() => {
		if (!recruiter) return
		const registrationKey = `airRecruiterRegisteredAt:${recruiter.id || recruiter._id || recruiter.email}`
		const imageKey = `airRecruiterProfileImage:${recruiter.id || recruiter._id || recruiter.email}`

		let registeredAt = recruiter.registeredAt || ''
		const savedRegisteredAt = localStorage.getItem(registrationKey)
		if (!registeredAt && savedRegisteredAt) {
			registeredAt = savedRegisteredAt
		}
		if (!registeredAt) {
			registeredAt = new Date().toISOString()
			localStorage.setItem(registrationKey, registeredAt)
		}

		const savedProfileImage = localStorage.getItem(imageKey) || ''
		const profileImage = recruiter.profileImage || savedProfileImage

		setCompanyForm({
			firstName: recruiter.firstName || '',
			lastName: recruiter.lastName || '',
			email: recruiter.email || '',
			company: recruiter.company || '',
			sector: recruiter.sector || '',
			country: recruiter.country || '',
			companySize: recruiter.companySize || '',
			plan: recruiter.plan || 'starter',
			registeredAt,
			profileImage,
		})

		setSettingsForm((prev) => ({
			...prev,
			language: recruiter.language || prev.language,
			timezone: recruiter.timezone || prev.timezone,
			dateFormat: recruiter.dateFormat || prev.dateFormat,
			notifyNewCandidate:
				typeof recruiter.notifyNewCandidate === 'boolean' ? recruiter.notifyNewCandidate : prev.notifyNewCandidate,
			notifyInterviewReminder:
				typeof recruiter.notifyInterviewReminder === 'boolean'
					? recruiter.notifyInterviewReminder
					: prev.notifyInterviewReminder,
			notifyWeeklyReport:
				typeof recruiter.notifyWeeklyReport === 'boolean' ? recruiter.notifyWeeklyReport : prev.notifyWeeklyReport,
		}))
	}, [recruiter])

	const recruiterInitials = useMemo(() => {
		if (!recruiter) return 'R'
		const f = recruiter.firstName?.[0] || ''
		const l = recruiter.lastName?.[0] || ''
		return `${f}${l}`.toUpperCase() || 'R'
	}, [recruiter])

	const recruiterAvatar = useMemo(() => {
		if (companyForm.profileImage) return companyForm.profileImage
		return ''
	}, [companyForm.profileImage])

	const recruiterFullName = recruiter ? `${recruiter.firstName} ${recruiter.lastName}` : 'Recruteur'

	const stats = useMemo(() => {
		return {
			total: offers.length,
			candidacies: candidacies.length,
		}
	}, [offers, candidacies.length])

	const candidaciesTrend = useMemo(() => {
		const labels = []
		const counts = []
		const now = new Date()
		now.setHours(0, 0, 0, 0)

		for (let i = 6; i >= 0; i -= 1) {
			const day = new Date(now)
			day.setDate(now.getDate() - i)
			const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`

			const count = candidacies.filter((c) => {
				if (!c?.createdAt) return false
				const createdAt = new Date(c.createdAt)
				if (Number.isNaN(createdAt.getTime())) return false
				const createdKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`
				return createdKey === dayKey
			}).length

			labels.push(day.toLocaleDateString('fr-FR', { weekday: 'short' }))
			counts.push(count)
		}

		const maxCount = Math.max(1, ...counts)
		const chartWidth = 640
		const chartHeight = 180
		const points = counts
			.map((count, idx) => {
				const x = (idx / (counts.length - 1)) * chartWidth
				const y = chartHeight - (count / maxCount) * (chartHeight - 20)
				return `${x},${y}`
			})
			.join(' ')

		return {
			labels,
			counts,
			maxCount,
			points,
			chartWidth,
			chartHeight,
		}
	}, [candidacies])

	const candidaciesByOffer = useMemo(() => {
		const groups = new Map()

		for (const candidacy of candidacies) {
			const offerRaw = candidacy?.jobOfferId
			const offerId = typeof offerRaw === 'object' ? offerRaw?._id : offerRaw
			const offerTitle = typeof offerRaw === 'object' ? offerRaw?.title || 'Offre sans titre' : 'Offre'

			if (!offerId) continue

			if (!groups.has(offerId)) {
				groups.set(offerId, {
					offerId,
					offerTitle,
					items: [],
				})
			}

			groups.get(offerId).items.push(candidacy)
		}

		return Array.from(groups.values()).sort((a, b) => b.items.length - a.items.length)
	}, [candidacies])

	const interviewCandidatesForOffer = useMemo(() => {
		if (!interviewForm.offerId) return []

		const uniqueById = new Map()
		for (const candidacy of candidacies) {
			const offerRaw = candidacy?.jobOfferId
			const offerId = typeof offerRaw === 'object' ? offerRaw?._id : offerRaw
			if (offerId !== interviewForm.offerId) continue

			const candidateRaw = candidacy?.candidateId
			const candidateId = typeof candidateRaw === 'string' ? candidateRaw : candidateRaw?._id
			if (!candidateId || uniqueById.has(candidateId)) continue

			const firstName = typeof candidateRaw === 'object' ? candidateRaw?.firstName || '' : ''
			const lastName = typeof candidateRaw === 'object' ? candidateRaw?.lastName || '' : ''
			const fullName = `${firstName} ${lastName}`.trim() || 'Candidat'
			const email = typeof candidateRaw === 'object' ? candidateRaw?.email || '' : ''

			uniqueById.set(candidateId, {
				id: candidateId,
				name: fullName,
				email,
			})
		}

		return Array.from(uniqueById.values()).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
	}, [candidacies, interviewForm.offerId])

	const upcomingInterviews = useMemo(() => {
		return interviews
			.filter((it) => it?.scheduledAt)
			.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
	}, [interviews])

	const interviewStats = useMemo(() => {
		const now = new Date()
		now.setHours(0, 0, 0, 0)
		const weekEnd = new Date(now)
		weekEnd.setDate(now.getDate() + 7)

		let todayCount = 0
		let weekCount = 0

		for (const item of upcomingInterviews) {
			const date = new Date(item.scheduledAt)
			if (Number.isNaN(date.getTime())) continue

			const dayStart = new Date(date)
			dayStart.setHours(0, 0, 0, 0)
			if (dayStart.getTime() === now.getTime()) todayCount += 1
			if (dayStart >= now && dayStart <= weekEnd) weekCount += 1
		}

		return {
			total: upcomingInterviews.length,
			today: todayCount,
			thisWeek: weekCount,
			nextInterview: upcomingInterviews[0] || null,
		}
	}, [upcomingInterviews])

	const interviewDatesByDay = useMemo(() => {
		const map = new Map()
		for (const interview of upcomingInterviews) {
			const date = new Date(interview.scheduledAt)
			if (Number.isNaN(date.getTime())) continue
			const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
			map.set(key, (map.get(key) || 0) + 1)
		}
		return map
	}, [upcomingInterviews])

	const calendarDays = useMemo(() => {
		const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
		const startWeekDay = (firstDay.getDay() + 6) % 7
		const startDate = new Date(firstDay)
		startDate.setDate(firstDay.getDate() - startWeekDay)

		const days = []
		for (let i = 0; i < 42; i += 1) {
			const d = new Date(startDate)
			d.setDate(startDate.getDate() + i)
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
			days.push({
				date: d,
				key,
				isCurrentMonth: d.getMonth() === calendarMonth.getMonth(),
				interviewsCount: interviewDatesByDay.get(key) || 0,
			})
		}

		return days
	}, [calendarMonth, interviewDatesByDay])

	const calendarTitle = useMemo(() => {
		return calendarMonth.toLocaleDateString('fr-FR', {
			month: 'long',
			year: 'numeric',
		})
	}, [calendarMonth])

	const menuGroups = useMemo(
		() => [
			{
				title: 'PRINCIPAL',
				items: [
					{ key: 'dashboard', label: 'Dashboard', count: null },
					{ key: 'offers', label: 'Mes offres', count: stats.total },
					{ key: 'candidates', label: 'Candidats', count: stats.candidacies },
				],
			},
			{
				title: 'OUTILS',
				items: [
					{ key: 'ai', label: 'Recommandations IA', count: null },
					{ key: 'interviews', label: 'Entretiens', count: upcomingInterviews.length },
				],
			},
			{
				title: 'COMPTE',
				items: [
					{ key: 'company', label: 'Entreprise', count: null },
					{ key: 'settings', label: 'Parametres', count: null },
				],
			},
		],
		[stats.total, stats.candidacies, upcomingInterviews.length]
	)

	const updateOfferField = (field, value) => {
		setOfferForm((prev) => ({ ...prev, [field]: value }))
	}

	const resetOfferForm = () => {
		setOfferForm(emptyOfferForm)
	}

	const handleEditOffer = (offer) => {
		setOfferMessage('')
		setOfferError('')
		setSelectedView('offers')
		setOfferForm({
			id: offer._id,
			title: offer.title || '',
			location: offer.location || '',
			workMode: offer.workMode || 'onsite',
			contractType: offer.contractType || '',
			salary: offer.salary || '',
			description: offer.description || '',
		})
	}

	const handleSaveOffer = async (e) => {
		e.preventDefault()
		setOfferMessage('')
		setOfferError('')

		if (!offerForm.title || !offerForm.location || !offerForm.workMode || !offerForm.contractType || !offerForm.description) {
			setOfferError('Titre, localisation, mode, type de contrat et description sont requis.')
			return
		}

		try {
			setSavingOffer(true)

			const payload = {
				recruiterId: recruiter.id,
				title: offerForm.title,
				location: offerForm.location,
				workMode: offerForm.workMode,
				contractType: offerForm.contractType,
				salary: offerForm.salary,
				description: offerForm.description,
			}

			const isEditing = Boolean(offerForm.id)
			const response = await fetch(
				isEditing ? `${API_BASE}/offers/${offerForm.id}` : `${API_BASE}/offers`,
				{
					method: isEditing ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				}
			)

			const data = await response.json()
			if (!response.ok || !data.success) {
				setOfferError(data.message || 'Action impossible sur l offre.')
				return
			}

			if (isEditing) {
				setOffers((prev) => prev.map((offer) => (offer._id === data.offer._id ? data.offer : offer)))
				setOfferMessage('Offre modifiee avec succes.')
			} else {
				setOffers((prev) => [data.offer, ...prev])
				setOfferMessage('Offre publiee avec succes.')
			}

			resetOfferForm()
		} catch (error) {
			setOfferError('Serveur indisponible. Verifiez que le backend tourne.')
		} finally {
			setSavingOffer(false)
		}
	}

	const handleDeleteOffer = async (offerId) => {
		setOfferMessage('')
		setOfferError('')

		try {
			const response = await fetch(`${API_BASE}/offers/${offerId}?recruiterId=${recruiter.id}`, {
				method: 'DELETE',
			})
			const data = await response.json()

			if (!response.ok || !data.success) {
				setOfferError(data.message || 'Suppression impossible.')
				return
			}

			setOffers((prev) => prev.filter((offer) => offer._id !== offerId))
			if (offerForm.id === offerId) {
				resetOfferForm()
			}
			setOfferMessage('Offre supprimee avec succes.')
		} catch (error) {
			setOfferError('Serveur indisponible. Verifiez que le backend tourne.')
		}
	}

	const handlePrefillInterview = (offerId, candidateId, candidateName, candidateEmail) => {
		setSelectedView('interviews')
		setInterviewMessage('')
		setInterviewError('')
		setInterviewForm((prev) => ({
			...prev,
			offerId: offerId || prev.offerId,
			candidateId: candidateId || '',
			candidateName: candidateName || '',
			candidateEmail: candidateEmail || '',
		}))
	}

	const handleInterviewOfferChange = (offerId) => {
		setInterviewForm((prev) => ({
			...prev,
			offerId,
			candidateId: '',
			candidateName: '',
			candidateEmail: '',
		}))
	}

	const handleInterviewCandidateChange = (candidateId) => {
		if (!candidateId) {
			setInterviewForm((prev) => ({
				...prev,
				candidateId: '',
				candidateName: '',
				candidateEmail: '',
			}))
			return
		}

		const selectedCandidate = interviewCandidatesForOffer.find((c) => c.id === candidateId)
		setInterviewForm((prev) => ({
			...prev,
			candidateId,
			candidateName: selectedCandidate?.name || '',
			candidateEmail: selectedCandidate?.email || '',
		}))
	}

	const updateInterviewField = (field, value) => {
		setInterviewForm((prev) => ({ ...prev, [field]: value }))
	}

	const resetInterviewForm = () => {
		setInterviewForm(emptyInterviewForm)
	}

	const handleScheduleInterview = async (e) => {
		e.preventDefault()
		setInterviewError('')
		setInterviewMessage('')

		if (!interviewForm.offerId || !interviewForm.candidateName || !interviewForm.scheduledAt) {
			setInterviewError('Offre, candidat et date/heure sont requis.')
			return
		}

		const selectedOffer = offers.find((offer) => offer._id === interviewForm.offerId)
		const isOnsite = interviewForm.mode === 'Présentiel'
		if (isOnsite && !String(interviewForm.location || '').trim()) {
			setInterviewError("La localisation est requise pour un entretien en présentiel.")
			return
		}
		if (!isOnsite && interviewForm.meetingLink && !/^https?:\/\//i.test(interviewForm.meetingLink.trim())) {
			setInterviewError('Le lien de réunion doit commencer par http(s)://')
			return
		}
		if (!interviewForm.candidateId) {
			setInterviewError("Impossible d'identifier le candidat (candidateId manquant).")
			return
		}
		const newInterview = {
			id: `${Date.now()}`,
			offerId: interviewForm.offerId,
			candidateId: interviewForm.candidateId || '',
			offerTitle: selectedOffer?.title || 'Offre',
			candidateName: interviewForm.candidateName.trim(),
			candidateEmail: interviewForm.candidateEmail.trim(),
			scheduledAt: interviewForm.scheduledAt,
			mode: interviewForm.mode,
			meetingLink: interviewForm.meetingLink.trim(),
			notes: interviewForm.notes.trim(),
			status: 'Planifie',
		}

		try {
			const res = await fetch(`${API_BASE}/interviews`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					candidateId: interviewForm.candidateId,
					recruiterId: recruiter?.id || recruiter?._id,
					jobOfferId: interviewForm.offerId,
					candidateName: interviewForm.candidateName.trim(),
					candidateEmail: interviewForm.candidateEmail.trim(),
					scheduledAt: interviewForm.scheduledAt,
					mode: interviewForm.mode,
					meetingLink: interviewForm.meetingLink.trim(),
					location: interviewForm.location.trim(),
					notes: interviewForm.notes.trim(),
				}),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				setInterviewError(data?.message || "Impossible d'enregistrer l'entretien.")
				return
			}

			const savedInterview = data?.interview
			const savedScheduledAt = savedInterview?.scheduledAt ? new Date(savedInterview.scheduledAt).toISOString() : interviewForm.scheduledAt
			const nextInterview = {
				...newInterview,
				id: savedInterview?._id || newInterview.id,
				scheduledAt: savedScheduledAt,
				mode: savedInterview?.mode || interviewForm.mode,
				meetingLink: savedInterview?.meetingLink || interviewForm.meetingLink.trim(),
				location: savedInterview?.location || interviewForm.location.trim(),
				notes: savedInterview?.notes || interviewForm.notes.trim(),
				status: savedInterview?.status || 'Planifie',
			}

			setInterviews((prev) => [nextInterview, ...prev])
			setInterviewMessage('Entretien planifie avec succes. Le candidat a été notifié.')
			resetInterviewForm()
		} catch (error) {
			setInterviewError('Serveur indisponible. Verifiez que le backend tourne.')
		}
	}

	const handleDeleteInterview = (interviewId) => {
		setInterviewError('')
		setInterviewMessage('')
		setInterviews((prev) => prev.filter((it) => it.id !== interviewId))
	}

	const updateSettingsField = (field, value) => {
		setSettingsForm((prev) => ({ ...prev, [field]: value }))
	}

	const updatePasswordField = (field, value) => {
		setPasswordForm((prev) => ({ ...prev, [field]: value }))
	}

	const handleSaveSettings = async (e) => {
		e.preventDefault()
		setSettingsError('')
		setSettingsMessage('')

		if (!recruiter) {
			setSettingsError('Session recruteur invalide.')
			return
		}

		try {
			const recruiterId = recruiter?.id || recruiter?._id
			if (!recruiterId) {
				setSettingsError('Session recruteur invalide. Reconnectez-vous.')
				return
			}

			const response = await fetch(`${API_BASE}/recruiters/${recruiterId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					language: settingsForm.language,
					timezone: settingsForm.timezone,
					dateFormat: settingsForm.dateFormat,
					notifyNewCandidate: settingsForm.notifyNewCandidate,
					notifyInterviewReminder: settingsForm.notifyInterviewReminder,
					notifyWeeklyReport: settingsForm.notifyWeeklyReport,
				}),
			})

			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				setSettingsError(data?.message || 'Impossible de sauvegarder les preferences.')
				return
			}

			const nextRecruiter = { ...(recruiter || {}), ...(data.recruiter || {}) }
			setRecruiter(nextRecruiter)
			localStorage.setItem('airRecruiter', JSON.stringify(nextRecruiter))
			setSettingsMessage(data?.message || 'Parametres enregistres avec succes.')
		} catch {
			setSettingsError('Serveur indisponible. Verifiez que le backend tourne.')
		}
	}

	const handleChangePassword = async (e) => {
		e.preventDefault()
		setPasswordError('')
		setPasswordMessage('')

		if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
			setPasswordError('Tous les champs mot de passe sont requis.')
			return
		}

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			setPasswordError('La confirmation du nouveau mot de passe ne correspond pas.')
			return
		}

		if (passwordForm.newPassword.length < 8) {
			setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caracteres.')
			return
		}

		try {
			setSavingPassword(true)
			const recruiterId = recruiter?.id || recruiter?._id
			if (!recruiterId) {
				setPasswordError('Session recruteur invalide. Reconnectez-vous.')
				return
			}

			const response = await fetch(`${API_BASE}/recruiters/${recruiterId}/password`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					currentPassword: passwordForm.currentPassword,
					newPassword: passwordForm.newPassword,
				}),
			})

			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				setPasswordError(data?.message || 'Impossible de mettre a jour le mot de passe.')
				return
			}

			setPasswordMessage(data?.message || 'Mot de passe mis a jour avec succes.')
			setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
		} catch {
			setPasswordError('Serveur indisponible. Verifiez que le backend tourne.')
		} finally {
			setSavingPassword(false)
		}
	}

	const updateCompanyField = (field, value) => {
		setCompanyForm((prev) => ({ ...prev, [field]: value }))
	}

	const handleCompanyImageUpload = (event) => {
		const file = event.target.files?.[0]
		if (!file) return
		if (!file.type.startsWith('image/')) {
			setCompanyError('Veuillez selectionner une image valide.')
			return
		}

		const reader = new FileReader()
		reader.onload = () => {
			const result = typeof reader.result === 'string' ? reader.result : ''
			setCompanyForm((prev) => ({ ...prev, profileImage: result }))
			setCompanyError('')
		}
		reader.readAsDataURL(file)
	}

	const handleSaveCompany = async (e) => {
		e.preventDefault()
		setCompanyError('')
		setCompanyMessage('')

		if (!companyForm.firstName || !companyForm.lastName || !companyForm.company || !companyForm.email) {
			setCompanyError('Prenom, nom, email et nom d entreprise sont requis.')
			return
		}

		try {
			const recruiterId = recruiter?.id || recruiter?._id
			if (!recruiterId) {
				setCompanyError('Session recruteur invalide. Reconnectez-vous.')
				return
			}

			const response = await fetch(`${API_BASE}/recruiters/${recruiterId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					firstName: companyForm.firstName.trim(),
					lastName: companyForm.lastName.trim(),
					email: companyForm.email.trim(),
					company: companyForm.company.trim(),
					sector: companyForm.sector.trim(),
					country: companyForm.country.trim(),
					companySize: companyForm.companySize.trim(),
					plan: companyForm.plan,
					profileImage: companyForm.profileImage || '',
				}),
			})

			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				setCompanyError(data?.message || 'Impossible de mettre a jour le profil.')
				return
			}

			const nextRecruiter = { ...(recruiter || {}), ...(data.recruiter || {}) }
			setRecruiter(nextRecruiter)
			localStorage.setItem('airRecruiter', JSON.stringify(nextRecruiter))

			const profileKey = `airRecruiterProfileImage:${nextRecruiter.id || nextRecruiter._id || nextRecruiter.email}`
			if (companyForm.profileImage) {
				localStorage.setItem(profileKey, companyForm.profileImage)
			}

			setCompanyMessage(data?.message || 'Informations entreprise mises a jour avec succes.')
		} catch (error) {
			setCompanyError('Serveur indisponible. Verifiez que le backend tourne.')
		}
	}

	const goToPreviousMonth = () => {
		setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
	}

	const goToNextMonth = () => {
		setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
	}

	const getInterviewModeBadgeClass = (mode) => {
		if (mode === 'Visio') return 'border-cyan-200 bg-cyan-50 text-cyan-700'
		if (mode === 'Presentiel') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
		return 'border-slate-200 bg-slate-50 text-slate-700'
	}

	const handleMenuClick = (itemKey) => {
		if (itemKey === 'dashboard' || itemKey === 'offers' || itemKey === 'interviews' || itemKey === 'candidates' || itemKey === 'company' || itemKey === 'settings') {
			setSelectedView(itemKey)
			setOfferError('')
			setOfferMessage('')
			setInterviewError('')
			setInterviewMessage('')
			setCompanyError('')
			setCompanyMessage('')
			setSettingsError('')
			setSettingsMessage('')
			setPasswordError('')
			setPasswordMessage('')
			if (itemKey === 'candidates' && recruiter?.id) {
				fetchRecruiterCandidacies(recruiter.id)
			}
			return
		}
		setOfferMessage('')
		setOfferError('Cette section sera activee ensuite.')
	}

	const handleLogout = () => {
		localStorage.removeItem('airRecruiter')
		window.dispatchEvent(new Event('localStorageChange'))
		navigate('/connexion')
	}

	if (!recruiter) {
		return null
	}

	return (
		<section className='min-h-screen bg-gradient-to-br from-[#eaf8ff] via-[#f3fbff] to-[#eef4ff]' style={{ fontFamily: "'Jost', sans-serif" }}>
			<div className='mx-auto flex min-h-screen max-w-[1600px]'>
				<aside className='w-[286px] shrink-0 bg-gradient-to-b from-[#051a3d] via-[#072a56] to-[#083d69] px-4 py-6 text-white'>
					<div className='mb-2 flex items-center justify-center px-2'>
						<button
							type='button'
							onClick={() => navigate('/')}
							className='cursor-pointer'
							aria-label='Aller a l accueil'
						>
							<img src={assets.logo} alt='AIR logo' className='h-32 w-auto object-contain' />
						</button>
					</div>

					<div className='rounded-2xl border border-cyan-200/20 bg-white/10 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm'>
						<div className='flex items-center gap-2'>
							{recruiterAvatar ? (
								<img src={recruiterAvatar} alt='Profil recruteur' className='h-12 w-12 rounded-full object-cover ring-2 ring-cyan-300/40' />
							) : (
								<div className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#00d4ff] to-[#1f7bff] text-base font-bold'>
									{recruiterInitials}
								</div>
							)}
							<div className='min-w-0'>
								<p className='truncate text-[19px] leading-5 font-bold text-white'>{recruiterFullName}</p>
								<div className='mt-1 flex items-center gap-2'>
									<span className='text-xs text-cyan-100/90'>Recruteur - {recruiter.company}</span>
									<span className='rounded-full bg-cyan-100 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide text-[#045d7a]'>
										Recruteur
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className='mt-8 space-y-8'>
						{menuGroups.map((group) => (
							<div key={group.title}>
								<h3 className='mb-3 px-2 text-[12px] font-bold tracking-[0.12em] text-cyan-200/60'>{group.title}</h3>
								<ul className='space-y-2'>
									{group.items.map((item) => {
										const isActive = item.key === selectedView
										return (
											<li key={item.key}>
												<button
													type='button'
													onClick={() => handleMenuClick(item.key)}
													className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[16px] font-medium transition-all ${isActive ? 'bg-gradient-to-r from-[#00b8d9] to-[#1d88ff] text-white shadow-[0_8px_20px_rgba(0,184,217,0.35)]' : 'text-[#d2e7ff] hover:bg-white/10 hover:text-white'}`}
												>
													<span>{item.label}</span>
													{typeof item.count === 'number' ? <span className='rounded-full bg-white/15 px-2 py-[2px] text-[12px] font-semibold text-[#e6f5ff]'>{item.count}</span> : null}
												</button>
											</li>
										)
									})}
								</ul>
							</div>
						))}
					</div>

					<div className='mt-12 border-t border-cyan-200/20 pt-6'>
						<button
							type='button'
							onClick={handleLogout}
							className='flex w-full items-center rounded-xl px-3 py-2.5 text-[16px] font-medium text-[#d2e7ff] transition-all hover:bg-white/10 hover:text-white'
						>
							Deconnexion
						</button>
					</div>
				</aside>

				<main className='flex-1 p-6'>
					<div className='h-full rounded-3xl border border-[#cfe7f9] bg-white p-6 shadow-[0_15px_40px_rgba(8,51,93,0.08)]'>
						<div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
							<p style={{ fontFamily: "'Jost', sans-serif" }} className='text-4xl font-black text-[#000000]'>Bienvenue 👋</p>
							<div className='inline-flex items-center gap-2 self-start rounded-2xl border border-cyan-200 bg-cyan-50/60 px-3 py-1.5 text-sm font-semibold text-cyan-900'>
								<span className='relative flex h-2 w-2'>
									<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-500 opacity-75' />
									<span className='relative inline-flex h-2 w-2 rounded-full bg-cyan-600' />
								</span>
								<span>{formattedTime}</span>
							</div>
						</div>
						<p className='mt-2 text-base text-[#36648b]'>
							{recruiter.firstName}, vos offres sont synchronisees entre Dashboard et Mes offres.
						</p>

						{offerError ? <div className='mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{offerError}</div> : null}
						{offerMessage ? <div className='mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>{offerMessage}</div> : null}

						{selectedView === 'dashboard' ? (
							<div className='mt-6 space-y-4'>
								<div className='grid gap-4 md:grid-cols-2'>
									<div className='rounded-2xl border border-blue-100 bg-gradient-to-br from-[#edf4ff] to-[#dfeeff] p-4'>
										<p className='text-sm font-semibold text-[#2b5f9a]'>Offres publiees</p>
										<p className='mt-1 text-3xl font-black text-[#163f73]'>{stats.total}</p>
									</div>
									<div className='rounded-2xl border border-cyan-100 bg-gradient-to-br from-[#f0fbff] to-[#dff7ff] p-4'>
										<p className='text-sm font-semibold text-[#0a6a8f]'>Candidatures recues</p>
										<p className='mt-1 text-3xl font-black text-[#083969]'>{stats.candidacies}</p>
									</div>
								</div>

								<div className='grid gap-4 xl:grid-cols-[1.35fr_1fr]'>
									<div className='rounded-2xl border border-[#d7e9f8] bg-[#fbfdff] p-4'>
										<div className='mb-2'>
											<h2 className='text-lg font-black text-[#0d355b]'>Courbe des candidatures recues</h2>
											<p className='mt-1 text-xs text-[#4f7191]'>Evolution sur les 7 derniers jours.</p>
										</div>

										<div className='overflow-x-auto rounded-xl border border-slate-200 bg-white p-2.5'>
											<svg
												viewBox={`0 0 ${candidaciesTrend.chartWidth} ${candidaciesTrend.chartHeight}`}
												className='h-[185px] w-full min-w-[520px]'
												preserveAspectRatio='none'
											>
												<line x1='0' y1={candidaciesTrend.chartHeight - 1} x2={candidaciesTrend.chartWidth} y2={candidaciesTrend.chartHeight - 1} stroke='#dbe7f3' strokeWidth='1.5' />
												<polyline
													fill='none'
													stroke='#0891b2'
													strokeWidth='3'
													strokeLinecap='round'
													strokeLinejoin='round'
													points={candidaciesTrend.points}
												/>
												{candidaciesTrend.counts.map((count, idx) => {
													const x = (idx / (candidaciesTrend.counts.length - 1)) * candidaciesTrend.chartWidth
													const y = candidaciesTrend.chartHeight - (count / candidaciesTrend.maxCount) * (candidaciesTrend.chartHeight - 20)
													return <circle key={`${candidaciesTrend.labels[idx]}-${idx}`} cx={x} cy={y} r='4.5' fill='#0e7490' />
												})}
											</svg>

											<div className='mt-2 grid grid-cols-7 gap-1.5'>
												{candidaciesTrend.labels.map((label, idx) => (
													<div key={`${label}-${idx}`} className='text-center'>
														<p className='text-[10px] font-semibold uppercase text-[#4f7191]'>{label}</p>
														<p className='text-xs font-bold text-[#0d355b]'>{candidaciesTrend.counts[idx]}</p>
													</div>
												))}
											</div>
										</div>
									</div>

									<div className='rounded-2xl border border-[#d7e9f8] bg-[#fbfdff] p-4'>
										<div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
											<div>
												<h2 className='text-lg font-black text-[#0d355b]'>Calendrier des rendez-vous</h2>
												<p className='mt-1 text-xs text-[#4f7191]'>Dates colorees = rendez-vous.</p>
											</div>
											<div className='flex items-center gap-1.5'>
												<button
													type='button'
													onClick={goToPreviousMonth}
													className='rounded-lg border border-slate-300 px-2.5 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50'
												>
													←
												</button>
												<span className='min-w-[140px] text-center text-xs font-bold text-[#103b62]'>{calendarTitle}</span>
												<button
													type='button'
													onClick={goToNextMonth}
													className='rounded-lg border border-slate-300 px-2.5 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50'
												>
													→
												</button>
											</div>
										</div>

										<div className='grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-[#5a7d9c]'>
											{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
												<div key={d}>{d}</div>
											))}
										</div>

										<div className='mt-1.5 grid grid-cols-7 gap-1'>
											{calendarDays.map((day) => (
												<div
													key={day.key}
												className={`rounded-lg border p-1.5 text-center text-xs ${
													day.interviewsCount > 0
														? 'border-cyan-300 bg-cyan-100 text-[#084f75]'
														: day.isCurrentMonth
															? 'border-slate-200 bg-white text-[#12395f]'
															: 'border-slate-100 bg-slate-50 text-slate-400'
												}`}
												>
													<p className='font-semibold leading-none'>{day.date.getDate()}</p>
													{day.interviewsCount > 0 ? <p className='mt-1 text-[9px] font-bold leading-none'>{day.interviewsCount}</p> : null}
												</div>
											))}
										</div>
									</div>
								</div>

								<div className='rounded-2xl border border-[#d7e9f8] bg-[#fbfdff] p-5'>
									<div className='flex flex-wrap items-center justify-between gap-3'>
										<h2 className='text-xl font-black text-[#0d355b]'>Dernieres offres</h2>
										<button
											type='button'
											onClick={() => setSelectedView('offers')}
											className='rounded-xl border border-[#0a7aa2] px-4 py-2 text-sm font-semibold text-[#0a5f88] transition hover:bg-[#ebfaff]'
										>
											Publier une nouvelle offre
										</button>
									</div>
									{loadingOffers ? <p className='mt-3 text-sm text-[#4f7191]'>Chargement...</p> : null}
									{!loadingOffers && offers.length === 0 ? <p className='mt-3 text-sm text-[#4f7191]'>Aucune offre publiee pour le moment.</p> : null}
									{!loadingOffers && offers.length > 0 ? (
										<div className='mt-3 space-y-3'>
											{offers.slice(0, 4).map((offer) => (
												<div key={offer._id} className='rounded-xl border border-slate-200 bg-white p-3'>
													<div className='flex items-start justify-between gap-3'>
														<div>
															<p className='text-sm font-bold text-[#103b62]'>{offer.title}</p>
															<p className='mt-1 text-xs text-[#587a99]'>
																{offer.location} - {offer.workMode === 'remote' ? 'Remote' : offer.workMode === 'hybrid' ? 'Hybride' : 'Presentiel'} - {offer.contractType}
															</p>
														</div>
														<button
															type='button'
															onClick={() => handleEditOffer(offer)}
															className='rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-[#305b81] hover:bg-slate-50'
														>
															Modifier
														</button>
													</div>
												</div>
											))}
										</div>
									) : null}
								</div>
							</div>
						) : selectedView === 'offers' ? (
							<div className='mt-8 grid gap-6 lg:grid-cols-2'>
								<div className='rounded-2xl border border-[#d7e9f8] bg-[#fbfdff] p-5'>
									<h2 className='text-xl font-black text-[#0d355b]'>{offerForm.id ? 'Modifier une offre' : 'Publier une offre'}</h2>
									<p className='mt-1 text-sm text-[#4f7191]'>
										Titre, localisation, remote/presentiel/hybride, salaire optionnel et description.
									</p>

									<form className='mt-4 space-y-3' onSubmit={handleSaveOffer}>
										<input
											className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500'
											placeholder='Titre du poste'
											value={offerForm.title}
											onChange={(e) => updateOfferField('title', e.target.value)}
										/>
										<input
											className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500'
											placeholder='Localisation (ville/pays)'
											value={offerForm.location}
											onChange={(e) => updateOfferField('location', e.target.value)}
										/>
										<div className='grid gap-3 sm:grid-cols-2'>
											<select
												className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500'
												value={offerForm.workMode}
												onChange={(e) => updateOfferField('workMode', e.target.value)}
											>
												<option value='onsite'>Presentiel</option>
												<option value='remote'>Remote</option>
												<option value='hybrid'>Hybride</option>
											</select>
											<input
												className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500'
												placeholder='Type de contrat'
												value={offerForm.contractType}
												onChange={(e) => updateOfferField('contractType', e.target.value)}
											/>
										</div>
										<input
											className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500'
											placeholder='Salaire (optionnel)'
											value={offerForm.salary}
											onChange={(e) => updateOfferField('salary', e.target.value)}
										/>
										<textarea
											className='min-h-[130px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500'
											placeholder='Description du poste'
											value={offerForm.description}
											onChange={(e) => updateOfferField('description', e.target.value)}
										/>

										<div className='flex gap-2'>
											<button
												type='submit'
												disabled={savingOffer}
												className='rounded-xl bg-gradient-to-r from-[#0a4a72] to-[#0a7aa2] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'
											>
												{savingOffer ? 'Enregistrement...' : offerForm.id ? 'Enregistrer la modification' : 'Publier l offre'}
											</button>
											{offerForm.id ? (
												<button
													type='button'
													onClick={resetOfferForm}
													className='rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50'
												>
													Annuler
												</button>
											) : null}
										</div>
									</form>
								</div>

								<div className='rounded-2xl border border-[#d7e9f8] bg-[#fbfdff] p-5'>
									<h2 className='text-xl font-black text-[#0d355b]'>Offres publiees</h2>
									<p className='mt-1 text-sm text-[#4f7191]'>Vous pouvez voir, modifier et supprimer vos offres.</p>

									{loadingOffers ? <p className='mt-4 text-sm text-[#4f7191]'>Chargement des offres...</p> : null}
									{!loadingOffers && offers.length === 0 ? (
										<p className='mt-4 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-[#4f7191]'>Aucune offre pour le moment.</p>
									) : null}

									{!loadingOffers && offers.length > 0 ? (
										<div className='mt-4 space-y-3'>
											{offers.map((offer) => (
												<div key={offer._id} className='rounded-xl border border-slate-200 bg-white p-3'>
													<div className='flex items-start justify-between gap-3'>
														<div>
															<p className='text-sm font-bold text-[#103b62]'>{offer.title}</p>
															<p className='mt-1 text-xs text-[#587a99]'>
																{offer.location} - {offer.workMode === 'remote' ? 'Remote' : offer.workMode === 'hybrid' ? 'Hybride' : 'Presentiel'} - {offer.contractType}
																{offer.salary ? ` - ${offer.salary}` : ''}
															</p>
														</div>
														<span className='rounded-full bg-cyan-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0a6a8f]'>Publiee</span>
													</div>
													<p className='mt-2 text-xs text-[#456786]'>{offer.description}</p>
													<div className='mt-3 flex gap-2'>
														<button
															type='button'
															onClick={() => handleEditOffer(offer)}
															className='rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50'
														>
															Modifier
														</button>
														<button
															type='button'
															onClick={() => handleDeleteOffer(offer._id)}
															className='rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100'
														>
															Supprimer
														</button>
													</div>
												</div>
											))}
										</div>
									) : null}
								</div>
							</div>
						) : selectedView === 'candidates' ? (
							<div className='mt-8 rounded-2xl border border-[#d7e9f8] bg-[#fbfdff] p-5'>
								<div className='flex flex-wrap items-center justify-between gap-3'>
									<div>
										<h2 className='text-xl font-black text-[#0d355b]'>Candidats par offre</h2>
										<p className='mt-1 text-sm text-[#4f7191]'>Retrouvez les candidats qui ont postule a vos offres.</p>
									</div>
									<button
										type='button'
										onClick={() => recruiter?.id && fetchRecruiterCandidacies(recruiter.id)}
										className='rounded-xl border border-[#0a7aa2] px-4 py-2 text-sm font-semibold text-[#0a5f88] transition hover:bg-[#ebfaff]'
									>
										Rafraichir
									</button>
								</div>

								{candidaciesError ? <div className='mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{candidaciesError}</div> : null}

								{loadingCandidacies ? <p className='mt-4 text-sm text-[#4f7191]'>Chargement des candidatures...</p> : null}

								{!loadingCandidacies && candidaciesByOffer.length === 0 ? (
									<p className='mt-4 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-[#4f7191]'>Aucune candidature recue pour le moment.</p>
								) : null}

								{!loadingCandidacies && candidaciesByOffer.length > 0 ? (
									<div className='mt-5 space-y-4'>
										{candidaciesByOffer.map((group) => (
											<div key={group.offerId} className='rounded-xl border border-slate-200 bg-white p-4'>
												<div className='mb-3 flex items-center justify-between gap-2'>
													<h3 className='text-base font-black text-[#103b62]'>{group.offerTitle}</h3>
													<span className='rounded-full bg-cyan-100 px-2 py-1 text-[11px] font-semibold text-[#0a6a8f]'>
														{group.items.length} candidature{group.items.length > 1 ? 's' : ''}
													</span>
												</div>
												<div className='space-y-2'>
													{group.items.map((candidacy) => {
														const cand = candidacy?.candidateId || {}
														const candidateId = typeof candidacy?.candidateId === 'string' ? candidacy?.candidateId : candidacy?.candidateId?._id
														const cvInfo = candidateId ? cvByCandidate[candidateId] : null
														const fullName = `${cand.firstName || ''} ${cand.lastName || ''}`.trim() || 'Candidat'
														const appliedAt = candidacy?.createdAt ? new Date(candidacy.createdAt).toLocaleDateString() : 'N/A'
														return (
															<div key={candidacy._id} className='rounded-lg border border-slate-200 bg-[#fbfdff] p-3'>
																<div className='flex flex-wrap items-start justify-between gap-2'>
																	<p className='text-sm font-bold text-[#103b62]'>{fullName}</p>
																	<button
																		type='button'
																		onClick={() => handlePrefillInterview(group.offerId, candidateId, fullName, cand.email || '')}
																		className='rounded-md border border-[#0a7aa2] bg-white px-2 py-1 text-xs font-semibold text-[#0a5f88] transition hover:bg-[#ebfaff]'
																	>
																		Donner rendez-vous
																	</button>
																</div>
																<p className='mt-1 text-xs text-[#587a99]'>
																	{cand.email || 'Email non renseigne'}
																	{cand.professionalTitle ? ` - ${cand.professionalTitle}` : ''}
																</p>
																<p className='mt-1 text-xs text-[#587a99]'>
																	Secteur: {cand.sector || 'N/A'} - Niveau: {cand.experienceLevel || 'N/A'} - Postule le: {appliedAt}
																</p>
																{cvInfo?.hasCv ? (
																	<div className='mt-2 flex items-center gap-2'>
																		<a
																			href={cvInfo.url}
																			target='_blank'
																			rel='noreferrer'
																			className='rounded-md border border-cyan-300 bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-100'
																		>
																			Voir CV
																		</a>
																		<button
																			type='button'
																			onClick={() => {
																				const isOpen = Boolean(cvDetailsOpenByCandidate[candidateId])
																				const nextOpen = !isOpen
																				setCvDetailsOpenByCandidate((prev) => ({ ...prev, [candidateId]: nextOpen }))
																				if (nextOpen && !cvExtractionByCandidate[candidateId]) {
																					fetchCvExtraction(candidateId)
																				}
																			}}
																			className='rounded-md border border-cyan-300 bg-white px-2 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-50'
																		>
																			Details CV
																		</button>
																		<span className='text-xs text-[#587a99]'>
																			{cvInfo.source === 'generated' ? 'CV Genere' : 'CV Uploade'}
																		</span>
																	</div>
																) : (
																	<p className='mt-2 text-xs text-[#8aa3b9]'>CV non disponible</p>
																)}
																{cvInfo?.hasCv && cvDetailsOpenByCandidate[candidateId] ? (
																	<div className='mt-2 rounded-md border border-cyan-100 bg-cyan-50/50 p-2 text-xs text-[#2c5f84]'>
																		<p><span className='font-semibold'>Nom du fichier:</span> {cvInfo.fileName || 'CV'}</p>
																		<p><span className='font-semibold'>Type:</span> {cvInfo.source === 'generated' ? 'CV Genere' : 'CV Uploade'}</p>
																		<p><span className='font-semibold'>Cree le:</span> {cvInfo.createdAt ? new Date(cvInfo.createdAt).toLocaleDateString() : 'N/A'}</p>
																		<p><span className='font-semibold'>Mis a jour le:</span> {cvInfo.updatedAt ? new Date(cvInfo.updatedAt).toLocaleDateString() : 'N/A'}</p>
																		<div className='mt-2 rounded-md border border-cyan-100 bg-white p-2'>
																			<p className='text-xs font-semibold text-[#103b62]'>Extraction (modèle)</p>
																			{cvExtractionLoadingByCandidate[candidateId] ? (
																				<p className='mt-1 text-xs text-[#587a99]'>Analyse en cours...</p>
																			) : cvExtractionErrorByCandidate[candidateId] ? (
																				<p className='mt-1 text-xs text-red-700'>{cvExtractionErrorByCandidate[candidateId]}</p>
																			) : cvExtractionByCandidate[candidateId]?.entities ? (
																				<div className='mt-2 space-y-1'>
																					{cvExtractionByCandidate[candidateId]?.translation ? (
																						<p className='text-[11px] text-[#587a99]'>Traduction: {String(cvExtractionByCandidate[candidateId].translation)}</p>
																					) : null}
																					{Object.entries(cvExtractionByCandidate[candidateId].entities).map(([label, values]) => (
																						<div key={label} className='text-xs'>
																							<p className='font-semibold text-[#103b62]'>{label}</p>
																							<p className='text-[#2c5f84]'>{Array.isArray(values) ? values.join(' | ') : String(values || '')}</p>
																						</div>
																					))}
																				</div>
																			) : (
																				<p className='mt-1 text-xs text-[#587a99]'>Cliquez sur Detail CV pour lancer l\'analyse.</p>
																			)}
																		</div>
																	</div>
																) : (
																	null
																)}
															</div>
														)
													})}
												</div>
											</div>
										))}
									</div>
								) : null}
							</div>
						) : selectedView === 'interviews' ? (
							<div className='mt-6 space-y-4'>
								<div className='grid gap-4 sm:grid-cols-3'>
									<div className='rounded-2xl border border-[#d7e9f8] bg-gradient-to-br from-[#eef8ff] to-[#e2f3ff] p-4'>
										<p className='text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Total</p>
										<p className='mt-1 text-3xl font-black text-[#0d355b]'>{interviewStats.total}</p>
									</div>
									<div className='rounded-2xl border border-[#d7e9f8] bg-gradient-to-br from-[#f2fbf7] to-[#e6f8ef] p-4'>
										<p className='text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Aujourd hui</p>
										<p className='mt-1 text-3xl font-black text-[#0d355b]'>{interviewStats.today}</p>
									</div>
									<div className='rounded-2xl border border-[#d7e9f8] bg-gradient-to-br from-[#fff8ef] to-[#fff2df] p-4'>
										<p className='text-xs font-bold uppercase tracking-wide text-[#4f7191]'>7 jours</p>
										<p className='mt-1 text-3xl font-black text-[#0d355b]'>{interviewStats.thisWeek}</p>
									</div>
								</div>

								<div className='grid gap-5 xl:grid-cols-[1.05fr_1.25fr]'>
									<div className='rounded-2xl border border-[#d7e9f8] bg-[#fbfdff] p-5'>
										<h2 className='text-xl font-black text-[#0d355b]'>Planifier un entretien</h2>
										<p className='mt-1 text-sm text-[#4f7191]'>Créez un rendez-vous clair pour le candidat et l équipe.</p>

										{interviewError ? <div className='mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{interviewError}</div> : null}
										{interviewMessage ? <div className='mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>{interviewMessage}</div> : null}

										<form className='mt-4 space-y-3' onSubmit={handleScheduleInterview}>
											<div>
												<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Offre</label>
												<select
													className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500'
													value={interviewForm.offerId}
														onChange={(e) => handleInterviewOfferChange(e.target.value)}
												>
													<option value=''>Selectionner une offre</option>
													{offers.map((offer) => (
														<option key={offer._id} value={offer._id}>
															{offer.title}
														</option>
													))}
												</select>
											</div>

											<div className='grid gap-3 sm:grid-cols-2'>
												<div>
														<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Candidat</label>
														<select
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500'
															value={interviewForm.candidateId}
															onChange={(e) => handleInterviewCandidateChange(e.target.value)}
															disabled={!interviewForm.offerId}
														>
															<option value=''>
																{!interviewForm.offerId ? 'Choisir une offre d abord' : 'Selectionner un candidat'}
															</option>
															{interviewCandidatesForOffer.map((candidate) => (
																<option key={candidate.id} value={candidate.id}>
																	{candidate.name}
																</option>
															))}
														</select>
														{interviewForm.offerId && interviewCandidatesForOffer.length === 0 ? (
															<p className='mt-1 text-xs text-[#587a99]'>Aucun candidat n a encore postule a cette offre.</p>
														) : null}
														<input
															type='hidden'
															value={interviewForm.candidateName}
															readOnly
													/>
												</div>
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Email (optionnel)</label>
													<input
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500'
														placeholder='nom@exemple.com'
														value={interviewForm.candidateEmail}
														onChange={(e) => updateInterviewField('candidateEmail', e.target.value)}
													/>
												</div>
											</div>

											<div className='grid gap-3 sm:grid-cols-2'>
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Date et heure</label>
													<input
														type='datetime-local'
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500'
														value={interviewForm.scheduledAt}
														onChange={(e) => updateInterviewField('scheduledAt', e.target.value)}
													/>
												</div>
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Mode</label>
													<select
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500'
														value={interviewForm.mode}
														onChange={(e) => updateInterviewField('mode', e.target.value)}
													>
														<option value='Visio'>Visio</option>
														<option value='Présentiel'>Présentiel</option>
													</select>
												</div>
											</div>

											<div>
												<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Lien reunion {interviewForm.mode === 'Visio' ? '(recommande)' : '(optionnel)'}</label>
												<input
													className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500'
													placeholder='https://meet...'
													value={interviewForm.meetingLink}
													onChange={(e) => updateInterviewField('meetingLink', e.target.value)}
												/>
											</div>

											{interviewForm.mode === 'Présentiel' ? (
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Localisation (obligatoire)</label>
													<input
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500'
														placeholder='Adresse / ville / bureau...'
														value={interviewForm.location}
														onChange={(e) => updateInterviewField('location', e.target.value)}
													/>
												</div>
											) : null}

											<div>
												<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Notes</label>
												<textarea
													className='min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500'
													placeholder='Points a evaluer, panel, consignes...'
													value={interviewForm.notes}
													onChange={(e) => updateInterviewField('notes', e.target.value)}
												/>
											</div>

											<div className='flex gap-2 pt-1'>
												<button
													type='submit'
													className='rounded-xl bg-gradient-to-r from-[#0a4a72] to-[#0a7aa2] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110'
												>
													Planifier
												</button>
												<button
													type='button'
													onClick={resetInterviewForm}
													className='rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50'
												>
													Vider
												</button>
											</div>
										</form>
									</div>

									<div className='rounded-2xl border border-[#d7e9f8] bg-[#fbfdff] p-5'>
										<div className='mb-4 flex items-center justify-between gap-3'>
											<div>
												<h2 className='text-xl font-black text-[#0d355b]'>Entretiens planifies</h2>
												<p className='mt-1 text-sm text-[#4f7191]'>Suivi de vos prochains rendez-vous candidats.</p>
											</div>
											{interviewStats.nextInterview ? (
												<span className='rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700'>
													Prochain: {new Date(interviewStats.nextInterview.scheduledAt).toLocaleDateString('fr-FR')}
												</span>
											) : null}
										</div>

										{upcomingInterviews.length === 0 ? (
											<p className='rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-[#4f7191]'>Aucun entretien planifie.</p>
										) : (
											<div className='space-y-3'>
												{upcomingInterviews.map((it) => (
													<div key={it.id} className='rounded-xl border border-slate-200 bg-white p-3'>
														<div className='flex flex-wrap items-start justify-between gap-3'>
															<div>
																<div className='flex flex-wrap items-center gap-2'>
																	<p className='text-sm font-bold text-[#103b62]'>{it.candidateName}</p>
																	<span className={`rounded-full border px-2 py-[2px] text-[10px] font-bold ${getInterviewModeBadgeClass(it.mode)}`}>{it.mode}</span>
																</div>
																<p className='mt-1 text-xs text-[#587a99]'>
																	{it.offerTitle}
																</p>
																<p className='mt-1 text-xs font-semibold text-[#0a5f88]'>
																	{new Date(it.scheduledAt).toLocaleString()}
																</p>
																{it.candidateEmail ? <p className='mt-1 text-xs text-[#587a99]'>{it.candidateEmail}</p> : null}
																{it.meetingLink ? <p className='mt-1 truncate text-xs text-[#0a5f88]'>Lien: {it.meetingLink}</p> : null}
																{it.notes ? <p className='mt-2 rounded-lg bg-slate-50 px-2 py-1 text-xs text-[#456786]'>{it.notes}</p> : null}
															</div>
															<button
																type='button'
																onClick={() => handleDeleteInterview(it.id)}
																className='rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100'
															>
																Supprimer
															</button>
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							</div>
						) : selectedView === 'company' ? (
							<div className='mt-6 rounded-2xl border border-[#d7e9f8] bg-[#fbfdff] p-5'>
								<div className='mb-5 flex flex-wrap items-center justify-between gap-3'>
									<div>
										<h2 className='text-2xl font-black text-[#0d355b]'>Compte entreprise</h2>
										<p className='mt-1 text-sm text-[#4f7191]'>Gerez votre profil recruteur et les informations de votre entreprise.</p>
									</div>
									<span className='rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0a6284]'>
										{companyForm.plan === 'pro' ? 'Plan Pro' : 'Plan Starter'}
									</span>
								</div>

								{companyError ? <div className='mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>{companyError}</div> : null}
								{companyMessage ? <div className='mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>{companyMessage}</div> : null}

								<form onSubmit={handleSaveCompany} className='grid gap-5 xl:grid-cols-[320px_1fr]'>
									<div className='rounded-2xl border border-slate-200 bg-white p-4'>
										<div className='flex flex-col items-center'>
											{companyForm.profileImage ? (
												<img src={companyForm.profileImage} alt='Photo profil' className='h-28 w-28 rounded-full object-cover ring-4 ring-cyan-100' />
											) : (
												<div className='flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#00d4ff] to-[#1f7bff] text-3xl font-black text-white'>
													{recruiterInitials}
												</div>
											)}
											<p className='mt-3 text-center text-base font-bold text-[#0d355b]'>
												{companyForm.firstName || 'Prenom'} {companyForm.lastName || 'Nom'}
											</p>
											<p className='text-center text-xs text-[#587a99]'>{companyForm.company || 'Entreprise'}</p>

											<label className='mt-4 w-full cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-[#0a5f88] hover:bg-slate-50'>
												Changer la photo
												<input type='file' accept='image/*' className='hidden' onChange={handleCompanyImageUpload} />
											</label>

											<div className='mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#456786]'>
												<p><span className='font-semibold'>Inscrit le:</span> {companyForm.registeredAt ? new Date(companyForm.registeredAt).toLocaleDateString('fr-FR') : 'N/A'}</p>
												<p className='mt-1'><span className='font-semibold'>Email:</span> {companyForm.email || 'N/A'}</p>
											</div>
										</div>
									</div>

									<div className='rounded-2xl border border-slate-200 bg-white p-4'>
										<div className='grid gap-4 sm:grid-cols-2'>
											<div>
												<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Prenom</label>
												<input className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500' value={companyForm.firstName} onChange={(e) => updateCompanyField('firstName', e.target.value)} />
											</div>
											<div>
												<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Nom</label>
												<input className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500' value={companyForm.lastName} onChange={(e) => updateCompanyField('lastName', e.target.value)} />
											</div>
											<div>
												<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Email</label>
												<input className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500' value={companyForm.email} onChange={(e) => updateCompanyField('email', e.target.value)} />
											</div>
											<div>
												<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Nom de l entreprise</label>
												<input className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500' value={companyForm.company} onChange={(e) => updateCompanyField('company', e.target.value)} />
											</div>
											<div>
												<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Secteur</label>
												<input className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500' value={companyForm.sector} onChange={(e) => updateCompanyField('sector', e.target.value)} />
											</div>
											<div>
												<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Pays</label>
												<input className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500' value={companyForm.country} onChange={(e) => updateCompanyField('country', e.target.value)} />
											</div>
											<div>
												<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Taille entreprise</label>
												<input className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500' value={companyForm.companySize} onChange={(e) => updateCompanyField('companySize', e.target.value)} />
											</div>
											<div>
												<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Plan</label>
												<select className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500' value={companyForm.plan} onChange={(e) => updateCompanyField('plan', e.target.value)}>
													<option value='starter'>Starter</option>
													<option value='pro'>Pro</option>
												</select>
											</div>
										</div>

										<div className='mt-5 flex justify-end'>
											<button type='submit' className='rounded-xl bg-gradient-to-r from-[#0a4a72] to-[#0a7aa2] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110'>
												Enregistrer les modifications
											</button>
										</div>
									</div>
								</form>
							</div>
						) : selectedView === 'settings' ? (
							<div className='mt-6 grid gap-5 xl:grid-cols-2'>
								<div className='rounded-2xl border border-[#d7e9f8] bg-[#fbfdff] p-5'>
									<h2 className='text-xl font-black text-[#0d355b]'>Preferences</h2>
									<p className='mt-1 text-sm text-[#4f7191]'>Langue, fuseau horaire et format de date.</p>

									{settingsError ? <div className='mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{settingsError}</div> : null}
									{settingsMessage ? <div className='mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>{settingsMessage}</div> : null}

									<form className='mt-4 space-y-3' onSubmit={handleSaveSettings}>
										<div>
											<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Langue</label>
											<select className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500' value={settingsForm.language} onChange={(e) => updateSettingsField('language', e.target.value)}>
												<option value='fr'>Francais</option>
												<option value='en'>English</option>
											</select>
										</div>
										<div>
											<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Fuseau horaire</label>
											<select className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500' value={settingsForm.timezone} onChange={(e) => updateSettingsField('timezone', e.target.value)}>
												<option value='Africa/Tunis'>Africa/Tunis</option>
												<option value='Europe/Paris'>Europe/Paris</option>
												<option value='UTC'>UTC</option>
											</select>
										</div>
										<div>
											<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Format de date</label>
											<select className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500' value={settingsForm.dateFormat} onChange={(e) => updateSettingsField('dateFormat', e.target.value)}>
												<option value='dd/mm/yyyy'>dd/mm/yyyy</option>
												<option value='mm/dd/yyyy'>mm/dd/yyyy</option>
												<option value='yyyy-mm-dd'>yyyy-mm-dd</option>
											</select>
										</div>

										<div className='space-y-2 rounded-xl border border-slate-200 bg-white p-3'>
											<label className='flex items-center justify-between gap-3 text-sm text-[#365e80]'>
												<span>Notifier les nouvelles candidatures</span>
												<input type='checkbox' checked={settingsForm.notifyNewCandidate} onChange={(e) => updateSettingsField('notifyNewCandidate', e.target.checked)} />
											</label>
											<label className='flex items-center justify-between gap-3 text-sm text-[#365e80]'>
												<span>Rappels d entretien</span>
												<input type='checkbox' checked={settingsForm.notifyInterviewReminder} onChange={(e) => updateSettingsField('notifyInterviewReminder', e.target.checked)} />
											</label>
											<label className='flex items-center justify-between gap-3 text-sm text-[#365e80]'>
												<span>Rapport hebdomadaire</span>
												<input type='checkbox' checked={settingsForm.notifyWeeklyReport} onChange={(e) => updateSettingsField('notifyWeeklyReport', e.target.checked)} />
											</label>
										</div>

										<div className='pt-1'>
											<button type='submit' className='rounded-xl bg-gradient-to-r from-[#0a4a72] to-[#0a7aa2] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110'>
												Enregistrer les preferences
											</button>
										</div>
									</form>
								</div>

								<div className='rounded-2xl border border-[#d7e9f8] bg-[#fbfdff] p-5'>
									<h2 className='text-xl font-black text-[#0d355b]'>Securite</h2>
									<p className='mt-1 text-sm text-[#4f7191]'>Modifier votre mot de passe recruteur.</p>

									{passwordError ? <div className='mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{passwordError}</div> : null}
									{passwordMessage ? <div className='mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>{passwordMessage}</div> : null}

									<form className='mt-4 space-y-3' onSubmit={handleChangePassword}>
										<input
											type='password'
											className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500'
											placeholder='Mot de passe actuel'
											value={passwordForm.currentPassword}
											onChange={(e) => updatePasswordField('currentPassword', e.target.value)}
										/>
										<input
											type='password'
											className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500'
											placeholder='Nouveau mot de passe'
											value={passwordForm.newPassword}
											onChange={(e) => updatePasswordField('newPassword', e.target.value)}
										/>
										<input
											type='password'
											className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500'
											placeholder='Confirmer le nouveau mot de passe'
											value={passwordForm.confirmPassword}
											onChange={(e) => updatePasswordField('confirmPassword', e.target.value)}
										/>

										<div className='pt-1'>
											<button type='submit' disabled={savingPassword} className='rounded-xl bg-gradient-to-r from-[#0a4a72] to-[#0a7aa2] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'>
												{savingPassword ? 'Mise a jour...' : 'Changer le mot de passe'}
											</button>
										</div>
									</form>
								</div>
							</div>
						) : (
							<div className='mt-8 rounded-2xl border border-[#d7e9f8] bg-[#fbfdff] p-5'>
								<p className='text-sm text-[#4f7191]'>Cette section sera activee ensuite.</p>
							</div>
						)}
					</div>
				</main>
			</div>
		</section>
	)
}

export default DashboardRec
