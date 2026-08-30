import { Box, Flex, HStack, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { MoveDownRight, MoveUpRight, Trophy } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { ChannelTag, ErrorBanner, SectionLabel, Surface, formatDate, money, percent } from '../components/ui';
import { api } from '../services/frappeApi';
import { tokens } from '../theme';

function monthLabel(month) {
  const [year, monthPart] = String(month || '').split('-');
  if (!monthPart) return month;
  return new Date(Number(year), Number(monthPart) - 1, 1).toLocaleString('en-MY', { month: 'short', year: 'numeric' });
}

function Delta({ current, previous }) {
  if (previous === undefined || previous === null) return null;
  const diff = Number(current || 0) - Number(previous || 0);
  if (!previous || !diff) return null;
  const up = diff > 0;
  return (
    <HStack as="span" spacing="1px" color={up ? tokens.ok : tokens.redDeep} display="inline-flex" ml={1.5} verticalAlign="middle">
      {up ? <MoveUpRight size={11} /> : <MoveDownRight size={11} />}
      <Text as="span" className="num" fontSize="10.5px" fontWeight="700">
        {Math.abs(Math.round((diff / previous) * 100))}%
      </Text>
    </HStack>
  );
}

function Headline({ label, value, hint }) {
  return (
    <Box>
      <SectionLabel>{label}</SectionLabel>
      <Text className="num" mt={1.5} fontFamily="display" fontSize="26px" fontWeight="600" lineHeight={1.1}>{value}</Text>
      {hint && <Text mt={1} fontSize="11.5px" color={tokens.muted}>{hint}</Text>}
    </Box>
  );
}

export default function SummaryPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await api.monthlySummary());
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const months = data?.months || [];
  const closings = data?.closings || [];

  const totals = useMemo(() => months.reduce(
    (sum, row) => ({
      leads: sum.leads + row.leads,
      meetings: sum.meetings + row.meetings,
      closed: sum.closed + row.closed,
      amount: sum.amount + row.closed_amount,
      spend: sum.spend + row.spend
    }),
    { leads: 0, meetings: 0, closed: 0, amount: 0, spend: 0 }
  ), [months]);

  return (
    <Box px={{ base: 4, xl: 8 }} py={6} maxW="1640px" mx="auto" w="100%">
      <PageHeader
        kicker="Performance"
        title="Summary"
        description="Month-to-month funnel movement and closing attribution, generated from the lead and deal records."
      />

      {error && <Box mb={5}><ErrorBanner message={error} onRetry={load} /></Box>}

      {!data && !error ? (
        <Box>
          <Skeleton h="110px" borderRadius="10px" mb={5} />
          <Skeleton h="340px" borderRadius="10px" />
        </Box>
      ) : data && (
        <>
          <Surface px={{ base: 4, xl: 6 }} py={5} mb={5}>
            <Flex gap={{ base: 5, xl: 12 }} flexWrap="wrap">
              <Headline label="Leads" value={totals.leads.toLocaleString()} hint={`${money(totals.spend / (totals.leads || 1))} average CPL`} />
              <Headline label="Meetings" value={totals.meetings.toLocaleString()} hint={`${percent(totals.meetings / (totals.leads || 1))} of leads`} />
              <Headline label="Closed" value={totals.closed.toLocaleString()} hint={`${percent(totals.closed / (totals.meetings || 1))} of meetings`} />
              <Headline label="Closed value" value={money(totals.amount, true)} />
              <Headline
                label="Ad spend"
                value={money(totals.spend, true)}
                hint={totals.spend ? `${(totals.amount / totals.spend).toFixed(2)}x return on spend` : undefined}
              />
            </Flex>
          </Surface>

          <Surface overflow="hidden" mb={5}>
            <Flex px={4} py={3} align="center" justify="space-between" borderBottom="1px solid" borderColor={tokens.borderSoft}>
              <Text fontSize="13px" fontWeight="750">Monthly funnel</Text>
              <Text className="num" fontSize="11.5px" color={tokens.muted}>{months.length} months</Text>
            </Flex>
            <Box overflowX="auto">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Month</th><th>Leads</th><th>Meetings</th><th>Closed</th>
                    <th>Closed value</th><th>Ad spend</th><th>CPL</th>
                    <th>Lead → meeting</th><th>Meeting → close</th>
                  </tr>
                </thead>
                <tbody>
                  {months.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: 'center', color: tokens.faint, padding: '28px 0' }}>No monthly data yet</td></tr>
                  )}
                  {months.map((row, index) => {
                    const previous = months[index - 1];
                    return (
                      <tr key={row.month}>
                        <td style={{ fontWeight: 650 }}>{monthLabel(row.month)}</td>
                        <td>
                          {row.leads.toLocaleString()}
                          <Delta current={row.leads} previous={previous?.leads} />
                        </td>
                        <td>
                          {row.meetings.toLocaleString()}
                          <Delta current={row.meetings} previous={previous?.meetings} />
                        </td>
                        <td>
                          {row.closed.toLocaleString()}
                          <Delta current={row.closed} previous={previous?.closed} />
                        </td>
                        <td>{row.closed_amount ? money(row.closed_amount) : '—'}</td>
                        <td>{row.spend ? money(row.spend) : '—'}</td>
                        <td>{row.leads && row.spend ? money(row.spend / row.leads) : '—'}</td>
                        <td>{row.leads ? percent(row.lead_to_meeting) : '—'}</td>
                        <td>{row.meetings ? percent(row.meeting_to_close) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {months.length > 0 && (
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td>{totals.leads.toLocaleString()}</td>
                      <td>{totals.meetings.toLocaleString()}</td>
                      <td>{totals.closed.toLocaleString()}</td>
                      <td>{money(totals.amount)}</td>
                      <td>{money(totals.spend)}</td>
                      <td>{totals.leads ? money(totals.spend / totals.leads) : '—'}</td>
                      <td>{totals.leads ? percent(totals.meetings / totals.leads) : '—'}</td>
                      <td>{totals.meetings ? percent(totals.closed / totals.meetings) : '—'}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </Box>
          </Surface>

          <Surface overflow="hidden">
            <Flex px={4} py={3} align="center" justify="space-between" borderBottom="1px solid" borderColor={tokens.borderSoft}>
              <HStack spacing={2}>
                <Trophy size={14} color={tokens.warn} />
                <Text fontSize="13px" fontWeight="750">Closings from leads</Text>
              </HStack>
              <Text className="num" fontSize="11.5px" color={tokens.muted}>{closings.length} closed</Text>
            </Flex>
            <Box overflowX="auto">
              <table className="report-table">
                <thead>
                  <tr><th>Client</th><th>Amount</th><th>Closed on</th><th>Source month</th><th>Channel</th></tr>
                </thead>
                <tbody>
                  {closings.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: tokens.faint, padding: '28px 0' }}>No closings recorded yet</td></tr>
                  )}
                  {closings.map((row, index) => (
                    <tr key={`${row.client}-${index}`}>
                      <td style={{ fontWeight: 650 }}>{row.client}</td>
                      <td style={{ fontWeight: 650 }}>{money(row.amount)}</td>
                      <td>{formatDate(row.closed_on)}</td>
                      <td>{row.source_month ? monthLabel(row.source_month) : '—'}</td>
                      <td>{row.channel ? <ChannelTag channel={row.channel} /> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Surface>
        </>
      )}
    </Box>
  );
}
