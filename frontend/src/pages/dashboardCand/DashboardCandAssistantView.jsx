/* eslint-disable react/prop-types */
import React from 'react'

export function DashboardCandAssistantView({
	setAssistantChatId,
	setAssistantMessages,
	setAssistantError,
	setAssistantFile,
	assistantError,
	assistantMessages,
	candidateName,
	candidate,
	candidateInitials,
	assistantInput,
	setAssistantInput,
	assistantLoading,
	assistantFile,
	handleAssistantSend,
}) {
	return (
		<div className='mt-8 rounded-2xl border border-[#9fc3e1] bg-gradient-to-br from-[#f7fbff] via-[#edf6ff] to-[#deedfb] p-5 ring-1 ring-[#bdd8ef] shadow-[0_14px_34px_rgba(8,51,93,0.13)]'>
			<div className='flex items-start justify-between gap-3 flex-wrap'>
				<div>
					<p className='text-lg font-bold text-[#0d355b]'>Assistant IA</p>
					<p className='mt-1 text-sm text-[#4f7191]'>Discussion simple entre toi et l’IA. Tu peux joindre ton CV (PDF/HTML).</p>
				</div>
				<button
					type='button'
					onClick={() => {
						setAssistantChatId(null)
						setAssistantMessages([
							{ role: 'assistant', content: "Bonjour, je suis l’Assistant IA d’ForsaTech. Pose-moi tes questions sur ton CV, ta candidature, ou la préparation d’entretien." },
						])
						setAssistantError('')
						setAssistantFile(null)
					}}
					className='rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200'
				>
					Réinitialiser
				</button>
			</div>

			{assistantError ? (
				<div className='mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800'>{assistantError}</div>
			) : null}

			<div className='mt-5 rounded-2xl border border-[#c9e6ff] bg-gradient-to-br from-[#f7fcff] via-[#eef8ff] to-[#f4fbff] p-4'>
				<p className='text-xs font-black tracking-[0.12em] text-[#0b2f57]'>CONVERSATION</p>
				<div className='mt-3 max-h-[62vh] space-y-3 overflow-y-auto pr-1'>
					{assistantMessages.map((m, idx) => (
						<div key={`assistant-msg-${idx}`} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
							{m.role === 'assistant' ? (
								<div className='mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0b2f57] to-[#134a84] text-[11px] font-black text-white shadow-sm'>AI</div>
							) : null}
							<div className={`max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm ${m.role === 'user' ? 'border-[#8ee8ff] bg-gradient-to-br from-[#ddf7ff] to-[#f2fdff]' : 'border-[#d6e6f5] bg-gradient-to-br from-white to-[#f7fbff]'}`}>
								<p className='text-[11px] font-black tracking-[0.1em] text-[#5b7590]'>{m.role === 'user' ? candidateName : 'ASSISTANT IA'}</p>
								<p className='mt-1 whitespace-pre-wrap text-sm leading-7 text-[#173c62]'>{m.content}</p>
							</div>
							{m.role === 'user' ? (
								<div className='mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#00bfe7] to-[#1b6fe0] shadow-sm'>
									{candidate?.profileImage ? (
										<img src={candidate.profileImage} alt='Compte' className='h-full w-full object-cover' />
									) : (
										<div className='flex h-full w-full items-center justify-center text-[11px] font-bold text-white'>{candidateInitials}</div>
									)}
								</div>
							) : null}
						</div>
					))}
				</div>

				<div className='mt-4 flex flex-col gap-3 rounded-2xl border border-[#d6e6f5] bg-white/85 p-3 md:flex-row md:items-end'>
					<div className='flex-1'>
						<textarea
							rows={3}
							value={assistantInput}
							onChange={(e) => setAssistantInput(e.target.value)}
							placeholder='Écris ton message à l’assistant…'
							className='w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-300'
						/>
					</div>
					<div className='flex flex-col items-start gap-2'>
						<input id='assistant-cv-input' type='file' accept='application/pdf,text/html' onChange={(e) => setAssistantFile(e.target.files?.[0] || null)} className='hidden' />
						<label htmlFor='assistant-cv-input' className='inline-flex cursor-pointer items-center rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-[#0a5f88] transition hover:bg-cyan-100'>
							Choisir un fichier
						</label>
						{!assistantFile ? <div className='text-[11px] font-semibold text-slate-500'>Aucun fichier choisi</div> : null}
						{assistantFile ? <div className='text-xs font-semibold text-slate-600'>Fichier: {assistantFile.name}</div> : null}
					</div>
					<button
						type='button'
						onClick={handleAssistantSend}
						disabled={assistantLoading || !assistantInput.trim()}
						className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${assistantLoading || !assistantInput.trim() ? 'bg-slate-300' : 'bg-gradient-to-r from-[#0fa7d6] to-[#1b6fe0] hover:brightness-110'}`}
					>
						{assistantLoading ? 'En cours…' : 'Envoyer'}
					</button>
				</div>
			</div>
		</div>
	)
}
