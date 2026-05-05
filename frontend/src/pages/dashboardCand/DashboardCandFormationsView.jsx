/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from 'react'
import { Badge, Tag } from './ui'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const STATIC_BASE = API_BASE.replace(/\/api\/?$/, '')

const LEVEL_LABELS = {
	beginner: 'Débutant',
	intermediate: 'Intermédiaire',
	advanced: 'Avancé',
}

const LEVEL_BADGE_COLORS = {
	beginner: 'from-emerald-400 to-emerald-600',
	intermediate: 'from-amber-400 to-orange-500',
	advanced: 'from-rose-500 to-fuchsia-600',
}

function resolveAssetUrl(url) {
	if (!url) return ''
	if (/^(https?:|data:|blob:)/i.test(url)) return url
	// URLs GridFS (/api/formations/files/:id) → préfixe STATIC_BASE
	if (url.startsWith('/api/')) return `${STATIC_BASE}${url}`
	return `${STATIC_BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

function getEmbed(url) {
	if (!url) return { type: 'none', src: '' }
	const trimmed = String(url).trim()
	if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/api/formations/files/')) {
		return { type: 'file', src: resolveAssetUrl(trimmed) }
	}
	const yt = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i)
	if (yt) return { type: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}?rel=0` }
	const vm = trimmed.match(/vimeo\.com\/(\d+)/i)
	if (vm) return { type: 'iframe', src: `https://player.vimeo.com/video/${vm[1]}` }
	if (/\.(mp4|webm|ogg|mov)$/i.test(trimmed)) return { type: 'file', src: trimmed }
	return { type: 'iframe', src: trimmed }
}

