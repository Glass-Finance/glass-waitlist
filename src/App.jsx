import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/index';
// import Waitlist from './pages/Waitlist';
// import Ambassadors from './pages/Ambassadors';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/waitlist" element={<Waitlist />} />
        <Route path="/ambassadors" element={<Ambassadors />} /> */}
      </Routes>
    </Router>
  );
}