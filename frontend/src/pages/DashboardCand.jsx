/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { saveCvDraft } from '../utils/cvDraft'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

const LineAreaChart = ({ data, height = 140 }) => {
	const width = 560
	const padding = { top: 12, right: 12, bottom: 24, left: 36 }
	const points = Array.isArray(data) ? data : []
	const values = points.map((p) => (Number.isFinite(p?.value) ? p.value : 0))
	const maxVal = Math.max(1, ...values)
	const minVal = 0

	const innerW = width - padding.left - padding.right
	const innerH = height - padding.top - padding.bottom
	const stepX = points.length > 1 ? innerW / (points.length - 1) : innerW

	const xy = points.map((p, idx) => {
		const v = Number.isFinite(p?.value) ? p.value : 0
		const x = padding.left + idx * stepX
		const y = padding.top + (1 - (v - minVal) / (maxVal - minVal)) * innerH
		return { x, y, v, label: p?.label || '' }
	})

	const lineD = xy.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
	const areaD = `${lineD} L ${(padding.left + (points.length - 1) * stepX).toFixed(2)} ${(padding.top + innerH).toFixed(2)} L ${padding.left.toFixed(2)} ${(padding.top + innerH).toFixed(2)} Z`

	const ticks = 4
	const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
		const t = i / ticks
		const v = (1 - t) * maxVal
		const y = padding.top + t * innerH
		return { v: Math.round(v * 10) / 10, y }
	})

	return (
		<div className='w-full overflow-x-auto'>
			<svg viewBox={`0 0 ${width} ${height}`} className='w-full min-w-[520px]'>
				<defs>
					<linearGradient id='airLineFill' x1='0' y1='0' x2='0' y2='1'>
						<stop offset='0%' stopColor='#06d5e0' stopOpacity='0.25' />
						<stop offset='100%' stopColor='#06d5e0' stopOpacity='0.02' />
					</linearGradient>
				</defs>

				{yTicks.map((t) => (
					<g key={`y-${t.y}`}>
						<line x1={padding.left} y1={t.y} x2={width - padding.right} y2={t.y} stroke='#e2e8f0' strokeWidth='1' />
						<text x={padding.left - 8} y={t.y + 4} textAnchor='end' fontSize='10' fill='#64748b'>
							{t.v}
						</text>
					</g>
				))}

				<path d={areaD} fill='url(#airLineFill)' />
				<path d={lineD} fill='none' stroke='#06d5e0' strokeWidth='2.5' />
				{xy.map((p) => (
					<circle key={`pt-${p.x}`} cx={p.x} cy={p.y} r='2.8' fill='#001d3e' stroke='#06d5e0' strokeWidth='1.5' />
				))}

				{xy.length > 0 ? (
					<>
						<text x={padding.left} y={height - 8} fontSize='10' fill='#64748b'>
							{xy[0].label}
						</text>
						<text x={width - padding.right} y={height - 8} textAnchor='end' fontSize='10' fill='#64748b'>
							{xy.at(-1)?.label || ''}
						</text>
					</>
				) : null}
			</svg>
		</div>
	)
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

const DonutChart = ({ segments, size = 160 }) => {
	const s = Array.isArray(segments) ? segments : []
	const total = s.reduce((acc, x) => acc + (Number.isFinite(x?.value) ? x.value : 0), 0) || 1
	const cx = size / 2
	const cy = size / 2
	const r = size * 0.36
	const stroke = size * 0.12
	const C = 2 * Math.PI * r
	let offset = 0

	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
			<circle cx={cx} cy={cy} r={r} fill='none' stroke='#e2e8f0' strokeWidth={stroke} />
			{s.map((seg) => {
				const val = Number.isFinite(seg?.value) ? seg.value : 0
				const frac = clamp(val / total, 0, 1)
				const len = frac * C
				const dash = `${len} ${C - len}`
				const dashOffset = -offset
				offset += len
				return (
					<circle
						key={`seg-${seg?.label || seg?.color || 'seg'}`}
						cx={cx}
						cy={cy}
						r={r}
						fill='none'
						stroke={seg.color}
						strokeWidth={stroke}
						strokeLinecap='round'
						strokeDasharray={dash}
						strokeDashoffset={dashOffset}
						transform={`rotate(-90 ${cx} ${cy})`}
					/>
				)
			})}
		</svg>
	)
}

