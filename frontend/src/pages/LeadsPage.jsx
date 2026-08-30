import {
  Box, Button, Flex, HStack, IconButton, Input, InputGroup, InputLeftElement,
  Menu, MenuButton, MenuDivider, MenuGroup, MenuItem, MenuList, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select,
  Spinner, Text, Textarea, Tooltip, useToast
} from '@chakra-ui/react';
import {
  Bookmark, ChevronDown, ChevronLeft, ChevronRight, Columns, Download, Plus,
  RefreshCw, Rows, Search, X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CreateLeadModal from '../components/leads/CreateLeadModal';
import FunnelStrip from '../components/leads/FunnelStrip';
import LeadTable from '../components/leads/LeadTable';
import { ACTION_GROUPS, CHANNELS } from '../components/leads/actions';
import { ErrorBanner } from '../components/ui';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/frappeApi';
import { tokens } from '../theme';

const PAGE_SIZE = 50;
const VIEWS_KEY = 'alist-crm-saved-views-v1';
const DEFAULT_FILTERS = { status: '', alist_channel: '', alist_pic_name: '', month: '' };
const DEFAULT_ORDER = 'alist_lead_datetime desc';

function loadViews() {
  try { return JSON.parse(localStorage.getItem(VIEWS_KEY)) || []; } catch { return []; }
}

function saveViews(views) {
  localStorage.setItem(VIEWS_KEY, JSON.stringify(views));
}

/** Small dialog for row/bulk actions that need a datetime or a value. */
function ActionDialog({ target, onClose, onDone }) {
  const toast = useToast();
  const [scheduledFor, setScheduledFor] = useState('');
  const [confirmedValue, setConfirmedValue] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setScheduledFor(''); setConfirmedValue(''); setNote(''); }, [target]);
  if (!target) return null;
  const { lead, action } = target;

  const submit = async () => {
    if (action.needsSchedule && !scheduledFor) {
      toast({ title: 'Choose the meeting date and time', status: 'warning' });
      return;
    }
    if (action.needsValue && !confirmedValue) {
      toast({ title: 'Add the confirmed value', status: 'warning' });
      return;
    }
    setBusy(true);
    try {
      await api.applyAction({
        name: lead.name,
        action: action.key,
        note,
        scheduled_for: scheduledFor || null,
        confirmed_value: confirmedValue || null
      });
      toast({ title: `${action.label} logged`, status: 'success', duration: 1600 });
      onDone();
    } catch (error) {
      toast({ title: 'Could not log activity', description: error.message, status: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="sm" isCentered>
      <ModalOverlay bg="blackAlpha.400" />
      <ModalContent>
        <ModalHeader fontSize="16px" pb={1}>
          {action.label}
          <Text mt={0.5} fontSize="12.5px" fontWeight="400" color={tokens.muted}>
            {lead.lead_name || lead.organization || lead.name}
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={2}>
          {action.needsSchedule && (
            <Input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} mb={3} autoFocus />
          )}
          {action.needsValue && (
            <Input type="number" placeholder="Confirmed value (RM)" value={confirmedValue} onChange={(event) => setConfirmedValue(event.target.value)} mb={3} autoFocus />
          )}
          <Textarea rows={2} placeholder="Add context for the next person…" value={note} onChange={(event) => setNote(event.target.value)} />
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="ink" onClick={submit} isLoading={busy}>Log activity</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function BulkBar({ count, owners, onAssign, onAction, onClear, busy }) {
  if (!count) return null;
  const bulkActions = ACTION_GROUPS.flatMap((group) => group.actions).filter((action) => !action.needsSchedule && !action.needsValue);
  return (
    <Flex
      position="absolute"
      bottom="18px"
      left="50%"
      transform="translateX(-50%)"
      zIndex={40}
      align="center"
      gap={1}
      pl={4}
      pr={2}
      py={2}
      bg={tokens.ink}
      color="white"
      borderRadius="10px"
      boxShadow="0 8px 30px rgba(20, 21, 25, .35)"
    >
      <Text fontSize="13px" fontWeight="700" mr={2} whiteSpace="nowrap">{count} selected</Text>
      <Menu placement="top">
        <MenuButton as={Button} size="sm" variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} _active={{ bg: 'whiteAlpha.300' }} rightIcon={<ChevronDown size={13} />} isLoading={busy}>
          Pass to PIC
        </MenuButton>
        <MenuList color={tokens.ink}>
          {owners.map((owner) => <MenuItem key={owner} onClick={() => onAssign(owner)}>{owner}</MenuItem>)}
        </MenuList>
      </Menu>
      <Menu placement="top">
        <MenuButton as={Button} size="sm" variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} _active={{ bg: 'whiteAlpha.300' }} rightIcon={<ChevronDown size={13} />} isLoading={busy}>
          Log activity
        </MenuButton>
        <MenuList color={tokens.ink} maxH="320px" overflowY="auto">
          {bulkActions.map((action) => (
            <MenuItem key={action.key} icon={<action.icon size={14} />} onClick={() => onAction(action)}>{action.label}</MenuItem>
          ))}
        </MenuList>
      </Menu>
      <IconButton aria-label="Clear selection" icon={<X size={15} />} size="sm" variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} onClick={onClear} />
    </Flex>
  );
}

