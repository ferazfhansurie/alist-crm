import json

import frappe
from frappe.utils import add_days, cint, flt, today

from alist_crm.schema import CHANNEL_COLORS, OWNER_COLORS
from alist_crm.services import lead_workflow, metrics

OPEN_STAGES = ["New", "Contacted", "Qualified", "Proposal"]
ALL_STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Campaign", "Lost"]


@frappe.whitelist()
def overview():
	counts = {s: 0 for s in ALL_STAGES}
	for r in frappe.get_all(
		"CRM Deal", fields=["status", "count(name) as n"], group_by="status"
	):
		if r.status in counts:
			counts[r.status] = r.n

	pipeline = frappe.get_all(
		"CRM Deal",
		filters={"status": ["in", OPEN_STAGES]},
		fields=["sum(alist_proposal_value) as value", "count(name) as n"],
	)[0]

	won = frappe.get_all(
		"CRM Deal",
		filters={"status": ["in", ["Won", "Campaign"]]},
		fields=["sum(alist_confirmed_value) as value", "count(name) as n"],
	)[0]

	followups = frappe.get_all(
		"CRM Deal",
		filters={
			"status": ["in", OPEN_STAGES],
			"alist_next_follow_up": ["<=", add_days(today(), 7)],
		},
		fields=[
			"name",
			"organization",
			"status",
			"alist_proposal_value",
			"alist_next_follow_up",
			"deal_owner",
		],
		order_by="alist_next_follow_up asc",
		limit=10,
	)

	recent = frappe.get_all(
		"CRM Deal",
		fields=[
			"name",
			"organization",
			"status",
			"alist_proposal_value",
			"alist_confirmed_value",
			"alist_mo_code",
			"alist_invoice_no",
			"deal_owner",
			"modified",
		],
		order_by="modified desc",
		limit=10,
	)

	return {
		"stage_counts": counts,
		"stages": ALL_STAGES,
		"pipeline": {"value": pipeline.value or 0, "n": pipeline.n or 0},
		"won": {"value": won.value or 0, "n": won.n or 0},
		"followups": followups,
		"recent": recent,
	}


def has_app_permission():
	return frappe.session.user != "Guest"


@frappe.whitelist()
def session():
	if frappe.session.user == "Guest":
		frappe.throw("Login required", frappe.AuthenticationError)
	user = frappe.get_cached_value("User", frappe.session.user, ["full_name", "user_image"], as_dict=True)
	return {
		"user": frappe.session.user,
		"full_name": user.full_name if user else frappe.session.user,
		"user_image": user.user_image if user else None,
		"roles": frappe.get_roles(),
		"csrf_token": frappe.sessions.get_csrf_token(),
	}


LEAD_FIELDS = [
	"name",
	"lead_name",
	"first_name",
	"email",
	"mobile_no",
	"organization",
	"status",
	"lead_owner",
	"source",
	"modified",
	"alist_lead_datetime",
	"alist_channel",
	"alist_stream",
	"alist_annual_sales_band",
	"alist_monthly_sales_text",
	"alist_monthly_sales_value",
	"alist_pic_name",
	"alist_last_outcome",
	"alist_event_outcome",
	"alist_next_follow_up",
	"alist_remark",
	"alist_ad_name",
	"alist_campaign_name",
	"alist_linked_deal",
]

EDITABLE_FIELDS = {
	"alist_annual_sales_band",
	"alist_monthly_sales_text",
	"alist_monthly_sales_value",
	"alist_next_follow_up",
	"alist_remark",
	"organization",
	"email",
	"mobile_no",
}


@frappe.whitelist()
def list_leads(filters=None, search=None, start=0, page_length=100, order_by="alist_lead_datetime desc"):
	if not frappe.has_permission("CRM Lead", "read"):
		frappe.throw("Not permitted", frappe.PermissionError)
	filters = frappe.parse_json(filters) if filters else {}
	allowed_filters = {"alist_channel", "alist_stream", "status", "alist_pic_name"}
	db_filters = {key: value for key, value in filters.items() if key in allowed_filters and value}
	if filters.get("month"):
		month_start, month_end = metrics.month_bounds(filters["month"])
		db_filters["alist_lead_datetime"] = ["between", [month_start, month_end]]

	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = {
			"lead_name": ["like", term],
			"organization": ["like", term],
			"email": ["like", term],
			"mobile_no": ["like", term],
		}

	allowed_order = {
		"alist_lead_datetime desc",
		"alist_lead_datetime asc",
		"modified desc",
		"lead_name asc",
	}
	if order_by not in allowed_order:
		order_by = "alist_lead_datetime desc"

	rows = frappe.get_list(
		"CRM Lead",
		filters=db_filters,
		or_filters=or_filters,
		fields=LEAD_FIELDS,
		start=max(cint(start), 0),
		page_length=min(max(cint(page_length), 1), 250),
		order_by=order_by,
	)
	count = frappe.db.count("CRM Lead", filters=db_filters)
	return {"rows": rows, "count": count}


