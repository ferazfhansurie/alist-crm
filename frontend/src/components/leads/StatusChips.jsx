import { Badge, HStack } from '@chakra-ui/react';

const scheme = {
  New: 'gray', Contacted: 'orange', 'Meeting Set': 'blue', 'Meeting Done': 'purple',
  Converted: 'green', Disqualified: 'red', Duplicate: 'yellow'
};

export default function StatusChips({ lead }) {
  const chips = [lead.status, lead.alist_last_outcome, lead.alist_event_outcome].filter(Boolean);
  return (
    <HStack spacing={1} minW="190px" flexWrap="wrap">
      {chips.map((chip, index) => <Badge key={`${chip}-${index}`} colorScheme={index === 0 ? scheme[chip] || 'gray' : 'gray'} variant={index === 0 ? 'subtle' : 'outline'} borderRadius="full" px={2} textTransform="none">{chip}</Badge>)}
    </HStack>
  );
}
