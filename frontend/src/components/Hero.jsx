import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom';


function Hero() {
    const navigate = useNavigate();

  return (
    
    <div
      className='w-full min-h-[56vh] sm:min-h-[62vh] lg:min-h-[66vh] relative bg-cover bg-center'
      style={{ backgroundImage: `url(${assets.couverture})` }}
    >
      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-[#020b16]/55"></div>
      <div className="absolute inset-y-0 left-0 w-[78%] sm:w-[100%] bg-gradient-to-r from-[#020b16]/70 via-[#020b16]/35 to-transparent backdrop-blur-[2px]"></div>

      {/* Texte à gauche, centré verticalement */}
      <div className='relative z-10 h-full flex items-center px-6 sm:px-16 lg:px-20 py-10'>
        <div className='w-full max-w-xl text-left'>
          <div className="mb-5 space-y-1">
            <h1
              style={{ fontFamily: "'Anton', sans-serif" }}
              className="text-white text-4xl sm:text-5xl leading-none tracking-wide"
            >
              Artificial.
            </h1>
            <h1
              style={{ fontFamily: "'Anton', sans-serif" }}
              className="text-white text-4xl sm:text-5xl leading-none tracking-wide ml-3 sm:ml-12"
            >
              Intelligence.
            </h1>
            <h1
              style={{ fontFamily: "'Anton', sans-serif" }}
              className="text-white text-4xl sm:text-5xl leading-none tracking-wide ml-6 sm:ml-20"
            >
              Recruitment.
            </h1>
         
          </div>
          <div>
                 <h1
              style={{ fontFamily: "'Anton', sans-serif" }}
              className="text-[#06d5e0] text-xl sm:text-2xl leading-none tracking-wide  "
            >
              Recrutez plus vite.
              Postulez avec confiance.
            </h1>
          </div>

          <p style={{ fontFamily: "'Jost', sans-serif" }} className='text-slate-100 text-base sm:text-lg mb-8 max-w-xl'>
           ForsaTech connecte intelligemment candidats et recruteurs grâce à une analyse IA avancée des CV et des offres d'emploi.
          </p>
          <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4'>
            <button
              onClick={() => navigate('/connecter')}
              type='button'
              className='px-6 py-2 rounded-full bg-[#ffffff] text-[#041B32] text-base sm:text-base font-semibold shadow-lg hover:bg-[#00c7d0] hover:scale-[1.02] transition-all duration-200'
            >
              Je suis Candidat →
            </button>
            <button
              onClick={() => navigate('/connexion')}
              type='button'
              className='px-6 py-2 rounded-full border-2 border-[#06d5e0] text-[#e6fbff] text-base xl:text-base font-semibold hover:bg-[#06d5e0] hover:text-[#041B32] active:bg-[#00c7d0] active:text-[#041B32] hover:scale-[1.02] transition-all duration-200'
            >
              Je suis Recruteur →
            </button>
          </div>
  
        </div>
      </div>
    </div>

  )
  
}
  

export default Hero
