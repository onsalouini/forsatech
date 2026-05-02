import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { useLocation, useNavigate } from 'react-router-dom'




const NAV_ITEMS = [
  { id: 'fonctionnalites', label: 'Fonctionnalités' },
  { id: 'processus', label: 'Processus' },
  { id: 'pour-tous', label: 'Pour tous' },
  { id: 'rejoindre', label: 'Rejoignez ForsaTech' },
  { id: 'feedback', label: 'Feedback' }
]


function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  
if (location.pathname.startsWith('/admin')) return null

  const [showScrollTop, setShowScrollTop] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  

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

  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('')
      return
    }

    const hashSection = String(location.hash || '').replace('#', '').trim()
    if (hashSection) setActiveSection(hashSection)

    const sectionElements = NAV_ITEMS
      .map((item) => document.getElementById(item.id))
      .filter(Boolean)

    if (!sectionElements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visibleEntries.length) {
          setActiveSection(visibleEntries[0].target.id)
        }
      },
      {
        root: null,
        rootMargin: '-25% 0px -55% 0px',
        threshold: [0.2, 0.4, 0.6]
      }
    )

    sectionElements.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [location.pathname, location.hash])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToSection = (id) => {
    const sectionId = String(id || '').trim()
    if (!sectionId) return

    setActiveSection(sectionId)

    if (location.pathname === '/') {
      const el = document.getElementById(sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.history.replaceState(null, '', `#${sectionId}`)
      }
      else navigate({ pathname: '/', hash: `#${sectionId}` })
      return
    }

    navigate({ pathname: '/', hash: `#${sectionId}` })
  }
  


  return (
    <>
      <nav
        className='sticky top-0 z-30 w-full flex items-center justify-between gap-4 py-2 bg-[#001d3e]/95 backdrop-blur-md px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'
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

        <div className='flex flex-wrap items-center justify-end gap-2 sm:gap-3'>
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id

            return (
              <button
                key={item.id}
                type='button'
                onClick={() => scrollToSection(item.id)}
                className={`rounded-full px-3 py-2 text-base sm:text-lg font-medium transition ${
                  isActive
                    ? ' text-[#06d5e0] '
                    : 'text-cyan-50/90 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
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
