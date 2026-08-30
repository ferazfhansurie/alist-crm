import {
  Button, FormControl, FormLabel, Grid, GridItem, Input, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay,
  Select, Text, Textarea, useToast
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../services/frappeApi';
import { tokens } from '../../theme';
import { SectionLabel } from '../ui';
import { CHANNELS } from './actions';

const initialValues = {
  first_name: '', organization: '', mobile_no: '', email: '', alist_channel: 'Meta',
  alist_pic_name: '', alist_annual_sales_band: '', alist_monthly_sales_text: '',
  alist_business_type: '', alist_service_required: '', alist_next_follow_up: '', alist_remark: ''
};

export default function CreateLeadModal({ isOpen, onClose, onCreated }) {
  const { settings } = useApp();
  const toast = useToast();
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setValues(initialValues);
  }, [isOpen]);

  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = async () => {
    if (!values.first_name.trim() && !values.organization.trim()) {
      toast({ title: 'Add a name or organization', status: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const result = await api.createLead(values);
      toast({ title: 'Lead created', status: 'success', duration: 1800 });
      onCreated(result.name);
    } catch (error) {
      toast({ title: 'Could not create lead', description: error.message, status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
      <ModalContent overflow="hidden">
        <ModalHeader pb={2} borderBottom="1px solid" borderColor={tokens.borderSoft}>
          <Text fontFamily="display" fontSize="20px" fontWeight="600">Create a lead</Text>
          <Text mt={1} color={tokens.muted} fontSize="12.5px" fontWeight="400" pb={2}>
            Start with what you have — everything stays editable on the lead record.
          </Text>
        </ModalHeader>
        <ModalCloseButton mt={1} />
        <ModalBody py={5}>
          <SectionLabel mb={3}>Who</SectionLabel>
          <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap={4} mb={6}>
            <FormControl isRequired><FormLabel requiredIndicator={null}>Lead name</FormLabel><Input value={values.first_name} onChange={set('first_name')} placeholder="Full name" autoFocus /></FormControl>
            <FormControl><FormLabel>Organization</FormLabel><Input value={values.organization} onChange={set('organization')} placeholder="Company or brand" /></FormControl>
            <FormControl><FormLabel>WhatsApp / phone</FormLabel><Input value={values.mobile_no} onChange={set('mobile_no')} placeholder="+60…" /></FormControl>
            <FormControl><FormLabel>Email</FormLabel><Input type="email" value={values.email} onChange={set('email')} placeholder="name@company.com" /></FormControl>
          </Grid>

          <SectionLabel mb={3}>Routing</SectionLabel>
          <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap={4} mb={6}>
            <FormControl>
              <FormLabel>Channel</FormLabel>
              <Select value={values.alist_channel} onChange={set('alist_channel')}>
                {CHANNELS.map((channel) => <option key={channel}>{channel}</option>)}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>PIC</FormLabel>
              <Select value={values.alist_pic_name} onChange={set('alist_pic_name')}>
                <option value="">Auto assign</option>
                {Object.keys(settings?.owner_colors || {}).map((owner) => <option key={owner}>{owner}</option>)}
              </Select>
            </FormControl>
          </Grid>

          <SectionLabel mb={3}>Qualification</SectionLabel>
          <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap={4}>
            <FormControl><FormLabel>Sales tahunan</FormLabel><Input value={values.alist_annual_sales_band} onChange={set('alist_annual_sales_band')} placeholder="e.g. RM100,000 – RM500,000" /></FormControl>
            <FormControl><FormLabel>Sales bulanan</FormLabel><Input value={values.alist_monthly_sales_text} onChange={set('alist_monthly_sales_text')} placeholder="Monthly range" /></FormControl>
            <FormControl><FormLabel>Business type</FormLabel><Input value={values.alist_business_type} onChange={set('alist_business_type')} placeholder="Industry or model" /></FormControl>
            <FormControl><FormLabel>Service required</FormLabel><Input value={values.alist_service_required} onChange={set('alist_service_required')} placeholder="What they need" /></FormControl>
            <FormControl><FormLabel>Next follow-up</FormLabel><Input type="datetime-local" value={values.alist_next_follow_up} onChange={set('alist_next_follow_up')} /></FormControl>
            <GridItem />
            <GridItem colSpan={2}>
              <FormControl><FormLabel>Remark</FormLabel><Textarea value={values.alist_remark} onChange={set('alist_remark')} placeholder="Context the PIC should know before reaching out" rows={3} /></FormControl>
            </GridItem>
          </Grid>
        </ModalBody>
        <ModalFooter borderTop="1px solid" borderColor={tokens.borderSoft} gap={2}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="signal" onClick={submit} isLoading={saving}>Create lead</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
