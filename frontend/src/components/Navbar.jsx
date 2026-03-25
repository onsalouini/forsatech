import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const fullHeight = document.documentElement.scrollHeight
      const nearBottom = scrollTop + windowHeight >= fullHeight - 120

      setShowScrollTop(nearBottom)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <nav
        className='relative w-full flex items-center py-0 bg-[#001d3e] px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'
        style={{ fontFamily: "'Jost', sans-serif" }}
      >
        <button
          type='button'
          onClick={() => navigate('/')}
          className='cursor-pointer'
          aria-label='Aller a l accueil'
        >
          <img src={assets.logo} className='w-36' alt='Logo' />
        </button>
      </nav>

      {showScrollTop && (
        <button
          type='button'
          onClick={scrollToTop}
          aria-label='Retour en haut'
          className='fixed bottom-6 right-6 z-50 rounded-full bg-[#06d5e0] p-3 text-[#001236] shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#00c7d0] focus:outline-none focus:ring-2 focus:ring-[#06d5e0] focus:ring-offset-2'
        >
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='h-6 w-6'>
            <path d='M12 4l7 7-1.41 1.41L13 7.83V20h-2V7.83l-4.59 4.58L5 11l7-7z' />
          </svg>
        </button>
      )}
    </>
  )
}

export default Navbar
