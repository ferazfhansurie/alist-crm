import {
  Box, Button, Flex, FormControl, FormLabel, Grid, HStack, IconButton, Input, Link,
  Menu, MenuButton, MenuDivider, MenuGroup, MenuItem, MenuList, Select, SimpleGrid,
  Spinner, Tab, TabList, TabPanel, TabPanels, Tabs, Text, Textarea, Tooltip,
  useToast, VStack
} from '@chakra-ui/react';
import {
  ArrowLeft, Briefcase, CalendarClock, ChevronDown, CircleDot, ClipboardList,
  FileText, ListChecks, Mail, MessageCircle, MessageSquare, PenLine, Phone,
  RefreshCw, Save, StickyNote, Trophy, User, X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../services/frappeApi';
import { statusPalette, tokens } from '../../theme';
import {
  ChannelTag, EmptyState, OwnerTag, SectionLabel, StatusTag,
  formatDate, formatRelative, humanizeBand, money
} from '../ui';
import { ACTIONS_BY_KEY, ACTION_GROUPS, CHANNELS, OUTCOMES, QUICK_ACTIONS, isOverdue, waLink } from './actions';

const FUNNEL_STAGES = ['New', 'Contacted', 'Meeting Set', 'Meeting Done', 'Converted'];
const LOST_STATUSES = ['Disqualified', 'Duplicate'];

const LOG_TYPE_STYLES = {
  Call: { icon: Phone, color: '#1f8a54' },
  WhatsApp: { icon: MessageCircle, color: '#1f8a54' },
  Contact: { icon: User, color: '#3563ab' },
  Meeting: { icon: CalendarClock, color: '#63419f' },
  Proposal: { icon: PenLine, color: '#9a5200' },
  Conversion: { icon: Trophy, color: '#9a5200' },
  Qualification: { icon: ListChecks, color: '#a3242f' },
  Event: { icon: CalendarClock, color: '#63419f' },
  Reassignment: { icon: User, color: '#3563ab' }
};

function plainText(value) {
  if (!value) return '';
  const element = document.createElement('div');
  element.innerHTML = String(value);
  return (element.textContent || element.innerText || '').trim();
}

function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Classifies raw frappe activity items + a-list structured logs into
 * one timeline vocabulary: log | comment | email | call | system | file.
 */
function classifyActivity(activity) {
  const type = activity.activity_type;
  if (type === 'comment') {
    const isAlistLog = String(activity.name || '').startsWith('alist-activity-');
    if (isAlistLog) {
      const text = plainText(activity.content);
      const match = /^([A-Za-z]+):\s*([\s\S]*)$/.exec(text);
      const logType = match ? match[1] : 'Activity';
      const style = LOG_TYPE_STYLES[logType] || { icon: ClipboardList, color: tokens.inkSoft };
      const body = match ? match[2].trim() : text;
      return {
        kind: 'log',
        label: logType,
        title: body || text,
        icon: style.icon,
        color: style.color,
        by: null
      };
    }
    return { kind: 'comment', label: 'Comment', title: plainText(activity.content), icon: MessageSquare, color: tokens.red, by: activity.owner };
  }
  if (type === 'creation') {
    return { kind: 'system', label: 'Created', title: activity.data || 'Lead created', icon: CircleDot, color: '#3563ab', by: activity.owner };
  }
  if (['changed', 'added', 'removed'].includes(type)) {
    const data = activity.data || {};
    const value = data.value || 'empty';
    const old = data.old_value ? `${data.old_value} → ` : '';
    return { kind: 'system', label: 'Record update', title: `${data.field_label || data.field || 'Field'}: ${old}${value}`, icon: RefreshCw, color: tokens.muted, by: activity.owner };
  }
  if (type === 'communication') {
    return { kind: 'email', label: 'Email', title: activity.data?.subject || plainText(activity.data?.content) || 'Email activity', icon: Mail, color: '#3563ab', by: activity.owner };
  }
  if (type === 'incoming_call' || type === 'outgoing_call') {
    return { kind: 'call', label: type === 'incoming_call' ? 'Incoming call' : 'Outgoing call', title: activity.summary || activity.status || 'Call', icon: Phone, color: '#1f8a54', by: activity.owner };
  }
  if (type === 'attachment_log') {
    return { kind: 'file', label: 'File', title: activity.data?.file_name || 'Attachment updated', icon: FileText, color: tokens.muted, by: activity.owner };
  }
  return { kind: 'system', label: 'Activity', title: plainText(activity.data) || String(type || 'activity').replaceAll('_', ' '), icon: CircleDot, color: tokens.muted, by: activity.owner };
}

const TIMELINE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'log', label: 'Logs' },
  { key: 'comment', label: 'Comments' },
  { key: 'system', label: 'System' }
];

