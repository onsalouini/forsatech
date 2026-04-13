import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import StepProgress from '../components/StepProgress.jsx'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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
	const [isCodeVerified, setIsCodeVerified] = useState(false)
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showPwd1, setShowPwd1] = useState(false)
	const [showPwd2, setShowPwd2] = useState(false)
	const [error, setError] = useState('')
	const [info, setInfo] = useState('')
	const [success, setSuccess] = useState(false)
	const [sendingCode, setSendingCode] = useState(false)
	const [verifyingCode, setVerifyingCode] = useState(false)
	const [resettingPassword, setResettingPassword] = useState(false)
	const fieldLabelClass = 'mb-2 block text-[13px] font-extrabold tracking-[0.01em] text-[#173c62]'
	const fieldInputClass =
		'w-full rounded-xl border border-[#b9d5ea] bg-white px-4 py-3 text-[15px] font-medium text-[#0f2742] outline-none transition placeholder:text-slate-400 focus:border-[#06a9d7] focus:ring-4 focus:ring-[#06a9d7]/20'

	const completionByStep = useMemo(() => {
		return {
			1: step > 1 ? 1 : 0,
			2: step > 2 ? 1 : 0,
			3: success ? 1 : 0,
		}
	}, [step, success])

	const requestCode = async () => {
		setError('')
		setInfo('')

		if (!isValidEmail(email)) {
			setError('Veuillez saisir un email valide.')
			return false
		}

		setSendingCode(true)
		try {
			const response = await fetch(`${API_BASE}/auth/password-reset/request`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: String(email || '').trim() }),
			})
			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				throw new Error(data?.message || "Impossible d'envoyer le code de verification.")
			}
			setInfo(data?.message || 'Code envoye par email.')
			setStep(2)
			setIsCodeVerified(false)
			return true
		} catch (err) {
			setError(String(err?.message || 'Erreur serveur.'))
			return false
		} finally {
			setSendingCode(false)
		}
	}

	const handleSendCode = async (e) => {
		e.preventDefault()
		await requestCode()
	}

	const handleVerifyCode = async (e) => {
		e.preventDefault()
		setError('')
		setInfo('')

		if (!isValidEmail(email)) {
			setError('Veuillez saisir un email valide.')
			setStep(1)
			return
		}
		if (!code.trim()) {
			setError('Veuillez saisir le code de verification.')
			return
		}

		setVerifyingCode(true)
		try {
			const response = await fetch(`${API_BASE}/auth/password-reset/verify`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: String(email || '').trim(),
					code: String(code || '').trim(),
				}),
			})
			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				throw new Error(data?.message || 'Code invalide ou expire.')
			}
			setIsCodeVerified(true)
			setInfo(data?.message || 'Code verifie avec succes.')
			setStep(3)
		} catch (err) {
			setIsCodeVerified(false)
			setError(String(err?.message || 'Erreur serveur.'))
		} finally {
			setVerifyingCode(false)
		}
	}

	const handleResetPassword = async (e) => {
		e.preventDefault()
		setError('')
		setInfo('')

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

		if (!isCodeVerified) {
			setError('Veuillez verifier le code avant de reinitialiser le mot de passe.')
			setStep(2)
			return
		}

		if (newPassword !== confirmPassword) {
			setError('Les mots de passe ne correspondent pas.')
			return
		}

		setResettingPassword(true)
		try {
			const response = await fetch(`${API_BASE}/auth/password-reset/confirm`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: String(email || '').trim(),
					code: String(code || '').trim(),
					newPassword,
				}),
			})
			const data = await response.json().catch(() => ({}))
			if (!response.ok || !data?.success) {
				throw new Error(data?.message || 'Impossible de reinitialiser le mot de passe.')
			}
			setInfo(data?.message || 'Mot de passe reinitialise avec succes.')
			setSuccess(true)
		} catch (err) {
			setError(String(err?.message || 'Erreur serveur.'))
		} finally {
			setResettingPassword(false)
		}
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
									steps={['Verification email', 'Verification code', 'Nouveau mot de passe']}
									completionByStep={completionByStep}
								/>
							</div>

							<div className='mt-8 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md px-5 py-4'>
								<p className='text-xs font-extrabold text-white/70 uppercase tracking-wider'>Info</p>
								<p className='mt-2 text-sm text-white/90'>
									Processus en 3 etapes: email, verification du code, puis nouveau mot de passe.
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

						{info ? (
							<div className='mb-4 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-800'>
								{info}
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
								<p style={{ fontFamily: "'Jost', sans-serif" }} className='text-4xl font-black text-[#000000]'>Etape 1</p>
								<h1 style={{ fontFamily: "'Jost', sans-serif" }} className='text-xl font-black text-[#000000]'>Saisissez votre email pour recevoir le code</h1>

								<div>
									<label htmlFor='reset-email' className={fieldLabelClass}>Adresse email</label>
									<input
										id='reset-email'
										type='email'
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className={fieldInputClass}
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
									disabled={sendingCode}
									className='w-full rounded-xl bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] py-3 text-white font-semibold shadow-lg hover:brightness-110 transition-all'
								>
									{sendingCode ? 'Envoi en cours...' : 'Envoyer le code'}
								</button>
							</form>
						) : step === 2 ? (
							<form onSubmit={handleVerifyCode} className='space-y-4'>
								<p style={{ fontFamily: "'Jost', sans-serif" }} className='text-4xl font-black text-[#000000]'>Etape 2</p>
								<h1 style={{ fontFamily: "'Jost', sans-serif" }} className='text-xl font-black text-[#000000]'>Verification du code recu</h1>

								<div className='rounded-xl border border-slate-200 bg-white px-4 py-3'>
									<p className='text-xs font-semibold text-slate-500'>Email de reception</p>
									<p className='mt-0.5 text-sm font-bold text-slate-800 break-all'>{email.trim()}</p>
									<button
										type='button'
										onClick={() => {
											setInfo('')
											setError('')
											setStep(1)
										}}
										className='mt-2 text-sm text-[#0a5f88] underline decoration-dotted underline-offset-4'
									>
										Modifier l'email
									</button>
								</div>

								<div>
									<label htmlFor='reset-code' className={fieldLabelClass}>Code de verification</label>
									<input
										id='reset-code'
										type='text'
										required
										value={code}
										onChange={(e) => setCode(e.target.value)}
										className={`${fieldInputClass} tracking-[0.28em] text-center font-black`}
										placeholder='000000'
										maxLength={6}
									/>
									<p className='mt-2 text-xs text-slate-600'>Entrez le code a 6 chiffres recu par email.</p>
								</div>

								<div className='flex items-center justify-between gap-2'>
									<button
										type='button'
										onClick={requestCode}
										disabled={sendingCode}
										className='text-sm font-semibold text-[#0a5f88] hover:underline disabled:opacity-60'
									>
										{sendingCode ? 'Renvoi...' : 'Renvoyer le code'}
									</button>
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
									disabled={verifyingCode}
									className='w-full rounded-xl bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] py-3 text-white font-semibold shadow-lg hover:brightness-110 transition-all'
								>
									{verifyingCode ? 'Verification...' : 'Verifier le code'}
								</button>
							</form>
						) : (
							<form onSubmit={handleResetPassword} className='space-y-4'>
								<p style={{ fontFamily: "'Jost', sans-serif" }} className='text-4xl font-black text-[#000000]'>Etape 3</p>
								<h1 style={{ fontFamily: "'Jost', sans-serif" }} className='text-xl font-black text-[#000000]'>Definissez votre nouveau mot de passe</h1>

								<div className='rounded-xl border border-slate-200 bg-white px-4 py-3'>
									<p className='text-xs font-semibold text-slate-500'>Email</p>
									<p className='mt-0.5 text-sm font-bold text-slate-800 break-all'>{email.trim()}</p>
									<p className='mt-1 text-xs font-semibold text-emerald-700'>Code verifie</p>
									<button
										type='button'
										onClick={() => {
											setInfo('')
											setError('')
											setStep(2)
										}}
										className='mt-2 text-sm text-[#0a5f88] underline decoration-dotted underline-offset-4'
									>
										Modifier le code
									</button>
								</div>

								<div>
									<label htmlFor='new-password' className={fieldLabelClass}>Nouveau mot de passe</label>
									<div className='relative'>
										<input
											id='new-password'
											type={showPwd1 ? 'text' : 'password'}
											required
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											className={`${fieldInputClass} pr-20`}
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
									<label htmlFor='confirm-password' className={fieldLabelClass}>Confirmer le mot de passe</label>
									<div className='relative'>
										<input
											id='confirm-password'
											type={showPwd2 ? 'text' : 'password'}
											required
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											className={`${fieldInputClass} pr-20`}
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
										onClick={() => setStep(2)}
										className='text-sm text-slate-600 hover:text-slate-800'
									>
										Retour verification
									</button>
								</div>

								<button
									type='submit'
									disabled={resettingPassword}
									className='w-full rounded-xl bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] py-3 text-white font-semibold shadow-lg hover:brightness-110 transition-all'
								>
									{resettingPassword ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
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
