/* eslint-disable react/prop-types */
import React from 'react'
import { Badge } from './ui'

export function DashboardCandNotificationsView({
	candidate,
	fetchNotifications,
	notificationsError,
	notificationsLoading,
	notifications,
	markNotificationAsRead,
	handleJoinInterviewMeet,
}) {
	return (
		<div className='mt-8 rounded-2xl border border-[#9fc3e1] bg-gradient-to-br from-[#f7fbff] via-[#edf6ff] to-[#deedfb] p-5 ring-1 ring-[#bdd8ef] shadow-[0_14px_34px_rgba(8,51,93,0.13)]'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div>
					<p className='text-lg font-bold text-[#0d355b]'>Notifications</p>
					<p className='mt-1 text-sm text-[#4f7191]'>Quand un recruteur planifie un rendez-vous, vous le verrez ici.</p>
				</div>
				<button
					type='button'
					onClick={() => {
						const candidateId = candidate?.id || candidate?._id
						fetchNotifications(candidateId)
					}}
					className='rounded-xl border border-[#0a7aa2] px-4 py-2 text-sm font-semibold text-[#0a5f88] transition hover:bg-[#ebfaff]'
				>
					Rafraîchir
				</button>
			</div>

			{notificationsError ? (
				<div className='mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{notificationsError}</div>
			) : null}

			{notificationsLoading ? <p className='mt-4 text-sm text-[#4f7191]'>Chargement...</p> : null}

			{!notificationsLoading && notifications.length === 0 ? (
				<div className='mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700'>Aucune notification.</div>
			) : null}

			{!notificationsLoading && notifications.length > 0 ? (
				<div className='mt-5 space-y-3'>
					{notifications.map((n) => {
						const createdAt = n?.createdAt ? new Date(n.createdAt) : null
						const meetingAtRaw = n?.interviewId?.scheduledAt || n?.meetingAt
						const meetingAt = meetingAtRaw ? new Date(meetingAtRaw) : null
						const mode = n?.interviewId?.mode || n?.mode || ''
						const meetingLink = n?.interviewId?.meetingLink || n?.meetingLink || ''
						const interviewId = n?.interviewId?._id || n?.interviewId?.id || ''
						const location = n?.interviewId?.location || n?.location || ''
						const notes = n?.interviewId?.notes || ''
						const isUnread = !n?.readAt
						return (
							<div key={n._id} className={`rounded-2xl border p-4 ${isUnread ? 'border-cyan-200 bg-white' : 'border-slate-200 bg-slate-50'}`}>
								<div className='flex flex-wrap items-start justify-between gap-3'>
									<div>
										<div className='flex items-center gap-2'>
											<p className='text-sm font-black text-[#103b62]'>{n.title || 'Notification'}</p>
											{isUnread ? <Badge variant='cyan'>Nouveau</Badge> : <Badge variant='slate'>Lu</Badge>}
										</div>
										<p className='mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700'>{n.message || '—'}</p>
										<div className='mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500'>
											<span>{createdAt ? createdAt.toLocaleString() : '—'}</span>
											{meetingAt ? <span>Date: {meetingAt.toLocaleString()}</span> : null}
											{mode ? <span>Nature: {mode === 'Présentiel' ? 'Présentiel' : 'En ligne'}</span> : null}
										</div>
										{mode === 'Présentiel' && location ? (
											<div className='mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700'>
												Lieu: {location}
											</div>
										) : null}
										{mode !== 'Présentiel' && meetingLink ? (
											<button
												type='button'
												onClick={() => handleJoinInterviewMeet?.(meetingLink, interviewId)}
												className='mt-3 inline-block text-xs font-bold text-cyan-700 hover:underline'
											>
												Rejoindre l'entretien dans ForsaTech Meet
											</button>
										) : null}
										{notes ? (
											<div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700'>
												Description: {notes}
											</div>
										) : null}
									</div>
									{isUnread ? (
										<button
											type='button'
											onClick={() => markNotificationAsRead(n._id)}
											className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'
										>
											Marquer comme lue
										</button>
									) : null}
								</div>
							</div>
						)
					})}
				</div>
			) : null}
		</div>
	)
}
