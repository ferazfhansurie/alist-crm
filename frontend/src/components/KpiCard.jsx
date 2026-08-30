import { Box, Flex, Text } from '@chakra-ui/react';

export default function KpiCard({ label, value, hint, accent = '#e8384f' }) {
  return (
    <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="12px" p={5} boxShadow="0 1px 3px rgba(0,0,0,.06)">
      <Flex align="center" gap={2} mb={2}><Box w="8px" h="8px" borderRadius="full" bg={accent} /><Text color="gray.500" fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing=".06em">{label}</Text></Flex>
      <Text color="#15181d" fontSize="26px" fontWeight="700" lineHeight="1.15">{value}</Text>
      {hint && <Text color="gray.500" fontSize="xs" mt={2}>{hint}</Text>}
    </Box>
  );
}
