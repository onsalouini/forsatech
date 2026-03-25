/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

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
	const [selectedJobId, setSelectedJobId] = useState(null)
	const [savedJobs, setSavedJobs] = useState(() => new Set())
	const [searchQuery, setSearchQuery] = useState('')
	const [currentTime, setCurrentTime] = useState(new Date())
	const [jobs, setJobs] = useState([])
	const [candidacies, setCandidacies] = useState([])
	const [loading, setLoading] = useState(true)
	const [loadError, setLoadError] = useState('')
	const [isApplying, setIsApplying] = useState(false)
	const [applyStatus, setApplyStatus] = useState(null)
	const [cvLoading, setCvLoading] = useState(false)
	const [cvError, setCvError] = useState('')
	const [cvUrl, setCvUrl] = useState('')
	const [cvSource, setCvSource] = useState('')
	const [suggestionsLoading, setSuggestionsLoading] = useState(false)
	const [suggestionsError, setSuggestionsError] = useState('')
	const [suggestionsHint, setSuggestionsHint] = useState('')
	const [suggestionsData, setSuggestionsData] = useState(null)

	const [assistantMessages, setAssistantMessages] = useState(() => [
		{
			role: 'assistant',
			content:
				"Bonjour, je suis l’Assistant IA d’A.I.R. Je peux t’aider à améliorer ton CV, préparer un entretien, comprendre tes suggestions, ou adapter ta candidature à une offre.",
		},
	])
	const [assistantInput, setAssistantInput] = useState('')
	const [assistantOfferText, setAssistantOfferText] = useState('')
	const [assistantOfferLinkedJobId, setAssistantOfferLinkedJobId] = useState(null)
	const [assistantFile, setAssistantFile] = useState(null)
	const [assistantLoading, setAssistantLoading] = useState(false)
	const [assistantError, setAssistantError] = useState('')

	const normalizedSuggestions = useMemo(() => normalizeSuggestionsPayload(suggestionsData), [suggestionsData])

	useEffect(() => {
		const job = jobs.find((j) => j.id === selectedJobId) || null
		if (!job?.id) return
		if (assistantOfferLinkedJobId === job.id) return
		setAssistantOfferLinkedJobId(job.id)
		setAssistantOfferText(job?.desc || '')
	}, [jobs, selectedJobId, assistantOfferLinkedJobId])

	const sendAssistantMessage = async (content) => {
		const text = String(content || '').trim()
		if (!text || assistantLoading) return

		setAssistantError('')
		setAssistantLoading(true)
		setAssistantMessages((prev) => [...prev, { role: 'user', content: text }])

		try {
			const history = assistantMessages
				.slice(-10)
				.map((m) => ({ role: m.role, content: m.content }))
				.filter((m) => m.role === 'user' || m.role === 'assistant')

			const payloadBase = {
				candidateName,
				jobTitle: selectedJob?.title || '',
				company: selectedJob?.company || '',
				suggestions: suggestionsData || '',
				jobOfferText: assistantOfferText || selectedJob?.desc || '',
				history,
				message: text,
			}

			let res
			if (assistantFile) {
				const fd = new FormData()
				fd.append('attachment', assistantFile)
				fd.append('candidateName', payloadBase.candidateName)
				fd.append('jobTitle', payloadBase.jobTitle)
				fd.append('company', payloadBase.company)
				fd.append('jobOfferText', payloadBase.jobOfferText)
				fd.append('suggestions', JSON.stringify(payloadBase.suggestions || ''))
				fd.append('history', JSON.stringify(payloadBase.history || []))
				fd.append('message', payloadBase.message)
				res = await fetch(`${API_BASE}/assistant/candidate`, {
					method: 'POST',
					body: fd,
				})
			} else {
				res = await fetch(`${API_BASE}/assistant/candidate`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payloadBase),
				})
			}

			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				throw new Error(data?.message || data?.error || "Erreur pendant la réponse de l'assistant")
			}
			setAssistantMessages((prev) => [...prev, { role: 'assistant', content: String(data.reply || '').trim() || '—' }])
		} catch (e) {
			setAssistantError(String(e?.message || 'Erreur'))
			setAssistantMessages((prev) => [...prev, { role: 'assistant', content: "Désolé, je n’ai pas pu répondre. Réessaie dans un instant." }])
		} finally {
			setAssistantLoading(false)
		}
	}

	const handleAssistantSend = async () => {
		const content = assistantInput.trim()
		if (!content) return
		setAssistantInput('')
		await sendAssistantMessage(content)
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
					{ key: 'notifications', label: 'Notifications', count: 2 },
				],
			},
		],
		[jobs.length, candidacies.length]
	)

	useEffect(() => {
		const stored = localStorage.getItem('airCandidate')
		if (!stored) {
			navigate('/connecter')
			return
		}
		try {
			setCandidate(JSON.parse(stored))
		} catch {
			localStorage.removeItem('airCandidate')
			navigate('/connecter')
		}
	}, [navigate])

	useEffect(() => {
		const t = setInterval(() => setCurrentTime(new Date()), 1000)
		return () => clearInterval(t)
	}, [])

	useEffect(() => {
		if (!candidate) return
		setLoadError('')
		setApplyStatus(null)
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
		if (selectedView !== 'cv') return
		const candidateId = candidate?.id || candidate?._id
		if (!candidateId) return
		let cancelled = false
		setCvLoading(true)
		setCvError('')
		setCvUrl('')
		setCvSource('')

		fetch(`${API_BASE}/cv/by-candidate/${candidateId}`)
			.then((r) => r.json().then((j) => ({ ok: r.ok, json: j })))
			.then(({ ok, json }) => {
				if (cancelled) return
				if (!ok || !json?.success) {
					setCvError(json?.message || 'Impossible de charger votre CV.')
					return
				}
				const cv = json.cv
				const path = cv?.uploadedFile?.path || ''
				setCvSource(cv?.source || '')
				if (!path) {
					setCvError("CV introuvable (fichier manquant).")
					return
				}
				setCvUrl(`${API_ORIGIN}${path}`)
			})
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

	const handleLogout = () => {
		localStorage.removeItem('airCandidate')
		navigate('/connecter')
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

	const candidateInitials = useMemo(() => {
		if (!candidate) return 'C'
		const f = candidate.firstName?.[0] || ''
		const l = candidate.lastName?.[0] || ''
		return `${f}${l}`.toUpperCase() || 'C'
	}, [candidate])

	const candidateName = candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidat'
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
		if (!q) return jobs
		return jobs.filter(
			(j) => j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.company.toLowerCase().includes(q)
		)
	}, [searchQuery, jobs])

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
				body: JSON.stringify({ candidateId, jobOfferId: selectedJob.id }),
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

								<div className='grid gap-6 lg:grid-cols-[1fr_420px]'>
									<div className='overflow-hidden rounded-2xl border border-slate-200 bg-white'>
										<div className='flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3'>
											<p className='text-sm font-semibold text-slate-700'>
												<span className='font-black text-[#0d355b]'>{filtered.length}</span> offres correspondent
											</p>
											<p className='text-xs font-semibold text-slate-500'>Cliquez une offre pour voir le détail</p>
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
											{cvSource === 'uploaded' ? 'CV uploadé' : cvSource === 'generated' ? 'CV généré' : 'CV'}
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

								{cvLoading ? (
									<div className='mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700'>Chargement du CV…</div>
								) : null}
								{cvError ? (
									<div className='mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{cvError}</div>
								) : null}

								{!cvLoading && !cvError && cvUrl ? (
									<div className='mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white'>
										<div className='border-b border-slate-200 px-5 py-4 text-sm font-bold text-slate-700'>Aperçu</div>
										<iframe
											title='Mon CV'
											src={cvUrl}
											className='w-full bg-white'
											style={{ height: '88vh' }}
										/>
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
						) : selectedView === 'assistant' || selectedView === 'offerHelp' ? (
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
												sendAssistantMessage(
													`Je postule à l’offre “${selectedJob.title}” chez ${selectedJob.company}. Donne-moi des conseils concrets pour adapter mon CV et mon message de candidature. Ensuite liste les mots-clés/compétences à mettre en avant.`
											)
											}
											disabled={assistantLoading}
											className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${assistantLoading ? 'bg-slate-300' : 'bg-[#001d3e] hover:opacity-95'}`}
										>
											Conseils candidature
										</button>
										) : null}
										{selectedJob ? (
											<button
												type='button'
												onClick={() =>
												sendAssistantMessage(
													`Prépare-moi à un entretien pour l’offre “${selectedJob.title}” chez ${selectedJob.company}. Je veux: (1) 10 questions probables + bonnes réponses, (2) questions techniques si pertinent, (3) pitch 60 secondes, (4) questions à poser au recruteur.`
											)
											}
											disabled={assistantLoading}
											className={`rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 ${assistantLoading ? 'opacity-60' : ''}`}
										>
											Préparation entretien
										</button>
										) : null}
										<button
											type='button'
											onClick={() => {
												setAssistantMessages([
													{
														role: 'assistant',
														content:
															"Bonjour, je suis l’Assistant IA d’A.I.R. Je peux t’aider à améliorer ton CV, préparer un entretien, comprendre tes suggestions, ou adapter ta candidature à une offre.",
													},
												])
												setAssistantError('')
											}}
											className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'
										>
											Réinitialiser
										</button>
									</div>
								</div>

								{assistantError ? (
									<div className='mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{assistantError}</div>
								) : null}

								<div className='mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]'>
									<div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
										<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>CONVERSATION</p>
										<div className='mt-3 max-h-[56vh] space-y-3 overflow-y-auto pr-1'>
											{assistantMessages.map((m, idx) => (
												<div
													key={`msg-${idx}`}
													className={`rounded-2xl border p-4 ${m.role === 'user' ? 'border-cyan-200 bg-white' : 'border-slate-200 bg-white'}`}
												>
													<p className='text-xs font-black tracking-[0.12em] text-slate-500'>{m.role === 'user' ? 'VOUS' : 'ASSISTANT IA'}</p>
													<p className='mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700'>{m.content}</p>
												</div>
											))}
										</div>

										<div className='mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4'>
											<textarea
												rows={3}
												value={assistantInput}
												onChange={(e) => setAssistantInput(e.target.value)}
												placeholder='Pose ta question (CV, offre, entretien, compréhension des suggestions)…'
												className='w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-300'
											/>
											<div className='flex items-center justify-between gap-3 flex-wrap'>
												<div className='text-xs font-semibold text-slate-500'>
													{assistantLoading ? 'En cours…' : selectedJob ? `Offre: ${selectedJob.title}` : 'Aucune offre sélectionnée'}
												</div>
												<button
													type='button'
													onClick={handleAssistantSend}
													disabled={assistantLoading || !assistantInput.trim()}
													className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${assistantLoading || !assistantInput.trim() ? 'bg-slate-300' : 'bg-[#001d3e] hover:opacity-95'}`}
												>
													Envoyer
												</button>
											</div>
										</div>
									</div>

									<div className='rounded-2xl border border-slate-200 bg-white p-4'>
										<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>CONTEXTE (OPTIONNEL)</p>
										<p className='mt-2 text-xs font-semibold text-slate-600'>Ajoute l’offre (texte) et/ou ton CV en PDF pour une réponse plus précise.</p>
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
													value={assistantOfferText}
													onChange={(e) => setAssistantOfferText(e.target.value)}
													placeholder="Colle ici la description de l’offre (missions, compétences, exigences)…"
													className='mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-300'
												/>
											</div>
											<div>
												<p className='text-xs font-bold text-slate-700'>CV en PDF (optionnel)</p>
												<input
													type='file'
													accept='application/pdf,text/html'
													onChange={(e) => setAssistantFile(e.target.files?.[0] || null)}
													className='mt-2 block w-full text-xs font-semibold text-slate-700'
												/>
												{assistantFile ? (
													<div className='mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700'>
														Fichier: {assistantFile.name}
													</div>
												) : null}
											</div>
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