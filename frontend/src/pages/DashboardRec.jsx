import React, { useEffect, useMemo, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import ScoreButton from '../components/ScoreButton'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

// ─── Composant cercle de score ATS ──────────────────────────────────────────
function ScoreRing({ score, size = 88 }) {
	const stroke = 8
	const r = (size - stroke) / 2
	const circ = 2 * Math.PI * r
	const pct = Math.max(0, Math.min(100, score ?? 0))
	const offset = circ * (1 - pct / 100)

	const [ringColor, bgFill, textColor, label] =
		pct >= 70
			? ['#10b981', '#d1fae5', '#065f46', 'Fort']
			: pct >= 40
				? ['#f59e0b', '#fef3c7', '#92400e', 'Moyen']
				: ['#ef4444', '#fee2e2', '#991b1b', 'Faible']

	return (
		<div className='relative flex-shrink-0' style={{ width: size, height: size }}>
			<svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
				<circle cx={size / 2} cy={size / 2} r={r} fill={bgFill} stroke='#e2e8f0' strokeWidth={stroke} />
				<circle
					cx={size / 2} cy={size / 2} r={r}
					fill='none'
					stroke={ringColor}
					strokeWidth={stroke}
					strokeDasharray={circ}
					strokeDashoffset={offset}
					strokeLinecap='round'
				/>
			</svg>
			<div className='absolute inset-0 flex flex-col items-center justify-center' style={{ gap: 0 }}>
				<span style={{ fontSize: 17, fontWeight: 900, color: textColor, lineHeight: 1 }}>{pct}</span>
				<span style={{ fontSize: 8, fontWeight: 700, color: textColor, lineHeight: 1.2 }}>/100</span>
				<span style={{ fontSize: 8, fontWeight: 600, color: textColor, lineHeight: 1.2 }}>{label}</span>
			</div>
		</div>
	)
}

const emptyOfferForm = {
	id: null,
	title: '',
	location: '',
	workMode: 'onsite',
	contractType: '',
	salary: '',
	experienceRequired: '',
	languagesRequired: '',
	technicalSkills: '',
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

const BarChart = ({ values, labels, height = 140 }) => {
	const width = 560
	const padding = { top: 12, right: 12, bottom: 28, left: 28 }
	const v = Array.isArray(values) ? values.map((x) => (Number.isFinite(x) ? x : 0)) : []
	const maxVal = Math.max(1, ...v)
	const innerW = width - padding.left - padding.right
	const innerH = height - padding.top - padding.bottom
	const barW = v.length ? innerW / v.length : innerW

	return (
		<div className='w-full overflow-x-auto'>
			<svg viewBox={`0 0 ${width} ${height}`} className='w-full min-w-[520px]'>
				<line x1={padding.left} y1={padding.top + innerH} x2={width - padding.right} y2={padding.top + innerH} stroke='#e2e8f0' strokeWidth='1' />
				{v.map((val, idx) => {
					const h = (val / maxVal) * innerH
					const x = padding.left + idx * barW + barW * 0.15
					const y = padding.top + innerH - h
					const w = barW * 0.7
					const label = Array.isArray(labels) ? labels[idx] : String(idx)
					return (
						<g key={`bar-${label}`}>
							<rect x={x} y={y} width={w} height={h} rx='4' fill={val > 0 ? '#06d5e0' : '#cbd5e1'} opacity={val > 0 ? 0.9 : 0.55} />
							{idx % 3 === 0 ? (
								<text x={x + w / 2} y={height - 10} textAnchor='middle' fontSize='10' fill='#64748b'>
									{label}
								</text>
							) : null}
						</g>
					)
				})}
			</svg>
		</div>
	)
}

const getQuizReviewSummary = (attempt) => {
	const safeScore = Number.isFinite(attempt?.scorePercent) ? attempt.scorePercent : 0
	if (safeScore >= 85) {
		return {
			gradeLabel: 'Excellent',
			feedback: 'Le candidat maitrise bien les notions du poste.',
			improvement: 'Consolider avec des cas pratiques plus avancés en entretien.',
		}
	}
	if (safeScore >= 65) {
		return {
			gradeLabel: 'Bon',
			feedback: 'Base technique solide avec quelques lacunes ciblées.',
			improvement: 'Creuser les themes en erreur pendant l entretien technique.',
		}
	}
	if (safeScore >= 45) {
		return {
			gradeLabel: 'Moyen',
			feedback: 'Niveau exploitable mais des fondamentaux sont fragiles.',
			improvement: 'Prevoir un test pratique court et des questions de validation des bases.',
		}
	}
	return {
		gradeLabel: 'A renforcer',
		feedback: 'Le candidat est en difficulte sur plusieurs notions essentielles.',
		improvement: 'Demander une remise a niveau sur les sujets manques avant suite du process.',
	}
}

const getOptionTextByKey = (question, key) => {
	const normalized = String(key || '').trim().toLowerCase()
	if (!normalized || normalized === 'none') return 'Aucune reponse'
	const option = (question?.options || []).find((opt) => String(opt?.key || '').trim().toLowerCase() === normalized)
	return option?.text || normalized.toUpperCase()
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
		verificationCode: '',
	})
	const [passwordMessage, setPasswordMessage] = useState('')
	const [passwordError, setPasswordError] = useState('')
	const [savingPassword, setSavingPassword] = useState(false)
	const [sendingPasswordCode, setSendingPasswordCode] = useState(false)
	const [appFeedbackForm, setAppFeedbackForm] = useState({ rating: 0, comment: '' })
	const [appFeedbackSaving, setAppFeedbackSaving] = useState(false)
	const [appFeedbackMessage, setAppFeedbackMessage] = useState('')
	const [appFeedbackError, setAppFeedbackError] = useState('')
	const [appFeedbackSummary, setAppFeedbackSummary] = useState({ averageRating: null, totalFeedbacks: 0 })
	const [appFeedbackOpen, setAppFeedbackOpen] = useState(false)
	const [candidacies, setCandidacies] = useState([])
	const [cvByCandidate, setCvByCandidate] = useState({})
	const [cvDetailsOpenByCandidate, setCvDetailsOpenByCandidate] = useState({})
	const [cvExtractionByCandidate, setCvExtractionByCandidate] = useState({})
	const [cvExtractionLoadingByCandidate, setCvExtractionLoadingByCandidate] = useState({})
	const [cvExtractionErrorByCandidate, setCvExtractionErrorByCandidate] = useState({})
	const [scoresByOffer, setScoresByOffer] = useState({})
	const [scoresLoadingByOffer, setScoresLoadingByOffer] = useState({})
	const [quizReviewState, setQuizReviewState] = useState({
		open: false,
		candidateName: '',
		offerTitle: '',
		attempt: null,
	})
	const [loadingCandidacies, setLoadingCandidacies] = useState(false)
	const [candidaciesError, setCandidaciesError] = useState('')
	const [interviews, setInterviews] = useState([])
	const [interviewReportItems, setInterviewReportItems] = useState([])
	const [interviewReportsLoading, setInterviewReportsLoading] = useState(false)
	const [interviewReportsError, setInterviewReportsError] = useState('')
	const [reportEvalByInterview, setReportEvalByInterview] = useState({})
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

	useEffect(() => {
		const recruiterId = recruiter?.id || recruiter?._id
		if (!recruiterId) return

		let cancelled = false
		const fetchAppFeedback = async () => {
			try {
				const [mineRes, summaryRes] = await Promise.all([
					fetch(`${API_BASE}/app-feedback/mine?userId=${encodeURIComponent(recruiterId)}&userRole=recruiter`),
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
	}, [recruiter?.id, recruiter?._id])

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

			// Déclencher le scoring automatique pour chaque offre
			const uniqueOfferIds = [...new Set(
				(data.candidacies || []).map((c) => {
					const o = c?.jobOfferId
					return typeof o === 'object' ? o?._id : o
				}).filter(Boolean)
			)]
			for (const offerId of uniqueOfferIds) {
				fetchScoresForOffer(offerId)
			}
		} catch (error) {
			setCandidaciesError('Serveur indisponible. Verifiez que le backend tourne.')
			setCandidacies([])
			setCvByCandidate({})
		} finally {
			setLoadingCandidacies(false)
		}
	}

	const fetchRecruiterInterviewReports = async (recruiterId) => {
		if (!recruiterId) return
		setInterviewReportsLoading(true)
		setInterviewReportsError('')
		try {
			const response = await fetch(`${API_BASE}/interviews/recruiter/${recruiterId}/reports`)
			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				setInterviewReportsError(data?.message || 'Impossible de charger les bilans Meet.')
				setInterviewReportItems([])
				return
			}
			const items = Array.isArray(data?.items) ? data.items : []
			setInterviewReportItems(items)
			setReportEvalByInterview((prev) => {
				const next = { ...prev }
				for (const item of items) {
					const interviewId = String(item?.interview?._id || '')
					if (!interviewId) continue
					const report = item?.report || null
					if (!next[interviewId]) {
						next[interviewId] = {
							rating: Number(report?.recruiterEvaluation?.rating || 0),
							comment: String(report?.recruiterEvaluation?.comment || ''),
							saving: false,
							message: '',
							error: '',
						}
					}
				}
				return next
			})
		} catch {
			setInterviewReportsError('Serveur indisponible. Verifiez que le backend tourne.')
			setInterviewReportItems([])
		} finally {
			setInterviewReportsLoading(false)
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
			const response = await fetch(`${API_BASE}/cv/extraction-by-candidate/${candidateId}`)
			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				throw new Error(data?.message || "Impossible de charger l'extraction du CV.")
			}
			const extraction = data?.extraction || {}
			const categories = extraction?.categories && typeof extraction.categories === 'object' ? extraction.categories : null
			setCvExtractionByCandidate((prev) => ({
				...prev,
				[candidateId]: {
					entities: extraction?.rawEntities || {},
					storedCategories: categories,
				},
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

	const fetchScoresForOffer = async (offerId) => {
		if (!offerId || scoresLoadingByOffer[offerId]) return
		setScoresLoadingByOffer((prev) => ({ ...prev, [offerId]: true }))
		try {
			const res = await fetch(`${API_BASE}/candidacies/scores/${offerId}`)
			const data = await res.json().catch(() => ({}))
			if (res.ok && data?.success) {
				const byCandidate = {}
				for (const s of (data.scores || [])) {
					byCandidate[s.candidateId] = s
				}
				setScoresByOffer((prev) => ({ ...prev, [offerId]: byCandidate }))
			}
		} catch {
			// silent
		} finally {
			setScoresLoadingByOffer((prev) => ({ ...prev, [offerId]: false }))
		}
	}

	useEffect(() => {
		if (recruiter?.id) {
			fetchOffers(recruiter.id)
			fetchRecruiterCandidacies(recruiter.id)
			fetchRecruiterInterviewReports(recruiter.id)
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
		const prevCounts = []
		const now = new Date()
		now.setHours(0, 0, 0, 0)

		const countForDay = (day) => {
			const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
			return candidacies.filter((c) => {
				if (!c?.createdAt) return false
				const createdAt = new Date(c.createdAt)
				if (Number.isNaN(createdAt.getTime())) return false
				const createdKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`
				return createdKey === dayKey
			}).length
		}

		for (let i = 6; i >= 0; i -= 1) {
			const day = new Date(now)
			day.setDate(now.getDate() - i)
			const prevDay = new Date(day)
			prevDay.setDate(day.getDate() - 7)

			const count = countForDay(day)
			const prevCount = countForDay(prevDay)

			labels.push(day.toLocaleDateString('fr-FR', { weekday: 'short' }))
			counts.push(count)
			prevCounts.push(prevCount)
		}

		const maxCount = Math.max(1, ...counts, ...prevCounts)
		const chartWidth = 640
		const chartHeight = 180
		const toY = (val) => chartHeight - (val / maxCount) * (chartHeight - 20)
		const pointsData = counts.map((count, idx) => ({
			x: (idx / (counts.length - 1)) * chartWidth,
			y: toY(count),
			value: count,
			label: labels[idx],
		}))
		const prevPointsData = prevCounts.map((count, idx) => ({
			x: (idx / (prevCounts.length - 1)) * chartWidth,
			y: toY(count),
			value: count,
			label: labels[idx],
		}))
		const points = pointsData.map((p) => `${p.x},${p.y}`).join(' ')
		const prevPoints = prevPointsData.map((p) => `${p.x},${p.y}`).join(' ')
		const areaPath = pointsData.length
			? `M ${pointsData.map((p) => `${p.x},${p.y}`).join(' L ')} L ${pointsData.at(-1).x},${chartHeight - 1} L ${pointsData[0].x},${chartHeight - 1} Z`
			: ''

		return {
			labels,
			counts,
			prevCounts,
			maxCount,
			points,
			prevPoints,
			pointsData,
			prevPointsData,
			areaPath,
			chartWidth,
			chartHeight,
		}
	}, [candidacies])

	const recruiterLoginHours = useMemo(() => {
		const counts = Array.from({ length: 24 }, () => 0)
		const labels = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}h`)

		const registerHour = (value) => {
			if (!value) return
			const d = new Date(value)
			if (Number.isNaN(d.getTime())) return
			counts[d.getHours()] += 1
		}

		offers.forEach((o) => registerHour(o?.createdAt || o?.updatedAt))
		candidacies.forEach((c) => registerHour(c?.createdAt || c?.updatedAt))
		interviews.forEach((i) => registerHour(i?.createdAt || i?.scheduledAt))

		return { labels, values: counts }
	}, [offers, candidacies, interviews])

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

		const result = Array.from(groups.values()).sort((a, b) => b.items.length - a.items.length)

		// Trier les candidats de chaque offre par score final décroissant si disponible
		for (const group of result) {
			const offerScores = scoresByOffer[group.offerId]
			if (offerScores && Object.keys(offerScores).length > 0) {
				group.items.sort((a, b) => {
					const idA = typeof a?.candidateId === 'string' ? a.candidateId : a?.candidateId?._id
					const idB = typeof b?.candidateId === 'string' ? b.candidateId : b?.candidateId?._id
					const scoreA = offerScores[idA]?.finalScore ?? -1
					const scoreB = offerScores[idB]?.finalScore ?? -1
					return scoreB - scoreA
				})
			}
		}

		return result
	}, [candidacies, scoresByOffer])

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

	const quizReviewComputed = useMemo(() => {
		const attempt = quizReviewState.attempt
		if (!attempt) return null

		const summary = getQuizReviewSummary(attempt)
		const wrongQuestions = (attempt.questions || []).filter((q) => !q?.isCorrect)
		const weakDomains = Array.from(
			new Set(
				wrongQuestions
					.map((q) => String(q?.domain || '').trim())
					.filter(Boolean)
			)
		)

		return {
			summary,
			wrongQuestionsCount: wrongQuestions.length,
			weakDomains,
		}
	}, [quizReviewState.attempt])

	const handleExportQuizReviewPdf = () => {
		const attempt = quizReviewState.attempt
		if (!attempt) return

		const summary = getQuizReviewSummary(attempt)
		const weakDomains = Array.from(
			new Set(
				(attempt.questions || [])
					.filter((q) => !q?.isCorrect)
					.map((q) => String(q?.domain || '').trim())
					.filter(Boolean)
			)
		)

		const doc = new jsPDF({ unit: 'pt', format: 'a4' })
		const pageHeight = doc.internal.pageSize.getHeight()
		const pageWidth = doc.internal.pageSize.getWidth()
		const margin = 42
		const maxWidth = pageWidth - margin * 2
		let y = 48

		const ensureSpace = (needed = 28) => {
			if (y + needed <= pageHeight - margin) return
			doc.addPage()
			y = 48
		}

		const writeLine = (text, size = 11, style = 'normal', color = [47, 71, 145], spacing = 18) => {
			ensureSpace(spacing)
			doc.setFont('helvetica', style)
			doc.setFontSize(size)
			doc.setTextColor(color[0], color[1], color[2])
			const lines = doc.splitTextToSize(String(text || ''), maxWidth)
			doc.text(lines, margin, y)
			y += Math.max(spacing, lines.length * 14)
		}

		writeLine('Rapport Candidat 360 - Evaluation Quiz', 16, 'bold', [13, 53, 91], 24)
		writeLine(`Date export: ${new Date().toLocaleString('fr-FR')}`, 10, 'normal', [88, 122, 153], 16)
		writeLine(`Candidat: ${quizReviewState.candidateName || 'N/A'}`, 11, 'bold', [16, 59, 98], 18)
		writeLine(`Offre: ${quizReviewState.offerTitle || 'N/A'}`, 11, 'bold', [16, 59, 98], 20)

		writeLine('Synthese RH', 12, 'bold', [13, 53, 91], 20)
		writeLine(`Note globale: ${attempt.scorePercent}%`, 11, 'normal', [53, 89, 120], 16)
		writeLine(`Bonnes reponses: ${attempt.correctAnswers}/${attempt.totalQuestions}`, 11, 'normal', [53, 89, 120], 16)
		writeLine(`Evaluation: ${summary.gradeLabel}`, 11, 'normal', [53, 89, 120], 16)
		writeLine(`Feedback: ${summary.feedback}`, 11, 'normal', [53, 89, 120], 18)
		writeLine(`Axes d amelioration: ${summary.improvement}`, 11, 'normal', [53, 89, 120], 20)
		writeLine(`Domaines faibles: ${weakDomains.join(', ') || 'Aucun axe majeur'}`, 11, 'normal', [53, 89, 120], 22)

		writeLine('Details des reponses', 12, 'bold', [13, 53, 91], 20)
		;(attempt.questions || []).forEach((question, idx) => {
			const selectedKey = String(question?.selectedOptionKey || '').toLowerCase()
			const correctKey = String(question?.correctOptionKey || '').toLowerCase()
			const selectedText = getOptionTextByKey(question, selectedKey)
			const correctText = getOptionTextByKey(question, correctKey)
			const status = question?.isCorrect ? 'CORRECTE' : 'FAUSSE'

			writeLine(`Q${idx + 1}. ${question?.question || 'Question'}`, 11, 'bold', [16, 59, 98], 18)
			writeLine(`Statut: ${status}`, 10, 'bold', question?.isCorrect ? [16, 132, 93] : [185, 28, 28], 16)
			writeLine(`Reponse candidat: ${selectedText}`, 10, 'normal', [53, 89, 120], 16)
			writeLine(`Reponse correcte: ${correctText}`, 10, 'normal', [53, 89, 120], 18)
		})

		const safeCandidate = String(quizReviewState.candidateName || 'candidat').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')
		doc.save(`rapport-quiz-${safeCandidate || 'candidat'}.pdf`)
	}

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
			experienceRequired: offer.experienceRequired || '',
			languagesRequired: offer.languagesRequired || '',
			technicalSkills: offer.technicalSkills || '',
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
				experienceRequired: offerForm.experienceRequired,
				languagesRequired: offerForm.languagesRequired,
				technicalSkills: offerForm.technicalSkills,
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
			const autoLinkGenerated =
				(interviewForm.mode === 'Visio') &&
				!interviewForm.meetingLink.trim() &&
				Boolean(savedInterview?.meetingLink)

			setInterviews((prev) => [nextInterview, ...prev])
			setInterviewMessage(
				autoLinkGenerated
					? 'Entretien planifie avec succes. Lien visio genere automatiquement et candidat notifie.'
					: 'Entretien planifie avec succes. Le candidat a ete notifie.'
			)
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

	const handleJoinInterview = (meetingLink, interviewId) => {
		const raw = String(meetingLink || '').trim()
		if (!raw) return
		const normalizedLink = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
		const displayName = `${recruiter?.firstName || ''} ${recruiter?.lastName || ''}`.trim() || recruiter?.company || 'Recruteur AIR'
		const interviewQuery = interviewId ? `&interviewId=${encodeURIComponent(interviewId)}` : ''
		navigate(`/meet?url=${encodeURIComponent(normalizedLink)}&name=${encodeURIComponent(displayName)}&role=recruteur${interviewQuery}`)
	}

	const updateReportEvalField = (interviewId, field, value) => {
		setReportEvalByInterview((prev) => ({
			...prev,
			[interviewId]: {
				rating: Number(prev?.[interviewId]?.rating || 0),
				comment: String(prev?.[interviewId]?.comment || ''),
				saving: Boolean(prev?.[interviewId]?.saving),
				message: String(prev?.[interviewId]?.message || ''),
				error: String(prev?.[interviewId]?.error || ''),
				[field]: value,
			},
		}))
	}

	const handleGenerateMeetReport = async (interviewId) => {
		if (!interviewId) return
		setInterviewReportsError('')
		try {
			const response = await fetch(`${API_BASE}/interviews/${encodeURIComponent(interviewId)}/report/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			})
			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				setInterviewReportsError(data?.message || 'Impossible de generer le bilan Meet.')
				return
			}
			const recruiterId = recruiter?.id || recruiter?._id
			if (recruiterId) await fetchRecruiterInterviewReports(recruiterId)
		} catch {
			setInterviewReportsError('Serveur indisponible. Verifiez que le backend tourne.')
		}
	}

	const handleSaveMeetEvaluation = async (interviewId) => {
		if (!interviewId) return
		const recruiterId = recruiter?.id || recruiter?._id
		const state = reportEvalByInterview?.[interviewId] || {}
		const rating = Number(state?.rating)
		const comment = String(state?.comment || '')

		if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
			updateReportEvalField(interviewId, 'error', 'Choisissez une note entre 1 et 5 etoiles.')
			return
		}

		setReportEvalByInterview((prev) => ({
			...prev,
			[interviewId]: {
				...(prev?.[interviewId] || {}),
				saving: true,
				message: '',
				error: '',
			},
		}))

		try {
			const response = await fetch(`${API_BASE}/interviews/${encodeURIComponent(interviewId)}/report/evaluation`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ recruiterId, rating, comment }),
			})
			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				setReportEvalByInterview((prev) => ({
					...prev,
					[interviewId]: {
						...(prev?.[interviewId] || {}),
						saving: false,
						error: data?.message || 'Impossible d enregistrer l evaluation.',
						message: '',
					},
				}))
				return
			}
			setReportEvalByInterview((prev) => ({
				...prev,
				[interviewId]: {
					...(prev?.[interviewId] || {}),
					saving: false,
					message: 'Evaluation enregistree.',
					error: '',
				},
			}))
			if (recruiterId) await fetchRecruiterInterviewReports(recruiterId)
		} catch {
			setReportEvalByInterview((prev) => ({
				...prev,
				[interviewId]: {
					...(prev?.[interviewId] || {}),
					saving: false,
					error: 'Serveur indisponible. Verifiez que le backend tourne.',
					message: '',
				},
			}))
		}
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

		if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || !passwordForm.verificationCode) {
			setPasswordError('Tous les champs, y compris le code de verification, sont requis.')
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
					verificationCode: passwordForm.verificationCode,
				}),
			})

			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				setPasswordError(data?.message || 'Impossible de mettre a jour le mot de passe.')
				return
			}

			setPasswordMessage(data?.message || 'Mot de passe mis a jour avec succes.')
			setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '', verificationCode: '' })
		} catch {
			setPasswordError('Serveur indisponible. Verifiez que le backend tourne.')
		} finally {
			setSavingPassword(false)
		}
	}

	const handleRequestPasswordCode = async () => {
		setPasswordError('')
		setPasswordMessage('')
		const recruiterId = recruiter?.id || recruiter?._id
		if (!recruiterId) {
			setPasswordError('Session recruteur invalide. Reconnectez-vous.')
			return
		}

		setSendingPasswordCode(true)
		try {
			const response = await fetch(`${API_BASE}/recruiters/${recruiterId}/password/otp/request`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			})
			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				setPasswordError(data?.message || 'Impossible d envoyer le code de verification.')
				return
			}
			setPasswordMessage(data?.message || 'Code de verification envoye par email.')
		} catch {
			setPasswordError('Serveur indisponible. Verifiez que le backend tourne.')
		} finally {
			setSendingPasswordCode(false)
		}
	}

	const handleSubmitAppFeedback = async (e) => {
		e.preventDefault()
		setAppFeedbackError('')
		setAppFeedbackMessage('')

		const recruiterId = recruiter?.id || recruiter?._id
		if (!recruiterId) {
			setAppFeedbackError('Session recruteur invalide. Reconnectez-vous.')
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
					userId: recruiterId,
					userRole: 'recruiter',
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

	const extractionLabelMap = {
		Name: 'Nom',
		Nom: 'Nom',
		Email: 'Email',
		'Email Address': 'Email',
		Phone: 'Telephone',
		'Telephone': 'Telephone',
		Phone_Number: 'Telephone',
		'Phone Number': 'Telephone',
		Designation: 'Poste',
		Years_of_Experience: 'Annees d experience',
		'Years of Experience': 'Annees d experience',
		Skills: 'Competences',
		Competences: 'Competences',
		Graduation_Year: 'Annee diplome',
		'Graduation Year': 'Annee diplome',
		Companies_worked_at: 'Entreprises',
		'Companies worked at': 'Entreprises',
		College_Name: 'Etablissement',
		'College Name': 'Etablissement',
		LinkedIn: 'LinkedIn',
		GitHub: 'GitHub',
		Certificate: 'Certifications',
		Certifications: 'Certifications',
		certifications: 'Certifications',
		yearsOfExperience: 'Annees d experience',
		experiences: 'Experiences',
		skills: 'Competences',
		education: 'Formation',
		projects: 'Projets',
		languages: 'Langues',
		locations: 'Localisation',
		links: 'Liens',
	}

	const getExtractionLabel = (label) => extractionLabelMap[label] || String(label || '').replace(/_/g, ' ')

	const normalizeExtractionText = (value) =>
		String(value || '')
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[_-]+/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()

	const toUniqueExtractionValues = (values) => {
		const base = Array.isArray(values) ? values : [values]
		return Array.from(
			new Set(
				base
					.map((item) => String(item || '').trim())
					.filter(Boolean)
			)
		)
	}

	const collectValuesByAliases = (source, aliases) => {
		const normalizedAliases = (Array.isArray(aliases) ? aliases : [])
			.map((alias) => normalizeExtractionText(alias))
			.filter(Boolean)

		const merged = []
		for (const [rawLabel, rawValues] of Object.entries(source || {})) {
			const normalizedLabel = normalizeExtractionText(rawLabel)
			const isMatch = normalizedAliases.some((alias) => normalizedLabel === alias || normalizedLabel.includes(alias) || alias.includes(normalizedLabel))
			if (!isMatch) continue
			merged.push(...toUniqueExtractionValues(rawValues))
		}

		return toUniqueExtractionValues(merged)
	}

	const collectPatternMatches = (source, pattern) => {
		if (!(pattern instanceof RegExp)) return []
		const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
		const matcher = new RegExp(pattern.source, flags)
		const collected = []

		for (const rawValues of Object.values(source || {})) {
			for (const value of toUniqueExtractionValues(rawValues)) {
				const matches = String(value).match(matcher)
				if (matches?.length) collected.push(...matches)
			}
		}

		return toUniqueExtractionValues(collected)
	}

	const normalizeSocialUrl = (value) => {
		const raw = String(value || '').trim().replace(/[),.;]+$/, '')
		if (!raw) return ''
		if (/^https?:\/\//i.test(raw)) return raw
		if (/^(?:www\.)?linkedin\.com\//i.test(raw) || /^(?:www\.)?github\.com\//i.test(raw)) return `https://${raw}`
		return raw
	}

	const extractFocusedCvEntries = (extractionSource) => {
		const source = extractionSource && typeof extractionSource === 'object' ? extractionSource : {}
		const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
		const phonePattern = /(?:\+?\d[\d\s().-]{7,}\d)/g
		const linkedInPattern = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s<>"')]+/gi
		const githubPattern = /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s<>"')]+/gi

		const emails = toUniqueExtractionValues([
			...collectValuesByAliases(source, ['email', 'mail']),
			...collectPatternMatches(source, emailPattern),
		])

		const phones = toUniqueExtractionValues([
			...collectValuesByAliases(source, ['phone', 'telephone', 'tel', 'mobile']),
			...collectPatternMatches(source, phonePattern),
		]).filter((value) => String(value).replace(/\D/g, '').length >= 8)

		const locations = toUniqueExtractionValues(collectValuesByAliases(source, ['location', 'localisation', 'city', 'country', 'address', 'adresse']))

		const linkedin = toUniqueExtractionValues([
			...collectValuesByAliases(source, ['linkedin']),
			...collectPatternMatches(source, linkedInPattern),
		])
			.map(normalizeSocialUrl)
			.filter((value) => /linkedin\.com/i.test(value))

		const github = toUniqueExtractionValues([
			...collectValuesByAliases(source, ['github']),
			...collectPatternMatches(source, githubPattern),
		])
			.map(normalizeSocialUrl)
			.filter((value) => /github\.com/i.test(value))

		const removeContactNoise = (value) => {
			const raw = String(value || '').trim()
			if (!raw) return false
			if (/https?:\/\//i.test(raw)) return false
			if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(raw)) return false
			return true
		}

		const skills = toUniqueExtractionValues(
			collectValuesByAliases(source, ['skills', 'skill', 'competences', 'competence', 'technologies', 'technical skills'])
		).filter(removeContactNoise)

		const certifications = toUniqueExtractionValues(
			collectValuesByAliases(source, ['certifications', 'certification', 'certificate', 'certificat', 'certificats'])
		).filter(removeContactNoise)

		return [
			['Email', emails],
			['Telephone', phones],
			['Localisation', locations],
			['LinkedIn', linkedin],
			['GitHub', github],
			['Competences', skills],
			['Certifications', certifications],
		].filter(([, values]) => Array.isArray(values) && values.length > 0)
	}

	const normalizeOfferSectionTitle = (rawTitle) => {
		const normalized = String(rawTitle || '')
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.trim()

		if (normalized.includes('experience')) return 'Experience'
		if (normalized.includes('mission') || normalized.includes('responsabilite') || normalized.includes('tache')) return 'Missions'
		if (normalized.includes('competence') || normalized.includes('skill') || normalized.includes('stack')) return 'Competences'
		if (normalized.includes('langue') || normalized.includes('language')) return 'Langues'
		if (normalized.includes('profil') || normalized.includes('candidat')) return 'Profil'
		if (normalized.includes('avantage') || normalized.includes('benefice')) return 'Avantages'
		if (normalized.includes('formation') || normalized.includes('diplome') || normalized.includes('education')) return 'Formation'

		return String(rawTitle || 'Details').trim()
	}

	const parseOfferDescriptionSections = (rawDescription) => {
		const text = String(rawDescription || '').replace(/\r/g, '').trim()
		if (!text) return []

		const headingRegex = /(?:^|\n)\s*([A-Za-z0-9'\-\s\/]{2,40})\s*:\s*/g
		const headingMatches = Array.from(text.matchAll(headingRegex))

		if (headingMatches.length === 0) {
			return [
				{
					title: 'Description',
					items: [text],
				},
			]
		}

		const sections = []

		headingMatches.forEach((match, index) => {
			const title = normalizeOfferSectionTitle(match[1])
			const start = (match.index || 0) + match[0].length
			const end = index + 1 < headingMatches.length ? headingMatches[index + 1].index || text.length : text.length
			const sectionBody = text.slice(start, end).trim()
			if (!sectionBody) return

			const items = sectionBody
				.split(/\n|•|;|\u2022/g)
				.map((item) => item.trim())
				.filter(Boolean)

			sections.push({
				title,
				items: items.length > 0 ? items : [sectionBody],
			})
		})

		return sections.length > 0
			? sections
			: [
					{
						title: 'Description',
						items: [text],
					},
				]
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
			<div className='flex min-h-screen w-full'>
				<aside className='w-[286px] shrink-0 bg-gradient-to-b from-[#051a3d] via-[#072a56] to-[#083d69] px-4 py-6 text-white'>
					<div className='mb-2 flex items-center justify-center px-2'>
						<button
							type='button'
							onClick={() => navigate('/')}
							className='cursor-pointer'
							aria-label='Aller a l accueil'
						>
							<img src={assets.logo} alt='AIR logo' className='h-28 w-auto object-contain' />
						</button>
					</div>

					<div className='flex items-center gap-3'>
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
								<span className='truncate text-xs text-cyan-100/90'>Recruteur - {recruiter.company}</span>
								<span className='shrink-0 rounded-full bg-cyan-100 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide text-[#045d7a]'>
									Recruteur
								</span>
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
						<div className='flex flex-wrap items-start justify-between gap-4'>
							<p style={{ fontFamily: "'Jost', sans-serif" }} className='text-4xl font-black text-[#000000]'>Bienvenue 👋</p>
							<div className='flex items-center gap-3'>
								<span className='inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-[#0a5f88]'>
									<span className='h-2 w-2 animate-pulse rounded-full bg-[#06d5e0]' />
									{formattedTime}
								</span>
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
									<div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_34px_rgba(8,51,93,0.07),0_0_0_1px_rgba(14,165,233,0.28),0_0_22px_rgba(6,182,212,0.24)]'>
										<div className='h-1.5 bg-gradient-to-r from-[#0ea5e9] via-[#06b6d4] to-[#1d4ed8]' />
										<div className='p-4'>
											<p className='text-[11px] font-black uppercase tracking-[0.16em] text-[#5b7f9d]'>Offres publiees</p>
											<div className='mt-2 flex items-end justify-between gap-3'>
												<p className='text-3xl font-black text-slate-900'>{stats.total}</p>
												<span className='rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700'>Actives</span>
											</div>
										</div>
									</div>
									<div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_34px_rgba(8,51,93,0.07),0_0_0_1px_rgba(14,165,233,0.28),0_0_22px_rgba(6,182,212,0.24)]'>
										<div className='h-1.5 bg-gradient-to-r from-[#1d4ed8] via-[#0ea5e9] to-[#06b6d4]' />
										<div className='p-4'>
											<p className='text-[11px] font-black uppercase tracking-[0.16em] text-[#5b7f9d]'>Candidatures recues</p>
											<div className='mt-2 flex items-end justify-between gap-3'>
												<p className='text-3xl font-black text-slate-900'>{stats.candidacies}</p>
											</div>
										</div>
									</div>
								</div>

								<div className='grid gap-4 xl:grid-cols-[1.35fr_1fr]'>
									<div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_38px_rgba(8,51,93,0.08),0_0_0_1px_rgba(14,165,233,0.3),0_0_24px_rgba(29,78,216,0.2)]'>
										<div className='h-1 bg-gradient-to-r from-[#0ea5e9] via-[#06b6d4] to-[#1d4ed8]' />
										<div className='p-4'>
											<div className='mb-3 flex items-start justify-between gap-3'>
												<div>
													<p className='text-[11px] font-black uppercase tracking-[0.16em] text-[#5b7f9d]'>Performance</p>
													<h2 className='mt-1 text-lg font-black text-[#0d355b]'>Courbe des candidatures recues</h2>
													<p className='mt-1 text-xs text-[#4f7191]'>Evolution sur 7 jours avec comparaison semaine precedente.</p>
												</div>
													<div className='flex items-center gap-3 text-[11px] font-semibold text-slate-600'>
														<span className='inline-flex items-center gap-1.5'>
															<span className='h-2.5 w-2.5 rounded-full bg-cyan-500' />
															Cette semaine
														</span>
														<span className='inline-flex items-center gap-1.5'>
															<span className='h-2.5 w-2.5 rounded-full border border-blue-400 bg-blue-100' />
															Semaine precedente
														</span>
													</div>
											</div>

										<div className='overflow-x-auto rounded-2xl border border-cyan-100 bg-gradient-to-b from-[#f7fcff] to-white p-3'>
											<svg
												viewBox={`0 0 ${candidaciesTrend.chartWidth} ${candidaciesTrend.chartHeight}`}
												className='h-[185px] w-full min-w-[520px]'
												preserveAspectRatio='none'
											>
												<defs>
													<linearGradient id='recCandLine' x1='0' y1='0' x2='1' y2='0'>
														<stop offset='0%' stopColor='#0ea5e9' />
														<stop offset='100%' stopColor='#1d4ed8' />
													</linearGradient>
													<linearGradient id='recCandArea' x1='0' y1='0' x2='0' y2='1'>
														<stop offset='0%' stopColor='#06b6d4' stopOpacity='0.28' />
														<stop offset='100%' stopColor='#06b6d4' stopOpacity='0.02' />
													</linearGradient>
												</defs>
												<line x1='0' y1={candidaciesTrend.chartHeight - 1} x2={candidaciesTrend.chartWidth} y2={candidaciesTrend.chartHeight - 1} stroke='#d7e9f8' strokeWidth='1.5' />
												{candidaciesTrend.areaPath ? <path d={candidaciesTrend.areaPath} fill='url(#recCandArea)' /> : null}
												<polyline
													fill='none'
													stroke='#7dd3fc'
													strokeWidth='2.5'
													strokeDasharray='5 4'
													strokeLinecap='round'
													strokeLinejoin='round'
													points={candidaciesTrend.prevPoints}
												/>
												<polyline
													fill='none'
													stroke='url(#recCandLine)'
													strokeWidth='3.5'
													strokeLinecap='round'
													strokeLinejoin='round'
													points={candidaciesTrend.points}
												/>
												{candidaciesTrend.prevPointsData.map((p, idx) => (
													<circle key={`prev-${candidaciesTrend.labels[idx]}-${idx}`} cx={p.x} cy={p.y} r='3.2' fill='#dbeafe' stroke='#60a5fa' strokeWidth='1.5'>
														<title>{`${p.label}: ${p.value} candidature(s) - semaine precedente`}</title>
													</circle>
												))}
												{candidaciesTrend.pointsData.map((p, idx) => (
													<circle key={`${candidaciesTrend.labels[idx]}-${idx}`} cx={p.x} cy={p.y} r='4.5' fill='#ffffff' stroke='#0ea5e9' strokeWidth='2.5'>
														<title>{`${p.label}: ${p.value} candidature(s) - cette semaine`}</title>
													</circle>
												))}
											</svg>

											<div className='mt-3 grid grid-cols-7 gap-1.5'>
												{candidaciesTrend.labels.map((label, idx) => (
													<div key={`${label}-${idx}`} className='text-center'>
														<p className='text-[10px] font-semibold uppercase text-[#5b7f9d]'>{label}</p>
														<p className='text-xs font-black text-[#0d355b]'>{candidaciesTrend.counts[idx]}</p>
													</div>
												))}
											</div>
										</div>
										</div>
									</div>

									<div className='rounded-2xl border border-[#d7e9f8] bg-[#fbfdff] p-4 shadow-[0_0_0_1px_rgba(14,165,233,0.28),0_10px_26px_rgba(14,165,233,0.14),0_0_20px_rgba(6,182,212,0.2)]'>
										<div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
											<div>
												<h2 className='text-lg font-black text-[#0d355b]'>Calendrier des rendez-vous</h2>
												<p className='mt-1 text-xs text-[#4f7191]'>Dates colorees = rendez-vous.</p>
											</div>
											<div className='flex items-center gap-1.5'>
												<button
													type='button'
													onClick={goToPreviousMonth}
													className='rounded-lg border border-cyan-300 bg-white px-2.5 py-1 text-sm font-semibold text-[#0a5f88] transition hover:bg-cyan-50'
												>
													←
												</button>
												<span className='min-w-[140px] text-center text-xs font-bold text-[#103b62]'>{calendarTitle}</span>
												<button
													type='button'Candidats par offre

													onClick={goToNextMonth}
													className='rounded-lg border border-cyan-300 bg-white px-2.5 py-1 text-sm font-semibold text-[#0a5f88] transition hover:bg-cyan-50'
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

								<div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_0_0_1px_rgba(14,165,233,0.28),0_10px_26px_rgba(14,165,233,0.14),0_0_20px_rgba(6,182,212,0.2)]'>
									<div className='flex flex-wrap items-end justify-between gap-2'>
										<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>HISTOGRAMME: HEURES DE CONNEXION</p>
										<p className='text-xs font-semibold text-slate-500'>Activites enregistrees par heure</p>
									</div>
									<div className='mt-3'>
										<BarChart values={recruiterLoginHours.values} labels={recruiterLoginHours.labels} />
									</div>
								</div>

								<div className='rounded-2xl border border-slate-200 bg-[#fbfdff] p-5 shadow-[0_0_0_1px_rgba(14,165,233,0.28),0_10px_26px_rgba(14,165,233,0.14),0_0_20px_rgba(6,182,212,0.2)]'>
									<div className='flex flex-wrap items-center justify-between gap-3'>
										<h2 className='text-xl font-black text-[#0d355b]'>Dernieres offres</h2>
										<button
											type='button'
											onClick={() => setSelectedView('offers')}
											className='rounded-xl border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-[#0a5f88] transition hover:bg-cyan-50'
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
															className='rounded-lg border border-cyan-300 bg-white px-3 py-1 text-xs font-semibold text-[#0a5f88] transition hover:bg-cyan-50'
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
								<div className='overflow-hidden rounded-2xl border border-cyan-100 bg-[#fbfdff] p-5 shadow-[0_0_0_1px_rgba(14,165,233,0.28),0_10px_26px_rgba(14,165,233,0.14),0_0_20px_rgba(6,182,212,0.2)]'>
									<div className='-mx-5 -mt-5 mb-4 h-1 bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#1d4ed8]' />
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
										<input
											className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500'
											placeholder='Experience requise (ex: 2+ ans en dev web)'
											value={offerForm.experienceRequired}
											onChange={(e) => updateOfferField('experienceRequired', e.target.value)}
										/>
										<input
											className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500'
											placeholder='Langues et niveau (ex: Francais C1, Anglais B2)'
											value={offerForm.languagesRequired}
											onChange={(e) => updateOfferField('languagesRequired', e.target.value)}
										/>
										<input
											className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500'
											placeholder='Competences techniques (ex: React, Node.js, Python)'
											value={offerForm.technicalSkills}
											onChange={(e) => updateOfferField('technicalSkills', e.target.value)}
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
												className='rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'
											>
												{savingOffer ? 'Enregistrement...' : offerForm.id ? 'Enregistrer la modification' : 'Publier l\'offre'}
											</button>
											{offerForm.id ? (
												<button
													type='button'
													onClick={resetOfferForm}
													className='rounded-xl border border-cyan-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#0a5f88] transition hover:bg-cyan-50'
												>
													Annuler
												</button>
											) : null}
										</div>
									</form>
								</div>

								<div className='overflow-hidden rounded-2xl border border-cyan-100 bg-[#fbfdff] p-5 shadow-[0_0_0_1px_rgba(14,165,233,0.28),0_10px_26px_rgba(14,165,233,0.14),0_0_20px_rgba(6,182,212,0.2)]'>
									<div className='-mx-5 -mt-5 mb-4 h-1 bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#1d4ed8]' />
									<h2 className='text-xl font-black text-[#0d355b]'>Offres publiees</h2>
									<p className='mt-1 text-sm text-[#4f7191]'>Vous pouvez voir, modifier et supprimer vos offres.</p>

									{loadingOffers ? <p className='mt-4 text-sm text-[#4f7191]'>Chargement des offres...</p> : null}
									{!loadingOffers && offers.length === 0 ? (
										<p className='mt-4 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-[#4f7191]'>Aucune offre pour le moment.</p>
									) : null}

									{!loadingOffers && offers.length > 0 ? (
										<div className='mt-4 space-y-3'>
											{offers.map((offer) => {
												const descriptionSections = parseOfferDescriptionSections(offer.description)
												return (
												<div key={offer._id} className='rounded-xl border border-cyan-100 bg-gradient-to-br from-[#f8fdff] via-white to-[#f3fbff] p-3 shadow-[0_0_0_1px_rgba(14,165,233,0.12)]'>
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

													<div className='mt-3 grid gap-2 sm:grid-cols-3'>
														{offer.experienceRequired ? (
															<div className='rounded-lg border border-cyan-100 bg-white/80 px-2.5 py-2'>
																<p className='text-[10px] font-black uppercase tracking-[0.08em] text-[#5b7f9d]'>Experience</p>
																<p className='mt-1 text-xs font-semibold text-[#1d486f]'>{offer.experienceRequired}</p>
															</div>
														) : null}
														{offer.languagesRequired ? (
															<div className='rounded-lg border border-cyan-100 bg-white/80 px-2.5 py-2'>
																<p className='text-[10px] font-black uppercase tracking-[0.08em] text-[#5b7f9d]'>Langues</p>
																<p className='mt-1 text-xs font-semibold text-[#1d486f]'>{offer.languagesRequired}</p>
															</div>
														) : null}
														{offer.technicalSkills ? (
															<div className='rounded-lg border border-cyan-100 bg-white/80 px-2.5 py-2'>
																<p className='text-[10px] font-black uppercase tracking-[0.08em] text-[#5b7f9d]'>Competences</p>
																<p className='mt-1 text-xs font-semibold text-[#1d486f]'>{offer.technicalSkills}</p>
															</div>
														) : null}
													</div>

													<div className='mt-3 space-y-2'>
														{descriptionSections.map((section, sectionIdx) => (
															<div key={`${offer._id}-${section.title}-${sectionIdx}`} className='rounded-lg border border-[#dceef9] bg-white px-3 py-2'>
																<p className='text-[11px] font-black uppercase tracking-[0.1em] text-[#4d7597]'>{section.title}</p>
																{section.items.length > 1 ? (
																	<ul className='mt-1.5 list-disc space-y-1 pl-4'>
																		{section.items.map((item, itemIdx) => (
																			<li key={`${offer._id}-${section.title}-${sectionIdx}-item-${itemIdx}`} className='text-xs text-[#355978]'>
																				{item}
																			</li>
																		))}
																	</ul>
																) : (
																	<p className='mt-1.5 text-xs text-[#355978]'>{section.items[0]}</p>
																)}
															</div>
														))}
													</div>
													<div className='mt-3 flex gap-2'>
														<button
															type='button'
															onClick={() => handleEditOffer(offer)}
															className='rounded-lg border border-cyan-300 bg-white px-3 py-1 text-xs font-semibold text-[#046595] hover:bg-cyan-50'
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
											)
										})}
										</div>
									) : null}
								</div>
							</div>
						) : selectedView === 'candidates' ? (
							<div className='mt-8 rounded-2xl border border-slate-200 bg-[#fbfdff] p-5 shadow-[0_0_0_1px_rgba(14,165,233,0.28),0_10px_26px_rgba(14,165,233,0.14),0_0_20px_rgba(6,182,212,0.2)]'>
								<div className='flex flex-wrap items-center justify-between gap-3'>
									<div>
										<h2 className='text-xl font-black text-[#0d355b]'>Candidats par offre</h2>
										<p className='mt-1 text-sm text-[#4f7191]'>Retrouvez les candidats qui ont postule a vos offres.</p>
									</div>
									<button
										type='button'
										onClick={() => recruiter?.id && fetchRecruiterCandidacies(recruiter.id)}
										className='rounded-xl border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-[#0a5f88] transition hover:bg-cyan-50'
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
											<div key={group.offerId} className='overflow-hidden rounded-2xl border border-cyan-100 bg-white p-4 shadow-[0_0_0_1px_rgba(14,165,233,0.2),0_10px_24px_rgba(14,165,233,0.12)]'>
												<div className='-mx-4 -mt-4 mb-3 h-1 bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#1d4ed8]' />
												<div className='mb-3 flex items-center justify-between gap-2'>
													<h3 className='text-base font-black text-[#103b62]'>{group.offerTitle}</h3>
													<div className='flex items-center gap-2'>
														<span className='rounded-full bg-cyan-100 px-2 py-1 text-[11px] font-semibold text-[#0a6a8f]'>
															{group.items.length} candidature{group.items.length > 1 ? 's' : ''}
														</span>
														<button
															type='button'
															onClick={() => fetchScoresForOffer(group.offerId)}
															disabled={scoresLoadingByOffer[group.offerId]}
															className='rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50'
														>
															{scoresLoadingByOffer[group.offerId] ? 'Calcul...' : '🎯 Scorer les candidats'}
														</button>
													</div>
												</div>
												<div className='space-y-2'>
													{group.items.map((candidacy) => {
														const cand = candidacy?.candidateId || {}
														const candidateId = typeof candidacy?.candidateId === 'string' ? candidacy?.candidateId : candidacy?.candidateId?._id
														const cvInfo = candidateId ? cvByCandidate[candidateId] : null
																const extraction = candidateId ? cvExtractionByCandidate[candidateId] : null
																const extractionSources = [
																	extraction?.entities && typeof extraction.entities === 'object' ? extraction.entities : {},
																	extraction?.storedCategories && typeof extraction.storedCategories === 'object' ? extraction.storedCategories : {},
																]
																const extractionSource = extractionSources.reduce((acc, source) => {
																	for (const [label, values] of Object.entries(source)) {
																		const normalizedValues = toUniqueExtractionValues(values)
																		if (!acc[label]) acc[label] = []
																		acc[label].push(...normalizedValues)
																		acc[label] = toUniqueExtractionValues(acc[label])
																	}
																	return acc
																}, {})
																const extractionEntries = extractFocusedCvEntries(extractionSource)
																const extractionValuesCount = extractionEntries.reduce((acc, [, values]) => acc + values.length, 0)
																		const quizAttempt = candidacy?.quizAttemptId && typeof candidacy.quizAttemptId === 'object' ? candidacy.quizAttemptId : null
																		const quizScore = Number.isFinite(quizAttempt?.scorePercent) ? quizAttempt.scorePercent : null
														const fullName = `${cand.firstName || ''} ${cand.lastName || ''}`.trim() || 'Candidat'
														const appliedAt = candidacy?.createdAt ? new Date(candidacy.createdAt).toLocaleDateString() : 'N/A'
														return (
															<div key={candidacy._id} className='rounded-xl border border-cyan-100 bg-gradient-to-br from-[#f8fdff] via-white to-[#f3fbff] p-3 shadow-[0_0_0_1px_rgba(14,165,233,0.12)]'>
																{/* Score ATS */}
																{(() => {
																	const sd = scoresByOffer[group.offerId]?.[candidateId]
																	if (!sd) return null
																	const bars = [
																		{ label: 'Match CV', val: sd.matchCvScore, color: '#6366f1' },
																		{ label: 'Quiz',     val: sd.quizScore,    color: '#0ea5e9' },
																		{ label: 'Skills',   val: sd.skillsScore,  color: '#10b981' },
																		{ label: 'Exp.',     val: sd.experienceScore, color: '#f59e0b' },
																		{ label: 'Certif',   val: sd.certifScore,  color: '#8b5cf6' },
																	]
																	return (
																		<div className='mb-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5'>
																			<ScoreRing score={sd.finalScore} />
																			<div className='min-w-0 flex-1'>
																				<p className='mb-1.5 text-[11px] font-black uppercase tracking-wide text-[#4c7b9e]'>Score ATS</p>
																				{bars.map(({ label, val, color }) => (
																					<div key={label} className='mb-1 flex items-center gap-1.5'>
																						<span className='w-12 flex-shrink-0 text-[10px] font-semibold text-[#6b8cad]'>{label}</span>
																						<div className='h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100'>
																							<div className='h-full rounded-full transition-all' style={{ width: `${Math.max(0, Math.min(100, val))}%`, background: color }} />
																						</div>
																						<span className='w-7 flex-shrink-0 text-right text-[10px] font-bold' style={{ color }}>{val}%</span>
																					</div>
																				))}
																				{sd.detectedEducationLevel ? (
																					<p className='mt-1 text-[10px] text-[#7a9ab8]'>
																						Formation: <span className='font-semibold text-[#1d486f]'>{sd.detectedEducationLevel}</span>
																						{sd.matchedCertifs?.length > 0 ? ` · ${sd.matchedCertifs.slice(0, 2).join(', ')}` : ''}
																						{sd.bonus > 0 ? <span className='ml-1 text-emerald-600'>+{sd.bonus} bonus</span> : null}
																						{sd.penalty > 0 ? <span className='ml-1 text-rose-500'>−{sd.penalty} malus</span> : null}
																					</p>
																				) : null}
																			</div>
																		</div>
																	)
																})()}
																<div className='flex flex-wrap items-start justify-between gap-2'>
																	<p className='text-sm font-bold text-[#103b62]'>{fullName}</p>
																	<button
																		type='button'
																		onClick={() => handlePrefillInterview(group.offerId, candidateId, fullName, cand.email || '')}
																		className='rounded-md border border-cyan-300 bg-white px-2 py-1 text-xs font-semibold text-[#0a5f88] transition hover:bg-cyan-50'
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
																{quizAttempt ? (
																	<div className='mt-2 flex flex-wrap items-center gap-2'>
																		<span className='rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-[11px] font-semibold text-cyan-800'>
																			Quiz: {quizAttempt.correctAnswers}/{quizAttempt.totalQuestions} ({quizScore}%)
																		</span>
																	</div>
																) : null}
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
																		{quizAttempt ? (
																			<button
																				type='button'
																				onClick={() =>
																					setQuizReviewState({
																						open: true,
																						candidateName: fullName,
																						offerTitle: group.offerTitle,
																						attempt: quizAttempt,
																					})
																				}
																				className='rounded-md border border-indigo-300 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100'
																			>
																				Voir réponses quiz
																			</button>
																		) : null}
																	</div>
																) : (
																	<p className='mt-2 text-xs text-[#8aa3b9]'>CV non disponible</p>
																)}
																{!cvInfo?.hasCv && quizAttempt ? (
																	<div className='mt-2'>
																		<button
																			type='button'
																			onClick={() =>
																				setQuizReviewState({
																					open: true,
																					candidateName: fullName,
																					offerTitle: group.offerTitle,
																					attempt: quizAttempt,
																				})
																			}
																			className='rounded-md border border-indigo-300 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100'
																		>
																			Voir réponses quiz
																		</button>
																	</div>
																) : null}
																				{cvInfo?.hasCv && cvDetailsOpenByCandidate[candidateId] ? (
																					<div className='mt-3 overflow-hidden rounded-xl border border-[#cce6f6] bg-gradient-to-br from-[#f7fcff] via-[#eef8ff] to-[#f4fbff]'>
																						<div className='border-b border-[#d9edf9] bg-white/60 px-3 py-2.5'>
																							<div className='flex flex-wrap items-center justify-between gap-2'>
																								<div>
																									<p className='text-[11px] font-bold uppercase tracking-wide text-[#4c7b9e]'>Analyse CV</p>
																									<p className='text-sm font-black text-[#0d3d63]'>{cvInfo.fileName || 'CV'}</p>
																								</div>
																								<div className='flex flex-wrap gap-1.5'>
																									<span className='rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700'>
																										{cvInfo.source === 'generated' ? 'CV Genere' : 'CV Uploade'}
																									</span>
																									<span className='rounded-full border border-[#d9eaf7] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#4f7191]'>
																										Maj: {cvInfo.updatedAt ? new Date(cvInfo.updatedAt).toLocaleDateString() : 'N/A'}
																									</span>
																								</div>
																							</div>
																						</div>

																						<div className='grid gap-3 p-3 lg:grid-cols-[220px_1fr]'>
																							<div className='space-y-2 rounded-lg border border-[#d5e9f8] bg-white p-2.5'>
																								<p className='text-[11px] font-bold uppercase tracking-wide text-[#5b7f9d]'>Meta</p>
																								<p className='text-[12px] text-[#3e6282]'>Cree: <span className='font-semibold'>{cvInfo.createdAt ? new Date(cvInfo.createdAt).toLocaleDateString() : 'N/A'}</span></p>
																								<p className='text-[12px] text-[#3e6282]'>Mise a jour: <span className='font-semibold'>{cvInfo.updatedAt ? new Date(cvInfo.updatedAt).toLocaleDateString() : 'N/A'}</span></p>
																								<p className='text-[12px] text-[#3e6282]'>Source: <span className='font-semibold'>{cvInfo.source === 'generated' ? 'Generation' : 'Upload'}</span></p>
																							</div>

																							<div className='rounded-lg border border-[#d5e9f8] bg-white p-2.5'>
																								<div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
																									<p className='text-[11px] font-bold uppercase tracking-wide text-[#5b7f9d]'>Extraction ciblee (modele)</p>
																									{extractionEntries.length > 0 ? (
																										<span className='rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700'>
																											{extractionEntries.length} blocs • {extractionValuesCount} valeurs
																										</span>
																									) : null}
																								</div>

																								{cvExtractionLoadingByCandidate[candidateId] ? (
																									<div className='rounded-md border border-dashed border-cyan-200 bg-cyan-50/60 px-3 py-4 text-center text-xs font-semibold text-cyan-700'>
																										Analyse en cours...
																									</div>
																								) : cvExtractionErrorByCandidate[candidateId] ? (
																									<div className='rounded-md border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700'>
																										{cvExtractionErrorByCandidate[candidateId]}
																									</div>
																								) : extractionEntries.length > 0 ? (
																									<div className='space-y-2'>
																										{extractionEntries.map(([label, values]) => {
																											const normalizedValues = toUniqueExtractionValues(values)
																											const normalizedLabel = normalizeExtractionText(label)
																											return (
																												<div key={label} className='rounded-md border border-[#e1edf7] bg-[#fbfdff] p-2'>
																													<p className='mb-1 text-xs font-bold text-[#0e3e63]'>{getExtractionLabel(label)}</p>
																													{normalizedValues.length > 0 ? (
																														<div className='flex flex-wrap gap-1.5'>
																															{normalizedValues.map((value) => {
																																const cleanValue = String(value || '').trim()
																																if (!cleanValue) return null

																																if (normalizedLabel === 'email') {
																																	return (
																																		<a
																																			key={`${label}-${cleanValue}`}
																																			href={`mailto:${cleanValue}`}
																																			className='rounded-full border border-[#d5e8f7] bg-white px-2 py-0.5 text-[11px] font-medium text-[#1d5f88] hover:bg-cyan-50'
																																		>
																																			{cleanValue}
																																		</a>
																																	)
																																}

																																if (normalizedLabel === 'telephone') {
																																	const phoneHref = cleanValue.replace(/[^\d+]/g, '')
																																	return (
																																		<a
																																			key={`${label}-${cleanValue}`}
																																			href={phoneHref ? `tel:${phoneHref}` : undefined}
																																			className='rounded-full border border-[#d5e8f7] bg-white px-2 py-0.5 text-[11px] font-medium text-[#1d5f88] hover:bg-cyan-50'
																																		>
																																			{cleanValue}
																																		</a>
																																	)
																																}

																																if (normalizedLabel === 'linkedin' || normalizedLabel === 'github') {
																																	const href = normalizeSocialUrl(cleanValue)
																																	return (
																																		<a
																																			key={`${label}-${cleanValue}`}
																																			href={href}
																																			target='_blank'
																																			rel='noreferrer'
																																			className='rounded-full border border-[#d5e8f7] bg-white px-2 py-0.5 text-[11px] font-medium text-[#1d5f88] hover:bg-cyan-50'
																																		>
																																			{cleanValue}
																																		</a>
																																	)
																																}

																																return (
																																	<span key={`${label}-${cleanValue}`} className='rounded-full border border-[#d5e8f7] bg-white px-2 py-0.5 text-[11px] font-medium text-[#325f82]'>
																																		{cleanValue}
																																	</span>
																																)
																															})}
																														</div>
																													) : (
																														<p className='text-xs text-[#6b89a3]'>Aucune valeur detectee.</p>
																													)}
																												</div>
																											)
																										})}
																									</div>
																								) : (
																									<div className='rounded-md border border-dashed border-[#d6e8f7] bg-[#f8fcff] px-3 py-4 text-center text-xs text-[#5d7f9b]'>
																										Aucune information essentielle detectee pour ce CV.
																									</div>
																								)}
																							</div>
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
									<div className='overflow-hidden rounded-2xl border border-cyan-100 bg-white p-4 shadow-[0_0_0_1px_rgba(14,165,233,0.18),0_10px_22px_rgba(14,165,233,0.12)]'>
										<div className='-mx-4 -mt-4 mb-3 h-1 bg-gradient-to-r from-[#06b6d4] to-[#1d4ed8]' />
										<p className='text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Total</p>
										<p className='mt-1 text-3xl font-black text-[#0d355b]'>{interviewStats.total}</p>
									</div>
									<div className='overflow-hidden rounded-2xl border border-cyan-100 bg-white p-4 shadow-[0_0_0_1px_rgba(14,165,233,0.18),0_10px_22px_rgba(14,165,233,0.12)]'>
										<div className='-mx-4 -mt-4 mb-3 h-1 bg-gradient-to-r from-[#06b6d4] to-[#1d4ed8]' />
										<p className='text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Aujourd hui</p>
										<p className='mt-1 text-3xl font-black text-[#0d355b]'>{interviewStats.today}</p>
									</div>
									<div className='overflow-hidden rounded-2xl border border-cyan-100 bg-white p-4 shadow-[0_0_0_1px_rgba(14,165,233,0.18),0_10px_22px_rgba(14,165,233,0.12)]'>
										<div className='-mx-4 -mt-4 mb-3 h-1 bg-gradient-to-r from-[#06b6d4] to-[#1d4ed8]' />
										<p className='text-xs font-bold uppercase tracking-wide text-[#4f7191]'>7 jours</p>
										<p className='mt-1 text-3xl font-black text-[#0d355b]'>{interviewStats.thisWeek}</p>
									</div>
								</div>

								<div className='grid gap-5 xl:grid-cols-[1.05fr_1.25fr]'>
									<div className='overflow-hidden rounded-2xl border border-cyan-100 bg-[#fbfdff] p-5 shadow-[0_0_0_1px_rgba(14,165,233,0.22),0_10px_24px_rgba(14,165,233,0.12)]'>
										<div className='-mx-5 -mt-5 mb-4 h-1 bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#1d4ed8]' />
										<h2 className='text-xl font-black text-[#0d355b]'>Planifier un entretien</h2>
										<p className='mt-1 text-sm text-[#4f7191]'>Créez un rendez-vous.</p>

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
													placeholder={interviewForm.mode === 'Visio' ? 'Laisser vide pour generation auto (Jitsi)' : 'https://meet...'}
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
													className='rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110'
												>
													Planifier
												</button>
												<button
													type='button'
													onClick={resetInterviewForm}
													className='rounded-xl border border-cyan-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#0a5f88] transition hover:bg-cyan-50'
												>
													Vider
												</button>
											</div>
										</form>
									</div>

									<div className='overflow-hidden rounded-2xl border border-cyan-100 bg-[#fbfdff] p-5 shadow-[0_0_0_1px_rgba(14,165,233,0.22),0_10px_24px_rgba(14,165,233,0.12)]'>
										<div className='-mx-5 -mt-5 mb-4 h-1 bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#1d4ed8]' />
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
												{upcomingInterviews.map((it) => {
													const scheduledDate = new Date(it.scheduledAt)
													const isValidDate = !Number.isNaN(scheduledDate.getTime())
													const dateLabel = isValidDate
														? scheduledDate.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })
														: 'Date invalide'
													const timeLabel = isValidDate
														? scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
														: '--:--'

													return (
														<div key={it.id} className='overflow-hidden rounded-xl border border-cyan-100 bg-gradient-to-br from-[#f8fdff] via-white to-[#f3fbff] shadow-[0_0_0_1px_rgba(14,165,233,0.12)]'>
															<div className='h-1 bg-gradient-to-r from-[#22d3ee] via-[#06b6d4] to-[#0ea5e9]' />
															<div className='p-4'>
																<div className='flex flex-wrap items-start justify-between gap-3'>
																	<div>
																		<div className='flex flex-wrap items-center gap-2'>
																			<p className='text-base font-black uppercase text-[#103b62]'>{it.candidateName}</p>
																			<span className={`rounded-full border px-2.5 py-[3px] text-[10px] font-bold ${getInterviewModeBadgeClass(it.mode)}`}>{it.mode}</span>
																		</div>
																		<p className='mt-1 text-xs font-semibold text-[#0a5f88]'>{it.offerTitle}</p>
																	</div>
																	<button
																		type='button'
																		onClick={() => handleDeleteInterview(it.id)}
																		className='rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100'
																	>
																		Supprimer
																	</button>
																</div>

																<div className='mt-3 grid gap-2 sm:grid-cols-2'>
																	<div className='rounded-lg border border-[#d8ebf8] bg-white px-3 py-2'>
																		<p className='text-[10px] font-black uppercase tracking-[0.08em] text-[#5b7f9d]'>Date</p>
																		<p className='mt-1 text-xs font-semibold text-[#124268]'>{dateLabel}</p>
																	</div>
																	<div className='rounded-lg border border-[#d8ebf8] bg-white px-3 py-2'>
																		<p className='text-[10px] font-black uppercase tracking-[0.08em] text-[#5b7f9d]'>Heure</p>
																		<p className='mt-1 text-xs font-semibold text-[#124268]'>{timeLabel}</p>
																	</div>
																	<div className='rounded-lg border border-[#d8ebf8] bg-white px-3 py-2'>
																		<p className='text-[10px] font-black uppercase tracking-[0.08em] text-[#5b7f9d]'>Contact</p>
																		<p className='mt-1 break-all text-xs text-[#355978]'>{it.candidateEmail || 'Email non renseigne'}</p>
																	</div>
																	<div className='rounded-lg border border-[#d8ebf8] bg-white px-3 py-2'>
																		<p className='text-[10px] font-black uppercase tracking-[0.08em] text-[#5b7f9d]'>{it.mode === 'Visio' ? 'Lien visio' : 'Lieu'}</p>
																		{it.mode === 'Visio' && it.meetingLink ? (
																			<button
																				type='button'
																				onClick={() => handleJoinInterview(it.meetingLink, it.id)}
																				className='mt-1 inline-flex max-w-full items-center rounded-md bg-cyan-50 px-2 py-1 text-xs font-semibold text-[#0a5f88] hover:bg-cyan-100'
																			>
																				Rejoindre dans AIR
																			</button>
																		) : (
																			<p className='mt-1 text-xs text-[#355978]'>{it.location || 'Non defini'}</p>
																		)}
																	</div>
																</div>

																{it.notes ? (
																	<div className='mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'>
																		<p className='text-[10px] font-black uppercase tracking-[0.08em] text-[#6c879f]'>Notes</p>
																		<p className='mt-1 text-xs text-[#456786]'>{it.notes}</p>
																	</div>
																) : null}
															</div>
														</div>
													)
												})}
											</div>
										)}
									</div>
								</div>

								<div className='overflow-hidden rounded-2xl border border-cyan-100 bg-[#fbfdff] p-5 shadow-[0_0_0_1px_rgba(14,165,233,0.22),0_10px_24px_rgba(14,165,233,0.12)]'>
									<div className='-mx-5 -mt-5 mb-4 h-1 bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#1d4ed8]' />
									<div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
										<div>
											<h2 className='text-xl font-black text-[#0d355b]'>Bilans Meet & evaluations</h2>
											<p className='mt-1 text-sm text-[#4f7191]'>Accedez aux bilans d entretien et enregistrez votre notation RH.</p>
										</div>
										<button
											type='button'
											onClick={() => {
												const recruiterId = recruiter?.id || recruiter?._id
												if (recruiterId) fetchRecruiterInterviewReports(recruiterId)
											}}
											className='rounded-xl border border-[#0a7aa2] px-4 py-2 text-xs font-semibold text-[#0a5f88] transition hover:bg-[#ebfaff]'
										>
											Rafraichir
										</button>
									</div>

									{interviewReportsError ? (
										<div className='mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'>{interviewReportsError}</div>
									) : null}

									{interviewReportsLoading ? (
										<p className='text-sm text-[#4f7191]'>Chargement des bilans Meet...</p>
									) : interviewReportItems.length === 0 ? (
										<p className='rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-[#4f7191]'>Aucun entretien trouve pour cette section.</p>
									) : (
										<div className='space-y-3'>
											{interviewReportItems.map((item) => {
												const interview = item?.interview || {}
												const report = item?.report || null
												const interviewId = String(interview?._id || '')
												const candidateName = interview?.candidateName || `${interview?.candidateId?.firstName || ''} ${interview?.candidateId?.lastName || ''}`.trim() || 'Candidat'
												const offerTitle = interview?.jobOfferId?.title || 'Offre'
												const evalState = reportEvalByInterview?.[interviewId] || { rating: 0, comment: '', saving: false, message: '', error: '' }
												const score100 = report?.summary?.overallScore100
												const stress = report?.metricsOverview?.averageStress
												const focus = report?.behaviorAnalysis?.focusRate

												return (
													<div key={`meet-report-${interviewId}`} className='rounded-xl border border-cyan-100 bg-white p-4'>
														<div className='flex flex-wrap items-start justify-between gap-3'>
															<div>
																<p className='text-sm font-black text-[#103b62]'>{candidateName}</p>
																<p className='mt-1 text-xs text-[#587a99]'>{offerTitle} • {interview?.scheduledAt ? new Date(interview.scheduledAt).toLocaleString('fr-FR') : 'Date non definie'}</p>
															</div>
															<div className='flex items-center gap-2'>
																{interview?.mode === 'Visio' && interview?.meetingLink ? (
																	<button
																		type='button'
																		onClick={() => handleJoinInterview(interview.meetingLink, interviewId)}
																		className='rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100'
																	>
																		Ouvrir Meet
																	</button>
																) : null}
																{!report ? (
																	<button
																		type='button'
																		onClick={() => handleGenerateMeetReport(interviewId)}
																		className='rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100'
																	>
																		Generer bilan
																	</button>
																) : null}
															</div>
														</div>

														{report ? (
															<div className='mt-3 grid gap-2 md:grid-cols-3'>
																<div className='rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-[#124268]'>Score Meet: <span className='font-black'>{Number.isFinite(score100) ? `${score100}/100` : '--'}</span></div>
																<div className='rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-[#124268]'>Stress moyen: <span className='font-black'>{Number.isFinite(stress) ? `${stress}/100` : '--'}</span></div>
																<div className='rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-[#124268]'>Focus: <span className='font-black'>{Number.isFinite(focus) ? `${focus}%` : '--'}</span></div>
															</div>
														) : (
															<p className='mt-2 text-xs text-[#4f7191]'>Bilan non genere pour cet entretien.</p>
														)}

														{report ? (
															<div className='mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3'>
																<p className='text-[11px] font-bold uppercase tracking-wide text-[#4f7191]'>Evaluation recruteur</p>
																<div className='mt-2 flex items-center gap-2'>
																	{[1, 2, 3, 4, 5].map((star) => (
																		<button
																			key={`${interviewId}-star-${star}`}
																			type='button'
																			onClick={() => updateReportEvalField(interviewId, 'rating', star)}
																			className={`h-8 w-8 rounded-full border text-sm transition ${star <= Number(evalState?.rating || 0) ? 'border-amber-300 bg-amber-100 text-amber-700' : 'border-slate-300 bg-white text-slate-400 hover:border-slate-400'}`}
																		>
																			★
																		</button>
																	))}
																</div>
																<textarea
																	rows={2}
																	value={String(evalState?.comment || '')}
																	onChange={(e) => updateReportEvalField(interviewId, 'comment', e.target.value)}
																	placeholder='Commentaire RH (optionnel)'
																	className='mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500'
																/>
																<div className='mt-2 flex items-center gap-2'>
																	<button
																		type='button'
																		onClick={() => handleSaveMeetEvaluation(interviewId)}
																		disabled={Boolean(evalState?.saving)}
																		className='rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100 disabled:opacity-60'
																	>
																		{evalState?.saving ? 'Enregistrement...' : 'Enregistrer evaluation'}
																	</button>
																	{evalState?.message ? <span className='text-xs text-emerald-700'>{evalState.message}</span> : null}
																	{evalState?.error ? <span className='text-xs text-rose-700'>{evalState.error}</span> : null}
																</div>
															</div>
														) : null}
													</div>
												)
											})}
										</div>
									)}
								</div>
							</div>
						) : selectedView === 'company' ? (
							<div className='mt-6 overflow-hidden rounded-2xl border border-cyan-100 bg-[#fbfdff] p-5 shadow-[0_0_0_1px_rgba(14,165,233,0.22),0_10px_24px_rgba(14,165,233,0.12)]'>
								<div className='-mx-5 -mt-5 mb-4 h-1 bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#1d4ed8]' />
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
									<div className='rounded-2xl border border-cyan-100 bg-gradient-to-br from-[#f8fdff] via-white to-[#f3fbff] p-4 shadow-[0_0_0_1px_rgba(14,165,233,0.12)]'>
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

											<label className='mt-4 w-full cursor-pointer rounded-lg border border-cyan-300 bg-white px-3 py-2 text-center text-sm font-semibold text-[#0a5f88] hover:bg-cyan-50'>
												Changer la photo
												<input type='file' accept='image/*' className='hidden' onChange={handleCompanyImageUpload} />
											</label>

											<div className='mt-4 w-full rounded-lg border border-cyan-100 bg-[#f8fdff] px-3 py-2 text-xs text-[#456786]'>
												<p><span className='font-semibold'>Inscrit le:</span> {companyForm.registeredAt ? new Date(companyForm.registeredAt).toLocaleDateString('fr-FR') : 'N/A'}</p>
												<p className='mt-1'><span className='font-semibold'>Email:</span> {companyForm.email || 'N/A'}</p>
											</div>
										</div>
									</div>

									<div className='rounded-2xl border border-cyan-100 bg-gradient-to-br from-[#f8fdff] via-white to-[#f3fbff] p-4 shadow-[0_0_0_1px_rgba(14,165,233,0.12)]'>
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
											<button type='submit' className='rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#1d4ed8] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110'>
												Enregistrer les modifications
											</button>
										</div>
									</div>
								</form>
							</div>
						) : selectedView === 'settings' ? (
							<div className='mt-6 grid gap-5 xl:grid-cols-2'>
								<div className='overflow-hidden rounded-2xl border border-cyan-100 bg-[#fbfdff] p-5 shadow-[0_0_0_1px_rgba(14,165,233,0.22),0_10px_24px_rgba(14,165,233,0.12)]'>
									<div className='-mx-5 -mt-5 mb-4 h-1 bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#1d4ed8]' />
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

										<div className='space-y-2 rounded-xl border border-cyan-100 bg-[#f8fdff] p-3'>
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
											<button type='submit' className='rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110'>
												Enregistrer les preferences
											</button>
										</div>
									</form>
								</div>

								<div className='overflow-hidden rounded-2xl border border-cyan-100 bg-[#fbfdff] p-5 shadow-[0_0_0_1px_rgba(14,165,233,0.22),0_10px_24px_rgba(14,165,233,0.12)]'>
									<div className='-mx-5 -mt-5 mb-4 h-1 bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#1d4ed8]' />
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
										<div className='grid gap-2 sm:grid-cols-[1fr_auto]'>
											<input
												type='text'
												className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500'
												placeholder='Code de verification recu par email'
												value={passwordForm.verificationCode}
												onChange={(e) => updatePasswordField('verificationCode', e.target.value)}
											/>
											<button
												type='button'
												onClick={handleRequestPasswordCode}
												disabled={sendingPasswordCode}
												className='rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-100 disabled:opacity-60'
											>
												{sendingPasswordCode ? 'Envoi...' : 'Envoyer code'}
											</button>
										</div>

										<div className='pt-1'>
											<button type='submit' disabled={savingPassword} className='rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'>
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
					{quizReviewState.open && quizReviewState.attempt ? (
						<div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6'>
							<div className='max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-2xl'>
								<div className='flex items-start justify-between gap-3 border-b border-cyan-100 bg-gradient-to-r from-[#f7fcff] to-[#ecf7ff] px-5 py-4'>
									<div>
										<p className='text-xs font-bold uppercase tracking-[0.12em] text-[#4f7191]'>Correction quiz</p>
										<h3 className='mt-1 text-lg font-black text-[#0d355b]'>{quizReviewState.candidateName}</h3>
										<p className='mt-1 text-sm text-[#4f7191]'>{quizReviewState.offerTitle}</p>
									</div>
									<div className='flex items-center gap-2'>
										<button
											type='button'
											onClick={handleExportQuizReviewPdf}
											className='rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-700 hover:bg-cyan-100'
										>
											Exporter PDF RH
										</button>
										<button
											type='button'
											onClick={() => setQuizReviewState({ open: false, candidateName: '', offerTitle: '', attempt: null })}
											className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50'
										>
											Fermer
										</button>
									</div>
								</div>

								<div className='max-h-[72vh] space-y-4 overflow-y-auto px-5 py-4'>
									<div className='grid gap-3 sm:grid-cols-4'>
										<div className='rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2'>
											<p className='text-[11px] font-bold uppercase tracking-wide text-[#4f7191]'>Note</p>
											<p className='mt-1 text-xl font-black text-[#0d355b]'>{quizReviewState.attempt.scorePercent}%</p>
										</div>
										<div className='rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2'>
											<p className='text-[11px] font-bold uppercase tracking-wide text-[#4f7191]'>Bonnes réponses</p>
											<p className='mt-1 text-xl font-black text-[#0d355b]'>
												{quizReviewState.attempt.correctAnswers}/{quizReviewState.attempt.totalQuestions}
											</p>
										</div>
										<div className='rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2'>
											<p className='text-[11px] font-bold uppercase tracking-wide text-[#4f7191]'>Evaluation</p>
											<p className='mt-1 text-xl font-black text-[#0d355b]'>{quizReviewComputed?.summary.gradeLabel || '—'}</p>
										</div>
										<div className='rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2'>
											<p className='text-[11px] font-bold uppercase tracking-wide text-[#4f7191]'>Axes à travailler</p>
											<p className='mt-1 text-sm font-bold text-[#0d355b]'>{quizReviewComputed?.weakDomains.join(', ') || 'Aucun axe majeur'}</p>
										</div>
									</div>

									<div className='grid gap-3 sm:grid-cols-2'>
										<div className='rounded-xl border border-cyan-100 bg-[#f8fcff] px-4 py-3'>
											<p className='text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Feedback recruteur</p>
											<p className='mt-2 text-sm text-[#355978]'>{quizReviewComputed?.summary.feedback || '—'}</p>
										</div>
										<div className='rounded-xl border border-cyan-100 bg-[#f8fcff] px-4 py-3'>
											<p className='text-xs font-bold uppercase tracking-wide text-[#4f7191]'>Axes d amélioration</p>
											<p className='mt-2 text-sm text-[#355978]'>{quizReviewComputed?.summary.improvement || '—'}</p>
										</div>
									</div>

									<div className='space-y-2'>
										<p className='text-xs font-bold uppercase tracking-[0.12em] text-[#4f7191]'>Réponses détaillées</p>
										{(quizReviewState.attempt.questions || []).map((question, idx) => {
											const selectedKey = String(question?.selectedOptionKey || '').toLowerCase()
											const correctKey = String(question?.correctOptionKey || '').toLowerCase()
											const selectedText = getOptionTextByKey(question, selectedKey)
											const correctText = getOptionTextByKey(question, correctKey)
											return (
												<div
													key={`${question?.questionId || 'q'}-${idx}`}
													className={`rounded-xl border px-4 py-3 ${question?.isCorrect ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70'}`}
												>
													<div className='flex flex-wrap items-center justify-between gap-2'>
														<p className='text-sm font-bold text-[#103b62]'>Q{idx + 1}. {question?.question || 'Question'}</p>
														<span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${question?.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
															{question?.isCorrect ? 'Correcte' : 'Fausse'}
														</span>
													</div>
													<p className='mt-2 text-sm text-[#355978]'>
														<span className='font-semibold'>Réponse candidat:</span> {selectedText}
													</p>
													{!question?.isCorrect ? (
														<p className='mt-1 text-sm text-[#355978]'>
															<span className='font-semibold'>Réponse correcte:</span> {correctText}
														</p>
													) : null}
												</div>
											)
										})}
									</div>
								</div>
							</div>
						</div>
					) : null}
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
				</main>
			</div>
		</section>
	)
}

export default DashboardRec
