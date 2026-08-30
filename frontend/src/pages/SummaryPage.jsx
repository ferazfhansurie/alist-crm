import { Box, SimpleGrid, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import KpiCard from '../components/KpiCard';
import PageHeader from '../components/PageHeader';
import { api } from '../services/frappeApi';

const money = (value) => `RM${Number(value || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const percent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;

export default function SummaryPage() {
  const [data, setData] = useState({ months: [], closings: [] });
  useEffect(() => { api.monthlySummary().then(setData); }, []);
  const totals = data.months.reduce((sum, row) => ({ leads: sum.leads + row.leads, meetings: sum.meetings + row.meetings, closed: sum.closed + row.closed, amount: sum.amount + row.closed_amount, spend: sum.spend + row.spend }), { leads: 0, meetings: 0, closed: 0, amount: 0, spend: 0 });
  return (
    <Box px={{ base: 4, xl: 8 }} py={6}>
      <PageHeader title="Summary" description="Monthly funnel and closing attribution generated from the lead and deal records." />
      <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4} mb={5}>
        <KpiCard label="Leads" value={totals.leads.toLocaleString()} />
        <KpiCard label="Meetings" value={totals.meetings.toLocaleString()} accent="#6B46C1" />
        <KpiCard label="Closed" value={totals.closed.toLocaleString()} accent="#38A169" />
        <KpiCard label="Closed Value" value={money(totals.amount)} accent="#D69E2E" />
        <KpiCard label="Ad Spend" value={money(totals.spend)} accent="#2B6CB0" />
      </SimpleGrid>
      <SummaryTable title="Monthly Funnel" headers={['Month', 'Leads', 'Meetings', 'Closed', 'Closed Amount', 'Ad Spend', 'Lead → Meeting', 'Meeting → Close']} rows={data.months.map((row) => [row.month, row.leads, row.meetings, row.closed, money(row.closed_amount), money(row.spend), percent(row.lead_to_meeting), percent(row.meeting_to_close)])} />
      <Box mt={5}><SummaryTable title="Closing From Leads" headers={['Client', 'Amount', 'Closed On', 'Source Month', 'Channel']} rows={data.closings.map((row) => [row.client, money(row.amount), row.closed_on, row.source_month || '—', row.channel || '—'])} /></Box>
    </Box>
  );
}

function SummaryTable({ title, headers, rows }) {
  return (
    <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="12px" overflow="hidden" boxShadow="0 1px 3px rgba(0,0,0,.06)">
      <Box px={4} py={3} fontWeight="700" borderBottom="1px solid" borderColor="gray.100">{title}</Box>
      <Box overflowX="auto"><Table size="sm"><Thead bg="gray.50"><Tr>{headers.map((item) => <Th key={item} fontSize="xs">{item}</Th>)}</Tr></Thead><Tbody>{rows.length === 0 ? <Tr><Td colSpan={headers.length} textAlign="center" py={8} color="gray.400">No data</Td></Tr> : rows.map((cells, index) => <Tr key={index}>{cells.map((cell, cellIndex) => <Td key={cellIndex}>{cell}</Td>)}</Tr>)}</Tbody></Table></Box>
    </Box>
  );
}