const Badge = ({ children, variant = 'slate' }) => {
	const styles = {
		slate: 'border-slate-200 bg-slate-50 text-slate-700',
		cyan: 'border-cyan-200 bg-cyan-50 text-cyan-800',
		blue: 'border-blue-200 bg-blue-50 text-blue-800',
		emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
		amber: 'border-amber-200 bg-amber-50 text-amber-900',
		violet: 'border-violet-200 bg-violet-50 text-violet-800',
	}
	return (
		<span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[variant] || styles.slate}`}>
			{children}
		</span>
	)
}

const Tag = ({ children }) => (
	<span className='inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700'>
		{children}
	</span>
)

const parseSalaryRange = (value) => {
	const text = String(value || '').trim()
	if (!text) return null
	const matches = [...text.matchAll(/(\d+(?:[\.,]\d+)?)(\s*[kK])?/g)]
	if (!matches.length) return null
	const numbers = matches
		.map((m) => {
			const raw = String(m[1] || '').replace(',', '.')
			let n = Number.parseFloat(raw)
			if (!Number.isFinite(n)) return null
			if (m[2]) n *= 1000
			return Math.round(n)
		})
		.filter((n) => Number.isFinite(n))
	if (!numbers.length) return null
	if (numbers.length === 1) return { min: numbers[0], max: numbers[0] }
	const min = Math.min(numbers[0], numbers[1])
	const max = Math.max(numbers[0], numbers[1])
	return { min, max }
}

const extractMaxExperienceYears = (text) => {
	const s = String(text || '')
	const matches = [...s.matchAll(/(\d{1,2})\s*\+?\s*(?:ans|ann[eé]e?s?|years?)/gi)]
	if (!matches.length) return null
	let max = null
	for (const m of matches) {
		const n = Number.parseInt(m[1], 10)
		if (!Number.isFinite(n)) continue
		if (max === null || n > max) max = n
	}
	return max
}

const toStringList = (value) => {
	if (!value) return []
	if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
	if (typeof value === 'string') {
		return value
			.split(/\r?\n/)
			.map((line) => line.replace(/^\s*[-•]\s*/, '').trim())
			.filter(Boolean)
	}
	return [String(value).trim()].filter(Boolean)
}

const categoryFromText = (text) => {
	const t = (text || '').toLowerCase()
	if (/(formation|éducation|education|dipl[oô]me|universit|certif|ecole|école)/.test(t)) return 'Formation'
	if (/(skill|comp[ée]tence|competence|stack|technolog|framework|outil|language|langage|technique|backend|frontend|devops|cloud|sql|react|node|java|python)/.test(t)) {
		if (/(soft|communication|leadership|team|équipe|gestion|organisation|autonomie|rigueur|relation)/.test(t)) return 'Compétences (soft skills)'
		return 'Compétences techniques (skills)'
	}
	if (/(exp[ée]rience|experience|emploi|poste|stage|mission|responsabilit)/.test(t)) return 'Expérience'
	if (/(projet|portfolio|github|gitlab|lien|site|demo|d[ée]mo)/.test(t)) return 'Projets & Portfolio'
	if (/(ats|mot[- ]?cl[ée]s|keywords|structure|format|mise en page|rubrique|section|resume|résumé)/.test(t)) return 'Structure & ATS'
	if (/(langue|anglais|fran[çc]ais|arab|niveau linguist)/.test(t)) return 'Langues'
	return 'Autres'
}

const normalizeSuggestionsPayload = (payload) => {
	if (!payload) {
		return {
			summary: '',
			strengths: [],
			detectedRole: '',
			detectedLanguage: '',
			recommendationsByCategory: {},
		}
	}

	// Backend may return a string or an object.
	const raw = typeof payload === 'string' ? { summary: payload } : payload
	let summary = raw?.summary || raw?.synthese || raw?.synthesis || raw?.resume || ''
	const detectedRole = raw?.detectedRole || raw?.role || raw?.jobTitle || ''
	const detectedLanguage = raw?.detectedLanguage || raw?.language || ''

	let strengths = toStringList(raw?.strengths || raw?.pointsForts || raw?.highlights || raw?.strongPoints)

	// Fallback: extract a "Points forts" section from the summary text.
	if (strengths.length === 0 && typeof summary === 'string' && /points\s+forts?/i.test(summary)) {
		const match = summary.match(
			/points\s+forts?\s*[:\-]\s*([\s\S]*?)(?=\n\s*(?:axes\s+d['’]am[ée]lioration|recommandations?|am[ée]liorations?)\b|$)/i
		)
		if (match?.[1]) {
			strengths = toStringList(match[1])
			summary = summary.replace(match[0], '').trim()
		}
	}

	// If backend already sends categorized recommendations.
	const recommendationsByCategory = {}
	const categorized = raw?.recommendationsByCategory || raw?.recommendations || raw?.improvements || null
	if (categorized && typeof categorized === 'object' && !Array.isArray(categorized)) {
		for (const [categoryKey, items] of Object.entries(categorized)) {
			const list = Array.isArray(items) ? items : [items]
			recommendationsByCategory[categoryKey] = list
				.map((item) => (typeof item === 'string' ? { title: item } : item))
				.filter(Boolean)
		}
	} else {
		// Fallback: use the flat `suggestions` array and infer categories.
		const flat = Array.isArray(raw?.suggestions) ? raw.suggestions : []
		for (const item of flat) {
			const normalizedItem = typeof item === 'string' ? { title: item } : item
			if (!normalizedItem) continue
			const text = `${normalizedItem.title || ''} ${normalizedItem.why || ''} ${normalizedItem.example || ''}`
			const category = normalizedItem.category || categoryFromText(text)
			if (!recommendationsByCategory[category]) recommendationsByCategory[category] = []
			recommendationsByCategory[category].push(normalizedItem)
		}
	}

	// Stable ordering for display.
	const orderedKeys = ['Formation', 'Compétences techniques (skills)', 'Compétences (soft skills)', 'Expérience', 'Projets & Portfolio', 'Structure & ATS', 'Langues', 'Autres']
	const ordered = {}
	for (const key of orderedKeys) {
		if (recommendationsByCategory[key]?.length) ordered[key] = recommendationsByCategory[key]
	}
	for (const [key, value] of Object.entries(recommendationsByCategory)) {
		if (!ordered[key] && Array.isArray(value) && value.length) ordered[key] = value
	}

	return {
		summary,
		strengths,
		detectedRole,
		detectedLanguage,
		recommendationsByCategory: ordered,
	}
}

function DashboardCand() {
	const navigate = useNavigate()
	const [candidate, setCandidate] = useState(null)
	const [selectedView, setSelectedView] = useState('offres')
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
	const [currentTime, setCurrentTime] = useState(new Date())
	const [jobs, setJobs] = useState([])
	const [candidacies, setCandidacies] = useState([])
	const [loading, setLoading] = useState(true)
	const [loadError, setLoadError] = useState('')
	const [cvMatchLoading, setCvMatchLoading] = useState(false)
	const [cvMatchError, setCvMatchError] = useState('')
	const cvMatchSignatureRef = useRef('')
	const [isApplying, setIsApplying] = useState(false)
	const [applyStatus, setApplyStatus] = useState(null)
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
	const [notifications, setNotifications] = useState([])
	const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0)
	const [notificationsLoading, setNotificationsLoading] = useState(false)
	const [notificationsError, setNotificationsError] = useState('')
	const [settingsForm, setSettingsForm] = useState({
		firstName: '',
		lastName: '',
		email: '',
		country: '',
		birthDate: '',
		professionalTitle: '',
		sector: '',
		experienceLevel: 'junior',
		portfolioUrl: '',
	})
	const [settingsSaving, setSettingsSaving] = useState(false)
	const [settingsMessage, setSettingsMessage] = useState('')
	const [settingsError, setSettingsError] = useState('')
	const [settingsCvFile, setSettingsCvFile] = useState(null)
	const [settingsCvUploading, setSettingsCvUploading] = useState(false)
	const [settingsCvMessage, setSettingsCvMessage] = useState('')
	const [settingsCvError, setSettingsCvError] = useState('')
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	})
	const [passwordSaving, setPasswordSaving] = useState(false)
	const [passwordMessage, setPasswordMessage] = useState('')
	const [passwordError, setPasswordError] = useState('')

	const normalizedSuggestions = useMemo(() => normalizeSuggestionsPayload(suggestionsData), [suggestionsData])
	const activeCvMeta = useMemo(() => cvHistory.find((x) => x?.isActive) || null, [cvHistory])
	const selectedCvMeta = useMemo(() => cvHistory.find((x) => String(x?._id) === String(selectedCvId)) || null, [cvHistory, selectedCvId])

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
				candidateName,
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
				candidateName,
				chatType: 'offerHelp',
				chatId: offerHelpChatId || '',
				jobOfferId: selectedJob?.id || '',
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
		// When candidate session changes (id), re-allow hydration.
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
		// Only hydrate if user hasn't started a new conversation yet.
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

	const fetchNotifications = async (candidateId) => {
		if (!candidateId) return
		setNotificationsLoading(true)
		setNotificationsError('')
		try {
			const res = await fetch(`${API_BASE}/notifications/candidate/${candidateId}?limit=50`)
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				throw new Error(data?.message || 'Impossible de charger les notifications.')
			}
			setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
			setNotificationsUnreadCount(Number(data.unreadCount) || 0)
		} catch (e) {
			setNotificationsError(String(e?.message || 'Erreur'))
			setNotifications([])
			setNotificationsUnreadCount(0)
		} finally {
			setNotificationsLoading(false)
		}
	}

	const markNotificationAsRead = async (notificationId) => {
		if (!notificationId) return
		setNotificationsError('')
		try {
			const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, { method: 'PATCH' })
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				throw new Error(data?.message || 'Impossible de marquer comme lue.')
			}
			setNotifications((prev) => prev.map((n) => (n._id === notificationId ? data.notification : n)))
			setNotificationsUnreadCount((prev) => Math.max(0, prev - 1))
		} catch (e) {
			setNotificationsError(String(e?.message || 'Erreur'))
		}
	}

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
				],
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
		[jobs.length, candidacies.length, notificationsUnreadCount]
	)

	useEffect(() => {
		if (!candidate) return
		const birth = candidate?.birthDate ? new Date(candidate.birthDate) : null
		const birthValue = birth && !Number.isNaN(birth.getTime()) ? birth.toISOString().slice(0, 10) : ''
		setSettingsForm({
			firstName: candidate?.firstName || '',
			lastName: candidate?.lastName || '',
			email: candidate?.email || '',
			country: candidate?.country || '',
			birthDate: birthValue,
			professionalTitle: candidate?.professionalTitle || '',
			sector: candidate?.sector || '',
			experienceLevel: candidate?.experienceLevel || 'junior',
			portfolioUrl: candidate?.portfolioUrl || '',
		})
	}, [candidate])

	const updateSettingsField = (field, value) => {
		setSettingsForm((prev) => ({ ...prev, [field]: value }))
	}

	const handleSaveProfile = async (e) => {
		e.preventDefault()
		setSettingsMessage('')
		setSettingsError('')
		if (!candidate) {
			setSettingsError('Session candidat invalide.')
			return
		}
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) {
			setSettingsError('Session candidat invalide.')
			return
		}

		setSettingsSaving(true)
		try {
			const res = await fetch(`${API_BASE}/candidates/${candidateId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					firstName: settingsForm.firstName,
					lastName: settingsForm.lastName,
					email: settingsForm.email,
					country: settingsForm.country,
					birthDate: settingsForm.birthDate,
					professionalTitle: settingsForm.professionalTitle,
					sector: settingsForm.sector,
					experienceLevel: settingsForm.experienceLevel,
					portfolioUrl: settingsForm.portfolioUrl,
				}),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				setSettingsError(data?.message || 'Impossible de sauvegarder le profil.')
				return
			}
			const nextCandidate = { ...(candidate || {}), ...(data.candidate || {}) }
			setCandidate(nextCandidate)
			localStorage.setItem('airCandidate', JSON.stringify(nextCandidate))
			setSettingsMessage(data?.message || 'Profil mis à jour.')
		} catch (err) {
			setSettingsError('Serveur indisponible. Vérifiez que le backend tourne.')
		} finally {
			setSettingsSaving(false)
		}
	}

	const handleUploadCvFromSettings = async () => {
		setSettingsCvMessage('')
		setSettingsCvError('')
		if (!settingsCvFile) {
			setSettingsCvError('Choisissez un fichier CV (PDF/HTML).')
			return
		}
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) {
			setSettingsCvError('Session candidat invalide.')
			return
		}
		setSettingsCvUploading(true)
		try {
			const fd = new FormData()
			fd.append('candidateId', candidateId)
			fd.append('cvFile', settingsCvFile)
			const res = await fetch(`${API_BASE}/cv/upload`, { method: 'POST', body: fd })
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				setSettingsCvError(data?.message || 'Upload CV impossible.')
				return
			}
			setSettingsCvMessage(data?.message || 'CV uploadé.')
			setSettingsCvFile(null)
			setSelectedView('cv')
		} catch {
			setSettingsCvError('Serveur indisponible. Vérifiez que le backend tourne.')
		} finally {
			setSettingsCvUploading(false)
		}
	}

	const updatePasswordField = (field, value) => {
		setPasswordForm((prev) => ({ ...prev, [field]: value }))
	}

	const handleChangePassword = async (e) => {
		e.preventDefault()
		setPasswordMessage('')
		setPasswordError('')
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) {
			setPasswordError('Session candidat invalide.')
			return
		}
		if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
			setPasswordError('Tous les champs mot de passe sont requis.')
			return
		}
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			setPasswordError('La confirmation ne correspond pas.')
			return
		}
		if (String(passwordForm.newPassword).length < 8) {
			setPasswordError('Le mot de passe doit contenir au moins 8 caractères.')
			return
		}

		setPasswordSaving(true)
		try {
			const res = await fetch(`${API_BASE}/candidates/${candidateId}/password`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					currentPassword: passwordForm.currentPassword,
					newPassword: passwordForm.newPassword,
				}),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				setPasswordError(data?.message || 'Impossible de changer le mot de passe.')
				return
			}
			setPasswordMessage(data?.message || 'Mot de passe mis à jour.')
			setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
		} catch {
			setPasswordError('Serveur indisponible. Vérifiez que le backend tourne.')
		} finally {
			setPasswordSaving(false)
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
					prev.map((j) => {
						const m = matchByOfferId.get(String(j.id))
						if (!m) return j
						return {
							...j,
							matchScore: Number.isFinite(m?.score) ? m.score : j.matchScore,
							cvMatch: Array.isArray(m?.keywords) ? m.keywords : j.cvMatch,
						}
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
		if (!candidate) return
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) return
		fetchNotifications(candidateId)
	}, [candidate])

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

	const dashboardUpcomingInterviews = useMemo(() => {
		const raw = dashboardStats?.offers?.upcomingInterviews
		if (!Array.isArray(raw)) return []
		return raw
			.map((item) => {
				const dt = item?.scheduledAt ? new Date(item.scheduledAt) : null
				if (!dt || Number.isNaN(dt.getTime())) return null
				return {
					interviewId: item?.interviewId || `${item?.title || 'offer'}-${dt.getTime()}`,
					title: item?.title || 'Offre',
					scheduledAt: dt,
				}
			})
			.filter(Boolean)
			.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
	}, [dashboardStats])

	const interviewCalendarTitle = useMemo(() => {
		return interviewCalendarMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
	}, [interviewCalendarMonth])

	const interviewCalendarDays = useMemo(() => {
		const firstDay = new Date(interviewCalendarMonth.getFullYear(), interviewCalendarMonth.getMonth(), 1)
		const startWeekDay = (firstDay.getDay() + 6) % 7
		const startDate = new Date(firstDay)
		startDate.setDate(firstDay.getDate() - startWeekDay)

		const byDay = new Map()
		for (const it of dashboardUpcomingInterviews) {
			const d = it.scheduledAt
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
			if (!byDay.has(key)) byDay.set(key, [])
			byDay.get(key).push(it)
		}

		const days = []
		for (let i = 0; i < 42; i += 1) {
			const d = new Date(startDate)
			d.setDate(startDate.getDate() + i)
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
			const items = byDay.get(key) || []
			days.push({
				key,
				date: d,
				dayNumber: d.getDate(),
				isCurrentMonth: d.getMonth() === interviewCalendarMonth.getMonth(),
				interviewsCount: items.length,
				offerTitles: items.map((x) => x.title),
			})
		}

		return days
	}, [interviewCalendarMonth, dashboardUpcomingInterviews])

	const dashboardOverview = useMemo(() => {
		const connectedHours = Number(dashboardStats?.sessions?.connectedHours) || 0
		const sessionsCount = Number(dashboardStats?.sessions?.count) || 0
		const frequentHours = Array.isArray(dashboardStats?.sessions?.mostFrequentLoginHours) ? dashboardStats.sessions.mostFrequentLoginHours : []
		const topHour = frequentHours[0] || null
		const topHourCount = Number(topHour?.count) || 0
		const topHourLabel = topHour ? `${String(topHour.hour).padStart(2, '0')}h (${topHourCount})` : '—'

		const loginHourCounts = Array.isArray(dashboardStats?.sessions?.loginHourCounts) ? dashboardStats.sessions.loginHourCounts : []
		const maxHourlyCount = Math.max(1, ...loginHourCounts.map((n) => (Number.isFinite(n) ? n : 0)))

		const appliedCount = Number(dashboardStats?.offers?.appliedCount) || 0
		const interviewsCount = Number(dashboardStats?.offers?.interviewsCount) || 0
		const appliedWithInterviewCount = Number(dashboardStats?.offers?.appliedWithInterviewCount) || 0

		const avgHoursPerSession = sessionsCount > 0 ? connectedHours / sessionsCount : 0
		const interviewRate = appliedCount > 0 ? Math.round((interviewsCount / appliedCount) * 100) : 0
		const conversionRate = appliedCount > 0 ? Math.round((appliedWithInterviewCount / appliedCount) * 100) : 0

		const activityTargetHours = 60
		const sessionsTarget = 40
		const activityProgress = clamp(Math.round((connectedHours / activityTargetHours) * 100), 0, 100)
		const sessionsProgress = clamp(Math.round((sessionsCount / sessionsTarget) * 100), 0, 100)
		const topHourProgress = clamp(Math.round((topHourCount / maxHourlyCount) * 100), 0, 100)

		const pipelineMax = Math.max(1, appliedCount, interviewsCount, appliedWithInterviewCount)
		const appliedProgress = clamp(Math.round((appliedCount / pipelineMax) * 100), 0, 100)
		const interviewsProgress = clamp(Math.round((interviewsCount / pipelineMax) * 100), 0, 100)
		const conversionProgress = clamp(Math.round((appliedWithInterviewCount / pipelineMax) * 100), 0, 100)

		return {
			connectedHours,
			sessionsCount,
			topHourLabel,
			avgHoursPerSession,
			activityProgress,
			sessionsProgress,
			topHourProgress,
			appliedCount,
			interviewsCount,
			appliedWithInterviewCount,
			interviewRate,
			conversionRate,
			appliedProgress,
			interviewsProgress,
			conversionProgress,
		}
	}, [dashboardStats])

	useEffect(() => {
		if (selectedView !== 'notifications') return
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) return
		fetchNotifications(candidateId)
	}, [selectedView, candidate])

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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedView, candidate])

	useEffect(() => {
		setApplyStatus(null)
	}, [selectedJobId])

	useEffect(() => {
		setSuggestionsError('')
		setSuggestionsHint('')
	}, [selectedView])

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
		navigate('/connecter')
	}

	const handleRefreshPage = () => {
		window.location.reload()
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

		// If the active CV is a generated one, we can prefill the builder from it.
		if (activeCvId && activeCvMeta?.source === 'generated') {
			try {
				const res = await fetch(`${API_BASE}/cv/by-id/${activeCvId}?candidateId=${encodeURIComponent(candidateId)}`)
				const data = await res.json().catch(() => ({}))
				if (!res.ok || !data?.success) throw new Error(data?.message || 'Impossible de charger le CV.')
				const cv = data?.cv || null
				if (!cv) throw new Error('CV introuvable.')

				const personal = cv?.personal || null
				const content = cv?.content || null
				const hasStructuredData =
					(personal && Object.keys(personal).length > 0) || (content && Object.keys(content).length > 0)

				if (hasStructuredData) {
					saveCvDraft(candidateId, { personal: personal || {}, content: content || {} })
				}
				navigate('/EspaceCandidat/construire/etape-1')
			} catch (e) {
				setSettingsCvError(String(e?.message || 'Erreur'))
			}
			return
		}

		// For uploaded CVs (or if there is no active CV yet), we still allow creating a new generated CV via the builder.
		navigate('/EspaceCandidat/construire/etape-1')
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

		return jobs.filter((j) => {
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
	}, [searchQuery, salaryMin, salaryMax, experienceMinYears, jobs])

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

	const handleApply = async () => {
		if (!candidate || !selectedJob) return
		setApplyStatus(null)
		if (appliedOfferIds.has(selectedJob.id)) {
			setApplyStatus({ type: 'info', message: 'Vous avez déjà postulé à cette offre.' })
			return
		}
		try {
			const candidateId = candidate?.id || candidate?._id
			if (!candidateId) return
			setIsApplying(true)
			const res = await fetch(`${API_BASE}/candidacies`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ candidateId, jobOfferId: selectedJob.id, cvId: activeCvId || undefined }),
			})
			const data = await res.json()
			if (data.success) {
				setApplyStatus({ type: 'success', message: 'Candidature envoyée avec succès.' })
				// Refresh candidacies
				const candidaciesRes = await fetch(`${API_BASE}/candidacies/${candidateId}`)
				const candidaciesData = await candidaciesRes.json()
				if (candidaciesData.success) setCandidacies(candidaciesData.candidacies)
			} else {
				setApplyStatus({ type: 'error', message: data.message || 'Erreur lors de la candidature.' })
			}
		} catch (error) {
			console.error('Error applying:', error)
			setApplyStatus({ type: 'error', message: 'Erreur serveur. Réessayez plus tard.' })
		} finally {
			setIsApplying(false)
		}
	}

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
		<section className='min-h-screen bg-gradient-to-br from-[#eaf8ff] via-[#f3fbff] to-[#eef4ff]' style={{ fontFamily: "'Jost', sans-serif" }}>
			<div className='flex min-h-screen w-full'>
				<aside className='w-[286px] shrink-0 bg-gradient-to-b from-[#051a3d] via-[#072a56] to-[#083d69] px-4 py-6 text-white'>
					<div className='mb-2 flex items-center justify-center px-2'>
						<button type='button' onClick={() => navigate('/')} className='cursor-pointer' aria-label="Aller a l'accueil">
							<img src={assets.logo} alt='AIR logo' className='h-28 w-auto object-contain' />
						</button>
					</div>
					<div className='flex items-center gap-3'>
						<div className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#00d4ff] to-[#1f7bff] text-base font-bold'>
							{candidateInitials}
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
													className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[16px] font-medium transition-all ${isActive ? 'bg-gradient-to-r from-[#00b8d9] to-[#1d88ff] text-white shadow-[0_8px_20px_rgba(0,184,217,0.35)]' : 'text-[#d2e7ff] hover:bg-white/10 hover:text-white'}`}
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
					<div className='h-full rounded-3xl border border-[#cfe7f9] bg-white p-6 shadow-[0_15px_40px_rgba(8,51,93,0.08)]'>
						<div className='flex flex-wrap items-start justify-between gap-4'>
							<div>
								<p className='text-4xl font-black text-[#000000]'>{greeting} 👋</p>
								<p className='mt-2 text-base text-[#36648b]'>
									{candidate?.firstName || 'Candidat'}, voici vos offres et vos correspondances.
								</p>
							</div>
							<div className='flex items-center gap-3'>
								<span className='inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-[#0a5f88]'>
									<span className='h-2 w-2 animate-pulse rounded-full bg-[#06d5e0]' />
									{formattedTime}
								</span>
								<button
									type='button'
									onClick={handleRefreshPage}
									className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'
									title='Rafraîchir la page'
								>
									Rafraîchir
								</button>
								<button
									type='button'
									onClick={() => setSelectedView('candidatures')}
									className='rounded-xl bg-[#001d3e] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95'
								>
									Mes candidatures
								</button>
							</div>
						</div>

						{selectedView === 'offres' ? (
							<div className='mt-8 space-y-5'>
								{loadError ? (
									<div className='rounded-2xl border border-rose-200 bg-rose-50 p-4'>
										<p className='text-sm font-semibold text-rose-800'>{loadError}</p>
									</div>
								) : null}
								<div className='grid gap-4 md:grid-cols-[1fr_auto]'>
									<div className='flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3'>
										<span className='text-lg text-slate-400'>🔍</span>
										<input
											type='text'
											placeholder='Titre, compétence, entreprise…'
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className='w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400'
										/>
										<button
											type='button'
											onClick={() => setSearchQuery('')}
											className='shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50'
										>
											Réinitialiser
										</button>
									</div>
									<select className='rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none'>
										<option>Pertinence</option>
										<option>Date</option>
										<option>Salaire</option>
									</select>
								</div>

								<div className='grid gap-4 md:grid-cols-4'>
									<div className='rounded-2xl border border-slate-200 bg-white px-4 py-3'>
										<p className='text-[11px] font-black tracking-[0.12em] text-slate-500'>SALAIRE MIN</p>
										<input
											type='number'
											inputMode='numeric'
											placeholder='ex: 2500'
											value={salaryMin}
											onChange={(e) => setSalaryMin(e.target.value)}
											className='mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400'
										/>
									</div>
									<div className='rounded-2xl border border-slate-200 bg-white px-4 py-3'>
										<p className='text-[11px] font-black tracking-[0.12em] text-slate-500'>SALAIRE MAX</p>
										<input
											type='number'
											inputMode='numeric'
											placeholder='ex: 4000'
											value={salaryMax}
											onChange={(e) => setSalaryMax(e.target.value)}
											className='mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400'
										/>
									</div>
									<div className='rounded-2xl border border-slate-200 bg-white px-4 py-3'>
										<p className='text-[11px] font-black tracking-[0.12em] text-slate-500'>EXPÉRIENCE MIN</p>
										<input
											type='number'
											inputMode='numeric'
											placeholder='ans (ex: 2)'
											value={experienceMinYears}
											onChange={(e) => setExperienceMinYears(e.target.value)}
											className='mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400'
										/>
									</div>
									<button
										type='button'
										onClick={() => {
											setSalaryMin('')
											setSalaryMax('')
											setExperienceMinYears('')
										}}
										className='rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50'
									>
										Réinitialiser filtres
									</button>
								</div>

								<div className='grid gap-6 lg:grid-cols-[1fr_420px]'>
									<div className='overflow-hidden rounded-2xl border border-slate-200 bg-white'>
										<div className='flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3'>
											<p className='text-sm font-semibold text-slate-700'>
												<span className='font-black text-[#0d355b]'>{filtered.length}</span> offres correspondent
											</p>
											<p className='text-xs font-semibold text-slate-500'>
												{cvMatchLoading ? 'Analyse CV en cours…' : cvMatchError ? 'Analyse CV indisponible' : 'Cliquez une offre pour voir le détail'}
											</p>
										</div>

										<div className='max-h-[620px] overflow-y-auto p-4'>
											<div className='space-y-3'>
												{filtered.map((j) => {
													const active = selectedJob?.id === j.id
													const saved = savedJobs.has(j.id)
													return (
														<div
															key={j.id}
															className={`relative w-full rounded-2xl border transition ${active ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
														>
															<button
																type='button'
																onClick={() => {
																setSelectedJobId(j.id)
																setApplyStatus(null)
															}}
																className='w-full cursor-pointer rounded-2xl p-4 text-left'
															>
																<div className='flex items-start gap-3'>
																	<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl'>
																		{j.emoji}
																	</div>
																	<div className='min-w-0 flex-1 pr-10'>
																		<div className='flex items-start justify-between gap-3'>
																			<div>
																				<p className='text-sm font-black text-[#103b62]'>{j.title}</p>
																				<p className='mt-1 text-xs text-[#587a99]'>
																					{j.company} · {j.location}
																				</p>
																			</div>
																			<div className='flex items-center gap-2'>
																				<Badge variant={j.type === 'CDI' ? 'emerald' : 'violet'}>{j.type}</Badge>
																				{Number.isFinite(j.matchScore) ? (
																					<Badge variant={j.matchScore >= 70 ? 'emerald' : j.matchScore >= 45 ? 'cyan' : 'amber'}>Match {j.matchScore}%</Badge>
																				) : null}
																			</div>
																		</div>
																		<div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
																			<div className='flex flex-wrap gap-2'>
																			{j.tags?.slice(0, 3).map((t) => (
																				<Tag key={t}>{t}</Tag>
																			))}
																			{j.tags?.length > 3 ? <Tag>+{j.tags.length - 3}</Tag> : null}
																		</div>
																		<div className='flex items-center gap-2'>
																			{j.featured ? <Badge variant='amber'>Vedette</Badge> : null}
																			<span className='text-xs font-semibold text-slate-500'>{j.posted}</span>
																		</div>
																		</div>
																	</div>
																</div>
															</button>
															<button
																type='button'
																onClick={(e) => toggleSave(e, j.id)}
																className='absolute right-4 top-4 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 hover:bg-slate-50'
																aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
															>
																{saved ? '♥' : '♡'}
															</button>
														</div>
													)
												})}
											</div>
										</div>
									</div>

									<div className='flex flex-col gap-4'>
										{selectedJob && (
											<div className='overflow-hidden rounded-2xl border border-slate-200 bg-white'>
												<div className='border-b border-slate-200 p-5'>
													<div className='flex items-start justify-between gap-3'>
														<div className='flex items-center gap-3'>
															<div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl'>
																{selectedJob.emoji}
															</div>
															<div className='min-w-0'>
																<p className='text-lg font-black text-[#0d355b]'>{selectedJob.title}</p>
																<p className='mt-1 text-sm text-[#587a99]'>
																	{selectedJob.company} · {selectedJob.location}
																</p>
															</div>
														</div>

														<button
															type='button'
															onClick={(e) => toggleSave(e, selectedJob.id)}
															className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'
														>
															{savedJobs.has(selectedJob.id) ? 'Retirer ♥' : 'Favoris ♡'}
														</button>
													</div>

													<div className='mt-4 flex flex-wrap gap-2'>
														<Badge variant={selectedJob.type === 'CDI' ? 'emerald' : 'violet'}>{selectedJob.type}</Badge>
														{selectedJob.featured ? <Badge variant='amber'>En vedette</Badge> : null}
																	{selectedJob.workMode ? <Badge variant='blue'>{selectedJob.workMode}</Badge> : null}
																	{Number.isFinite(selectedJob.matchScore) ? (
																		<Badge variant={selectedJob.matchScore >= 70 ? 'emerald' : selectedJob.matchScore >= 45 ? 'cyan' : 'amber'}>
																			Match {selectedJob.matchScore}%
																		</Badge>
																	) : null}
													</div>

													<div className='mt-4 grid grid-cols-3 gap-3'>
														<div className='rounded-2xl border border-slate-200 bg-slate-50 p-3'>
															<p className='text-xs font-semibold text-slate-600'>Candidats</p>
															<p className='mt-1 text-xl font-black text-[#103b62]'>{selectedJob.candidates}</p>
														</div>
														<div className='rounded-2xl border border-slate-200 bg-slate-50 p-3'>
															<p className='text-xs font-semibold text-slate-600'>Clôture</p>
															<p className='mt-1 text-xl font-black text-amber-700'>{selectedJob.closes}</p>
														</div>
														<div className='rounded-2xl border border-slate-200 bg-slate-50 p-3'>
															<p className='text-xs font-semibold text-slate-600'>TND/mois</p>
															<p className='mt-1 text-xl font-black text-[#103b62]'>{selectedJob.salary}</p>
														</div>
													</div>

															{effectiveApplyStatus ? (
																<div
																	className={`mt-4 rounded-2xl border p-4 ${
																		effectiveApplyStatus.type === 'success'
																			? 'border-emerald-200 bg-emerald-50'
																		: effectiveApplyStatus.type === 'error'
																				? 'border-rose-200 bg-rose-50'
																			: 'border-cyan-200 bg-cyan-50'
																	}`}
																>
																<p
																	className={`text-sm font-semibold ${
																		effectiveApplyStatus.type === 'success'
																			? 'text-emerald-800'
																		: effectiveApplyStatus.type === 'error'
																				? 'text-rose-800'
																			: 'text-[#0a5f88]'
																	}`}
																>
																	{effectiveApplyStatus.message}
																</p>
																<div className='mt-2'>
																	<button
																		type='button'
																		onClick={() => setSelectedView('candidatures')}
																		className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'
																	>
																		Voir mes candidatures
																	</button>
																</div>
															</div>
														) : null}

															<button
																type='button'
																onClick={handleApply}
																disabled={isApplying || selectedJobAlreadyApplied}
																className={`mt-4 w-full rounded-2xl py-3 text-sm font-bold text-white transition ${
																	isApplying || selectedJobAlreadyApplied ? 'bg-slate-300' : 'bg-[#001d3e] hover:opacity-95'
																}`}
															>
																{isApplying ? 'Envoi en cours…' : selectedJobAlreadyApplied ? 'Déjà postulé' : 'Postuler'}
															</button>
												</div>

												<div className='max-h-[520px] overflow-y-auto p-5'>
													<div>
														<p className='text-[12px] font-black tracking-[0.12em] text-[#0d355b]'>DESCRIPTION DE L’OFFRE</p>
														<p className='mt-2 whitespace-pre-line text-sm leading-7 text-slate-600'>
															{selectedJob.desc || 'Aucune description fournie.'}
														</p>
													</div>

													{selectedJob.missions && selectedJob.missions.length > 0 && (
																<div className='mt-6'>
																	<p className='text-[12px] font-black tracking-[0.12em] text-[#0d355b]'>MISSIONS PRINCIPALES</p>
																	<div className='mt-3 space-y-2'>
																		{selectedJob.missions.map((m) => (
																			<div key={m} className='flex items-start gap-2'>
																				<span className='mt-1 text-cyan-600'>→</span>
																				<p className='text-sm text-slate-600'>{m}</p>
																			</div>
																		))}
																	</div>
																</div>
													)}

													{selectedJob.cvMatch && selectedJob.cvMatch.length > 0 && (
														<div className='mt-6'>
															<p className='text-[12px] font-black tracking-[0.12em] text-[#0d355b]'>MOTS-CLÉS VS VOTRE CV</p>
															<div className='mt-3 space-y-2'>
																{selectedJob.cvMatch.map(({ kw, ok }) => (
																	<div
																		key={kw}
																		className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}
																	>
																		<span className='text-sm'>{ok ? '✅' : '❌'}</span>
																		<span className='flex-1 text-sm font-semibold text-slate-700'>{kw}</span>
																		<span className={`text-xs font-bold ${ok ? 'text-emerald-700' : 'text-rose-700'}`}>{ok ? 'Dans votre CV' : 'À ajouter'}</span>
																	</div>
																))}
															</div>

															{selectedJob.cvMatch.some((m) => !m.ok) && (
																<div className='mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4'>
																	<p className='text-sm font-semibold text-[#0a5f88]'>
																		Conseil: Ajoutez {selectedJob.cvMatch.filter((m) => !m.ok).map((m) => m.kw).join(', ')} à votre CV avant de postuler.
																	</p>
																</div>
															)}
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						) : selectedView === 'cv' ? (
							<div className='mt-8 rounded-2xl border border-slate-200 bg-white p-5'>
								<div className='flex items-start justify-between gap-3 flex-wrap'>
									<div>
										<p className='text-lg font-bold text-[#0d355b]'>Mon CV</p>
										<p className='mt-1 text-sm text-[#4f7191]'>
											{activeCvMeta?.source === 'uploaded' ? 'CV uploadé' : activeCvMeta?.source === 'generated' ? 'CV généré' : 'CV'}
											{activeCvMeta?._id ? ' · Historique activé' : ''}
										</p>
									</div>
									<div className='flex items-center gap-2'>
										{cvUrl ? (
											<a
												href={cvUrl}
												target='_blank'
												rel='noreferrer'
												className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'
											>
												Ouvrir dans un nouvel onglet
											</a>
										) : null}
										<button
											type='button'
											onClick={() => setSelectedView('offres')}
											className='rounded-xl bg-[#001d3e] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-95'
										>
											← Retour aux offres
										</button>
									</div>
								</div>

								{cvLoading || cvHistoryLoading ? (
									<div className='mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700'>Chargement…</div>
								) : null}
								{cvHistoryError ? (
									<div className='mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{cvHistoryError}</div>
								) : null}
								{cvError ? (
									<div className='mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{cvError}</div>
								) : null}

								{cvHistory.length > 0 ? (
									<div className='mt-5 grid gap-4 lg:grid-cols-[320px_1fr]'>
										<div className='rounded-2xl border border-slate-200 bg-white p-4'>
											<div className='flex items-center justify-between gap-2'>
												<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>HISTORIQUE</p>
												<Badge variant='slate'>{cvHistory.length}</Badge>
											</div>
											<div className='mt-3 max-h-[70vh] space-y-2 overflow-y-auto pr-1'>
												{cvHistory.map((item) => {
													const id = String(item?._id || '')
													const isSelected = id && id === String(selectedCvId)
													const createdAt = item?.createdAt ? new Date(item.createdAt) : null
													const label = item?.source === 'uploaded' ? 'Upload' : item?.source === 'generated' ? 'Généré' : 'CV'
													return (
														<button
															key={id}
															type='button'
															onClick={() => {
																setSelectedCvId(id)
																setCvSource(item?.source || '')
																setCvError('')
																const path = item?.filePath || ''
																setCvUrl(path ? `${API_ORIGIN}${path}` : '')
																if (!path) setCvError('CV introuvable (fichier manquant).')
															}}
															className={`w-full rounded-2xl border px-3 py-2 text-left transition ${isSelected ? 'border-cyan-200 bg-cyan-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
														>
															<div className='flex items-start justify-between gap-2'>
																<div>
																	<p className='text-sm font-black text-[#103b62]'>{label}</p>
																	<p className='mt-0.5 text-xs font-semibold text-slate-500'>
																		{createdAt ? createdAt.toLocaleString() : '—'}
																	</p>
																</div>
																<div className='flex items-center gap-2'>
																	{item?.isActive ? <Badge variant='emerald'>Actif</Badge> : null}
																</div>
															</div>
														</button>
													)
												})}
											</div>

											<div className='mt-4 flex items-center justify-between gap-2'>
												<div className='text-xs font-semibold text-slate-500'>
													{selectedCvMeta?.isActive ? 'Ce CV est utilisé pour postuler.' : 'Vous pouvez choisir ce CV pour postuler.'}
												</div>
												<button
													type='button'
													onClick={() => selectedCvId && handleSetActiveCv(selectedCvId)}
													disabled={!selectedCvId || Boolean(selectedCvMeta?.isActive)}
													className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${!selectedCvId || selectedCvMeta?.isActive ? 'bg-slate-300' : 'bg-[#001d3e] hover:opacity-95'}`}
												>
													Utiliser pour postuler
												</button>
											</div>
										</div>

										<div className='overflow-hidden rounded-2xl border border-slate-200 bg-white'>
											<div className='border-b border-slate-200 px-5 py-4 text-sm font-bold text-slate-700'>Aperçu</div>
											{cvUrl ? (
												<iframe title='Mon CV' src={cvUrl} className='w-full bg-white' style={{ height: '88vh' }} />
											) : (
												<div className='p-5 text-sm font-semibold text-slate-600'>Aperçu indisponible.</div>
											)}
										</div>
									</div>
								) : !cvHistoryLoading && !cvHistoryError ? (
									<div className='mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700'>
										Aucun CV trouvé. Uploadez un CV ou générez-en un.
									</div>
								) : null}
							</div>
						) : selectedView === 'suggestions' ? (
							<div className='mt-8 rounded-2xl border border-slate-200 bg-white p-5'>
								<div className='flex items-start justify-between gap-3 flex-wrap'>
									<div>
										<p className='text-lg font-bold text-[#0d355b]'>Suggestions</p>
										<p className='mt-1 text-sm text-[#4f7191]'>Analyse de votre CV et recommandations selon le marché (ATS, mots-clés, structure).</p>
									</div>
									<div className='flex items-center gap-2'>
										<button
											type='button'
											onClick={() => setSelectedView('cv')}
											className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'
										>
											Voir mon CV
										</button>
										<button
											type='button'
											onClick={handleAnalyzeCv}
											disabled={suggestionsLoading || !(candidate?.id || candidate?._id)}
											className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${suggestionsLoading ? 'bg-slate-300' : 'bg-[#001d3e] hover:opacity-95'}`}
										>
											{suggestionsLoading ? 'Analyse…' : 'Analyser mon CV'}
										</button>
									</div>
								</div>

								{suggestionsError ? (
									<div className='mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>
										<div>{suggestionsError}</div>
										{suggestionsHint ? <div className='mt-2 text-xs font-semibold text-rose-700'>{suggestionsHint}</div> : null}
									</div>
								) : null}

									{suggestionsData ? (
									<div className='mt-5 space-y-4'>
										<div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
											<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>SYNTHÈSE</p>
												<p className='mt-2 text-xs font-semibold text-slate-600'>Avis de l’IA — points forts détectés</p>
												{normalizedSuggestions.strengths.length > 0 ? (
													<ul className='mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700'>
														{normalizedSuggestions.strengths.map((point, idx) => (
															<li key={`strength-${idx}`}>{point}</li>
														))}
													</ul>
												) : (
													<p className='mt-2 text-sm leading-7 text-slate-700'>{normalizedSuggestions.summary || '—'}</p>
												)}
												{normalizedSuggestions.summary && normalizedSuggestions.strengths.length > 0 ? (
													<div className='mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700'>
														<p className='text-xs font-black tracking-[0.12em] text-slate-600'>Résumé global</p>
														<p className='mt-2 leading-7'>{normalizedSuggestions.summary}</p>
													</div>
												) : null}
											<div className='mt-3 flex flex-wrap gap-2'>
													{normalizedSuggestions.detectedRole ? <Badge variant='cyan'>{normalizedSuggestions.detectedRole}</Badge> : null}
													{normalizedSuggestions.detectedLanguage ? <Badge variant='slate'>{normalizedSuggestions.detectedLanguage}</Badge> : null}
											</div>
										</div>

										<div className='rounded-2xl border border-slate-200 bg-white p-4'>
											<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>RECOMMANDATIONS</p>
												<p className='mt-2 text-xs font-semibold text-slate-600'>Améliorations proposées par catégories (formation, skills, compétences, …)</p>
												<div className='mt-4 space-y-3'>
													{Object.keys(normalizedSuggestions.recommendationsByCategory).length > 0 ? (
														Object.entries(normalizedSuggestions.recommendationsByCategory).map(([category, items]) => (
															<div key={category} className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
															<p className='text-sm font-black text-[#103b62]'>{category}</p>
															<div className='mt-3 space-y-3'>
																{(items || []).map((s, idx) => {
																	const title = s?.title || s?.label || 'Suggestion'
																	const missing = s?.missing || s?.why || ''
																	const recommendation = s?.recommendation || s?.example || ''
																	const priority = s?.priority
																	return (
																		<div key={`${category}-${title}-${idx}`} className='rounded-2xl border border-slate-200 bg-white p-4'>
																			<div className='flex items-start justify-between gap-3'>
																				<p className='text-sm font-black text-[#103b62]'>{title}</p>
																				{priority ? (
																					<Badge variant={priority === 'high' ? 'amber' : priority === 'low' ? 'slate' : 'blue'}>{priority}</Badge>
																				) : null}
																			</div>
																			{missing ? (
																				<p className='mt-2 text-sm text-slate-700'>
																					<span className='font-bold text-slate-700'>Manque / problème:</span> {missing}
																				</p>
																			) : null}
																			{recommendation ? (
																				<div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700'>
																					<span className='font-bold text-slate-700'>Recommandation:</span> {recommendation}
																				</div>
																			) : null}
																		</div>
																	)
																})}
															</div>
														</div>
													))
												) : (
													<p className='text-sm font-semibold text-slate-600'>Aucune suggestion disponible.</p>
												)}
												</div>
										</div>
									</div>
								) : (
									<div className='mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700'>
										Cliquez sur “Analyser mon CV” pour obtenir des suggestions.
									</div>
								)}
							</div>
						) : selectedView === 'notifications' ? (
							<div className='mt-8 rounded-2xl border border-slate-200 bg-white p-5'>
								<div className='flex flex-wrap items-center justify-between gap-3'>
									<div>
										<p className='text-lg font-bold text-[#0d355b]'>Notifications</p>
										<p className='mt-1 text-sm text-[#4f7191]'>Quand un recruteur planifie un rendez-vous, vous le verrez ici.</p>
									</div>
									<button
										type='button'
										onClick={() => {
											const candidateId = candidate?.id || candidate?._id
											fetchNotifications(candidateId)
										}}
										className='rounded-xl border border-[#0a7aa2] px-4 py-2 text-sm font-semibold text-[#0a5f88] transition hover:bg-[#ebfaff]'
									>
										Rafraîchir
									</button>
								</div>

								{notificationsError ? (
									<div className='mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{notificationsError}</div>
								) : null}

								{notificationsLoading ? <p className='mt-4 text-sm text-[#4f7191]'>Chargement...</p> : null}

								{!notificationsLoading && notifications.length === 0 ? (
									<div className='mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700'>Aucune notification.</div>
								) : null}

								{!notificationsLoading && notifications.length > 0 ? (
									<div className='mt-5 space-y-3'>
										{notifications.map((n) => {
											const createdAt = n?.createdAt ? new Date(n.createdAt) : null
											const meetingAtRaw = n?.interviewId?.scheduledAt || n?.meetingAt
											const meetingAt = meetingAtRaw ? new Date(meetingAtRaw) : null
											const mode = n?.interviewId?.mode || n?.mode || ''
											const meetingLink = n?.interviewId?.meetingLink || n?.meetingLink || ''
											const location = n?.interviewId?.location || n?.location || ''
											const notes = n?.interviewId?.notes || ''
											const isUnread = !n?.readAt
											return (
												<div key={n._id} className={`rounded-2xl border p-4 ${isUnread ? 'border-cyan-200 bg-white' : 'border-slate-200 bg-slate-50'}`}>
													<div className='flex flex-wrap items-start justify-between gap-3'>
														<div>
															<div className='flex items-center gap-2'>
																<p className='text-sm font-black text-[#103b62]'>{n.title || 'Notification'}</p>
																{isUnread ? <Badge variant='cyan'>Nouveau</Badge> : <Badge variant='slate'>Lu</Badge>}
															</div>
															<p className='mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700'>{n.message || '—'}</p>
															<div className='mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500'>
																<span>{createdAt ? createdAt.toLocaleString() : '—'}</span>
																{meetingAt ? <span>Date: {meetingAt.toLocaleString()}</span> : null}
																{mode ? <span>Nature: {mode === 'Présentiel' ? 'Présentiel' : 'En ligne'}</span> : null}
															</div>
															{mode === 'Présentiel' && location ? (
																<div className='mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700'>
																	Lieu: {location}
																</div>
															) : null}
															{mode !== 'Présentiel' && meetingLink ? (
																<a href={meetingLink} target='_blank' rel='noreferrer' className='mt-3 inline-block text-xs font-bold text-cyan-700 hover:underline'>
																	Ouvrir le lien de réunion
																</a>
															) : null}
															{notes ? (
																<div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700'>
																	Description: {notes}
																</div>
															) : null}
														</div>
														{isUnread ? (
															<button
																type='button'
																onClick={() => markNotificationAsRead(n._id)}
																className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'
															>
																Marquer comme lue
															</button>
														) : null}
													</div>
											</div>
											)
										})}
									</div>
								) : null}
							</div>
						) : selectedView === 'settings' ? (
							<div className='mt-8 space-y-5'>
								<div className='rounded-2xl border border-slate-200 bg-white p-5'>
									<div className='flex flex-wrap items-center justify-between gap-3'>
										<div>
											<p className='text-lg font-bold text-[#0d355b]'>Paramètres</p>
											<p className='mt-1 text-sm text-[#4f7191]'>Modifie ton profil, ton CV et ton mot de passe.</p>
										</div>
										<button
											type='button'
											onClick={() => setSelectedView('cv')}
											className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'
										>
											Voir mon CV
										</button>
									</div>
								</div>

								<div className='grid gap-5 lg:grid-cols-2'>
									<div className='rounded-2xl border border-slate-200 bg-white p-5'>
										<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>PROFIL</p>
										{settingsError ? (
											<div className='mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{settingsError}</div>
										) : null}
										{settingsMessage ? (
											<div className='mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800'>{settingsMessage}</div>
										) : null}

										<form className='mt-4 space-y-3' onSubmit={handleSaveProfile}>
											<div className='grid gap-3 sm:grid-cols-2'>
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600'>Prénom</label>
													<input
														value={settingsForm.firstName}
														onChange={(e) => updateSettingsField('firstName', e.target.value)}
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300'
													/>
												</div>
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600'>Nom</label>
													<input
														value={settingsForm.lastName}
														onChange={(e) => updateSettingsField('lastName', e.target.value)}
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300'
													/>
												</div>
											</div>

											<div>
												<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600'>Email</label>
												<input
													type='email'
													value={settingsForm.email}
													onChange={(e) => updateSettingsField('email', e.target.value)}
													className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300'
												/>
											</div>

											<div className='grid gap-3 sm:grid-cols-2'>
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600'>Pays</label>
													<input
														value={settingsForm.country}
														onChange={(e) => updateSettingsField('country', e.target.value)}
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300'
													/>
												</div>
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600'>Date de naissance</label>
													<input
														type='date'
														value={settingsForm.birthDate}
														onChange={(e) => updateSettingsField('birthDate', e.target.value)}
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300'
													/>
												</div>
											</div>

											<div className='grid gap-3 sm:grid-cols-2'>
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600'>Titre</label>
													<input
														value={settingsForm.professionalTitle}
														onChange={(e) => updateSettingsField('professionalTitle', e.target.value)}
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300'
													/>
												</div>
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600'>Secteur</label>
													<input
														value={settingsForm.sector}
														onChange={(e) => updateSettingsField('sector', e.target.value)}
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300'
													/>
												</div>
											</div>

											<div className='grid gap-3 sm:grid-cols-2'>
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600'>Niveau</label>
													<select
														value={settingsForm.experienceLevel}
														onChange={(e) => updateSettingsField('experienceLevel', e.target.value)}
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300'
													>
														<option value='student'>Étudiant</option>
														<option value='junior'>Junior</option>
														<option value='confirmed'>Confirmé</option>
														<option value='senior'>Senior</option>
													</select>
												</div>
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600'>Portfolio (optionnel)</label>
													<input
														value={settingsForm.portfolioUrl}
														onChange={(e) => updateSettingsField('portfolioUrl', e.target.value)}
														placeholder='https://...'
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300'
													/>
												</div>
											</div>

											<div className='pt-1'>
												<button
													type='submit'
													disabled={settingsSaving}
													className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${settingsSaving ? 'bg-slate-300' : 'bg-[#001d3e] hover:opacity-95'}`}
												>
													{settingsSaving ? 'Sauvegarde…' : 'Enregistrer'}
												</button>
											</div>
										</form>
									</div>

									<div className='space-y-5'>
										<div className='rounded-2xl border border-slate-200 bg-white p-5'>
											<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>CV GÉNÉRÉ</p>
											<p className='mt-2 text-sm text-slate-600'>Modifiez vos informations puis régénérez un nouveau CV (il sera ajouté à l’historique).</p>
											<div className='mt-4'>
												<button
													type='button'
													onClick={handleEditActiveGeneratedCv}
													className='rounded-xl bg-[#001d3e] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95'
												>
													Modifier et générer un nouveau CV
												</button>
											</div>
										</div>
										<div className='rounded-2xl border border-slate-200 bg-white p-5'>
											<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>CHANGER DE CV</p>
											{settingsCvError ? (
												<div className='mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{settingsCvError}</div>
											) : null}
											{settingsCvMessage ? (
												<div className='mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800'>{settingsCvMessage}</div>
											) : null}
											<div className='mt-4'>
												<input
													type='file'
													accept='application/pdf,text/html'
													onChange={(e) => setSettingsCvFile(e.target.files?.[0] || null)}
													className='block w-full text-xs font-semibold text-slate-700'
												/>
												{settingsCvFile ? (
													<div className='mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700'>Fichier: {settingsCvFile.name}</div>
												) : null}
											</div>
											<div className='mt-3'>
												<button
													type='button'
													onClick={handleUploadCvFromSettings}
													disabled={settingsCvUploading}
													className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${settingsCvUploading ? 'bg-slate-300' : 'bg-[#001d3e] hover:opacity-95'}`}
												>
													{settingsCvUploading ? 'Upload…' : 'Uploader un nouveau CV'}
												</button>
											</div>
										</div>

										<div className='rounded-2xl border border-slate-200 bg-white p-5'>
											<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>MOT DE PASSE</p>
											{passwordError ? (
												<div className='mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{passwordError}</div>
											) : null}
											{passwordMessage ? (
												<div className='mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800'>{passwordMessage}</div>
											) : null}
											<form className='mt-4 space-y-3' onSubmit={handleChangePassword}>
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600'>Mot de passe actuel</label>
													<input
														type='password'
														value={passwordForm.currentPassword}
														onChange={(e) => updatePasswordField('currentPassword', e.target.value)}
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300'
													/>
												</div>
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600'>Nouveau mot de passe</label>
													<input
														type='password'
														value={passwordForm.newPassword}
														onChange={(e) => updatePasswordField('newPassword', e.target.value)}
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300'
													/>
												</div>
												<div>
													<label className='mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600'>Confirmer</label>
													<input
														type='password'
														value={passwordForm.confirmPassword}
														onChange={(e) => updatePasswordField('confirmPassword', e.target.value)}
														className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300'
													/>
												</div>
												<div className='pt-1'>
													<button
														type='submit'
														disabled={passwordSaving}
														className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${passwordSaving ? 'bg-slate-300' : 'bg-[#001d3e] hover:opacity-95'}`}
													>
														{passwordSaving ? 'Mise à jour…' : 'Changer le mot de passe'}
													</button>
												</div>
											</form>
										</div>
									</div>
								</div>
							</div>
						) : selectedView === 'dashboard' ? (
							<div className='mt-8 rounded-2xl border border-slate-200 bg-white p-5'>
								<div className='flex flex-wrap items-center gap-3'>
									<div>
										<p className='text-lg font-bold text-[#0d355b]'>Dashboard</p>
										<p className='mt-1 text-sm text-[#4f7191]'>Statistiques basées sur votre activité (données MongoDB).</p>
									</div>
								</div>

								{dashboardLoading ? <p className='mt-4 text-sm text-[#4f7191]'>Chargement…</p> : null}
								{!dashboardLoading && dashboardError ? (
									<div className='mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{dashboardError}</div>
								) : null}

								{!dashboardLoading && !dashboardError && dashboardStats ? (
									<div className='mt-5 space-y-4'>
										<div className='grid gap-4 lg:grid-cols-2'>
											<div className='rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4'>
												<div className='flex items-center justify-between gap-2'>
													<p className='text-[11px] font-black tracking-[0.12em] text-slate-600'>ACTIVITÉ CANDIDAT (30J)</p>
													<span className='rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-black tracking-wide text-cyan-800'>Score {dashboardOverview.activityProgress}%</span>
												</div>

												<div className='mt-4 space-y-3'>
													<div>
														<div className='flex items-center justify-between text-sm font-semibold text-slate-700'>
															<span>TEMPS CONNECTÉ (30J)</span>
															<span className='font-black text-[#0d355b]'>{dashboardOverview.connectedHours} h</span>
														</div>
														<div className='mt-1 h-2 rounded-full bg-slate-200'>
															<div className='h-full rounded-full bg-[#0a5f88]' style={{ width: `${dashboardOverview.activityProgress}%` }} />
														</div>
													</div>

													<div>
														<div className='flex items-center justify-between text-sm font-semibold text-slate-700'>
															<span>NOMBRE DE CONNEXIONS</span>
															<span className='font-black text-[#0d355b]'>{dashboardOverview.sessionsCount}</span>
														</div>
														<div className='mt-1 h-2 rounded-full bg-slate-200'>
															<div className='h-full rounded-full bg-[#06d5e0]' style={{ width: `${dashboardOverview.sessionsProgress}%` }} />
														</div>
													</div>

													<div>
														<div className='flex items-center justify-between text-sm font-semibold text-slate-700'>
															<span>HEURES FRÉQUENTES (PIC)</span>
															<span className='font-black text-[#0d355b]'>{dashboardOverview.topHourLabel}</span>
														</div>
														<div className='mt-1 h-2 rounded-full bg-slate-200'>
															<div className='h-full rounded-full bg-[#165dff]' style={{ width: `${dashboardOverview.topHourProgress}%` }} />
														</div>
													</div>
												</div>

												<p className='mt-3 text-xs font-semibold text-slate-500'>Moyenne: {dashboardOverview.avgHoursPerSession.toFixed(1)} h par connexion</p>
											</div>

											<div className='rounded-2xl border border-slate-200 bg-gradient-to-br from-cyan-50 to-white p-4'>
												<div className='flex items-center justify-between gap-2'>
													<p className='text-[11px] font-black tracking-[0.12em] text-slate-600'>PIPELINE CANDIDATURE</p>
													<span className='rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black tracking-wide text-emerald-800'>Taux entretien {dashboardOverview.interviewRate}%</span>
												</div>

												<div className='mt-4 space-y-3'>
													<div>
														<div className='flex items-center justify-between text-sm font-semibold text-slate-700'>
															<span>OFFRES POSTULÉES</span>
															<span className='font-black text-[#0d355b]'>{dashboardOverview.appliedCount}</span>
														</div>
														<div className='mt-1 h-2 rounded-full bg-slate-200'>
															<div className='h-full rounded-full bg-[#0f2742]' style={{ width: `${dashboardOverview.appliedProgress}%` }} />
														</div>
													</div>

													<div>
														<div className='flex items-center justify-between text-sm font-semibold text-slate-700'>
															<span>ENTRETIENS</span>
															<span className='font-black text-[#0d355b]'>{dashboardOverview.interviewsCount}</span>
														</div>
														<div className='mt-1 h-2 rounded-full bg-slate-200'>
															<div className='h-full rounded-full bg-[#06d5e0]' style={{ width: `${dashboardOverview.interviewsProgress}%` }} />
														</div>
													</div>

													<div>
														<div className='flex items-center justify-between text-sm font-semibold text-slate-700'>
															<span>POSTULÉ + ENTRETIEN</span>
															<span className='font-black text-[#0d355b]'>{dashboardOverview.appliedWithInterviewCount}</span>
														</div>
														<div className='mt-1 h-2 rounded-full bg-slate-200'>
															<div className='h-full rounded-full bg-emerald-500' style={{ width: `${dashboardOverview.conversionProgress}%` }} />
														</div>
													</div>
												</div>

												<p className='mt-3 text-xs font-semibold text-slate-500'>Conversion postulé→entretien: {dashboardOverview.conversionRate}%</p>
											</div>
										</div>

										<div className='grid gap-4 lg:grid-cols-3'>
											<div className='rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2'>
												<div className='flex flex-wrap items-end justify-between gap-2'>
													<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>COURBE: HEURES CONNECTÉES / JOUR</p>
													<p className='text-xs font-semibold text-slate-500'>30 derniers jours</p>
												</div>
												<div className='mt-3'>
													<LineAreaChart data={dashboardSeries} />
												</div>
											</div>
											<div className='rounded-2xl border border-slate-200 bg-white p-4'>
												<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>RÉPARTITION</p>
												<div className='mt-3 flex items-center justify-center'>
													<DonutChart
														segments={[
															{ label: 'Candidatures', value: dashboardStats?.offers?.appliedCount ?? 0, color: '#001d3e' },
															{ label: 'Entretiens', value: dashboardStats?.offers?.interviewsCount ?? 0, color: '#06d5e0' },
															{ label: 'Postulé+Entretien', value: dashboardStats?.offers?.appliedWithInterviewCount ?? 0, color: '#0a5f88' },
														]}
													/>
												</div>
												<div className='mt-3 space-y-1 text-xs font-semibold text-slate-600'>
													<div className='flex items-center justify-between gap-2'>
														<span className='inline-flex items-center gap-2'>
															<span className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: '#001d3e' }} />
															Candidatures
														</span>
														<span>{dashboardStats?.offers?.appliedCount ?? 0}</span>
													</div>
													<div className='flex items-center justify-between gap-2'>
														<span className='inline-flex items-center gap-2'>
															<span className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: '#06d5e0' }} />
															Entretiens
														</span>
														<span>{dashboardStats?.offers?.interviewsCount ?? 0}</span>
													</div>
													<div className='flex items-center justify-between gap-2'>
														<span className='inline-flex items-center gap-2'>
															<span className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: '#0a5f88' }} />
															Postulé + entretien
														</span>
														<span>{dashboardStats?.offers?.appliedWithInterviewCount ?? 0}</span>
													</div>
												</div>
											</div>
										</div>

										<div className='rounded-2xl border border-slate-200 bg-white p-4'>
											<div className='flex flex-wrap items-end justify-between gap-2'>
												<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>HISTOGRAMME: HEURES DE CONNEXION</p>
												<p className='text-xs font-semibold text-slate-500'>Nombre de connexions par heure</p>
											</div>
											<div className='mt-3'>
												<BarChart values={dashboardLoginHours.values} labels={dashboardLoginHours.labels} />
											</div>
										</div>

										<div className='grid gap-4 lg:grid-cols-2'>
											<div className='rounded-2xl border border-slate-200 bg-white p-4'>
												<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>DERNIÈRES CANDIDATURES</p>
												{(dashboardStats?.offers?.recentApplied || []).length === 0 ? (
													<p className='mt-3 text-sm text-slate-600'>Aucune candidature.</p>
												) : (
													<div className='mt-3 space-y-2'>
														{dashboardStats.offers.recentApplied.map((a) => (
															<div key={a.candidacyId} className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2'>
																<p className='text-sm font-semibold text-slate-800'>{a.title}</p>
																<p className='text-xs font-semibold text-slate-500'>{a.location || '—'}</p>
															</div>
														))}
													</div>
												)}
											</div>
											<div className='rounded-2xl border border-slate-200 bg-white p-4'>
												<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>PROCHAINS ENTRETIENS</p>
												{dashboardUpcomingInterviews.length === 0 ? (
													<p className='mt-3 text-sm text-slate-600'>Aucun entretien à venir.</p>
												) : (
													<div className='mt-3 space-y-3'>
														<div className='flex items-center justify-between gap-2'>
															<button
																type='button'
																onClick={() => setInterviewCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
																className='rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100'
															>
																←
															</button>
															<p className='text-xs font-black uppercase tracking-[0.12em] text-slate-600'>{interviewCalendarTitle}</p>
															<button
																type='button'
																onClick={() => setInterviewCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
																className='rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100'
															>
																→
															</button>
														</div>

														<div className='grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-[0.08em] text-slate-500'>
															{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((label) => (
																<div key={label} className='py-1'>{label}</div>
															))}
														</div>

														<div className='grid grid-cols-7 gap-1'>
															{interviewCalendarDays.map((day) => {
																const hasInterview = day.interviewsCount > 0
																const tooltip = day.offerTitles.length ? `Offre: ${day.offerTitles.join(' | ')}` : ''
																return (
																	<div key={day.key} className='relative group'>
																		<div
																			title={tooltip}
																			className={[
																				'flex h-10 items-center justify-center rounded-lg border text-xs font-semibold transition',
																				day.isCurrentMonth ? 'border-slate-200' : 'border-slate-100 text-slate-300',
																				hasInterview ? 'border-cyan-300 bg-cyan-100 text-cyan-900 ring-1 ring-cyan-200' : 'bg-white text-slate-700',
																			].join(' ')}
																		>
																			{day.dayNumber}
																			{hasInterview ? <span className='ml-1 inline-block h-1.5 w-1.5 rounded-full bg-cyan-700' /> : null}
																		</div>
																		{hasInterview ? (
																			<div className='pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden w-max max-w-[220px] -translate-x-1/2 rounded-md border border-slate-200 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow-lg group-hover:block'>
																				{day.offerTitles.join(' | ')}
																			</div>
																		) : null}
																	</div>
																)
															})}
														</div>
													</div>
												)}
											</div>
										</div>
									</div>
								) : null}
							</div>
						) : selectedView === 'offerHelp' ? (
							<div className='mt-8 rounded-2xl border border-slate-200 bg-white p-5'>
								<div className='flex items-start justify-between gap-3 flex-wrap'>
									<div>
										<p className='text-lg font-bold text-[#0d355b]'>Aide pour une offre</p>
										<p className='mt-1 text-sm text-[#4f7191]'>Sélectionne une offre, puis reçois des conseils et une préparation à l’entretien.</p>
									</div>
									<div className='flex items-center gap-2'>
										{selectedJob ? (
											<button
												type='button'
												onClick={() =>
												sendOfferHelpMessage(
													`Je postule à l’offre “${selectedJob.title}”. Donne-moi des conseils concrets pour adapter mon CV et mon message de candidature. Ensuite liste les mots-clés/compétences à mettre en avant.`
												)
											}
											disabled={offerHelpLoading}
											className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${offerHelpLoading ? 'bg-slate-300' : 'bg-[#001d3e] hover:opacity-95'}`}
										>
											Conseils candidature
										</button>
										) : null}
										{selectedJob ? (
											<button
												type='button'
												onClick={() =>
												sendOfferHelpMessage(
													`Prépare-moi à un entretien pour l’offre “${selectedJob.title}”. Je veux: (1) 10 questions probables + bonnes réponses, (2) questions techniques si pertinent, (3) pitch 60 secondes, (4) questions à poser au recruteur.`
												)
											}
											disabled={offerHelpLoading}
											className={`rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 ${offerHelpLoading ? 'opacity-60' : ''}`}
										>
											Préparation entretien
										</button>
										) : null}
										<button
											type='button'
											onClick={() => {
												setOfferHelpChatId(null)
												setOfferHelpMessages([
													{ role: 'assistant', content: "Bonjour. Sélectionne une offre puis je t’aide à adapter ta candidature et te préparer à l’entretien." },
												])
												setOfferHelpError('')
											}}
											className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'
										>
											Réinitialiser
										</button>
									</div>
								</div>

								{offerHelpError ? (
									<div className='mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{offerHelpError}</div>
								) : null}

								<div className='mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]'>
									<div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
										<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>CONVERSATION</p>
										<div className='mt-3 max-h-[56vh] overflow-y-auto pr-1'>
											<div className='space-y-3'>
												{offerHelpMessages.map((m, idx) => {
													const isUser = m.role === 'user'
													return (
														<div key={`offer-help-msg-${idx}`} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
															{!isUser ? (
																<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f2742] text-[10px] font-black tracking-[0.08em] text-cyan-100'>AI</div>
															) : null}
															<div
																className={[
																	'max-w-[82%] rounded-2xl px-4 py-3 shadow-sm',
																	isUser
																		? 'rounded-br-md bg-gradient-to-r from-[#0a4a72] to-[#0a7aa2] text-white'
																		: 'rounded-bl-md border border-slate-200 bg-white text-slate-800',
																].join(' ')}
															>
																<p className={`text-[10px] font-black tracking-[0.12em] ${isUser ? 'text-cyan-100/90' : 'text-slate-500'}`}>
																	{isUser ? chatUserLabel : 'ASSISTANT IA'}
																</p>
																<p className={`mt-1.5 whitespace-pre-wrap text-sm leading-6 ${isUser ? 'text-white' : 'text-slate-700'}`}>{m.content}</p>
															</div>
															{isUser ? (
																<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-black tracking-[0.08em] text-[#0a5f88]'>{candidateInitials}</div>
															) : null}
														</div>
													)
												})}
											</div>
										</div>

										<div className='mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4'>
											<textarea
												rows={3}
												value={offerHelpInput}
												onChange={(e) => setOfferHelpInput(e.target.value)}
												placeholder='Pose ta question sur cette offre (candidature, entretien, adaptation)…'
												className='w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-300'
											/>
											<div className='flex items-center justify-between gap-3 flex-wrap'>
												<div className='text-xs font-semibold text-slate-500'>{offerHelpLoading ? 'En cours…' : selectedJob ? `Offre: ${selectedJob.title}` : 'Aucune offre sélectionnée'}</div>
												<button
													type='button'
													onClick={handleOfferHelpSend}
													disabled={offerHelpLoading || !offerHelpInput.trim()}
													className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${offerHelpLoading || !offerHelpInput.trim() ? 'bg-slate-300' : 'bg-[#001d3e] hover:opacity-95'}`}
												>
													Envoyer
												</button>
											</div>
										</div>
									</div>

									<div className='rounded-2xl border border-slate-200 bg-white p-4'>
										<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>CONTEXTE (OPTIONNEL)</p>
										<p className='mt-2 text-xs font-semibold text-slate-600'>Ajoute l’offre (texte) et/ou ton CV pour une réponse plus précise.</p>
										<div className='mt-3 space-y-3'>
											<div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
												<p className='text-xs font-black tracking-[0.12em] text-slate-600'>OFFRES D’EMPLOI</p>
												<p className='mt-2 text-xs font-semibold text-slate-600'>Sélectionne une offre pour lier le chat.</p>
												<div className='mt-3 max-h-[24vh] space-y-2 overflow-y-auto pr-1'>
													{jobs.length ? (
														jobs.map((j) => (
															<button
																type='button'
																key={j.id}
																onClick={() => setSelectedJobId(j.id)}
																className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
																selectedJob?.id === j.id ? 'border-cyan-200 bg-white text-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
															}`}
															>
																<div className='text-sm font-black text-[#103b62]'>{j.title}</div>
																<div className='mt-1 text-xs text-slate-500'>{j.location ? `${j.location} · ` : ''}{j.contractType || j.type || ''}</div>
															</button>
														))
													) : (
														<div className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600'>Aucune offre disponible.</div>
													)}
												</div>
											</div>
											<div>
												<p className='text-xs font-bold text-slate-700'>Offre d’emploi (texte)</p>
												<textarea
													rows={7}
													value={offerHelpOfferText}
													onChange={(e) => setOfferHelpOfferText(e.target.value)}
													placeholder="Colle ici la description de l’offre (missions, compétences, exigences)…"
													className='mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-300'
												/>
											</div>
											<div>
												<p className='text-xs font-bold text-slate-700'>CV en PDF (optionnel)</p>
												<input
													type='file'
													accept='application/pdf,text/html'
													onChange={(e) => setOfferHelpFile(e.target.files?.[0] || null)}
													className='mt-2 block w-full text-xs font-semibold text-slate-700'
												/>
												{offerHelpFile ? (
													<div className='mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700'>Fichier: {offerHelpFile.name}</div>
												) : null}
											</div>
										</div>
									</div>
								</div>
							</div>
						) : selectedView === 'assistant' ? (
							<div className='mt-8 rounded-2xl border border-slate-200 bg-white p-5'>
								<div className='flex items-start justify-between gap-3 flex-wrap'>
									<div>
										<p className='text-lg font-bold text-[#0d355b]'>Assistant IA</p>
										<p className='mt-1 text-sm text-[#4f7191]'>Discussion simple entre toi et l’IA. Tu peux joindre ton CV (PDF/HTML).</p>
									</div>
									<button
										type='button'
										onClick={() => {
											setAssistantChatId(null)
											setAssistantMessages([
												{ role: 'assistant', content: "Bonjour, je suis l’Assistant IA d’A.I.R. Pose-moi tes questions sur ton CV, ta candidature, ou la préparation d’entretien." },
											])
											setAssistantError('')
											setAssistantFile(null)
										}}
										className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'
									>
										Réinitialiser
									</button>
								</div>

								{assistantError ? (
									<div className='mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{assistantError}</div>
								) : null}

								<div className='mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4'>
									<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>CONVERSATION</p>
									<div className='mt-3 max-h-[62vh] overflow-y-auto pr-1'>
										<div className='space-y-3'>
											{assistantMessages.map((m, idx) => {
												const isUser = m.role === 'user'
												return (
													<div key={`assistant-msg-${idx}`} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
														{!isUser ? (
															<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f2742] text-[10px] font-black tracking-[0.08em] text-cyan-100'>AI</div>
														) : null}
														<div
															className={[
																'max-w-[82%] rounded-2xl px-4 py-3 shadow-sm',
																isUser
																	? 'rounded-br-md bg-gradient-to-r from-[#0a4a72] to-[#0a7aa2] text-white'
																	: 'rounded-bl-md border border-slate-200 bg-white text-slate-800',
															].join(' ')}
														>
															<p className={`text-[10px] font-black tracking-[0.12em] ${isUser ? 'text-cyan-100/90' : 'text-slate-500'}`}>
																{isUser ? chatUserLabel : 'ASSISTANT IA'}
															</p>
															<p className={`mt-1.5 whitespace-pre-wrap text-sm leading-6 ${isUser ? 'text-white' : 'text-slate-700'}`}>{m.content}</p>
														</div>
														{isUser ? (
															<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-black tracking-[0.08em] text-[#0a5f88]'>{candidateInitials}</div>
														) : null}
													</div>
												)
											})}
										</div>
									</div>

									<div className='mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4'>
										<textarea
											rows={3}
											value={assistantInput}
											onChange={(e) => setAssistantInput(e.target.value)}
											placeholder='Pose ta question…'
											className='w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-300'
										/>
										<div className='flex items-center justify-between gap-3 flex-wrap'>
											<div>
												<p className='text-xs font-bold text-slate-700'>CV (optionnel)</p>
												<input
													type='file'
													accept='application/pdf,text/html'
													onChange={(e) => setAssistantFile(e.target.files?.[0] || null)}
													className='mt-1 block w-full text-xs font-semibold text-slate-700'
												/>
												{assistantFile ? <div className='mt-2 text-xs font-semibold text-slate-600'>Fichier: {assistantFile.name}</div> : null}
											</div>
											<button
												type='button'
												onClick={handleAssistantSend}
												disabled={assistantLoading || !assistantInput.trim()}
												className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${assistantLoading || !assistantInput.trim() ? 'bg-slate-300' : 'bg-[#001d3e] hover:opacity-95'}`}
											>
												{assistantLoading ? 'En cours…' : 'Envoyer'}
											</button>
										</div>
									</div>
								</div>
							</div>
						) : (
							<div className='mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5'>
								<p className='text-lg font-bold text-[#0d355b]'>
									{selectedView === 'candidatures' ? 'Mes candidatures' : 'Section bientôt disponible'}
								</p>
								<p className='mt-1 text-sm text-[#4f7191]'>
									{selectedView === 'candidatures' && candidacies.length > 0
										? `Vous avez postulé à ${candidacies.length} offre(s)`
										: 'Cette section sera activée ensuite.'}
								</p>
								{selectedView === 'candidatures' && candidacies.length === 0 ? (
									<div className='mt-4 rounded-xl border border-slate-200 bg-white p-4'>
										<p className='text-sm font-semibold text-slate-700'>Aucune candidature pour le moment.</p>
										<p className='mt-1 text-xs text-slate-500'>Postulez à une offre pour la voir ici.</p>
									</div>
								) : null}
								{selectedView === 'candidatures' && candidacies.length > 0 && (
									<div className='mt-4 space-y-3'>
										{candidacies.map((c) => {
											const offer = c.jobOfferId
											const createdAt = c.createdAt ? new Date(c.createdAt) : null
											return (
												<div key={c._id} className='rounded-xl border border-slate-200 bg-white p-4'>
													<p className='font-semibold text-[#0d355b]'>{offer?.title || 'Offre'}</p>
													<p className='mt-1 text-xs text-slate-500'>
														{offer?.location ? `${offer.location} · ` : ''}{offer?.contractType || ''}
													</p>
													<p className='mt-2 text-sm text-slate-600'>
														Postulé le: {createdAt ? createdAt.toLocaleDateString() : '—'}
													</p>
													<p className='text-sm text-slate-600'>Statut: {c.status || 'En attente'}</p>
											</div>
											)
										})}
									</div>
								)}
							</div>
						)}
					</div>
				</main>
			</div>
		</section>
	)
}

export default DashboardCand