function TimelineItem({ entry, last }) {
  const Icon = entry.icon;
  return (
    <Flex gap={3} position="relative" pb={last ? 0 : 4} pl="1px">
      {!last && <Box className="timeline-rule" />}
      <Flex flex="0 0 auto" w="28px" h="28px" borderRadius="8px" bg={`${entry.color}14`} color={entry.color} align="center" justify="center" zIndex={1}>
        <Icon size={13} />
      </Flex>
      <Box minW={0} flex={1} pt="1px" pb={3}>
        <Flex align="baseline" justify="space-between" gap={3}>
          <Text fontSize="11px" fontWeight="750" color={tokens.inkSoft}>{entry.label}</Text>
          <Tooltip label={formatDate(entry.when, true)}>
            <Text fontSize="10.5px" color={tokens.faint} whiteSpace="nowrap" className="num">{formatRelative(entry.when)}</Text>
          </Tooltip>
        </Flex>
        <Text mt={1} fontSize="12.5px" color={tokens.inkSoft} lineHeight="1.55" whiteSpace="pre-wrap">
          {entry.title || 'Activity recorded'}
        </Text>
        {entry.by && <Text mt={0.5} fontSize="10.5px" color={tokens.faint}>{entry.by}</Text>}
      </Box>
    </Flex>
  );
}

function FactCell({ label, children }) {
  return (
    <Box minW={0}>
      <SectionLabel>{label}</SectionLabel>
      <Box mt="3px" fontSize="12.5px" color={tokens.ink} fontWeight="550">
        {children || <Text as="span" color={tokens.faint}>—</Text>}
      </Box>
    </Box>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <Box border="1px solid" borderColor={tokens.borderSoft} borderRadius="10px" p={4} bg="white">
      <HStack mb={4} spacing={2}>
        <Icon size={14} color={tokens.muted} />
        <Text fontSize="12px" fontWeight="750">{title}</Text>
      </HStack>
      {children}
    </Box>
  );
}

function CardShell({ title, meta, action, children, ...rest }) {
  return (
    <Box className="dc-card" {...rest}>
      <Flex className="dc-card-head">
        <Text as="strong">{title}</Text>
        {action || <Text as="span">{meta}</Text>}
      </Flex>
      {children}
    </Box>
  );
}

function LeadAvatar({ lead }) {
  const initials = String(lead.lead_name || lead.first_name || lead.organization || '?')
    .split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
  return (
    <Flex w="60px" h="60px" borderRadius="15px" bg={tokens.ink} color="white" align="center" justify="center" fontSize="20px" fontWeight="750" flexShrink={0}>
      {initials || '?'}
    </Flex>
  );
}

function StageRail({ status }) {
  const lost = LOST_STATUSES.includes(status);
  const reached = FUNNEL_STAGES.indexOf(status);
  return (
    <Box>
      <Box className="stage-rail" role="img" aria-label={`Stage: ${status}`}>
        {FUNNEL_STAGES.map((stage, index) => (
          <Box key={stage} data-done={!lost && reached >= index} data-lost={lost} />
        ))}
      </Box>
      <Flex mt="7px" justify="space-between" gap={2}>
        {FUNNEL_STAGES.map((stage) => (
          <Text key={stage} flex={1} textAlign="center" fontSize="9.5px" color={lost ? tokens.faint : stage === status ? tokens.ink : tokens.faint} fontWeight={stage === status ? '750' : '650'} textTransform="uppercase" letterSpacing=".04em">
            {stage}
          </Text>
        ))}
      </Flex>
      {lost && <Text mt={1.5} fontSize="10px" color={tokens.red} fontWeight="750" textAlign="right">Out of funnel · {status}</Text>}
    </Box>
  );
}

