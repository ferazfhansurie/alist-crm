import {
  Box, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader,
  DrawerOverlay, Flex, HStack, IconButton, Text, VStack, useDisclosure
} from '@chakra-ui/react';
import { BarChart3, CalendarDays, Menu, Settings, Table2, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const items = [
  { href: '/crm/leads', label: 'Leads', icon: Users },
  { path: '/leads', label: 'Sheet Audit', icon: Table2 },
  { path: '/daily-report', label: 'Daily Report', icon: CalendarDays },
  { path: '/summary', label: 'Summary', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings, managerOnly: true }
];

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, settings } = useApp();
  const drawer = useDisclosure();
  const visible = items.filter((item) => !item.managerOnly || settings?.can_manage);
  const navButton = (item, mobile = false) => {
    const active = item.path && location.pathname.startsWith(item.path);
    const Icon = item.icon;
    return (
      <Button
        key={item.path || item.href}
        leftIcon={<Icon size={16} />}
        variant="ghost"
        justifyContent={mobile ? 'flex-start' : 'center'}
        w={mobile ? '100%' : 'auto'}
        px="18px"
        py="9px"
        h="40px"
        color={active ? '#15181d' : '#9aa2ad'}
        bg={active ? '#fff' : 'transparent'}
        fontWeight={active ? '700' : '500'}
        _hover={active ? {} : { color: '#e6e8ec', bg: 'whiteAlpha.100' }}
        onClick={() => {
          if (item.href) window.location.assign(item.href);
          else navigate(item.path);
          drawer.onClose();
        }}
      >
        {item.label}
      </Button>
    );
  };

  return (
    <Box position="sticky" top={0} zIndex={100} bg="#15181d">
      <Flex h="74px" px={{ base: 4, lg: '30px' }} align="center">
        <Flex flex={1} align="center">
          <Text color="white" fontSize="20px" fontWeight="700" letterSpacing="-.01em" cursor="pointer" onClick={() => window.location.assign('/crm')}>
            THE<Box as="span" color="#e8384f">A</Box>-LIST
          </Text>
        </Flex>
        <HStack display={{ base: 'none', lg: 'flex' }} spacing="4px">
          {visible.map((item) => navButton(item))}
        </HStack>
        <Flex flex={1} justify="flex-end" align="center" gap={3}>
          <Flex w="34px" h="34px" borderRadius="full" bg="#e8384f" color="white" align="center" justify="center" fontWeight="700">
            {(session.full_name || 'A').charAt(0).toUpperCase()}
          </Flex>
          <Text display={{ base: 'none', md: 'block' }} color="white" fontSize="15px">{session.full_name}</Text>
          <IconButton display={{ base: 'inline-flex', lg: 'none' }} icon={<Menu size={20} />} variant="ghost" color="white" onClick={drawer.onOpen} aria-label="Open menu" />
        </Flex>
      </Flex>
      <Drawer isOpen={drawer.isOpen} placement="right" onClose={drawer.onClose}>
        <DrawerOverlay backdropFilter="blur(8px)" />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader color="alist.500">A-List CRM</DrawerHeader>
          <DrawerBody><VStack align="stretch">{visible.map((item) => navButton(item, true))}</VStack></DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