function FormationCard({ formation, onStart, onApply, applying }) {
	const sections = Array.isArray(formation.sections) ? formation.sections : []
	const totalVideos = sections.reduce((acc, s) => acc + (Array.isArray(s.videos) ? s.videos.length : 0), 0)
	const totalTests = sections.reduce((acc, s) => acc + (s?.test?.enabled ? 1 : 0), 0)
	const applied = Boolean(formation?.isApplied)
	const imageUrl = resolveAssetUrl(formation.imageUrl)
	const levelColor = LEVEL_BADGE_COLORS[formation.level] || 'from-cyan-500 to-blue-600'

	return (
		<article className='group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(8,51,93,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(8,51,93,0.16)]'>
			<div className='relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#0d355b] via-[#0a5f88] to-[#06b6d4]'>
				{imageUrl ? (
					<img src={imageUrl} alt={formation.title} className='h-full w-full object-cover transition group-hover:scale-105' />
				) : (
					<div className='flex h-full w-full items-center justify-center text-white/40'>
						<svg width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'>
							<rect x='3' y='4' width='18' height='14' rx='2' />
							<path d='M10 9l5 3-5 3z' fill='currentColor' />
						</svg>
					</div>
				)}
				<div className='absolute top-3 left-3 flex flex-wrap gap-2'>
					<span className={`rounded-full bg-gradient-to-r ${levelColor} px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-md`}>
						{LEVEL_LABELS[formation.level] || formation.level || 'Niveau'}
					</span>
					{applied ? (
						<span className='rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-md'>
							Inscrit
						</span>
					) : null}
				</div>
			</div>

			<div className='flex flex-1 flex-col gap-3 p-5'>
				<div>
					<p className='text-[10px] font-black uppercase tracking-[0.14em] text-[#5d7d98]'>{formation.provider || 'ForsaTech'}</p>
					<h3 className='mt-1 line-clamp-2 text-lg font-black text-[#0d355b]'>{formation.title}</h3>
				</div>
				<p className='line-clamp-3 text-sm leading-6 text-[#587a99]'>{formation.description}</p>

				<div className='flex flex-wrap gap-1.5 text-xs'>
					{sections.length > 0 ? <Tag>{sections.length} section(s)</Tag> : null}
					{totalVideos > 0 ? <Tag>{totalVideos} vidéo(s)</Tag> : null}
					{totalTests > 0 ? <Tag>{totalTests} test(s)</Tag> : null}
					{Array.isArray(formation.tags) ? formation.tags.slice(0, 2).map((t) => <Tag key={t}>{t}</Tag>) : null}
				</div>

				<div className='mt-auto flex flex-col gap-2 pt-2'>
					{sections.length > 0 ? (
						<button
							type='button'
							onClick={() => onStart?.(formation)}
							className='w-full rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#1d4ed8] px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110'
						>
							▶ Commencer la formation
						</button>
					) : (
						<button
							type='button'
							onClick={() => onApply?.(formation)}
							disabled={applied || applying}
							className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition ${applied || applying ? 'bg-slate-300' : 'bg-[#001d3e] hover:opacity-95'}`}
						>
							{applying ? 'Envoi...' : applied ? 'Déjà postulé' : 'Postuler'}
						</button>
					)}
				</div>
			</div>
		</article>
	)
}

function CoursePlayer({ formation, candidateId, onClose }) {
	const sections = useMemo(
		() =>
			Array.isArray(formation.sections)
				? [...formation.sections].sort((a, b) => (a.order || 0) - (b.order || 0))
				: [],
		[formation]
	)

	// Flatten all videos to navigate
	const playlist = useMemo(() => {
		const list = []
		sections.forEach((s, sIdx) => {
			const videos = Array.isArray(s.videos) ? [...s.videos].sort((a, b) => (a.order || 0) - (b.order || 0)) : []
			videos.forEach((v, vIdx) => {
				list.push({ sectionIndex: sIdx, videoIndex: vIdx, section: s, video: v })
			})
		})
		return list
	}, [sections])

	const storageKey = `formation-progress-${formation._id}-${candidateId || 'guest'}`
	const [watched, setWatched] = useState(() => {
		try {
			const raw = localStorage.getItem(storageKey)
			return raw ? new Set(JSON.parse(raw)) : new Set()
		} catch {
			return new Set()
		}
	})
	const [activeKey, setActiveKey] = useState(playlist[0] ? `${playlist[0].sectionIndex}-${playlist[0].videoIndex}` : '')
	const [activeTest, setActiveTest] = useState(null)
	const [openSections, setOpenSections] = useState(() => new Set(sections.map((_, i) => i)))

	useEffect(() => {
		try {
			localStorage.setItem(storageKey, JSON.stringify([...watched]))
		} catch {
			/* ignore */
		}
	}, [watched, storageKey])

	const current = playlist.find((p) => `${p.sectionIndex}-${p.videoIndex}` === activeKey) || playlist[0]

	const markWatched = (key) => setWatched((prev) => new Set([...prev, key]))
	const toggleSection = (idx) => {
		setOpenSections((prev) => {
			const next = new Set(prev)
			if (next.has(idx)) next.delete(idx)
			else next.add(idx)
			return next
		})
	}

	const totalCount = playlist.length
	const watchedCount = playlist.filter((p) => watched.has(`${p.sectionIndex}-${p.videoIndex}`)).length
	const overallPct = totalCount ? Math.round((watchedCount / totalCount) * 100) : 0

	const embed = current?.video ? getEmbed(current.video.url) : { type: 'none', src: '' }

	return (
		<div className='fixed inset-x-0 -top-8 bottom-0 z-[70] flex flex-col bg-slate-950 text-white'>
			{/* Top bar */}
			<header className='flex min-h-[84px] shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0a1525] px-5 py-4 md:py-5'>
				<div className='min-w-0'>
					<p className='text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300/80'>ForsaTech</p>
					<h2 className='truncate text-base font-black md:text-lg'>{formation.title}</h2>
				</div>
				<div className='flex items-center gap-3'>
					<div className='hidden items-center gap-2 md:flex'>
						<div className='h-2 w-32 overflow-hidden rounded-full bg-white/10'>
							<div className='h-full bg-gradient-to-r from-cyan-400 to-blue-500' style={{ width: `${overallPct}%` }} />
						</div>
						<span className='text-xs font-semibold text-cyan-200'>
							{watchedCount}/{totalCount} ({overallPct}%)
						</span>
					</div>
					<button
						onClick={onClose}
						className='rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10'
					>
						✕ Fermer
					</button>
				</div>
			</header>

			{/* Body */}
			<div className='flex flex-1 flex-col overflow-hidden md:flex-row'>
				{/* Player */}
				<div className='flex flex-1 flex-col overflow-y-auto bg-black'>
					<div className='aspect-video w-full bg-black'>
						{embed.type === 'file' ? (
							<video
								key={embed.src}
								src={embed.src}
								controls
								autoPlay
								className='h-full w-full bg-black'
								onEnded={() => current && markWatched(`${current.sectionIndex}-${current.videoIndex}`)}
							/>
						) : embed.type === 'iframe' ? (
							<iframe
								key={embed.src}
								src={embed.src}
								title={current?.video?.title || 'Vidéo'}
								className='h-full w-full'
								allowFullScreen
								allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
							/>
						) : (
							<div className='flex h-full w-full items-center justify-center text-white/40'>Aucune vidéo disponible</div>
						)}
					</div>
					<div className='border-t border-white/10 bg-[#0a1525] p-5'>
						<div className='flex flex-wrap items-start justify-between gap-3'>
							<div className='min-w-0 flex-1'>
								<p className='text-xs font-semibold text-cyan-300/80'>
									Section {(current?.sectionIndex ?? 0) + 1} : {current?.section?.title}
								</p>
								<h3 className='mt-1 text-xl font-black text-white'>{current?.video?.title || 'Vidéo'}</h3>
								{current?.section?.description ? (
									<p className='mt-2 text-sm leading-6 text-white/70'>{current.section.description}</p>
								) : null}
							</div>
							{current ? (
								<button
									onClick={() => markWatched(`${current.sectionIndex}-${current.videoIndex}`)}
									className='rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20'
								>
									✓ Marquer comme vu
								</button>
							) : null}
						</div>
					</div>
				</div>

				{/* Sidebar */}
				<aside className='flex h-72 shrink-0 flex-col border-t border-white/10 bg-[#0d1a30] md:h-auto md:w-96 md:border-l md:border-t-0'>
					<div className='flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3'>
						<p className='text-sm font-bold text-white'>Contenu de la formation</p>
						<span className='text-xs text-white/50'>
							{sections.length} section(s)
						</span>
					</div>
					<div className='flex-1 overflow-y-auto'>
						{sections.map((section, sIdx) => {
							const videos = Array.isArray(section.videos)
								? [...section.videos].sort((a, b) => (a.order || 0) - (b.order || 0))
								: []
							const isOpen = openSections.has(sIdx)
							const sectionWatched = videos.filter((_, vIdx) => watched.has(`${sIdx}-${vIdx}`)).length
							const totalDuration = videos.length ? `${videos.length} vidéo(s)` : 'Aucune vidéo'
							const hasTest = section?.test?.enabled && Array.isArray(section.test.questions) && section.test.questions.length > 0
							return (
								<div key={section._id || sIdx} className='border-b border-white/5'>
									<button
										onClick={() => toggleSection(sIdx)}
										className='flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-white/5'
									>
										<div className='min-w-0'>
											<p className='truncate text-sm font-bold text-white'>
												Section {sIdx + 1}: {section.title || 'Sans titre'}
											</p>
											<p className='mt-0.5 text-[11px] text-white/50'>
												{sectionWatched} / {videos.length} • {totalDuration}
											</p>
										</div>
										<span className='text-white/60'>{isOpen ? '▾' : '▸'}</span>
									</button>
									{isOpen ? (
										<div className='bg-black/20'>
											{videos.map((video, vIdx) => {
												const key = `${sIdx}-${vIdx}`
												const isActive = key === activeKey
												const isWatched = watched.has(key)
												
												// Check if this video can be accessed
												// It can be accessed if it's the first video overall, or if all previous videos have been watched
												const canAccess = playlist.findIndex(p => `${p.sectionIndex}-${p.videoIndex}` === key) === 0 || 
													playlist.slice(0, playlist.findIndex(p => `${p.sectionIndex}-${p.videoIndex}` === key)).every(p => watched.has(`${p.sectionIndex}-${p.videoIndex}`))
												
												return (
													<button
														key={vIdx}
														onClick={() => canAccess && setActiveKey(key)}
														disabled={!canAccess}
														className={`flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm transition ${
															!canAccess ? 'opacity-50 cursor-not-allowed' :
															isActive ? 'bg-cyan-500/15 text-white' : 'text-white/75 hover:bg-white/5'
														}`}
													>
														<input
															type='checkbox'
															checked={isWatched}
															onChange={(e) => {
																e.stopPropagation()
																setWatched((prev) => {
																	const next = new Set(prev)
																	if (next.has(key)) next.delete(key)
																	else next.add(key)
																	return next
																})
															}}
															className='h-4 w-4 shrink-0 accent-cyan-500'
														/>
														<svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor' className='shrink-0 text-white/40'>
															<path d='M8 5v14l11-7z' />
														</svg>
														<span className='flex-1 truncate'>
															{vIdx + 1}. {video.title || `Vidéo ${vIdx + 1}`}
														</span>
														{!canAccess ? <span className='text-xs text-white/50'>🔒</span> : null}
													</button>
												)
											})}
											{!videos.length ? (
												<p className='px-5 py-3 text-xs italic text-white/40'>Aucune vidéo dans cette section.</p>
											) : null}
											{hasTest ? (
												<button
													onClick={() => setActiveTest({ section, formationId: formation._id })}
													disabled={!candidateId || sectionWatched < videos.length}
													className='m-3 flex w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
													title={sectionWatched < videos.length ? `Regardez les ${videos.length - sectionWatched} vidéo(s) restante(s) pour accéder au test` : ''}
												>
													📝 Passer le test ({section.test.questions.length} questions • ≥ {section.test.passingScore || 50}%)
												</button>
											) : null}
										</div>
									) : null}
								</div>
							)
						})}
					</div>
				</aside>
			</div>

			{activeTest ? (
				<TestModal
					section={activeTest.section}
					formationId={activeTest.formationId}
					candidateId={candidateId}
					onClose={() => setActiveTest(null)}
				/>
			) : null}
		</div>
	)
}

function TestModal({ section, formationId, candidateId, onClose }) {
	const questions = section.test?.questions || []
	const [answers, setAnswers] = useState({})
	const [submitting, setSubmitting] = useState(false)
	const [result, setResult] = useState(null)
	const [error, setError] = useState('')
	const [startedAt] = useState(() => Date.now())

	const handleSelect = (qIdx, oIdx) => setAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))

	const handleSubmit = async () => {
		setSubmitting(true)
		setError('')
		try {
			const payload = {
				candidateId,
				timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000),
				answers: questions.map((_, idx) => ({ questionIndex: idx, selectedIndex: answers[idx] ?? -1 })),
			}
			const resp = await fetch(`${API_BASE}/formations/${formationId}/sections/${section._id}/test/submit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const data = await resp.json()
			if (!resp.ok || !data.success) throw new Error(data.message || 'Erreur lors de la soumission.')
			setResult(data.result)
		} catch (e) {
			setError(e.message || 'Erreur réseau.')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className='fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4'>
			<div className='w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-100 bg-white text-slate-800 shadow-2xl'>
				<div className='flex items-center justify-between border-b border-cyan-100 bg-gradient-to-r from-[#f7fcff] to-[#ecf7ff] px-5 py-4'>
					<h3 className='text-base font-black text-[#0d355b]'>Test : {section.title || 'Section'}</h3>
					<button onClick={onClose} className='rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50'>
						Fermer
					</button>
				</div>
				<div className='max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4'>
					{result ? (
						<div className={`rounded-2xl border p-5 text-center ${result.passed ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
							<p className={`text-3xl font-black ${result.passed ? 'text-emerald-700' : 'text-rose-700'}`}>{result.score}%</p>
							<p className={`mt-1 text-sm font-bold ${result.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
								{result.passed ? 'Test réussi !' : 'Test non réussi'}
							</p>
							<p className='mt-2 text-sm text-slate-600'>
								{result.correctCount} / {result.totalQuestions} bonnes réponses • Score min : {result.passingScore}%
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
	const [playerFormation, setPlayerFormation] = useState(null)

	return (
		<div className='mt-8 space-y-5'>
			<div className='overflow-hidden rounded-3xl border border-[#b8d7ee] bg-gradient-to-br from-[#f7fbff] via-[#eef7ff] to-[#e4f0fb] shadow-[0_12px_28px_rgba(8,51,93,0.1)]'>
				<div className='flex flex-wrap items-center justify-between gap-3 border-b border-[#0d355b]/10 bg-white/70 px-5 py-4 backdrop-blur'>
					<div>
						<p className='text-xs font-black tracking-[0.14em] text-[#5c7fa1] uppercase'>Espace formation</p>
						<h2 className='mt-1 text-2xl font-black text-[#0d355b]'>Formations Disponibles</h2>
						<p className='mt-1 text-sm text-[#547896]'>Explorez nos formations et développez vos compétences.</p>
					</div>
					<Badge variant='cyan'>{formations.length} formation(s)</Badge>
				</div>

				<div className='p-5'>
					{error ? (
						<div className='mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{error}</div>
					) : null}
					{successMessage ? (
						<div className='mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800'>{successMessage}</div>
					) : null}
					{loading ? (
						<div className='rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600'>Chargement des formations...</div>
					) : formations.length ? (
						<div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
							{formations.map((formation) => (
								<FormationCard
									key={formation._id}
									formation={formation}
									onStart={(f) => {
										setPlayerFormation(f)
										if (!f.isApplied && candidateId) onApply?.(f)
									}}
									onApply={onApply}
									applying={applyingId && String(applyingId) === String(formation._id)}
								/>
							))}
						</div>
					) : (
						<div className='rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600'>
							Aucune formation publiée pour le moment.
						</div>
					)}
				</div>
			</div>

			{playerFormation ? (
				<CoursePlayer
					formation={playerFormation}
					candidateId={candidateId}
					onClose={() => setPlayerFormation(null)}
				/>
			) : null}
		</div>
	)
}