export default function LeadDetail({ name, onClose, onChanged }) {
  const { settings } = useApp();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [composerMode, setComposerMode] = useState('activity');
  const [action, setAction] = useState('');
  const [note, setNote] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [confirmedValue, setConfirmedValue] = useState('');
  const [composerBusy, setComposerBusy] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [ownerBusy, setOwnerBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await api.leadDetail(name);
      setData(result);
      const lead = result.lead;
      setForm({
        organization: lead.organization || '',
        email: lead.email || '',
        mobile_no: lead.mobile_no || '',
        alist_channel: lead.alist_channel || '',
        alist_annual_sales_band: lead.alist_annual_sales_band || '',
        alist_monthly_sales_text: lead.alist_monthly_sales_text || '',
        alist_business_type: lead.alist_business_type || '',
        alist_service_required: lead.alist_service_required || '',
        alist_last_outcome: lead.alist_last_outcome || '',
        alist_next_follow_up: toLocalInput(lead.alist_next_follow_up),
        alist_remark: lead.alist_remark || ''
      });
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => { load(); }, [load]);

  const changed = async () => {
    await load();
    await onChanged?.();
  };

  const timeline = useMemo(() => {
    if (!data) return [];
    const entries = [
      ...(data.timeline || []).map((item) => ({
        ...classifyActivity(item),
        when: item.creation || item.communication_date,
        id: item.name || item.creation
      })),
      ...(data.calls || []).map((call) => ({
        kind: 'call',
        label: call.type === 'Incoming' ? 'Incoming call' : 'Call',
        title: call.status || call.duration || 'Call',
        icon: Phone,
        color: '#1f8a54',
        by: call.caller || call.receiver,
        when: call.creation,
        id: call.name
      }))
    ];
    return entries.sort((a, b) => new Date(b.when) - new Date(a.when));
  }, [data]);

  const visibleTimeline = useMemo(() => {
    if (timelineFilter === 'all') return timeline;
    if (timelineFilter === 'log') return timeline.filter((entry) => ['log', 'call', 'email'].includes(entry.kind));
    if (timelineFilter === 'system') return timeline.filter((entry) => ['system', 'file'].includes(entry.kind));
    return timeline.filter((entry) => entry.kind === timelineFilter);
  }, [timeline, timelineFilter]);

  const selectedAction = ACTIONS_BY_KEY[action];

  const submitComposer = async () => {
    if (composerMode === 'comment') {
      if (!note.trim()) return;
      setComposerBusy(true);
      try {
        await api.addLeadComment({ name, content: note });
        setNote('');
        await changed();
      } catch (error) {
        toast({ title: 'Could not add comment', description: error.message, status: 'error' });
      } finally {
        setComposerBusy(false);
      }
      return;
    }
    if (!action) return;
    if (selectedAction?.needsSchedule && !scheduledFor) {
      toast({ title: 'Choose the meeting date and time', status: 'warning' });
      return;
    }
    if (selectedAction?.needsValue && !confirmedValue) {
      toast({ title: 'Add the confirmed value', status: 'warning' });
      return;
    }
    setComposerBusy(true);
    try {
      await api.applyAction({ name, action, note, scheduled_for: scheduledFor || null, confirmed_value: confirmedValue || null });
      setAction(''); setNote(''); setScheduledFor(''); setConfirmedValue('');
      toast({ title: 'Activity logged', status: 'success', duration: 1500 });
      await changed();
    } catch (error) {
      toast({ title: 'Could not log activity', description: error.message, status: 'error' });
    } finally {
      setComposerBusy(false);
    }
  };

  const saveDetails = async () => {
    setSaving(true);
    try {
      await api.updateLeadDetails({ name, values: form, modified: data.lead.modified });
      toast({ title: 'Lead saved', status: 'success', duration: 1500 });
      await changed();
    } catch (error) {
      toast({ title: 'Could not save lead', description: error.message, status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const changeOwner = async (owner) => {
    if (!owner || owner === data.lead.alist_pic_name) return;
    setOwnerBusy(true);
    try {
      await api.reassign({ name, owner_label: owner });
      await changed();
    } catch (error) {
      toast({ title: 'Could not reassign lead', description: error.message, status: 'error' });
    } finally {
      setOwnerBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <Flex className="lead-detail-panel" minH="calc(100vh - 56px)" align="center" justify="center">
        <Spinner color="alist.500" />
      </Flex>
    );
  }
  if (loadError && !data) {
    return (
      <Flex className="lead-detail-panel" minH="calc(100vh - 56px)" direction="column" align="center" justify="center" gap={3} px={8}>
        <Text fontSize="13px" color={tokens.redDeep} textAlign="center">{loadError}</Text>
        <HStack>
          <Button size="sm" variant="quiet" onClick={load}>Try again</Button>
          <Button size="sm" variant="ghost" onClick={onClose}>Back to leads</Button>
        </HStack>
      </Flex>
    );
  }
  if (!data) return null;

  const lead = data.lead;
  const wa = waLink(lead.mobile_no);
  const overdue = isOverdue(lead);
  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const detailsForm = (
    <VStack spacing={3} align="stretch">
      <Section title="Contact" icon={User}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <FormControl><FormLabel>Organization</FormLabel><Input size="sm" value={form.organization} onChange={setField('organization')} /></FormControl>
          <FormControl><FormLabel>Channel</FormLabel><Select size="sm" value={form.alist_channel} onChange={setField('alist_channel')}><option value="">Not set</option>{CHANNELS.map((channel) => <option key={channel}>{channel}</option>)}</Select></FormControl>
          <FormControl><FormLabel>Phone / WhatsApp</FormLabel><Input size="sm" value={form.mobile_no} onChange={setField('mobile_no')} /></FormControl>
          <FormControl><FormLabel>Email</FormLabel><Input size="sm" value={form.email} onChange={setField('email')} /></FormControl>
        </SimpleGrid>
      </Section>
      <Section title="Qualification" icon={Briefcase}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <FormControl><FormLabel>Sales tahunan</FormLabel><Input size="sm" value={form.alist_annual_sales_band} onChange={setField('alist_annual_sales_band')} /></FormControl>
          <FormControl><FormLabel>Sales bulanan</FormLabel><Input size="sm" value={form.alist_monthly_sales_text} onChange={setField('alist_monthly_sales_text')} /></FormControl>
          <FormControl><FormLabel>Business type</FormLabel><Input size="sm" value={form.alist_business_type} onChange={setField('alist_business_type')} /></FormControl>
          <FormControl><FormLabel>Service required</FormLabel><Input size="sm" value={form.alist_service_required} onChange={setField('alist_service_required')} /></FormControl>
        </SimpleGrid>
      </Section>
      <Section title="Follow-up" icon={CalendarClock}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <FormControl><FormLabel>Last outcome</FormLabel><Select size="sm" value={form.alist_last_outcome} onChange={setField('alist_last_outcome')}><option value="">Not set</option>{OUTCOMES.map((outcome) => <option key={outcome}>{outcome}</option>)}</Select></FormControl>
          <FormControl><FormLabel>Next follow-up</FormLabel><Input size="sm" type="datetime-local" value={form.alist_next_follow_up} onChange={setField('alist_next_follow_up')} /></FormControl>
        </SimpleGrid>
        <FormControl mt={3}><FormLabel>Remark</FormLabel><Textarea size="sm" rows={3} value={form.alist_remark} onChange={setField('alist_remark')} /></FormControl>
      </Section>
    </VStack>
  );

  const tasksAndNotes = (
    <Box>
      <SectionLabel mb={3}>Tasks</SectionLabel>
      {(data.tasks || []).length ? (data.tasks || []).map((task) => (
        <Flex key={task.name} mb={2} p={3} border="1px solid" borderColor={tokens.borderSoft} borderRadius="9px" align="center" justify="space-between" gap={3}>
          <Box minW={0}><Text fontSize="12.5px" fontWeight="650" isTruncated>{task.title || task.subject || task.name}</Text><Text mt={0.5} fontSize="11px" color={tokens.muted}>Due {formatDate(task.due_date || task.modified)}</Text></Box>
          <Text fontSize="10.5px" fontWeight="750" color={task.status === 'Done' ? tokens.ok : tokens.inkSoft} px={2} py={1} bg={task.status === 'Done' ? tokens.okWash : tokens.surfaceTint} borderRadius="5px">{task.status || 'Open'}</Text>
        </Flex>
      )) : <Text color={tokens.faint} fontSize="12.5px" py={2}>No tasks linked to this lead.</Text>}
      <SectionLabel mt={5} mb={3}>Notes</SectionLabel>
      {(data.notes || []).length ? (data.notes || []).map((noteItem) => (
        <Box key={noteItem.name} mb={2} p={3} border="1px solid" borderColor={tokens.borderSoft} borderRadius="9px"><HStack spacing={2}><StickyNote size={13} color={tokens.warn} /><Text fontSize="12.5px" fontWeight="650">{noteItem.title || 'Note'}</Text></HStack><Text mt={1.5} fontSize="12px" color={tokens.inkSoft} whiteSpace="pre-wrap">{plainText(noteItem.content || noteItem.note)}</Text></Box>
      )) : <Text color={tokens.faint} fontSize="12.5px" py={2}>No notes linked to this lead.</Text>}
    </Box>
  );

  return (
    <Box className="lead-detail-panel" px={{ base: 4, xl: 7 }} py={{ base: 4, xl: 6 }} maxW="1640px" mx="auto" w="100%">
      <Flex align="center" justify="space-between" mb={4} gap={4}>
        <Button size="sm" variant="ghost" leftIcon={<ArrowLeft size={15} />} onClick={onClose}>All leads</Button>
        <HStack spacing={2}><Text className="num" fontSize="11px" color={tokens.faint}>{lead.name}</Text><Tooltip label="Refresh lead"><IconButton size="sm" variant="quiet" aria-label="Refresh lead" icon={<RefreshCw size={14} />} onClick={load} isLoading={loading} /></Tooltip></HStack>
      </Flex>

      <Tabs colorScheme="red" isLazy>
        <Box position="relative" overflow="hidden" bg="white" border="1px solid" borderColor={tokens.borderSoft} borderRadius="16px" boxShadow="lift" _before={{ content: '""', position: 'absolute', inset: '0 auto 0 0', w: '5px', bg: `linear-gradient(180deg, ${tokens.red}, ${tokens.ink})` }}>
          <Box px={{ base: 5, xl: 7 }} pt={{ base: 5, xl: 6 }}>
            <Flex align={{ base: 'flex-start', lg: 'center' }} justify="space-between" gap={5} direction={{ base: 'column', lg: 'row' }}>
              <HStack align="center" spacing={4} minW={0}>
                <LeadAvatar lead={lead} />
                <Box minW={0}>
                  <HStack spacing={2.5} flexWrap="wrap"><Text fontSize={{ base: '24px', xl: '30px' }} fontWeight="750" letterSpacing="-.025em" lineHeight="1.1">{lead.lead_name || lead.first_name || 'Unnamed lead'}</Text><StatusTag status={lead.status} size="md" /></HStack>
                  <HStack mt={2} spacing={3} flexWrap="wrap"><Text fontSize="13px" color={tokens.muted}>{lead.organization || 'No organization'}</Text><ChannelTag channel={lead.alist_channel || lead.source} />{lead.alist_campaign_name && <Text fontSize="12px" color={tokens.faint}>{lead.alist_campaign_name}</Text>}</HStack>
                </Box>
              </HStack>
              <HStack spacing={2} flexWrap="wrap">
                <Button as={wa ? Link : undefined} href={wa || undefined} target="_blank" isDisabled={!wa} size="sm" variant="quiet" leftIcon={<MessageCircle size={14} />}>WhatsApp</Button>
                <Button as={lead.mobile_no ? Link : undefined} href={lead.mobile_no ? `tel:${lead.mobile_no}` : undefined} isDisabled={!lead.mobile_no} size="sm" variant="quiet" leftIcon={<Phone size={14} />}>Call</Button>
                <Button as={lead.email ? Link : undefined} href={lead.email ? `mailto:${lead.email}` : undefined} isDisabled={!lead.email} size="sm" variant="quiet" leftIcon={<Mail size={14} />}>Email</Button>
                <Menu placement="bottom-end"><MenuButton as={Button} size="sm" variant="quiet" rightIcon={<ChevronDown size={13} />} isLoading={ownerBusy}><OwnerTag owner={lead.alist_pic_name} /></MenuButton><MenuList minW="160px"><MenuGroup title="Pass to">{Object.keys(settings?.owner_colors || {}).map((owner) => <MenuItem key={owner} onClick={() => changeOwner(owner)}>{owner}</MenuItem>)}</MenuGroup></MenuList></Menu>
              </HStack>
            </Flex>

            <Box mt={6}><StageRail status={lead.status} /></Box>
            <SimpleGrid mt={6} columns={{ base: 2, md: 3, xl: 5 }} spacingX={6} spacingY={4}>
              <FactCell label="Phone">{lead.mobile_no}</FactCell><FactCell label="Email">{lead.email && <Text isTruncated>{lead.email}</Text>}</FactCell><FactCell label="Sales tahunan">{humanizeBand(lead.alist_annual_sales_band)}</FactCell><FactCell label="Lead in">{formatDate(lead.alist_lead_datetime, true)}</FactCell><FactCell label="Next follow-up">{lead.alist_next_follow_up && <Text color={overdue ? tokens.redDeep : tokens.ink} fontWeight={overdue ? '750' : '550'}>{formatDate(lead.alist_next_follow_up, true)}{overdue ? ' · overdue' : ''}</Text>}</FactCell>
            </SimpleGrid>
            {data.deal && <Flex mt={5} px={4} py={3} borderRadius="10px" bg={tokens.surfaceTint} border="1px solid" borderColor={tokens.border} align="center" gap={5} flexWrap="wrap"><HStack spacing={2}><Trophy size={14} color={tokens.warn} /><Text fontSize="12.5px" fontWeight="750">Deal · {data.deal.status}</Text></HStack><HStack spacing={5} className="num" fontSize="12px" color={tokens.inkSoft}>{Boolean(data.deal.alist_proposal_value) && <Text>Proposal {money(data.deal.alist_proposal_value, true)}</Text>}{Boolean(data.deal.alist_confirmed_value) && <Text fontWeight="750" color={tokens.ok}>Confirmed {money(data.deal.alist_confirmed_value, true)}</Text>}{data.deal.alist_next_follow_up && <Text>Next {formatDate(data.deal.alist_next_follow_up)}</Text>}</HStack></Flex>}
          </Box>
          <TabList mt={5} px={{ base: 5, xl: 7 }} borderColor={tokens.borderSoft}>
            {[['Activity', timeline.length], ['Details'], ['Tasks & notes', (data.tasks || []).length + (data.notes || []).length], ['Files', (data.attachments || []).length]].map(([label, count]) => <Tab key={label} fontSize="13px" fontWeight="650" px={0} mr={7} py={3} color={tokens.muted} _selected={{ color: tokens.ink, borderColor: tokens.red }}>{label}{count !== undefined && <Text as="span" ml={2} px={2} py="1px" borderRadius="full" bg={label === 'Activity' ? tokens.redWash : tokens.surfaceTint} color={label === 'Activity' ? tokens.redDeep : tokens.muted} fontSize="10.5px">{count}</Text>}</Tab>)}
          </TabList>
        </Box>

        <TabPanels mt={5}>
          <TabPanel p={0}>
            <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 350px' }} gap={5} alignItems="start">
              <VStack spacing={5} align="stretch">
                <CardShell title="Log activity" meta="Updates the lead status automatically">
                  <Box p={4}>
                    <Flex border="1px solid" borderColor={tokens.borderSoft} borderRadius="10px" overflow="hidden" mb={3} w="fit-content">
                {[['activity', 'Log activity', ClipboardList], ['comment', 'Comment', MessageSquare]].map(([mode, label, Icon]) => (
                  <Flex
                    key={mode}
                    as="button"
                    px={5}
                    align="center"
                    justify="center"
                    gap={2}
                    py={2.5}
                    bg={composerMode === mode ? 'white' : 'transparent'}
                    borderBottom="2px solid" borderColor={composerMode === mode ? tokens.red : 'transparent'}
                    color={composerMode === mode ? tokens.ink : tokens.muted}
                    fontSize="12px"
                    fontWeight="700"
                    onClick={() => setComposerMode(mode)}
                  >
                    <Icon size={13} />
                    {label}
                  </Flex>
                ))}
                    </Flex>
                {composerMode === 'activity' && (
                  <>
                    <Flex gap={1.5} flexWrap="wrap" mb={2.5}>
                      {QUICK_ACTIONS.map((key) => {
                        const quick = ACTIONS_BY_KEY[key];
                        const active = action === key;
                        return (
                          <Button
                            key={key}
                            size="xs"
                            variant={active ? 'ink' : 'quiet'}
                            leftIcon={<quick.icon size={12} />}
                            onClick={() => setAction(active ? '' : key)}
                          >
                            {quick.label}
                          </Button>
                        );
                      })}
                      <Menu placement="bottom-start" isLazy>
                        <MenuButton as={Button} size="xs" variant={action && !QUICK_ACTIONS.includes(action) ? 'ink' : 'quiet'} rightIcon={<ChevronDown size={12} />}>
                          {action && !QUICK_ACTIONS.includes(action) ? ACTIONS_BY_KEY[action].label : 'More'}
                        </MenuButton>
                        <MenuList maxH="330px" overflowY="auto" minW="215px">
                          {ACTION_GROUPS.map((group, index) => (
                            <Box key={group.label}>
                              {index > 0 && <MenuDivider my={1} />}
                              <MenuGroup title={group.label} fontSize="10.5px" textTransform="uppercase" letterSpacing=".07em" color={tokens.muted}>
                                {group.actions.map((item) => (
                                  <MenuItem key={item.key} icon={<item.icon size={14} />} onClick={() => setAction(item.key)}>
                                    {item.label}
                                  </MenuItem>
                                ))}
                              </MenuGroup>
                            </Box>
                          ))}
                        </MenuList>
                      </Menu>
                    </Flex>
                    {selectedAction?.needsSchedule && (
                      <Input mb={2} size="sm" type="datetime-local" bg="white" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} aria-label="Meeting date and time" />
                    )}
                    {selectedAction?.needsValue && (
                      <Input mb={2} size="sm" type="number" bg="white" value={confirmedValue} onChange={(event) => setConfirmedValue(event.target.value)} placeholder="Confirmed value (RM)" />
                    )}
                  </>
                )}
                <Textarea
                  size="sm"
                  rows={2}
                  resize="vertical"
                  bg="white"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={composerMode === 'activity' ? 'Add context for the next person…' : 'Leave an internal note…'}
                />
                <Flex mt={2.5} justify="space-between" align="center">
                  <Text fontSize="10.5px" color={tokens.faint}>
                    {composerMode === 'activity' ? 'Logging updates the lead status automatically.' : 'Comments stay on the timeline.'}
                  </Text>
                  <Button
                    size="sm"
                    variant="ink"
                    onClick={submitComposer}
                    isLoading={composerBusy}
                    isDisabled={composerMode === 'activity' ? !action : !note.trim()}
                  >
                    {composerMode === 'activity' ? 'Log activity' : 'Comment'}
                  </Button>
                </Flex>
                  </Box>
                </CardShell>

                <CardShell title="Activity timeline" meta={`${visibleTimeline.length} entries · newest first`}>
                  <Flex px={4} py={3} align="center" justify="space-between" borderBottom="1px solid" borderColor={tokens.borderSoft}>
                    <HStack spacing={1}>
                {TIMELINE_FILTERS.map((filter) => (
                  <Button
                    key={filter.key}
                    size="xs"
                    variant={timelineFilter === filter.key ? 'ink' : 'ghost'}
                    color={timelineFilter === filter.key ? 'white' : tokens.muted}
                    onClick={() => setTimelineFilter(filter.key)}
                  >
                    {filter.label}
                  </Button>
                ))}
                    </HStack>
                    <Text className="num" fontSize="11px" color={tokens.faint}>{timeline.length} total</Text>
                  </Flex>
                  <Box p={{ base: 4, xl: 5 }}>{visibleTimeline.length ? visibleTimeline.map((entry, index) => <TimelineItem key={`${entry.id}-${index}`} entry={entry} last={index === visibleTimeline.length - 1} />) : <EmptyState icon={CircleDot} title="Nothing here yet" hint="Logged calls, WhatsApps, meetings and comments appear on this timeline." py={8} />}</Box>
                </CardShell>
              </VStack>

              <VStack spacing={5} align="stretch">
                <CardShell title="Details" action={<Button size="xs" color="white" bg="whiteAlpha.200" leftIcon={<Save size={12} />} onClick={saveDetails} isLoading={saving} _hover={{ bg: 'whiteAlpha.300' }}>Save changes</Button>}><Box p={4}>{detailsForm}</Box></CardShell>
                <CardShell title="Source context" meta="Read-only"><SimpleGrid p={4} columns={2} spacingX={4} spacingY={4}><FactCell label="Campaign">{lead.alist_campaign_name}</FactCell><FactCell label="Ad set">{lead.alist_adset_name}</FactCell><FactCell label="Ad">{lead.alist_ad_name}</FactCell><FactCell label="Form">{lead.alist_form_name}</FactCell><FactCell label="Workbook tab">{lead.alist_source_tab}</FactCell><FactCell label="Original status">{lead.alist_original_status}</FactCell></SimpleGrid></CardShell>
                <CardShell title="Tasks and notes" meta="From Frappe · read-only"><Box p={4}>{tasksAndNotes}</Box></CardShell>
              </VStack>
            </Grid>
          </TabPanel>

          <TabPanel p={0}>
            <CardShell title="Lead details" action={<Button size="xs" color="white" bg="whiteAlpha.200" leftIcon={<Save size={12} />} onClick={saveDetails} isLoading={saving}>Save changes</Button>}><Box p={{ base: 4, xl: 6 }} maxW="980px">{detailsForm}</Box></CardShell>
          </TabPanel>

          <TabPanel p={0}>
            <CardShell title="Tasks and notes" meta="From Frappe · read-only"><Box p={{ base: 4, xl: 6 }} maxW="900px">{tasksAndNotes}</Box></CardShell>
          </TabPanel>

          <TabPanel p={0}>
            <CardShell title="Files" meta={`${(data.attachments || []).length} attachments`}><Box p={{ base: 4, xl: 6 }}>
            {(data.attachments || []).length ? (
              (data.attachments || []).map((file) => (
                <Flex key={file.name} align="center" gap={3} p={3} mb={2} border="1px solid" borderColor={tokens.borderSoft} borderRadius="8px">
                  <Flex w="32px" h="32px" borderRadius="7px" bg={tokens.surfaceTint} align="center" justify="center" color={tokens.muted} flexShrink={0}>
                    <FileText size={14} />
                  </Flex>
                  <Box minW={0} flex={1}>
                    <Link href={file.file_url} target="_blank" fontSize="12.5px" fontWeight="650" color={tokens.ink} _hover={{ color: tokens.red }} isTruncated display="block">
                      {file.file_name}
                    </Link>
                    <Text fontSize="10.5px" color={tokens.muted}>{formatDate(file.creation, true)}</Text>
                  </Box>
                </Flex>
              ))
            ) : (
              <EmptyState icon={FileText} title="No files yet" hint="Attachments added to this lead will be listed here." py={10} />
            )}
            </Box></CardShell>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
