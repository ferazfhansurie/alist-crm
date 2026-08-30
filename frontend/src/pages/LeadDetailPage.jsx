import { useNavigate, useParams } from 'react-router-dom';
import LeadDetail from '../components/leads/LeadDetail';

export default function LeadDetailPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  return <LeadDetail name={leadId} onClose={() => navigate('/leads')} />;
}
