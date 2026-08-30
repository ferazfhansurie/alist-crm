import { Flex, Heading, Text, VStack } from '@chakra-ui/react';

export default function PageHeader({ title, description, actions }) {
  return (
    <Flex justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} direction={{ base: 'column', md: 'row' }} mb={5}>
      <VStack align="start" spacing={1}>
        <Heading fontSize="30px" letterSpacing="-.025em" color="#15181d">{title}</Heading>
        {description && <Text color="gray.500" fontSize="sm">{description}</Text>}
      </VStack>
      {actions}
    </Flex>
  );
}
