import {
  Box, Button, HStack, Input, Select, Table, Tbody, Td, Text, Th, Thead, Tr, useToast
} from '@chakra-ui/react';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../services/frappeApi';
import OwnerChip from './OwnerChip';
import StatusActions from './StatusActions';
import StatusChips from './StatusChips';

function bandClass(value = '') {
  const text = String(value || '').toLowerCase();
  if (text.includes('above') || text.includes('lebih') || text.includes('1,000,000')) return 'money-band-top';
  if (text.includes('500,000')) return 'money-band-high';
  if (text.includes('100,000')) return 'money-band-mid';
  if (text.includes('50,000')) return 'money-band-mid-low';
  return 'money-band-low';
}

export default function LeadGrid({ rows, loading, onReload, onOpen }) {
  const { settings } = useApp();
  const toast = useToast();
  const [busy, setBusy] = useState(null);

  const action = async (lead, key) => {
    let scheduled_for;
    let confirmed_value;
    if (key === 'meeting_set') scheduled_for = window.prompt('Meeting date and time (YYYY-MM-DD HH:mm)') || null;
    if (key === 'signed_client') confirmed_value = window.prompt('Confirmed value (RM)') || null;
    if ((key === 'meeting_set' && !scheduled_for) || (key === 'signed_client' && !confirmed_value)) return;
    setBusy(lead.name);
    try {
      await api.applyAction({ name: lead.name, action: key, scheduled_for, confirmed_value });
      toast({ title: 'Lead updated', status: 'success', duration: 1800 });
      onReload();
    } catch (error) { toast({ title: 'Update failed', description: error.message, status: 'error' }); }
    finally { setBusy(null); }
  };

  const reassign = async (lead, owner_label) => {
    setBusy(lead.name);
    try { await api.reassign({ name: lead.name, owner_label }); onReload(); }
    catch (error) { toast({ title: 'Reassignment failed', description: error.message, status: 'error' }); }
    finally { setBusy(null); }
  };

  const saveRemark = async (lead, value) => {
    if ((lead.alist_remark || '') === value) return;
    try { await api.updateLead({ name: lead.name, field: 'alist_remark', value, modified: lead.modified }); onReload(); }
    catch (error) { toast({ title: 'Remark not saved', description: error.message, status: 'error' }); }
  };

  return (
    <Box bg="white" borderRadius="12px" border="1px solid" borderColor="gray.100" boxShadow="0 1px 3px rgba(0,0,0,.06)" overflow="hidden">
      <Box overflow="auto" maxH="calc(100vh - 285px)">
        <Table size="sm" className="lead-grid">
          <Thead><Tr>
            {['Date & Time', 'Ad Name', 'Sales Tahunan', 'Sales Bulanan', 'Name', 'No Tel', 'Email', 'Company Name', 'PIC', 'Status', 'Remark', ''].map((label) => <Th key={label} px={3} py={3} whiteSpace="nowrap" fontSize="xs">{label}</Th>)}
          </Tr></Thead>
          <Tbody>
            {!loading && rows.length === 0 && <Tr><Td colSpan={12} py={16} textAlign="center" color="gray.400">No leads in this view</Td></Tr>}
            {rows.map((lead) => (
              <Tr key={lead.name}>
                <Td px={3} py={2.5} minW="145px"><Text fontSize="xs">{lead.alist_lead_datetime ? new Date(lead.alist_lead_datetime).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</Text></Td>
                <Td px={3} py={2.5} minW="160px"><Text fontSize="xs" noOfLines={2}>{lead.alist_ad_name || '—'}</Text></Td>
                <Td px={3} py={2.5} minW="155px" className={bandClass(lead.alist_annual_sales_band)}><Text fontSize="xs">{lead.alist_annual_sales_band || '—'}</Text></Td>
                <Td px={3} py={2.5} minW="145px"><Text fontSize="xs">{lead.alist_monthly_sales_text || '—'}</Text></Td>
                <Td px={3} py={2.5} minW="160px"><Text fontSize="sm" fontWeight="600">{lead.lead_name || lead.first_name || 'Unnamed'}</Text></Td>
                <Td px={3} py={2.5} minW="130px"><Text fontSize="xs" fontFamily="mono">{lead.mobile_no || '—'}</Text></Td>
                <Td px={3} py={2.5} minW="190px"><Text fontSize="xs">{lead.email || '—'}</Text></Td>
                <Td px={3} py={2.5} minW="180px"><Text fontSize="xs">{lead.organization || '—'}</Text></Td>
                <Td px={3} py={2.5} minW="150px">
                  <Select size="xs" value={lead.alist_pic_name || ''} onChange={(event) => reassign(lead, event.target.value)} border="none" p={0} iconSize="12px">
                    <option value="">Unassigned</option>
                    {Object.keys(settings?.owner_colors || {}).map((owner) => <option key={owner}>{owner}</option>)}
                  </Select>
                  <OwnerChip owner={lead.alist_pic_name} />
                </Td>
                <Td px={3} py={2.5} minW="250px"><HStack><StatusChips lead={lead} /><StatusActions busy={busy === lead.name} onAction={(key) => action(lead, key)} /></HStack></Td>
                <Td px={3} py={2.5} minW="220px"><Input size="xs" defaultValue={lead.alist_remark || ''} placeholder="Add remark" onBlur={(event) => saveRemark(lead, event.target.value)} /></Td>
                <Td px={3} py={2.5} position="sticky" right={0} bg="white" boxShadow="-4px 0 8px rgba(0,0,0,.05)"><Button size="xs" variant="ghost" onClick={() => onOpen(lead.name)}><Eye size={15} /></Button></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}
