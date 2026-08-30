import json
from collections import defaultdict
from datetime import datetime

import frappe
from frappe.utils import flt, get_first_day, get_last_day, getdate, nowdate

from alist_crm.schema import CHANNEL_COLORS


def month_bounds(month: str | None = None):
	base = datetime.strptime(month, "%Y-%m").date() if month else getdate(nowdate())
	return get_first_day(base), get_last_day(base)


def _safe_div(numerator, denominator):
	return flt(numerator) / flt(denominator) if flt(denominator) else 0


def daily_report(month: str | None = None) -> dict:
	start, end = month_bounds(month)
	leads = frappe.get_all(
		"CRM Lead",
		filters={"alist_lead_datetime": ["between", [start, end]]},
		fields=["name", "alist_lead_datetime", "alist_channel", "alist_pic_name"],
		limit_page_length=0,
	)
	lead_map = {row.name: row for row in leads}
	activities = frappe.get_all(
		"A-List Lead Activity",
		filters={
			"occurred_at": ["between", [start, end]],
			"activity_type": "Meeting",
			"outcome": ["in", ["Set", "Completed"]],
		},
		fields=["lead", "occurred_at", "outcome"],
		limit_page_length=0,
	)
	marketing = frappe.get_all(
		"A-List Daily Marketing",
		filters={"date": ["between", [start, end]]},
		fields=[
			"date",
			"channel",
			"reported_leads",
			"reported_meetings",
			"monthly_adjustment",
			"lead_spend",
			"awareness_spend",
			"remark",
		],
		order_by="date asc, channel asc",
		limit_page_length=0,
	)

	days = defaultdict(lambda: {"leads": 0, "meetings": 0, "spend": 0, "awareness": 0, "remarks": []})
	channels = defaultdict(lambda: {"leads": 0, "meetings": 0, "spend": 0, "awareness": 0})
	owners = defaultdict(lambda: {"leads": 0, "meetings": 0})
	has_reported_metrics = any(
		row.reported_leads or row.reported_meetings or row.monthly_adjustment for row in marketing
	)

	for lead in leads:
		day = getdate(lead.alist_lead_datetime).isoformat()
		channel = lead.alist_channel or "Unassigned"
		owner = lead.alist_pic_name or "Unassigned"
		if not has_reported_metrics:
			days[day]["leads"] += 1
			channels[channel]["leads"] += 1
		owners[owner]["leads"] += 1

	for activity in activities:
		day = getdate(activity.occurred_at).isoformat()
		lead = lead_map.get(activity.lead)
		channel = (lead and lead.alist_channel) or "Unassigned"
		owner = (lead and lead.alist_pic_name) or "Unassigned"
		if not has_reported_metrics:
			days[day]["meetings"] += 1
			channels[channel]["meetings"] += 1
		owners[owner]["meetings"] += 1

	for row in marketing:
		day = getdate(row.date).isoformat()
		channel = row.channel or "Unassigned"
		spend = flt(row.lead_spend)
		awareness = flt(row.awareness_spend)
		if has_reported_metrics:
			channels[channel]["leads"] += int(row.reported_leads or 0)
			channels[channel]["meetings"] += int(row.reported_meetings or 0)
			if not row.monthly_adjustment:
				days[day]["leads"] += int(row.reported_leads or 0)
				days[day]["meetings"] += int(row.reported_meetings or 0)
		if not row.monthly_adjustment:
			days[day]["spend"] += spend
			days[day]["awareness"] += awareness
			if row.remark:
				days[day]["remarks"].append(row.remark)
		channels[channel]["spend"] += spend
		channels[channel]["awareness"] += awareness

	for metrics in list(days.values()) + list(channels.values()):
		metrics["cpl"] = _safe_div(metrics["spend"], metrics["leads"])
		metrics["cost_per_meeting"] = _safe_div(metrics["spend"], metrics["meetings"])

	settings = frappe.get_single("A-List Settings")
	total_leads = (
		sum(int(row.reported_leads or 0) for row in marketing) if has_reported_metrics else len(leads)
	)
	total_meetings = (
		sum(int(row.reported_meetings or 0) for row in marketing) if has_reported_metrics else len(activities)
	)
	total_spend = sum(flt(row.lead_spend) for row in marketing)
	total_awareness = sum(flt(row.awareness_spend) for row in marketing)
	lead_target = int(settings.lead_target or 0)
	spend_target = flt(settings.spend_target)
	remaining_leads = max(lead_target - total_leads, 0)
	remaining_spend = max(spend_target - total_spend, 0)
	today = getdate(nowdate())
	if start <= today <= end:
		remaining_days = max((end - today).days + 1, 1)
	else:
		remaining_days = 0

	return {
		"month": start.strftime("%Y-%m"),
		"range": {"start": start.isoformat(), "end": end.isoformat()},
		"totals": {
			"leads": total_leads,
			"meetings": total_meetings,
			"lead_target": lead_target,
			"remaining_leads": remaining_leads,
			"average_cpl": _safe_div(total_spend, total_leads),
			"daily_lead_target": _safe_div(remaining_leads, remaining_days),
			"lead_progress": _safe_div(total_leads, lead_target),
			"average_cost_per_meeting": _safe_div(total_spend, total_meetings),
			"spend": total_spend,
			"spend_target": spend_target,
			"remaining_spend": remaining_spend,
			"daily_spend_target": _safe_div(remaining_spend, remaining_days),
			"spend_progress": _safe_div(total_spend, spend_target),
			"awareness_spend": total_awareness,
		},
		"channels": [
			{"channel": channel, "color": CHANNEL_COLORS.get(channel, "#718096"), **values}
			for channel, values in sorted(channels.items())
		],
		"owners": [{"owner": owner, **values} for owner, values in sorted(owners.items())],
		"days": [
			{
				"date": day,
				"leads": values["leads"],
				"meetings": values["meetings"],
				"spend": values["spend"],
				"awareness": values["awareness"],
				"cpl": values["cpl"],
				"cost_per_meeting": values["cost_per_meeting"],
				"remark": " · ".join(values["remarks"]),
			}
			for day, values in sorted(days.items())
		],
	}


