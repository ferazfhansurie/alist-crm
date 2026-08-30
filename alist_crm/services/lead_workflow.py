from dataclasses import dataclass

import frappe
from frappe.utils import flt, now_datetime

from alist_crm.services.assignment import resolve_user


@dataclass(frozen=True)
class Action:
	activity_type: str
	outcome: str
	status: str | None = None
	last_outcome: str | None = None
	event_outcome: str | None = None


ACTIONS = {
	"contacted": Action("Contact", "Contacted", "Contacted"),
	"call_pickup": Action("Call", "Pickup", "Contacted", "Pickup"),
	"call_no_pickup": Action("Call", "No Pickup", "Contacted", "No Pickup"),
	"whatsapp_replied": Action("WhatsApp", "Replied", "Contacted", "Replied"),
	"no_whatsapp": Action("WhatsApp", "No WhatsApp", "Contacted", "No WhatsApp"),
	"meeting_set": Action("Meeting", "Set", "Meeting Set", "Meeting Set"),
	"meeting_done": Action("Meeting", "Completed", "Meeting Done", "Meeting Done"),
	"proposal_requested": Action("Proposal", "Proposal Requested", "Converted", "Proposal Requested"),
	"signed_client": Action("Conversion", "Signed Client", "Converted"),
	"no_response": Action("Contact", "No Response", "Contacted", "No Response"),
	"non_quality": Action("Qualification", "Non-Quality", "Disqualified", "Non-Quality"),
	"bad_lead": Action("Qualification", "Bad Lead", "Disqualified", "Bad Lead"),
	"redundant": Action("Qualification", "Redundant", "Duplicate", "Redundant"),
	"confirmed": Action("Event", "Confirmed", None, None, "Confirmed"),
	"declined": Action("Event", "Declined", "Disqualified", None, "Declined"),
}


def _append_activity(
	lead: str,
	action: Action,
	scheduled_for=None,
	note: str | None = None,
	source_label: str | None = None,
):
	return frappe.get_doc(
		{
			"doctype": "A-List Lead Activity",
			"lead": lead,
			"activity_type": action.activity_type,
			"outcome": action.outcome,
			"occurred_at": now_datetime(),
			"scheduled_for": scheduled_for,
			"actor": frappe.session.user,
			"note": note,
			"source_label": source_label,
		}
	).insert()


def _convert_to_deal(lead, confirmed_value=None) -> str:
	if lead.alist_linked_deal and frappe.db.exists("CRM Deal", lead.alist_linked_deal):
		deal_name = lead.alist_linked_deal
	else:
		deal_payload = {
			"status": "Proposal",
			"alist_source_tab": lead.alist_source_tab,
			"alist_source_row": lead.alist_source_row,
		}
		deal_name = lead.convert_to_deal(deal=deal_payload)
		lead.reload()
		lead.db_set("alist_linked_deal", deal_name, update_modified=False)

	if confirmed_value is not None:
		frappe.db.set_value(
			"CRM Deal",
			deal_name,
			{"status": "Won", "alist_confirmed_value": flt(confirmed_value)},
		)
	return deal_name


def apply_action(
	lead_name: str,
	action_key: str,
	scheduled_for=None,
	note: str | None = None,
	confirmed_value=None,
) -> dict:
	if action_key not in ACTIONS:
		frappe.throw("Unknown lead action")
	if not frappe.has_permission("CRM Lead", "write", lead_name):
		frappe.throw("Not permitted", frappe.PermissionError)

	lead = frappe.get_doc("CRM Lead", lead_name)
	action = ACTIONS[action_key]
	activity = _append_activity(lead_name, action, scheduled_for, note, action.outcome)

	updates = {}
	if action.status:
		updates["status"] = action.status
	if action.last_outcome:
		updates["alist_last_outcome"] = action.last_outcome
	if action.event_outcome:
		updates["alist_event_outcome"] = action.event_outcome
	if scheduled_for:
		updates["alist_next_follow_up"] = scheduled_for
	if updates:
		frappe.db.set_value("CRM Lead", lead_name, updates)

	deal = None
	if action_key in {"proposal_requested", "signed_client"}:
		deal = _convert_to_deal(lead, confirmed_value if action_key == "signed_client" else None)

	return {
		"lead": lead_name,
		"action": action_key,
		"activity": activity.name,
		"deal": deal,
		"status": updates.get("status") or lead.status,
	}


def reassign(lead_name: str, owner_label: str, note: str | None = None) -> dict:
	if not frappe.has_permission("CRM Lead", "write", lead_name):
		frappe.throw("Not permitted", frappe.PermissionError)
	user = resolve_user(owner_label)
	updates = {"alist_pic_name": owner_label, "lead_owner": user}
	frappe.db.set_value("CRM Lead", lead_name, updates)
	activity = frappe.get_doc(
		{
			"doctype": "A-List Lead Activity",
			"lead": lead_name,
			"activity_type": "Reassignment",
			"outcome": "Reassigned",
			"occurred_at": now_datetime(),
			"actor": frappe.session.user,
			"note": note or f"Passed to {owner_label}",
			"source_label": f"Pass to {owner_label}",
		}
	).insert()
	return {"lead": lead_name, "owner": user, "owner_label": owner_label, "activity": activity.name}

