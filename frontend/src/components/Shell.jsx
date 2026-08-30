import {
  Box, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerOverlay,
  Flex, HStack, IconButton, Text, VStack, useDisclosure
} from '@chakra-ui/react';
import { BarChart3, CalendarDays, Menu, Settings, Users } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { tokens } from '../theme';

const items = [
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/daily-report', label: 'Daily report', icon: CalendarDays },
  { path: '/summary', label: 'Summary', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings, managerOnly: true }
];

function Wordmark({ onClick }) {
  return (
    <Text
      color="white"
      fontSize="17px"
      fontWeight="750"
      letterSpacing=".01em"
      cursor="pointer"
      onClick={onClick}
      userSelect="none"
      whiteSpace="nowrap"
    >
      THE<Box as="span" color={tokens.red}>A</Box>-LIST
    </Text>
  );
}

function UserBlock({ session, dark = true }) {
  return (
    <HStack spacing={3} minW={0}>
      <Flex w="32px" h="32px" borderRadius="8px" bg={tokens.red} color="white" align="center" justify="center" fontWeight="700" fontSize="14px" flexShrink={0}>
        {(session.full_name || 'A').charAt(0).toUpperCase()}
      </Flex>
      <Box minW={0}>
        <Text fontSize="13px" fontWeight="650" color={dark ? 'white' : tokens.ink} isTruncated>{session.full_name}</Text>
        <Text fontSize="11px" color={dark ? '#8e929c' : tokens.muted} isTruncated>{session.user}</Text>
      </Box>
    </HStack>
  );
}

export default function Shell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, settings } = useApp();
  const drawer = useDisclosure();
  const visible = items.filter((item) => !item.managerOnly || settings?.can_manage);

  useEffect(() => { drawer.onClose(); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const navList = (mobile = false) => (
    <VStack align="stretch" spacing="2px" mt={mobile ? 2 : 0}>
      {visible.map((item) => {
        const Icon = item.icon;
        const active = location.pathname.startsWith(item.path);
        return (
          <button
            key={item.path}
            type="button"
            className="rail-item"
            data-active={active}
            style={mobile ? { color: active ? tokens.ink : tokens.inkSoft, background: active ? tokens.redWash : 'transparent', boxShadow: active ? `inset 2.5px 0 0 ${tokens.red}` : 'none' } : undefined}
            onClick={() => navigate(item.path)}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </VStack>
  );

  return (
    <Box className="app-shell">
      <Box as="nav" className="app-rail" aria-label="Primary">
        <Box px="22px" pt="26px" pb="22px">
          <Wordmark onClick={() => navigate('/leads')} />
          <Text mt="3px" fontSize="10px" fontWeight="650" letterSpacing=".14em" color="#6e727c" textTransform="uppercase">
            Agency CRM
          </Text>
        </Box>
        <Text px="22px" pb="10px" fontSize="10px" fontWeight="700" letterSpacing=".1em" color="#5b5f69" textTransform="uppercase">
          Workspace
        </Text>
        {navList()}
        <Box mt="auto" px="16px" py="18px" borderTop="1px solid" borderColor="whiteAlpha.100">
          <UserBlock session={session} />
        </Box>
      </Box>

      <Box className="app-main">
        <Flex
          display={{ base: 'flex', lg: 'none' }}
          position="sticky"
          top={0}
          zIndex={80}
          h="56px"
          px={4}
          align="center"
          justify="space-between"
          bg={tokens.rail}
        >
          <Wordmark onClick={() => navigate('/leads')} />
          <HStack spacing={2}>
            <Flex w="30px" h="30px" borderRadius="8px" bg={tokens.red} color="white" align="center" justify="center" fontWeight="700" fontSize="13px">
              {(session.full_name || 'A').charAt(0).toUpperCase()}
            </Flex>
            <IconButton
              aria-label="Open menu"
              icon={<Menu size={20} />}
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={drawer.onOpen}
            />
          </HStack>
        </Flex>
        {children}
      </Box>

      <Drawer isOpen={drawer.isOpen} placement="right" onClose={drawer.onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton mt={1} />
          <Box px="20px" pt="20px" pb="14px" borderBottom="1px solid" borderColor={tokens.borderSoft}>
            <Text fontSize="16px" fontWeight="750">
              THE<Box as="span" color={tokens.red}>A</Box>-LIST
            </Text>
          </Box>
          <DrawerBody px={2} py={3}>
            {navList(true)}
            <Box mt={6} px={3} pt={4} borderTop="1px solid" borderColor={tokens.borderSoft}>
              <UserBlock session={session} dark={false} />
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
