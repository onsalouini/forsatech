import React from 'react'
import { assets } from '../assets/assets'

function CandidateHeader({ onLogoClick, onLogout }) {
	return (
		<header className='relative z-20 w-full bg-[#020b16] border-b border-white/5 h-24 sm:h-[6.5rem] lg:h-28 flex items-center px-4 sm:px-8 shadow-2xl'>
			<div className='w-1/3 flex items-center' />

			<div className='w-1/3 flex justify-center'>
				<img
					src={assets.logo}
					alt='AIR Logo'
					className='h-20 sm:h-24 lg:h-32 object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform duration-300 cursor-pointer'
					onClick={onLogoClick}
				/>
			</div>

			<div className='w-1/3 flex justify-end'>
				<button
					type='button'
					onClick={onLogout}
					className='flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/20'
				>
					<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth='2'
							d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
						/>
					</svg>
					<span className='hidden sm:block'>Se déconnecter</span>
				</button>
			</div>
		</header>
	)
}

export default CandidateHeader
