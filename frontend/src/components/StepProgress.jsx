import React, { useMemo } from 'react'

function clamp01(value) {
	if (Number.isNaN(value)) return 0
	return Math.min(1, Math.max(0, value))
}

function StepProgress({ currentStep, steps, completionByStep }) {
	const completedCount = useMemo(() => {
		return steps.reduce((acc, step, idx) => {
			const stepNumber = idx + 1
			const ratio = completionByStep?.[stepNumber] ?? 0
			return acc + (ratio >= 1 ? 1 : 0)
		}, 0)
	}, [steps, completionByStep])

	const overallRatio = useMemo(() => {
		if (!steps.length) return 0
		let sum = 0
		for (let i = 0; i < steps.length; i += 1) {
			const ratio = completionByStep?.[i + 1] ?? 0
			sum += clamp01(ratio)
		}
		return sum / steps.length
	}, [steps, completionByStep])

	const percent = Math.round(overallRatio * 100)

	return (
		<div className='rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md px-5 py-4'>
			<div className='flex items-center justify-between gap-3 flex-wrap'>
				<div>
					<p className='text-xs font-extrabold text-white/70 uppercase tracking-wider'>Progression</p>
					<p className='mt-1 text-sm font-bold text-white'>Étape {currentStep} / {steps.length}</p>
				</div>
				<div className='flex items-center gap-2'>
					<span className='text-xs font-extrabold text-white/80 bg-white/10 border border-white/10 rounded-full px-3 py-1'>{completedCount} complétées</span>
					<span className='text-xs font-extrabold text-emerald-100 bg-emerald-500/20 border border-emerald-300/20 rounded-full px-3 py-1'>{percent}%</span>
				</div>
			</div>

			<div className='mt-4 grid grid-cols-3 gap-3'>
				{steps.map((label, idx) => {
					const stepNumber = idx + 1
					const isActive = stepNumber === currentStep
					const ratio = completionByStep?.[stepNumber] ?? 0
					const isDone = ratio >= 1

					return (
						<div key={label} className='flex items-center gap-2 min-w-0'>
							<div
								className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-black border ${
									isDone
										? 'bg-emerald-500/25 text-emerald-100 border-emerald-300/30'
										: isActive
											? 'bg-[#06d5e0]/25 text-white border-[#06d5e0]/50'
											: 'bg-white/10 text-white/70 border-white/10'
								}`}
							>
								{stepNumber}
							</div>
							<div className='min-w-0'>
								<p className='text-xs font-extrabold text-white truncate'>{label}</p>
								<p className='text-[11px] text-white/70'>{Math.round(clamp01(ratio) * 100)}%</p>
							</div>
						</div>
					)
				})}
			</div>

			<div className='mt-4 h-2 rounded-full bg-white/10 overflow-hidden'>
				<div className='h-full bg-gradient-to-r from-[#06d5e0] to-emerald-400' style={{ width: `${percent}%` }} />
			</div>
		</div>
	)
}

export default StepProgress
