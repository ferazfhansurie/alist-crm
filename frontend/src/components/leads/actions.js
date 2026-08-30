import {
  Ban, CalendarCheck, CalendarPlus, CircleSlash, Copy, MessageCircle,
  PenLine, Phone, PhoneMissed, ThumbsDown, ThumbsUp, Trophy, User, VolumeX
} from 'lucide-react';

/**
 * Mirrors alist_crm.services.lead_workflow.ACTIONS — every key here must exist
 * on the backend. Grouping and labels follow the team's workbook language.
 */
export const ACTION_GROUPS = [
  {
    label: 'Outreach',
    actions: [
      { key: 'contacted', label: 'Dah contact', icon: User },
      { key: 'call_pickup', label: 'Call · pickup', icon: Phone },
      { key: 'call_no_pickup', label: 'Call · no pickup', icon: PhoneMissed },
      { key: 'whatsapp_replied', label: 'WhatsApp replied', icon: MessageCircle },
      { key: 'no_whatsapp', label: 'No WhatsApp', icon: Ban },
      { key: 'no_response', label: 'No response', icon: VolumeX }
    ]
  },
  {
    label: 'Pipeline',
    actions: [
      { key: 'meeting_set', label: 'Meeting set', icon: CalendarPlus, needsSchedule: true },
      { key: 'meeting_done', label: 'Dah meeting', icon: CalendarCheck },
      { key: 'proposal_requested', label: 'Proposal requested', icon: PenLine },
      { key: 'signed_client', label: 'Signed client', icon: Trophy, needsValue: true }
    ]
  },
  {
    label: 'Qualification',
    actions: [
      { key: 'non_quality', label: 'Non-quality', icon: ThumbsDown },
      { key: 'bad_lead', label: 'Bad lead', icon: CircleSlash },
      { key: 'redundant', label: 'Redundant / duplicate', icon: Copy }
    ]
  },
  {
    label: 'Event',
    actions: [
      { key: 'confirmed', label: 'Event confirmed', icon: ThumbsUp },
      { key: 'declined', label: 'Declined', icon: ThumbsDown }
    ]
  }
];

export const ACTIONS_BY_KEY = Object.fromEntries(
  ACTION_GROUPS.flatMap((group) => group.actions.map((action) => [action.key, action]))
);

export const QUICK_ACTIONS = ['call_pickup', 'call_no_pickup', 'whatsapp_replied', 'meeting_set'];

export const CHANNELS = ['Meta', 'TikTok', 'Google', 'Founder Series', 'Boss / Manual', 'Talent', 'Past Client', 'Website'];

export const STATUSES = ['New', 'Contacted', 'Meeting Set', 'Meeting Done', 'Converted', 'Disqualified', 'Duplicate'];

export const OUTCOMES = [
  'Pickup', 'No Pickup', 'Replied', 'No WhatsApp', 'Meeting Set', 'Meeting Done',
  'Proposal Requested', 'No Response', 'Non-Quality', 'Bad Lead', 'Redundant'
];

export const CLOSED_STATUSES = ['Converted', 'Disqualified', 'Duplicate'];

export function isOverdue(lead) {
  return Boolean(
    lead.alist_next_follow_up &&
    new Date(lead.alist_next_follow_up) < new Date() &&
    !CLOSED_STATUSES.includes(lead.status)
  );
}

export function waLink(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}
