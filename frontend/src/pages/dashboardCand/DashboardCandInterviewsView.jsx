/* eslint-disable react/prop-types */
import React from 'react'

const STATUS_STYLE = {
	planifie: 'border-cyan-200 bg-cyan-50 text-cyan-800',
	confirme: 'border-emerald-200 bg-emerald-50 text-emerald-800',
	annule:   'border-rose-200 bg-rose-50 text-rose-800',
	termine:  'border-slate-200 bg-slate-100 text-slate-600',
}

function getStatusStyle(status) {
	const key = String(status || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
	if (key.includes('confirm')) return STATUS_STYLE.confirme
	if (key.includes('annul'))   return STATUS_STYLE.annule
	if (key.includes('termin'))  return STATUS_STYLE.termine
	return STATUS_STYLE.planifie
}

function formatScheduledAt(dateStr) {
	if (!dateStr) return '—'
	const d = new Date(dateStr)
	if (Number.isNaN(d.getTime())) return '—'
	const datePart = d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
	const timePart = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
	return `${datePart.charAt(0).toUpperCase()}${datePart.slice(1)} à ${timePart}`
}

function isPast(dateStr) {
	if (!dateStr) return false
	return new Date(dateStr) < new Date()
}

export function DashboardCandInterviewsView({ interviews, loading, error, onRefresh, handleJoinInterviewMeet }) {
	const now = new Date()
	const upcoming = (interviews || []).filter((iv) => !isPast(iv?.scheduledAt))
	const past = (interviews || []).filter((iv) => isPast(iv?.scheduledAt))

	return (
		<div className='mt-8 rounded-2xl border border-[#9fc3e1] bg-gradient-to-br from-[#f7fbff] via-[#edf6ff] to-[#deedfb] p-5 ring-1 ring-[#bdd8ef] shadow-[0_14px_34px_rgba(8,51,93,0.13)]'>
			{/* Header */}
			<div className='rounded-2xl border border-[#0f2f57] bg-[#0b2b4f] px-4 py-3 shadow-[0_10px_24px_rgba(7,38,73,0.35)]'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<p className='text-xl font-black text-white'>Mes entretiens</p>
					<div className='flex items-center gap-2'>
						<span className='rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-black tracking-[0.08em] text-cyan-100'>
							{(interviews || []).length} entretien(s)
						</span>
						<button
							type='button'
							onClick={onRefresh}
							disabled={loading}
							className='rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-50'
						>
							{loading ? 'Chargement…' : 'Actualiser'}
						</button>
					</div>
				</div>
				<p className='mt-1 text-sm font-semibold text-cyan-100/90'>Consultez vos entretiens planifiés et passés.</p>
			</div>

			{/* Error */}
			{error ? (
				<div className='mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4'>
					<p className='text-sm font-bold text-rose-700'>{error}</p>
					<button
						type='button'
						onClick={onRefresh}
						className='mt-2 rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50'
					>
						Réessayer
					</button>
				</div>
			) : null}

			{/* Loading skeleton */}
			{loading && !error ? (
				<div className='mt-4 space-y-3'>
					{[1, 2, 3].map((i) => (
						<div key={i} className='h-28 animate-pulse rounded-2xl border border-slate-200 bg-white' />
					))}
				</div>
			) : null}

			{/* Empty state */}
			{!loading && !error && (interviews || []).length === 0 ? (
				<div className='mt-4 rounded-2xl border border-slate-200 bg-white p-5'>
					<p className='text-sm font-semibold text-slate-700'>Aucun entretien planifié pour le moment.</p>
					<p className='mt-1 text-xs text-slate-500'>Un recruteur vous contactera pour fixer un entretien après votre candidature.</p>
				</div>
			) : null}

			{/* Upcoming interviews */}
			{!loading && !error && upcoming.length > 0 ? (
				<div className='mt-4'>
					<p className='mb-3 text-xs font-black tracking-[0.12em] text-[#0d355b]'>À VENIR ({upcoming.length})</p>
					<div className='grid gap-4 lg:grid-cols-2'>
						{upcoming.map((iv) => (
							<InterviewCard key={iv._id} iv={iv} handleJoinInterviewMeet={handleJoinInterviewMeet} highlight />
						))}
					</div>
				</div>
			) : null}

			{/* Past interviews */}
			{!loading && !error && past.length > 0 ? (
				<div className='mt-6'>
					<p className='mb-3 text-xs font-black tracking-[0.12em] text-[#4f7191]'>PASSÉS ({past.length})</p>
					<div className='grid gap-4 lg:grid-cols-2'>
						{past.map((iv) => (
							<InterviewCard key={iv._id} iv={iv} handleJoinInterviewMeet={handleJoinInterviewMeet} highlight={false} />
						))}
					</div>
				</div>
			) : null}
		</div>
	)
}

function InterviewCard({ iv, handleJoinInterviewMeet, highlight }) {
	const recruiter = iv?.recruiterId
	const recruiterName = recruiter
		? [recruiter.firstName, recruiter.lastName].filter(Boolean).join(' ') || recruiter.email || '—'
		: iv?.candidateName || '—'
	const recruiterCompany = recruiter?.company || ''

	const offer = iv?.jobOfferId
	const offerTitle     = offer?.title || '—'
	const offerContract  = offer?.contractType || ''
	const offerLocation  = offer?.location || ''

	const mode        = iv?.mode || 'Visio'
	const meetingLink = iv?.meetingLink || ''
	const location    = iv?.location || ''
	const notes       = iv?.notes || ''
	const status      = iv?.status || 'Planifie'

	const interviewId = String(iv?._id || '')
	const canJoin     = mode === 'Visio' && meetingLink && highlight

	return (
		<div className={`overflow-hidden rounded-2xl border shadow-[0_8px_20px_rgba(8,51,93,0.08)] ${highlight ? 'border-[#b6cfe6] bg-white' : 'border-slate-200 bg-slate-50/70'}`}>
			{/* Top accent bar */}
			<div className={`h-1.5 ${highlight ? 'bg-gradient-to-r from-[#0b2f57] via-[#0a5f88] to-[#06d5e0]' : 'bg-gradient-to-r from-slate-300 to-slate-400'}`} />
			<div className='p-4'>
				{/* Offer + status */}
				<div className='flex items-start justify-between gap-3'>
					<p className={`text-base font-black leading-tight ${highlight ? 'text-[#0d355b]' : 'text-slate-500'}`}>{offerTitle}</p>
					<span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusStyle(status)}`}>{status}</span>
				</div>
				{(offerContract || offerLocation) ? (
					<p className='mt-1 text-xs font-semibold text-[#4f7191]'>
						{[offerLocation, offerContract].filter(Boolean).join(' · ')}
					</p>
				) : null}

				{/* Date */}
				<div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${highlight ? 'border border-cyan-100 bg-cyan-50/80 text-[#0a5f88]' : 'border border-slate-200 bg-white text-slate-600'}`}>
					<span>📅</span>
					<span>{formatScheduledAt(iv?.scheduledAt)}</span>
				</div>

				{/* Mode */}
				<div className='mt-2 flex flex-wrap gap-2'>
					<span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${mode === 'Visio' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
						{mode === 'Visio' ? '📹 Visioconférence' : '🏢 Présentiel'}
					</span>
					{mode === 'Présentiel' && location ? (
						<span className='inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600'>
							📍 {location}
						</span>
					) : null}
				</div>

				{/* Recruiter */}
				<div className='mt-3 flex items-center gap-2 text-sm text-slate-600'>
					<span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0b2b4f] text-xs font-black text-white'>
						{recruiterName.charAt(0).toUpperCase()}
					</span>
					<div className='min-w-0'>
						<p className='truncate text-xs font-bold text-[#0d355b]'>{recruiterName}</p>
						{recruiterCompany ? <p className='truncate text-[11px] text-slate-500'>{recruiterCompany}</p> : null}
					</div>
				</div>

				{/* Notes */}
				{notes ? (
					<p className='mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600'>
						{notes}
					</p>
				) : null}

				{/* Join button (Visio only, upcoming only) */}
				{canJoin ? (
					<button
						type='button'
						onClick={() => handleJoinInterviewMeet?.(meetingLink, interviewId)}
						className='mt-4 w-full rounded-xl bg-gradient-to-r from-[#0a5f88] to-[#06d5e0] py-2.5 text-sm font-black text-white shadow-md transition hover:opacity-90'
					>
						Rejoindre l'entretien — AIR Meet
					</button>
				) : null}
			</div>
		</div>
	)
}
