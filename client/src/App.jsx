import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DebateProvider } from './context/DebateContext'
import Home from './pages/Home'
import Debate from './pages/Debate'
import './App.css'

function App() {
  return (
    <DebateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/debate/:roomId" element={<Debate />} />
        </Routes>
      </BrowserRouter>
    </DebateProvider>
  )
}

export default App