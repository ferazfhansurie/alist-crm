import frappe

from alist_crm.schema import LEAD_FIELDS, LEAD_STATUSES, MODULE, default_settings


DEAL_STAGES = [
	("New", "Open", 5, "gray", 1),
	("Contacted", "Ongoing", 15, "blue", 2),
	("Qualified", "Ongoing", 30, "purple", 3),
	("Proposal", "Ongoing", 60, "orange", 4),
	("Won", "Won", 100, "green", 5),
	("Campaign", "Won", 100, "teal", 6),
	("Lost", "Lost", 0, "red", 7),
]

DEFAULT_DEAL_STAGES = {
	"Qualification",
	"Demo/Making",
	"Proposal/Quotation",
	"Negotiation",
	"Ready to Close",
}

DEAL_FIELDS = [
	{
		"fieldname": "alist_proposal_uuid",
		"label": "A-List Proposal UUID",
		"fieldtype": "Data",
		"unique": 1,
		"read_only": 1,
	},
	{"fieldname": "alist_client_pic", "label": "Client PIC", "fieldtype": "Data"},
	{"fieldname": "alist_contact_position", "label": "Contact Position", "fieldtype": "Data"},
	{
		"fieldname": "alist_proposal_status",
		"label": "Proposal Outcome",
		"fieldtype": "Select",
		"options": "Unknown\nDeclined\nNo Response\nWon",
		"default": "Unknown",
	},
	{
		"fieldname": "alist_document_status",
		"label": "Proposal Document",
		"fieldtype": "Select",
		"options": "Draft\nPending Approval\nApproved\nRejected",
		"default": "Draft",
	},
	{"fieldname": "alist_proposal_value", "label": "Proposal Value", "fieldtype": "Currency"},
	{"fieldname": "alist_confirmed_value", "label": "Confirmed Value", "fieldtype": "Currency"},
	{"fieldname": "alist_next_follow_up", "label": "Next Follow-up", "fieldtype": "Datetime"},
	{"fieldname": "alist_lost_reason", "label": "Lost Reason Detail", "fieldtype": "Small Text"},
	{"fieldname": "alist_source_tab", "label": "Source Tab", "fieldtype": "Data", "read_only": 1},
	{"fieldname": "alist_source_row", "label": "Source Row", "fieldtype": "Int", "read_only": 1},
	{"fieldname": "alist_mo_code", "label": "MO Code", "fieldtype": "Data"},
	{"fieldname": "alist_invoice_no", "label": "Invoice No", "fieldtype": "Data", "read_only": 1},
	{"fieldname": "alist_project_uuid", "label": "Project UUID", "fieldtype": "Data", "read_only": 1},
	{"fieldname": "alist_proposal_url", "label": "Proposal Studio", "fieldtype": "Data", "options": "URL"},
	{"fieldname": "alist_project_url", "label": "Campaign Workspace", "fieldtype": "Data", "options": "URL"},
]


def _ensure_branding():
	logo = "/assets/alist_crm/images/alist-logo.png"

	settings = frappe.get_single("FCRM Settings")
	settings.brand_name = "A-List Malaysia"
	settings.brand_logo = logo
	settings.favicon = logo
	settings.currency = "MYR"
	settings.enable_sales_hierarchy = 1
	settings.save(ignore_permissions=True)

	website_settings = frappe.get_single("Website Settings")
	website_settings.app_name = "A-List CRM"
	website_settings.app_logo = logo
	website_settings.brand_html = (
		f'<img src="{logo}" alt="The A-List" '
		'style="display:block;height:30px;width:auto;object-fit:contain">'
	)
	website_settings.splash_image = logo
	website_settings.favicon = logo
	website_settings.title_prefix = "A-List CRM"
	website_settings.footer_powered = "A-List Malaysia"
	website_settings.disable_signup = 1
	website_settings.save(ignore_permissions=True)

	system_settings = frappe.get_single("System Settings")
	system_settings.app_name = "A-List Malaysia CRM"
	system_settings.time_zone = "Asia/Kuala_Lumpur"
	system_settings.language = system_settings.language or "en"
	system_settings.country = system_settings.country or "Malaysia"
	system_settings.save(ignore_permissions=True)


def _ensure_deal_stages():
	for name, stage_type, probability, color, position in DEAL_STAGES:
		if frappe.db.exists("CRM Deal Status", name):
			doc = frappe.get_doc("CRM Deal Status", name)
		else:
			doc = frappe.new_doc("CRM Deal Status")
			doc.deal_status = name
		doc.type = stage_type
		doc.probability = probability
		doc.color = color
		doc.position = position
		doc.save(ignore_permissions=True)

	if frappe.db.count("CRM Deal") == 0:
		for name in DEFAULT_DEAL_STAGES:
			if frappe.db.exists("CRM Deal Status", name):
				frappe.delete_doc("CRM Deal Status", name, force=True, ignore_permissions=True)


def _ensure_lead_statuses():
	for name, color, position in LEAD_STATUSES:
		if frappe.db.exists("CRM Lead Status", name):
			doc = frappe.get_doc("CRM Lead Status", name)
		else:
			doc = frappe.new_doc("CRM Lead Status")
			doc.lead_status = name
		doc.color = color
		doc.position = position
		doc.save(ignore_permissions=True)


def _ensure_fields(doctype, fields, insert_after):
	created = 0
	for field in fields:
		if frappe.db.exists("Custom Field", {"dt": doctype, "fieldname": field["fieldname"]}):
			continue
		definition = {
			"doctype": "Custom Field",
			"dt": doctype,
			"insert_after": insert_after,
			"module": MODULE,
			**field,
		}
		frappe.get_doc(definition).insert(ignore_permissions=True)
		created += 1
	return created


def _ensure_settings():
	if not frappe.db.exists("DocType", "A-List Settings"):
		return
	settings = frappe.get_single("A-List Settings")
	changed = False
	for fieldname, value in default_settings().items():
		if not settings.get(fieldname):
			settings.set(fieldname, value)
			changed = True
	if changed:
		settings.save(ignore_permissions=True)


def run():
	_ensure_branding()
	_ensure_deal_stages()
	_ensure_lead_statuses()
	deal_created = _ensure_fields("CRM Deal", DEAL_FIELDS, "status")
	lead_created = _ensure_fields("CRM Lead", LEAD_FIELDS, "source")
	_ensure_settings()
	frappe.db.commit()
	return {
		"brand": "A-List Malaysia",
		"stages": [stage[0] for stage in DEAL_STAGES],
		"lead_statuses": [status[0] for status in LEAD_STATUSES],
		"deal_fields_created": deal_created,
		"lead_fields_created": lead_created,
	}


def audit():
	settings = frappe.get_single("FCRM Settings")
	return {
		"brand": settings.brand_name,
		"currency": settings.currency,
		"sales_hierarchy": bool(settings.enable_sales_hierarchy),
		"deal_count": frappe.db.count("CRM Deal"),
		"lead_count": frappe.db.count("CRM Lead"),
		"stages": frappe.get_all(
			"CRM Deal Status",
			fields=["name", "type", "probability", "position"],
			order_by="position asc",
		),
		"deal_custom_field_count": frappe.db.count("Custom Field", {"dt": "CRM Deal", "module": MODULE}),
		"lead_custom_field_count": frappe.db.count("Custom Field", {"dt": "CRM Lead", "module": MODULE}),
	}
