import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logo21 from '../../dist/logo21.png'

const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || '').trim())
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const clamp = (n, min, max) => Math.max(min, Math.min(max, n))
const isLikelyJitsiUrl = (value) => /jitsi|meet\.jit\.si/i.test(String(value || ''))

function InterviewMeet() {
	const location = useLocation()
	const navigate = useNavigate()
	const params = new URLSearchParams(location.search)
	const rawUrl = params.get('url') || ''
	const role = params.get('role') || ''
	const interviewId = params.get('interviewId') || ''
	const initialName = params.get('name') || ''
	const [displayName, setDisplayName] = useState(initialName)
	const [localScore, setLocalScore] = useState(null)
	const [localStress, setLocalStress] = useState(null)
	const [recruiterSummary, setRecruiterSummary] = useState(null)
	const [summaryError, setSummaryError] = useState('')
	const [reportData, setReportData] = useState(null)
	const [reportLoading, setReportLoading] = useState(false)
	const [reportError, setReportError] = useState('')
	const [evaluationRating, setEvaluationRating] = useState(0)
	const [evaluationComment, setEvaluationComment] = useState('')
	const [evaluationSaving, setEvaluationSaving] = useState(false)
	const [evaluationMessage, setEvaluationMessage] = useState('')
	const lastActivityRef = useRef(Date.now())
	const hasWindowFocusRef = useRef(true)

	const fallbackMeetUrl = useMemo(() => {
		const token = String(interviewId || '').replace(/[^a-zA-Z0-9-]/g, '')
		if (!token) return ''
		return `https://meet.jit.si/AIR-${token}`
	}, [interviewId])

	const effectiveMeetUrl = useMemo(() => {
		if (isHttpUrl(rawUrl)) {
			try {
				const u = new URL(rawUrl)
				if (isLikelyJitsiUrl(u.hostname)) return rawUrl
			} catch {
				// ignore and fallback below
			}
		}
		if (fallbackMeetUrl) return fallbackMeetUrl
		return isHttpUrl(rawUrl) ? rawUrl : ''
	}, [rawUrl, fallbackMeetUrl])

	const roomLabel = useMemo(() => {
		if (!isHttpUrl(effectiveMeetUrl)) return 'Salle non valide'
		try {
			const u = new URL(effectiveMeetUrl)
			const parts = u.pathname.split('/').filter(Boolean)
			return parts[parts.length - 1] || 'Entretien AIR'
		} catch {
			return 'Entretien AIR'
		}
	}, [effectiveMeetUrl])

	const iframeUrl = useMemo(() => {
		if (!isHttpUrl(effectiveMeetUrl)) return ''
		try {
			const u = new URL(effectiveMeetUrl)
			if (!isLikelyJitsiUrl(u.hostname)) return u.toString()
			const safeName = String(displayName || '').replace(/"/g, '').trim()
			const hashParts = [
				'config.prejoinPageEnabled=false',
				'config.startWithVideoMuted=false',
				'config.startWithAudioMuted=false',
				'config.startAudioOnly=false',
				'config.disableDeepLinking=true',
			]
			if (safeName) {
				hashParts.push(`userInfo.displayName=\"${encodeURIComponent(safeName)}\"`)
			}
			u.hash = hashParts.join('&')
			return u.toString()
		} catch {
			return ''
		}
	}, [effectiveMeetUrl, displayName])

	const normalizedRole = useMemo(() => {
		const r = String(role || '').toLowerCase()
		if (r.includes('recrut')) return 'recruiter'
		if (r.includes('cand')) return 'candidate'
		return 'candidate'
	}, [role])

	const dashboardPath = useMemo(() => {
		return normalizedRole === 'recruiter' ? '/EspaceRecruteur' : '/EspaceCandidat/dashboard'
	}, [normalizedRole])

	const localConcentrationBadge = useMemo(() => {
		if (!Number.isFinite(localScore)) return 'text-slate-600 bg-slate-100 border-slate-200'
		if (localScore >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
		if (localScore >= 50) return 'text-amber-700 bg-amber-50 border-amber-200'
		return 'text-rose-700 bg-rose-50 border-rose-200'
	}, [localScore])

	const localStressBadge = useMemo(() => {
		if (!Number.isFinite(localStress)) return 'text-slate-600 bg-slate-100 border-slate-200'
		if (localStress <= 35) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
		if (localStress <= 65) return 'text-amber-700 bg-amber-50 border-amber-200'
		return 'text-rose-700 bg-rose-50 border-rose-200'
	}, [localStress])

	const recruiterConcentrationBadge = useMemo(() => {
		const score = Number(recruiterSummary?.averageScore)
		if (!Number.isFinite(score)) return 'text-slate-600 bg-slate-100 border-slate-200'
		if (score >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
		if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200'
		return 'text-rose-700 bg-rose-50 border-rose-200'
	}, [recruiterSummary])

	const recruiterStressBadge = useMemo(() => {
		const stress = Number(recruiterSummary?.averageStress)
		if (!Number.isFinite(stress)) return 'text-slate-600 bg-slate-100 border-slate-200'
		if (stress <= 35) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
		if (stress <= 65) return 'text-amber-700 bg-amber-50 border-amber-200'
		return 'text-rose-700 bg-rose-50 border-rose-200'
	}, [recruiterSummary])

	useEffect(() => {
		const markActive = () => {
			lastActivityRef.current = Date.now()
		}
		const onFocus = () => {
			hasWindowFocusRef.current = true
			lastActivityRef.current = Date.now()
		}
		const onBlur = () => {
			hasWindowFocusRef.current = false
		}
		window.addEventListener('mousemove', markActive)
		window.addEventListener('keydown', markActive)
		window.addEventListener('click', markActive)
		window.addEventListener('focus', onFocus)
		window.addEventListener('blur', onBlur)
		return () => {
			window.removeEventListener('mousemove', markActive)
			window.removeEventListener('keydown', markActive)
			window.removeEventListener('click', markActive)
			window.removeEventListener('focus', onFocus)
			window.removeEventListener('blur', onBlur)
		}
	}, [])

	useEffect(() => {
		if (!interviewId || normalizedRole !== 'candidate') return undefined
		const timer = window.setInterval(() => {
			const inactivitySec = Math.round((Date.now() - lastActivityRef.current) / 1000)
			const isVisible = document.visibilityState === 'visible'
			const hasFocus = hasWindowFocusRef.current
			let stress = 10
			if (!isVisible) stress += 35
			if (!hasFocus) stress += 20
			if (inactivitySec > 20) stress += 15
			if (inactivitySec > 40) stress += 15
			if (inactivitySec > 90) stress += 10
			stress = clamp(Math.round(stress), 0, 100)
			let score = 100
			if (!isVisible) score -= 40
			if (!hasFocus) score -= 20
			if (inactivitySec > 20) score -= 20
			if (inactivitySec > 40) score -= 25
			score = clamp(Math.round(score), 0, 100)
			setLocalScore(score)
			setLocalStress(stress)

			fetch(`${API_BASE}/interviews/${encodeURIComponent(interviewId)}/metrics`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					role: 'candidate',
					concentrationScore: score,
					stressScore: stress,
					sampledAt: new Date().toISOString(),
					signals: {
						isVisible,
						hasFocus,
						inactivitySec,
						stressScore: stress,
					},
				}),
			}).catch(() => {
				// Avoid breaking meeting UI when network is unstable.
			})
		}, 2000)
		return () => window.clearInterval(timer)
	}, [interviewId, normalizedRole])

	useEffect(() => {
		if (!interviewId || normalizedRole !== 'recruiter') return undefined
		let stopped = false
		const loadSummary = async () => {
			try {
				const res = await fetch(`${API_BASE}/interviews/${encodeURIComponent(interviewId)}/metrics/summary?role=candidate&minutes=15`)
				const data = await res.json().catch(() => ({}))
				if (!res.ok || !data?.success) {
					throw new Error(data?.message || 'Impossible de charger le score de concentration.')
				}
				if (!stopped) {
					setRecruiterSummary(data.summary || null)
					setSummaryError('')
				}
			} catch (e) {
				if (!stopped) setSummaryError(String(e?.message || 'Erreur concentration'))
			}
		}
		loadSummary()
		const timer = window.setInterval(loadSummary, 5000)
		return () => {
			stopped = true
			window.clearInterval(timer)
		}
	}, [interviewId, normalizedRole])

	const loadExistingReport = async () => {
		if (!interviewId || normalizedRole !== 'recruiter') return
		setReportError('')
		setEvaluationMessage('')
		try {
			const res = await fetch(`${API_BASE}/interviews/${encodeURIComponent(interviewId)}/report`)
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				if (res.status === 404) {
					const genRes = await fetch(`${API_BASE}/interviews/${encodeURIComponent(interviewId)}/report/generate`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
					})
					const genData = await genRes.json().catch(() => ({}))
					if (!genRes.ok || !genData?.success) {
						throw new Error(genData?.message || 'Impossible de generer le bilan.')
					}
					const autoReport = genData.report || null
					setReportData(autoReport)
					setEvaluationRating(Number(autoReport?.recruiterEvaluation?.rating || 0))
					setEvaluationComment(String(autoReport?.recruiterEvaluation?.comment || ''))
					setEvaluationMessage('Bilan genere automatiquement.')
					return
				}
				throw new Error(data?.message || 'Aucun bilan disponible pour le moment.')
			}
			const nextReport = data.report || null
			setReportData(nextReport)
			setEvaluationRating(Number(nextReport?.recruiterEvaluation?.rating || 0))
			setEvaluationComment(String(nextReport?.recruiterEvaluation?.comment || ''))
		} catch (e) {
			setReportData(null)
			setReportError(String(e?.message || 'Erreur bilan'))
		}
	}

	const handleGenerateReportAndFinish = async () => {
		if (!interviewId || normalizedRole !== 'recruiter') {
			navigate(-1)
			return
		}
		setReportLoading(true)
		setReportError('')
		try {
			const res = await fetch(`${API_BASE}/interviews/${encodeURIComponent(interviewId)}/report/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				throw new Error(data?.message || 'Impossible de generer le bilan complet.')
			}
			const nextReport = data.report || null
			setReportData(nextReport)
			setEvaluationRating(Number(nextReport?.recruiterEvaluation?.rating || 0))
			setEvaluationComment(String(nextReport?.recruiterEvaluation?.comment || ''))
		} catch (e) {
			setReportError(String(e?.message || 'Erreur bilan'))
		} finally {
			setReportLoading(false)
		}
	}

	const handleSaveRecruiterEvaluation = async () => {
		if (!interviewId || normalizedRole !== 'recruiter') return
		setEvaluationMessage('')
		setReportError('')
		if (!Number.isFinite(evaluationRating) || evaluationRating < 1 || evaluationRating > 5) {
			setReportError('Choisissez une note entre 1 et 5 etoiles.')
			return
		}

		setEvaluationSaving(true)
		try {
			const recruiterRaw = localStorage.getItem('airRecruiter')
			const recruiter = recruiterRaw ? JSON.parse(recruiterRaw) : null
			const recruiterId = recruiter?.id || recruiter?._id || ''
			const res = await fetch(`${API_BASE}/interviews/${encodeURIComponent(interviewId)}/report/evaluation`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					recruiterId,
					rating: evaluationRating,
					comment: evaluationComment,
				}),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				throw new Error(data?.message || 'Impossible d enregistrer l evaluation.')
			}
			setReportData(data.report || null)
			setEvaluationMessage('Evaluation enregistree avec succes.')
		} catch (e) {
			setReportError(String(e?.message || 'Erreur evaluation'))
		} finally {
			setEvaluationSaving(false)
		}
	}

	const downloadReportJson = () => {
		if (!reportData) return
		const payload = JSON.stringify(reportData, null, 2)
		const blob = new Blob([payload], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = `bilan-entretien-${interviewId || 'air'}.json`
		link.click()
		URL.revokeObjectURL(url)
	}

	if (!isHttpUrl(effectiveMeetUrl)) {
		return (
			<div className='min-h-screen bg-slate-950 px-4 py-10 text-white'>
				<div className='mx-auto max-w-2xl rounded-2xl border border-rose-400/40 bg-rose-950/30 p-6'>
					<p className='text-lg font-bold'>Lien de reunion invalide</p>
					<p className='mt-2 text-sm text-rose-100/90'>Le lien n est pas disponible. Retourne au dashboard pour ouvrir l entretien depuis la carte planifiee.</p>
					<button
						type='button'
						onClick={() => navigate(-1)}
						className='mt-4 rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10'
					>
						Retour
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-slate-50 text-slate-900'>
			<div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4'>
				<div className='flex items-center gap-3'>
					<button
						type='button'
						onClick={() => navigate(dashboardPath)}
						className='group relative rounded-full p-0.5 transition duration-300 hover:scale-[1.03]'
						title='Retour dashboard AIR'
					>
						<span className='absolute inset-0 rounded-full bg-cyan-400/30 blur-md transition group-hover:bg-cyan-300/40' />
						<span className='relative block rounded-full ring-2 ring-cyan-300/80 shadow-[0_0_26px_rgba(34,211,238,0.45)]'>
							<img src={logo21} alt='AIR logo' className='h-14 w-14 rounded-full object-cover' />
						</span>
					</button>
					<div>
						<p className='text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700'>AIR Meet</p>
						<p className='text-sm font-semibold text-slate-800'>{roomLabel}</p>
						<p className='mt-1 text-xs text-slate-600'>Session Jitsi intégrée dans AIR</p>
					</div>
				</div>
				<div className='flex items-center gap-2'>
					<input
						className='w-52 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 md:w-64'
						placeholder='Nom affiché dans la réunion'
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
					/>
					{normalizedRole === 'recruiter' ? (
						<button
							type='button'
							onClick={loadExistingReport}
							className='rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50'
						>
							Voir bilan
						</button>
					) : null}
					<button
						type='button'
						onClick={() => navigate(dashboardPath)}
						className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100'
					>
						Retour dashboard
					</button>
				</div>
			</div>

			<div className='h-[calc(100vh-86px)] overflow-y-auto bg-white'>
				<div className='mx-auto w-full max-w-[1460px] px-4 py-4'>
					<div className='grid grid-cols-1 gap-4 lg:grid-cols-[420px_minmax(0,1fr)]'>
						<aside className='order-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:order-1 lg:sticky lg:top-4 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto'>
					{normalizedRole === 'candidate' ? (
						<div className='grid grid-cols-1 gap-4'>
							<div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
								<p className='text-sm font-black text-[#0d355b]'>Détection en direct</p>
								<div className='mt-3 grid grid-cols-1 gap-3'>
									<div className={`rounded-lg border px-3 py-2 ${localConcentrationBadge}`}>
										<p className='text-[11px] font-black uppercase tracking-wide'>Concentration</p>
										<p className='mt-1 text-lg font-black'>{localScore ?? '--'}/100</p>
									</div>
									<div className={`rounded-lg border px-3 py-2 ${localStressBadge}`}>
										<p className='text-[11px] font-black uppercase tracking-wide'>Stress estimé</p>
										<p className='mt-1 text-lg font-black'>{localStress ?? '--'}/100</p>
									</div>
								</div>
								<p className='mt-3 text-xs text-slate-600'>Gardez l onglet actif et la caméra ouverte pour des mesures fiables.</p>
							</div>
							<div className='rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-xs text-cyan-900'>
								<p className='font-bold'>Conseils rapides</p>
								<ul className='mt-2 list-disc space-y-1 pl-4'>
									<li>Placez votre visage au centre de la caméra.</li>
									<li>Réduisez les changements d onglet pendant l entretien.</li>
									<li>Vérifiez micro/caméra autorisés dans le navigateur.</li>
								</ul>
								<div className='mt-3 rounded-lg border border-cyan-200 bg-white/70 p-3 text-[11px]'>
									Une bonne lumière et un cadrage stable améliorent la lecture des signaux.
								</div>
							</div>
						</div>
					) : (
						<>
							<div className='grid grid-cols-1 gap-4'>
								<div className='rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-xs text-cyan-900'>
									<p className='font-bold'>Panel concentration candidat</p>
									<div className='mt-2 grid grid-cols-1 gap-2'>
										<div className={`rounded-lg border px-3 py-2 ${recruiterConcentrationBadge}`}>
											<p className='text-[11px] font-black uppercase tracking-wide'>Concentration moyenne</p>
											<p className='mt-1 text-base font-black'>{recruiterSummary?.averageScore ?? '--'}/100</p>
										</div>
										<div className={`rounded-lg border px-3 py-2 ${recruiterStressBadge}`}>
											<p className='text-[11px] font-black uppercase tracking-wide'>Stress moyen</p>
											<p className='mt-1 text-base font-black'>{recruiterSummary?.averageStress ?? '--'}/100</p>
										</div>
									</div>
									<p className='mt-2'>Score global: {recruiterSummary?.overallScore100 ?? '--'}/100 | Echantillons: {recruiterSummary?.sampleCount ?? 0}</p>
									{summaryError ? <p className='mt-2 text-rose-700'>{summaryError}</p> : null}
								</div>
								<div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
									<div className='flex items-center justify-between gap-2'>
										<p className='text-sm font-black text-[#0d355b]'>Bilan entretien</p>
										<button
											type='button'
											onClick={handleGenerateReportAndFinish}
											disabled={reportLoading}
											className='rounded border border-cyan-300 bg-cyan-50 px-2 py-1 text-[11px] font-bold text-cyan-800 hover:bg-cyan-100 disabled:opacity-60'
										>
											{reportLoading ? 'Generation...' : 'Generer bilan'}
										</button>
									</div>
									{reportError ? <p className='mt-2 text-xs text-rose-700'>{reportError}</p> : null}
									{evaluationMessage ? <p className='mt-2 text-xs text-emerald-700'>{evaluationMessage}</p> : null}
									{reportData ? (
										<>
											<p className='mt-2 text-xs text-slate-700'>Résumé: {reportData?.summary?.summaryText || '—'}</p>
											<p className='mt-1 text-xs text-slate-700'>Score global: {reportData?.summary?.overallScore100 ?? '--'}/100</p>
											<p className='mt-1 text-xs text-slate-700'>Focus: {reportData?.behaviorAnalysis?.focusRate ?? '--'}% | Durée: {reportData?.metricsOverview?.durationMinutes ?? 0} min</p>
											<div className='mt-2'>
												<button
													type='button'
													onClick={downloadReportJson}
													className='rounded border border-cyan-300 bg-cyan-50 px-2 py-1 text-[11px] font-bold text-cyan-800 hover:bg-cyan-100'
												>
													Exporter JSON
												</button>
											</div>
										</>
									) : (
										<p className='mt-2 text-xs text-slate-500'>Aucun bilan disponible pour le moment.</p>
									)}
								</div>
							</div>

							<div className='mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
								<p className='text-sm font-black text-[#0d355b]'>Evaluation recruteur</p>
								<div className='mt-3 flex flex-wrap items-center gap-2'>
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											key={`eval-star-${star}`}
											type='button'
											onClick={() => setEvaluationRating(star)}
											className={`h-8 w-8 rounded-full border text-sm transition ${star <= evaluationRating ? 'border-amber-300 bg-amber-100 text-amber-700' : 'border-slate-300 bg-white text-slate-500'}`}
										>
											★
										</button>
									))}
								</div>
								<textarea
									rows={3}
									value={evaluationComment}
									onChange={(e) => setEvaluationComment(e.target.value)}
									placeholder='Commentaire RH (optionnel)'
									className='mt-3 w-full rounded border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-cyan-500'
								/>
								<div className='mt-3 flex items-center justify-between gap-3'>
									<p className='text-[11px] text-slate-500'>Ajoutez un feedback concret pour aider le candidat à progresser.</p>
									<button
										type='button'
										onClick={handleSaveRecruiterEvaluation}
										disabled={evaluationSaving}
										className='rounded border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-[11px] font-bold text-cyan-800 hover:bg-cyan-100 disabled:opacity-60'
									>
										{evaluationSaving ? 'Enregistrement...' : 'Enregistrer evaluation'}
									</button>
								</div>
							</div>
						</>
					)}
						</aside>

						<div className='order-1 lg:order-2'>
							<div className='overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm'>
								<iframe
									title='AIR Interview Meet'
									src={iframeUrl || effectiveMeetUrl}
									allow='camera; microphone; fullscreen; display-capture; autoplay; clipboard-read; clipboard-write'
									className='h-[calc(100vh-120px)] min-h-[560px] w-full border-0'
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default InterviewMeet
