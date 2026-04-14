/* eslint-disable react/prop-types */
import React from 'react'
import { LineAreaChart, DonutChart, BarChart } from './charts'

export function DashboardCandAnalyticsView({
	dashboardLoading,
	dashboardError,
	dashboardStats,
	pipelineStats,
	dashboardSeries,
	dashboardLoginHours,
	interviewCalendarData,
	setInterviewCalendarMonth,
}) {
	return (
		<div className='mt-8 rounded-3xl border border-[#d7e9f8] bg-[#fbfdff] p-5 shadow-[0_15px_40px_rgba(8,51,93,0.08)]'>
			<div className='flex flex-wrap items-center gap-3'>
				<div>
					<p className='text-lg font-bold text-[#0d355b]'>Dashboard</p>
					<p className='mt-1 text-sm text-[#4f7191]'>Statistiques basées sur votre activité (données MongoDB).</p>
				</div>
				<span className='ml-auto rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-black text-[#0a5f88]'>Vue analytique</span>
			</div>

			{dashboardLoading ? <p className='mt-4 text-sm text-[#4f7191]'>Chargement…</p> : null}
			{!dashboardLoading && dashboardError ? (
				<div className='mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{dashboardError}</div>
			) : null}

			{!dashboardLoading && !dashboardError && dashboardStats ? (
				<div className='mt-5 space-y-4'>
					<div className='grid gap-4 lg:grid-cols-2'>
						<div className='rounded-2xl border border-[#d7e9f8] bg-gradient-to-br from-[#f0fbff] to-[#dff7ff] p-4'>
							<div className='flex items-center justify-between gap-2'>
								<p className='text-[11px] font-black tracking-[0.12em] text-[#0d355b]'>ACTIVITÉ (30J)</p>
								<span className='rounded-full border border-cyan-200 bg-white px-2 py-1 text-[10px] font-black text-cyan-700'>En ligne</span>
							</div>

							<div className='mt-4 space-y-3'>
								<div>
									<div className='flex items-center justify-between text-xs font-semibold text-slate-600'>
										<span>TEMPS CONNECTÉ</span>
										<span className='text-[#0d355b]'>{pipelineStats.connectedHours} h</span>
									</div>
									<div className='mt-1 h-2 rounded-full bg-cyan-100'>
										<div className='h-full rounded-full bg-[#0a5f88]' style={{ width: `${pipelineStats.activityHoursProgress}%` }} />
									</div>
								</div>
								<div>
									<div className='flex items-center justify-between text-xs font-semibold text-slate-600'>
										<span>NOMBRE DE CONNEXIONS</span>
										<span className='text-[#0d355b]'>{pipelineStats.sessionsCount}</span>
									</div>
									<div className='mt-1 h-2 rounded-full bg-cyan-100'>
										<div className='h-full rounded-full bg-[#06d5e0]' style={{ width: `${pipelineStats.activitySessionsProgress}%` }} />
									</div>
								</div>
								<div className='rounded-xl border border-cyan-100 bg-white px-3 py-3'>
									<div className='mb-2 flex items-center justify-between'>
										<p className='text-[11px] font-black tracking-[0.12em] text-slate-500'>HEURES FRÉQUENTES</p>
										<span className='text-[11px] font-semibold text-[#0a5f88]'>{pipelineStats.topHourLabel}</span>
									</div>
									{pipelineStats.topHoursPipeline.length === 0 ? (
										<p className='text-xs font-semibold text-slate-500'>Aucune donnée de connexion.</p>
									) : (
										<div className='space-y-2'>
											{pipelineStats.topHoursPipeline.map((h) => (
												<div key={h.label}>
													<div className='flex items-center justify-between text-[11px] font-semibold text-slate-600'>
														<span>{h.label}</span>
														<span className='text-[#0d355b]'>{h.count}</span>
													</div>
													<div className='mt-1 h-2 rounded-full bg-cyan-100'>
														<div className='h-full rounded-full bg-gradient-to-r from-[#06d5e0] to-[#0a5f88]' style={{ width: `${h.progress}%` }} />
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						</div>

						<div className='rounded-2xl border border-[#d7e9f8] bg-gradient-to-br from-[#edf4ff] to-[#dfeeff] p-4'>
							<div className='flex items-center justify-between gap-2'>
								<p className='text-[11px] font-black tracking-[0.12em] text-[#0d355b]'>PIPELINE CANDIDATURE</p>
								<span className='rounded-full border border-blue-200 bg-white px-2 py-1 text-[10px] font-black text-[#0a5f88]'>Taux entretien {pipelineStats.interviewRate}%</span>
							</div>

							<div className='mt-4 space-y-3'>
								<div>
									<div className='flex items-center justify-between text-xs font-semibold text-slate-600'>
										<span>OFFRES POSTULÉES</span>
										<span className='text-[#0d355b]'>{pipelineStats.appliedCount}</span>
									</div>
									<div className='mt-1 h-2 rounded-full bg-blue-100'>
										<div className='h-full rounded-full bg-[#0f2742]' style={{ width: `${pipelineStats.appliedProgress}%` }} />
									</div>
								</div>
								<div>
									<div className='flex items-center justify-between text-xs font-semibold text-slate-600'>
										<span>ENTRETIENS</span>
										<span className='text-[#0d355b]'>{pipelineStats.interviewsCount}</span>
									</div>
									<div className='mt-1 h-2 rounded-full bg-blue-100'>
										<div className='h-full rounded-full bg-[#06d5e0]' style={{ width: `${pipelineStats.interviewsProgress}%` }} />
									</div>
								</div>
								<div>
									<div className='flex items-center justify-between text-xs font-semibold text-slate-600'>
										<span>POSTULÉ + ENTRETIEN</span>
										<span className='text-[#0d355b]'>{pipelineStats.appliedWithInterviewCount}</span>
									</div>
									<div className='mt-1 h-2 rounded-full bg-blue-100'>
										<div className='h-full rounded-full bg-[#0a5f88]' style={{ width: `${pipelineStats.conversionProgress}%` }} />
									</div>
								</div>
							</div>
							<p className='mt-3 text-xs font-semibold text-slate-500'>Conversion finale: {pipelineStats.conversionRate}%</p>
						</div>
					</div>

					<div className='grid gap-4 lg:grid-cols-3'>
						<div className='rounded-2xl border border-[#d7e9f8] bg-white p-4 lg:col-span-2'>
							<div className='flex flex-wrap items-end justify-between gap-2'>
								<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>COURBE: HEURES CONNECTÉES / JOUR</p>
								<p className='text-xs font-semibold text-slate-500'>30 derniers jours</p>
							</div>
							<div className='mt-3'>
								<LineAreaChart data={dashboardSeries} />
							</div>
						</div>
						<div className='rounded-2xl border border-[#d7e9f8] bg-white p-4'>
							<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>RÉPARTITION</p>
							<div className='mt-3 flex items-center justify-center'>
								<DonutChart
									segments={[
										{ label: 'Candidatures', value: dashboardStats?.offers?.appliedCount ?? 0, color: '#001d3e' },
										{ label: 'Entretiens', value: dashboardStats?.offers?.interviewsCount ?? 0, color: '#06d5e0' },
										{ label: 'Postulé+Entretien', value: dashboardStats?.offers?.appliedWithInterviewCount ?? 0, color: '#0a5f88' },
									]}
								/>
							</div>
							<div className='mt-3 space-y-1 text-xs font-semibold text-slate-600'>
								<div className='flex items-center justify-between gap-2'>
									<span className='inline-flex items-center gap-2'>
										<span className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: '#001d3e' }} />
										Candidatures
									</span>
									<span>{dashboardStats?.offers?.appliedCount ?? 0}</span>
								</div>
								<div className='flex items-center justify-between gap-2'>
									<span className='inline-flex items-center gap-2'>
										<span className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: '#06d5e0' }} />
										Entretiens
									</span>
									<span>{dashboardStats?.offers?.interviewsCount ?? 0}</span>
								</div>
								<div className='flex items-center justify-between gap-2'>
									<span className='inline-flex items-center gap-2'>
										<span className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: '#0a5f88' }} />
										Postulé + entretien
									</span>
									<span>{dashboardStats?.offers?.appliedWithInterviewCount ?? 0}</span>
								</div>
							</div>
						</div>
					</div>

					<div className='rounded-2xl border border-[#d7e9f8] bg-white p-4'>
						<div className='flex flex-wrap items-end justify-between gap-2'>
							<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>HISTOGRAMME: HEURES DE CONNEXION</p>
							<p className='text-xs font-semibold text-slate-500'>Nombre de connexions par heure</p>
						</div>
						<div className='mt-3'>
							<BarChart values={dashboardLoginHours.values} labels={dashboardLoginHours.labels} />
						</div>
					</div>

					<div className='grid gap-4 lg:grid-cols-2'>
						<div className='rounded-2xl border border-[#d7e9f8] bg-white p-4'>
							<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>DERNIÈRES CANDIDATURES</p>
							{(dashboardStats?.offers?.recentApplied || []).length === 0 ? (
								<p className='mt-3 text-sm text-slate-600'>Aucune candidature.</p>
							) : (
								<div className='mt-3 space-y-2'>
									{dashboardStats.offers.recentApplied.map((a) => (
										<div key={a.candidacyId} className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2'>
											<p className='text-sm font-semibold text-slate-800'>{a.title}</p>
											<p className='text-xs font-semibold text-slate-500'>{a.location || '—'}</p>
										</div>
									))}
								</div>
							)}
						</div>
						<div className='rounded-2xl border border-[#d7e9f8] bg-white p-4'>
							<p className='text-xs font-black tracking-[0.12em] text-[#0d355b]'>PROCHAINS ENTRETIENS</p>
							<div className='mt-3 rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50/70 to-white p-3'>
								<div className='mb-3 flex items-center justify-between'>
									<button
										type='button'
										onClick={() => setInterviewCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
										className='rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50'
									>
										←
									</button>
									<p className='text-sm font-bold capitalize text-[#0d355b]'>{interviewCalendarData.monthLabel}</p>
									<button
										type='button'
										onClick={() => setInterviewCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
										className='rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50'
									>
										→
									</button>
								</div>

								<div className='grid grid-cols-7 gap-1'>
									{interviewCalendarData.weekDays.map((d) => (
										<div key={d} className='pb-1 text-center text-[10px] font-black tracking-[0.08em] text-slate-500'>
											{d}
										</div>
									))}

									{interviewCalendarData.cells.map((cell) => {
										if (cell?.empty) return <div key={cell.key} className='h-9 rounded-md bg-transparent' />
										const hasEvents = cell.events.length > 0
										return (
											<div key={cell.key} className='group relative'>
												<div
													title={hasEvents ? cell.title : ''}
													className={`relative flex h-9 items-center justify-center rounded-md text-xs font-semibold ${hasEvents ? 'cursor-pointer border border-cyan-300 bg-cyan-100 text-[#0d355b]' : 'border border-slate-100 bg-white text-slate-500'}`}
												>
													{cell.day}
													{hasEvents ? <span className='absolute bottom-1 h-1.5 w-1.5 rounded-full bg-cyan-700' /> : null}
												</div>
												{hasEvents ? (
													<div className='pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-[#0f2742] px-2 py-1.5 text-[10px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100'>
														{cell.events.map((event, idx) => (
															<div key={`${cell.key}-event-${idx}`} className='leading-4'>
																{event.offerTitle}
															</div>
														))}
													</div>
												) : null}
											</div>
										)
									})}
								</div>
							</div>
							{(dashboardStats?.offers?.upcomingInterviews || []).length === 0 ? (
								<p className='mt-3 text-sm text-slate-600'>Aucun entretien à venir.</p>
							) : null}
						</div>
					</div>
				</div>
			) : null}
		</div>
	)
}
