import {
  Box, Button, Collapse, Flex, FormControl, FormLabel, Grid, HStack, Input,
  Select, SimpleGrid, Skeleton, Text, useDisclosure, useToast
} from '@chakra-ui/react';
import { CalendarDays, ChevronDown, ChevronUp, PenLine } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { ChartCard, DailyLeadsCplChart, DonutBreakdown, PaceToTargetChart } from '../components/reports/ReportCharts';
import { ErrorBanner, SectionLabel, Surface, money, percent } from '../components/ui';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/frappeApi';
import { tokens } from '../theme';

const currentMonth = new Date().toISOString().slice(0, 7);

function monthLabel(month) {
  const [year, monthPart] = String(month || '').split('-');
  if (!year) return month;
  return new Date(Number(year), Number(monthPart) - 1, 1)
    .toLocaleString('en-MY', { month: 'long', year: 'numeric' });
}

function PaceBlock({ label, actualLabel, targetLabel, progress, runRateLabel, tone }) {
  const clamped = Math.min(Number(progress || 0), 1);
  const over = Number(progress || 0) > 1;
  return (
    <Box flex={1} minW={0}>
      <SectionLabel>{label}</SectionLabel>
      <Flex mt={2} align="baseline" gap={2} flexWrap="wrap">
        <Text className="num" fontFamily="display" fontSize="30px" fontWeight="600" lineHeight={1}>
          {actualLabel}
        </Text>
        <Text className="num" fontSize="13px" color={tokens.muted}>/ {targetLabel}</Text>
        <Text className="num" ml="auto" fontSize="13px" fontWeight="750" color={over ? tokens.redDeep : tone}>
          {percent(progress, 0)}
        </Text>
      </Flex>
      <Box mt={3} h="6px" bg={tokens.borderSoft} borderRadius="4px" overflow="hidden">
        <Box h="100%" w={`${clamped * 100}%`} bg={over ? tokens.red : tone} borderRadius="4px" transition="width .3s ease" />
      </Box>
      <Text mt={2} fontSize="12px" color={tokens.muted}>{runRateLabel}</Text>
    </Box>
  );
}

function Efficiency({ label, value, hint }) {
  return (
    <Box>
      <SectionLabel>{label}</SectionLabel>
      <Text className="num" mt={1.5} fontSize="19px" fontWeight="750" lineHeight={1.1}>{value}</Text>
      {hint && <Text mt={1} fontSize="11.5px" color={tokens.muted}>{hint}</Text>}
    </Box>
  );
}

function ShareBar({ value, max, color }) {
  const width = max ? Math.max((value / max) * 100, value ? 3 : 0) : 0;
  return (
    <Flex align="center" gap={2} minW="120px">
      <Box flex={1} h="5px" bg={tokens.borderSoft} borderRadius="3px" overflow="hidden">
        <Box h="100%" w={`${width}%`} bg={color} borderRadius="3px" />
      </Box>
      <Text className="num" fontSize="12.5px" fontWeight="650" minW="34px" textAlign="right">{value.toLocaleString()}</Text>
    </Flex>
  );
}

function TableShell({ title, right, children }) {
  return (
    <Surface overflow="hidden">
      <Flex px={4} py={3} align="center" justify="space-between" borderBottom="1px solid" borderColor={tokens.borderSoft}>
        <Text fontSize="13px" fontWeight="750">{title}</Text>
        {right}
      </Flex>
      <Box overflowX="auto">{children}</Box>
    </Surface>
  );
}

