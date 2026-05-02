import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CandidateHeader from '../components/CandidateHeader'
import { assets } from '../assets/assets'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function CandidateCVUpload() {
	const navigate = useNavigate()
	const [file, setFile] = useState(null)
	const [dragActive, setDragActive] = useState(false)
	const [error, setError] = useState('')
	const [extractionFailed, setExtractionFailed] = useState(false)
	const [previewUrl, setPreviewUrl] = useState('')
	const [uploading, setUploading] = useState(false)
	const [success, setSuccess] = useState('')
	const fileInputRef = useRef(null)

	const uploadButtonClassName = uploading
		? 'rounded-xl px-6 py-3 text-white font-semibold shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-600/20 bg-slate-400'
		: 'rounded-xl px-6 py-3 text-white font-semibold shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-600/20 bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] hover:brightness-110'

	useEffect(() => {
		const candidate = localStorage.getItem('airCandidate')
		if (!candidate) {
			navigate('/connecter')
		}
	}, [navigate])

	const uploadToBackend = async () => {
		setError('')
		setExtractionFailed(false)
		setSuccess('')
		let nextRoute = ''
		if (!file) {
			setError('Veuillez sélectionner un fichier avant l’envoi.')
			return
		}

		try {
			const rawCandidate = localStorage.getItem('airCandidate')
			if (!rawCandidate) {
				navigate('/connecter')
				return
			}
			const candidate = JSON.parse(rawCandidate)
			const candidateId = candidate?.id || candidate?._id
			if (!candidateId) {
				setError('Session invalide. Veuillez vous reconnecter.')
				return
			}

			setUploading(true)
			const formData = new FormData()
			formData.append('candidateId', candidateId)
			formData.append('cvFile', file)

			const response = await fetch(`${API_BASE}/cv/upload`, {
				method: 'POST',
				body: formData,
			})
			const data = await response.json()
			if (!response.ok || !data.success) {
				if (response.status === 422) {
					setExtractionFailed(true)
					setError(data.message || "L'extraction de ton CV est impossible.")
				} else {
					setError(data.message || 'Upload impossible.')
				}
				return
			}
			setSuccess('CV uploadé et sauvegardé dans la base. Redirection…')
			nextRoute = '/EspaceCandidat/dashboard'
		} catch {
			setError('Serveur indisponible. Vérifiez que le backend tourne.')
		} finally {
			setUploading(false)
		}

		if (nextRoute) {
			navigate(nextRoute)
		}
	}

	useEffect(() => {
		if (!file) {
			setPreviewUrl('')
			return
		}

		if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
			const url = URL.createObjectURL(file)
			setPreviewUrl(url)
			return () => URL.revokeObjectURL(url)
		}

		setPreviewUrl('')
	}, [file])

	const validateAndSetFile = (nextFile) => {
		setError('')
		if (!nextFile) {
			setFile(null)
			return
		}

		const maxSizeMb = 10
		const sizeMb = nextFile.size / (1024 * 1024)
		if (sizeMb > maxSizeMb) {
			setError(`Fichier trop volumineux. Taille max: ${maxSizeMb} MB.`)
			setFile(null)
			return
		}

		setFile(nextFile)
	}

	const fileLabel = useMemo(() => {
		if (!file) return ''
		const sizeMb = (file.size / (1024 * 1024)).toFixed(2)
		return `${file.name} — ${sizeMb} MB`
	}, [file])

	let previewBlock = null
	if (previewUrl) {
		previewBlock = (
			<div className='mt-6 rounded-2xl overflow-hidden border border-slate-200 bg-white'>
				<div className='px-4 py-3 border-b border-slate-200 text-sm font-bold text-slate-700'>Aperçu (PDF)</div>
				<iframe title='Aperçu CV' src={previewUrl} className='w-full h-[420px]' />
			</div>
		)
	} else if (file) {
		previewBlock = <div className='mt-5 text-xs text-slate-500'>Aperçu disponible uniquement pour les fichiers PDF.</div>
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

			<main className='relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10'>
				<div className='bg-white/95 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] border border-white/20'>
					<div className='px-8 sm:px-12 py-8 bg-gradient-to-r from-[#f4fbfc] via-white to-[#f4fbfc] border-b border-[#0a7da4]/10 flex items-center justify-between gap-3 flex-wrap'>
						<div>
							<h1 className='text-2xl sm:text-3xl font-black text-[#06213a]'>Upload de CV</h1>
							<p className='mt-2 text-sm sm:text-base text-slate-600'>Déposez votre fichier et enregistrez-le dans la base.</p>
						</div>
						<button
							type='button'
							onClick={() => navigate('/EspaceCandidat')}
							className='rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-cyan-600/20'
						>
							← Retour
						</button>
					</div>

					<div className='p-6 sm:p-10 bg-[#fdfdfd]'>
							<div
								role='button'
								tabIndex={0}
								aria-label='Zone de dépôt du CV'
								className={`rounded-2xl border-2 border-dashed bg-white p-8 text-center transition-colors ${
									dragActive ? 'border-cyan-600 bg-cyan-50/40' : 'border-[#0a7da4]/40'
								}`}
								onClick={() => fileInputRef.current?.click()}
								onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
								onDragEnter={(e) => {
									e.preventDefault()
									e.stopPropagation()
									setDragActive(true)
								}}
								onDragOver={(e) => {
									e.preventDefault()
									e.stopPropagation()
									setDragActive(true)
								}}
								onDragLeave={(e) => {
									e.preventDefault()
									e.stopPropagation()
									setDragActive(false)
								}}
								onDrop={(e) => {
									e.preventDefault()
									e.stopPropagation()
									setDragActive(false)
									const dropped = e.dataTransfer?.files?.[0]
									validateAndSetFile(dropped)
								}}
							>
								<p className='text-sm font-semibold text-slate-700'>Glissez-déposez votre fichier ici</p>
								<p className='mt-1 text-xs text-slate-500'>Formats acceptés: tous (max 10 MB)</p>

								<div className='mt-5 flex items-center justify-center'>
									<span className='cursor-pointer rounded-xl bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] px-5 py-2.5 text-white font-semibold shadow-lg hover:brightness-110 transition-all'>
										Choisir un fichier
									</span>
								</div>

								{error ? (
							<div className='mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold'>
								<p>{error}</p>
								{extractionFailed && (
									<button
										type='button'
										onClick={() => navigate('/EspaceCandidat/cv/builder')}
										className='mt-3 inline-block rounded-lg bg-red-600 px-4 py-2 text-white text-sm font-bold hover:bg-red-700 transition'
									>
										Reconstruire mon CV avec le site →
									</button>
								)}
							</div>
						) : null}
								{previewBlock}
							</div>

							<div className='mt-6 flex items-center justify-center'>
								<button
									type='button'
									onClick={uploadToBackend}
									disabled={uploading}
									className={uploadButtonClassName}
								>
									{uploading ? 'Envoi…' : 'Envoyer et sauvegarder'}
								</button>
							</div>
							<input ref={fileInputRef} type='file' className='hidden' onChange={(e) => validateAndSetFile(e.target.files?.[0] || null)} />
					</div>
				</div>
                </main>
		</section>
	)
}

export default CandidateCVUpload
