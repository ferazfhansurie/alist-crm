import frappe
from frappe.utils import add_days, today

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
