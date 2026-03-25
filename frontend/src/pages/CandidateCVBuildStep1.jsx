import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CandidateHeader from '../components/CandidateHeader'
import StepProgress from '../components/StepProgress'
import { assets } from '../assets/assets'
import { loadCvDraft, saveCvDraft } from '../utils/cvDraft'

function CandidateCVBuildStep1() {
	const navigate = useNavigate()
	const [draft, setDraft] = useState(() => loadCvDraft())
	const [error, setError] = useState('')
	const [saving, setSaving] = useState(false)
	const [savedAt, setSavedAt] = useState('')

	useEffect(() => {
		const rawCandidate = localStorage.getItem('airCandidate')
		if (!rawCandidate) {
			navigate('/connecter')
			return
		}

		// Prefill if draft empty
		try {
			const candidate = JSON.parse(rawCandidate)
			setDraft((prev) => {
				const alreadyHasAny = Object.values(prev.personal || {}).some((v) => String(v || '').trim() !== '')
				if (alreadyHasAny) return prev

				return {
					...prev,
					personal: {
						...prev.personal,
						firstName: candidate.firstName || prev.personal.firstName,
						lastName: candidate.lastName || prev.personal.lastName,
						professionalTitle: candidate.professionalTitle || prev.personal.professionalTitle,
						email: candidate.email || prev.personal.email,
						country: candidate.country || prev.personal.country,
						birthDate: candidate.birthDate ? String(candidate.birthDate).slice(0, 10) : prev.personal.birthDate,
						portfolio: candidate.portfolioUrl || prev.personal.portfolio,
					},
				}
			})
		} catch {
			// ignore
		}
	}, [navigate])

	useEffect(() => {
		setSaving(true)
		const timer = setTimeout(() => {
			const saved = saveCvDraft({ personal: draft.personal, content: draft.content })
			setSavedAt(saved?.savedAt || '')
			setSaving(false)
		}, 450)
		return () => clearTimeout(timer)
	}, [draft.personal, draft.content])

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
		const required = ['professionalSummary', 'education', 'experience', 'skills']
		let ok = 0
		for (const key of required) {
			if (String(draft.content?.[key] || '').trim()) ok += 1
		}
		return required.length ? ok / required.length : 0
	}, [draft.content])

	const completionByStep = useMemo(() => ({ 1: step1Ratio, 2: step2Ratio, 3: 0 }), [step1Ratio, step2Ratio])

	const updatePersonal = (field, value) => {
		setError('')
		setDraft((prev) => ({
			...prev,
			personal: {
				...prev.personal,
				[field]: value,
			},
		}))
	}

	const onProfileImageChange = async (file) => {
		setError('')
		if (!file) {
			updatePersonal('profileImageDataUrl', '')
			return
		}

		const maxMb = 1
		const sizeMb = file.size / (1024 * 1024)
		if (sizeMb > maxMb) {
			setError(`Image trop volumineuse. Max ${maxMb} MB.`)
			return
		}

		if (!file.type.startsWith('image/')) {
			setError('Format image non supporté.')
			return
		}

		const reader = new FileReader()
		reader.onload = () => {
			updatePersonal('profileImageDataUrl', String(reader.result || ''))
		}
		reader.readAsDataURL(file)
	}

	const handleNext = () => {
		setError('')
		if (step1Ratio < 1) {
			setError('Veuillez compléter tous les champs obligatoires (*) pour continuer.')
			return
		}
		navigate('/EspaceCandidat/construire/etape-2')
	}

	const savedLabel = useMemo(() => {
		if (!savedAt) return ''
		try {
			const d = new Date(savedAt)
			const hh = String(d.getHours()).padStart(2, '0')
			const mm = String(d.getMinutes()).padStart(2, '0')
			return `${hh}:${mm}`
		} catch {
			return ''
		}
	}, [savedAt])

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
					<StepProgress currentStep={1} steps={steps} completionByStep={completionByStep} />
				</div>

				<div className='w-full rounded-[2rem] border border-white/10 bg-white/10 backdrop-blur-md p-6 flex flex-col sm:flex-row items-center justify-between gap-4'>
					<div className='text-center sm:text-left'>
						<p className='text-sm font-extrabold text-white uppercase tracking-wider'>Photo de profil</p>
						<p className='mt-1 text-xs text-white/80'>Ajoutez une photo (optionnel). Recommandé: carré, fond clair. Max: 1 MB.</p>
					</div>

					<div className='flex items-center gap-4'>
						<div className='h-20 w-20 rounded-[1.25rem] bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shrink-0 shadow-inner'>
							{draft.personal.profileImageDataUrl ? (
								<img src={draft.personal.profileImageDataUrl} alt='Aperçu' className='h-full w-full object-cover' />
							) : (
								<span className='text-white/60 text-xs font-bold'>Aperçu</span>
							)}
						</div>

						<div className='flex flex-col gap-2'>
							<label className='cursor-pointer inline-flex items-center justify-center rounded-xl bg-white/20 border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30 transition-colors shadow-sm'>
								Choisir une image
								<input type='file' accept='image/*' className='hidden' onChange={(e) => onProfileImageChange(e.target.files?.[0] || null)} />
							</label>

							{draft.personal.profileImageDataUrl ? (
								<button type='button' className='text-xs font-semibold text-white/70 hover:text-white self-center sm:self-start' onClick={() => updatePersonal('profileImageDataUrl', '')}>
									Retirer la photo
								</button>
							) : null}
						</div>
					</div>
				</div>

				<div className='w-full bg-white/95 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] border border-white/20 mx-auto'>
					<div className='px-8 sm:px-12 py-8 bg-gradient-to-r from-[#f4fbfc] via-white to-[#f4fbfc] border-b border-[#0a7da4]/10'>
							<h1 className='text-2xl sm:text-3xl font-black text-[#06213a]'>Étape 1 — Informations</h1>
							<p className='mt-2 text-sm sm:text-base text-slate-600'>Renseignez vos informations de base. Les champs marqués (*) sont obligatoires.</p>
						</div>

						<div className='p-6 sm:p-10 bg-[#fdfdfd]'>
							{error ? (
								<div className='mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold'>{error}</div>
							) : null}

							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Prénom *</label>
									<input value={draft.personal.firstName} onChange={(e) => updatePersonal('firstName', e.target.value)} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Votre prénom' />
								</div>
								<div>
									<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Nom *</label>
									<input value={draft.personal.lastName} onChange={(e) => updatePersonal('lastName', e.target.value)} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Votre nom' />
								</div>

								<div className='md:col-span-2'>
									<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Titre professionnel *</label>
									<input value={draft.personal.professionalTitle} onChange={(e) => updatePersonal('professionalTitle', e.target.value)} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Ex: Développeur Full-Stack React / Node.js' />
								</div>

								<div>
									<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Email *</label>
									<input type='email' value={draft.personal.email} onChange={(e) => updatePersonal('email', e.target.value)} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='vous@email.com' />
								</div>
								<div>
									<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Téléphone *</label>
									<input value={draft.personal.phone} onChange={(e) => updatePersonal('phone', e.target.value)} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='+216 XX XXX XXX' />
								</div>

								<div>
									<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Ville *</label>
									<input value={draft.personal.city} onChange={(e) => updatePersonal('city', e.target.value)} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Tunis' />
								</div>
								<div>
									<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Pays *</label>
									<input value={draft.personal.country} onChange={(e) => updatePersonal('country', e.target.value)} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Tunisie' />
								</div>

								<div>
									<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>LinkedIn</label>
									<input value={draft.personal.linkedin} onChange={(e) => updatePersonal('linkedin', e.target.value)} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='linkedin.com/in/…' />
								</div>
								<div>
									<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Github / Portfolio</label>
									<input value={draft.personal.portfolio} onChange={(e) => updatePersonal('portfolio', e.target.value)} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='github.com/… ou portfolio' />
								</div>

								<div>
									<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Date de naissance *</label>
									<input type='date' value={draft.personal.birthDate} onChange={(e) => updatePersonal('birthDate', e.target.value)} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' />
								</div>
								<div>
									<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Nationalité *</label>
									<input value={draft.personal.nationality} onChange={(e) => updatePersonal('nationality', e.target.value)} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Ex: Tunisienne' />
								</div>
							</div>

							<div className='mt-7 flex items-center justify-between gap-3 flex-wrap'>
								<div className='text-xs font-bold text-slate-500'>
									{saving ? 'Sauvegarde…' : savedLabel ? `Sauvegardé à ${savedLabel}` : 'Autosave activé'}
								</div>
								<div className='flex items-center gap-2'>
									<button type='button' onClick={() => navigate('/EspaceCandidat')} className='rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-cyan-600/20'>
										← Retour
									</button>
									<button type='button' onClick={handleNext} className='rounded-xl bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-cyan-600/20'>
										Prochaine étape →
									</button>
								</div>
							</div>
						</div>
					</div>
			</main>
		</section>
	)
}

export default CandidateCVBuildStep1
