import { Box, Button, Flex, HStack, Input, Select, Spinner, Text, useDisclosure } from '@chakra-ui/react';
import { RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import LeadDrawer from '../components/leads/LeadDrawer';
import LeadGrid from '../components/leads/LeadGrid';
import { api } from '../services/frappeApi';

const tabs = ['All Leads', 'Meta', 'TikTok', 'Google', 'Founder Series', 'Boss / Manual', 'Talent', 'Past Client'];
const currentMonth = new Date().toISOString().slice(0, 7);

export default function LeadsPage() {
  const [month, setMonth] = useState(currentMonth);
  const [tab, setTab] = useState('All Leads');
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ rows: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const drawer = useDisclosure();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { month };
      if (tab !== 'All Leads') filters.alist_channel = tab;
      setData(await api.listLeads({ filters, search, page_length: 250 }));
    } finally { setLoading(false); }
  }, [month, tab, search]);

  useEffect(() => { load(); }, [load]);
  const openLead = (name) => { setSelected(name); drawer.onOpen(); };

  return (
    <Box px={{ base: 4, xl: 8 }} py={6}>
      <PageHeader title="Leads" description="The same working table, with the history and reporting handled underneath." actions={
        <HStack><Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} bg="white" w="170px" /><Button variant="outline" leftIcon={<RefreshCw size={16} />} onClick={load}>Refresh</Button></HStack>
      } />
      <Flex gap={2} mb={4} overflowX="auto" pb={1}>
        {tabs.map((item) => <Button key={item} size="sm" bg={tab === item ? '#15181d' : 'white'} color={tab === item ? 'white' : 'gray.600'} border="1px solid" borderColor="gray.200" _hover={{ bg: tab === item ? '#15181d' : 'gray.50' }} onClick={() => setTab(item)}>{item}</Button>)}
      </Flex>
      <Flex bg="white" border="1px solid" borderColor="gray.100" borderRadius="12px" p={3} mb={4} align="center" gap={3}>
        <Search size={17} color="#718096" /><Input variant="unstyled" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, company, phone, or email" />
        <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">{loading ? <Spinner size="xs" /> : `${data.count.toLocaleString()} leads`}</Text>
      </Flex>
      <LeadGrid rows={data.rows} loading={loading} onReload={load} onOpen={openLead} />
      <LeadDrawer name={selected} isOpen={drawer.isOpen} onClose={drawer.onClose} />
    </Box>
  );
}
