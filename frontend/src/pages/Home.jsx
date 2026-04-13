import React from 'react'
import Hero from '../components/Hero'
import Apropos from '../components/Apropos'
import { useLocation } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

function Home() {
  const location = useLocation()
  const [feedbackSummary, setFeedbackSummary] = React.useState({
    averageRating: null,
    totalFeedbacks: 0,
    byRole: {
      candidate: { averageRating: null, totalFeedbacks: 0 },
      recruiter: { averageRating: null, totalFeedbacks: 0 },
    },
    latestComments: {
      candidate: [],
      recruiter: [],
    },
  })

  React.useEffect(() => {
    const hash = String(location.hash || '').replace('#', '').trim()
    if (!hash) return
    const el = document.getElementById(hash)
    if (!el) return
    // Wait a tick for layout to settle (images/fonts).
    const t = setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    return () => clearTimeout(t)
  }, [location.hash])

  React.useEffect(() => {
    let cancelled = false
    const fetchFeedbackSummary = async () => {
      try {
        const res = await fetch(`${API_BASE}/app-feedback/summary`)
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.success || cancelled) return
        setFeedbackSummary({
          averageRating: Number.isFinite(data?.summary?.averageRating) ? Number(data.summary.averageRating) : null,
          totalFeedbacks: Number(data?.summary?.totalFeedbacks || 0),
          byRole: {
            candidate: {
              averageRating: Number.isFinite(data?.summary?.byRole?.candidate?.averageRating) ? Number(data.summary.byRole.candidate.averageRating) : null,
              totalFeedbacks: Number(data?.summary?.byRole?.candidate?.totalFeedbacks || 0),
            },
            recruiter: {
              averageRating: Number.isFinite(data?.summary?.byRole?.recruiter?.averageRating) ? Number(data.summary.byRole.recruiter.averageRating) : null,
              totalFeedbacks: Number(data?.summary?.byRole?.recruiter?.totalFeedbacks || 0),
            },
          },
          latestComments: {
            candidate: Array.isArray(data?.summary?.latestComments?.candidate) ? data.summary.latestComments.candidate : [],
            recruiter: Array.isArray(data?.summary?.latestComments?.recruiter) ? data.summary.latestComments.recruiter : [],
          },
        })
      } catch {
        // ignore home feedback fetch errors
      }
    }

    fetchFeedbackSummary()
    return () => {
      cancelled = true
    }
  }, [])

  const roleCardClass = 'rounded-2xl border border-[#b6cfe6] bg-white p-5 shadow-[0_8px_20px_rgba(8,51,93,0.08)]'
  const overall = feedbackSummary

  return (
  <div className='w-full'>
    <div className='-mx-4 sm:-mx-[5vw] md:-mx-[7vw] lg:-mx-[9vw]'>
      <Hero />
    </div>
    <div className='-mx-4 sm:-mx-[5vw] md:-mx-[7vw] lg:-mx-[9vw]'>
      <Apropos />
    </div>

    <section id='feedback' className='-mx-4 scroll-mt-24 bg-gradient-to-br from-[#f4faff] via-[#edf6ff] to-[#f7fbff] px-4 py-16 sm:-mx-[5vw] sm:px-[5vw] md:-mx-[7vw] md:px-[7vw] lg:-mx-[9vw] lg:px-[9vw]'>
      <div className='mx-auto max-w-6xl'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <p className='text-xs font-black uppercase tracking-[0.14em] text-[#0a5f88]'>Feedback AIR</p>
            <h2 className='mt-2 text-3xl font-black text-[#0d355b]'>Ce que disent les utilisateurs</h2>
            <p className='mt-2 text-sm text-[#4f7191]'>Feedback global: {overall.averageRating ? `${overall.averageRating}/5` : '—'} • {overall.totalFeedbacks} avis</p>
          </div>
        </div>

        <div className='mt-6 grid gap-4 lg:grid-cols-2'>
          <div className={roleCardClass}>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-black uppercase tracking-[0.12em] text-[#0d355b]'>Candidats</p>
              <span className='rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-[#0a5f88]'>
                {overall.byRole.candidate.averageRating ? `${overall.byRole.candidate.averageRating}/5` : '—'} • {overall.byRole.candidate.totalFeedbacks} avis
              </span>
            </div>
            <div className='mt-3 space-y-2'>
              {(overall.latestComments.candidate || []).length === 0 ? (
                <p className='text-sm text-slate-500'>Pas encore de commentaire candidat.</p>
              ) : (
                (overall.latestComments.candidate || []).map((item) => (
                  <div key={`cand-comment-${String(item?.updatedAt || '')}-${String(item?.userName || '')}-${String(item?.comment || '').slice(0, 24)}`} className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2'>
                    <p className='text-[11px] font-black uppercase tracking-[0.08em] text-[#0d355b]'>{item?.userName || 'Utilisateur'}</p>
                    <p className='text-xs font-black text-amber-600'>{'★'.repeat(Math.max(1, Number(item?.rating || 0)))}</p>
                    <p className='mt-1 text-sm text-slate-700'>{item?.comment || ''}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={roleCardClass}>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-black uppercase tracking-[0.12em] text-[#0d355b]'>Recruteurs</p>
              <span className='rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-[#273d7a]'>
                {overall.byRole.recruiter.averageRating ? `${overall.byRole.recruiter.averageRating}/5` : '—'} • {overall.byRole.recruiter.totalFeedbacks} avis
              </span>
            </div>
            <div className='mt-3 space-y-2'>
              {(overall.latestComments.recruiter || []).length === 0 ? (
                <p className='text-sm text-slate-500'>Pas encore de commentaire recruteur.</p>
              ) : (
                (overall.latestComments.recruiter || []).map((item) => (
                  <div key={`rec-comment-${String(item?.updatedAt || '')}-${String(item?.userName || '')}-${String(item?.comment || '').slice(0, 24)}`} className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2'>
                    <p className='text-[11px] font-black uppercase tracking-[0.08em] text-[#0d355b]'>{item?.userName || 'Utilisateur'}</p>
                    <p className='text-xs font-black text-amber-600'>{'★'.repeat(Math.max(1, Number(item?.rating || 0)))}</p>
                    <p className='mt-1 text-sm text-slate-700'>{item?.comment || ''}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
  )
}

export default Home