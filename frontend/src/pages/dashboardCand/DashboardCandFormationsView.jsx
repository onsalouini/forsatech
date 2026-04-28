/* eslint-disable react/prop-types */
import React from 'react'
import { Badge, Tag } from './ui'

const LEVEL_LABELS = {
	beginner: 'Débutant',
	intermediate: 'Intermédiaire',
	advanced: 'Avancé',
}

export function DashboardCandFormationsView({
	formations = [],
	loading = false,
	error = '',
	applyingId = '',
	onApply,
	successMessage = '',
}) {
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
		</div>
	)
}