/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { Badge, Tag } from './ui'

const LEVEL_LABELS = {
	beginner: 'Débutant',
	intermediate: 'Intermédiaire',
	advanced: 'Avancé',
}

function toEmbedUrl(url) {
	if (!url) return ''
	const trimmed = String(url).trim()
	// YouTube
	const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i)
	if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
	// Vimeo
	const vmMatch = trimmed.match(/vimeo\.com\/(\d+)/i)
	if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`
	return trimmed
}

function FormationSection({ section, formationId, candidateId, onTakeTest }) {
	const videos = Array.isArray(section.videos) ? [...section.videos].sort((a, b) => (a.order || 0) - (b.order || 0)) : []
	const test = section.test || {}
	const hasTest = test.enabled && Array.isArray(test.questions) && test.questions.length > 0

	return (
		<div className='rounded-2xl border border-slate-200 bg-white p-4'>
			<div className='flex items-start justify-between gap-3'>
				<div className='min-w-0'>
					<h4 className='text-base font-black text-[#0d355b]'>{section.title || 'Section sans titre'}</h4>
					{section.description ? <p className='mt-1 text-sm text-[#587a99]'>{section.description}</p> : null}
				</div>
				<div className='flex shrink-0 flex-col items-end gap-1'>
					{videos.length > 0 ? <Badge variant='cyan'>{videos.length} vidéo(s)</Badge> : null}
					{hasTest ? <Badge variant='emerald'>Test inclus</Badge> : null}
				</div>
			</div>

			{videos.length > 0 ? (
				<div className='mt-3 space-y-3'>
					{videos.map((video, idx) => (
						<div key={idx} className='overflow-hidden rounded-xl border border-slate-200 bg-slate-50'>
							{video.title ? <p className='border-b border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0d355b]'>{video.title}</p> : null}
							{video.url ? (
								<div className='aspect-video w-full bg-black'>
									<iframe
										src={toEmbedUrl(video.url)}
										title={video.title || `Vidéo ${idx + 1}`}
										className='h-full w-full'
										allowFullScreen
										allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
									/>
								</div>
							) : null}
						</div>
					))}
				</div>
			) : null}

			{hasTest && (
				<div className='mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3'>
					<div>
						<p className='text-sm font-bold text-emerald-800'>Test d&apos;évaluation disponible</p>
						<p className='text-xs text-emerald-700'>
							{test.questions.length} question(s) • Score min {test.passingScore || 50}%
							{test.timeLimitMinutes ? ` • ${test.timeLimitMinutes} min` : ''}
						</p>
					</div>
					<button
						type='button'
						onClick={() => onTakeTest?.({ section, formationId })}
						disabled={!candidateId}
						className='rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:bg-slate-300'
					>
						Passer le test
					</button>
				</div>
			)}
		</div>
	)
}

function TestModal({ section, formationId, candidateId, onClose, onSubmitted }) {
	const questions = section.test?.questions || []
	const [answers, setAnswers] = useState({})
	const [submitting, setSubmitting] = useState(false)
	const [result, setResult] = useState(null)
	const [error, setError] = useState('')
	const [startedAt] = useState(() => Date.now())

	const handleSelect = (qIdx, oIdx) => {
		setAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))
	}

	const handleSubmit = async () => {
		setSubmitting(true)
		setError('')
		try {
			const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
			const payload = {
				candidateId,
				timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000),
				answers: questions.map((_, idx) => ({ questionIndex: idx, selectedIndex: answers[idx] ?? -1 })),
			}
			const resp = await fetch(`${apiBase}/formations/${formationId}/sections/${section._id}/test/submit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const data = await resp.json()
			if (!resp.ok || !data.success) throw new Error(data.message || 'Erreur lors de la soumission.')
			setResult(data.result)
			onSubmitted?.(data)
		} catch (e) {
			setError(e.message || 'Erreur réseau.')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4'>
			<div className='w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-2xl'>
				<div className='flex items-center justify-between border-b border-cyan-100 bg-gradient-to-r from-[#f7fcff] to-[#ecf7ff] px-5 py-4'>
					<h3 className='text-base font-black text-[#0d355b]'>Test : {section.title || 'Section'}</h3>
					<button onClick={onClose} className='rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50'>
						Fermer
					</button>
				</div>

				<div className='max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4'>
					{result ? (
						<div className={`rounded-2xl border p-5 text-center ${result.passed ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
							<p className={`text-3xl font-black ${result.passed ? 'text-emerald-700' : 'text-rose-700'}`}>{result.score}%</p>
							<p className={`mt-1 text-sm font-bold ${result.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
								{result.passed ? 'Test réussi !' : 'Test non réussi'}
							</p>
							<p className='mt-2 text-sm text-slate-600'>
								{result.correctCount} / {result.totalQuestions} bonnes réponses
								{` • Score min requis : ${result.passingScore}%`}
							</p>
						</div>
					) : (
						<>
							{error ? <div className='rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700'>{error}</div> : null}
							{questions.map((q, qIdx) => (
								<div key={qIdx} className='rounded-xl border border-slate-200 bg-slate-50/40 p-3'>
									<p className='mb-2 text-sm font-bold text-[#0d355b]'>
										{qIdx + 1}. {q.question}
									</p>
									<div className='space-y-1.5'>
										{(q.options || []).map((opt, oIdx) => (
											<label key={oIdx} className='flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:border-cyan-300'>
												<input
													type='radio'
													name={`q-${qIdx}`}
													checked={answers[qIdx] === oIdx}
													onChange={() => handleSelect(qIdx, oIdx)}
												/>
												<span>{opt}</span>
											</label>
										))}
									</div>
								</div>
							))}
						</>
					)}
				</div>

				<div className='flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3'>
					{result ? (
						<button onClick={onClose} className='rounded-xl bg-[#001d3e] px-4 py-2 text-sm font-semibold text-white'>
							Terminer
						</button>
					) : (
						<button
							onClick={handleSubmit}
							disabled={submitting || Object.keys(answers).length === 0}
							className='rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:bg-slate-300'
						>
							{submitting ? 'Envoi...' : 'Soumettre le test'}
						</button>
					)}
				</div>
			</div>
		</div>
	)
}

export function DashboardCandFormationsView({
	formations = [],
	loading = false,
	error = '',
	applyingId = '',
	onApply,
	successMessage = '',
	candidateId = '',
}) {
	const [expandedId, setExpandedId] = useState(null)
	const [activeTest, setActiveTest] = useState(null) // { section, formationId }

	return (
		<div className='mt-8 space-y-5'>
			<div className='overflow-hidden rounded-3xl border border-[#b8d7ee] bg-gradient-to-br from-[#f7fbff] via-[#eef7ff] to-[#e4f0fb] shadow-[0_12px_28px_rgba(8,51,93,0.1)]'>
				<div className='flex flex-wrap items-center justify-between gap-3 border-b border-[#0d355b]/10 bg-white/70 px-5 py-4 backdrop-blur'>
					<div>
						<p className='text-xs font-black tracking-[0.14em] text-[#5c7fa1] uppercase'>Espace formation</p>
						<h2 className='mt-1 text-2xl font-black text-[#0d355b]'>Formations proposées par l&apos;administration</h2>
						<p className='mt-1 text-sm text-[#547896]'>Choisissez une formation puis postulez directement depuis votre espace candidat.</p>
					</div>
					<Badge variant='cyan'>{formations.length} formation(s)</Badge>
				</div>

				<div className='p-5'>
					{error ? (
						<div className='mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>
							{error}
						</div>
					) : null}
					{successMessage ? (
						<div className='mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800'>
							{successMessage}
						</div>
					) : null}
					{loading ? (
						<div className='rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600'>Chargement des formations...</div>
					) : formations.length ? (
						<div className='grid gap-4 lg:grid-cols-2'>
							{formations.map((formation) => {
								const applied = Boolean(formation?.isApplied)
								const applying = applyingId && String(applyingId) === String(formation?._id)
								const sections = Array.isArray(formation.sections) ? [...formation.sections].sort((a, b) => (a.order || 0) - (b.order || 0)) : []
								const expanded = expandedId === formation._id

								return (
									<article key={formation._id} className='overflow-hidden rounded-3xl border border-white bg-white shadow-[0_12px_28px_rgba(8,51,93,0.08)]'>
										<div className='h-2 bg-gradient-to-r from-[#0d355b] via-[#0a5f88] to-[#06b6d4]' />
										<div className='p-5'>
											<div className='flex items-start justify-between gap-3'>
												<div className='min-w-0'>
													<p className='text-[11px] font-black tracking-[0.14em] text-[#5d7d98] uppercase'>{formation.provider || 'A.I.R'}</p>
													<h3 className='mt-1 text-xl font-black text-[#0d355b]'>{formation.title}</h3>
													<p className='mt-2 text-sm leading-6 text-[#587a99]'>{formation.description}</p>
												</div>
												<div className='flex shrink-0 flex-col items-end gap-2'>
													<Badge variant={applied ? 'emerald' : 'cyan'}>{applied ? 'Déjà postulé' : 'Ouverte'}</Badge>
													{formation.applicationsCount != null ? <Badge variant='slate'>{formation.applicationsCount} candidat(s)</Badge> : null}
													{sections.length > 0 ? <Badge variant='cyan'>{sections.length} section(s)</Badge> : null}
												</div>
											</div>

											<div className='mt-4 flex flex-wrap gap-2'>
												{formation.category ? <Tag>{formation.category}</Tag> : null}
												<Tag>{LEVEL_LABELS[formation.level] || formation.level || 'Niveau'}</Tag>
												{formation.duration ? <Tag>{formation.duration}</Tag> : null}
												{Array.isArray(formation.tags) ? formation.tags.slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>) : null}
											</div>

											<div className='mt-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
												<div className='text-xs font-medium text-slate-600'>
													{formation.appliedAt ? `Postulé le ${new Date(formation.appliedAt).toLocaleDateString('fr-FR')}` : 'Aucune inscription enregistrée'}
												</div>
												<div className='flex gap-2'>
													{sections.length > 0 ? (
														<button
															type='button'
															onClick={() => setExpandedId(expanded ? null : formation._id)}
															className='rounded-xl border border-cyan-300 bg-white px-3 py-2 text-xs font-semibold text-[#0a5f88] hover:bg-cyan-50'
														>
															{expanded ? 'Masquer le contenu' : 'Voir le contenu'}
														</button>
													) : null}
													<button
														type='button'
														onClick={() => onApply?.(formation)}
														disabled={applied || applying}
														className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${applied || applying ? 'bg-slate-300' : 'bg-[#001d3e] hover:opacity-95'}`}
													>
														{applying ? 'Envoi...' : applied ? 'Déjà postulé' : 'Postuler'}
													</button>
												</div>
											</div>

											{expanded && sections.length > 0 ? (
												<div className='mt-4 space-y-3'>
													{sections.map((section, idx) => (
														<FormationSection
															key={section._id || idx}
															section={section}
															formationId={formation._id}
															candidateId={candidateId}
															onTakeTest={(payload) => setActiveTest(payload)}
														/>
													))}
												</div>
											) : null}
										</div>
									</article>
								)
							})}
						</div>
					) : (
						<div className='rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600'>
							Aucune formation publiée pour le moment.
						</div>
					)}
				</div>
			</div>

			{activeTest ? (
				<TestModal
					section={activeTest.section}
					formationId={activeTest.formationId}
					candidateId={candidateId}
					onClose={() => setActiveTest(null)}
					onSubmitted={() => {}}
				/>
			) : null}
		</div>
	)
}
