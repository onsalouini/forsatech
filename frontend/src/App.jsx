import React from 'react'
import {Routes, Route, useLocation} from 'react-router-dom'
import Home from './pages/Home'
import Navbar from './components/Navbar.jsx'
import Apropos from './components/Apropos.jsx'
import CnnxRec from './pages/CnnxRec.jsx'
import CnnxCand from './pages/CnnxCand.jsx'
import DashboardRec from './pages/DashboardRec.jsx'
import CandidateCV from './pages/CandidateCV.jsx'
import CandidateCVUpload from './pages/CandidateCVUpload.jsx'
import CandidateCVBuilder from './pages/CandidateCVBuilder.jsx'
import CandidateCVBuildStep1 from './pages/CandidateCVBuildStep1.jsx'
import CandidateCVBuildReview from './pages/CandidateCVBuildReview.jsx'
import DashboardCand from './pages/DashboardCand.jsx'
import ChooseRole from './pages/ChooseRole.jsx'
import MotDePasseOublie from './pages/MotDePasseOublie.jsx'
import './index.css';
import ChatWidget from './components/ChatWidget';



function App() {
  const location = useLocation()
  const isDashboardPage =
    location.pathname.startsWith('/dashboard-rec') ||
    location.pathname.startsWith('/EspaceRecruteur') ||
    location.pathname.startsWith('/EspaceCandidat')

  const isAuthPage =
    location.pathname === '/connecter' ||
    location.pathname === '/connexion' ||
    location.pathname === '/cnnx' ||
    location.pathname === '/connesion' ||
    location.pathname === '/inscrire' ||
    location.pathname === '/mot-de-passe-oublie'

  const contentPadding = isDashboardPage || isAuthPage ? '' : 'px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'

  return (
    <div className='min-h-screen flex flex-col'>
    {!isDashboardPage && !isAuthPage && <Navbar />}
    <main className={`flex-1 min-h-0 ${contentPadding}`}>
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/a-propos' element={<Apropos/>}/>
      <Route path='/demarrer' element={<ChooseRole/>}/>
      <Route path='/connecter' element={<CnnxCand/>}/>
      <Route path='/connexion' element={<CnnxRec/>}/>
      <Route path='/cnnx' element={<CnnxRec/>}/>
      <Route path='/connesion' element={<CnnxRec/>}/>
      <Route path='/inscrire' element={<CnnxRec/>}/>
      <Route path='/mot-de-passe-oublie' element={<MotDePasseOublie/>}/>
      <Route path='/dashboard-rec' element={<DashboardRec/>}/>
      <Route path='/EspaceRecruteur' element={<DashboardRec/>}/>

      <Route path='/EspaceCandidat' element={<CandidateCV/>}/>
      <Route path='/EspaceCandidat/dashboard' element={<DashboardCand/>}/>
      <Route path='/EspaceCandidat/upload' element={<CandidateCVUpload/>}/>
      <Route path='/EspaceCandidat/construire' element={<CandidateCVBuildStep1/>}/>
      <Route path='/EspaceCandidat/construire/etape-1' element={<CandidateCVBuildStep1/>}/>
      <Route path='/EspaceCandidat/construire/etape-2' element={<CandidateCVBuilder/>}/>
      <Route path='/EspaceCandidat/construire/finaliser' element={<CandidateCVBuildReview/>}/>
      
    </Routes>
    </main>
    <ChatWidget />
    </div>

  )
}

export default App