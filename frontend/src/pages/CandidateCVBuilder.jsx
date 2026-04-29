import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CandidateHeader from '../components/CandidateHeader'
import StepProgress from '../components/StepProgress'
import { assets } from '../assets/assets'
import { clearCvDraft, clearLegacyCvDraft, loadCvDraft, saveCvDraft } from '../utils/cvDraft'

function getStoredCandidateId() {
	try {
		const raw = localStorage.getItem('airCandidate')
		if (!raw) return ''
		const candidate = JSON.parse(raw)
		return String(candidate?.id || candidate?._id || '').trim()
	} catch {
		return ''
	}
}

function CandidateCVBuilder() {
	const navigate = useNavigate()
	const [candidateId] = useState(() => getStoredCandidateId())
	const [draft, setDraft] = useState(() => loadCvDraft(candidateId || '__no_candidate__'))
	const [lastSavedAt, setLastSavedAt] = useState(null)
	const [restored, setRestored] = useState(false)

	useEffect(() => {
		const candidate = localStorage.getItem('airCandidate')
		if (!candidate) {
			navigate('/connecter')
			return
		}
		if (!candidateId) {
			localStorage.removeItem('airCandidate')
			navigate('/connecter')
			return
		}

		const loaded = loadCvDraft(candidateId)
		const hasContent = Object.values(loaded.content || {}).some((v) => {
			if (Array.isArray(v)) return v.length > 0
			return String(v || '').trim() !== ''
		})
		if (hasContent) {
			setDraft(loaded)
			if (loaded.savedAt) setLastSavedAt(new Date(loaded.savedAt))
			setRestored(true)
		}
	}, [navigate, candidateId])

	useEffect(() => {
		if (!candidateId) return
		const timer = setTimeout(() => {
			try {
				const saved = saveCvDraft(candidateId, { personal: draft.personal, content: draft.content })
				if (saved?.savedAt) setLastSavedAt(new Date(saved.savedAt))
			} catch {
				// ignore
			}
		}, 450)
		return () => clearTimeout(timer)
	}, [draft.personal, draft.content, candidateId])

	const savedLabel = useMemo(() => {
		if (!lastSavedAt) return ''
		const hh = String(lastSavedAt.getHours()).padStart(2, '0')
		const mm = String(lastSavedAt.getMinutes()).padStart(2, '0')
		return `${hh}:${mm}`
	}, [lastSavedAt])

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
	const completionByStep = useMemo(() => ({ 1: step1Ratio, 2: step2Ratio, 3: 0 }), [step1Ratio, step2Ratio])

	const updateContent = (field, value) => {
		setDraft((prev) => ({
			...prev,
			content: {
				...prev.content,
				[field]: value,
			},
		}))
	}

	const addItem = (field, item) => {
		setDraft((prev) => {
			const current = Array.isArray(prev.content?.[field]) ? prev.content[field] : []
			return {
				...prev,
				content: {
					...prev.content,
					[field]: [...current, item],
				},
			}
		})
	}

	const removeItem = (field, index) => {
		setDraft((prev) => {
			const current = Array.isArray(prev.content?.[field]) ? prev.content[field] : []
			return {
				...prev,
				content: {
					...prev.content,
					[field]: current.filter((_, i) => i !== index),
				},
			}
		})
	}

	const updateItem = (field, index, patch) => {
		setDraft((prev) => {
			const current = Array.isArray(prev.content?.[field]) ? prev.content[field] : []
			return {
				...prev,
				content: {
					...prev.content,
					[field]: current.map((x, i) => (i === index ? { ...x, ...patch } : x)),
				},
			}
		})
	}

	const toggleChip = (field, value) => {
		setDraft((prev) => {
			const current = Array.isArray(prev.content?.[field]) ? prev.content[field] : []
			const exists = current.includes(value)
			return {
				...prev,
				content: {
					...prev.content,
					[field]: exists ? current.filter((x) => x !== value) : [...current, value],
				},
			}
		})
	}

	const qualityOptions = useMemo(
		() => [
			'Communication',
			'Travail en équipe',
			'Leadership',
			'Autonomie',
			'Créativité',
			'Rigueur',
			'Adaptabilité',
			'Gestion du stress',
			'Résolution de problèmes',
			'Esprit d’initiative',
			'Empathie',
			'Organisation',
			'Curiosité intellectuelle',
			'Gestion du temps',
		],
		[]
	)

	const interestOptions = useMemo(
		() => [
			'Développement open source',
			'Intelligence artificielle',
			'Gaming',
			'Lecture',
			'Veille technologique',
			'Sport',
			'Voyage',
			'Entrepreneuriat',
			'Photographie',
			'Bénévolat',
			'Musique',
		],
		[]
	)

	const [interestInput, setInterestInput] = useState('')

	return (
		<section className='relative w-full min-h-screen bg-cover bg-center flex flex-col' style={{ backgroundImage: `url(${assets.couverture})` }}>
			<div className='absolute inset-0 bg-gradient-to-br from-[#020b16]/90 via-[#06213a]/80 to-[#020b16]/90 backdrop-blur-sm' />

			<CandidateHeader
				onLogoClick={() => navigate('/')}
				onLogout={() => {
					clearCvDraft(candidateId)
					clearLegacyCvDraft()
					localStorage.removeItem('airCandidate')
					navigate('/')
				}}
			/>

			<main className='relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col gap-6'>
				<div className='w-full'>
					<StepProgress currentStep={2} steps={steps} completionByStep={completionByStep} />
				</div>

				<div className='w-full rounded-[1.5rem] border border-white/10 bg-white/10 backdrop-blur-md p-4 flex flex-col sm:flex-row items-center gap-4'>
					<div className='h-12 w-12 shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-2xl shadow-inner border border-white/10'>
						💡
					</div>
					<div className='text-center sm:text-left'>
						<p className='text-sm font-extrabold text-white uppercase tracking-wider'>Astuce</p>
						<p className='mt-1 text-sm text-white/90'>Ajoutez au moins 1 formation, 1 langue et 1 projet pour un CV complet.</p>
					</div>
				</div>

				<div className='w-full bg-white/95 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] border border-white/20 mx-auto'>
						<div className='px-8 sm:px-12 py-8 bg-gradient-to-r from-[#f4fbfc] via-white to-[#f4fbfc] border-b border-[#0a7da4]/10'>
							<div className='flex items-start justify-between gap-3 flex-wrap'>
								<div>
									<h1 className='text-2xl sm:text-3xl font-black text-[#06213a]'>Étape 2 — Parcours</h1>
									<p className='mt-2 text-sm sm:text-base text-slate-600'>Complétez votre parcours (formation, langues, certifications, projets, qualités et centres d’intérêt).</p>
								</div>
								<div className='flex items-center gap-2'>
									{restored ? (
										<span className='text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1'>Brouillon restauré</span>
									) : null}
									{savedLabel ? (
										<span className='text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1'>Sauvegardé à {savedLabel}</span>
									) : null}
								</div>
							</div>
						</div>

						<div className='p-6 sm:p-10 bg-[#fdfdfd]'>
							<div className='grid grid-cols-1 gap-6'>
								<div className='rounded-2xl border border-slate-200 bg-white p-6'>
									<p className='text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Résumé & compétences</p>
									<div className='mt-4 grid grid-cols-1 gap-4'>
										<div>
											<label className='block text-sm font-bold text-slate-700 mb-2'>Résumé professionnel</label>
											<textarea
												rows={3}
												value={draft.content.professionalSummary}
												onChange={(e) => updateContent('professionalSummary', e.target.value)}
												className='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20'
												placeholder='Ex: Développeur fullstack, passionné par…'
											/>
										</div>
										<div>
											<label className='block text-sm font-bold text-slate-700 mb-2'>Compétences / Technologies</label>
											<textarea
												rows={2}
												value={draft.content.skills}
												onChange={(e) => updateContent('skills', e.target.value)}
												className='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20'
												placeholder='Ex: Python, React, Node.js, MongoDB, Docker…'
											/>
										</div>
									</div>
								</div>

								<div className='rounded-2xl border border-slate-200 bg-white p-6'>
									<p className='text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Formation</p>
									<div className='mt-4 space-y-5'>
										{(draft.content.educationItems || []).map((item, idx) => (
											<div key={idx} className='rounded-2xl border border-slate-200 bg-slate-50/40 p-5'>
												<div className='flex items-center justify-between gap-3 flex-wrap'>
													<p className='text-sm font-black text-[#06213a]'>Diplôme #{idx + 1}</p>
													<button type='button' onClick={() => removeItem('educationItems', idx)} className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'>× Supprimer</button>
												</div>

												<div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Diplôme *</label>
														<input value={item.degree || ''} onChange={(e) => updateItem('educationItems', idx, { degree: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Ingénieur en Informatique' />
													</div>
													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Établissement *</label>
														<input value={item.institution || ''} onChange={(e) => updateItem('educationItems', idx, { institution: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='ESPRIM Monastir' />
													</div>

													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Début</label>
														<input value={item.startYear || ''} onChange={(e) => updateItem('educationItems', idx, { startYear: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='2020' />
													</div>
													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Fin</label>
														<input value={item.endYear || ''} onChange={(e) => updateItem('educationItems', idx, { endYear: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='2025' />
													</div>
													<div className='md:col-span-2'>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Mention</label>
														<select value={item.mention || ''} onChange={(e) => updateItem('educationItems', idx, { mention: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20'>
															<option value=''>—</option>
															<option value='Passable'>Passable</option>
															<option value='Assez bien'>Assez bien</option>
															<option value='Bien'>Bien</option>
															<option value='Très bien'>Très bien</option>
															<option value='Excellent'>Excellent</option>
														</select>
													</div>

													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Spécialité</label>
														<input value={item.specialty || ''} onChange={(e) => updateItem('educationItems', idx, { specialty: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Intelligence Artificielle & …' />
													</div>
													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Ville</label>
														<input value={item.city || ''} onChange={(e) => updateItem('educationItems', idx, { city: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Monastir' />
													</div>

													<div className='md:col-span-2'>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Projet de fin d’études (optionnel)</label>
														<input value={item.pfeTitle || ''} onChange={(e) => updateItem('educationItems', idx, { pfeTitle: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Titre du PFE…' />
													</div>
												</div>
											</div>
										))}

										<button
											type='button'
											onClick={() => addItem('educationItems', { degree: '', institution: '', startYear: '', endYear: '', mention: '', specialty: '', city: '', pfeTitle: '' })}
											className='w-full rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50'
										>
											+ Ajouter une formation
										</button>
									</div>
								</div>

								<div className='rounded-2xl border border-slate-200 bg-white p-6'>
									<p className='text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Expérience professionnelle</p>
									<p className='mt-2 text-sm text-slate-600'>Ajoutez vos stages, emplois ou missions.</p>
									<div className='mt-4 space-y-5'>
										{(draft.content.experienceItems || []).map((item, idx) => (
											<div key={idx} className='rounded-2xl border border-slate-200 bg-slate-50/40 p-5'>
												<div className='flex items-center justify-between gap-3 flex-wrap'>
													<p className='text-sm font-black text-[#06213a]'>Expérience #{idx + 1}</p>
													<button type='button' onClick={() => removeItem('experienceItems', idx)} className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'>× Supprimer</button>
												</div>

												<div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Poste *</label>
														<input value={item.title || ''} onChange={(e) => updateItem('experienceItems', idx, { title: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Stage de Développement…' />
													</div>
													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Entreprise *</label>
														<input value={item.company || ''} onChange={(e) => updateItem('experienceItems', idx, { company: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='ForeverMo Group' />
													</div>

													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Lieu</label>
														<input value={item.location || ''} onChange={(e) => updateItem('experienceItems', idx, { location: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Monastir, Tunisie' />
													</div>
													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Période</label>
														<input value={item.period || ''} onChange={(e) => updateItem('experienceItems', idx, { period: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Juin 2025 — Juil 2025' />
													</div>

													<div className='md:col-span-2'>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Missions / Réalisations</label>
														<textarea rows={4} value={item.description || ''} onChange={(e) => updateItem('experienceItems', idx, { description: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Décrivez vos réalisations (une par ligne)…' />
													</div>

													<div className='md:col-span-2'>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Stack / Outils</label>
														<input value={item.stack || ''} onChange={(e) => updateItem('experienceItems', idx, { stack: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Python, React, Node.js, MySQL…' />
													</div>
												</div>
											</div>
										))}

										<button
											type='button'
											onClick={() => addItem('experienceItems', { title: '', company: '', location: '', period: '', description: '', stack: '' })}
											className='w-full rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50'
										>
											+ Ajouter une expérience
										</button>
									</div>
								</div>

								<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
									<div className='rounded-2xl border border-slate-200 bg-white p-6'>
										<p className='text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Langues</p>
										<div className='mt-4 space-y-5'>
											{(draft.content.languages || []).map((item, idx) => (
												<div key={idx} className='rounded-2xl border border-slate-200 bg-slate-50/40 p-5'>
													<div className='flex items-center justify-between gap-3 flex-wrap'>
														<p className='text-sm font-black text-[#06213a]'>Langue #{idx + 1}</p>
														<button type='button' onClick={() => removeItem('languages', idx)} className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'>× Supprimer</button>
													</div>
													<div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
														<div>
															<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Langue *</label>
															<input value={item.name || ''} onChange={(e) => updateItem('languages', idx, { name: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Anglais' />
														</div>
														<div>
															<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Niveau</label>
															<select value={item.level || ''} onChange={(e) => updateItem('languages', idx, { level: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20'>
																<option value=''>—</option>
																<option value='Débutant (A1)'>Débutant (A1)</option>
																<option value='Élémentaire (A2)'>Élémentaire (A2)</option>
																<option value='Intermédiaire (B1)'>Intermédiaire (B1)</option>
																<option value='Intermédiaire avancé (B2)'>Intermédiaire avancé (B2)</option>
																<option value='Courant (C1)'>Courant (C1)</option>
																<option value='Bilingue (C2)'>Bilingue (C2)</option>
																<option value='Langue maternelle'>Langue maternelle</option>
															</select>
														</div>
														<div className='md:col-span-2'>
															<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Certification (optionnel)</label>
															<input value={item.certification || ''} onChange={(e) => updateItem('languages', idx, { certification: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Ex: TOEIC 850, IELTS 7.0' />
														</div>
													</div>
												</div>
											))}
											<button type='button' onClick={() => addItem('languages', { name: '', level: '', certification: '' })} className='w-full rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50'>
												+ Ajouter une langue
											</button>
										</div>
									</div>

									<div className='rounded-2xl border border-slate-200 bg-white p-6'>
										<p className='text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Certifications</p>
										<div className='mt-4 space-y-5'>
											{(draft.content.certifications || []).map((item, idx) => (
												<div key={idx} className='rounded-2xl border border-slate-200 bg-slate-50/40 p-5'>
													<div className='flex items-center justify-between gap-3 flex-wrap'>
														<p className='text-sm font-black text-[#06213a]'>Certification #{idx + 1}</p>
														<button type='button' onClick={() => removeItem('certifications', idx)} className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'>× Supprimer</button>
													</div>
													<div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
														<div>
															<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Nom de la certification *</label>
															<input value={item.name || ''} onChange={(e) => updateItem('certifications', idx, { name: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Docker Certified Associate' />
														</div>
														<div>
															<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Organisme</label>
															<input value={item.organization || ''} onChange={(e) => updateItem('certifications', idx, { organization: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Docker Inc.' />
														</div>

														<div>
															<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Date d’obtention</label>
															<input value={item.obtainedAt || ''} onChange={(e) => updateItem('certifications', idx, { obtainedAt: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Juin 2023' />
														</div>
														<div>
															<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Date d’expiration</label>
															<input value={item.expiresAt || ''} onChange={(e) => updateItem('certifications', idx, { expiresAt: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Juin 2026' />
														</div>

														<div>
															<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Identifiant (opt.)</label>
															<input value={item.identifier || ''} onChange={(e) => updateItem('certifications', idx, { identifier: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='ID / Numéro' />
														</div>
														<div>
															<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Lien de vérification</label>
															<input value={item.verificationUrl || ''} onChange={(e) => updateItem('certifications', idx, { verificationUrl: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='https://…' />
														</div>
													</div>
												</div>
											))}
											<button type='button' onClick={() => addItem('certifications', { name: '', organization: '', obtainedAt: '', expiresAt: '', identifier: '', verificationUrl: '' })} className='w-full rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50'>
												+ Ajouter une certification
											</button>
										</div>
									</div>
								</div>

								<div className='rounded-2xl border border-slate-200 bg-white p-6'>
									<p className='text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Projets</p>
									<div className='mt-4 space-y-5'>
										{(draft.content.projects || []).map((item, idx) => (
											<div key={idx} className='rounded-2xl border border-slate-200 bg-slate-50/40 p-5'>
												<div className='flex items-center justify-between gap-3 flex-wrap'>
													<p className='text-sm font-black text-[#06213a]'>Projet #{idx + 1}</p>
													<button type='button' onClick={() => removeItem('projects', idx)} className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'>× Supprimer</button>
												</div>

												<div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Nom du projet *</label>
														<input value={item.name || ''} onChange={(e) => updateItem('projects', idx, { name: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='ForsaTech — CV Scoring System' />
													</div>
													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Type</label>
														<select value={item.type || ''} onChange={(e) => updateItem('projects', idx, { type: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20'>
															<option value=''>—</option>
															<option value='Projet académique'>Projet académique</option>
															<option value='Projet personnel'>Projet personnel</option>
															<option value='Projet professionnel'>Projet professionnel</option>
														</select>
													</div>

													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Période</label>
														<input value={item.period || ''} onChange={(e) => updateItem('projects', idx, { period: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='2024 — 2025' />
													</div>
													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Rôle</label>
														<input value={item.role || ''} onChange={(e) => updateItem('projects', idx, { role: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Développeur principal' />
													</div>

													<div className='md:col-span-2'>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Description</label>
														<textarea rows={4} value={item.description || ''} onChange={(e) => updateItem('projects', idx, { description: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Décrivez brièvement le projet…' />
													</div>

													<div className='md:col-span-2'>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Technologies</label>
														<input value={item.technologies || ''} onChange={(e) => updateItem('projects', idx, { technologies: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Python, React, Node.js, MongoDB…' />
													</div>

													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Lien GitHub</label>
														<input value={item.githubUrl || ''} onChange={(e) => updateItem('projects', idx, { githubUrl: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='github.com/…' />
													</div>
													<div>
														<label className='block text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Démo live</label>
														<input value={item.demoUrl || ''} onChange={(e) => updateItem('projects', idx, { demoUrl: e.target.value })} className='mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='https://…' />
													</div>
												</div>
											</div>
										))}

										<button type='button' onClick={() => addItem('projects', { name: '', type: '', period: '', role: '', description: '', technologies: '', githubUrl: '', demoUrl: '' })} className='w-full rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50'>
											+ Ajouter un projet
										</button>
									</div>
								</div>

								<div className='rounded-2xl border border-slate-200 bg-white p-6'>
									<p className='text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Qualités</p>
									<p className='mt-2 text-sm text-slate-600'>Sélectionnez vos qualités (5 recommandés).</p>
									<div className='mt-4 flex flex-wrap gap-3'>
										{qualityOptions.map((q) => {
											const active = (draft.content.qualities || []).includes(q)
											return (
												<button
													key={q}
													type='button'
													onClick={() => toggleChip('qualities', q)}
													className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
														active
															? 'bg-[#0f2742] text-white border-[#0f2742]'
															: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
													}`}
												>
													{q}
												</button>
											)
										})}
									</div>
								</div>

								<div className='rounded-2xl border border-slate-200 bg-white p-6'>
									<p className='text-xs font-extrabold tracking-wider text-slate-600 uppercase'>Centres d’intérêt</p>
									<p className='mt-2 text-sm text-slate-600'>Sélectionnez ou ajoutez vos centres d’intérêt.</p>
									<div className='mt-4 flex flex-wrap gap-3'>
										{interestOptions.map((q) => {
											const active = (draft.content.interests || []).includes(q)
											return (
												<button
													key={q}
													type='button'
													onClick={() => toggleChip('interests', q)}
													className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
														active
															? 'bg-[#0f2742] text-white border-[#0f2742]'
															: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
													}`}
												>
													{q}
												</button>
											)
										})}
									</div>

									<div className='mt-5 flex items-center gap-3 flex-wrap'>
										<input value={interestInput} onChange={(e) => setInterestInput(e.target.value)} className='flex-1 min-w-[220px] rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/20' placeholder='Ajouter un intérêt…' />
										<button
											type='button'
											onClick={() => {
												const trimmed = interestInput.trim()
												if (!trimmed) return
												setInterestInput('')
												toggleChip('interests', trimmed)
											}}
											className='rounded-xl bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] px-5 py-3 text-white font-semibold shadow-lg hover:brightness-110'
										>
											+ Ajouter
										</button>
									</div>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<button
										type='button'
										onClick={() => {
											clearCvDraft(candidateId)
											setDraft(loadCvDraft(candidateId || '__no_candidate__'))
											setLastSavedAt(null)
											setRestored(false)
										}}
										className='w-full rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-4 focus:ring-cyan-600/20'
									>
										Réinitialiser le brouillon
									</button>
									<button
										type='button'
										onClick={() => navigate('/EspaceCandidat/construire/finaliser')}
										className='w-full rounded-xl bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] py-3 text-white font-semibold shadow-lg hover:scale-[1.01] transition-transform focus:outline-none focus:ring-4 focus:ring-cyan-600/20'
									>
										Continuer →
									</button>
								</div>

								<div className='mt-2 flex items-center justify-between gap-3 flex-wrap'>
									<button
										type='button'
										onClick={() => navigate('/EspaceCandidat/construire/etape-1')}
										className='rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-cyan-600/20'
									>
										← Retour
									</button>
									<span className='text-xs font-bold text-slate-500'>Progression étape 2: {Math.round(step2Ratio * 100)}%</span>
								</div>
							</div>
						</div>
				</div>
			</main>
		</section>
	)
}

export default CandidateCVBuilder
