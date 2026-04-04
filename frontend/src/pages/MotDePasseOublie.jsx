import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import StepProgress from '../components/StepProgress.jsx'

function isSafeRedirectPath(value) {
	if (!value) return false
	if (typeof value !== 'string') return false
	if (!value.startsWith('/')) return false
	if (value.startsWith('//')) return false
	return true
}

function isValidEmail(value) {
	if (!value) return false
	const email = String(value).trim()
	// Simple validation; backend will do the final check.
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function MotDePasseOublie() {
	const navigate = useNavigate()
	const location = useLocation()

	const redirectTo = useMemo(() => {
		const params = new URLSearchParams(location.search)
		const raw = params.get('redirect')
		if (isSafeRedirectPath(raw)) return raw
		return '/connexion'
	}, [location.search])

	const [step, setStep] = useState(1)
	const [email, setEmail] = useState('')
	const [code, setCode] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showPwd1, setShowPwd1] = useState(false)
	const [showPwd2, setShowPwd2] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState(false)

	const completionByStep = useMemo(() => {
		return {
			1: step > 1 ? 1 : 0,
			2: success ? 1 : 0,
		}
	}, [step, success])

	const handleSendCode = (e) => {
		e.preventDefault()
		setError('')

		if (!isValidEmail(email)) {
			setError('Veuillez saisir un email valide.')
			return
		}

		// TODO: Appeler l’API (envoi du code / lien) plus tard.
		setStep(2)
	}

	const handleResetPassword = (e) => {
		e.preventDefault()
		setError('')

		if (!isValidEmail(email)) {
			setError('Veuillez saisir un email valide.')
			setStep(1)
			return
		}

		if (!code.trim()) {
			setError('Veuillez saisir le code reçu par email.')
			return
		}

		if (!newPassword || newPassword.length < 8) {
			setError('Le mot de passe doit contenir au moins 8 caractères.')
			return
		}

		if (newPassword !== confirmPassword) {
			setError('Les mots de passe ne correspondent pas.')
			return
		}

		// TODO: Appeler l’API (vérification du code + reset mot de passe) plus tard.
		setSuccess(true)
	}

	return (
		<section className='relative w-full min-h-[84vh] bg-gradient-to-b from-[#eef8ff] via-[#004167] to-[#ffffff] py-4 sm:py-6'>
			<header className='mx-auto mb-2 flex max-w-6xl items-center justify-center px-4'>
				<button type='button' onClick={() => navigate('/')} className='cursor-pointer' aria-label="Aller a l'accueil">
					<img src={assets.logo} className='w-36 sm:w-40' alt='Logo' />
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
								Compte
							</span>

							<h1 className='mt-6 text-4xl sm:text-5xl leading-tight font-black tracking-tight'>
								Mot de passe
								<span className='text-[#06d5e0]'> oublié</span>
							</h1>

							<p className='mt-4 text-slate-200/90 text-sm sm:text-base leading-relaxed'>
								Vérifiez votre adresse email puis définissez un nouveau mot de passe.
							</p>

							<div className='mt-8'>
								<StepProgress
									currentStep={step}
									steps={['Vérification email', 'Réinitialisation']}
									completionByStep={completionByStep}
								/>
							</div>

							<div className='mt-8 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md px-5 py-4'>
								<p className='text-xs font-extrabold text-white/70 uppercase tracking-wider'>Info</p>
								<p className='mt-2 text-sm text-white/90'>
									La vérification par email sera branchée sur une API dans une prochaine étape.
								</p>
							</div>
						</div>
					</div>

					<div className='p-6 sm:p-8 bg-gradient-to-b from-[#f7fdff] to-[#f4f8fb]'>
						{error ? (
							<div className='mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
								{error}
							</div>
						) : null}

						{success ? (
							<div className='h-full min-h-[520px] flex items-center justify-center'>
								<div className='success-pop w-full max-w-md rounded-2xl border border-cyan-200 bg-white p-8 text-center shadow-xl'>
									<div className='mx-auto h-14 w-14 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-2xl font-bold'>
										✓
									</div>
									<h2 className='mt-4 text-2xl font-black text-[#0a3556]'>Mot de passe réinitialisé</h2>
									<p className='mt-2 text-slate-600'>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
									<button
										type='button'
										onClick={() => navigate(redirectTo)}
										className='mt-6 rounded-xl bg-gradient-to-r from-[#0a4a72] to-[#0a7aa2] px-5 py-2.5 text-white font-semibold hover:brightness-110 transition-all'
									>
										Retour a la connexion
									</button>
								</div>
							</div>
						) : step === 1 ? (
							<form onSubmit={handleSendCode} className='space-y-4'>
								<p style={{ fontFamily: "'Jost', sans-serif" }} className='text-4xl font-black text-[#000000]'>Vérification email</p>
								<h1 style={{ fontFamily: "'Jost', sans-serif" }} className='text-xl font-black text-[#000000]'>Recevez un code de vérification</h1>

								<div>
									<label className='label'>Adresse email</label>
									<input
										type='email'
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className='input'
										placeholder='ex: nom@domaine.com'
									/>
									<p className='mt-2 text-xs text-slate-600'>Nous vous enverrons un code pour continuer.</p>
								</div>

								<div className='flex items-center justify-between'>
									<button
										type='button'
										onClick={() => navigate(redirectTo)}
										className='text-sm text-slate-600 hover:text-slate-800'
									>
										Retour
									</button>
								</div>

								<button
									type='submit'
									className='w-full rounded-xl bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] py-3 text-white font-semibold shadow-lg hover:brightness-110 transition-all'
								>
									Envoyer le code
								</button>
							</form>
						) : (
							<form onSubmit={handleResetPassword} className='space-y-4'>
								<p style={{ fontFamily: "'Jost', sans-serif" }} className='text-4xl font-black text-[#000000]'>Réinitialisation</p>
								<h1 style={{ fontFamily: "'Jost', sans-serif" }} className='text-xl font-black text-[#000000]'>Définissez un nouveau mot de passe</h1>

								<div className='rounded-xl border border-slate-200 bg-white px-4 py-3'>
									<p className='text-xs font-semibold text-slate-500'>Email</p>
									<p className='mt-0.5 text-sm font-bold text-slate-800 break-all'>{email.trim()}</p>
									<button
										type='button'
										onClick={() => setStep(1)}
										className='mt-2 text-sm text-[#0a5f88] underline decoration-dotted underline-offset-4'
									>
										Modifier l'email
									</button>
								</div>

								<div>
									<label className='label'>Code de vérification</label>
									<input
										type='text'
										required
										value={code}
										onChange={(e) => setCode(e.target.value)}
										className='input'
										placeholder='Entrez le code reçu par email'
									/>
								</div>

								<div>
									<label className='label'>Nouveau mot de passe</label>
									<div className='relative'>
										<input
											type={showPwd1 ? 'text' : 'password'}
											required
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											className='input pr-20'
										/>
										<button
											type='button'
											onClick={() => setShowPwd1((v) => !v)}
											className='absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100'
										>
											{showPwd1 ? 'Masquer' : 'Afficher'}
										</button>
									</div>
									<p className='mt-2 text-xs text-slate-600'>Minimum 8 caractères.</p>
								</div>

								<div>
									<label className='label'>Confirmer le mot de passe</label>
									<div className='relative'>
										<input
											type={showPwd2 ? 'text' : 'password'}
											required
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											className='input pr-20'
										/>
										<button
											type='button'
											onClick={() => setShowPwd2((v) => !v)}
											className='absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100'
										>
											{showPwd2 ? 'Masquer' : 'Afficher'}
										</button>
									</div>
								</div>

								<div className='flex items-center justify-between'>
									<button
										type='button'
										onClick={() => navigate(redirectTo)}
										className='text-sm text-slate-600 hover:text-slate-800'
									>
										Annuler
									</button>
								</div>

								<button
									type='submit'
									className='w-full rounded-xl bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] py-3 text-white font-semibold shadow-lg hover:brightness-110 transition-all'
								>
									Réinitialiser le mot de passe
								</button>
							</form>
						)}
					</div>
				</div>
			</div>
		</section>
	)
}

export default MotDePasseOublie
