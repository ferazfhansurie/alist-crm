import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { tokens } from '../theme';

export default function PageHeader({ kicker, title, description, actions }) {
  return (
    <Flex
      position="relative"
      overflow="hidden"
      justify="space-between"
      align={{ base: 'start', md: 'center' }}
      gap={4}
      direction={{ base: 'column', md: 'row' }}
      px={{ base: 5, xl: 7 }}
      py={{ base: 5, xl: 6 }}
      mb={6}
      bg="white"
      border="1px solid"
      borderColor={tokens.borderSoft}
      borderRadius="14px"
      boxShadow="lift"
      _before={{
        content: '""', position: 'absolute', inset: '0 auto 0 0', w: '5px',
        bg: `linear-gradient(180deg, ${tokens.red} 0%, ${tokens.ink} 100%)`
      }}
    >
      <Box>
        {kicker && (
          <Text fontSize="11px" fontWeight="700" color={tokens.red} textTransform="uppercase" letterSpacing=".1em" mb={1.5}>
            {kicker}
          </Text>
        )}
        <Heading fontFamily="display" fontSize={{ base: '26px', xl: '32px' }} fontWeight="700" letterSpacing="-.025em" color={tokens.ink}>
          {title}
        </Heading>
        {description && <Text mt={1.5} color={tokens.muted} fontSize="13.5px" maxW="620px">{description}</Text>}
      </Box>
      {actions}
    </Flex>
  );
}
