import { Box, Flex, HStack, Text, Tooltip } from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';
import { statusPalette, tokens } from '../../theme';
import { SectionLabel } from '../ui';

const FUNNEL_STAGES = ['New', 'Contacted', 'Meeting Set', 'Meeting Done', 'Converted'];
const SIDE_STATES = ['Disqualified', 'Duplicate'];

/**
 * Proportional funnel of active statuses. Each segment filters the list;
 * the right block keeps loss states and overdue follow-ups visible without
 * turning the header into a dashboard.
 */
export default function FunnelStrip({ overview, activeStatus, onStatus }) {
  const counts = overview.status_counts || {};
  const funnelTotal = FUNNEL_STAGES.reduce((sum, stage) => sum + (counts[stage] || 0), 0);

  return (
    <Flex
      align={{ base: 'stretch', md: 'center' }}
      direction={{ base: 'column', md: 'row' }}
      gap={{ base: 4, md: 8 }}
      px={{ base: 4, xl: 5 }}
      py={4}
      bg="white"
      border="1px solid"
      borderColor={tokens.border}
      borderRadius="10px"
    >
      <Box flex={1} minW={0}>
        <Flex h="26px" borderRadius="6px" overflow="visible" gap="3px">
          {FUNNEL_STAGES.map((stage) => {
            const count = counts[stage] || 0;
            const palette = statusPalette[stage];
            const share = funnelTotal ? count / funnelTotal : 0;
            return (
              <Tooltip key={stage} label={`${stage} · ${count.toLocaleString()} leads`} placement="top" hasArrow>
                <Box
                  as="button"
                  className="funnel-seg"
                  data-active={activeStatus === stage}
                  aria-label={`Filter by ${stage}`}
                  bg={palette.dot}
                  opacity={activeStatus && activeStatus !== stage ? 0.35 : 1}
                  borderRadius="4px"
                  flexGrow={Math.max(share, 0.045)}
                  flexBasis={0}
                  onClick={() => onStatus(activeStatus === stage ? '' : stage)}
                />
              </Tooltip>
            );
          })}
        </Flex>
        <Flex mt={3} gap={{ base: 3, xl: 6 }} flexWrap="wrap">
          {FUNNEL_STAGES.map((stage) => {
            const palette = statusPalette[stage];
            return (
              <HStack
                key={stage}
                as="button"
                spacing="7px"
                onClick={() => onStatus(activeStatus === stage ? '' : stage)}
                opacity={activeStatus && activeStatus !== stage ? 0.45 : 1}
              >
                <Box w="7px" h="7px" borderRadius="full" bg={palette.dot} />
                <Text className="num" fontSize="13.5px" fontWeight="700" color={tokens.ink}>
                  {(counts[stage] || 0).toLocaleString()}
                </Text>
                <Text fontSize="12px" color={tokens.muted}>{stage}</Text>
              </HStack>
            );
          })}
        </Flex>
      </Box>

      <Flex
        gap={6}
        align="center"
        pl={{ md: 8 }}
        pt={{ base: 3, md: 0 }}
        borderLeft={{ md: '1px solid' }}
        borderTop={{ base: '1px solid', md: 'none' }}
        borderColor={{ base: tokens.borderSoft, md: tokens.borderSoft }}
        flexShrink={0}
      >
        <Box>
          <SectionLabel>Overdue follow-ups</SectionLabel>
          <HStack mt={1} spacing={2} color={overview.overdue ? tokens.redDeep : tokens.muted}>
            {Boolean(overview.overdue) && <AlertTriangle size={15} />}
            <Text className="num" fontSize="19px" fontWeight="750">
              {(overview.overdue || 0).toLocaleString()}
            </Text>
          </HStack>
        </Box>
        <Box>
          <SectionLabel>Out of funnel</SectionLabel>
          <HStack mt={1.5} spacing={4}>
            {SIDE_STATES.map((stage) => (
              <HStack
                key={stage}
                as="button"
                spacing="6px"
                onClick={() => onStatus(activeStatus === stage ? '' : stage)}
                opacity={activeStatus && activeStatus !== stage ? 0.5 : 1}
              >
                <Box w="7px" h="7px" borderRadius="full" bg={statusPalette[stage].dot} />
                <Text className="num" fontSize="13px" fontWeight="700" color={tokens.inkSoft}>
                  {(counts[stage] || 0).toLocaleString()}
                </Text>
                <Text fontSize="12px" color={tokens.muted}>{stage}</Text>
              </HStack>
            ))}
          </HStack>
        </Box>
      </Flex>
    </Flex>
  );
}
