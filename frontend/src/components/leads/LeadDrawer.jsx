import {
  Avatar, Badge, Box, Button, Divider, Flex, FormControl, FormLabel, Grid,
  HStack, IconButton, Input, Link, Select, SimpleGrid, Spinner, Tab, TabList,
  TabPanel, TabPanels, Tabs, Text, Textarea, Tooltip, useToast, VStack
} from '@chakra-ui/react';
import {
  ArrowLeft, ArrowUpRight, Briefcase, CalendarClock, CircleDot,
  FileText, Mail, MessageCircle, MessageSquare, Phone, RefreshCw,
  Save, Sparkles, User, X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../services/frappeApi';
import OwnerChip from './OwnerChip';

const actionOptions = [
  ['contacted', 'Contacted'], ['call_pickup', 'Call · pickup'], ['call_no_pickup', 'Call · no pickup'],
  ['whatsapp_replied', 'WhatsApp replied'], ['no_whatsapp', 'No WhatsApp'], ['no_response', 'No response'],
  ['meeting_set', 'Meeting set'], ['meeting_done', 'Meeting done'], ['proposal_requested', 'Proposal requested'],
  ['signed_client', 'Signed client'], ['non_quality', 'Non-quality'], ['bad_lead', 'Bad lead'],
  ['redundant', 'Duplicate / redundant'], ['confirmed', 'Event confirmed'], ['declined', 'Declined']
];

const quickActions = [
  ['call_pickup', 'Call pickup'], ['call_no_pickup', 'No pickup'],
  ['whatsapp_replied', 'WhatsApp replied'], ['meeting_set', 'Set meeting']
];

const outcomes = ['', 'Pickup', 'No Pickup', 'Replied', 'No WhatsApp', 'Meeting Set', 'Meeting Done', 'Proposal Requested', 'No Response', 'Non-Quality', 'Bad Lead', 'Redundant'];
const channels = ['', 'Meta', 'TikTok', 'Google', 'Founder Series', 'Boss / Manual', 'Talent', 'Past Client', 'Website'];

function plainText(value) {
  if (!value) return '';
  const element = document.createElement('div');
  element.innerHTML = String(value);
  return (element.textContent || element.innerText || '').trim();
}

function formatDate(value, relative = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  if (relative) {
    const seconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (Math.abs(seconds) < 60) return 'just now';
    const minutes = Math.round(seconds / 60);
    if (Math.abs(minutes) < 60) return `${Math.abs(minutes)}m ${minutes >= 0 ? 'ago' : 'from now'}`;
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return `${Math.abs(hours)}h ${hours >= 0 ? 'ago' : 'from now'}`;
    const days = Math.round(hours / 24);
    if (Math.abs(days) < 30) return `${Math.abs(days)}d ${days >= 0 ? 'ago' : 'from now'}`;
  }
  return date.toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function activityPresentation(activity) {
  const type = activity.activity_type;
  if (type === 'comment') {
    return { title: plainText(activity.content), label: String(activity.name || '').startsWith('alist-activity-') ? 'Workbook history' : 'Comment', icon: MessageSquare, color: '#e8384f' };
  }
  if (type === 'creation') return { title: activity.data || 'Lead created', label: 'Created', icon: Sparkles, color: '#4b7bd8' };
  if (['changed', 'added', 'removed'].includes(type)) {
    const data = activity.data || {};
    const value = data.value || 'empty';
    const old = data.old_value ? `${data.old_value} → ` : '';
    return { title: `${data.field_label || data.field || 'Field'}: ${old}${value}`, label: 'Record update', icon: RefreshCw, color: '#7c5ac2' };
  }
  if (type === 'communication') {
    return { title: activity.data?.subject || plainText(activity.data?.content) || 'Email activity', label: 'Email', icon: Mail, color: '#315ea8' };
  }
  if (type === 'incoming_call' || type === 'outgoing_call') {
    return { title: activity.summary || activity.status || type.replaceAll('_', ' '), label: 'Call', icon: Phone, color: '#197a48' };
  }
  if (type === 'attachment_log') return { title: activity.data?.file_name || 'Attachment updated', label: 'File', icon: FileText, color: '#5f6773' };
  return { title: plainText(activity.data) || type?.replaceAll('_', ' ') || 'Activity', label: 'Activity', icon: CircleDot, color: '#5f6773' };
}

function TimelineItem({ activity, last }) {
  const presentation = activityPresentation(activity);
  const Icon = presentation.icon;
  const workbook = String(activity.name || '').startsWith('alist-activity-');
  return (
    <Flex gap={3} position="relative" pb={last ? 0 : 5}>
      {!last && <Box position="absolute" left="15px" top="31px" bottom="-2px" w="1px" bg="gray.150" />}
      <Flex flex="0 0 auto" w="31px" h="31px" borderRadius="full" bg={`${presentation.color}16`} color={presentation.color} align="center" justify="center" zIndex={1}>
        <Icon size={14} />
      </Flex>
      <Box minW={0} flex={1} pt="1px">
        <Flex align="center" justify="space-between" gap={3}>
          <HStack spacing={2} minW={0}>
            <Text fontSize="11px" fontWeight="750" color="gray.600">{presentation.label}</Text>
            {workbook && <Badge bg="gray.100" color="gray.500" borderRadius="full" px={2} textTransform="none" fontSize="9px">imported</Badge>}
          </HStack>
          <Text fontSize="10px" color="gray.400" whiteSpace="nowrap">{formatDate(activity.creation || activity.communication_date, true)}</Text>
        </Flex>
        <Text mt={1.5} fontSize="12px" color="gray.700" lineHeight="1.55" whiteSpace="pre-wrap">{presentation.title || 'Activity recorded'}</Text>
        {activity.owner && <Text mt={1} fontSize="10px" color="gray.400">{workbook ? 'A-List workbook' : activity.owner}</Text>}
      </Box>
    </Flex>
  );
}

function DetailField({ label, children }) {
  return (
    <Box>
      <Text fontSize="10px" color="gray.500" textTransform="uppercase" letterSpacing=".06em" fontWeight="700">{label}</Text>
      <Text mt={1} fontSize="12px" color="gray.800" lineHeight="1.5" whiteSpace="pre-wrap">{children || '—'}</Text>
    </Box>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <Box border="1px solid" borderColor="gray.100" borderRadius="12px" p={4} bg="white">
      <HStack mb={4}><Icon size={15} color="#697386" /><Text fontSize="12px" fontWeight="750">{title}</Text></HStack>
      {children}
    </Box>
  );
}

export default function LeadDetailPanel({ name, onClose, onChanged }) {
  const { settings } = useApp();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [confirmedValue, setConfirmedValue] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [comment, setComment] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [ownerBusy, setOwnerBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.leadDetail(name);
      setData(result);
      const lead = result.lead;
      setForm({
        organization: lead.organization || '', email: lead.email || '', mobile_no: lead.mobile_no || '',
        alist_channel: lead.alist_channel || '', alist_annual_sales_band: lead.alist_annual_sales_band || '',
        alist_monthly_sales_text: lead.alist_monthly_sales_text || '', alist_business_type: lead.alist_business_type || '',
        alist_service_required: lead.alist_service_required || '', alist_last_outcome: lead.alist_last_outcome || '',
        alist_next_follow_up: toLocalInput(lead.alist_next_follow_up), alist_remark: lead.alist_remark || ''
      });
    } catch (error) {
      toast({ title: 'Could not load lead', description: error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  }, [name, toast]);

  useEffect(() => { load(); }, [load]);

  const changed = async () => {
    await load();
    await onChanged?.();
  };

  const timeline = useMemo(() => {
    if (!data) return [];
    return [...(data.timeline || []), ...(data.calls || [])].sort((a, b) =>
      new Date(b.creation || b.communication_date) - new Date(a.creation || a.communication_date));
  }, [data]);

  const logAction = async () => {
    if (!action) return;
    if (action === 'meeting_set' && !scheduledFor) {
      toast({ title: 'Choose the meeting date and time', status: 'warning' });
      return;
    }
    if (action === 'signed_client' && !confirmedValue) {
      toast({ title: 'Add the confirmed value', status: 'warning' });
      return;
    }
    setActionBusy(true);
    try {
      await api.applyAction({ name, action, note: actionNote, scheduled_for: scheduledFor || null, confirmed_value: confirmedValue || null });
      setAction(''); setActionNote(''); setScheduledFor(''); setConfirmedValue('');
      toast({ title: 'Activity logged', status: 'success', duration: 1600 });
      await changed();
    } catch (error) {
      toast({ title: 'Could not log activity', description: error.message, status: 'error' });
    } finally {
      setActionBusy(false);
    }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    setCommentBusy(true);
    try {
      await api.addLeadComment({ name, content: comment });
      setComment('');
      await changed();
    } catch (error) {
      toast({ title: 'Could not add comment', description: error.message, status: 'error' });
    } finally {
      setCommentBusy(false);
    }
  };

  const saveDetails = async () => {
    setSaving(true);
    try {
      await api.updateLeadDetails({ name, values: form, modified: data.lead.modified });
      toast({ title: 'Lead saved', status: 'success', duration: 1600 });
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
      <Flex className="lead-detail-panel" align="center" justify="center"><Spinner color="alist.500" /></Flex>
    );
  }
  if (!data) return null;
  const lead = data.lead;
  const phone = String(lead.mobile_no || '').replace(/\D/g, '');

  return (
    <Flex className="lead-detail-panel" direction="column" minW={0} bg="white" borderLeft="1px solid" borderColor="gray.150">
      <Box px={5} pt={4} pb={4} borderBottom="1px solid" borderColor="gray.100">
        <Flex align="center" justify="space-between" mb={4}>
          <Button display={{ base: 'inline-flex', xl: 'none' }} size="sm" variant="ghost" leftIcon={<ArrowLeft size={15} />} onClick={onClose}>Leads</Button>
          <Text display={{ base: 'none', xl: 'block' }} fontSize="10px" color="gray.400" fontWeight="700" letterSpacing=".06em">{lead.name}</Text>
          <HStack>
            <Tooltip label="Refresh lead"><IconButton size="sm" variant="ghost" aria-label="Refresh lead" icon={<RefreshCw size={15} />} onClick={load} isLoading={loading} /></Tooltip>
            <IconButton size="sm" variant="ghost" aria-label="Close lead" icon={<X size={17} />} onClick={onClose} />
          </HStack>
        </Flex>
        <Flex align="flex-start" gap={3}>
          <Avatar name={lead.lead_name || lead.first_name} size="md" bg="alist.500" color="white" />
          <Box minW={0} flex={1}>
            <Text fontSize="18px" fontWeight="760" letterSpacing="-.02em" isTruncated>{lead.lead_name || lead.first_name || 'Unnamed lead'}</Text>
            <Text mt={0.5} fontSize="12px" color="gray.500" isTruncated>{lead.organization || 'No organization'}</Text>
            <HStack mt={2} spacing={2} flexWrap="wrap"><Badge borderRadius="full" bg="gray.100" color="gray.700" px={2.5} py={1} textTransform="none">{lead.status}</Badge><OwnerChip owner={lead.alist_pic_name} /></HStack>
          </Box>
        </Flex>
        <HStack mt={4} spacing={2}>
          <Button as={Link} href={phone ? `https://wa.me/${phone}` : undefined} target="_blank" isDisabled={!phone} size="sm" variant="outline" leftIcon={<MessageCircle size={14} />}>WhatsApp</Button>
          <Button as={Link} href={lead.email ? `mailto:${lead.email}` : undefined} isDisabled={!lead.email} size="sm" variant="outline" leftIcon={<Mail size={14} />}>Email</Button>
          {data.deal && <Button as={Link} href={`/crm/deals/${data.deal.name}`} target="_blank" size="sm" variant="outline" rightIcon={<ArrowUpRight size={13} />}>Deal</Button>}
        </HStack>
      </Box>

      <Tabs display="flex" flex={1} minH={0} flexDirection="column" colorScheme="red" isLazy>
        <TabList px={5} borderColor="gray.100">
          <Tab fontSize="12px" fontWeight="700" px={0} mr={5}>Activity</Tab>
          <Tab fontSize="12px" fontWeight="700" px={0} mr={5}>Details</Tab>
          <Tab fontSize="12px" fontWeight="700" px={0} mr={5}>Tasks & notes</Tab>
          <Tab fontSize="12px" fontWeight="700" px={0}>Files</Tab>
        </TabList>
        <TabPanels flex={1} minH={0} overflow="hidden">
          <TabPanel h="100%" overflowY="auto" px={5} py={4}>
            <Box border="1px solid" borderColor="gray.100" borderRadius="12px" p={4} bg="#fbfbfc">
              <Flex align="center" justify="space-between" mb={3}>
                <HStack><Sparkles size={15} color="#e8384f" /><Text fontSize="12px" fontWeight="750">Log an activity</Text></HStack>
                <Text fontSize="10px" color="gray.400">updates status automatically</Text>
              </Flex>
              <Flex gap={1.5} flexWrap="wrap" mb={3}>
                {quickActions.map(([key, label]) => <Button key={key} size="xs" variant={action === key ? 'solid' : 'outline'} bg={action === key ? '#15181d' : 'white'} color={action === key ? 'white' : 'gray.600'} _hover={{ bg: action === key ? '#15181d' : 'gray.50' }} onClick={() => setAction(key)}>{label}</Button>)}
              </Flex>
              <Select size="sm" value={action} onChange={(event) => setAction(event.target.value)} bg="white">
                <option value="">Choose any activity…</option>
                {actionOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </Select>
              {action === 'meeting_set' && <Input mt={2} size="sm" type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} bg="white" />}
              {action === 'signed_client' && <Input mt={2} size="sm" type="number" value={confirmedValue} onChange={(event) => setConfirmedValue(event.target.value)} placeholder="Confirmed value (RM)" bg="white" />}
              <Textarea mt={2} size="sm" rows={2} resize="vertical" value={actionNote} onChange={(event) => setActionNote(event.target.value)} placeholder="Add context for the next person…" bg="white" />
              <Flex mt={2} justify="flex-end"><Button size="sm" bg="#15181d" color="white" _hover={{ bg: '#272b31' }} onClick={logAction} isDisabled={!action} isLoading={actionBusy}>Log activity</Button></Flex>
            </Box>

            <Box mt={5}>
              <Flex align="center" justify="space-between" mb={4}>
                <Text fontSize="12px" fontWeight="750">Timeline</Text>
                <Badge borderRadius="full" bg="gray.100" color="gray.500" textTransform="none">{timeline.length}</Badge>
              </Flex>
              {timeline.length ? timeline.map((item, index) => <TimelineItem key={`${item.name || item.creation}-${index}`} activity={item} last={index === timeline.length - 1} />) : <Text py={8} textAlign="center" color="gray.400" fontSize="12px">No activity yet.</Text>}
            </Box>

            <Box mt={5} borderTop="1px solid" borderColor="gray.100" pt={4}>
              <Text fontSize="11px" fontWeight="750" mb={2}>Add a comment</Text>
              <Textarea size="sm" rows={2} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Leave an internal note…" />
              <Flex mt={2} justify="flex-end"><Button size="sm" variant="outline" leftIcon={<MessageSquare size={14} />} onClick={addComment} isDisabled={!comment.trim()} isLoading={commentBusy}>Comment</Button></Flex>
            </Box>
          </TabPanel>

          <TabPanel h="100%" overflowY="auto" px={5} py={4}>
            <VStack spacing={3} align="stretch">
              <Section title="Contact" icon={User}>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl><FormLabel>Organization</FormLabel><Input size="sm" value={form.organization} onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))} /></FormControl>
                  <FormControl><FormLabel>PIC</FormLabel><Select size="sm" value={lead.alist_pic_name || ''} onChange={(event) => changeOwner(event.target.value)} isDisabled={ownerBusy}><option value="">Unassigned</option>{Object.keys(settings?.owner_colors || {}).map((owner) => <option key={owner}>{owner}</option>)}</Select></FormControl>
                  <FormControl><FormLabel>Phone / WhatsApp</FormLabel><Input size="sm" value={form.mobile_no} onChange={(event) => setForm((current) => ({ ...current, mobile_no: event.target.value }))} /></FormControl>
                  <FormControl><FormLabel>Email</FormLabel><Input size="sm" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></FormControl>
                  <FormControl><FormLabel>Channel</FormLabel><Select size="sm" value={form.alist_channel} onChange={(event) => setForm((current) => ({ ...current, alist_channel: event.target.value }))}>{channels.map((channel) => <option key={channel}>{channel || 'Not set'}</option>)}</Select></FormControl>
                </SimpleGrid>
              </Section>
              <Section title="Qualification" icon={Briefcase}>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl><FormLabel>Sales tahunan</FormLabel><Input size="sm" value={form.alist_annual_sales_band} onChange={(event) => setForm((current) => ({ ...current, alist_annual_sales_band: event.target.value }))} /></FormControl>
                  <FormControl><FormLabel>Sales bulanan</FormLabel><Input size="sm" value={form.alist_monthly_sales_text} onChange={(event) => setForm((current) => ({ ...current, alist_monthly_sales_text: event.target.value }))} /></FormControl>
                  <FormControl><FormLabel>Business type</FormLabel><Input size="sm" value={form.alist_business_type} onChange={(event) => setForm((current) => ({ ...current, alist_business_type: event.target.value }))} /></FormControl>
                  <FormControl><FormLabel>Service required</FormLabel><Input size="sm" value={form.alist_service_required} onChange={(event) => setForm((current) => ({ ...current, alist_service_required: event.target.value }))} /></FormControl>
                </SimpleGrid>
              </Section>
              <Section title="Follow-up" icon={CalendarClock}>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl><FormLabel>Last outcome</FormLabel><Select size="sm" value={form.alist_last_outcome} onChange={(event) => setForm((current) => ({ ...current, alist_last_outcome: event.target.value }))}>{outcomes.map((outcome) => <option key={outcome}>{outcome || 'Not set'}</option>)}</Select></FormControl>
                  <FormControl><FormLabel>Next follow-up</FormLabel><Input size="sm" type="datetime-local" value={form.alist_next_follow_up} onChange={(event) => setForm((current) => ({ ...current, alist_next_follow_up: event.target.value }))} /></FormControl>
                </SimpleGrid>
                <FormControl mt={3}><FormLabel>Remark</FormLabel><Textarea size="sm" rows={4} value={form.alist_remark} onChange={(event) => setForm((current) => ({ ...current, alist_remark: event.target.value }))} /></FormControl>
              </Section>
              <Section title="Source context" icon={FileText}>
                <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap={4}>
                  <DetailField label="Campaign">{lead.alist_campaign_name}</DetailField>
                  <DetailField label="Ad set">{lead.alist_adset_name}</DetailField>
                  <DetailField label="Ad">{lead.alist_ad_name}</DetailField>
                  <DetailField label="Form">{lead.alist_form_name}</DetailField>
                  <DetailField label="Workbook tab">{lead.alist_source_tab}</DetailField>
                  <DetailField label="Original status">{lead.alist_original_status}</DetailField>
                </Grid>
              </Section>
            </VStack>
            <Flex position="sticky" bottom={0} mt={4} py={3} bg="white" borderTop="1px solid" borderColor="gray.100" justify="flex-end"><Button leftIcon={<Save size={15} />} bg="#15181d" color="white" _hover={{ bg: '#272b31' }} onClick={saveDetails} isLoading={saving}>Save changes</Button></Flex>
          </TabPanel>

          <TabPanel h="100%" overflowY="auto" px={5} py={4}>
            <Text fontSize="12px" fontWeight="750" mb={3}>Tasks</Text>
            {(data.tasks || []).length ? (data.tasks || []).map((task) => <Box key={task.name} mb={2} p={3} border="1px solid" borderColor="gray.100" borderRadius="10px"><Flex justify="space-between"><Text fontSize="12px" fontWeight="700">{task.title || task.subject || task.name}</Text><Badge>{task.status || 'Open'}</Badge></Flex><Text mt={1} fontSize="11px" color="gray.500">{formatDate(task.due_date || task.modified)}</Text></Box>) : <Text color="gray.400" fontSize="12px" py={4}>No tasks linked to this lead.</Text>}
            <Divider my={5} />
            <Text fontSize="12px" fontWeight="750" mb={3}>Notes</Text>
            {(data.notes || []).length ? (data.notes || []).map((note) => <Box key={note.name} mb={2} p={3} border="1px solid" borderColor="gray.100" borderRadius="10px"><Text fontSize="12px" fontWeight="700">{note.title || 'Note'}</Text><Text mt={1} fontSize="11px" color="gray.600">{plainText(note.content || note.note)}</Text></Box>) : <Text color="gray.400" fontSize="12px" py={4}>No notes linked to this lead.</Text>}
          </TabPanel>

          <TabPanel h="100%" overflowY="auto" px={5} py={4}>
            {(data.attachments || []).length ? (data.attachments || []).map((file) => <Flex key={file.name} align="center" gap={3} p={3} mb={2} border="1px solid" borderColor="gray.100" borderRadius="10px"><Flex w="34px" h="34px" borderRadius="8px" bg="gray.100" align="center" justify="center"><FileText size={15} /></Flex><Box minW={0} flex={1}><Text fontSize="12px" fontWeight="700" isTruncated>{file.file_name}</Text><Text fontSize="10px" color="gray.500">{formatDate(file.creation)}</Text></Box><IconButton as={Link} href={file.file_url} target="_blank" aria-label="Open file" size="sm" variant="ghost" icon={<ArrowUpRight size={14} />} /></Flex>) : <Flex py={12} align="center" direction="column" color="gray.400"><FileText size={24} /><Text mt={3} fontSize="12px">No files attached to this lead.</Text></Flex>}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
}
