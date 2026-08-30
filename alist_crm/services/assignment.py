import json

import frappe

from alist_crm.schema import ASSIGNMENT_POOLS


def _settings_pools() -> dict[str, list[str]]:
	if not frappe.db.exists("DocType", "A-List Settings"):
		return ASSIGNMENT_POOLS
	value = frappe.db.get_single_value("A-List Settings", "assignment_pools")
	try:
		pools = json.loads(value or "{}")
	except json.JSONDecodeError:
		return ASSIGNMENT_POOLS
	return pools if isinstance(pools, dict) else ASSIGNMENT_POOLS


def resolve_user(label: str | None) -> str | None:
	if not label:
		return None
	if frappe.db.exists("User", {"name": label, "enabled": 1}):
		return label
	return frappe.db.get_value("User", {"full_name": label, "enabled": 1}, "name")


def next_owner(channel: str | None) -> tuple[str | None, str | None]:
	pool = _settings_pools().get(channel or "", [])
	if not pool or not frappe.db.exists("DocType", "A-List Assignment State"):
		return None, None

	rows = frappe.db.sql(
		"select cursor from `tabA-List Assignment State` where name=%s for update",
		(channel,),
		as_dict=True,
	)
	if rows:
		cursor = int(rows[0].cursor or 0)
	else:
		state = frappe.get_doc(
			{"doctype": "A-List Assignment State", "channel": channel, "cursor": 0}
		).insert(ignore_permissions=True)
		cursor = int(state.cursor or 0)

	label = pool[cursor % len(pool)]
	frappe.db.set_value("A-List Assignment State", channel, "cursor", cursor + 1, update_modified=False)
	return label, resolve_user(label)


def assign_if_needed(doc, method=None):
	if doc.get("lead_owner"):
		if not doc.get("alist_pic_name"):
			doc.alist_pic_name = frappe.db.get_value("User", doc.lead_owner, "full_name") or doc.lead_owner
		return

	if doc.get("alist_pic_name"):
		doc.lead_owner = resolve_user(doc.alist_pic_name)
		return

	label, user = next_owner(doc.get("alist_channel"))
	if label:
		doc.alist_pic_name = label
	if user:
		doc.lead_owner = user

