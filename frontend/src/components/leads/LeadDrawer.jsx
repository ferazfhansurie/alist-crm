import {
  Badge, Box, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader,
  DrawerOverlay, HStack, Spinner, Text, VStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { api } from '../../services/frappeApi';

export default function LeadDrawer({ name, isOpen, onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!name || !isOpen) return;
    setData(null);
    api.leadDetail(name).then(setData);
  }, [name, isOpen]);
  return (
    <Drawer isOpen={isOpen} placement="right" size="md" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottom="1px solid" borderColor="gray.100">{data?.lead?.lead_name || 'Lead details'}</DrawerHeader>
        <DrawerBody py={5}>
          {!data ? <Spinner color="alist.500" /> : (
            <VStack align="stretch" spacing={6}>
              <Box bg="gray.50" borderRadius="12px" p={4}>
                <Text fontWeight="700">{data.lead.organization || 'No company'}</Text>
                <Text fontSize="sm" color="gray.600">{data.lead.mobile_no || 'No phone'} · {data.lead.email || 'No email'}</Text>
                <Text fontSize="sm" color="gray.600" mt={2}>{data.lead.alist_remark || 'No remark'}</Text>
              </Box>
              <Box>
                <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" mb={3}>Activity</Text>
                <VStack align="stretch" spacing={3}>
                  {data.activities.length === 0 && <Text color="gray.400" fontSize="sm">No activity yet</Text>}
                  {data.activities.map((item) => (
                    <Box key={item.name} borderLeft="3px solid #e8384f" pl={3} py={1}>
                      <HStack><Badge colorScheme="red" variant="subtle">{item.activity_type}</Badge><Text fontWeight="600" fontSize="sm">{item.outcome}</Text></HStack>
                      <Text color="gray.500" fontSize="xs" mt={1}>{new Date(item.occurred_at).toLocaleString('en-MY')}</Text>
                      {item.note && <Text fontSize="sm" mt={1}>{item.note}</Text>}
                    </Box>
                  ))}
                </VStack>
              </Box>
            </VStack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
