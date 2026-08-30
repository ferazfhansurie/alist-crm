import {
  Box, Button, Flex, FormControl, FormLabel, Grid, HStack, Input, SimpleGrid, Text, useToast
} from '@chakra-ui/react';
import { ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { EmptyState, SectionLabel, Surface } from '../components/ui';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/frappeApi';
import { channelPalette, tokens } from '../theme';

function PoolMember({ owner, color }) {
  return (
    <HStack spacing="7px" px={2.5} py={1.5} bg={tokens.surfaceTint} border="1px solid" borderColor={tokens.borderSoft} borderRadius="6px">
      <Box w="8px" h="8px" borderRadius="2px" bg={color || tokens.borderStrong} />
      <Text fontSize="12.5px" fontWeight="600">{owner}</Text>
    </HStack>
  );
}

export default function SettingsPage() {
  const { settings, setSettings } = useApp();
  const toast = useToast();
  const [leadTarget, setLeadTarget] = useState(settings?.lead_target || 0);
  const [spendTarget, setSpendTarget] = useState(settings?.spend_target || 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLeadTarget(settings?.lead_target || 0);
    setSpendTarget(settings?.spend_target || 0);
  }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      const values = await api.saveTargets({ lead_target: leadTarget, spend_target: spendTarget });
      setSettings({ ...settings, ...values });
      toast({ title: 'Targets saved', status: 'success', duration: 1800 });
    } catch (error) {
      toast({ title: 'Could not save', description: error.message, status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!settings?.can_manage) {
    return (
      <Box px={{ base: 4, xl: 8 }} py={6}>
        <EmptyState
          icon={ShieldAlert}
          title="Managers only"
          hint="Settings are restricted to the Sales Manager and System Manager roles."
        />
      </Box>
    );
  }

  const pools = settings.assignment_pools || {};
  const ownerColors = settings.owner_colors || {};

  return (
    <Box px={{ base: 4, xl: 8 }} py={6} maxW="1000px">
      <PageHeader
        kicker="Administration"
        title="Settings"
        description="Monthly targets drive the daily report pace. Assignment pools control the PIC rotation for incoming leads."
      />

      <Surface p={5} mb={5}>
        <SectionLabel mb={4}>Monthly targets</SectionLabel>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr auto' }} gap={4} alignItems="end">
          <FormControl>
            <FormLabel>Lead target</FormLabel>
            <Input type="number" value={leadTarget} onChange={(event) => setLeadTarget(event.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel>Spend target (RM)</FormLabel>
            <Input type="number" value={spendTarget} onChange={(event) => setSpendTarget(event.target.value)} />
          </FormControl>
          <Button variant="signal" onClick={save} isLoading={saving}>Save targets</Button>
        </Grid>
        <Text mt={3} fontSize="12px" color={tokens.muted}>
          Both targets reset the pace bars on the daily report immediately after saving.
        </Text>
      </Surface>

      <Surface p={5} mb={5}>
        <SectionLabel mb={1}>Assignment pools</SectionLabel>
        <Text fontSize="12.5px" color={tokens.muted} mb={4}>
          New leads on these channels rotate through the listed PICs. Pool membership is managed in the A-List Settings doctype for this release.
        </Text>
        {Object.keys(pools).length ? (
          <Flex direction="column" gap={3}>
            {Object.entries(pools).map(([channel, members]) => (
              <Flex key={channel} align={{ base: 'flex-start', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }}>
                <HStack minW="150px" spacing={2}>
                  <Box w="7px" h="7px" borderRadius="full" bg={channelPalette[channel] || tokens.muted} />
                  <Text fontSize="13px" fontWeight="650">{channel}</Text>
                </HStack>
                <Flex gap={2} flexWrap="wrap">
                  {(Array.isArray(members) ? members : []).map((owner) => (
                    <PoolMember key={owner} owner={owner} color={ownerColors[owner]} />
                  ))}
                </Flex>
              </Flex>
            ))}
          </Flex>
        ) : (
          <Text fontSize="12.5px" color={tokens.faint}>No pools configured — every lead needs a manual PIC.</Text>
        )}
      </Surface>

      <Surface p={5}>
        <SectionLabel mb={1}>Team legend</SectionLabel>
        <Text fontSize="12.5px" color={tokens.muted} mb={4}>
          The colors used for each PIC across the lead list, reports and detail panel.
        </Text>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          {Object.entries(ownerColors).map(([owner, color]) => (
            <PoolMember key={owner} owner={owner} color={color} />
          ))}
        </SimpleGrid>
      </Surface>
    </Box>
  );
}
