import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { tokens } from '../theme';

export default function PageHeader({ kicker, title, description, actions }) {
  return (
    <Flex
      justify="space-between"
      align={{ base: 'start', md: 'end' }}
      gap={4}
      direction={{ base: 'column', md: 'row' }}
      pb={5}
      mb={6}
      borderBottom="1px solid"
      borderColor={tokens.border}
    >
      <Box>
        {kicker && (
          <Text fontSize="11px" fontWeight="700" color={tokens.red} textTransform="uppercase" letterSpacing=".1em" mb={1.5}>
            {kicker}
          </Text>
        )}
        <Heading fontFamily="display" fontSize="27px" fontWeight="600" letterSpacing="-.01em" color={tokens.ink}>
          {title}
        </Heading>
        {description && <Text mt={1.5} color={tokens.muted} fontSize="13.5px" maxW="620px">{description}</Text>}
      </Box>
      {actions}
    </Flex>
  );
}
