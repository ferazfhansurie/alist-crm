import { Box, Button, Code, FormControl, FormLabel, Grid, Input, Text, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/frappeApi';

export default function SettingsPage() {
  const { settings, setSettings } = useApp();
  const [leadTarget, setLeadTarget] = useState(settings?.lead_target || 0);
  const [spendTarget, setSpendTarget] = useState(settings?.spend_target || 0);
  const toast = useToast();
  useEffect(() => { setLeadTarget(settings?.lead_target || 0); setSpendTarget(settings?.spend_target || 0); }, [settings]);
  const save = async () => {
    try {
      const values = await api.saveTargets({ lead_target: leadTarget, spend_target: spendTarget });
      setSettings({ ...settings, ...values });
      toast({ title: 'Targets saved', status: 'success', duration: 1800 });
    } catch (error) { toast({ title: 'Could not save', description: error.message, status: 'error' }); }
  };
  if (!settings?.can_manage) return <Box p={8}>Not permitted.</Box>;
  return (
    <Box px={{ base: 4, xl: 8 }} py={6} maxW="1000px">
      <PageHeader title="Settings" description="Monthly targets and source-specific assignment pools." />
      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="12px" p={5} mb={5}>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr auto' }} gap={4} alignItems="end">
          <FormControl><FormLabel>Monthly Lead Target</FormLabel><Input type="number" value={leadTarget} onChange={(event) => setLeadTarget(event.target.value)} /></FormControl>
          <FormControl><FormLabel>Monthly Spend Target (RM)</FormLabel><Input type="number" value={spendTarget} onChange={(event) => setSpendTarget(event.target.value)} /></FormControl>
          <Button bg="alist.500" color="white" _hover={{ bg: 'alist.600' }} onClick={save}>Save targets</Button>
        </Grid>
      </Box>
      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="12px" p={5}>
        <Text fontWeight="700" mb={3}>Assignment pools</Text>
        <Code display="block" whiteSpace="pre" p={4} borderRadius="8px" w="100%">{JSON.stringify(settings.assignment_pools, null, 2)}</Code>
        <Text fontSize="sm" color="gray.500" mt={3}>Pool changes are manager-controlled in the a-list settings doctype for the first release.</Text>
      </Box>
    </Box>
  );
}
