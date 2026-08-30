import {
  Box, Button, FormControl, FormLabel, Grid, HStack, Input, Select, SimpleGrid,
  Table, Tbody, Td, Text, Th, Thead, Tr, useToast
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import KpiCard from '../components/KpiCard';
import PageHeader from '../components/PageHeader';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/frappeApi';

const money = (value) => `RM${Number(value || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const percent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;
const currentMonth = new Date().toISOString().slice(0, 7);

export default function DailyReportPage() {
  const { settings } = useApp();
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState(null);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), channel: 'Meta', lead_spend: '', awareness_spend: '', remark: '' });
  const toast = useToast();
  const load = useCallback(() => api.dailyReport(month).then(setReport), [month]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      await api.saveMarketing(form);
      toast({ title: 'Daily input saved', status: 'success', duration: 1800 });
      setForm((value) => ({ ...value, lead_spend: '', awareness_spend: '', remark: '' }));
      load();
    } catch (error) { toast({ title: 'Could not save', description: error.message, status: 'error' }); }
  };

  const total = report?.totals || {};
  return (
    <Box px={{ base: 4, xl: 8 }} py={6}>
      <PageHeader title="Daily Report" description="Lead and meeting counts are automatic. Only spend, awareness, and remarks are entered here." actions={<Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} bg="white" w="170px" />} />
      <SimpleGrid columns={{ base: 2, md: 4, xl: 6 }} spacing={4} mb={5}>
        <KpiCard label="Total Leads" value={total.leads || 0} hint={`${percent(total.lead_progress)} of ${total.lead_target || 0}`} />
        <KpiCard label="Remaining" value={total.remaining_leads || 0} hint={`${Number(total.daily_lead_target || 0).toFixed(1)} per remaining day`} />
        <KpiCard label="Average CPL" value={money(total.average_cpl)} accent="#2B6CB0" />
        <KpiCard label="Meetings" value={total.meetings || 0} hint={`${money(total.average_cost_per_meeting)} per meeting`} accent="#6B46C1" />
        <KpiCard label="Ad Spend" value={money(total.spend)} hint={`${percent(total.spend_progress)} of ${money(total.spend_target)}`} accent="#38A169" />
        <KpiCard label="Awareness" value={money(total.awareness_spend)} accent="#E3BD72" />
      </SimpleGrid>

      {settings?.can_manage && (
        <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="12px" p={4} mb={5}>
          <Text fontWeight="700" mb={3}>Daily marketing input</Text>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(5, minmax(0, 1fr)) auto' }} gap={3} alignItems="end">
            <FormControl><FormLabel fontSize="xs">Date</FormLabel><Input type="date" size="sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></FormControl>
            <FormControl><FormLabel fontSize="xs">Channel</FormLabel><Select size="sm" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>{Object.keys(settings.channel_colors || {}).map((channel) => <option key={channel}>{channel}</option>)}</Select></FormControl>
            <FormControl><FormLabel fontSize="xs">Lead Spend</FormLabel><Input type="number" size="sm" value={form.lead_spend} onChange={(e) => setForm({ ...form, lead_spend: e.target.value })} /></FormControl>
            <FormControl><FormLabel fontSize="xs">Awareness</FormLabel><Input type="number" size="sm" value={form.awareness_spend} onChange={(e) => setForm({ ...form, awareness_spend: e.target.value })} /></FormControl>
            <FormControl><FormLabel fontSize="xs">Remark</FormLabel><Input size="sm" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} /></FormControl>
            <Button bg="alist.500" color="white" _hover={{ bg: 'alist.600' }} size="sm" onClick={save}>Save</Button>
          </Grid>
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5}>
        <ReportTable title="Channel Summary" headers={['Channel', 'Leads', 'Meetings', 'Spend', 'CPL', 'Cost / Meeting']} rows={(report?.channels || []).map((row) => [<HStack key={row.channel}><Box w="8px" h="8px" borderRadius="full" bg={row.color} /><Text>{row.channel}</Text></HStack>, row.leads, row.meetings, money(row.spend), money(row.cpl), money(row.cost_per_meeting)])} />
        <ReportTable title="Per PIC" headers={['PIC', 'Leads', 'Meetings']} rows={(report?.owners || []).map((row) => [row.owner, row.leads, row.meetings])} />
      </SimpleGrid>
      <Box mt={5}><ReportTable title="Daily Breakdown" headers={['Date', 'Leads', 'Meetings', 'Spend', 'CPL', 'Cost / Meeting', 'Awareness', 'Remark']} rows={(report?.days || []).map((row) => [row.date, row.leads, row.meetings, money(row.spend), money(row.cpl), money(row.cost_per_meeting), money(row.awareness), row.remark || '—'])} /></Box>
    </Box>
  );
}

function ReportTable({ title, headers, rows }) {
  return (
    <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="12px" overflow="hidden" boxShadow="0 1px 3px rgba(0,0,0,.06)">
      <Text fontWeight="700" p={4} borderBottom="1px solid" borderColor="gray.100">{title}</Text>
      <Box overflowX="auto"><Table size="sm"><Thead bg="gray.50"><Tr>{headers.map((header) => <Th key={header} fontSize="xs" whiteSpace="nowrap">{header}</Th>)}</Tr></Thead><Tbody>{rows.length === 0 ? <Tr><Td colSpan={headers.length} color="gray.400" textAlign="center" py={8}>No data</Td></Tr> : rows.map((cells, index) => <Tr key={index}>{cells.map((cell, cellIndex) => <Td key={cellIndex} fontSize="sm" whiteSpace="nowrap">{cell}</Td>)}</Tr>)}</Tbody></Table></Box>
    </Box>
  );
}
