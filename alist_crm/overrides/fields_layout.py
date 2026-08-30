import frappe

from crm.fcrm.doctype.crm_fields_layout.crm_fields_layout import (
	get_field_obj,
	get_fields_layout as get_crm_fields_layout,
	get_sidepanel_sections as get_crm_sidepanel_sections,
	handle_perm_level_restrictions,
)


QUALIFICATION_FIELDS = [
	"alist_pic_name",
	"alist_channel",
	"alist_lead_datetime",
	"alist_annual_sales_band",
	"alist_monthly_sales_text",
	"alist_business_type",
	"alist_service_required",
]

FOLLOW_UP_FIELDS = [
	"alist_last_outcome",
	"alist_next_follow_up",
	"alist_remark",
]

CAMPAIGN_FIELDS = [
	"alist_stream",
	"alist_original_status",
	"alist_campaign_name",
	"alist_adset_name",
	"alist_ad_name",
	"alist_form_name",
	"alist_source_tab",
]


def _field_objects(fieldnames: list[str], sidepanel: bool = False) -> list[dict]:
	meta = frappe.get_meta("CRM Lead")
	fields = []
	for fieldname in fieldnames:
		field = meta.get_field(fieldname)
		if not field:
			continue
		field = field.as_dict()
		handle_perm_level_restrictions(field, "CRM Lead")
		fields.append(get_field_obj(field) if sidepanel else field)
	return fields


def _section(label: str, name: str, fieldnames: list[str], sidepanel: bool = False) -> dict:
	return {
		"label": label,
		"name": name,
		"opened": True,
		"columns": [
			{
				"name": f"{name}_column",
				"fields": _field_objects(fieldnames, sidepanel),
			}
		],
	}


@frappe.whitelist()
def get_fields_layout(doctype: str, type: str, parent_doctype: str | None = None):
	tabs = get_crm_fields_layout(doctype, type, parent_doctype)
	if doctype != "CRM Lead" or type != "Data Fields" or not tabs:
		return tabs

	sections = tabs[0].setdefault("sections", [])
	existing = {section.get("name") for section in sections}
	for section in [
		_section("A-List Qualification", "alist_qualification", QUALIFICATION_FIELDS),
		_section("Follow-up", "alist_follow_up", FOLLOW_UP_FIELDS),
		_section("Campaign Source", "alist_campaign_source", CAMPAIGN_FIELDS),
	]:
		if section["name"] not in existing:
			sections.append(section)
	return tabs


@frappe.whitelist()
def get_sidepanel_sections(doctype: str):
	sections = get_crm_sidepanel_sections(doctype)
	if doctype != "CRM Lead":
		return sections

	existing = {section.get("name") for section in sections}
	for section in [
		_section(
			"A-List Qualification",
			"alist_qualification",
			QUALIFICATION_FIELDS,
			sidepanel=True,
		),
		_section("Follow-up", "alist_follow_up", FOLLOW_UP_FIELDS, sidepanel=True),
	]:
		if section["name"] not in existing:
			sections.append(section)
	return sections
