import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ParentProvider } from './context/ParentContext';
import Header from './components/layout/Header';
import PageContainer from './components/layout/PageContainer';
import Dashboard from './components/Dashboard';
import SchoolFeesPage from './components/school-fees/SchoolFeesPage';
import ExamFeesPage from './components/exam-fees/ExamFeesPage';
import PaymentSuccess from './components/PaymentSuccess';
import ExamPaymentSuccess from './components/ExamPaymentSuccess';
import AdminDashboard from './components/admin/AdminDashboard';
import ExamManagement from './components/admin/ExamManagement';
import SchoolFeesAnalytics from './components/admin/SchoolFeesAnalytics';
import ExamFeesAnalytics from './components/admin/ExamFeesAnalytics';
import './App.css';

function App() {
  return (
    <Router>
      <ParentProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <Toaster position="top-center" richColors />
          <Routes>
            {/* Admin routes - without main header */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/exams" element={<ExamManagement />} />
            <Route path="/admin/school-fees" element={<SchoolFeesAnalytics />} />
            <Route path="/admin/exam-fees" element={<ExamFeesAnalytics />} />

            {/* Main app routes with header */}
            <Route
              path="/*"
              element={
                <>
                  <Header />
                  <PageContainer>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/school-fees" element={<SchoolFeesPage />} />
                      <Route path="/exam-fees/:studentId" element={<ExamFeesPage />} />
                      <Route path="/success" element={<PaymentSuccess />} />
                      <Route path="/exam-success" element={<ExamPaymentSuccess />} />
                    </Routes>
                  </PageContainer>
                </>
              }
            />
          </Routes>
        </div>
      </ParentProvider>
    </Router>
  );
}

export default App;
