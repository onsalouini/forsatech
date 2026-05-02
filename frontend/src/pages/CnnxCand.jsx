import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
const handleBannedAccount = (entity, setAuthError, navigate) => {
	if (entity?.banned) {
		const reason = entity?.banReason ? ` - ${entity.banReason}` : ''
		setAuthError(`Compte banni${reason}`)
		navigate('/banned') // or '/login'
		return true
	}
	return false
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const SIGNUP_COUNTRY_OTHER = '__OTHER__'
const SIGNUP_COUNTRIES = [
	{ value: 'Tunisie', label: 'Tunisie', code: 'tn' },
	{ value: 'France', label: 'France', code: 'fr' },
	{ value: 'Algérie', label: 'Algérie', code: 'dz' },
	{ value: 'Maroc', label: 'Maroc', code: 'ma' },
	{ value: 'Égypte', label: 'Égypte', code: 'eg' },
	{ value: 'Belgique', label: 'Belgique', code: 'be' },
	{ value: 'Suisse', label: 'Suisse', code: 'ch' },
	{ value: 'Canada', label: 'Canada', code: 'ca' },
	{ value: 'Allemagne', label: 'Allemagne', code: 'de' },
	{ value: 'Italie', label: 'Italie', code: 'it' },
	{ value: 'Espagne', label: 'Espagne', code: 'es' },
	{ value: 'Portugal', label: 'Portugal', code: 'pt' },
	{ value: 'Royaume-Uni', label: 'Royaume-Uni', code: 'gb' },
	{ value: 'Pays-Bas', label: 'Pays-Bas', code: 'nl' },
	{ value: 'Suède', label: 'Suède', code: 'se' },
	{ value: 'États-Unis', label: 'États-Unis', code: 'us' },
	{ value: 'Émirats arabes unis', label: 'Émirats arabes unis', code: 'ae' },
	{ value: 'Arabie saoudite', label: 'Arabie saoudite', code: 'sa' },
	{ value: 'Qatar', label: 'Qatar', code: 'qa' },
	{ value: 'Turquie', label: 'Turquie', code: 'tr' },
]

function CnnxCand() {
	const navigate = useNavigate()
	const [mode, setMode] = useState('login')
	const [showLoginPassword, setShowLoginPassword] = useState(false)
	const [showSignupPassword, setShowSignupPassword] = useState(false)
	const [showSignupPassword2, setShowSignupPassword2] = useState(false)
	const [loginPressed, setLoginPressed] = useState(false)
	const [loginLoading, setLoginLoading] = useState(false)
	const [signupLoading, setSignupLoading] = useState(false)
	const [authError, setAuthError] = useState('')
	const [success, setSuccess] = useState(false)
	const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false)
	const countryMenuRef = useRef(null)

	const [loginData, setLoginData] = useState({
		email: '',
		password: '',
	})

	const [signupData, setSignupData] = useState({
		lastName: '',
		firstName: '',
		email: '',
		country: '',
		birthDate: '',
		professionalTitle: '',
		sector: '',
		experienceLevel: '',
		portfolioUrl: '',
		password: '',
		confirmPassword: '',
	})

	const passwordScore = useMemo(() => {
		const pwd = signupData.password
		let score = 0
		if (pwd.length >= 8) score += 1
		if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1
		if (/\d/.test(pwd)) score += 1
		if (/[^A-Za-z0-9]/.test(pwd)) score += 1
		return score
	}, [signupData.password])

	const passwordStrength = useMemo(() => {
		if (passwordScore <= 1) return { label: 'Faible', color: 'bg-red-500', width: 'w-1/4' }
		if (passwordScore === 2) return { label: 'Moyen', color: 'bg-amber-500', width: 'w-2/4' }
		if (passwordScore === 3) return { label: 'Bon', color: 'bg-lime-500', width: 'w-3/4' }
		return { label: 'Tres fort', color: 'bg-emerald-500', width: 'w-full' }
	}, [passwordScore])

	const isSignupCustomCountry = useMemo(() => {
		const value = String(signupData.country || '').trim()
		if (!value) return false
		return !SIGNUP_COUNTRIES.some((item) => item.value === value)
	}, [signupData.country])

	const selectedSignupCountry = useMemo(() => {
		return SIGNUP_COUNTRIES.find((item) => item.value === signupData.country) || null
	}, [signupData.country])

	useEffect(() => {
		const handleOutsideClick = (event) => {
			if (countryMenuRef.current && !countryMenuRef.current.contains(event.target)) {
				setIsCountryMenuOpen(false)
			}
		}
		document.addEventListener('mousedown', handleOutsideClick)
		return () => document.removeEventListener('mousedown', handleOutsideClick)
	}, [])

	const updateSignupField = (field, value) => {
		setSignupData((prev) => ({ ...prev, [field]: value }))
	}

	const updateLoginField = (field, value) => {
		setLoginData((prev) => ({ ...prev, [field]: value }))
	}

     const handleLoginSubmit = async (e) => {
	e.preventDefault()
	setAuthError('')
	setLoginPressed(true)
	setTimeout(() => setLoginPressed(false), 240)

	try {
		setLoginLoading(true)

		// ADMIN
		let response = await fetch(`${API_BASE}/admin/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(loginData),
		})

		let data = await response.json()

		if (response.ok && data.success && data.admin) {
			if (handleBannedAccount(data.admin, setAuthError, navigate)) return

			localStorage.setItem('airAdmin', JSON.stringify(data.admin))
			navigate('/admin/dashboard')
			return
		}

		// CANDIDATE
		response = await fetch(`${API_BASE}/candidates/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(loginData),
		})

		data = await response.json()

		if (!response.ok || !data.success || !data.candidate) {
			setAuthError(data?.message || 'Identifiants invalides.')
			return
		}

		if (handleBannedAccount(data.candidate, setAuthError, navigate)) return

		// ONLY STORE AFTER CLEAR PASS
		localStorage.removeItem('airRecruiter')    // ADD — clear stale recruiter
localStorage.removeItem('airAdmin')        // ADD — clear stale admin
localStorage.setItem('airCandidate', JSON.stringify(data.candidate))

if (data?.sessionId) {
  localStorage.setItem('airCandidateSessionId', String(data.sessionId))
} else {
  localStorage.removeItem('airCandidateSessionId')
}
window.dispatchEvent(new Event('localStorageChange'))  // always fire

		let nextRoute = '/EspaceCandidat'

		try {
			const candidateId = data?.candidate?.id
			if (candidateId) {
				const cvResponse = await fetch(`${API_BASE}/cv/by-candidate/${candidateId}`)
				if (cvResponse.ok) {
					const cvData = await cvResponse.json()
					if (cvData?.success) nextRoute = '/EspaceCandidat/dashboard'
				}
			}
		} catch {}

		navigate(nextRoute)
	} catch (error) {
		console.error(error)
		setAuthError('Serveur indisponible.')
	} finally {
		setLoginLoading(false)
	}
}

	const handleSignupSubmit = async (e) => {
		e.preventDefault()
		setAuthError('')

		if (!signupData.password || signupData.password !== signupData.confirmPassword) return
		if (!String(signupData.country || '').trim()) {
			setAuthError('Veuillez sélectionner votre pays.')
			return
		}

		try {
			const countryToSave = signupData.country === SIGNUP_COUNTRY_OTHER ? '' : signupData.country
			setSignupLoading(true)
			const response = await fetch(`${API_BASE}/candidates/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lastName: signupData.lastName,
					firstName: signupData.firstName,
					email: signupData.email,
					country: countryToSave,
					birthDate: signupData.birthDate,
					professionalTitle: signupData.professionalTitle,
					sector: signupData.sector,
					experienceLevel: signupData.experienceLevel,
					portfolioUrl: signupData.portfolioUrl,
					password: signupData.password,
				}),
			})

			const data = await response.json()
			if (!response.ok || !data.success) {
				setAuthError(data.message || 'Inscription impossible.')
				return
			}

			setSuccess(true)
		} catch (error) {
			setAuthError('Serveur indisponible. Verifiez que le backend tourne.')
		} finally {
			setSignupLoading(false)
		}
	}

	return (
		<section className='relative w-full min-h-[84vh] bg-gradient-to-b from-[#eef8ff] via-[#004167] to-[#ffffff] py-4 sm:py-6'>
			<header className='mx-auto mb-2 flex max-w-6xl items-center justify-center px-4'>
				<button type='button' onClick={() => navigate('/')} className='cursor-pointer' aria-label="Aller a l'accueil">
					<img src={assets.logo} className='w-32 sm:w-36' alt='Logo' />
				</button>
			</header>
			<div className='mx-auto max-w-6xl rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(10,12,21,0.25)] border border-[#101522]/10 bg-white'>
				<div className='grid lg:grid-cols-[1.02fr_1fr]'>
					<div className='relative bg-gradient-to-br from-[#06213a] via-[#0a3356] to-[#0a4c73] p-8 sm:p-10 text-white overflow-hidden'>
						<div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:26px_26px] opacity-40' />
						<div className='orb orb-a' />
						<div className='orb orb-b' />
						<div className='orb orb-c' />

						<div className='relative z-10'>
							<span className='inline-flex items-center rounded-full border border-[#06d5e0]/40 bg-[#06d5e0]/10 px-4 py-1 text-xs font-semibold tracking-[0.18em] uppercase text-[#06d5e0]'>
								Espace Candidat
							</span>

							<h1 className='mt-6 text-4xl sm:text-5xl leading-tight font-black tracking-tight'>
								Trouvez votre prochain poste avec
								<span className='text-[#06d5e0]'> l'IA </span>
							</h1>

							<p className='mt-4 text-slate-200/90 text-sm sm:text-base leading-relaxed'>
								Créez votre profil, partagez vos informations et laissez ForsaTech vous proposer les offres les plus pertinentes.
							</p>

							<div className='mt-8 space-y-3'>
								<div className='feature-card'>
									<span className='feature-dot' />
									Profil candidat complet
								</div>
								<div className='feature-card'>
									<span className='feature-dot' />
									Des suggestions intelligentes
								</div>
								<div className='feature-card'>
									<span className='feature-dot' />
									Suivi des candidatures
								</div>
							</div>

							<div className='mt-10 grid grid-cols-3 gap-2 text-center'>
								<div className='rounded-xl bg-white/10 p-3 backdrop-blur-md'>
									<p className='text-xl font-black text-[#06d5e0]'>+1</p>
									<p className='text-[11px] uppercase tracking-wider text-slate-200'>Profil</p>
								</div>
								<div className='rounded-xl bg-white/10 p-3 backdrop-blur-md'>
									<p className='text-xl font-black text-[#06d5e0]'>IA</p>
									<p className='text-[11px] uppercase tracking-wider text-slate-200'>Matching</p>
								</div>
								<div className='rounded-xl bg-white/10 p-3 backdrop-blur-md'>
									<p className='text-xl font-black text-[#06d5e0]'>24/7</p>
									<p className='text-[11px] uppercase tracking-wider text-slate-200'>Opportunites</p>
								</div>
							</div>
						</div>
					</div>

					<div className='p-6 sm:p-8 bg-gradient-to-b from-[#f7fdff] to-[#f4f8fb]'>
						{success ? (
							<div className='h-full min-h-[620px] flex items-center justify-center'>
								<div className='success-pop w-full max-w-md rounded-2xl border border-cyan-200 bg-white p-8 text-center shadow-xl'>
									<div className='mx-auto h-14 w-14 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-2xl font-bold'>
										✓
									</div>
									<h2 className='mt-4 text-2xl font-black text-[#0a3556]'>Compte cree avec succes</h2>
									<p className='mt-2 text-slate-600'>Vous pouvez maintenant vous connecter.</p>
									<button
										type='button'
										onClick={() => {
											setSuccess(false)
											setMode('login')
										}}
										className='mt-6 rounded-xl bg-gradient-to-r from-[#0a4a72] to-[#0a7aa2] px-5 py-2.5 text-white font-semibold hover:brightness-110 transition-all'
									>
										Aller a la connexion
									</button>
								</div>
							</div>
						) : (
							<>
								{authError ? (
									<div className='mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
										{authError}
									</div>
								) : null}

								<div className='rounded-xl bg-white p-1.5 border border-slate-200 flex mb-6'>
									<button
										type='button'
										onClick={() => setMode('login')}
										className={`w-1/2 rounded-lg py-2 text-sm font-semibold transition-all ${mode === 'login' ? 'bg-gradient-to-r from-[#0a3e63] to-[#0a7da4] text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
									>
										Connexion
									</button>
									<button
										type='button'
										onClick={() => setMode('signup')}
										className={`w-1/2 rounded-lg py-2 text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-gradient-to-r from-[#0a3e63] to-[#0a7da4] text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
									>
										Creation de compte
									</button>
								</div>

								{mode === 'login' ? (
									<form onSubmit={handleLoginSubmit} className='space-y-4'>
										<p style={{ fontFamily: "'Jost', sans-serif" }} className='text-4xl font-black text-[#000000]'>Bienvenue 👋</p>
										<h1 style={{ fontFamily: "'Jost', sans-serif" }} className='text-xl font-black text-[#000000]'>Connectez-vous a votre espace candidat</h1>

										<div>
											<label className='label'>Email professionnel</label>
											<input
												type='email'
												required
												value={loginData.email}
												onChange={(e) => updateLoginField('email', e.target.value)}
												className='input'
											/>
										</div>

										<div>
											<label className='label'>Mot de passe</label>
											<div className='relative'>
												<input
													type={showLoginPassword ? 'text' : 'password'}
													required
													value={loginData.password}
													onChange={(e) => updateLoginField('password', e.target.value)}
													className='input pr-20'
												/>
												<button
													type='button'
													onClick={() => setShowLoginPassword((v) => !v)}
													className='absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100'
												>
													{showLoginPassword ? 'Masquer' : 'Afficher'}
												</button>
											</div>
											<div className='flex items-center justify-between'>
												<button
													type='button'
													onClick={() => navigate('/mot-de-passe-oublie?redirect=/connecter')}
													className='text-sm text-[#0a5f88] underline decoration-dotted underline-offset-4'
												>
													Mot de passe oublie ?
												</button>
											</div>
										</div>

										<button
											type='submit'
											disabled={loginLoading}
											className={`w-full rounded-xl bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] py-3 text-white font-semibold shadow-lg transition-transform ${loginPressed ? 'scale-[0.97]' : 'hover:scale-[1.01]'}`}
										>
											{loginLoading ? 'Connexion...' : 'Se connecter'}
										</button>
									</form>
								) : (
									<form onSubmit={handleSignupSubmit} className='space-y-4'>
										<p style={{ fontFamily: "'Jost', sans-serif" }} className='text-4xl font-black text-[#000000]'>Creer un compte 🚀</p>
										<h1 style={{ fontFamily: "'Jost', sans-serif" }} className='text-xl font-black text-[#000000]'>Rejoignez ForsaTech et postulez plus intelligemment</h1>

										<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
											<div>
												<label className='label'>Nom</label>
												<input
													type='text'
													required
													value={signupData.lastName}
													onChange={(e) => updateSignupField('lastName', e.target.value)}
													className='input'
												/>
											</div>
											<div>
												<label className='label'>Prenom</label>
												<input
													type='text'
													required
													value={signupData.firstName}
													onChange={(e) => updateSignupField('firstName', e.target.value)}
													className='input'
												/>
											</div>
										</div>

										<div>
											<label className='label'>Email professionnel</label>
											<input
												type='email'
												required
												value={signupData.email}
												onChange={(e) => updateSignupField('email', e.target.value)}
												className='input'
											/>
										</div>

										<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
											<div>
												<label className='label'>Pays</label>
												<div className='relative' ref={countryMenuRef}>
													<button
														type='button'
														onClick={() => setIsCountryMenuOpen((prev) => !prev)}
														className='input flex items-center justify-between text-left'
													>
														<span className='flex items-center gap-2'>
															{selectedSignupCountry ? (
																<img
																	src={`https://flagcdn.com/w40/${selectedSignupCountry.code}.png`}
																	alt={selectedSignupCountry.label}
																	className='h-4 w-6 rounded-[2px] border border-slate-200 object-cover'
																/>
															) : (
																<span className='text-slate-400'>🌐</span>
															)}
															<span>{selectedSignupCountry ? selectedSignupCountry.label : 'Sélectionner votre pays'}</span>
														</span>
														<span className='text-slate-500'>▾</span>
													</button>
													{isCountryMenuOpen ? (
														<div className='absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg'>
															{SIGNUP_COUNTRIES.map((item) => (
																<button
																	key={item.value}
																	type='button'
																	onClick={() => {
																		updateSignupField('country', item.value)
																		setIsCountryMenuOpen(false)
																	}}
																	className='flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50'
																>
																	<img
																		src={`https://flagcdn.com/w40/${item.code}.png`}
																		alt={item.label}
																		className='h-4 w-6 rounded-[2px] border border-slate-200 object-cover'
																	/>
																	<span>{item.label}</span>
																</button>
															))}
															<button
																type='button'
																onClick={() => {
																	updateSignupField('country', SIGNUP_COUNTRY_OTHER)
																	setIsCountryMenuOpen(false)
																}}
																className='flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50'
															>
																<span>🌍</span>
																<span>Autre (saisie manuelle)</span>
															</button>
														</div>
													) : null}
												</div>
												{isSignupCustomCountry ? (
													<input
														type='text'
														required
														value={signupData.country === SIGNUP_COUNTRY_OTHER ? '' : signupData.country}
														onChange={(e) => updateSignupField('country', e.target.value)}
														placeholder='Saisissez votre pays'
														className='input mt-2'
													/>
												) : null}
											</div>
											<div>
												<label className='label'>Date de naissance</label>
												<input
													type='date'
													required
													value={signupData.birthDate}
													onChange={(e) => updateSignupField('birthDate', e.target.value)}
													className='input'
												/>
											</div>
										</div>

										<div>
											<label className='label'>Titre professionnel</label>
											<input
												type='text'
												required
												value={signupData.professionalTitle}
												onChange={(e) => updateSignupField('professionalTitle', e.target.value)}
												className='input'
											/>
										</div>

										<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
											<div>
												<label className='label'>Secteur</label>
												<input
													type='text'
													required
													value={signupData.sector}
													onChange={(e) => updateSignupField('sector', e.target.value)}
													className='input'
												/>
											</div>
											<div>
												<label className='label'>Experience</label>
												<select
													required
													value={signupData.experienceLevel}
													onChange={(e) => updateSignupField('experienceLevel', e.target.value)}
													className='input'
												>
													<option value=''>Choisir...</option>
													<option value='student'>Etudiant</option>
													<option value='junior'>Junior</option>
													<option value='confirmed'>Confirme</option>
													<option value='senior'>Senior</option>
												</select>
											</div>
										</div>

										<div>
											<label className='label'>Lien / Portfolio</label>
											<input
												type='url'
												placeholder='https://...'
												value={signupData.portfolioUrl}
												onChange={(e) => updateSignupField('portfolioUrl', e.target.value)}
												className='input'
											/>
										</div>

										<div>
											<label className='label'>Mot de passe</label>
											<div className='relative'>
												<input
													type={showSignupPassword ? 'text' : 'password'}
													required
													value={signupData.password}
													onChange={(e) => updateSignupField('password', e.target.value)}
													className='input pr-20'
												/>
												<button type='button' onClick={() => setShowSignupPassword((v) => !v)} className='pass-toggle'>
													{showSignupPassword ? 'Masquer' : 'Afficher'}
												</button>
											</div>

											<div className='mt-2'>
												<div className='h-2 rounded-full bg-slate-200 overflow-hidden'>
													<div className={`h-full ${passwordStrength.color} ${passwordStrength.width} transition-all duration-300`} />
												</div>
												<p className='mt-1 text-xs text-slate-600'>Force du mot de passe: {passwordStrength.label}</p>
											</div>
										</div>

										<div>
											<label className='label'>Confirmer le mot de passe</label>
											<div className='relative'>
												<input
													type={showSignupPassword2 ? 'text' : 'password'}
													required
													value={signupData.confirmPassword}
													onChange={(e) => updateSignupField('confirmPassword', e.target.value)}
													className='input pr-20'
												/>
												<button type='button' onClick={() => setShowSignupPassword2((v) => !v)} className='pass-toggle'>
													{showSignupPassword2 ? 'Masquer' : 'Afficher'}
												</button>
											</div>
											{signupData.confirmPassword && signupData.confirmPassword !== signupData.password ? (
												<p className='mt-1 text-xs text-red-600'>Les mots de passe ne correspondent pas.</p>
											) : null}
										</div>

										<button
											type='submit'
											disabled={signupLoading}
											className='w-full rounded-xl bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] py-3 text-white font-semibold shadow-lg hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:cursor-not-allowed'
										>
											{signupLoading ? 'Creation...' : 'Creer un compte'}
										</button>
									</form>
								)}
							</>
						)}
					</div>
				</div>
			</div>

			<style>{`
				.orb {
					position: absolute;
					border-radius: 999px;
					filter: blur(6px);
					opacity: 0.65;
					animation: floatOrb 8s ease-in-out infinite;
				}
				.orb-a {
					width: 190px;
					height: 190px;
					background: radial-gradient(circle at 30% 30%, #09d5de, #0a6f93 70%);
					top: -50px;
					right: -40px;
				}
				.orb-b {
					width: 140px;
					height: 140px;
					background: radial-gradient(circle at 40% 40%, #22b8ff, #0e4f87 70%);
					bottom: 70px;
					left: -36px;
					animation-delay: 1.4s;
				}
				.orb-c {
					width: 110px;
					height: 110px;
					background: radial-gradient(circle at 40% 40%, #67f4ff, #0f7da0 70%);
					bottom: -20px;
					right: 90px;
					animation-delay: 2.4s;
				}
				@keyframes floatOrb {
					0% { transform: translateY(0px) translateX(0px); }
					50% { transform: translateY(-10px) translateX(8px); }
					100% { transform: translateY(0px) translateX(0px); }
				}
				.feature-card {
					display: flex;
					align-items: center;
					gap: 10px;
					padding: 10px 12px;
					background: rgba(255, 255, 255, 0.1);
					border: 1px solid rgba(255, 255, 255, 0.15);
					border-radius: 12px;
					backdrop-filter: blur(4px);
					font-size: 14px;
				}
				.feature-dot {
					height: 8px;
					width: 8px;
					border-radius: 999px;
					background: #22d3ee;
					box-shadow: 0 0 0 5px rgba(34, 211, 238, 0.2);
				}
				.label {
					display: block;
					font-size: 13px;
					font-weight: 700;
					color: #1e293b;
					margin-bottom: 7px;
				}
				.input {
					width: 100%;
					border-radius: 12px;
					border: 1px solid #d7dce5;
					background: white;
					padding: 10px 12px;
					outline: none;
					transition: 180ms ease;
				}
				.input:focus {
					border-color: #0891b2;
					box-shadow: 0 0 0 4px rgba(8, 145, 178, 0.18);
				}
				.pass-toggle {
					position: absolute;
					right: 8px;
					top: 50%;
					transform: translateY(-50%);
					padding: 4px 8px;
					border-radius: 8px;
					font-size: 11px;
					font-weight: 700;
					color: #334155;
				}
				.pass-toggle:hover {
					background: #f1f5f9;
				}
				.success-pop {
					animation: popIn 420ms ease;
				}
				@keyframes popIn {
					0% { transform: scale(0.94); opacity: 0; }
					100% { transform: scale(1); opacity: 1; }
				}
			`}</style>
		</section>
	)
}

export default CnnxCand
