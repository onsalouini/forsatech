/* eslint-disable react/prop-types */
import React, { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function DashboardCandCandidaturesView({ candidacies, onCandidacyDeleted }) {
	const [deletingId, setDeletingId] = useState(null)
	const [deleteError, setDeleteError] = useState('')

	const handleDelete = async (candidacyId) => {
		if (!window.confirm('Retirer cette candidature ? Cette action est irréversible.')) return
		setDeletingId(candidacyId)
		setDeleteError('')
		try {
			const res = await fetch(`${API_BASE}/candidacies/${candidacyId}`, { method: 'DELETE' })
			const data = await res.json().catch(() => ({}))
			if (res.ok && data.success) {
				if (typeof onCandidacyDeleted === 'function') onCandidacyDeleted(candidacyId)
			} else {
				setDeleteError(data.message || 'Erreur lors de la suppression.')
			}
		} catch {
			setDeleteError('Erreur réseau.')
		} finally {
			setDeletingId(null)
		}
	}

	return (
		<div className='mt-8 rounded-2xl border border-[#9fc3e1] bg-gradient-to-br from-[#f7fbff] via-[#edf6ff] to-[#deedfb] p-5 ring-1 ring-[#bdd8ef] shadow-[0_14px_34px_rgba(8,51,93,0.13)]'>
			<div className='rounded-2xl border border-[#0f2f57] bg-[#0b2b4f] px-4 py-3 shadow-[0_10px_24px_rgba(7,38,73,0.35)]'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<p className='text-xl font-black text-white'>Mes candidatures</p>
					<span className='rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-black tracking-[0.08em] text-cyan-100'>
						{candidacies.length} offre(s)
					</span>
				</div>
				<p className='mt-1 text-sm font-semibold text-cyan-100/90'>Suivi centralisé de vos candidatures et statuts.</p>
			</div>

			{deleteError ? (
				<div className='mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'>{deleteError}</div>
			) : null}

			{candidacies.length === 0 ? (
				<div className='mt-4 rounded-2xl border border-slate-200 bg-white p-5'>
					<p className='text-sm font-semibold text-slate-700'>Aucune candidature pour le moment.</p>
					<p className='mt-1 text-xs text-slate-500'>Postulez à une offre pour la voir ici.</p>
				</div>
			) : (
				<div className='mt-4 grid gap-4 lg:grid-cols-2'>
					{candidacies.map((c) => {
						const offer = c.jobOfferId
						const createdAt = c.createdAt ? new Date(c.createdAt) : null
						const rawStatus = String(c.status || 'En attente').toLowerCase()
						const statusClass = rawStatus.includes('applied') || rawStatus.includes('postul')
							? 'border-cyan-200 bg-cyan-50 text-cyan-800'
							: rawStatus.includes('interview') || rawStatus.includes('entretien')
								? 'border-emerald-200 bg-emerald-50 text-emerald-800'
								: rawStatus.includes('reject') || rawStatus.includes('refus')
									? 'border-rose-200 bg-rose-50 text-rose-800'
									: 'border-slate-200 bg-slate-50 text-slate-700'

						return (
							<div key={c._id} className='overflow-hidden rounded-2xl border border-[#b6cfe6] bg-white shadow-[0_8px_20px_rgba(8,51,93,0.08)]'>
								<div className='h-1.5 bg-gradient-to-r from-[#0b2f57] via-[#0a5f88] to-[#06d5e0]' />
								<div className='p-4'>
									<div className='flex items-start justify-between gap-3'>
										<p className='text-2xl font-bold leading-tight text-[#0d355b]'>{offer?.title || 'Offre'}</p>
										<span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass}`}>{c.status || 'En attente'}</span>
									</div>
									<p className='mt-2 text-sm font-semibold text-[#4f7191]'>
										{offer?.location ? `${offer.location} · ` : ''}{offer?.contractType || '—'}
									</p>
									<div className='mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700'>
										Postulé le: <span className='font-bold text-[#0d355b]'>{createdAt ? createdAt.toLocaleDateString() : '—'}</span>
									</div>
									{Number.isFinite(c?.quizScore) ? (
										<p className='mt-2 text-sm text-slate-600'>Score quiz: {c.quizScore}%</p>
									) : null}
									<div className='mt-3 flex justify-end'>
										<button
											type='button'
											onClick={() => handleDelete(c._id)}
											disabled={deletingId === c._id}
											className='rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50'
										>
											{deletingId === c._id ? 'Suppression...' : 'Retirer la candidature'}
										</button>
									</div>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
