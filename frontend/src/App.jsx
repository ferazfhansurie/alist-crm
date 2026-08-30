import { Center, Spinner } from '@chakra-ui/react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Shell from './components/Shell';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import DailyReportPage from './pages/DailyReportPage';
import SummaryPage from './pages/SummaryPage';
import SettingsPage from './pages/SettingsPage';
import { useApp } from './contexts/AppContext';

export default function App() {
  const { session } = useApp();
  if (!session) return <Center minH="100vh"><Spinner color="alist.500" size="xl" /></Center>;
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/leads" replace />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:leadId" element={<LeadDetailPage />} />
        <Route path="/daily-report" element={<DailyReportPage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/leads" replace />} />
      </Routes>
    </Shell>
  );
}