def monthly_summary() -> dict:
	leads = frappe.get_all(
		"CRM Lead",
		filters={"alist_lead_datetime": ["is", "set"]},
		fields=["name", "alist_lead_datetime", "alist_channel"],
		limit_page_length=0,
	)
	lead_map = {row.name: row for row in leads}
	activities = frappe.get_all(
		"A-List Lead Activity",
		filters={"activity_type": "Meeting", "outcome": ["in", ["Set", "Completed"]]},
		fields=["lead", "occurred_at"],
		limit_page_length=0,
	)
	marketing = frappe.get_all(
		"A-List Daily Marketing",
		fields=["date", "lead_spend"],
		limit_page_length=0,
	)
	deals = frappe.get_all(
		"CRM Deal",
		filters={"status": ["in", ["Won", "Campaign"]]},
		fields=[
			"name",
			"lead",
			"organization_name",
			"closed_date",
			"modified",
			"alist_confirmed_value",
		],
		limit_page_length=0,
	)

	months = defaultdict(lambda: {"leads": 0, "meetings": 0, "closed": 0, "closed_amount": 0, "spend": 0})
	for lead in leads:
		key = getdate(lead.alist_lead_datetime).strftime("%Y-%m")
		months[key]["leads"] += 1
	for activity in activities:
		key = getdate(activity.occurred_at).strftime("%Y-%m")
		months[key]["meetings"] += 1
	for row in marketing:
		key = getdate(row.date).strftime("%Y-%m")
		months[key]["spend"] += flt(row.lead_spend)

	closings = []
	for deal in deals:
		closed_on = getdate(deal.closed_date or deal.modified)
		key = closed_on.strftime("%Y-%m")
		amount = flt(deal.alist_confirmed_value)
		months[key]["closed"] += 1
		months[key]["closed_amount"] += amount
		lead = lead_map.get(deal.lead)
		closings.append(
			{
				"deal": deal.name,
				"client": deal.organization_name or "Unnamed client",
				"amount": amount,
				"closed_on": closed_on.isoformat(),
				"source_month": (
					getdate(lead.alist_lead_datetime).strftime("%Y-%m") if lead else None
				),
				"channel": lead.alist_channel if lead else None,
			}
		)

	settings = frappe.get_single("A-List Settings")
	try:
		historical_months = json.loads(settings.historical_summary_json or "[]")
		historical_closings = json.loads(settings.historical_closings_json or "[]")
	except (TypeError, ValueError, json.JSONDecodeError):
		historical_months = []
		historical_closings = []
	for snapshot in historical_months:
		key = snapshot.get("month")
		if not key:
			continue
		months[key].update(
			{
				"leads": int(snapshot.get("leads") or 0),
				"meetings": int(snapshot.get("meetings") or 0),
				"closed": int(snapshot.get("closed") or 0),
				"closed_amount": flt(snapshot.get("closed_amount")),
				"spend": flt(snapshot.get("spend")),
			}
		)
	closings = historical_closings + closings

	rows = []
	for key, values in sorted(months.items()):
		rows.append(
			{
				"month": key,
				**values,
				"lead_to_meeting": _safe_div(values["meetings"], values["leads"]),
				"meeting_to_close": _safe_div(values["closed"], values["meetings"]),
			}
		)
	return {"months": rows, "closings": sorted(closings, key=lambda row: row["closed_on"], reverse=True)}
