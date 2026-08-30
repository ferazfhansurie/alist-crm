import {
  Avatar, Badge, Box, Flex, HStack, Table, Tbody, Td, Text, Th, Thead, Tooltip, Tr
} from '@chakra-ui/react';
import { CalendarClock, Mail, MessageCircle, Phone } from 'lucide-react';
import OwnerChip from './OwnerChip';

const statusStyle = {
  New: { bg: '#f1f3f5', color: '#5f6773', dot: '#8a919c' },
  Contacted: { bg: '#fff3e6', color: '#9a4b00', dot: '#ed7b16' },
  'Meeting Set': { bg: '#edf3ff', color: '#315ea8', dot: '#4b7bd8' },
  'Meeting Done': { bg: '#f3edff', color: '#6946a8', dot: '#7c5ac2' },
  Converted: { bg: '#e8f8ef', color: '#197a48', dot: '#25a566' },
  Disqualified: { bg: '#fff0f1', color: '#a22e3a', dot: '#e14d5d' },
  Duplicate: { bg: '#fff8dd', color: '#8d6e00', dot: '#d5a900' }
};

function StatusBadge({ status }) {
  const style = statusStyle[status] || statusStyle.New;
  return (
    <HStack display="inline-flex" spacing={2} px={2.5} py={1.5} borderRadius="full" bg={style.bg}>
      <Box w="6px" h="6px" borderRadius="full" bg={style.dot} />
      <Text fontSize="11px" fontWeight="700" color={style.color} whiteSpace="nowrap">{status || 'New'}</Text>
    </HStack>
  );
}

function humanizeBand(value) {
  if (!value) return 'Not qualified';
  return String(value)
    .replaceAll('_', ' ')
    .replace(/rm/gi, 'RM ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDate(value, withTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-MY', withTime
    ? { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}

function ContactLine({ icon: Icon, children }) {
  return (
    <HStack spacing={1.5} minW={0} color="gray.500">
      <Icon size={12} />
      <Text fontSize="11px" isTruncated>{children}</Text>
    </HStack>
  );
}

export default function LeadGrid({ rows, loading, selectedName, onOpen }) {
  return (
    <Box h="100%" bg="white" borderRadius="12px" border="1px solid" borderColor="gray.150" boxShadow="0 1px 3px rgba(16,24,40,.04)" overflow="hidden" position="relative">
      {loading && <Box position="absolute" inset="0 0 auto 0" h="2px" bg="alist.500" zIndex={5} className="loading-bar" />}
      <Box h="100%" overflow="auto">
        <Table size="sm" className="crm-lead-list">
          <Thead>
            <Tr>
              <Th minW="230px">Lead</Th>
              <Th minW="125px">Status</Th>
              <Th minW="105px">PIC</Th>
              <Th minW="100px">Channel</Th>
              <Th minW="180px">Contact</Th>
              <Th minW="165px">Qualification</Th>
              <Th minW="155px">Latest outcome</Th>
              <Th minW="145px">Follow-up</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.length === 0 && (
              <Tr>
                <Td colSpan={8} py={20} textAlign="center">
                  <Flex direction="column" align="center" color="gray.400">
                    <MessageCircle size={25} />
                    <Text mt={3} fontWeight="650" color="gray.500">No leads in this view</Text>
                    <Text mt={1} fontSize="12px">Change the filters or create a new lead.</Text>
                  </Flex>
                </Td>
              </Tr>
            )}
            {rows.map((lead) => {
              const selected = selectedName === lead.name;
              const overdue = lead.alist_next_follow_up && new Date(lead.alist_next_follow_up) < new Date()
                && !['Converted', 'Disqualified', 'Duplicate'].includes(lead.status);
              return (
                <Tr
                  key={lead.name}
                  cursor="pointer"
                  bg={selected ? '#fff6f7' : 'white'}
                  boxShadow={selected ? 'inset 3px 0 #e8384f' : 'none'}
                  _hover={{ bg: selected ? '#fff6f7' : '#fafbfc' }}
                  onClick={() => onOpen(lead.name)}
                >
                  <Td>
                    <HStack spacing={3} minW={0}>
                      <Avatar size="sm" name={lead.lead_name || lead.first_name} bg={selected ? 'alist.500' : 'gray.100'} color={selected ? 'white' : 'gray.600'} />
                      <Box minW={0}>
                        <Text fontWeight="700" fontSize="13px" color="gray.800" isTruncated maxW="175px">{lead.lead_name || lead.first_name || 'Unnamed lead'}</Text>
                        <Text mt={0.5} fontSize="11px" color="gray.500" isTruncated maxW="175px">{lead.organization || formatDate(lead.alist_lead_datetime, true)}</Text>
                      </Box>
                    </HStack>
                  </Td>
                  <Td><StatusBadge status={lead.status} /></Td>
                  <Td><OwnerChip owner={lead.alist_pic_name} /></Td>
                  <Td>
                    <Badge variant="outline" color="gray.600" borderColor="gray.200" borderRadius="full" px={2.5} py={1} textTransform="none" fontWeight="650">{lead.alist_channel || lead.source || '—'}</Badge>
                  </Td>
                  <Td>
                    <Box maxW="170px">
                      {lead.mobile_no && <ContactLine icon={Phone}>{lead.mobile_no}</ContactLine>}
                      {lead.email && <Box mt={lead.mobile_no ? 1 : 0}><ContactLine icon={Mail}>{lead.email}</ContactLine></Box>}
                      {!lead.mobile_no && !lead.email && <Text fontSize="11px" color="gray.400">No contact details</Text>}
                    </Box>
                  </Td>
                  <Td>
                    <Tooltip label={humanizeBand(lead.alist_annual_sales_band)} placement="top" hasArrow>
                      <Box>
                        <Text fontSize="12px" fontWeight="650" color="gray.700" isTruncated maxW="150px">{humanizeBand(lead.alist_annual_sales_band)}</Text>
                        <Text mt={0.5} fontSize="10px" color="gray.500" isTruncated maxW="150px">{lead.alist_business_type || lead.alist_monthly_sales_text || 'No business profile'}</Text>
                      </Box>
                    </Tooltip>
                  </Td>
                  <Td>
                    <Text fontSize="12px" fontWeight="650" color={lead.alist_last_outcome ? 'gray.700' : 'gray.400'}>{lead.alist_last_outcome || 'No activity yet'}</Text>
                    <Text mt={0.5} fontSize="10px" color="gray.500">Updated {formatDate(lead.modified, true)}</Text>
                  </Td>
                  <Td>
                    {lead.alist_next_follow_up ? (
                      <HStack spacing={1.5} color={overdue ? 'red.600' : 'gray.600'}>
                        <CalendarClock size={13} />
                        <Text fontSize="11px" fontWeight={overdue ? '700' : '600'}>{formatDate(lead.alist_next_follow_up, true)}</Text>
                      </HStack>
                    ) : <Text fontSize="11px" color="gray.400">Not scheduled</Text>}
                    {overdue && <Text mt={1} fontSize="9px" color="red.500" fontWeight="750" textTransform="uppercase">Overdue</Text>}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}
