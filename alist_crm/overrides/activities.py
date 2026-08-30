from html import escape

import frappe
from frappe.utils import get_datetime

from crm.api.activities import get_activities as get_crm_activities


def _activity_content(activity) -> str:
	title = f"{activity.activity_type}: {activity.outcome}"
	details = []
	if activity.note:
		details.append(activity.note)
	if activity.scheduled_for:
		details.append(f"Scheduled for {activity.scheduled_for}")
	if activity.source_label:
		details.append(activity.source_label)
	body = " · ".join(escape(str(value)) for value in details if value)
	return (
		f"<p><strong>{escape(title)}</strong></p>"
		+ (f"<p>{body}</p>" if body else "")
	)


@frappe.whitelist()
def get_activities(name: str):
	result = get_crm_activities(name)
	if not frappe.db.exists("CRM Lead", name):
		return result

	activities, calls, notes, tasks, attachments = result
	workbook_activities = frappe.get_all(
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
		order_by="occurred_at asc",
		limit_page_length=0,
	)
	for activity in workbook_activities:
		activities.append(
			{
				"name": f"alist-activity-{activity.name}",
				"activity_type": "comment",
				"creation": activity.occurred_at,
				"owner": "alist-workbook@local",
				"content": _activity_content(activity),
				"attachments": [],
				"is_lead": True,
			}
		)

	activities.sort(key=lambda item: get_datetime(item.get("creation")), reverse=True)
	return activities, calls, notes, tasks, attachments
