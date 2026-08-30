import { Box, Flex, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { tokens } from '../../theme';
import { money, percent } from '../ui';

export function ChartCard({ title, meta, children, footer, ...rest }) {
  return (
    <Box className="dc-card" {...rest}>
      <Flex className="dc-card-head"><Text as="strong">{title}</Text><Text as="span">{meta}</Text></Flex>
      <Box p={{ base: 4, xl: 5 }}>{children}</Box>
      {footer && <Flex px={5} py={3.5} borderTop="1px solid" borderColor={tokens.borderSoft} align="center" justify="space-between" gap={4}>{footer}</Flex>}
    </Box>
  );
}

function pathFor(values, width, height, pad, maxValue) {
  if (!values.length) return '';
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  return values.map((value, index) => {
    const x = pad + (index / Math.max(values.length - 1, 1)) * innerW;
    const y = height - pad - (Number(value || 0) / Math.max(maxValue, 1)) * innerH;
    return `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function ChartEmpty() {
  return <Flex h="220px" align="center" justify="center"><Text fontSize="12.5px" color={tokens.faint}>Not enough data to plot yet</Text></Flex>;
}

export function PaceToTargetChart({ days, target }) {
  if (!days.length) return <ChartEmpty />;
  const width = 900; const height = 250; const pad = 34;
  let running = 0;
  const actual = days.map((day) => { running += Number(day.leads || 0); return running; });
  const targetValues = days.map((_, index) => (Number(target || 0) / Math.max(days.length, 1)) * (index + 1));
  const max = Math.max(...actual, ...targetValues, 1);
  const actualPath = pathFor(actual, width, height, pad, max);
  const targetPath = pathFor(targetValues, width, height, pad, max);
  return (
    <Box overflow="hidden">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Cumulative leads against monthly target">
        {[0, .25, .5, .75, 1].map((ratio) => <line key={ratio} x1={pad} x2={width - pad} y1={height - pad - ratio * (height - pad * 2)} y2={height - pad - ratio * (height - pad * 2)} className="chart-grid-line" />)}
        <path d={`${actualPath} L${width - pad},${height - pad} L${pad},${height - pad} Z`} fill="rgba(232,56,79,.08)" />
        <path d={targetPath} fill="none" stroke="#A0AEC0" strokeWidth="2" strokeDasharray="7 7" />
        <path d={actualPath} fill="none" stroke={tokens.red} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {actual.map((value, index) => index === actual.length - 1 && <circle key={index} cx={width - pad} cy={height - pad - (value / max) * (height - pad * 2)} r="5" fill={tokens.red} stroke="white" strokeWidth="3" />)}
      </svg>
      <Flex justify="space-between" mt={1}><Text fontSize="10.5px" color={tokens.faint}>Start</Text><HStack spacing={5}><HStack spacing={2}><Box w="18px" h="3px" bg={tokens.red} /><Text fontSize="11px" color={tokens.muted}>Actual</Text></HStack><HStack spacing={2}><Box w="18px" borderTop="2px dashed #A0AEC0" /><Text fontSize="11px" color={tokens.muted}>Target run rate</Text></HStack></HStack><Text fontSize="10.5px" color={tokens.faint}>Month end</Text></Flex>
    </Box>
  );
}

export function DailyLeadsCplChart({ days }) {
  if (!days.length) return <ChartEmpty />;
  const width = 900; const height = 250; const pad = 34;
  const maxLeads = Math.max(...days.map((day) => Number(day.leads || 0)), 1);
  const maxCpl = Math.max(...days.map((day) => Number(day.cpl || 0)), 1);
  const innerW = width - pad * 2;
  const step = innerW / days.length;
  const cplPath = pathFor(days.map((day) => Number(day.cpl || 0)), width, height, pad, maxCpl);
  return (
    <Box overflow="hidden">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Daily leads and cost per lead">
        {[0, .25, .5, .75, 1].map((ratio) => <line key={ratio} x1={pad} x2={width - pad} y1={height - pad - ratio * (height - pad * 2)} y2={height - pad - ratio * (height - pad * 2)} className="chart-grid-line" />)}
        {days.map((day, index) => {
          const barH = (Number(day.leads || 0) / maxLeads) * (height - pad * 2);
          return <rect key={day.date || index} x={pad + index * step + step * .18} y={height - pad - barH} width={Math.max(step * .64, 2)} height={barH} rx="3" fill="#1877F2" opacity=".82" />;
        })}
        <path d={cplPath} fill="none" stroke={tokens.red} strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" />
      </svg>
      <HStack justify="center" spacing={6} mt={1}><HStack spacing={2}><Box w="9px" h="9px" borderRadius="3px" bg="#1877F2" /><Text fontSize="11px" color={tokens.muted}>Leads</Text></HStack><HStack spacing={2}><Box w="18px" borderTop={`2px dashed ${tokens.red}`} /><Text fontSize="11px" color={tokens.muted}>CPL</Text></HStack></HStack>
    </Box>
  );
}

export function DonutBreakdown({ items, valueKey = 'value', labelKey = 'label', centerLabel = 'Total', formatter = (value) => value.toLocaleString() }) {
  const clean = items.filter((item) => Number(item[valueKey] || 0) > 0);
  const total = clean.reduce((sum, item) => sum + Number(item[valueKey] || 0), 0);
  if (!total) return <ChartEmpty />;
  let cursor = 0;
  const stops = clean.map((item) => {
    const start = cursor; cursor += (Number(item[valueKey]) / total) * 100;
    return `${item.color || tokens.muted} ${start}% ${cursor}%`;
  }).join(', ');
  return (
    <Flex align="center" gap={{ base: 5, xl: 8 }} direction={{ base: 'column', sm: 'row' }}>
      <Flex w="170px" h="170px" borderRadius="full" bg={`conic-gradient(${stops})`} align="center" justify="center" flexShrink={0}>
        <Flex w="104px" h="104px" borderRadius="full" bg="white" align="center" justify="center" direction="column"><Text className="num" fontSize="20px" fontWeight="750">{formatter(total)}</Text><Text mt={1} fontSize="10px" color={tokens.muted} textTransform="uppercase" letterSpacing=".08em">{centerLabel}</Text></Flex>
      </Flex>
      <SimpleGrid columns={1} spacing={2.5} w="100%">
        {clean.map((item) => <Flex key={item[labelKey]} align="center" gap={2}><Box w="8px" h="8px" borderRadius="3px" bg={item.color || tokens.muted} /><Text fontSize="12px" color={tokens.inkSoft} flex={1}>{item[labelKey]}</Text><Text className="num" fontSize="12px" fontWeight="700">{formatter(Number(item[valueKey]))}</Text><Text className="num" fontSize="10.5px" color={tokens.faint} minW="38px" textAlign="right">{percent(Number(item[valueKey]) / total, 0)}</Text></Flex>)}
      </SimpleGrid>
    </Flex>
  );
}

export function MonthlyMovementChart({ months }) {
  if (!months.length) return <ChartEmpty />;
  const width = 900; const height = 280; const pad = 42;
  const maxCount = Math.max(...months.flatMap((row) => [Number(row.leads || 0), Number(row.meetings || 0)]), 1);
  const maxValue = Math.max(...months.map((row) => Number(row.closed_amount || 0)), 1);
  const innerW = width - pad * 2; const step = innerW / months.length;
  const valuePath = pathFor(months.map((row) => Number(row.closed_amount || 0)), width, height, pad, maxValue);
  return (
    <Box>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Monthly lead, meeting and closed value movement">
        {[0, .25, .5, .75, 1].map((ratio) => <line key={ratio} x1={pad} x2={width - pad} y1={height - pad - ratio * (height - pad * 2)} y2={height - pad - ratio * (height - pad * 2)} className="chart-grid-line" />)}
        {months.map((row, index) => {
          const leadH = (Number(row.leads || 0) / maxCount) * (height - pad * 2);
          const meetingH = (Number(row.meetings || 0) / maxCount) * (height - pad * 2);
          return <g key={row.month}><rect x={pad + index * step + step * .2} y={height - pad - leadH} width={step * .26} height={leadH} rx="4" fill="#1877F2" opacity=".85" /><rect x={pad + index * step + step * .5} y={height - pad - meetingH} width={step * .26} height={meetingH} rx="4" fill="#8B7BD8" opacity=".9" /><text x={pad + index * step + step * .5} y={height - 12} textAnchor="middle" fontSize="10" fill="#8b929c">{String(row.month).slice(5)}</text></g>;
        })}
        <path d={valuePath} fill="none" stroke={tokens.red} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <HStack justify="center" spacing={6}><HStack spacing={2}><Box w="9px" h="9px" borderRadius="3px" bg="#1877F2" /><Text fontSize="11px" color={tokens.muted}>Leads</Text></HStack><HStack spacing={2}><Box w="9px" h="9px" borderRadius="3px" bg="#8B7BD8" /><Text fontSize="11px" color={tokens.muted}>Meetings</Text></HStack><HStack spacing={2}><Box w="18px" h="3px" bg={tokens.red} /><Text fontSize="11px" color={tokens.muted}>Closed value</Text></HStack></HStack>
    </Box>
  );
}

export function FunnelOverview({ leads, meetings, closed }) {
  const rows = [
    { label: 'Leads', value: Number(leads || 0), color: '#1877F2' },
    { label: 'Meetings', value: Number(meetings || 0), color: '#8B7BD8' },
    { label: 'Closed', value: Number(closed || 0), color: tokens.red }
  ];
  const max = Math.max(rows[0].value, 1);
  return <Box py={1}>{rows.map((row, index) => <Box key={row.label} mb={index === rows.length - 1 ? 0 : 5}><Flex align="baseline" justify="space-between" mb={2}><Text fontSize="12px" fontWeight="700">{row.label}</Text><HStack spacing={3}><Text className="num" fontSize="18px" fontWeight="750">{row.value.toLocaleString()}</Text>{index > 0 && <Text className="num" fontSize="11px" color={tokens.muted}>{percent(row.value / Math.max(rows[index - 1].value, 1))} from {rows[index - 1].label.toLowerCase()}</Text>}</HStack></Flex><Box h="18px" bg={tokens.borderSoft} borderRadius="5px" overflow="hidden"><Box h="100%" w={`${Math.max((row.value / max) * 100, row.value ? 2 : 0)}%`} bg={row.color} borderRadius="5px" /></Box></Box>)}</Box>;
}

export const reportMoney = (value) => money(value, true);
