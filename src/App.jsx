import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TripTrackingPage from './pages/TripTrackingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/trips/:token" element={<TripTrackingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/" element={
          <div className="flex items-center justify-center h-screen w-screen bg-gray-50 text-gray-400 font-medium">
            Mashena Public Trip Tracking
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
