import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || '').trim())
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

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
	const [recruiterSummary, setRecruiterSummary] = useState(null)
	const [summaryError, setSummaryError] = useState('')
	const [reportData, setReportData] = useState(null)
	const [reportLoading, setReportLoading] = useState(false)
	const [reportError, setReportError] = useState('')
	const lastActivityRef = useRef(Date.now())
	const hasWindowFocusRef = useRef(true)

	const roomLabel = useMemo(() => {
		if (!isHttpUrl(rawUrl)) return 'Salle non valide'
		try {
			const u = new URL(rawUrl)
			const parts = u.pathname.split('/').filter(Boolean)
			return parts[parts.length - 1] || 'Entretien AIR'
		} catch {
			return 'Entretien AIR'
		}
	}, [rawUrl])

	const iframeUrl = useMemo(() => {
		if (!isHttpUrl(rawUrl)) return ''
		try {
			const u = new URL(rawUrl)
			const safeName = String(displayName || '').replace(/"/g, '').trim()
			const hashParts = ['config.prejoinPageEnabled=false']
			if (safeName) {
				hashParts.push(`userInfo.displayName=\"${encodeURIComponent(safeName)}\"`)
			}
			u.hash = hashParts.join('&')
			return u.toString()
		} catch {
			return ''
		}
	}, [rawUrl, displayName])

	const normalizedRole = useMemo(() => {
		const r = String(role || '').toLowerCase()
		if (r.includes('recrut')) return 'recruiter'
		if (r.includes('cand')) return 'candidate'
		return 'candidate'
	}, [role])

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
			let score = 100
			if (!isVisible) score -= 40
			if (!hasFocus) score -= 20
			if (inactivitySec > 20) score -= 20
			if (inactivitySec > 40) score -= 25
			score = clamp(Math.round(score), 0, 100)
			setLocalScore(score)

			fetch(`${API_BASE}/interviews/${encodeURIComponent(interviewId)}/metrics`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					role: 'candidate',
					concentrationScore: score,
					sampledAt: new Date().toISOString(),
					signals: {
						isVisible,
						hasFocus,
						inactivitySec,
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
		try {
			const res = await fetch(`${API_BASE}/interviews/${encodeURIComponent(interviewId)}/report`)
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				throw new Error(data?.message || 'Aucun bilan disponible pour le moment.')
			}
			setReportData(data.report || null)
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
			setReportData(data.report || null)
		} catch (e) {
			setReportError(String(e?.message || 'Erreur bilan'))
		} finally {
			setReportLoading(false)
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

	if (!isHttpUrl(rawUrl)) {
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
		<div className='min-h-screen bg-slate-950 text-white'>
			<div className='flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900/90 px-4 py-3'>
				<div>
					<p className='text-xs font-bold uppercase tracking-[0.12em] text-cyan-300'>{role || 'entretien'}</p>
					<p className='text-sm font-semibold text-white/90'>{roomLabel}</p>
					{normalizedRole === 'candidate' ? (
						<p className='mt-1 text-xs text-slate-300'>Concentration locale (indicatif): {localScore ?? '--'}/100</p>
					) : null}
					{normalizedRole === 'recruiter' ? (
						<p className='mt-1 text-xs text-slate-300'>Concentration candidat: {recruiterSummary?.averageScore ?? '--'}/100 ({recruiterSummary?.status || 'En attente'})</p>
					) : null}
				</div>
				<div className='flex items-center gap-2'>
					<input
						className='w-56 rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400'
						placeholder='Nom affiche dans la reunion'
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
					/>
					<a
						href={iframeUrl || rawUrl}
						target='_blank'
						rel='noreferrer'
						className='rounded-lg border border-cyan-400/50 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/10'
					>
						Ouvrir dans un nouvel onglet
					</a>
					{normalizedRole === 'recruiter' ? (
						<>
							<button
								type='button'
								onClick={loadExistingReport}
								className='rounded-lg border border-emerald-400/50 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-400/10'
							>
								Voir bilan
							</button>
							<button
								type='button'
								onClick={handleGenerateReportAndFinish}
								disabled={reportLoading}
								className='rounded-lg border border-cyan-300/60 bg-cyan-900/40 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-800/50 disabled:opacity-60'
							>
								{reportLoading ? 'Generation...' : 'Terminer + bilan complet'}
							</button>
						</>
					) : null}
					<button
						type='button'
						onClick={() => navigate(-1)}
						className='rounded-lg border border-white/20 px-3 py-2 text-xs font-bold hover:bg-white/10'
					>
						Quitter
					</button>
				</div>
			</div>
			{normalizedRole === 'recruiter' ? (
				<div className='mx-4 mt-3 rounded-xl border border-cyan-400/30 bg-cyan-950/30 px-4 py-3 text-xs text-cyan-100'>
					<p className='font-bold'>Panel concentration (indicatif)</p>
					<p className='mt-1'>Moyenne 15 min: {recruiterSummary?.averageScore ?? '--'} | Derniere mesure: {recruiterSummary?.latestScore ?? '--'} | Echantillons: {recruiterSummary?.sampleCount ?? 0}</p>
					{summaryError ? <p className='mt-1 text-rose-200'>{summaryError}</p> : null}
					{reportError ? <p className='mt-1 text-rose-200'>{reportError}</p> : null}
					{reportData ? (
						<div className='mt-3 rounded-lg border border-cyan-300/30 bg-slate-900/40 p-3 text-cyan-50'>
							<div className='flex items-center justify-between gap-2'>
								<p className='font-bold'>Bilan complet disponible</p>
								<button
									type='button'
									onClick={downloadReportJson}
									className='rounded border border-cyan-300/50 px-2 py-1 text-[11px] font-bold hover:bg-cyan-800/40'
								>
									Exporter JSON
								</button>
							</div>
							<p className='mt-2'>Resume: {reportData?.summary?.summaryText || '—'}</p>
							<p className='mt-1'>Score moyen: {reportData?.metricsOverview?.averageScore ?? '--'} | Duree: {reportData?.metricsOverview?.durationMinutes ?? 0} min | Echantillons: {reportData?.metricsOverview?.sampleCount ?? 0}</p>
							<p className='mt-1'>Visibilite: {reportData?.behaviorAnalysis?.visibilityRate ?? '--'}% | Focus: {reportData?.behaviorAnalysis?.focusRate ?? '--'}%</p>
							{Array.isArray(reportData?.recommendations) && reportData.recommendations.length > 0 ? (
								<ul className='mt-2 list-disc pl-5'>
									{reportData.recommendations.slice(0, 3).map((rec, idx) => (
										<li key={`rec-${idx}`}>{rec}</li>
									))}
								</ul>
							) : null}
						</div>
					) : null}
				</div>
			) : null}
			<iframe
				title='AIR Interview Meet'
				src={iframeUrl || rawUrl}
				allow='camera; microphone; fullscreen; display-capture; autoplay; clipboard-read; clipboard-write'
				className='h-[calc(100vh-72px)] w-full border-0'
			/>
		</div>
	)
}

export default InterviewMeet