export default function DailyReportPage() {
  const { settings } = useApp();
  const toast = useToast();
  const inputPanel = useDisclosure();
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    channel: 'Meta',
    lead_spend: '',
    awareness_spend: '',
    remark: ''
  });

  const load = useCallback(async () => {
    setError('');
    try {
      setReport(await api.dailyReport(month));
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [month]);

  useEffect(() => { setReport(null); load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await api.saveMarketing(form);
      toast({ title: 'Daily input saved', status: 'success', duration: 1800 });
      setForm((value) => ({ ...value, lead_spend: '', awareness_spend: '', remark: '' }));
      await load();
    } catch (saveError) {
      toast({ title: 'Could not save', description: saveError.message, status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const totals = report?.totals || {};
  const days = report?.days || [];
  const channels = report?.channels || [];
  const owners = report?.owners || [];
  const maxDayLeads = useMemo(() => Math.max(...days.map((day) => day.leads), 1), [days]);
  const maxChannelLeads = useMemo(() => Math.max(...channels.map((channel) => channel.leads), 1), [channels]);
  const totalChannelSpend = channels.reduce((sum, channel) => sum + Number(channel.spend || 0), 0);

  return (
    <Box px={{ base: 4, xl: 8 }} py={6} maxW="1640px" mx="auto" w="100%">
      <PageHeader
        kicker="Marketing"
        title={`Daily report · ${monthLabel(month)}`}
        description="Leads and meetings come straight from the lead records. Spend, awareness and remarks are the only manual inputs."
        actions={(
          <HStack spacing={2}>
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} bg="white" w="165px" aria-label="Report month" />
            {settings?.can_manage && (
              <Button
                variant={inputPanel.isOpen ? 'ink' : 'quiet'}
                leftIcon={<PenLine size={14} />}
                rightIcon={inputPanel.isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                onClick={inputPanel.onToggle}
              >
                Log spend
              </Button>
            )}
          </HStack>
        )}
      />

      {error && <Box mb={5}><ErrorBanner message={error} onRetry={load} /></Box>}

      {settings?.can_manage && (
        <Collapse in={inputPanel.isOpen} animateOpacity>
          <Surface p={4} mb={5}>
            <SectionLabel mb={3}>Daily marketing input</SectionLabel>
            <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(5, minmax(0, 1fr)) auto' }} gap={3} alignItems="end">
              <FormControl><FormLabel>Date</FormLabel><Input type="date" size="sm" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></FormControl>
              <FormControl>
                <FormLabel>Channel</FormLabel>
                <Select size="sm" value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}>
                  {Object.keys(settings.channel_colors || {}).map((channel) => <option key={channel}>{channel}</option>)}
                </Select>
              </FormControl>
              <FormControl><FormLabel>Lead spend</FormLabel><Input type="number" size="sm" value={form.lead_spend} onChange={(event) => setForm({ ...form, lead_spend: event.target.value })} /></FormControl>
              <FormControl><FormLabel>Awareness</FormLabel><Input type="number" size="sm" value={form.awareness_spend} onChange={(event) => setForm({ ...form, awareness_spend: event.target.value })} /></FormControl>
              <FormControl><FormLabel>Remark</FormLabel><Input size="sm" value={form.remark} onChange={(event) => setForm({ ...form, remark: event.target.value })} /></FormControl>
              <Button variant="signal" size="sm" onClick={save} isLoading={saving}>Save</Button>
            </Grid>
          </Surface>
        </Collapse>
      )}

      {!report && !error ? (
        <Box>
          <Skeleton h="150px" borderRadius="10px" mb={5} />
          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5}>
            <Skeleton h="260px" borderRadius="10px" />
            <Skeleton h="260px" borderRadius="10px" />
          </SimpleGrid>
        </Box>
      ) : report && (
        <>
          <Surface px={{ base: 4, xl: 6 }} py={5} mb={5}>
            <Flex gap={{ base: 6, lg: 10 }} direction={{ base: 'column', lg: 'row' }}>
              <PaceBlock
                label="Lead pace"
                actualLabel={Number(totals.leads || 0).toLocaleString()}
                targetLabel={Number(totals.lead_target || 0).toLocaleString()}
                progress={totals.lead_progress}
                tone={tokens.ink}
                runRateLabel={
                  totals.remaining_leads > 0 && totals.daily_lead_target > 0
                    ? `${totals.remaining_leads.toLocaleString()} to go — needs ${Math.ceil(totals.daily_lead_target)} leads/day for the rest of the month`
                    : totals.remaining_leads === 0 && totals.lead_target > 0
                      ? 'Monthly lead target reached'
                      : 'No pace pressure for this month'
                }
              />
              <Box w="1px" bg={tokens.borderSoft} display={{ base: 'none', lg: 'block' }} />
              <PaceBlock
                label="Spend pace"
                actualLabel={money(totals.spend, true)}
                targetLabel={money(totals.spend_target, true)}
                progress={totals.spend_progress}
                tone={tokens.ok}
                runRateLabel={
                  totals.remaining_spend > 0 && totals.daily_spend_target > 0
                    ? `${money(totals.remaining_spend, true)} left — ${money(totals.daily_spend_target, true)}/day available`
                    : 'Budget fully deployed'
                }
              />
            </Flex>
            <Flex mt={6} pt={5} borderTop="1px solid" borderColor={tokens.borderSoft} gap={{ base: 5, xl: 10 }} flexWrap="wrap">
              <Efficiency label="Average CPL" value={money(totals.average_cpl)} />
              <Efficiency label="Meetings" value={Number(totals.meetings || 0).toLocaleString()} hint={`${money(totals.average_cost_per_meeting)} per meeting`} />
              <Efficiency label="Awareness spend" value={money(totals.awareness_spend, true)} hint="on top of lead spend" />
            </Flex>
          </Surface>

          <ChartCard title="Pace to target" meta={`Cumulative leads against the ${Number(totals.lead_target || 0).toLocaleString()} monthly target`} mb={5}>
            <PaceToTargetChart days={days} target={totals.lead_target} />
          </ChartCard>

          <ChartCard title="Leads and cost per lead by day" meta={`${days.length} active days · CPL on the dashed line`} mb={5}>
            <DailyLeadsCplChart days={days} />
          </ChartCard>

          <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 2fr) minmax(310px, 1fr)' }} gap={5} mb={5}>
            <TableShell title="Channel performance" right={<Text className="num" fontSize="11.5px" color={tokens.muted}>{money(totalChannelSpend, true)} spend</Text>}>
              <table className="report-table">
                <thead>
                  <tr><th>Channel</th><th style={{ minWidth: 150 }}>Leads</th><th>Meetings</th><th>Spend</th><th>CPL</th><th>Cost / meeting</th></tr>
                </thead>
                <tbody>
                  {channels.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: tokens.faint, padding: '28px 0' }}>No channel data this month</td></tr>
                  )}
                  {channels.map((row) => (
                    <tr key={row.channel}>
                      <td>
                        <HStack spacing={2}>
                          <Box w="7px" h="7px" borderRadius="full" bg={row.color} />
                          <Text fontSize="13px" fontWeight="600">{row.channel}</Text>
                        </HStack>
                      </td>
                      <td><ShareBar value={row.leads} max={maxChannelLeads} color={row.color} /></td>
                      <td>{row.meetings.toLocaleString()}</td>
                      <td>{money(row.spend)}</td>
                      <td>{row.leads ? money(row.cpl) : '—'}</td>
                      <td>{row.meetings ? money(row.cost_per_meeting) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>

            <ChartCard title="Channel mix" meta={`${channels.length} active channels`}>
              <DonutBreakdown items={channels} valueKey="leads" labelKey="channel" centerLabel="Leads" />
            </ChartCard>
          </Grid>

          <TableShell title="Per PIC" right={<Text className="num" fontSize="11.5px" color={tokens.muted}>{owners.length} people</Text>}>
              <table className="report-table">
                <thead>
                  <tr><th>PIC</th><th>Leads</th><th>Meetings</th><th>Lead → meeting</th></tr>
                </thead>
                <tbody>
                  {owners.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: tokens.faint, padding: '28px 0' }}>No PIC data this month</td></tr>
                  )}
                  {owners.map((row) => (
                    <tr key={row.owner}>
                      <td>
                        <HStack spacing={2}>
                          <Box w="8px" h="8px" borderRadius="2px" bg={settings?.owner_colors?.[row.owner] || tokens.borderStrong} />
                          <Text fontSize="13px" fontWeight="600">{row.owner}</Text>
                        </HStack>
                      </td>
                      <td>{row.leads.toLocaleString()}</td>
                      <td>{row.meetings.toLocaleString()}</td>
                      <td>{row.leads ? percent(row.meetings / row.leads) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </TableShell>

          <Box h={5} />

          <TableShell
            title="Daily breakdown"
            right={(
              <HStack spacing={1.5} color={tokens.muted}>
                <CalendarDays size={13} />
                <Text className="num" fontSize="11.5px">{days.length} active days</Text>
              </HStack>
            )}
          >
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th><th style={{ minWidth: 160 }}>Leads</th><th>Meetings</th><th>Spend</th>
                  <th>CPL</th><th>Cost / meeting</th><th>Awareness</th><th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {days.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: tokens.faint, padding: '28px 0' }}>Nothing recorded for this month yet</td></tr>
                )}
                {days.map((row) => (
                  <tr key={row.date}>
                    <td style={{ fontWeight: 600 }}>{new Date(row.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</td>
                    <td><ShareBar value={row.leads} max={maxDayLeads} color={tokens.ink} /></td>
                    <td>{row.meetings.toLocaleString()}</td>
                    <td>{money(row.spend)}</td>
                    <td>{row.leads ? money(row.cpl) : '—'}</td>
                    <td>{row.meetings ? money(row.cost_per_meeting) : '—'}</td>
                    <td>{row.awareness ? money(row.awareness) : '—'}</td>
                    <td style={{ whiteSpace: 'normal', minWidth: 160, color: tokens.muted, fontSize: '12px' }}>{row.remark || '—'}</td>
                  </tr>
                ))}
              </tbody>
              {days.length > 0 && (
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td>{Number(totals.leads || 0).toLocaleString()}</td>
                    <td>{Number(totals.meetings || 0).toLocaleString()}</td>
                    <td>{money(totals.spend)}</td>
                    <td>{money(totals.average_cpl)}</td>
                    <td>{money(totals.average_cost_per_meeting)}</td>
                    <td>{money(totals.awareness_spend)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </TableShell>
        </>
      )}
    </Box>
  );
}
