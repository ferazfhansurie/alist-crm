import { Badge } from '@chakra-ui/react';
import { useApp } from '../../contexts/AppContext';

export default function OwnerChip({ owner }) {
  const { settings } = useApp();
  const color = settings?.owner_colors?.[owner] || '#e2e8f0';
  return <Badge bg={color} color="#15181d" borderRadius="full" px={2.5} py={1} textTransform="none">{owner || 'Unassigned'}</Badge>;
}
