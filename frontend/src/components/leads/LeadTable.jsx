import {
  Box, Checkbox, Flex, HStack, IconButton, Link, Menu, MenuButton, MenuDivider,
  MenuGroup, MenuItem, MenuList, Text, Tooltip
} from '@chakra-ui/react';
import { CalendarClock, ClipboardList, Inbox, Mail, MessageCircle, Phone } from 'lucide-react';
import { tokens } from '../../theme';
import { ChannelTag, EmptyState, OwnerTag, StatusTag, formatDate, formatRelative, humanizeBand } from '../ui';
import { ACTION_GROUPS, isOverdue, waLink } from './actions';

function LeadAvatar({ lead, selected }) {
  const initials = String(lead.lead_name || lead.first_name || lead.organization || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return (
    <Flex
      w="32px"
      h="32px"
      borderRadius="8px"
      bg={selected ? tokens.red : tokens.surfaceTint}
      border="1px solid"
      borderColor={selected ? tokens.red : tokens.borderSoft}
      color={selected ? 'white' : tokens.inkSoft}
      align="center"
      justify="center"
      fontSize="12px"
      fontWeight="700"
      flexShrink={0}
    >
      {initials || '?'}
    </Flex>
  );
}

function RowActions({ lead, onAction }) {
  const wa = waLink(lead.mobile_no);
  const stop = (event) => event.stopPropagation();
  return (
    <HStack className="row-actions" spacing="2px" onClick={stop}>
      <Tooltip label={wa ? 'WhatsApp' : 'No phone number'}>
        <IconButton
          as={wa ? Link : undefined}
          href={wa || undefined}
          target="_blank"
          aria-label="WhatsApp"
          icon={<MessageCircle size={15} />}
          size="sm"
          variant="ghost"
          color={tokens.inkSoft}
          isDisabled={!wa}
        />
      </Tooltip>
      <Tooltip label={lead.mobile_no ? 'Call' : 'No phone number'}>
        <IconButton
          as={lead.mobile_no ? Link : undefined}
          href={lead.mobile_no ? `tel:${lead.mobile_no}` : undefined}
          aria-label="Call"
          icon={<Phone size={15} />}
          size="sm"
          variant="ghost"
          color={tokens.inkSoft}
          isDisabled={!lead.mobile_no}
        />
      </Tooltip>
      <Tooltip label={lead.email ? 'Email' : 'No email'}>
        <IconButton
          as={lead.email ? Link : undefined}
          href={lead.email ? `mailto:${lead.email}` : undefined}
          aria-label="Email"
          icon={<Mail size={15} />}
          size="sm"
          variant="ghost"
          color={tokens.inkSoft}
          isDisabled={!lead.email}
        />
      </Tooltip>
      <Menu placement="bottom-end" isLazy>
        <Tooltip label="Log activity">
          <MenuButton
            as={IconButton}
            aria-label="Log activity"
            icon={<ClipboardList size={15} />}
            size="sm"
            variant="ghost"
            color={tokens.inkSoft}
          />
        </Tooltip>
        <MenuList minW="215px" zIndex={30}>
          {ACTION_GROUPS.map((group, index) => (
            <Box key={group.label}>
              {index > 0 && <MenuDivider my={1} />}
              <MenuGroup title={group.label} fontSize="10.5px" textTransform="uppercase" letterSpacing=".07em" color={tokens.muted}>
                {group.actions.map((action) => (
                  <MenuItem key={action.key} icon={<action.icon size={14} />} onClick={() => onAction(lead, action)}>
                    {action.label}
                  </MenuItem>
                ))}
              </MenuGroup>
            </Box>
          ))}
        </MenuList>
      </Menu>
    </HStack>
  );
}

export default function LeadTable({
  rows, loading, selectedName, onOpen, onAction,
  selection, onToggleRow, onToggleAll
}) {
  const allChecked = rows.length > 0 && rows.every((row) => selection.has(row.name));
  const someChecked = rows.some((row) => selection.has(row.name));

  return (
    <Box
      h="100%"
      bg="white"
      borderRadius="10px"
      border="1px solid"
      borderColor={tokens.border}
      overflow="hidden"
      position="relative"
    >
      {loading && <Box position="absolute" inset="0 0 auto 0" h="2px" bg={tokens.red} zIndex={5} className="loading-bar" />}
      <Box h="100%" overflow="auto">
        <table className="lead-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <Checkbox
                  colorScheme="alist"
                  isChecked={allChecked}
                  isIndeterminate={someChecked && !allChecked}
                  onChange={onToggleAll}
                  aria-label="Select all leads on this page"
                />
              </th>
              <th style={{ minWidth: 220 }}>Lead</th>
              <th style={{ minWidth: 118 }}>Status</th>
              <th style={{ minWidth: 90 }}>PIC</th>
              <th style={{ minWidth: 108 }}>Channel</th>
              <th style={{ minWidth: 165 }}>Qualification</th>
              <th style={{ minWidth: 150 }}>Latest outcome</th>
              <th style={{ minWidth: 135 }}>Follow-up</th>
              <th style={{ minWidth: 150 }} aria-label="Quick actions" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr style={{ cursor: 'default' }}>
                <td colSpan={9} style={{ height: 'auto' }}>
                  <EmptyState
                    icon={Inbox}
                    title="No leads in this view"
                    hint="Loosen the filters, pick another month, or create the lead manually."
                  />
                </td>
              </tr>
            )}
            {rows.map((lead) => {
              const selected = selectedName === lead.name;
              const overdue = isOverdue(lead);
              const band = humanizeBand(lead.alist_annual_sales_band);
              return (
                <tr
                  key={lead.name}
                  data-selected={selected}
                  onClick={() => onOpen(lead.name)}
                >
                  <td onClick={(event) => event.stopPropagation()} style={{ cursor: 'default' }}>
                    <Checkbox
                      colorScheme="alist"
                      isChecked={selection.has(lead.name)}
                      onChange={() => onToggleRow(lead.name)}
                      aria-label={`Select ${lead.lead_name || 'lead'}`}
                    />
                  </td>
                  <td>
                    <HStack spacing={3} minW={0}>
                      <LeadAvatar lead={lead} selected={selected} />
                      <Box minW={0}>
                        <Text fontWeight="650" fontSize="13px" color={tokens.ink} isTruncated maxW="185px">
                          {lead.lead_name || lead.first_name || 'Unnamed lead'}
                        </Text>
                        <Text mt="1px" fontSize="11.5px" color={tokens.muted} isTruncated maxW="185px">
                          {lead.organization || formatDate(lead.alist_lead_datetime, true)}
                        </Text>
                      </Box>
                    </HStack>
                  </td>
                  <td><StatusTag status={lead.status} /></td>
                  <td><OwnerTag owner={lead.alist_pic_name} /></td>
                  <td><ChannelTag channel={lead.alist_channel || lead.source} /></td>
                  <td>
                    {band || lead.alist_business_type ? (
                      <Box minW={0}>
                        <Text fontSize="12.5px" fontWeight="600" color={tokens.inkSoft} isTruncated maxW="150px">
                          {band || 'Not qualified'}
                        </Text>
                        <Text mt="1px" fontSize="11px" color={tokens.muted} isTruncated maxW="150px">
                          {lead.alist_business_type || lead.alist_monthly_sales_text || ''}
                        </Text>
                      </Box>
                    ) : (
                      <Text fontSize="12px" color={tokens.faint}>Not qualified</Text>
                    )}
                  </td>
                  <td>
                    <Text fontSize="12.5px" fontWeight="600" color={lead.alist_last_outcome ? tokens.inkSoft : tokens.faint}>
                      {lead.alist_last_outcome || 'No activity'}
                    </Text>
                    <Text mt="1px" fontSize="11px" color={tokens.muted}>{formatRelative(lead.modified)}</Text>
                  </td>
                  <td>
                    {lead.alist_next_follow_up ? (
                      <Box>
                        <HStack spacing="5px" color={overdue ? tokens.redDeep : tokens.inkSoft}>
                          <CalendarClock size={13} />
                          <Text fontSize="12px" fontWeight={overdue ? '700' : '600'}>
                            {formatDate(lead.alist_next_follow_up, true)}
                          </Text>
                        </HStack>
                        {overdue && (
                          <Text mt="2px" fontSize="9.5px" color={tokens.red} fontWeight="750" textTransform="uppercase" letterSpacing=".06em">
                            Overdue
                          </Text>
                        )}
                      </Box>
                    ) : (
                      <Text fontSize="12px" color={tokens.faint}>Not scheduled</Text>
                    )}
                  </td>
                  <td>
                    <Flex justify="flex-end">
                      <RowActions lead={lead} onAction={onAction} />
                    </Flex>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}
