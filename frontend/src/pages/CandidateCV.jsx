import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CandidateHeader from '../components/CandidateHeader'
import { assets } from '../assets/assets'

function CandidateCV() {
	const navigate = useNavigate()

	useEffect(() => {
		const candidate = localStorage.getItem('airCandidate')
		if (!candidate) {
			navigate('/connecter')
		}
	}, [navigate])

	return (
		<section
			className='relative w-full min-h-screen bg-cover bg-center flex flex-col'
			style={{ backgroundImage: `url(${assets.couverture})` }}
		>
			<div className='absolute inset-0 bg-gradient-to-br from-[#020b16]/90 via-[#06213a]/80 to-[#020b16]/90 backdrop-blur-sm' />

			<CandidateHeader
				onLogoClick={() => navigate('/')}
				onLogout={() => {
					localStorage.removeItem('airCandidate')
					navigate('/')
				}}
			/>

			{/* CONTENU PRINCIPAL */}
			<main className='relative z-10 flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-center'>
				{/* Carte principale */}
				<div className='bg-white/95 backdrop-blur-md rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] border border-white/20 transition-all'>
					
					{/* Header de la carte */}
					<div className='px-8 sm:px-12 py-10 bg-gradient-to-r from-[#f4fbfc] via-white to-[#f4fbfc] border-b border-[#0a7da4]/10 text-center flex flex-col items-center justify-center'>
						<h1 className='text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#06213a] to-[#0a7da4] tracking-tight'>
							Propulsez votre CV vers l'avenir
						</h1>
						<p className='mt-4 text-base sm:text-lg text-slate-600 font-medium max-w-2xl'>
							Comment préférez-vous partager votre profil professionnel avec nous ?
						</p>
					</div>

					<div className='p-8 sm:p-12 bg-[#fdfdfd]'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
							
							{/* Option 1: J'ai déjà un CV */}
							<button
								type='button'
								onClick={() => navigate('/EspaceCandidat/upload')}
								className='group relative w-full text-left cursor-pointer rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-sm hover:shadow-2xl hover:border-[#0a7da4]/50 transition-all duration-300 transform hover:-translate-y-2 flex flex-col justify-between'
							>
								<div className="absolute -top-3 -right-3">
									<span className="flex h-6 w-6">
									  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
									  <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 border-2 border-white"></span>
									</span>
								</div>
								
								<div>
									<div className='flex items-center justify-between mb-6'>
										<div className='bg-emerald-50 text-emerald-600 p-4 rounded-2xl shadow-inner'>
											<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
											</svg>
										</div>
										<span className='inline-flex items-center rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-800 uppercase tracking-wide'>
											Analyse Express — 5s
										</span>
									</div>
									<h2 className='text-2xl font-black text-[#06213a] mb-3 group-hover:text-[#0a7da4] transition-colors'>
										J’ai déjà un CV
									</h2>
									<p className='text-slate-600 leading-relaxed font-medium'>
										Importez votre CV existant. Notre intelligence artificielle s'occupe d'extraire et de structurer vos compétences avec précision.
									</p>
									<div className='mt-6 flex gap-2'>
										<span className='px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100 shadow-sm'>PDF</span>
										<span className='px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 shadow-sm'>DOC</span>
										<span className='px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-bold border border-sky-100 shadow-sm'>DOCX</span>
									</div>
								</div>
								
								<div className='mt-10 pt-6 border-t border-slate-100'>
									<span className='flex items-center justify-center w-full rounded-xl bg-gradient-to-r from-[#0f2742] via-[#1c3960] to-[#2b4b76] text-white py-4 font-bold shadow-md group-hover:shadow-lg transition-all'>
										Importer mon fichier
										<svg className="w-5 h-5 ml-2 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
										</svg>
									</span>
								</div>
							</button>

							{/* Option 2: Construire mon CV */}
							<button
								type='button'
								onClick={() => navigate('/EspaceCandidat/construire/etape-1')}
								className='group relative w-full text-left cursor-pointer rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-sm hover:shadow-2xl hover:border-indigo-400/50 transition-all duration-300 transform hover:-translate-y-2 flex flex-col justify-between'
							>
								<div>
									<div className='flex items-center justify-between mb-6'>
										<div className='bg-indigo-50 text-indigo-600 p-4 rounded-2xl shadow-inner'>
											<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
											</svg>
										</div>
										<span className='inline-flex items-center rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-black text-indigo-800 uppercase tracking-wide'>
											Génération Guidée
										</span>
									</div>
									<h2 className='text-2xl font-black text-[#06213a] mb-3 group-hover:text-indigo-600 transition-colors'>
										Construire mon CV
									</h2>
									<p className='text-slate-600 leading-relaxed font-medium'>
										Vous n'avez pas de CV sous la main ? Remplissez un formulaire guidé simple et laissez notre IA générer un profil professionnel parfait.
									</p>
									<div className='mt-6 flex gap-2'>
										<span className='px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm'>Étape par étape</span>
										<span className='px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 shadow-sm'>Magie de l'IA</span>
									</div>
								</div>
								
								<div className='mt-10 pt-6 border-t border-slate-100'>
									<span className='flex items-center justify-center w-full rounded-xl bg-white border-2 border-indigo-100 text-indigo-700 py-3.5 font-bold group-hover:bg-indigo-50 group-hover:border-indigo-200 shadow-sm group-hover:shadow transition-all'>
										Lancer la création
										<svg className="w-5 h-5 ml-2 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
										</svg>
									</span>
								</div>
							</button>

						</div>
					</div>
				</div>
			</main>
		</section>
	)
}

export default CandidateCV
