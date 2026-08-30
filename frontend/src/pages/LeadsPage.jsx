import {
  Badge, Box, Button, Flex, Grid, HStack, IconButton, Input, InputGroup,
  InputLeftElement, Select, SimpleGrid, Spinner, Text
} from '@chakra-ui/react';
import {
  CalendarClock, ChevronLeft, ChevronRight, CircleDollarSign, Plus,
  RefreshCw, Search, Target, UserCheck, Users
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CreateLeadModal from '../components/leads/CreateLeadModal';
import LeadDetailPanel from '../components/leads/LeadDrawer';
import LeadGrid from '../components/leads/LeadGrid';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/frappeApi';

const PAGE_SIZE = 50;
const channels = ['Meta', 'TikTok', 'Google', 'Founder Series', 'Boss / Manual', 'Talent', 'Past Client', 'Website'];
const statuses = ['New', 'Contacted', 'Meeting Set', 'Meeting Done', 'Converted', 'Disqualified', 'Duplicate'];

function Metric({ icon: Icon, label, value, accent, active, onClick }) {
  return (
    <Button
      h="auto"
      minH="82px"
      variant="unstyled"
      textAlign="left"
      onClick={onClick}
      className="lead-metric"
      borderColor={active ? '#e8384f' : 'gray.100'}
      bg={active ? '#fff6f7' : 'white'}
    >
      <Flex align="center" gap={3} px={4} py={3}>
        <Flex w="36px" h="36px" borderRadius="10px" bg={accent || '#f3f4f6'} align="center" justify="center">
          <Icon size={17} color={active ? '#e8384f' : '#4a5568'} />
        </Flex>
        <Box minW={0}>
          <Text fontSize="21px" fontWeight="750" lineHeight="1.1">{Number(value || 0).toLocaleString()}</Text>
          <Text mt={1} fontSize="11px" fontWeight="650" color="gray.500" textTransform="uppercase" letterSpacing=".055em">{label}</Text>
        </Box>
      </Flex>
    </Button>
  );
}

export default function LeadsPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { settings } = useApp();
  const [data, setData] = useState({ rows: [], count: 0 });
  const [overview, setOverview] = useState({ status_counts: {}, owner_counts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', alist_channel: '', alist_pic_name: '', month: '' });
  const [orderBy, setOrderBy] = useState('alist_lead_datetime desc');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchDraft.trim()), 250);
    return () => clearTimeout(timeout);
  }, [searchDraft]);

  useEffect(() => setPage(1), [search, filters, orderBy]);

  const loadOverview = useCallback(async () => {
    setOverview(await api.leadOverview());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      setData(await api.listLeads({
        filters: cleanFilters,
        search,
        start: (page - 1) * PAGE_SIZE,
        page_length: PAGE_SIZE,
        order_by: orderBy
      }));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [filters, orderBy, page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadOverview(); }, [loadOverview]);

  const refresh = useCallback(async () => {
    await Promise.all([load(), loadOverview()]);
  }, [load, loadOverview]);

  const statusCounts = overview.status_counts || {};
  const cards = [
    { label: 'All leads', value: overview.total, icon: Users, status: '', accent: '#f3f4f6' },
    { label: 'New', value: statusCounts.New, icon: Target, status: 'New', accent: '#eef2f7' },
    { label: 'Contacted', value: statusCounts.Contacted, icon: UserCheck, status: 'Contacted', accent: '#fff4e6' },
    {
      label: 'Meeting set',
      value: statusCounts['Meeting Set'],
      icon: CalendarClock,
      status: 'Meeting Set',
      accent: '#eef2ff'
    },
    { label: 'Converted', value: statusCounts.Converted, icon: CircleDollarSign, status: 'Converted', accent: '#eafaf1' }
  ];

  const totalPages = Math.max(Math.ceil(data.count / PAGE_SIZE), 1);
  const pageLabel = useMemo(() => {
    if (!data.count) return '0 leads';
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, data.count);
    return `${start}–${end} of ${data.count.toLocaleString()}`;
  }, [data.count, page]);

  return (
    <Box h="calc(100vh - 74px)" overflow="hidden" bg="#f6f7f9">
      <Flex h="100%" direction="column">
        <Box px={{ base: 4, xl: 6 }} pt={5} pb={4} bg="white" borderBottom="1px solid" borderColor="gray.100">
          <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={4} mb={4}>
            <Box>
              <HStack spacing={2}>
                <Text fontSize="23px" fontWeight="760" letterSpacing="-.03em">Leads</Text>
                <Badge borderRadius="full" px={2.5} py={1} bg="gray.100" color="gray.600" textTransform="none">{overview.total?.toLocaleString() || '—'}</Badge>
              </HStack>
              <Text mt={1} color="gray.500" fontSize="13px">Qualify, follow up and close without leaving the lead record.</Text>
            </Box>
            <HStack>
              <IconButton aria-label="Refresh" icon={<RefreshCw size={16} />} variant="outline" onClick={refresh} isLoading={loading} />
              <Button leftIcon={<Plus size={17} />} bg="#15181d" color="white" _hover={{ bg: '#272b31' }} onClick={() => setCreateOpen(true)}>Create lead</Button>
            </HStack>
          </Flex>

          <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} spacing={2.5}>
            {cards.map((card) => (
              <Metric
                key={card.label}
                {...card}
                active={filters.status === card.status}
                onClick={() => setFilters((current) => ({ ...current, status: card.status }))}
              />
            ))}
          </SimpleGrid>
        </Box>

        <Grid flex={1} minH={0} templateColumns={{ base: 'minmax(0, 1fr)', xl: leadId ? 'minmax(680px, 1fr) 560px' : 'minmax(0, 1fr)' }}>
          <Flex minW={0} minH={0} direction="column" px={{ base: 3, xl: 5 }} py={4}>
            <Flex gap={2} mb={3} align="center" flexWrap={{ base: 'wrap', lg: 'nowrap' }}>
              <InputGroup maxW={{ base: '100%', lg: '360px' }} bg="white">
                <InputLeftElement pointerEvents="none"><Search size={16} color="#8b95a5" /></InputLeftElement>
                <Input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search name, company, phone or email" borderColor="gray.200" />
              </InputGroup>
              <Select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} bg="white" w={{ base: 'calc(50% - 4px)', lg: '150px' }}>
                <option value="">All statuses</option>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </Select>
              <Select value={filters.alist_channel} onChange={(event) => setFilters((current) => ({ ...current, alist_channel: event.target.value }))} bg="white" w={{ base: 'calc(50% - 4px)', lg: '155px' }}>
                <option value="">All channels</option>
                {channels.map((channel) => <option key={channel}>{channel}</option>)}
              </Select>
              <Select value={filters.alist_pic_name} onChange={(event) => setFilters((current) => ({ ...current, alist_pic_name: event.target.value }))} bg="white" w={{ base: 'calc(50% - 4px)', lg: '140px' }}>
                <option value="">All PICs</option>
                {Object.keys(settings?.owner_colors || {}).map((owner) => <option key={owner}>{owner}</option>)}
              </Select>
              <Input type="month" value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))} bg="white" w={{ base: 'calc(50% - 4px)', lg: '160px' }} />
              <Select value={orderBy} onChange={(event) => setOrderBy(event.target.value)} bg="white" w={{ base: '100%', lg: '170px' }} ml={{ lg: 'auto' }}>
                <option value="alist_lead_datetime desc">Newest lead</option>
                <option value="alist_lead_datetime asc">Oldest lead</option>
                <option value="modified desc">Recently updated</option>
                <option value="lead_name asc">Name A–Z</option>
              </Select>
            </Flex>

            {error && <Box mb={3} px={4} py={3} borderRadius="10px" bg="red.50" color="red.700" fontSize="sm">{error}</Box>}
            <Box flex={1} minH={0} position="relative">
              {loading && data.rows.length === 0 ? (
                <Flex h="100%" align="center" justify="center"><Spinner color="alist.500" /></Flex>
              ) : (
                <LeadGrid rows={data.rows} loading={loading} selectedName={leadId} onOpen={(name) => navigate(`/leads/${encodeURIComponent(name)}`)} />
              )}
            </Box>

            <Flex align="center" justify="space-between" pt={3}>
              <Text color="gray.500" fontSize="12px">{pageLabel}</Text>
              <HStack spacing={1}>
                <IconButton size="sm" aria-label="Previous page" icon={<ChevronLeft size={16} />} variant="outline" bg="white" isDisabled={page <= 1} onClick={() => setPage((value) => value - 1)} />
                <Text minW="70px" textAlign="center" fontSize="12px" color="gray.600">{page} / {totalPages}</Text>
                <IconButton size="sm" aria-label="Next page" icon={<ChevronRight size={16} />} variant="outline" bg="white" isDisabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} />
              </HStack>
            </Flex>
          </Flex>

          {leadId && (
            <LeadDetailPanel
              name={leadId}
              onClose={() => navigate('/leads')}
              onChanged={refresh}
            />
          )}
        </Grid>
      </Flex>

      <CreateLeadModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(name) => {
          setCreateOpen(false);
          refresh();
          navigate(`/leads/${encodeURIComponent(name)}`);
        }}
      />
    </Box>
  );
}
