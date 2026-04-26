/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { saveCvDraft } from '../utils/cvDraft'
import { parseSalaryRange, extractMaxExperienceYears, normalizeSuggestionsPayload } from './dashboardCand/helpers'
import { useCandidateNotifications } from './dashboardCand/useCandidateNotifications'
import { useCandidateSettings } from './dashboardCand/useCandidateSettings'
import {
	DashboardCandOffresView,
	DashboardCandCvView,
	DashboardCandSuggestionsView,
	DashboardCandNotificationsView,
	DashboardCandSettingsView,
	DashboardCandAnalyticsView,
	DashboardCandOfferHelpView,
	DashboardCandAssistantView,
	DashboardCandCandidaturesView,
	DashboardCandInterviewsView,
	DashboardCandQuizModal,
} from './dashboardCand/index'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

function DashboardCand() {
	const navigate = useNavigate()
	const [candidate, setCandidate] = useState(null)
	const [selectedView, setSelectedView] = useState('offres')
	const [isDarkMode, setIsDarkMode] = useState(() => {
		try {
			return localStorage.getItem('airCandidateTheme') === 'dark'
		} catch {
			return false
		}
	})
	const [candidateSessionId, setCandidateSessionId] = useState(() => {
		try {
			return localStorage.getItem('airCandidateSessionId') || ''
		} catch {
			return ''
		}
	})
	const candidateSessionIdRef = useRef(candidateSessionId)
	
	useEffect(() => {
		candidateSessionIdRef.current = candidateSessionId
	}, [candidateSessionId])

	const [dashboardStats, setDashboardStats] = useState(null)
	const [dashboardLoading, setDashboardLoading] = useState(false)
	const [dashboardError, setDashboardError] = useState('')
	const [interviewCalendarMonth, setInterviewCalendarMonth] = useState(() => {
		const now = new Date()
		return new Date(now.getFullYear(), now.getMonth(), 1)
	})
	const [selectedJobId, setSelectedJobId] = useState(null)
	const [savedJobs, setSavedJobs] = useState(() => new Set())
	const [searchQuery, setSearchQuery] = useState('')
	const [salaryMin, setSalaryMin] = useState('')
	const [salaryMax, setSalaryMax] = useState('')
	const [experienceMinYears, setExperienceMinYears] = useState('')
	const [sortPreference, setSortPreference] = useState('relevance')
	const [currentTime, setCurrentTime] = useState(new Date())
	const [jobs, setJobs] = useState([])
	const [candidacies, setCandidacies] = useState([])
	const [candidateInterviews, setCandidateInterviews] = useState([])
	const [candidateInterviewReports, setCandidateInterviewReports] = useState([])
	const [candidateInterviewsLoading, setCandidateInterviewsLoading] = useState(false)
	const [candidateInterviewsError, setCandidateInterviewsError] = useState('')
	const [loading, setLoading] = useState(true)
	const [loadError, setLoadError] = useState('')
	const [cvMatchLoading, setCvMatchLoading] = useState(false)
	const [cvMatchError, setCvMatchError] = useState('')
	const cvMatchSignatureRef = useRef('')
	const [isApplying, setIsApplying] = useState(false)
	const [applyStatus, setApplyStatus] = useState(null)
	const [quizOpen, setQuizOpen] = useState(false)
	const [quizLoading, setQuizLoading] = useState(false)
	const [quizSubmitting, setQuizSubmitting] = useState(false)
	const [quizError, setQuizError] = useState('')
	const [quizToken, setQuizToken] = useState('')
	const [quizQuestions, setQuizQuestions] = useState([])
	const [quizAnswers, setQuizAnswers] = useState({})
	const [quizMeta, setQuizMeta] = useState(null)
	const [quizSecondsLeft, setQuizSecondsLeft] = useState(0)
	const quizTimedOutRef = useRef(false)
	const [quizMode, setQuizMode] = useState('standard')
	const [cvLoading, setCvLoading] = useState(false)
	const [cvError, setCvError] = useState('')
	const [cvUrl, setCvUrl] = useState('')
	const [cvSource, setCvSource] = useState('')
	const [cvHistory, setCvHistory] = useState([])
	const [cvHistoryLoading, setCvHistoryLoading] = useState(false)
	const [cvHistoryError, setCvHistoryError] = useState('')
	const [activeCvId, setActiveCvId] = useState('')
	const [selectedCvId, setSelectedCvId] = useState('')
	const [suggestionsLoading, setSuggestionsLoading] = useState(false)
	const [suggestionsError, setSuggestionsError] = useState('')
	const [suggestionsHint, setSuggestionsHint] = useState('')
	const [suggestionsData, setSuggestionsData] = useState(null)

	const [cvExtraction, setCvExtraction] = useState(null)
	const [cvExtractionLoading, setCvExtractionLoading] = useState(false)

	const [assistantChatId, setAssistantChatId] = useState(null)
	const [assistantMessages, setAssistantMessages] = useState(() => [
		{ role: 'assistant', content: "Bonjour, je suis l’Assistant IA d’A.I.R. Pose-moi tes questions sur ton CV, ta candidature, ou la préparation d’entretien." },
	])
	const [assistantInput, setAssistantInput] = useState('')
	const [assistantFile, setAssistantFile] = useState(null)
	const [assistantLoading, setAssistantLoading] = useState(false)
	const [assistantError, setAssistantError] = useState('')

	const [offerHelpChatId, setOfferHelpChatId] = useState(null)
	const [offerHelpMessages, setOfferHelpMessages] = useState(() => [
		{ role: 'assistant', content: "Bonjour. Sélectionne une offre puis je t’aide à adapter ta candidature et te préparer à l’entretien." },
	])
	const [offerHelpInput, setOfferHelpInput] = useState('')
	const [offerHelpOfferText, setOfferHelpOfferText] = useState('')
	const [offerHelpOfferLinkedJobId, setOfferHelpOfferLinkedJobId] = useState(null)
	const [offerHelpFile, setOfferHelpFile] = useState(null)
	const [offerHelpLoading, setOfferHelpLoading] = useState(false)
	const [offerHelpError, setOfferHelpError] = useState('')
	const [assistantHydrated, setAssistantHydrated] = useState(false)
	const [offerHelpHydrated, setOfferHelpHydrated] = useState(false)
	const [appFeedbackForm, setAppFeedbackForm] = useState({ rating: 0, comment: '' })
	const [appFeedbackSaving, setAppFeedbackSaving] = useState(false)
	const [appFeedbackMessage, setAppFeedbackMessage] = useState('')
	const [appFeedbackError, setAppFeedbackError] = useState('')
	const [appFeedbackSummary, setAppFeedbackSummary] = useState({ averageRating: null, totalFeedbacks: 0 })
	const [appFeedbackOpen, setAppFeedbackOpen] = useState(false)

	const normalizedSuggestions = useMemo(() => normalizeSuggestionsPayload(suggestionsData), [suggestionsData])
	const activeCvMeta = useMemo(() => cvHistory.find((x) => x?.isActive) || null, [cvHistory])
	const selectedCvMeta = useMemo(() => cvHistory.find((x) => String(x?._id) === String(selectedCvId)) || null, [cvHistory, selectedCvId])
	const candidateId = candidate?.id || candidate?._id
	const {
		notifications,
		notificationsUnreadCount,
		notificationsLoading,
		notificationsError,
		fetchNotifications,
		markNotificationAsRead,
	} = useCandidateNotifications({
		apiBase: API_BASE,
		candidateId,
		selectedView,
	})
	const {
		settingsForm,
		settingsSaving,
		settingsMessage,
		settingsError,
		settingsPhotoError,
		settingsCvFile,
		settingsCvUploading,
		settingsCvMessage,
		settingsCvError,
		setSettingsCvMessage,
		setSettingsCvError,
		passwordForm,
		passwordSaving,
		passwordMessage,
		passwordError,
		isCustomCountry,
		selectedCountryValue,
		setSettingsCvFile,
		updateSettingsField,
		handleSettingsPhotoSelect,
		handleSaveProfile,
		handleUploadCvFromSettings,
		updatePasswordField,
		handleChangePassword,
	} = useCandidateSettings({
		apiBase: API_BASE,
		candidate,
		setCandidate,
		setSelectedView,
	})

	useEffect(() => {
		if (!candidateId) return

		let cancelled = false
		const fetchAppFeedback = async () => {
			try {
				const [mineRes, summaryRes] = await Promise.all([
					fetch(`${API_BASE}/app-feedback/mine?userId=${encodeURIComponent(candidateId)}&userRole=candidate`),
					fetch(`${API_BASE}/app-feedback/summary`),
				])

				const mineData = await mineRes.json().catch(() => ({}))
				const summaryData = await summaryRes.json().catch(() => ({}))
				if (cancelled) return

				if (mineRes.ok && mineData?.success && mineData?.feedback) {
					setAppFeedbackForm({
						rating: Number(mineData.feedback.rating || 0),
						comment: String(mineData.feedback.comment || ''),
					})
				}

				if (summaryRes.ok && summaryData?.success && summaryData?.summary) {
					setAppFeedbackSummary({
						averageRating: Number.isFinite(summaryData.summary.averageRating) ? Number(summaryData.summary.averageRating) : null,
						totalFeedbacks: Number(summaryData.summary.totalFeedbacks || 0),
					})
				}
			} catch {
				if (!cancelled) {
					setAppFeedbackSummary((prev) => ({ ...prev }))
				}
			}
		}

		fetchAppFeedback()
		return () => {
			cancelled = true
		}
	}, [candidateId])

	useEffect(() => {
		try {
			localStorage.setItem('airCandidateTheme', isDarkMode ? 'dark' : 'light')
		} catch {
			// Ignore localStorage failures
		}
	}, [isDarkMode])

	useEffect(() => {
		const job = jobs.find((j) => j.id === selectedJobId) || null
		if (!job?.id) return
		if (offerHelpOfferLinkedJobId === job.id) return
		setOfferHelpOfferLinkedJobId(job.id)
		setOfferHelpOfferText(job?.desc || '')
	}, [jobs, selectedJobId, offerHelpOfferLinkedJobId])

	const sendAssistantMessage = async (content) => {
		const text = String(content || '').trim()
		if (!text || assistantLoading) return
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) return

		setAssistantError('')
		setAssistantLoading(true)
		setAssistantMessages((prev) => [...prev, { role: 'user', content: text }])
		try {
			const history = assistantMessages
				.slice(-10)
				.map((m) => ({ role: m.role, content: m.content }))
				.filter((m) => m.role === 'user' || m.role === 'assistant')

			const payloadBase = {
				candidateId,
				candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidat',
				chatType: 'assistant',
				chatId: assistantChatId || '',
				suggestions: suggestionsData || '',
				history,
				message: text,
			}

			let res
			if (assistantFile) {
				const fd = new FormData()
				fd.append('attachment', assistantFile)
				Object.entries(payloadBase).forEach(([k, v]) => fd.append(k, typeof v === 'string' ? v : JSON.stringify(v)))
				res = await fetch(`${API_BASE}/assistant/candidate`, { method: 'POST', body: fd })
			} else {
				res = await fetch(`${API_BASE}/assistant/candidate`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payloadBase),
				})
			}

			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) throw new Error(data?.message || data?.error || "Erreur pendant la réponse de l'assistant")
			if (data?.chatId) setAssistantChatId(data.chatId)
			setAssistantMessages((prev) => [...prev, { role: 'assistant', content: String(data.reply || '').trim() || '—' }])
		} catch (e) {
			setAssistantError(String(e?.message || 'Erreur'))
			setAssistantMessages((prev) => [...prev, { role: 'assistant', content: "Désolé, je n’ai pas pu répondre. Réessaie dans un instant." }])
		} finally {
			setAssistantLoading(false)
		}
	}

	const sendOfferHelpMessage = async (content) => {
		const text = String(content || '').trim()
		if (!text || offerHelpLoading) return
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) return

		setOfferHelpError('')
		setOfferHelpLoading(true)
		setOfferHelpMessages((prev) => [...prev, { role: 'user', content: text }])
		try {
			const history = offerHelpMessages
				.slice(-10)
				.map((m) => ({ role: m.role, content: m.content }))
				.filter((m) => m.role === 'user' || m.role === 'assistant')

			const payloadBase = {
				candidateId,
				candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidat',
				chatType: 'offerHelp',
				chatId: offerHelpChatId || '',
				jobOfferId: selectedJobId || '',
				jobTitle: selectedJob?.title || '',
				company: selectedJob?.company || '',
				suggestions: suggestionsData || '',
				jobOfferText: offerHelpOfferText || selectedJob?.desc || '',
				history,
				message: text,
			}

			let res
			if (offerHelpFile) {
				const fd = new FormData()
				fd.append('attachment', offerHelpFile)
				Object.entries(payloadBase).forEach(([k, v]) => fd.append(k, typeof v === 'string' ? v : JSON.stringify(v)))
				res = await fetch(`${API_BASE}/assistant/candidate`, { method: 'POST', body: fd })
			} else {
				res = await fetch(`${API_BASE}/assistant/candidate`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payloadBase),
				})
			}
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) throw new Error(data?.message || data?.error || "Erreur pendant la réponse de l'assistant")
			if (data?.chatId) setOfferHelpChatId(data.chatId)
			setOfferHelpMessages((prev) => [...prev, { role: 'assistant', content: String(data.reply || '').trim() || '—' }])
		} catch (e) {
			setOfferHelpError(String(e?.message || 'Erreur'))
			setOfferHelpMessages((prev) => [...prev, { role: 'assistant', content: "Désolé, je n’ai pas pu répondre. Réessaie dans un instant." }])
		} finally {
			setOfferHelpLoading(false)
		}
	}

	const handleAssistantSend = async () => {
		const content = assistantInput.trim()
		if (!content) return
		setAssistantInput('')
		await sendAssistantMessage(content)
	}

	const handleOfferHelpSend = async () => {
		const content = offerHelpInput.trim()
		if (!content) return
		setOfferHelpInput('')
		await sendOfferHelpMessage(content)
	}

	const candidateIdForSession = candidate?.id || candidate?._id

	useEffect(() => {
		setAssistantHydrated(false)
		setOfferHelpHydrated(false)
		setAssistantChatId(null)
		setOfferHelpChatId(null)
		setAssistantMessages([
			{ role: 'assistant', content: "Bonjour, je suis l’Assistant IA d’A.I.R. Pose-moi tes questions sur ton CV, ta candidature, ou la préparation d’entretien." },
		])
		setOfferHelpMessages([
			{ role: 'assistant', content: "Bonjour. Sélectionne une offre puis je t’aide à adapter ta candidature et te préparer à l’entretien." },
		])
	}, [candidateIdForSession])

	useEffect(() => {
		if (!candidate) return
		if (assistantHydrated) return
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) return
		if (assistantChatId || assistantMessages.length > 1) {
			setAssistantHydrated(true)
			return
		}

		let cancelled = false
		fetch(`${API_BASE}/chats/candidate/${candidateId}?type=assistant&limit=1`)
			.then((r) => r.json().then((j) => ({ ok: r.ok, json: j })))
			.then(({ ok, json }) => {
				if (cancelled) return
				if (!ok || !json?.success) return
				const chat = Array.isArray(json.chats) && json.chats.length ? json.chats[0] : null
				if (!chat?._id) return
				const msgs = Array.isArray(chat.messages) ? chat.messages : []
				if (msgs.length) {
					setAssistantChatId(chat._id)
					setAssistantMessages(msgs.map((m) => ({ role: m.role, content: m.content })))
				}
			})
			.finally(() => {
				if (cancelled) return
				setAssistantHydrated(true)
			})

		return () => {
			cancelled = true
		}
	}, [candidate, assistantHydrated, assistantChatId, assistantMessages.length])

	useEffect(() => {
		if (!candidate) return
		if (selectedView !== 'offerHelp') return
		if (offerHelpHydrated) return
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) return
		const jobOfferId = selectedJobId || ''
		if (!jobOfferId) {
			setOfferHelpHydrated(true)
			return
		}
		if (offerHelpChatId || offerHelpMessages.length > 1) {
			setOfferHelpHydrated(true)
			return
		}

		let cancelled = false
		fetch(`${API_BASE}/chats/candidate/${candidateId}?type=offerHelp&jobOfferId=${encodeURIComponent(jobOfferId)}&limit=1`)
			.then((r) => r.json().then((j) => ({ ok: r.ok, json: j })))
			.then(({ ok, json }) => {
				if (cancelled) return
				if (!ok || !json?.success) return
				const chat = Array.isArray(json.chats) && json.chats.length ? json.chats[0] : null
				if (!chat?._id) return
				const msgs = Array.isArray(chat.messages) ? chat.messages : []
				if (msgs.length) {
					setOfferHelpChatId(chat._id)
					setOfferHelpMessages(msgs.map((m) => ({ role: m.role, content: m.content })))
				}
			})
			.finally(() => {
				if (cancelled) return
				setOfferHelpHydrated(true)
			})
		return () => {
			cancelled = true
		}
	}, [candidate, selectedView, selectedJobId, offerHelpHydrated, offerHelpChatId, offerHelpMessages.length])


	const menuGroups = useMemo(
		() => [
			{
				title: 'Espace Candidat',
				items: [
					{ key: 'dashboard', label: 'Dashboard' },
					{ key: 'cv', label: 'Mon CV' },
					{ key: 'suggestions', label: 'Suggestions' },
				],
			},
			{
				title: 'Emploi',
				items: [
					{ key: 'offerHelp', label: 'Aide pour une offre' },
					{ key: 'offres', label: "Offres d'emploi", count: jobs.length },
					{ key: 'candidatures', label: 'Mes candidatures', count: candidacies.length },
					{ key: 'entretiens', label: 'Entretiens', count: candidateInterviews.length || Number(dashboardStats?.offers?.interviewsCount) || 0 },
				],
			},
			{
				title: 'Espace formation',
				items: [{ key: 'formation', label: 'Formations' }],
			},
			{
				title: 'Compte',
				items: [
					{ key: 'assistant', label: 'Assistant IA', badge: 'En ligne' },
					{ key: 'notifications', label: 'Notifications', count: notificationsUnreadCount },
					{ key: 'settings', label: 'Paramètres' },
				],
			},
		],
		[jobs.length, candidacies.length, candidateInterviews.length, dashboardStats, notificationsUnreadCount]
	)

	const loadCandidateInterviews = async (currentCandidateId) => {
		if (!currentCandidateId) return
		setCandidateInterviewsLoading(true)
		setCandidateInterviewsError('')
		try {
			const interviewsRes = await fetch(`${API_BASE}/interviews/candidate/${currentCandidateId}?limit=120`)
			const interviewsData = await interviewsRes.json().catch(() => ({}))

			if (!interviewsRes.ok || !interviewsData?.success) {
				throw new Error(interviewsData?.message || 'Impossible de charger vos entretiens.')
			}

			setCandidateInterviews(Array.isArray(interviewsData?.interviews) ? interviewsData.interviews : [])

			// Reports are fetched in background — not displayed but kept in state for internal use
			fetch(`${API_BASE}/interviews/candidate/${currentCandidateId}/reports`)
				.then((r) => r.json().catch(() => ({})))
				.then((d) => { if (d?.success) setCandidateInterviewReports(Array.isArray(d?.reports) ? d.reports : []) })
				.catch(() => {})
		} catch (error) {
			setCandidateInterviewsError(String(error?.message || 'Erreur serveur.'))
			setCandidateInterviews([])
		} finally {
			setCandidateInterviewsLoading(false)
		}
	}

	useEffect(() => {
		const stored = localStorage.getItem('airCandidate')
		if (!stored) {
			navigate('/connecter')
			return
		}
		try {
			setCandidate(JSON.parse(stored))
			try {
				setCandidateSessionId(localStorage.getItem('airCandidateSessionId') || '')
			} catch {
				setCandidateSessionId('')
			}
		} catch {
			localStorage.removeItem('airCandidate')
			navigate('/connecter')
		}
	}, [navigate])

	useEffect(() => {
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) return
		if (!candidateSessionIdRef.current) return

		let timer = null
		const ping = async () => {
			const sessionId = candidateSessionIdRef.current
			if (!sessionId) return
			try {
				await fetch(`${API_BASE}/candidates/session/ping`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ candidateId, sessionId }),
				})
			} catch {
				// silent
			}
		}

		ping()
		timer = setInterval(ping, 30000)
		return () => {
			if (timer) clearInterval(timer)
		}
	}, [candidate])

	useEffect(() => {
		const t = setInterval(() => setCurrentTime(new Date()), 1000)
		return () => clearInterval(t)
	}, [])

	useEffect(() => {
		if (!candidate) return
		setLoadError('')
		setApplyStatus(null)
		setCvMatchError('')
		cvMatchSignatureRef.current = ''
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) {
			setLoadError('Session candidat invalide.')
			setLoading(false)
			return
		}
		const fetchData = async () => {
			try {
				const [jobsRes, candidaciesRes] = await Promise.all([
					fetch(`${API_BASE}/offers`),
					fetch(`${API_BASE}/candidacies/${candidateId}`),
				])
				const jobsData = await jobsRes.json()
				const candidaciesData = await candidaciesRes.json()
				if (jobsRes.ok && jobsData.success) {
					const formattedJobs = (jobsData.offers || []).map((job) => ({
						id: job._id,
						emoji: '💼',
						title: job.title,
						company: 'Entreprise',
						location: job.location,
						tags: [],
						type: job.contractType,
						featured: false,
						posted: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Récemment',
						createdAt: job.createdAt || null,
						salary: job.salary || 'N/A',
						candidates: 0,
						closes: 'N/A',
						desc: job.description,
						missions: [],
						cvMatch: [],
						matchScore: null,
						workMode: job.workMode,
					}))
					setJobs(formattedJobs)
					if (formattedJobs.length > 0) setSelectedJobId(formattedJobs[0].id)
				} else {
					setLoadError(jobsData?.message || "Impossible de charger les offres d'emploi.")
					setJobs([])
				}
				if (candidaciesRes.ok && candidaciesData.success) {
					setCandidacies(candidaciesData.candidacies || [])
				}
			} catch (error) {
				console.error('Error fetching data:', error)
				setLoadError('Serveur indisponible. Vérifiez que le backend tourne.')
				setJobs([])
			} finally {
				setLoading(false)
			}
		}
		fetchData()
	}, [candidate])

	useEffect(() => {
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) return
		if (!Array.isArray(jobs) || jobs.length === 0) return

		const signature = `${candidateId}:${jobs.map((j) => j.id).join(',')}`
		if (cvMatchSignatureRef.current === signature) return
		cvMatchSignatureRef.current = signature

		let cancelled = false
		setCvMatchLoading(true)
		setCvMatchError('')

		const limit = Math.min(Math.max(jobs.length, 1), 200)
		fetch(`${API_BASE}/offers/match/${candidateId}?limit=${limit}`)
			.then(async (res) => {
				const data = await res.json().catch(() => ({}))
				if (!res.ok || !data?.success) throw new Error(data?.message || 'Impossible de calculer les correspondances CV ↔ offres.')
				return data
			})
			.then((data) => {
				if (cancelled) return
				const matchByOfferId = new Map((data?.matches || []).map((m) => [String(m.offerId), m]))
				setJobs((prev) =>
					prev
						.map((j) => {
						const m = matchByOfferId.get(String(j.id))
						if (!m) return j
						return {
							...j,
							matchScore: Number.isFinite(m?.score) ? m.score : j.matchScore,
							cvMatch: Array.isArray(m?.keywords) ? m.keywords : j.cvMatch,
						}
					})
						.sort((a, b) => {
							const aScore = Number.isFinite(a?.matchScore) ? a.matchScore : -1
							const bScore = Number.isFinite(b?.matchScore) ? b.matchScore : -1
							if (bScore !== aScore) return bScore - aScore

							const aTime = new Date(a?.createdAt || 0).getTime() || 0
							const bTime = new Date(b?.createdAt || 0).getTime() || 0
							if (bTime !== aTime) return bTime - aTime

							return String(a?.title || '').localeCompare(String(b?.title || ''))
						})
				)
			})
			.catch((e) => {
				if (cancelled) return
				setCvMatchError(e?.message || 'Correspondances indisponibles.')
			})
			.finally(() => {
				if (!cancelled) setCvMatchLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [candidate, jobs])

	useEffect(() => {
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) return
		if (selectedView !== 'dashboard') return

		let cancelled = false
		const run = async () => {
			try {
				setDashboardError('')
				setDashboardLoading(true)
				const res = await fetch(`${API_BASE}/analytics/candidate/${candidateId}/dashboard?days=30`)
				const data = await res.json().catch(() => ({}))
				if (!res.ok || !data?.success) throw new Error(data?.message || 'Impossible de charger les statistiques')
				if (cancelled) return
				setDashboardStats(data)
			} catch (e) {
				if (cancelled) return
				setDashboardStats(null)
				setDashboardError(e?.message || 'Erreur de chargement')
			} finally {
				if (!cancelled) setDashboardLoading(false)
			}
		}

		run()
		return () => {
			cancelled = true
		}
	}, [candidate, selectedView])

	useEffect(() => {
		const currentCandidateId = candidate?.id || candidate?._id
		if (!currentCandidateId) return
		if (selectedView !== 'entretiens') return

		loadCandidateInterviews(currentCandidateId)
	}, [candidate, selectedView])

	const formatHoursList = (items) => {
		if (!Array.isArray(items) || items.length === 0) return '—'
		return items
			.map((x) => {
				const h = String(x.hour).padStart(2, '0')
				return `${h}h (${x.count})`
			})
			.join(', ')
	}

	const dashboardSeries = useMemo(() => {
		const byDay = dashboardStats?.sessions?.connectedHoursByDay
		const points = Array.isArray(byDay)
			? byDay.map((d) => {
				const label = String(d?.date || '').slice(5)
				return { label, value: Number.isFinite(d?.hours) ? d.hours : 0 }
			})
			: []
		return points
	}, [dashboardStats])

	const dashboardLoginHours = useMemo(() => {
		const raw = dashboardStats?.sessions?.loginHourCounts
		const v = Array.isArray(raw) ? raw.map((n) => (Number.isFinite(n) ? n : 0)) : []
		const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}h`)
		return { values: v.length === 24 ? v : new Array(24).fill(0), labels }
	}, [dashboardStats])

	const pipelineStats = useMemo(() => {
		const connectedHours = Number(dashboardStats?.sessions?.connectedHours) || 0
		const sessionsCount = Number(dashboardStats?.sessions?.count) || 0
		const appliedCount = Number(dashboardStats?.offers?.appliedCount) || 0
		const interviewsCount = Number(dashboardStats?.offers?.interviewsCount) || 0
		const appliedWithInterviewCount = Number(dashboardStats?.offers?.appliedWithInterviewCount) || 0

		const topHours = Array.isArray(dashboardStats?.sessions?.mostFrequentLoginHours)
			? dashboardStats.sessions.mostFrequentLoginHours.slice(0, 3)
			: []
		const topHourItem = topHours[0] || null
		const topHourLabel = topHourItem ? `${String(topHourItem.hour).padStart(2, '0')}h (${topHourItem.count})` : '—'
		const topHoursMax = Math.max(1, ...topHours.map((h) => Number(h?.count) || 0))
		const topHoursPipeline = topHours.map((h) => {
			const count = Number(h?.count) || 0
			return {
				label: `${String(h?.hour ?? 0).padStart(2, '0')}h`,
				count,
				progress: Math.round((count / topHoursMax) * 100),
			}
		})

		const interviewRate = appliedCount > 0 ? Math.round((interviewsCount / appliedCount) * 100) : 0
		const conversionRate = appliedCount > 0 ? Math.round((appliedWithInterviewCount / appliedCount) * 100) : 0

		const maxFunnelValue = Math.max(1, appliedCount, interviewsCount, appliedWithInterviewCount)
		const activityReference = Math.max(1, connectedHours, sessionsCount)

		return {
			connectedHours,
			sessionsCount,
			topHourLabel,
			topHoursPipeline,
			appliedCount,
			interviewsCount,
			appliedWithInterviewCount,
			interviewRate,
			conversionRate,
			activityHoursProgress: Math.round((connectedHours / activityReference) * 100),
			activitySessionsProgress: Math.round((sessionsCount / activityReference) * 100),
			appliedProgress: Math.round((appliedCount / maxFunnelValue) * 100),
			interviewsProgress: Math.round((interviewsCount / maxFunnelValue) * 100),
			conversionProgress: Math.round((appliedWithInterviewCount / maxFunnelValue) * 100),
		}
	}, [dashboardStats])

	const interviewCalendarData = useMemo(() => {
		const toLocalDateKey = (value) => {
			const d = value instanceof Date ? value : new Date(value)
			if (Number.isNaN(d.getTime())) return ''
			const y = d.getFullYear()
			const m = String(d.getMonth() + 1).padStart(2, '0')
			const day = String(d.getDate()).padStart(2, '0')
			return `${y}-${m}-${day}`
		}

		const interviews = Array.isArray(dashboardStats?.offers?.upcomingInterviews)
			? dashboardStats.offers.upcomingInterviews
			: []

		const byDate = new Map()
		for (const i of interviews) {
			if (!i?.scheduledAt) continue
			const dt = new Date(i.scheduledAt)
			if (Number.isNaN(dt.getTime())) continue
			const key = toLocalDateKey(dt)
			if (!key) continue
			const offerTitle = String(i?.offerTitle || i?.jobOfferTitle || i?.title || i?.jobOffer?.title || 'Offre').trim() || 'Offre'
			const entry = {
				offerTitle,
				time: dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
			}
			const prev = byDate.get(key) || []
			prev.push(entry)
			byDate.set(key, prev)
		}

		const monthStart = new Date(interviewCalendarMonth.getFullYear(), interviewCalendarMonth.getMonth(), 1)
		const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
		const leadingEmpty = (monthStart.getDay() + 6) % 7
		const cells = []

		for (let i = 0; i < leadingEmpty; i += 1) {
			cells.push({ key: `empty-start-${monthStart.getFullYear()}-${monthStart.getMonth()}-${i}`, empty: true })
		}

		for (let day = 1; day <= daysInMonth; day += 1) {
			const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day)
			const key = toLocalDateKey(date)
			const events = byDate.get(key) || []
			cells.push({
				day,
				key,
				events,
				title: events.map((e) => `${e.time} - ${e.offerTitle}`).join(' | '),
			})
		}

		let endIndex = 0
		while (cells.length % 7 !== 0) {
			cells.push({ key: `empty-end-${monthStart.getFullYear()}-${monthStart.getMonth()}-${endIndex}`, empty: true })
			endIndex += 1
		}

		return {
			monthLabel: monthStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
			weekDays: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
			cells,
		}
	}, [dashboardStats, interviewCalendarMonth])
	
	
	useEffect(() => {
		if (selectedView !== 'cv') return
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) return
		let cancelled = false
		setCvLoading(true)
		setCvError('')
		;(async () => {
			await refreshCvHistory(candidateId, { autoSelect: true })
			if (cancelled) return
		})()
			.catch(() => {
				if (cancelled) return
				setCvError('Serveur indisponible. Vérifiez que le backend tourne.')
			})
			.finally(() => {
				if (cancelled) return
				setCvLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [selectedView, candidate])

	useEffect(() => {
		if (!candidate) return
		if (selectedView !== 'settings') return
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) return
		refreshCvHistory(candidateId, { autoSelect: false })
	}, [selectedView, candidate])

	useEffect(() => {
		setApplyStatus(null)
	}, [selectedJobId])

	useEffect(() => {
		setSuggestionsError('')
		setSuggestionsHint('')
	}, [selectedView])

	useEffect(() => {
		if (!selectedCvId) {
			setCvExtraction(null)
			return
		}
		let cancelled = false
		setCvExtractionLoading(true)
		;(async () => {
			try {
				const res = await fetch(`${API_BASE}/cv/extraction-data/${selectedCvId}`)
				const data = await res.json().catch(() => ({}))
				if (cancelled) return
				if (res.ok && data?.success) {
					setCvExtraction(data?.extraction || null)
				} else {
					setCvExtraction(null)
				}
			} catch {
				if (!cancelled) setCvExtraction(null)
			} finally {
				if (!cancelled) setCvExtractionLoading(false)
			}
		})()
		return () => { cancelled = true }
	}, [selectedCvId])

	const appliedOfferIds = useMemo(() => {
		const ids = new Set()
		for (const c of candidacies) {
			const raw = c?.jobOfferId
			if (!raw) continue
			if (typeof raw === 'string') ids.add(raw)
			else if (raw?._id) ids.add(raw._id)
		}
		return ids
	}, [candidacies])

	const handleLogout = async () => {
		const candidateId = candidate?.id || candidate?._id
		const sessionId = (() => {
			try {
				return localStorage.getItem('airCandidateSessionId')
			} catch {
				return null
			}
		})()
		if (candidateId && sessionId) {
			try {
				await fetch(`${API_BASE}/candidates/logout`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ candidateId, sessionId }),
				})
			} catch {
				// ignore
			}
		}
		localStorage.removeItem('airCandidate')
		localStorage.removeItem('airCandidateSessionId')
		
		setCandidateSessionId('')
		window.dispatchEvent(new Event('localStorageChange'))
		navigate('/connecter')
	}

	const handleRefreshPage = () => {
		window.location.reload()
	}

	const handleJoinInterviewMeet = (meetingLink, interviewId) => {
		if (!meetingLink) return
		const displayName = `${candidate?.firstName || ''} ${candidate?.lastName || ''}`.trim() || 'Candidat AIR'
		const interviewQuery = interviewId ? `&interviewId=${encodeURIComponent(interviewId)}` : ''
		navigate(`/meet?url=${encodeURIComponent(meetingLink)}&name=${encodeURIComponent(displayName)}&role=candidat${interviewQuery}`)
	}

	const handleAnalyzeCv = async () => {
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) return
		setSuggestionsLoading(true)
		setSuggestionsError('')
		setSuggestionsHint('')
		try {
			const res = await fetch(`${API_BASE}/cv/suggestions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ candidateId }),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				setSuggestionsError(data?.message || "Impossible d'analyser le CV.")
				setSuggestionsHint(data?.hint || '')
				return
			}
			setSuggestionsData(data?.suggestions || null)
		} catch {
			setSuggestionsError('Serveur indisponible. Vérifiez que le backend tourne.')
		} finally {
			setSuggestionsLoading(false)
		}
	}

	const refreshCvHistory = async (candidateId, { autoSelect = true } = {}) => {
		if (!candidateId) return
		setCvHistoryLoading(true)
		setCvHistoryError('')
		try {
			const res = await fetch(`${API_BASE}/cv/history/${candidateId}`)
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				throw new Error(data?.message || "Impossible de charger l'historique des CV.")
			}

			const history = Array.isArray(data?.history) ? data.history : []
			setCvHistory(history)

			const active = history.find((x) => x?.isActive) || null
			const nextActiveId = active?._id ? String(active._id) : ''
			setActiveCvId(nextActiveId)

			if (autoSelect) {
				const hasSelected = selectedCvId && history.some((x) => String(x?._id) === String(selectedCvId))
				const nextSelectedId = hasSelected ? String(selectedCvId) : String(active?._id || history?.[0]?._id || '')
				setSelectedCvId(nextSelectedId)
				const chosen = history.find((x) => String(x?._id) === String(nextSelectedId)) || null
				const path = chosen?.filePath || ''
				setCvSource(chosen?.source || '')
				setCvUrl(path ? `${API_ORIGIN}${path}` : '')
			}
		} catch (e) {
			setCvHistoryError(String(e?.message || 'Erreur'))
			setCvHistory([])
			setActiveCvId('')
			if (autoSelect) {
				setSelectedCvId('')
				setCvUrl('')
				setCvSource('')
			}
		} finally {
			setCvHistoryLoading(false)
		}
	}

	const handleSetActiveCv = async (cvId) => {
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId || !cvId) return
		setCvHistoryError('')
		try {
			const res = await fetch(`${API_BASE}/cv/set-active`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ candidateId, cvId }),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) throw new Error(data?.message || 'Impossible de sélectionner ce CV.')
			await refreshCvHistory(candidateId)
		} catch (e) {
			setCvHistoryError(String(e?.message || 'Erreur'))
		}
	}

	const handleEditActiveGeneratedCv = async () => {
		setSettingsCvError('')
		setSettingsCvMessage('')
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) {
			setSettingsCvError('Candidat introuvable.')
			return
		}

		if (!activeCvId) {
			setSettingsCvError('Aucun CV actif trouvé.')
			return
		}

		try {
			const res = await fetch(`${API_BASE}/cv/by-id/${activeCvId}?candidateId=${encodeURIComponent(candidateId)}`)
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) throw new Error(data?.message || 'Impossible de charger le CV.')
			const cv = data?.cv || null
			if (!cv) throw new Error('CV introuvable.')

			const extractionCategories = cv?.extraction?.categories && typeof cv.extraction.categories === 'object' ? cv.extraction.categories : {}
			const firstNonEmpty = (values) => {
				if (!Array.isArray(values)) return ''
				return values.map((value) => String(value || '').trim()).find(Boolean) || ''
			}
			const listToText = (values, separator = '\n') => {
				if (!Array.isArray(values)) return ''
				return values.map((value) => String(value || '').trim()).filter(Boolean).join(separator)
			}
			const listToLanguageItems = (values) => {
				if (!Array.isArray(values)) return []
				return values.map((value) => String(value || '').trim()).filter(Boolean).map((name) => ({ name, level: '', certification: '' }))
			}
			const listToSimpleItems = (values) => {
				if (!Array.isArray(values)) return []
				return values.map((value) => String(value || '').trim()).filter(Boolean).map((name) => ({ name, organization: '', obtainedAt: '', expiresAt: '', identifier: '', verificationUrl: '' }))
			}

			const personal = {
				firstName: cv?.personal?.firstName || candidate?.firstName || '',
				lastName: cv?.personal?.lastName || candidate?.lastName || '',
				professionalTitle: cv?.personal?.professionalTitle || candidate?.professionalTitle || '',
				email: cv?.personal?.email || candidate?.email || '',
				phone: cv?.personal?.phone || candidate?.phone || '',
				city: cv?.personal?.city || candidate?.city || '',
				country: cv?.personal?.country || candidate?.country || '',
				linkedin: cv?.personal?.linkedin || candidate?.linkedin || '',
				portfolio: cv?.personal?.portfolio || candidate?.portfolioUrl || '',
				birthDate: cv?.personal?.birthDate || (candidate?.birthDate ? String(candidate.birthDate).slice(0, 10) : ''),
				nationality: cv?.personal?.nationality || candidate?.nationality || '',
				profileImageDataUrl: cv?.personal?.profileImageDataUrl || candidate?.profileImage || '',
			}
			const content = {
				professionalSummary: cv?.content?.professionalSummary || firstNonEmpty(extractionCategories.summary),
				education: cv?.content?.education || listToText(extractionCategories.education),
				experience: cv?.content?.experience || listToText(extractionCategories.experiences),
				skills: cv?.content?.skills || listToText(extractionCategories.skills, ', '),
				educationItems: Array.isArray(cv?.content?.educationItems) ? cv.content.educationItems : [],
				experienceItems: Array.isArray(cv?.content?.experienceItems) ? cv.content.experienceItems : [],
				languages: Array.isArray(cv?.content?.languages) && cv.content.languages.length > 0 ? cv.content.languages : listToLanguageItems(extractionCategories.languages),
				certifications: Array.isArray(cv?.content?.certifications) && cv.content.certifications.length > 0 ? cv.content.certifications : listToSimpleItems(extractionCategories.certifications),
				projects: Array.isArray(cv?.content?.projects) ? cv.content.projects : [],
				qualities: Array.isArray(cv?.content?.qualities) ? cv.content.qualities : [],
				interests: Array.isArray(cv?.content?.interests) ? cv.content.interests : [],
			}

			saveCvDraft(candidateId, { personal, content })
			navigate('/EspaceCandidat/construire/etape-1')
		} catch (e) {
			setSettingsCvError(String(e?.message || 'Erreur'))
		}
	}

	const candidateInitials = useMemo(() => {
		if (!candidate) return 'C'
		const f = candidate.firstName?.[0] || ''
		const l = candidate.lastName?.[0] || ''
		return `${f}${l}`.toUpperCase() || 'C'
	}, [candidate])

	const candidateName = candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidat'
	const chatUserLabel = String(candidateName || '').trim() || 'Vous'
	const candidateTitle = candidate?.professionalTitle || "À l'écoute d'opportunités"

	const formattedTime = useMemo(() => {
		const h = String(currentTime.getHours()).padStart(2, '0')
		const m = String(currentTime.getMinutes()).padStart(2, '0')
		return `${h}:${m}`
	}, [currentTime])

	const greeting = useMemo(() => {
		const hour = currentTime.getHours()
		if (hour < 12) return 'Bonjour'
		if (hour < 18) return 'Bon après-midi'
		return 'Bonsoir'
	}, [currentTime])

	const filtered = useMemo(() => {
		const q = searchQuery.trim().toLowerCase()
		const hasMinSalary = String(salaryMin || '').trim() !== ''
		const hasMaxSalary = String(salaryMax || '').trim() !== ''
		const hasMinExp = String(experienceMinYears || '').trim() !== ''

		const minSalaryValue = hasMinSalary ? Number(salaryMin) : null
		const maxSalaryValue = hasMaxSalary ? Number(salaryMax) : null
		const minExpValue = hasMinExp ? Number(experienceMinYears) : null

		const filteredJobs = jobs.filter((j) => {
			if (q) {
				const hay = `${j.title} ${j.location} ${j.company} ${j.desc || ''}`.toLowerCase()
				if (!hay.includes(q)) return false
			}

			if (hasMinSalary || hasMaxSalary) {
				const range = parseSalaryRange(j.salary)
				if (!range) return false
				if (Number.isFinite(minSalaryValue) && range.max < minSalaryValue) return false
				if (Number.isFinite(maxSalaryValue) && range.min > maxSalaryValue) return false
			}

			if (hasMinExp) {
				const years = extractMaxExperienceYears(j.desc || '')
				if (!Number.isFinite(minExpValue)) return true
				if (years === null) return false
				if (years < minExpValue) return false
			}

			return true
		})

		const sortedJobs = [...filteredJobs]
		switch (sortPreference) {
			case 'match_desc':
				sortedJobs.sort((a, b) => (Number.isFinite(b?.matchScore) ? b.matchScore : -1) - (Number.isFinite(a?.matchScore) ? a.matchScore : -1))
				break
			case 'match_asc':
				sortedJobs.sort((a, b) => {
					const aScore = Number.isFinite(a?.matchScore) ? a.matchScore : Number.POSITIVE_INFINITY
					const bScore = Number.isFinite(b?.matchScore) ? b.matchScore : Number.POSITIVE_INFINITY
					return aScore - bScore
				})
				break
			case 'recent':
				sortedJobs.sort((a, b) => (new Date(b?.createdAt || 0).getTime() || 0) - (new Date(a?.createdAt || 0).getTime() || 0))
				break
			case 'salary_desc':
				sortedJobs.sort((a, b) => {
					const aRange = parseSalaryRange(a?.salary)
					const bRange = parseSalaryRange(b?.salary)
					const aValue = Number.isFinite(aRange?.max) ? aRange.max : -1
					const bValue = Number.isFinite(bRange?.max) ? bRange.max : -1
					return bValue - aValue
				})
				break
			case 'salary_asc':
				sortedJobs.sort((a, b) => {
					const aRange = parseSalaryRange(a?.salary)
					const bRange = parseSalaryRange(b?.salary)
					const aValue = Number.isFinite(aRange?.min) ? aRange.min : Number.POSITIVE_INFINITY
					const bValue = Number.isFinite(bRange?.min) ? bRange.min : Number.POSITIVE_INFINITY
					return aValue - bValue
				})
				break
			default:
				// Keep backend/current ordering for relevance.
				break
		}

		return sortedJobs
	}, [searchQuery, salaryMin, salaryMax, experienceMinYears, jobs, sortPreference])

	const selectedJob = useMemo(() => {
		if (!selectedJobId && jobs.length > 0) return jobs[0]
		return jobs.find((j) => j.id === selectedJobId) || jobs[0]
	}, [jobs, selectedJobId])

	const selectedJobAlreadyApplied = useMemo(() => {
		if (!selectedJob) return false
		return appliedOfferIds.has(selectedJob.id)
	}, [appliedOfferIds, selectedJob])

	const effectiveApplyStatus = useMemo(() => {
		if (applyStatus) return applyStatus
		if (selectedJobAlreadyApplied) {
			return { type: 'info', message: 'Vous avez déjà postulé à cette offre.' }
		}
		return null
	}, [applyStatus, selectedJobAlreadyApplied])

	const toggleSave = (e, id) => {
		e.stopPropagation()
		setSavedJobs((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const quizModeConfig = {
		standard: { count: 8, label: '8 questions / 8 min', durationMinutes: 8 },
		rapide: { count: 5, label: '5 questions / 8 min', durationMinutes: 8 },
	}

	const loadQuizSession = async (mode = quizMode) => {
		if (!candidate || !selectedJob) return
		setApplyStatus(null)
		setQuizError('')

		if (appliedOfferIds.has(selectedJob.id)) {
			setApplyStatus({ type: 'info', message: 'Vous avez déjà postulé à cette offre.' })
			return
		}

		const modeConfig = quizModeConfig[mode] || quizModeConfig.standard
		setQuizMode(mode)

		try {
			setQuizLoading(true)
			const response = await fetch(`${API_BASE}/quizzes/session?jobOfferId=${selectedJob.id}&count=${modeConfig.count}&level=junior`)
			const data = await response.json().catch(() => ({}))

			if (!response.ok || !data?.success) {
				setQuizError(data?.message || 'Impossible de générer le quiz automatiquement pour cette offre.')
				return
			}

			const list = Array.isArray(data?.questions) ? data.questions : []
			if (list.length === 0) {
				setQuizError('Aucune question quiz disponible pour cette offre.')
				return
			}

			setQuizToken(String(data?.quizToken || ''))
			setQuizQuestions(list)
			setQuizAnswers({})
			setQuizMeta({ ...(data?.meta || {}), durationMinutes: modeConfig.durationMinutes })
			setQuizSecondsLeft(Number(data?.meta?.expiresInSeconds) || modeConfig.durationMinutes * 60)
			quizTimedOutRef.current = false
			setQuizOpen(true)
		} catch (error) {
			console.error('Error loading quiz:', error)
			setQuizError('Erreur serveur pendant la génération du quiz.')
		} finally {
			setQuizLoading(false)
		}
	}

	const createCandidacy = async ({ quizAttemptId = '', scorePercent = null } = {}) => {
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId || !selectedJob?.id) return

		setIsApplying(true)
		try {
			const res = await fetch(`${API_BASE}/candidacies`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					candidateId,
					jobOfferId: selectedJob.id,
					cvId: activeCvId || undefined,
					quizAttemptId: quizAttemptId || undefined,
				}),
			})

			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				setApplyStatus({ type: 'error', message: data?.message || 'Erreur lors de la candidature.' })
				return
			}

			const scoreLabel = Number.isFinite(scorePercent) ? ` Score quiz: ${scorePercent}%.` : ''
			setApplyStatus({ type: 'success', message: `Candidature envoyée avec succès.${scoreLabel}` })
			setQuizOpen(false)
			setQuizError('')
			setQuizToken('')
			setQuizQuestions([])
			setQuizAnswers({})
			setQuizMeta(null)
			setQuizSecondsLeft(0)
			quizTimedOutRef.current = false

			const candidaciesRes = await fetch(`${API_BASE}/candidacies/${candidateId}`)
			const candidaciesData = await candidaciesRes.json().catch(() => ({}))
			if (candidaciesData?.success) setCandidacies(candidaciesData.candidacies || [])
		} catch (error) {
			console.error('Error applying:', error)
			setApplyStatus({ type: 'error', message: 'Erreur serveur. Réessayez plus tard.' })
		} finally {
			setIsApplying(false)
		}
	}

	const handleApply = async () => {
		await loadQuizSession(quizMode)
	}

	const handleSubmitAppFeedback = async (e) => {
		e.preventDefault()
		setAppFeedbackError('')
		setAppFeedbackMessage('')

		if (!candidateId) {
			setAppFeedbackError('Session candidat invalide. Reconnectez-vous.')
			return
		}

		if (!Number.isFinite(appFeedbackForm.rating) || appFeedbackForm.rating < 1 || appFeedbackForm.rating > 5) {
			setAppFeedbackError('Veuillez choisir une note entre 1 et 5 etoiles.')
			return
		}

		setAppFeedbackSaving(true)
		try {
			const response = await fetch(`${API_BASE}/app-feedback`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: candidateId,
					userRole: 'candidate',
					rating: appFeedbackForm.rating,
					comment: appFeedbackForm.comment,
				}),
			})

			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				setAppFeedbackError(data?.message || 'Impossible d enregistrer votre feedback.')
				return
			}

			setAppFeedbackMessage(data?.message || 'Merci pour votre feedback.')
			const summaryRes = await fetch(`${API_BASE}/app-feedback/summary`)
			const summaryData = await summaryRes.json().catch(() => ({}))
			if (summaryRes.ok && summaryData?.success && summaryData?.summary) {
				setAppFeedbackSummary({
					averageRating: Number.isFinite(summaryData.summary.averageRating) ? Number(summaryData.summary.averageRating) : null,
					totalFeedbacks: Number(summaryData.summary.totalFeedbacks || 0),
				})
			}
		} catch {
			setAppFeedbackError('Serveur indisponible. Verifiez que le backend tourne.')
		} finally {
			setAppFeedbackSaving(false)
		}
	}

	const handleQuizAnswerChange = (questionId, optionKey) => {
		setQuizAnswers((prev) => ({ ...prev, [questionId]: optionKey }))
	}

	const handleCloseQuizModal = () => {
		if (quizSubmitting || isApplying) return
		setQuizOpen(false)
		setQuizError('')
		setQuizSecondsLeft(0)
		quizTimedOutRef.current = false
	}

	const handleSubmitQuizAndApply = async ({ forceSubmit = false } = {}) => {
		if (!candidate || !selectedJob || quizSubmitting) return
		if (!quizToken) {
			setQuizError('Session quiz invalide. Rechargez le quiz.')
			return
		}

		const questionIds = quizQuestions.map((q) => String(q.id || ''))
		if (!forceSubmit && questionIds.some((id) => !quizAnswers[id])) {
			setQuizError('Merci de répondre à toutes les questions avant de continuer.')
			return
		}

		setQuizError('')
		setQuizSubmitting(true)
		try {
			const candidateId = candidate?.id || candidate?._id
			const answers = questionIds.map((questionId) => ({
				questionId,
				selectedOptionKey: quizAnswers[questionId] || '',
			}))

			const response = await fetch(`${API_BASE}/quizzes/submit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					candidateId,
					jobOfferId: selectedJob.id,
					quizToken,
					answers,
				}),
			})

			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				setQuizError(data?.message || 'Impossible de corriger le quiz.')
				return
			}

			await createCandidacy({
				quizAttemptId: data?.attemptId || '',
				scorePercent: Number.isFinite(data?.scorePercent) ? data.scorePercent : null,
			})
		} catch (error) {
			console.error('Error submitting quiz:', error)
			setQuizError('Erreur serveur pendant la soumission du quiz.')
		} finally {
			setQuizSubmitting(false)
		}
	}

	useEffect(() => {
		if (!quizOpen) return
		if (!Number.isFinite(quizSecondsLeft) || quizSecondsLeft <= 0) return

		const interval = setInterval(() => {
			setQuizSecondsLeft((prev) => {
				if (!Number.isFinite(prev) || prev <= 1) return 0
				return prev - 1
			})
		}, 1000)

		return () => clearInterval(interval)
	}, [quizOpen, quizSecondsLeft])

	useEffect(() => {
		if (!quizOpen) return
		if (quizSecondsLeft > 0) return
		if (quizSubmitting || isApplying) return
		if (quizTimedOutRef.current) return

		quizTimedOutRef.current = true
		setQuizError('Temps ecoule. Le quiz est soumis automatiquement.')
		handleSubmitQuizAndApply({ forceSubmit: true })
	}, [quizOpen, quizSecondsLeft, quizSubmitting, isApplying])

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Chargement...</p>
				</div>
			</div>
		)
	}

	return (
		<section
			className={`candidate-dashboard min-h-screen bg-gradient-to-br from-[#eaf8ff] via-[#f3fbff] to-[#eef4ff] ${isDarkMode ? 'candidate-dashboard--dark' : ''}`}
			style={{ fontFamily: "'Jost', sans-serif" }}
		>
			<div className='flex min-h-screen w-full'>
				<aside className='candidate-dashboard__sidebar w-[286px] shrink-0 bg-gradient-to-b from-[#051a3d] via-[#072a56] to-[#083d69] px-4 py-6 text-white'>
					<div className='mb-2 flex items-center justify-center px-2'>
						<button type='button' onClick={() => navigate('/')} className='cursor-pointer' aria-label="Aller a l'accueil">
							<img src={assets.logo} alt='AIR logo' className='h-28 w-auto object-contain' />
						</button>
					</div>
					<div className='rounded-2xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm shadow-[0_8px_20px_rgba(0,0,0,0.18)]'>
						<div className='flex items-center gap-3'>
						<div className='h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-[#00d4ff] to-[#1f7bff]'>
							{candidate?.profileImage ? (
								<img src={candidate.profileImage} alt='Profil' className='h-full w-full object-cover' />
							) : (
								<div className='flex h-full w-full items-center justify-center text-base font-bold text-white'>{candidateInitials}</div>
							)}
						</div>
						<div className='min-w-0'>
							<p className='truncate text-[19px] leading-5 font-bold text-white'>{candidateName}</p>
							<div className='mt-1 flex items-center gap-2'>
								<span className='truncate text-xs text-cyan-100/90'>{candidateTitle}</span>
								<span className='shrink-0 rounded-full bg-cyan-100 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide text-[#045d7a]'>
									Candidat
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
													onClick={() => setSelectedView(item.key)}
													className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[16px] font-medium transition-all ${isActive ? 'bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-sm shadow-[0_10px_24px_rgba(0,0,0,0.2)]' : 'text-[#d2e7ff] hover:bg-white/10 hover:text-white'}`}
												>
													<div className='flex items-center gap-2'>
														<span>{item.label}</span>
														{item.badge ? (
															<span className='ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-200/20 px-2 py-[2px] text-[10px] font-semibold text-emerald-50'>
																<span className='h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-200' />
																{item.badge}
															</span>
														) : null}
													</div>
													{typeof item.count === 'number' ? (
														<span className='rounded-full bg-white/15 px-2 py-[2px] text-[12px] font-semibold text-[#e6f5ff]'>{item.count}</span>
													) : null}
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
							Déconnexion
						</button>
					</div>
				</aside>

				<main className='flex-1 p-6'>
					<div className='candidate-dashboard__panel h-full rounded-3xl border border-[#cfe7f9] bg-white p-6 shadow-[0_15px_40px_rgba(8,51,93,0.08)]'>
						<div className='flex flex-wrap items-start justify-between gap-4'>
							<div>
								<p className='text-4xl font-black text-[#000000]'>{greeting} 👋</p>
								<p className='mt-2 text-base text-[#36648b]'>
									{candidate?.firstName || 'Candidat'}, voici vos offres et vos correspondances.
								</p>
							</div>
							<div className='flex items-center gap-3'>
								<span className='candidate-dashboard__time inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-[#0a5f88]'>
									<span className='h-2 w-2 animate-pulse rounded-full bg-[#06d5e0]' />
									{formattedTime}
								</span>
								<div className='flex items-center gap-2'>
									<span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>{isDarkMode ? 'Sombre' : 'Clair'}</span>
									<button
										type='button'
										onClick={() => setIsDarkMode((prev) => !prev)}
										className={`theme-switch ${isDarkMode ? 'is-active' : ''}`}
										role='switch'
										aria-checked={isDarkMode}
										aria-label='Basculer le mode sombre'
										title='Basculer le thème'
									>
										<span className='theme-switch__track' />
										<span className='theme-switch__thumb' />
									</button>
								</div>
								<button
									type='button'
									onClick={handleRefreshPage}
									className='candidate-dashboard__ghost-btn rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'
									title='Rafraîchir la page'
								>
									Rafraîchir
								</button>
								<button
									type='button'
									onClick={() => setSelectedView('candidatures')}
									className='candidate-dashboard__primary-btn rounded-xl bg-[#001d3e] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95'
								>
									Mes candidatures
								</button>
								<button
									type='button'
									onClick={() => setSelectedView('entretiens')}
									className='candidate-dashboard__ghost-btn rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-[#0a5f88] transition hover:bg-cyan-100'
								>
									Mes entretiens
								</button>
							</div>
						</div>

						{selectedView === 'offres' ? (
							<DashboardCandOffresView
								loadError={loadError}
								searchQuery={searchQuery}
								setSearchQuery={setSearchQuery}
								salaryMin={salaryMin}
								setSalaryMin={setSalaryMin}
								salaryMax={salaryMax}
								setSalaryMax={setSalaryMax}
								experienceMinYears={experienceMinYears}
								setExperienceMinYears={setExperienceMinYears}
								sortPreference={sortPreference}
								setSortPreference={setSortPreference}
								filtered={filtered}
								cvMatchLoading={cvMatchLoading}
								cvMatchError={cvMatchError}
								selectedJob={selectedJob}
								savedJobs={savedJobs}
								toggleSave={toggleSave}
								setSelectedJobId={setSelectedJobId}
								setApplyStatus={setApplyStatus}
								effectiveApplyStatus={effectiveApplyStatus}
								setSelectedView={setSelectedView}
								handleApply={handleApply}
								isApplying={isApplying}
								quizLoading={quizLoading}
								selectedJobAlreadyApplied={selectedJobAlreadyApplied}
							/>
						) : selectedView === 'cv' ? (
							<DashboardCandCvView
								activeCvMeta={activeCvMeta}
								cvUrl={cvUrl}
								setSelectedView={setSelectedView}
								cvLoading={cvLoading}
								cvHistoryLoading={cvHistoryLoading}
								cvHistoryError={cvHistoryError}
								cvError={cvError}
								cvHistory={cvHistory}
								selectedCvId={selectedCvId}
								setSelectedCvId={setSelectedCvId}
								setCvSource={setCvSource}
								setCvError={setCvError}
								setCvUrl={setCvUrl}
								selectedCvMeta={selectedCvMeta}
								handleSetActiveCv={handleSetActiveCv}
								apiOrigin={API_ORIGIN}
								cvExtraction={cvExtraction}
								cvExtractionLoading={cvExtractionLoading}
							/>
						) : selectedView === 'suggestions' ? (
							<DashboardCandSuggestionsView
								setSelectedView={setSelectedView}
								handleAnalyzeCv={handleAnalyzeCv}
								suggestionsLoading={suggestionsLoading}
								candidate={candidate}
								suggestionsError={suggestionsError}
								suggestionsHint={suggestionsHint}
								suggestionsData={suggestionsData}
								normalizedSuggestions={normalizedSuggestions}
							/>
						) : selectedView === 'notifications' ? (
							<DashboardCandNotificationsView
								candidate={candidate}
								fetchNotifications={fetchNotifications}
								notificationsError={notificationsError}
								notificationsLoading={notificationsLoading}
								notifications={notifications}
								markNotificationAsRead={markNotificationAsRead}
								handleJoinInterviewMeet={handleJoinInterviewMeet}
							/>
						) : selectedView === 'settings' ? (
							<DashboardCandSettingsView
								setSelectedView={setSelectedView}
								settingsError={settingsError}
								settingsMessage={settingsMessage}
								settingsPhotoError={settingsPhotoError}
								handleSaveProfile={handleSaveProfile}
								settingsForm={settingsForm}
								candidateInitials={candidateInitials}
								handleSettingsPhotoSelect={handleSettingsPhotoSelect}
								updateSettingsField={updateSettingsField}
								selectedCountryValue={selectedCountryValue}
								isCustomCountry={isCustomCountry}
								settingsSaving={settingsSaving}
								handleEditActiveGeneratedCv={handleEditActiveGeneratedCv}
								settingsCvError={settingsCvError}
								settingsCvMessage={settingsCvMessage}
								setSettingsCvFile={setSettingsCvFile}
								settingsCvFile={settingsCvFile}
								handleUploadCvFromSettings={handleUploadCvFromSettings}
								settingsCvUploading={settingsCvUploading}
								passwordError={passwordError}
								passwordMessage={passwordMessage}
								handleChangePassword={handleChangePassword}
								passwordForm={passwordForm}
								updatePasswordField={updatePasswordField}
								passwordSaving={passwordSaving}
							/>
						) : selectedView === 'formation' ? (
							<div className='mt-6'>
								<div className='rounded-2xl border border-cyan-100 bg-white p-4 shadow-[0_14px_30px_rgba(2,132,199,0.1)]'>
									<div className='grid gap-4 md:grid-cols-[320px_1fr]'>
										<div className='h-52 w-full rounded-xl border-2 border-dashed border-cyan-300 bg-cyan-50/60 p-3'>
											<img
												src={assets.React}
												alt='Formation React'
												className='h-full w-full rounded-lg border border-cyan-200 object-cover'
											/>
										</div>
										<div className='flex min-h-[208px] flex-col justify-between'>
											<div>
												<div className='inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-700'>
													Formations
												</div>
												<h3 className='mt-3 text-2xl font-black text-[#0b3558]'>Apprendre les fondamentaux de React</h3>
												<p className='mt-2 text-sm text-[#4f7191]'>Version francaise de Learn the fundamentals of React.</p>
											</div>
											<div className='mt-4 flex flex-wrap gap-3'>
												<button
													type='button'
													className='rounded-xl bg-[#0b3558] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95'
												>
													Voir la formation
												</button>
												<span className='inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600'>
													Niveau: Debutant
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						) : selectedView === 'dashboard' ? (
							<DashboardCandAnalyticsView
								dashboardLoading={dashboardLoading}
								dashboardError={dashboardError}
								dashboardStats={dashboardStats}
								pipelineStats={pipelineStats}
								dashboardSeries={dashboardSeries}
								dashboardLoginHours={dashboardLoginHours}
								interviewCalendarData={interviewCalendarData}
								setInterviewCalendarMonth={setInterviewCalendarMonth}
							/>
						) : selectedView === 'offerHelp' ? (
							<DashboardCandOfferHelpView
								selectedJob={selectedJob}
								sendOfferHelpMessage={sendOfferHelpMessage}
								offerHelpLoading={offerHelpLoading}
								setOfferHelpChatId={setOfferHelpChatId}
								setOfferHelpMessages={setOfferHelpMessages}
								setOfferHelpError={setOfferHelpError}
								offerHelpError={offerHelpError}
								offerHelpMessages={offerHelpMessages}
								candidateName={candidateName}
								candidate={candidate}
								candidateInitials={candidateInitials}
								offerHelpInput={offerHelpInput}
								setOfferHelpInput={setOfferHelpInput}
								handleOfferHelpSend={handleOfferHelpSend}
								jobs={jobs}
								setSelectedJobId={setSelectedJobId}
								offerHelpOfferText={offerHelpOfferText}
								setOfferHelpOfferText={setOfferHelpOfferText}
								setOfferHelpFile={setOfferHelpFile}
								offerHelpFile={offerHelpFile}
							/>
						) : selectedView === 'assistant' ? (
							<DashboardCandAssistantView
								setAssistantChatId={setAssistantChatId}
								setAssistantMessages={setAssistantMessages}
								setAssistantError={setAssistantError}
								setAssistantFile={setAssistantFile}
								assistantError={assistantError}
								assistantMessages={assistantMessages}
								candidateName={candidateName}
								candidate={candidate}
								candidateInitials={candidateInitials}
								assistantInput={assistantInput}
								setAssistantInput={setAssistantInput}
								assistantLoading={assistantLoading}
								assistantFile={assistantFile}
								handleAssistantSend={handleAssistantSend}
							/>
						) : selectedView === 'candidatures' ? (
							<DashboardCandCandidaturesView candidacies={candidacies} />
						) : selectedView === 'entretiens' ? (
							<DashboardCandInterviewsView
								interviews={candidateInterviews}
								reports={candidateInterviewReports}
								loading={candidateInterviewsLoading}
								error={candidateInterviewsError}
								onRefresh={() => {
									const currentCandidateId = candidate?.id || candidate?._id
									if (!currentCandidateId) return
									loadCandidateInterviews(currentCandidateId)
								}}
								handleJoinInterviewMeet={handleJoinInterviewMeet}
							/>
						) : (
							<div className='mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5'>
								<p className='text-lg font-bold text-[#0d355b]'>Section bientôt disponible</p>
								<p className='mt-1 text-sm text-[#4f7191]'>Cette section sera activée ensuite.</p>
							</div>
						)}
					</div>
				</main>
			</div>

			<DashboardCandQuizModal
				quizOpen={quizOpen}
				selectedJob={selectedJob}
				quizMeta={quizMeta}
				quizModeLabel={quizModeConfig[quizMode]?.label}
				quizSecondsLeft={quizSecondsLeft}
				quizQuestions={quizQuestions}
				quizAnswers={quizAnswers}
				handleQuizAnswerChange={handleQuizAnswerChange}
				quizError={quizError}
				quizSubmitting={quizSubmitting}
				isApplying={isApplying}
				onClose={handleCloseQuizModal}
				handleSubmitQuizAndApply={handleSubmitQuizAndApply}
			/>

			<div className='fixed bottom-4 left-4 z-40'>
				<button
					type='button'
					onClick={() => setAppFeedbackOpen((prev) => !prev)}
					aria-label='Ouvrir le feedback AIR'
					title='Feedback AIR'
					className='flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#1d4ed8] text-lg font-black text-white shadow-xl transition hover:brightness-110'
				>
					★
				</button>
				{appFeedbackOpen ? (
					<div className='absolute bottom-14 left-0 w-[86vw] max-w-xs rounded-2xl border border-cyan-100 bg-white p-4 shadow-2xl'>
						<div className='flex items-start justify-between gap-2'>
							<div>
								<p className='text-sm font-black text-[#0d355b]'>Votre avis sur AIR</p>
								<p className='mt-1 text-xs text-[#4f7191]'>Moyenne globale: {appFeedbackSummary.averageRating ? `${appFeedbackSummary.averageRating}/5` : '—'} • {appFeedbackSummary.totalFeedbacks} avis</p>
							</div>
							<button type='button' onClick={() => setAppFeedbackOpen(false)} className='rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50'>Fermer</button>
						</div>

						{appFeedbackError ? <div className='mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700'>{appFeedbackError}</div> : null}
						{appFeedbackMessage ? <div className='mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700'>{appFeedbackMessage}</div> : null}

						<form className='mt-3 space-y-3' onSubmit={handleSubmitAppFeedback}>
							<div className='flex items-center gap-2'>
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type='button'
										onClick={() => setAppFeedbackForm((prev) => ({ ...prev, rating: star }))}
										className={`h-9 w-9 rounded-full border text-base transition ${star <= appFeedbackForm.rating ? 'border-amber-300 bg-amber-100 text-amber-600' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
									>
										★
									</button>
								))}
							</div>
							<textarea
								rows={3}
								value={appFeedbackForm.comment}
								onChange={(e) => setAppFeedbackForm((prev) => ({ ...prev, comment: e.target.value }))}
								placeholder='Votre commentaire (optionnel)'
								className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500'
							/>
							<button type='submit' disabled={appFeedbackSaving} className='w-full rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60'>
								{appFeedbackSaving ? 'Envoi...' : 'Envoyer'}
							</button>
						</form>
					</div>
				) : null}
			</div>
		</section>
	)
}

export default DashboardCand