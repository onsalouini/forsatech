import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CandidateHeader from '../components/CandidateHeader'
import StepProgress from '../components/StepProgress'
import { assets } from '../assets/assets'
import { loadCvDraft } from '../utils/cvDraft'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

function CandidateCVBuildReview() {
	const navigate = useNavigate()
	const [draft, setDraft] = useState(() => loadCvDraft())
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [cvFilePath, setCvFilePath] = useState('')
	const autoRunRef = useRef(false)

	useEffect(() => {
		const rawCandidate = localStorage.getItem('airCandidate')
		if (!rawCandidate) {
			navigate('/connecter')
			return
		}
		setDraft(loadCvDraft())
	}, [navigate])

	const steps = useMemo(() => ['Informations', 'Parcours', 'Finaliser'], [])

	const step1Ratio = useMemo(() => {
		const required = ['firstName', 'lastName', 'professionalTitle', 'email', 'phone', 'city', 'country', 'birthDate', 'nationality']
		let ok = 0
		for (const key of required) {
			if (String(draft.personal?.[key] || '').trim()) ok += 1
		}
		return required.length ? ok / required.length : 0
	}, [draft.personal])

	const step2Ratio = useMemo(() => {
		const checks = [
			String(draft.content?.professionalSummary || '').trim() !== '',
			String(draft.content?.skills || '').trim() !== '',
			Array.isArray(draft.content?.educationItems) && draft.content.educationItems.length > 0,
			Array.isArray(draft.content?.experienceItems) && draft.content.experienceItems.length > 0,
			Array.isArray(draft.content?.languages) && draft.content.languages.length > 0,
			Array.isArray(draft.content?.projects) && draft.content.projects.length > 0,
			Array.isArray(draft.content?.qualities) && draft.content.qualities.length > 0,
		]
		const ok = checks.filter(Boolean).length
		return checks.length ? ok / checks.length : 0
	}, [draft.content])

	const completionByStep = useMemo(() => ({ 1: step1Ratio, 2: step2Ratio, 3: 1 }), [step1Ratio, step2Ratio])

	const generateAndSave = async () => {
		setError('')
		setSuccess('')
		try {
			const rawCandidate = localStorage.getItem('airCandidate')
			if (!rawCandidate) {
				navigate('/connecter')
				return
			}
			const candidate = JSON.parse(rawCandidate)
			if (!candidate?.id) {
				setError('Session invalide. Veuillez vous reconnecter.')
				return
			}

			setLoading(true)
			const response = await fetch(`${API_BASE}/cv/generated`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					candidateId: candidate.id,
					personal: draft.personal,
					content: draft.content,
				}),
			})
			const data = await response.json()
			if (!response.ok || !data.success) {
				setError(data.message || 'Enregistrement impossible.')
				return
			}
			const nextPath = data?.cv?.uploadedFile?.path || ''
			setCvFilePath(nextPath)
			setSuccess('CV généré, téléchargeable et enregistré avec succès.')
		} catch {
			setError('Serveur indisponible. Vérifiez que le backend tourne.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		// Auto-generate and save once when arriving on step 3.
		if (autoRunRef.current) return
		autoRunRef.current = true
		generateAndSave()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const cvUrl = useMemo(() => {
		if (!cvFilePath) return ''
		return `${API_ORIGIN}${cvFilePath}`
	}, [cvFilePath])

	const handleDownload = async () => {
		if (!cvUrl) return
		try {
			const res = await fetch(cvUrl)
			const blob = await res.blob()
			const url = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			
			// Extract filename from path or default to cv.html
			const parts = cvFilePath.split('/')
			const fileName = parts.length > 0 ? parts[parts.length - 1] : 'mon-cv.html'
			
			link.download = fileName
			document.body.appendChild(link)
			link.click()
			link.remove()
			window.URL.revokeObjectURL(url)
		} catch (err) {
			console.error('Erreur lors du téléchargement:', err)
			window.open(cvUrl, '_blank')
		}
	}

	return (
		<section className='relative w-full min-h-screen bg-cover bg-center flex flex-col' style={{ backgroundImage: `url(${assets.couverture})` }}>
			<div className='absolute inset-0 bg-gradient-to-br from-[#020b16]/90 via-[#06213a]/80 to-[#020b16]/90 backdrop-blur-sm' />

			<CandidateHeader
				onLogoClick={() => navigate('/')}
				onLogout={() => {
					localStorage.removeItem('airCandidate')
					navigate('/')
				}}
			/>

			<main className='relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col gap-6'>
				<div className='w-full'>
					<StepProgress currentStep={3} steps={steps} completionByStep={completionByStep} />
				</div>

				<div className='w-full rounded-[1.5rem] border border-white/10 bg-white/10 backdrop-blur-md p-4 flex flex-col sm:flex-row items-center gap-4'>
					<div className='h-12 w-12 shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-2xl shadow-inner border border-white/10'>
						💡
					</div>
					<div className='text-center sm:text-left'>
						<p className='text-sm font-extrabold text-white uppercase tracking-wider'>Conseil</p>
						<p className='mt-1 text-sm text-white/90'>Votre CV est généré automatiquement et enregistré en base. Vous pouvez le télécharger ou revenir pour le modifier.</p>
					</div>
				</div>

				<div className='w-full bg-white/95 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] border border-white/20 mx-auto'>
						<div className='px-8 sm:px-12 py-8 bg-gradient-to-r from-[#f4fbfc] via-white to-[#f4fbfc] border-b border-[#0a7da4]/10'>
							<div className='flex items-start justify-between gap-3 flex-wrap'>
								<div>
									<h1 className='text-2xl sm:text-3xl font-black text-[#06213a]'>Étape 3 — CV généré</h1>
									<p className='mt-2 text-sm sm:text-base text-slate-600'>Téléchargez votre CV ou revenez pour le modifier.</p>
								</div>
								<div className='flex items-center gap-2'>
									{cvUrl ? (
										<button
											type='button'
											onClick={handleDownload}
											className='rounded-xl bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-110'
										>
											Télécharger
										</button>
									) : null}
									<button
										type='button'
										onClick={() => navigate('/EspaceCandidat/construire/etape-2')}
										className='rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50'
									>
										Modifier
									</button>
								</div>
							</div>
						</div>

						<div className='p-6 sm:p-10 bg-[#fdfdfd]'>
							{error ? (
								<div className='mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold'>{error}</div>
							) : null}
							{success ? (
								<div className='mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 font-semibold'>{success}</div>
							) : null}

							<div className='grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start'>
								<div className='rounded-2xl border border-slate-200 bg-white overflow-hidden'>
									<div className='px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap'>
										<p className='text-sm font-black text-[#06213a]'>Aperçu du CV</p>
										{loading ? <span className='text-xs font-bold text-slate-500'>Génération…</span> : null}
									</div>
									{cvUrl ? (
										<iframe title='CV généré' src={cvUrl} className='w-full h-[720px] bg-white' />
									) : (
										<div className='p-5 text-sm text-slate-600'>Aperçu indisponible pour le moment. Cliquez sur “Régénérer” si nécessaire.</div>
									)}
								</div>

								<div className='rounded-2xl border border-slate-200 bg-white p-5'>
									<p className='text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Récapitulatif</p>
									<p className='mt-2 text-sm font-bold text-[#06213a]'>
										{draft.personal.firstName} {draft.personal.lastName}
									</p>
									<p className='mt-1 text-sm text-slate-600'>{draft.personal.professionalTitle}</p>
									<p className='mt-3 text-sm text-slate-700'><span className='font-bold'>Email:</span> {draft.personal.email}</p>
									<p className='mt-1 text-sm text-slate-700'><span className='font-bold'>Téléphone:</span> {draft.personal.phone}</p>
									<p className='mt-1 text-sm text-slate-700'><span className='font-bold'>Ville:</span> {draft.personal.city}</p>
									<p className='mt-1 text-sm text-slate-700'><span className='font-bold'>Pays:</span> {draft.personal.country}</p>
									<p className='mt-3 text-xs font-bold text-slate-500'>Progression étape 2: {Math.round(step2Ratio * 100)}%</p>
								</div>
							</div>

							<div className='mt-7 flex items-center justify-between gap-3 flex-wrap'>
								<button type='button' onClick={() => navigate('/EspaceCandidat/construire/etape-2')} className='rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-cyan-600/20'>
									← Retour
								</button>
								<div className='flex items-center gap-2'>
									<button disabled={loading} type='button' onClick={generateAndSave} className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-600/20 ${loading ? 'bg-slate-400' : 'bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] hover:brightness-110'}`}>
										{loading ? 'Génération…' : 'Régénérer'}
									</button>
									<button type='button' onClick={() => navigate('/EspaceCandidat/dashboard')} className='rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-cyan-600/20'>
										Terminer
									</button>
								</div>
							</div>
						</div>
					</div>
			</main>
		</section>
	)
}

export default CandidateCVBuildReview