@frappe.whitelist()
def lead_detail(name: str):
	if not frappe.has_permission("CRM Lead", "read", name):
		frappe.throw("Not permitted", frappe.PermissionError)
	doc = frappe.get_doc("CRM Lead", name).as_dict()
	activities = frappe.get_list(
		"A-List Lead Activity",
		filters={"lead": name},
		fields=[
			"name",
			"activity_type",
			"outcome",
			"occurred_at",
			"scheduled_for",
			"actor",
			"note",
			"source_label",
		],
		order_by="occurred_at desc",
		limit_page_length=200,
	)
	return {"lead": doc, "activities": activities}


@frappe.whitelist(methods=["POST"])
def update_lead(name: str, field: str, value=None, modified=None):
	if field not in EDITABLE_FIELDS:
		frappe.throw("This field cannot be edited from the lead grid")
	if not frappe.has_permission("CRM Lead", "write", name):
		frappe.throw("Not permitted", frappe.PermissionError)
	doc = frappe.get_doc("CRM Lead", name)
	if modified and str(doc.modified) != str(modified):
		frappe.throw("This lead changed elsewhere. Refresh before saving.", frappe.TimestampMismatchError)
	doc.set(field, value)
	doc.save()
	return {"name": doc.name, "field": field, "value": doc.get(field), "modified": doc.modified}


@frappe.whitelist(methods=["POST"])
def apply_lead_action(name: str, action: str, scheduled_for=None, note=None, confirmed_value=None):
	return lead_workflow.apply_action(name, action, scheduled_for, note, confirmed_value)


@frappe.whitelist(methods=["POST"])
def reassign_lead(name: str, owner_label: str, note=None):
	return lead_workflow.reassign(name, owner_label, note)


@frappe.whitelist()
def daily_report(month=None):
	if not frappe.has_permission("CRM Lead", "read"):
		frappe.throw("Not permitted", frappe.PermissionError)
	return metrics.daily_report(month)


@frappe.whitelist()
def monthly_summary():
	if not frappe.has_permission("CRM Lead", "read"):
		frappe.throw("Not permitted", frappe.PermissionError)
	return metrics.monthly_summary()


@frappe.whitelist()
def workspace_settings():
	if frappe.session.user == "Guest":
		frappe.throw("Login required", frappe.AuthenticationError)
	settings = frappe.get_single("A-List Settings")
	return {
		"lead_target": settings.lead_target,
		"spend_target": settings.spend_target,
		"owner_colors": json.loads(settings.owner_colors or json.dumps(OWNER_COLORS)),
		"channel_colors": json.loads(settings.channel_colors or json.dumps(CHANNEL_COLORS)),
		"assignment_pools": json.loads(settings.assignment_pools or "{}"),
		"can_manage": bool({"System Manager", "Sales Manager"} & set(frappe.get_roles())),
	}


@frappe.whitelist(methods=["POST"])
def save_targets(lead_target=None, spend_target=None):
	if not ({"System Manager", "Sales Manager"} & set(frappe.get_roles())):
		frappe.throw("Not permitted", frappe.PermissionError)
	settings = frappe.get_single("A-List Settings")
	settings.lead_target = max(cint(lead_target), 0)
	settings.spend_target = max(flt(spend_target), 0)
	settings.save()
	return {"lead_target": settings.lead_target, "spend_target": settings.spend_target}


@frappe.whitelist(methods=["POST"])
def save_daily_marketing(date: str, channel: str, lead_spend=0, awareness_spend=0, remark=None):
	if not ({"System Manager", "Sales Manager"} & set(frappe.get_roles())):
		frappe.throw("Not permitted", frappe.PermissionError)
	name = frappe.db.exists("A-List Daily Marketing", {"date": date, "channel": channel})
	if name:
		doc = frappe.get_doc("A-List Daily Marketing", name)
	else:
		doc = frappe.new_doc("A-List Daily Marketing")
		doc.date = date
		doc.channel = channel
	doc.lead_spend = max(flt(lead_spend), 0)
	doc.awareness_spend = max(flt(awareness_spend), 0)
	doc.remark = remark
	doc.save()
	return doc.as_dict()