export default function LeadsPage() {
  const navigate = useNavigate();
  const { settings } = useApp();
  const toast = useToast();
  const searchRef = useRef(null);

  const [data, setData] = useState({ rows: [], count: 0 });
  const [overview, setOverview] = useState({ status_counts: {}, owner_counts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [orderBy, setOrderBy] = useState(DEFAULT_ORDER);
  const [createOpen, setCreateOpen] = useState(false);
  const [views, setViews] = useState(loadViews);
  const [selection, setSelection] = useState(() => new Set());
  const [actionTarget, setActionTarget] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [density, setDensity] = useState('compact');
  const [visibleColumns, setVisibleColumns] = useState({ qualification: true, outcome: true, followup: true });

  const owners = Object.keys(settings?.owner_colors || {});

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchDraft.trim()), 250);
    return () => clearTimeout(timeout);
  }, [searchDraft]);

  useEffect(() => { setPage(1); setSelection(new Set()); }, [search, filters, orderBy]);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const loadOverview = useCallback(async () => {
    try { setOverview(await api.leadOverview()); } catch { /* funnel is non-critical */ }
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

  const setFilter = (key) => (value) => setFilters((current) => ({ ...current, [key]: value }));

  // ---- saved views ----
  const currentView = useMemo(
    () => JSON.stringify({ filters, orderBy }),
    [filters, orderBy]
  );
  const isDefaultView = currentView === JSON.stringify({ filters: DEFAULT_FILTERS, orderBy: DEFAULT_ORDER });
  const matchedView = views.find((view) => JSON.stringify({ filters: { ...DEFAULT_FILTERS, ...view.filters }, orderBy: view.orderBy || DEFAULT_ORDER }) === currentView);

  const applyView = (view) => {
    setFilters({ ...DEFAULT_FILTERS, ...(view?.filters || {}) });
    setOrderBy(view?.orderBy || DEFAULT_ORDER);
  };

  const saveCurrentView = () => {
    const label = window.prompt('Name this view', suggestedViewName());
    if (!label) return;
    const next = [...views.filter((view) => view.label !== label), { label, filters, orderBy }];
    setViews(next);
    saveViews(next);
  };

  const suggestedViewName = () => {
    const parts = [];
    if (filters.alist_pic_name) parts.push(filters.alist_pic_name);
    if (filters.alist_channel) parts.push(filters.alist_channel);
    if (filters.status) parts.push(filters.status);
    if (filters.month) parts.push(filters.month);
    return parts.join(' · ') || 'My view';
  };

  const removeView = (label) => {
    const next = views.filter((view) => view.label !== label);
    setViews(next);
    saveViews(next);
  };

  // ---- row + bulk actions ----
  const runAction = async (lead, action) => {
    if (action.needsSchedule || action.needsValue) {
      setActionTarget({ lead, action });
      return;
    }
    try {
      await api.applyAction({ name: lead.name, action: action.key });
      toast({ title: `${action.label} · ${lead.lead_name || lead.name}`, status: 'success', duration: 1600 });
      await refresh();
    } catch (actionError) {
      toast({ title: 'Could not log activity', description: actionError.message, status: 'error' });
    }
  };

  const runBulk = async (worker, doneLabel) => {
    const names = [...selection];
    setBulkBusy(true);
    let failed = 0;
    for (const name of names) {
      try { await worker(name); } catch { failed += 1; }
    }
    setBulkBusy(false);
    setSelection(new Set());
    toast({
      title: failed ? `${doneLabel} · ${names.length - failed} done, ${failed} failed` : `${doneLabel} · ${names.length} leads`,
      status: failed ? 'warning' : 'success',
      duration: 2400
    });
    await refresh();
  };

  const bulkAssign = (owner) => runBulk((name) => api.reassign({ name, owner_label: owner }), `Passed to ${owner}`);
  const bulkAction = (action) => runBulk((name) => api.applyAction({ name, action: action.key }), action.label);

  const toggleRow = (name) => setSelection((current) => {
    const next = new Set(current);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  const toggleAll = () => setSelection((current) => {
    const allSelected = data.rows.length > 0 && data.rows.every((row) => current.has(row.name));
    return allSelected ? new Set() : new Set(data.rows.map((row) => row.name));
  });

  const totalPages = Math.max(Math.ceil(data.count / PAGE_SIZE), 1);
  const pageLabel = useMemo(() => {
    if (!data.count) return 'No leads';
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, data.count);
    return `${start}–${end} of ${data.count.toLocaleString()}`;
  }, [data.count, page]);

  const exportCsv = () => {
    const columns = ['Lead', 'Organization', 'Status', 'PIC', 'Channel', 'Phone', 'Email', 'Qualification', 'Latest outcome', 'Next follow-up'];
    const value = (input) => `"${String(input || '').replaceAll('"', '""')}"`;
    const lines = [columns.map(value).join(','), ...data.rows.map((lead) => [
      lead.lead_name || lead.first_name, lead.organization, lead.status, lead.alist_pic_name,
      lead.alist_channel || lead.source, lead.mobile_no, lead.email, lead.alist_annual_sales_band,
      lead.alist_last_outcome, lead.alist_next_follow_up
    ].map(value).join(','))];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `a-list-leads-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click();
    URL.revokeObjectURL(url);
  };

  const toggleColumn = (key) => setVisibleColumns((current) => ({ ...current, [key]: !current[key] }));

  return (
    <Box h={{ base: 'auto', lg: '100vh' }} minH={{ base: 'calc(100vh - 56px)', lg: '100vh' }} overflow="hidden" display="flex" flexDirection="column" px={{ base: 4, xl: 7 }} py={{ base: 4, xl: 6 }}>
      <PageHeader
        kicker="KOL database"
        title="Leads, in the KOL database system"
        description={`${Number(overview.total || 0).toLocaleString()} total · ${Number(overview.overdue || overview.overdue_count || 0).toLocaleString()} overdue · ${Number((overview.status_counts?.Disqualified || 0) + (overview.status_counts?.Duplicate || 0)).toLocaleString()} out of funnel`}
        actions={<HStack spacing={2}><Button leftIcon={<RefreshCw size={15} />} variant="quiet" onClick={refresh} isLoading={loading && data.rows.length > 0}>Refresh</Button><Button leftIcon={<Download size={15} />} variant="quiet" onClick={exportCsv}>Export CSV</Button><Button leftIcon={<Plus size={16} />} variant="signal" onClick={() => setCreateOpen(true)}>Create lead</Button></HStack>}
      />

      <Box mb={5}><FunnelStrip overview={overview} activeStatus={filters.status} onStatus={setFilter('status')} /></Box>

      <Flex flex={1} minH={0} minW={0} direction="column" position="relative">
          <Flex gap={2} mb={2.5} align="center" flexWrap="wrap">
            <HStack spacing={1.5} flexWrap="wrap">
              <Button
                size="sm"
                variant={isDefaultView ? 'ink' : 'quiet'}
                onClick={() => applyView(null)}
              >
                All leads
              </Button>
              {views.map((view) => {
                const active = matchedView?.label === view.label;
                return (
                  <HStack key={view.label} spacing={0} role="group">
                    <Button size="sm" variant={active ? 'ink' : 'quiet'} borderRightRadius={0} onClick={() => applyView(view)}>
                      {view.label}
                    </Button>
                    <IconButton
                      aria-label={`Delete view ${view.label}`}
                      icon={<X size={12} />}
                      size="sm"
                      variant={active ? 'ink' : 'quiet'}
                      borderLeftRadius={0}
                      borderLeft={active ? '1px solid rgba(255,255,255,.25)' : '0'}
                      onClick={() => removeView(view.label)}
                    />
                  </HStack>
                );
              })}
              {!isDefaultView && !matchedView && (
                <Button size="sm" variant="quiet" leftIcon={<Bookmark size={13} />} color={tokens.muted} onClick={saveCurrentView}>
                  Save view
                </Button>
              )}
            </HStack>
          </Flex>

          <Flex gap={2} mb={3} p={3} align="center" flexWrap={{ base: 'wrap', xl: 'nowrap' }} bg="white" border="1px solid" borderColor={tokens.borderSoft} borderRadius="12px" boxShadow="0 1px 2px rgba(21,24,29,.04)">
            <InputGroup maxW={{ base: '100%', xl: '330px' }} size="sm">
              <InputLeftElement pointerEvents="none"><Search size={14} color={tokens.faint} /></InputLeftElement>
              <Input
                ref={searchRef}
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search name, company, phone, email — press /"
                bg="white"
              />
            </InputGroup>
            <Select size="sm" bg="white" value={filters.alist_channel} onChange={(event) => setFilter('alist_channel')(event.target.value)} w={{ base: 'calc(50% - 4px)', xl: '145px' }}>
              <option value="">All channels</option>
              {CHANNELS.map((channel) => <option key={channel}>{channel}</option>)}
            </Select>
            <Select size="sm" bg="white" value={filters.alist_pic_name} onChange={(event) => setFilter('alist_pic_name')(event.target.value)} w={{ base: 'calc(50% - 4px)', xl: '120px' }}>
              <option value="">All PICs</option>
              {owners.map((owner) => <option key={owner}>{owner}</option>)}
            </Select>
            <Input size="sm" type="month" bg="white" value={filters.month} onChange={(event) => setFilter('month')(event.target.value)} w={{ base: 'calc(50% - 4px)', xl: '150px' }} aria-label="Filter by month" />
            <Select size="sm" bg="white" value={orderBy} onChange={(event) => setOrderBy(event.target.value)} w={{ base: '100%', xl: '165px' }} ml={{ xl: 'auto' }} aria-label="Sort order">
              <option value="alist_lead_datetime desc">Newest lead</option>
              <option value="alist_lead_datetime asc">Oldest lead</option>
              <option value="modified desc">Recently updated</option>
              <option value="lead_name asc">Name A–Z</option>
            </Select>
            <Menu closeOnSelect={false}>
              <MenuButton as={Button} size="sm" variant="quiet" leftIcon={<Columns size={14} />} rightIcon={<ChevronDown size={12} />}>Columns</MenuButton>
              <MenuList><MenuGroup title="Visible columns">{Object.entries(visibleColumns).map(([key, shown]) => <MenuItem key={key} onClick={() => toggleColumn(key)}>{shown ? '✓ ' : ''}{key.charAt(0).toUpperCase() + key.slice(1)}</MenuItem>)}</MenuGroup></MenuList>
            </Menu>
            <Button size="sm" variant="quiet" leftIcon={<Rows size={14} />} onClick={() => setDensity((value) => value === 'compact' ? 'comfortable' : 'compact')}>{density === 'compact' ? 'Compact' : 'Comfortable'}</Button>
          </Flex>

          {error && <Box mb={3}><ErrorBanner message={error} onRetry={load} /></Box>}

          <Box flex={1} minH={{ base: '400px', lg: 0 }} position="relative">
            {loading && data.rows.length === 0 ? (
              <Flex h="100%" minH="300px" align="center" justify="center" bg="white" border="1px solid" borderColor={tokens.border} borderRadius="10px">
                <Spinner color="alist.500" />
              </Flex>
            ) : (
              <LeadTable
                rows={data.rows}
                loading={loading}
                onOpen={(name) => navigate(`/leads/${encodeURIComponent(name)}`)}
                onAction={runAction}
                selection={selection}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
                density={density}
                visibleColumns={visibleColumns}
              />
            )}
            <BulkBar
              count={selection.size}
              owners={owners}
              onAssign={bulkAssign}
              onAction={bulkAction}
              onClear={() => setSelection(new Set())}
              busy={bulkBusy}
            />
          </Box>

          <Flex align="center" justify="space-between" pt={3}>
            <Text className="num" color={tokens.muted} fontSize="12px">{pageLabel}</Text>
            <HStack spacing={1}>
              <IconButton size="sm" aria-label="Previous page" icon={<ChevronLeft size={15} />} variant="quiet" isDisabled={page <= 1} onClick={() => setPage((value) => value - 1)} />
              <Text className="num" minW="64px" textAlign="center" fontSize="12px" color={tokens.inkSoft}>{page} / {totalPages}</Text>
              <IconButton size="sm" aria-label="Next page" icon={<ChevronRight size={15} />} variant="quiet" isDisabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} />
            </HStack>
          </Flex>
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
      <ActionDialog
        target={actionTarget}
        onClose={() => setActionTarget(null)}
        onDone={async () => { setActionTarget(null); await refresh(); }}
      />
    </Box>
  );
}
