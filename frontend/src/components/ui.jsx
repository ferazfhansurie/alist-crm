import { Box, Flex, HStack, Text } from '@chakra-ui/react';
import { channelPalette, statusPalette, tokens } from '../theme';
import { useApp } from '../contexts/AppContext';

export function SectionLabel({ children, ...rest }) {
  return (
    <Text fontSize="10.5px" fontWeight="700" color={tokens.muted} textTransform="uppercase" letterSpacing=".08em" {...rest}>
      {children}
    </Text>
  );
}

export function StatusTag({ status, size = 'sm' }) {
  const palette = statusPalette[status] || statusPalette.New;
  return (
    <HStack
      display="inline-flex"
      spacing="6px"
      px={size === 'sm' ? '8px' : '10px'}
      py={size === 'sm' ? '3px' : '4px'}
      borderRadius="5px"
      bg={palette.bg}
    >
      <Box w="6px" h="6px" borderRadius="full" bg={palette.dot} flexShrink={0} />
      <Text fontSize={size === 'sm' ? '11.5px' : '12.5px'} fontWeight="650" color={palette.fg} whiteSpace="nowrap">
        {status || 'New'}
      </Text>
    </HStack>
  );
}

export function OwnerTag({ owner, size = 'sm' }) {
  const { settings } = useApp();
  const color = settings?.owner_colors?.[owner];
  if (!owner) {
    return <Text fontSize="12px" color={tokens.faint}>Unassigned</Text>;
  }
  return (
    <HStack display="inline-flex" spacing="6px">
      <Box w="8px" h="8px" borderRadius="2px" bg={color || tokens.borderStrong} flexShrink={0} />
      <Text fontSize={size === 'sm' ? '12.5px' : '13px'} fontWeight="600" color={tokens.inkSoft} whiteSpace="nowrap">
        {owner}
      </Text>
    </HStack>
  );
}

export function ChannelTag({ channel }) {
  if (!channel) return <Text fontSize="12px" color={tokens.faint}>—</Text>;
  const color = channelPalette[channel] || tokens.muted;
  return (
    <HStack display="inline-flex" spacing="6px">
      <Box w="6px" h="6px" borderRadius="full" bg={color} flexShrink={0} />
      <Text fontSize="12.5px" fontWeight="550" color={tokens.inkSoft} whiteSpace="nowrap">{channel}</Text>
    </HStack>
  );
}

export function Surface({ children, ...rest }) {
  return (
    <Box bg="white" border="1px solid" borderColor={tokens.border} borderRadius="10px" {...rest}>
      {children}
    </Box>
  );
}

export function EmptyState({ icon: Icon, title, hint, action, py = 16 }) {
  return (
    <Flex direction="column" align="center" justify="center" py={py} px={6} textAlign="center">
      {Icon && (
        <Flex w="44px" h="44px" borderRadius="10px" bg={tokens.surfaceTint} border="1px solid" borderColor={tokens.borderSoft} align="center" justify="center" color={tokens.faint}>
          <Icon size={20} />
        </Flex>
      )}
      <Text mt={4} fontFamily="display" fontSize="17px" fontWeight="600" color={tokens.ink}>{title}</Text>
      {hint && <Text mt={1.5} fontSize="13px" color={tokens.muted} maxW="360px">{hint}</Text>}
      {action && <Box mt={4}>{action}</Box>}
    </Flex>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <Flex align="center" justify="space-between" gap={4} px={4} py={3} borderRadius="8px" bg={tokens.redWash} border="1px solid" borderColor={tokens.redBorder}>
      <Text fontSize="13px" color={tokens.redDeep}>{message}</Text>
      {onRetry && (
        <Text as="button" fontSize="12.5px" fontWeight="700" color={tokens.redDeep} textDecoration="underline" onClick={onRetry} flexShrink={0}>
          Try again
        </Text>
      )}
    </Flex>
  );
}

const dateFormat = { day: 'numeric', month: 'short', year: 'numeric' };
const dateTimeFormat = { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' };

export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-MY', withTime ? dateTimeFormat : dateFormat);
}

export function formatRelative(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const abs = Math.abs(seconds);
  const suffix = seconds >= 0 ? 'ago' : 'from now';
  if (abs < 60) return 'just now';
  if (abs < 3600) return `${Math.round(abs / 60)}m ${suffix}`;
  if (abs < 86400) return `${Math.round(abs / 3600)}h ${suffix}`;
  if (abs < 30 * 86400) return `${Math.round(abs / 86400)}d ${suffix}`;
  return formatDate(value);
}

export function money(value, compact = false) {
  const number = Number(value || 0);
  if (compact && Math.abs(number) >= 1000) {
    return `RM${number.toLocaleString('en-MY', { maximumFractionDigits: 0 })}`;
  }
  return `RM${number.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function percent(value, digits = 1) {
  return `${(Number(value || 0) * 100).toFixed(digits)}%`;
}

export function humanizeBand(value) {
  if (!value) return '';
  return String(value)
    .replaceAll('_', ' ')
    .replace(/rm\s?/gi, 'RM')
    .replace(/\s+/g, ' ')
    .trim();
}
