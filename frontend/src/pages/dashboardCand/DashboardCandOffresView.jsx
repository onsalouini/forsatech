/* eslint-disable react/prop-types */
import React from 'react'
import { Badge, Tag } from './ui'

export function DashboardCandOffresView({
	loadError,
	searchQuery,
	setSearchQuery,
	salaryMin,
	setSalaryMin,
	salaryMax,
	setSalaryMax,
	experienceMinYears,
	setExperienceMinYears,
	sortPreference,
	setSortPreference,
	filtered,
	cvMatchLoading,
	cvMatchError,
	selectedJob,
	savedJobs,
	toggleSave,
	setSelectedJobId,
	setApplyStatus,
	effectiveApplyStatus,
	setSelectedView,
	handleApply,
	isApplying,
	quizLoading,
	selectedJobAlreadyApplied,
}) {
	const hasActiveFilters = Boolean(
		String(searchQuery || '').trim() ||
		String(salaryMin || '').trim() ||
		String(salaryMax || '').trim() ||
		String(experienceMinYears || '').trim() ||
		sortPreference !== 'relevance'
	)

	return (
		<div className='mt-8 space-y-6'>
			{loadError ? (
				<div className='rounded-2xl border border-rose-200 bg-rose-50 p-4'>
					<p className='text-sm font-semibold text-rose-800'>{loadError}</p>
				</div>
			) : null}
			<div className='overflow-hidden rounded-2xl border border-[#b9d5ea] bg-gradient-to-br from-[#f7fbff] via-[#eff7ff] to-[#e7f2fc] shadow-[0_12px_28px_rgba(8,51,93,0.1)]'>
				<div className='flex flex-wrap items-center justify-between gap-2 border-b border-[#0d355b]/25 bg-gradient-to-r from-[#0d355b] to-[#0a5f88] px-4 py-3'>
					<div>
						<p className='text-[11px] font-black tracking-[0.12em] text-cyan-100'>RECHERCHE ET FILTRES</p>
						<p className='mt-1 text-[12px] font-semibold text-cyan-50/90'>Affinez rapidement les offres selon votre objectif</p>
					</div>
					{hasActiveFilters ? (
						<span className='rounded-full border border-cyan-200/60 bg-white/15 px-3 py-1 text-[11px] font-semibold text-cyan-50'>Filtres actifs</span>
					) : null}
				</div>

				<div className='space-y-4 p-4'>
					<div className='grid gap-3 xl:grid-cols-[1.3fr_0.7fr]'>
						<div className='flex flex-col gap-3 rounded-xl border border-[#c6dff2] bg-white px-4 py-3 sm:flex-row sm:items-center'>
							<span className='text-lg text-[#5f89ad]'>🔎</span>
							<input
								type='text'
								placeholder='Poste, entreprise, ville, competence...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className='w-full bg-transparent text-sm font-medium text-[#173c62] outline-none placeholder:text-[#8aa5bf]'
							/>
							<button
								type='button'
								onClick={() => setSearchQuery('')}
								className='w-full shrink-0 rounded-lg border border-[#c6dff2] bg-[#f4faff] px-3 py-1.5 text-xs font-semibold text-[#2b587f] transition hover:bg-[#e8f3ff] sm:w-auto'
							>
								Effacer
							</button>
						</div>

						<div className='rounded-xl border border-[#c6dff2] bg-white px-4 py-3'>
							<p className='mb-2 text-[11px] font-black tracking-[0.12em] text-[#587b9c]'>PRÉFÉRENCE DE TRI</p>
							<select
								value={sortPreference}
								onChange={(e) => setSortPreference(e.target.value)}
								className='w-full rounded-lg border border-[#c6dff2] bg-[#f8fcff] px-3 py-2 text-sm font-semibold text-[#1e4268] outline-none'
							>
								<option value='relevance'>Pertinence (par defaut)</option>
								<option value='match_desc'>Matching: decroissant</option>
								<option value='match_asc'>Matching: croissant</option>
								<option value='recent'>Plus recent</option>
								<option value='salary_desc'>Remuneration: decroissante</option>
								<option value='salary_asc'>Remuneration: croissante</option>
							</select>
						</div>
					</div>

					<div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
						<div className='rounded-xl border border-[#c6dff2] bg-white px-4 py-3'>
							<p className='text-[11px] font-black tracking-[0.12em] text-[#587b9c]'>RÉMUNÉRATION MIN (TND/MOIS)</p>
							<input
								type='number'
								inputMode='numeric'
								placeholder='ex: 1200'
								value={salaryMin}
								onChange={(e) => setSalaryMin(e.target.value)}
								className='mt-1 w-full bg-transparent text-sm font-semibold text-[#173c62] outline-none placeholder:text-[#8aa5bf]'
							/>
						</div>

						<div className='rounded-xl border border-[#c6dff2] bg-white px-4 py-3'>
							<p className='text-[11px] font-black tracking-[0.12em] text-[#587b9c]'>RÉMUNÉRATION MAX (TND/MOIS)</p>
							<input
								type='number'
								inputMode='numeric'
								placeholder='ex: 3000'
								value={salaryMax}
								onChange={(e) => setSalaryMax(e.target.value)}
								className='mt-1 w-full bg-transparent text-sm font-semibold text-[#173c62] outline-none placeholder:text-[#8aa5bf]'
							/>
						</div>

						<div className='rounded-xl border border-[#c6dff2] bg-white px-4 py-3'>
							<p className='text-[11px] font-black tracking-[0.12em] text-[#587b9c]'>EXPÉRIENCE MINIMALE</p>
							<input
								type='number'
								inputMode='numeric'
								placeholder='annees (ex: 2)'
								value={experienceMinYears}
								onChange={(e) => setExperienceMinYears(e.target.value)}
								className='mt-1 w-full bg-transparent text-sm font-semibold text-[#173c62] outline-none placeholder:text-[#8aa5bf]'
							/>
						</div>

						<button
							type='button'
							onClick={() => {
								setSearchQuery('')
								setSalaryMin('')
								setSalaryMax('')
								setExperienceMinYears('')
								setSortPreference('relevance')
							}}
							className='rounded-xl border border-[#001d3e] bg-[#001d3e] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95'
						>
							Réinitialiser les filtres
						</button>
					</div>
				</div>
			</div>

			<div className='grid gap-6 lg:grid-cols-[1.2fr_0.95fr]'>
				<div className='overflow-hidden rounded-2xl border border-[#b6cfe6] bg-white shadow-[0_8px_20px_rgba(8,51,93,0.08)]'>
					<div className='flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3'>
						<p className='text-sm font-semibold text-slate-700'>
							<span className='font-black text-[#0d355b]'>{filtered.length}</span> offres correspondent
						</p>
						<p className='text-xs font-semibold text-slate-500'>
							{cvMatchLoading ? 'Analyse CV en cours…' : cvMatchError ? 'Analyse CV indisponible' : 'Cliquez une offre pour voir le détail'}
						</p>
					</div>

					<div className='max-h-[620px] overflow-y-auto p-4'>
						<div className='space-y-3'>
							{filtered.map((j) => {
								const active = selectedJob?.id === j.id
								const saved = savedJobs.has(j.id)
								return (
									<div
										key={j.id}
										className={`relative w-full rounded-2xl border border-l-4 transition ${active ? 'border-cyan-300 border-l-[#0a5f88] bg-cyan-50 shadow-[0_8px_18px_rgba(9,84,129,0.12)]' : 'border-slate-200 border-l-[#0d355b]/20 bg-white hover:bg-slate-50'}`}
									>
										<button
											type='button'
											onClick={() => {
												setSelectedJobId(j.id)
												setApplyStatus(null)
											}}
											className='w-full cursor-pointer rounded-2xl p-4 text-left'
										>
											<div className='flex items-start gap-3'>
												<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl'>
													{j.emoji}
												</div>
												<div className='min-w-0 flex-1 pr-10'>
													<div className='flex items-start justify-between gap-3'>
														<div>
															<p className='text-sm font-black text-[#103b62]'>{j.title}</p>
															<p className='mt-1 text-xs text-[#587a99]'>
																{j.company} · {j.location}
															</p>
														</div>
														<div className='flex items-center gap-2'>
															<Badge variant={j.type === 'CDI' ? 'emerald' : 'violet'}>{j.type}</Badge>
															{Number.isFinite(j.matchScore) ? (
																<Badge variant={j.matchScore >= 70 ? 'emerald' : j.matchScore >= 45 ? 'cyan' : 'amber'}>Match {j.matchScore}%</Badge>
															) : null}
														</div>
													</div>
													<div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
														<div className='flex flex-wrap gap-2'>
															{j.tags?.slice(0, 3).map((t) => (
																<Tag key={t}>{t}</Tag>
															))}
															{j.tags?.length > 3 ? <Tag>+{j.tags.length - 3}</Tag> : null}
														</div>
														<div className='flex items-center gap-2'>
															{j.featured ? <Badge variant='amber'>Vedette</Badge> : null}
															<span className='text-xs font-semibold text-slate-500'>{j.posted}</span>
														</div>
													</div>
												</div>
											</div>
										</button>
										<button
											type='button'
											onClick={(e) => toggleSave(e, j.id)}
											className='absolute right-4 top-4 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 hover:bg-slate-50'
											aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
										>
											{saved ? '♥' : '♡'}
										</button>
									</div>
								)
							})}
						</div>
					</div>
				</div>

				<div className='flex flex-col gap-4'>
					{selectedJob && (
						<div className='overflow-hidden rounded-2xl border border-[#0d355b]/25 bg-white shadow-[0_10px_24px_rgba(8,51,93,0.12)]'>
							<div className='border-b border-[#0d355b]/15 bg-gradient-to-r from-[#f2f8ff] to-white p-5'>
								<div className='flex items-start justify-between gap-3'>
									<div className='flex items-center gap-3'>
										<div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl'>
											{selectedJob.emoji}
										</div>
										<div className='min-w-0'>
											<p className='text-lg font-black text-[#0d355b]'>{selectedJob.title}</p>
											<p className='mt-1 text-sm text-[#587a99]'>
												{selectedJob.company} · {selectedJob.location}
											</p>
										</div>
									</div>

									<button
										type='button'
										onClick={(e) => toggleSave(e, selectedJob.id)}
										className='rounded-xl border border-[#0d355b]/20 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'
									>
										{savedJobs.has(selectedJob.id) ? 'Retirer ♥' : 'Favoris ♡'}
									</button>
								</div>

								<div className='mt-4 flex flex-wrap gap-2'>
									<Badge variant={selectedJob.type === 'CDI' ? 'emerald' : 'violet'}>{selectedJob.type}</Badge>
									{selectedJob.featured ? <Badge variant='amber'>En vedette</Badge> : null}
									{selectedJob.workMode ? <Badge variant='blue'>{selectedJob.workMode}</Badge> : null}
									{Number.isFinite(selectedJob.matchScore) ? (
										<Badge variant={selectedJob.matchScore >= 70 ? 'emerald' : selectedJob.matchScore >= 45 ? 'cyan' : 'amber'}>
											Match {selectedJob.matchScore}%
										</Badge>
									) : null}
								</div>

								<div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3'>
									<div className='rounded-2xl border border-[#0d355b]/15 bg-slate-50 p-3'>
										<p className='text-xs font-semibold text-slate-600'>Contrat</p>
										<p className='mt-1 break-words text-lg font-black leading-tight text-[#0d355b]'>{selectedJob.type}</p>
									</div>
									<div className='rounded-2xl border border-[#0d355b]/15 bg-slate-50 p-3'>
										<p className='text-xs font-semibold text-slate-600'>Clôture</p>
										<p className='mt-1 break-words text-lg font-black leading-tight text-amber-700'>{selectedJob.closes}</p>
									</div>
									<div className='rounded-2xl border border-[#0d355b]/15 bg-slate-50 p-3'>
										<p className='text-xs font-semibold text-slate-600'>TND/mois</p>
										<p className='mt-1 break-words text-lg font-black leading-tight text-[#103b62]'>{selectedJob.salary}</p>
									</div>
								</div>

								{effectiveApplyStatus ? (
									<div
										className={`mt-4 rounded-2xl border p-4 ${
											effectiveApplyStatus.type === 'success'
												? 'border-emerald-200 bg-emerald-50'
												: effectiveApplyStatus.type === 'error'
													? 'border-rose-200 bg-rose-50'
													: 'border-cyan-200 bg-cyan-50'
										}`}
									>
										<p
											className={`text-sm font-semibold ${
												effectiveApplyStatus.type === 'success'
													? 'text-emerald-800'
													: effectiveApplyStatus.type === 'error'
														? 'text-rose-800'
														: 'text-[#0a5f88]'
											}`}
										>
											{effectiveApplyStatus.message}
										</p>
										<div className='mt-2'>
											<button
												type='button'
												onClick={() => setSelectedView('candidatures')}
												className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'
											>
												Voir mes candidatures
											</button>
										</div>
									</div>
								) : null}

								<button
									type='button'
									onClick={handleApply}
									disabled={isApplying || quizLoading || selectedJobAlreadyApplied}
									className={`mt-4 w-full rounded-2xl py-3 text-sm font-bold text-white transition ${
										isApplying || quizLoading || selectedJobAlreadyApplied ? 'bg-slate-300' : 'bg-[#001d3e] hover:opacity-95'
									}`}
								>
									{quizLoading ? 'Generation quiz...' : isApplying ? 'Envoi en cours...' : selectedJobAlreadyApplied ? 'Deja postule' : 'Passer le quiz et postuler'}
								</button>
							</div>

							<div className='max-h-[520px] overflow-y-auto p-5'>
								<div>
									<p className='text-[12px] font-black tracking-[0.12em] text-[#0d355b]'>DESCRIPTION DE L’OFFRE</p>
									<p className='mt-2 whitespace-pre-line text-sm leading-7 text-slate-600'>
										{selectedJob.desc || 'Aucune description fournie.'}
									</p>
								</div>

								{selectedJob.missions && selectedJob.missions.length > 0 && (
									<div className='mt-6'>
										<p className='text-[12px] font-black tracking-[0.12em] text-[#0d355b]'>MISSIONS PRINCIPALES</p>
										<div className='mt-3 space-y-2'>
											{selectedJob.missions.map((m) => (
												<div key={m} className='flex items-start gap-2'>
													<span className='mt-1 text-cyan-600'>→</span>
													<p className='text-sm text-slate-600'>{m}</p>
												</div>
											))}
										</div>
									</div>
								)}

							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
