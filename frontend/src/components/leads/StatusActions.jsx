import { Button, Menu, MenuButton, MenuDivider, MenuItem, MenuList } from '@chakra-ui/react';
import { ChevronDown } from 'lucide-react';

const groups = [
  [
    ['Dah contact', 'contacted'], ['Call, pickup', 'call_pickup'], ['Call, no pickup', 'call_no_pickup'],
    ['WhatsApp replied', 'whatsapp_replied'], ['No WhatsApp', 'no_whatsapp'], ['No response', 'no_response']
  ],
  [['Meeting set', 'meeting_set'], ['Dah meeting', 'meeting_done'], ['Proposal requested', 'proposal_requested'], ['Signed client', 'signed_client']],
  [['Non-quality', 'non_quality'], ['Bad lead', 'bad_lead'], ['Redundant', 'redundant']],
  [['Confirmed', 'confirmed'], ['Decline', 'declined']]
];

export default function StatusActions({ onAction, busy }) {
  return (
    <Menu placement="bottom-end">
      <MenuButton as={Button} size="xs" rightIcon={<ChevronDown size={13} />} variant="outline" isLoading={busy}>Update</MenuButton>
      <MenuList minW="210px" zIndex={20}>
        {groups.map((group, groupIndex) => (
          <span key={groupIndex}>
            {groupIndex > 0 && <MenuDivider />}
            {group.map(([label, key]) => <MenuItem key={key} fontSize="sm" onClick={() => onAction(key)}>{label}</MenuItem>)}
          </span>
        ))}
      </MenuList>
    </Menu>
  );
}
