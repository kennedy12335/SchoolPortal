import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import AdminDashboard from './components/admin/AdminDashboard';
import ExamManagement from './components/admin/ExamManagement';
import SchoolFeesAnalytics from './components/admin/SchoolFeesAnalytics';
import ExamFeesAnalytics from './components/admin/ExamFeesAnalytics';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background">
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/exams" element={<ExamManagement />} />
          <Route path="/admin/school-fees" element={<SchoolFeesAnalytics />} />
          <Route path="/admin/exam-fees" element={<ExamFeesAnalytics />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
