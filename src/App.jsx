// FILE: src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/index';
import MembersHome from './pages/membersHome';
// import Waitlist from './pages/Waitlist';
// import Contact from './pages/Contact';

function App() {
  return (
    <Router>
      <Routes>
        {/* Organizations Landing Page */}
        <Route path="/" element={<Home />} />
        
        {/* Members Landing Page */}
        <Route path="/members" element={<MembersHome />} />
        
        {/* Waitlist Signup Page */}
        {/* <Route path="/waitlist" element={<Waitlist />} /> */}
        
        {/* Contact Page */}
        {/* <Route path="/contact" element={<Contact />} /> */}
        
        {/* Catch-all redirect to home */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;


