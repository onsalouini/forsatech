import React from 'react'
import { useNavigate } from 'react-router-dom'

function Apropos() {
  const navigate = useNavigate()

  return (
    <section className='w-full py-20 sm:py-28 bg-gradient-to-b from-[#d9f1ff] via-[#a5d9ff] to-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header Section */}
        <div className='mb-16 sm:mb-20 text-center'>
          <div className='inline-block mb-4'>
            <p
              style={{ fontFamily: "'Jost', sans-serif" }}
              className='text-sm sm:text-2xl font-bold uppercase tracking-[0.3em] text-[#042945]  px-4 py-2 rounded-full'
            >
              Fonctionnalités
            </p>
          </div>
          <h2
            style={{ fontFamily: "'Anton', sans-serif" }}
            className='text-6xl sm:text-6xl lg:text-5xl font-black leading-tight text-[#041B32] mb-6'
          >
           Tout ce qu'il vous faut, alimenté par l'IA
          </h2>
          <p
            style={{ fontFamily: "'Jost', sans-serif" }}
            className='mx-auto max-w-3xl text-lg sm:text-xl text-slate-600 leading-relaxed font-light'
          >
            A.I.R connecte les bons profils aux bonnes opportunités grâce à l'IA:
            Une plateforme complète qui transforme votre façon de recruter ou de chercher un emploi.
          </p>
        </div>

        {/* Two Column Section */}
        <div className='grid gap-6 sm:gap-8 md:grid-cols-2 mb-12 sm:mb-16'>
          <article className='rounded-2xl border border-[#0f2d4c]/20 bg-gradient-to-br from-[#e2efff] via-[#eef6ff] to-[#f8fbff] p-8 sm:p-10 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(19,80,137,0.18)] transition-all duration-300'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-1 h-10 rounded-full bg-gradient-to-b from-[#0f2d4c] to-[#1a4f78]'></div>
              <div className='flex-1 h-1 bg-gradient-to-r from-[#0f2d4c] to-transparent rounded-full'></div>
            </div>
            <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-2xl sm:text-3xl text-[#041B32] mb-3'>
              Analyse sémantique du CV
            </h3>
            <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-700 leading-relaxed font-light'>
              Notre IA décompose votre CV en profondeur : compétences, expériences, soft skills et potentiel caché.
            </p>
          </article>

          <article className='rounded-2xl border border-[#0f2d4c]/20 bg-gradient-to-br from-[#dcfbff] via-[#eafdff] to-[#f7feff] p-8 sm:p-10 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(6,168,184,0.18)] transition-all duration-300'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-1 h-10 rounded-full bg-gradient-to-b from-[#08708a] to-[#06a8b8]'></div>
              <div className='flex-1 h-1 bg-gradient-to-r from-[#08708a] to-transparent rounded-full'></div>
            </div>
            <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-2xl sm:text-3xl text-[#041B32] mb-3'>
              Matching instantané
            </h3>
            <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-700 leading-relaxed font-light'>
             Correspondance CV ↔ Offre en temps réel avec un score de compatibilité précis et des explications claires.
            </p>
          </article>
          <article className='rounded-2xl border border-[#0f2d4c]/20 bg-gradient-to-br from-[#e8edff] via-[#f1f5ff] to-[#fafcff] p-8 sm:p-10 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(84,104,179,0.18)] transition-all duration-300'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-1 h-10 rounded-full bg-gradient-to-b from-[#36498b] to-[#5468b3]'></div>
              <div className='flex-1 h-1 bg-gradient-to-r from-[#36498b] to-transparent rounded-full'></div>
            </div>
            <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-2xl sm:text-3xl text-[#041B32] mb-3'>
Score & amélioration du CV            </h3>
            <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-700 leading-relaxed font-light'>
Recevez des recommandations concrètes pour booster votre CV et augmenter vos chances de 3×.            </p>
          </article>
          <article className='rounded-2xl border border-[#0f2d4c]/20 bg-gradient-to-br from-[#e3f0ff] via-[#edf5ff] to-[#f8fbff] p-8 sm:p-10 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(29,106,180,0.18)] transition-all duration-300'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-1 h-10 rounded-full bg-gradient-to-b from-[#135089] to-[#1d6ab4]'></div>
              <div className='flex-1 h-1 bg-gradient-to-r from-[#135089] to-transparent rounded-full'></div>
            </div>
            <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-2xl sm:text-3xl text-[#041B32] mb-3'>
              Recommandations personnalisées
            </h3>
            <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-700 leading-relaxed font-light'>
            L'IA apprend de vos préférences pour vous proposer les offres les plus adaptées à votre profil. </p>
          </article>
 
          <article className='rounded-2xl border border-[#0f2d4c]/20 bg-gradient-to-br from-[#ddf8ff] via-[#e9fcff] to-[#f7feff] p-8 sm:p-10 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(17,161,207,0.18)] transition-all duration-300'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-1 h-10 rounded-full bg-gradient-to-b from-[#0c6f9a] to-[#11a1cf]'></div>
              <div className='flex-1 h-1 bg-gradient-to-r from-[#0c6f9a] to-transparent rounded-full'></div>
            </div>
            <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-2xl sm:text-3xl text-[#041B32] mb-3'>
              Planification d'entretiens
            </h3>
            <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-700 leading-relaxed font-light'>
Système intégré de prise de RDV. Visio ou présentiel, tout se gère depuis la plateforme.            </p>
          </article>
          <article className='rounded-2xl border border-[#0f2d4c]/20 bg-gradient-to-br from-[#e3ecff] via-[#eef4ff] to-[#f8fbff] p-8 sm:p-10 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(42,95,149,0.18)] transition-all duration-300'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-1 h-10 rounded-full bg-gradient-to-b from-[#1a3f6b] to-[#2a5f95]'></div>
              <div className='flex-1 h-1 bg-gradient-to-r from-[#1a3f6b] to-transparent rounded-full'></div>
            </div>
            <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-2xl sm:text-3xl text-[#041B32] mb-3'>
Tests comportementaux
            </h3>
            <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-700 leading-relaxed font-light'>
Tests de stress, d'humeur et de personnalité pour mieux vous connaître et rassurer les recruteurs.            </p>
          </article>
        </div>

        {/* Process Section */}
        <div className='mb-16 sm:mb-20'>
          <div className='mb-10 sm:mb-12 text-center'>
            <p
              style={{ fontFamily: "'Jost', sans-serif" }}
              className='text-sm sm:text-2xl font-bold uppercase tracking-[0.3em] text-[#06d5e0] px-4 py-2 rounded-full'
            >
              Processus
            </p>
            <h2
              style={{ fontFamily: "'Anton', sans-serif" }}
              className='text-4xl sm:text-5xl text-[#041B32] mt-4'
            >
              Comment ca marche ?
            </h2>
          </div>

          <div className='rounded-3xl border border-[#0f2d4c]/10 bg-gradient-to-b from-[#eaf3ff] via-[#f2f9ff] to-[#e8f5ff] p-8 sm:p-12'>
            <div className='relative hidden md:block'>
              <div className='absolute left-0 right-0 top-8 z-0 h-[3px] rounded-full bg-gradient-to-r from-[#4fa7ff] via-[#3dabff] to-[#06bfd6] shadow-[0_0_10px_rgba(97, 136, 255, 0.28)]'></div>
              <div className='grid grid-cols-4 gap-8'>
                <article className='relative z-10 text-center'>
                  <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#5FA4FF]/30 bg-[#ffffff] text-4xl text-[#00368e] shadow-md'>
                    <span style={{ fontFamily: "'Anton', sans-serif" }} className='text-3xl leading-none'>01</span>
                  </div>
                  <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-3xl text-[#041B32] mb-2'>
                    Créez votre profil
                  </h3>
                  <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-600 text-lg leading-relaxed'>
                    Inscrivez-vous et importez votre CV en quelques secondes.
                  </p>
                </article>

                <article className='relative z-10 text-center'>
                  <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#5FA4FF]/30 bg-[#ffffff] text-4xl text-[#00368e] shadow-md'>
                    <span style={{ fontFamily: "'Anton', sans-serif" }} className='text-3xl leading-none'>02</span>
                  </div>
                  <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-3xl text-[#041B32] mb-2'>
                    L'IA analyse
                  </h3>
                  <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-600 text-lg leading-relaxed'>
                    Notre moteur décompose votre profil et calcule votre score.
                  </p>
                </article>

                <article className='relative z-10 text-center'>
                  <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#5FA4FF]/30 bg-[#ffffff] text-4xl text-[#00368e] shadow-md'>
                    <span style={{ fontFamily: "'Anton', sans-serif" }} className='text-3xl leading-none'>03</span>
                  </div>
                  <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-3xl text-[#041B32] mb-2'>
                    Matching précis
                  </h3>
                  <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-600 text-lg leading-relaxed'>
                    Recevez les meilleures offres adaptées à vos compétences.
                  </p>
                </article>

                <article className='relative z-10 text-center'>
                  <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#5FA4FF]/30 bg-[#ffffff] text-4xl text-[#00368e] shadow-md'>
                    <span style={{ fontFamily: "'Anton', sans-serif" }} className='text-3xl leading-none'>04</span>
                  </div>
                  <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-3xl text-[#041B32] mb-2'>
                    Décrochez le poste
                  </h3>
                  <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-600 text-lg leading-relaxed'>
                    Postulez en 1 clic et planifiez vos entretiens directement.
                  </p>
                </article>
              </div>
            </div>

            <div className='grid gap-4 md:hidden'>
              <article className='rounded-2xl border border-[#0f2d4c]/10 bg-white/85 p-5'>
                <p style={{ fontFamily: "'Anton', sans-serif" }} className='text-[#00107c] text-2xl mb-1'>01</p>
                <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-xl text-[#041B32] mb-1'>Créez votre profil</h3>
                <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-600'>Inscrivez-vous et importez votre CV en quelques secondes.</p>
              </article>
              <article className='rounded-2xl border border-[#0f2d4c]/10 bg-white/85 p-5'>
                <p style={{ fontFamily: "'Anton', sans-serif" }} className='text-[#00107c] text-2xl mb-1'>02</p>
                <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-xl text-[#041B32] mb-1'>L'IA analyse</h3>
                <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-600'>Notre moteur décompose votre profil et calcule votre score.</p>
              </article>
              <article className='rounded-2xl border border-[#0f2d4c]/10 bg-white/85 p-5'>
                <p style={{ fontFamily: "'Anton', sans-serif" }} className='text-[#5f75ff] text-2xl mb-1'>03</p>
                <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-xl text-[#041B32] mb-1'>Matching précis</h3>
                <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-600'>Recevez les meilleures offres adaptées à vos compétences.</p>
              </article>
              <article className='rounded-2xl border border-[#0f2d4c]/10 bg-white/85 p-5'>
                <p style={{ fontFamily: "'Anton', sans-serif" }} className='text-[#5f75ff] text-2xl mb-1'>04</p>
                <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-xl text-[#041B32] mb-1'>Décrochez le poste</h3>
                <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-600'>Postulez en 1 clic et planifiez vos entretiens directement.</p>
              </article>
            </div>
          </div>
        </div>
        {/* Candidate / Recruiter Section */}
        <div className='mb-16 sm:mb-20 rounded-3xl border border-[#0f2d4c]/10 bg-gradient-to-br from-[#f2f8ff] via-[#f9fcff] to-[#f0fbff] p-6 sm:p-8'>
          <div className='mb-10 sm:mb-12 text-center'>
            <p
              style={{ fontFamily: "'Jost', sans-serif" }}
              className='text-sm sm:text-2xl font-bold uppercase tracking-[0.3em] text-[#06d5e0] px-4 py-2 rounded-full'
            >
              Pour tous
            </p>
            <h2
              style={{ fontFamily: "'Anton', sans-serif" }}
              className='text-4xl sm:text-5xl text-[#041B32] mt-4 mb-4'
            >
              Candidat ou recruteur ?
            </h2>
            <p
              style={{ fontFamily: "'Jost', sans-serif" }}
              className='mx-auto max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed'
            >
              A.I.R est conçu pour les deux côtés du recrutement.
            </p>
          </div>

          <div className='grid gap-6 md:grid-cols-2'>
            <article className='rounded-3xl border border-[#0f2d4c]/15 bg-gradient-to-br from-[#eaf5ff] via-[#f3f9ff] to-[#fbfdff] p-7 sm:p-8 shadow-sm hover:shadow-lg transition-all duration-300'>
              <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-sm font-semibold uppercase tracking-[0.2em] text-[#06a8b8] mb-3'>
                Candidat
              </p>
              <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-3xl text-[#041B32] mb-3'>
                Boostez votre carriere avec l'IA
              </h3>
              <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-700 leading-relaxed mb-5'>
                Optimisez votre CV, decouvrez vos points forts et trouvez les offres qui correspondent vraiment a votre profil.
              </p>
              <ul style={{ fontFamily: "'Jost', sans-serif" }} className='space-y-2 text-slate-700 mb-6'>
                <li>✓ Analyse et score de votre CV</li>
                <li>✓ Offres correspondantes en temps reel</li>
                <li>✓ Recommandations d'amelioration</li>
                <li>✓ Tests de personnalite & comportement</li>
                <li>✓ Planification des entretiens</li>
              </ul>
              <button
                onClick={() => navigate('/connecter')}
                className='inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#08c2d9] via-[#07afc8] to-[#1a74b0] px-7 py-2.5 text-white font-semibold shadow-[0_10px_24px_rgba(8,163,196,0.28)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(8,163,196,0.36)] transition-all duration-300'
              >
                Creer mon profil candidat
              </button>
            </article>

            <article className='rounded-3xl border border-[#0f2d4c]/15 bg-gradient-to-br from-[#ecefff] via-[#f3f6ff] to-[#fbfcff] p-7 sm:p-8 shadow-sm hover:shadow-lg transition-all duration-300'>
              <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-sm font-semibold uppercase tracking-[0.2em] text-[#5f87ff] mb-3'>
                Recruteur
              </p>
              <h3 style={{ fontFamily: "'Anton', sans-serif" }} className='text-3xl text-[#041B32] mb-3'>
                Trouvez le bon profil en minutes
              </h3>
              <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-700 leading-relaxed mb-5'>
                Publiez vos offres, laissez l'IA classer les candidats et concentrez-vous sur les entretiens qui comptent.
              </p>
              <ul style={{ fontFamily: "'Jost', sans-serif" }} className='space-y-2 text-slate-700 mb-6'>
                <li>✓ Creation et gestion des offres</li>
                <li>✓ Classement automatique des candidats</li>
                <li>✓ Score de compatibilite detaille</li>
                <li>✓ Filtrage intelligent par l'IA</li>
                <li>✓ Planification des entretiens integree</li>
              </ul>
              <button
                onClick={() => navigate('/connexion')}
                className='inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#0356b6] via-[#4f84ff] to-[#368bd7] px-7 py-2.5 text-white font-semibold shadow-[0_10px_24px_rgba(79,102,255,0.28)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(79,102,255,0.36)] transition-all duration-300'
              >
                Acceder a l'espace recruteur
              </button>
            </article>
          </div>
        </div>

        {/* CTA Section */}
        <div className='mt-20 sm:mt-28 rounded-3xl border border-[#0e5b90]/35 bg-gradient-to-r from-[#03213f] via-[#0b4577] to-[#03213f] p-12 sm:p-16 text-center shadow-[0_14px_36px_rgba(3,33,63,0.35)]'>
          <p
            style={{ fontFamily: "'Jost', sans-serif" }}
            className='text-sm sm:text-2xl font-bold uppercase tracking-[0.3em] text-[#06d5e0] px-4 py-2 rounded-full mb-4'
          >
            Rejoignez A.I.R
          </p>
          <h2 style={{ fontFamily: "'Anton', sans-serif" }} className='text-3xl sm:text-5xl lg:text-5xl font-black text-white mb-6'>
            Prêt à transformer votre recrutement ?
          </h2>
          <p style={{ fontFamily: "'Jost', sans-serif" }} className='mx-auto max-w-2xl text-base sm:text-lg text-slate-200 mb-8 font-light'>
            Rejoignez les professionnels qui font confiance à A.I.R pour trouver les meilleurs talents et se faire découvrir.
          </p>
          <button className='inline-flex items-center justify-center px-8 sm:px-9 py-2.5 rounded-full bg-gradient-to-r from-[#08d2de] via-[#0dbfd7] to-[#4f66ff] text-white font-semibold text-lg shadow-[0_10px_26px_rgba(8,197,217,0.35)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(8,197,217,0.45)] transition-all duration-300'>
            Démarrer gratuitement
          </button>
        </div>
      </div>
    </section>
  )
}

export default Apropos
