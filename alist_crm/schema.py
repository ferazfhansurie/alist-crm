import json


MODULE = "A-List CRM"

OWNER_COLORS = {
	"Tika": "#EA9999",
	"Izzy": "#FFE599",
	"Fatin": "#B6D7A8",
	"Aiman": "#B4A7D6",
	"Fareez": "#A4C2F4",
}

CHANNEL_COLORS = {
	"Meta": "#1877F2",
	"TikTok": "#E8384F",
	"Google": "#38A169",
	"Founder Series": "#E3BD72",
	"Boss / Manual": "#6B46C1",
	"Talent": "#DD6B20",
	"Past Client": "#319795",
	"Website": "#2B6CB0",
}

ASSIGNMENT_POOLS = {
	"Meta": ["Tika", "Izzy", "Aiman"],
	"Founder Series": ["Tika", "Izzy", "Fatin", "Aiman"],
}

LEAD_SOURCES = [
	"Meta",
	"TikTok",
	"Google",
	"Founder Series",
	"Boss / Manual",
	"Talent",
	"Past Client",
	"Website",
]

LEAD_STATUSES = [
	("New", "gray", 1),
	("Contacted", "orange", 2),
	("Meeting Set", "blue", 3),
	("Meeting Done", "purple", 4),
	("Converted", "green", 5),
	("Disqualified", "red", 6),
	("Duplicate", "yellow", 7),
]

LEAD_FIELDS = [
	{
		"fieldname": "alist_lead_datetime",
		"label": "Date & Time",
		"fieldtype": "Datetime",
		"in_list_view": 1,
	},
	{
		"fieldname": "alist_channel",
		"label": "Channel",
		"fieldtype": "Select",
		"options": "\n" + "\n".join(CHANNEL_COLORS),
		"in_list_view": 1,
	},
	{
		"fieldname": "alist_stream",
		"label": "Lead Stream",
		"fieldtype": "Select",
		"options": "\nNormal Lead\nFounder Series\nTalent\nPast Client",
	},
	{
		"fieldname": "alist_annual_sales_band",
		"label": "Sales Tahunan",
		"fieldtype": "Data",
		"in_list_view": 1,
	},
	{
		"fieldname": "alist_monthly_sales_text",
		"label": "Sales Bulanan",
		"fieldtype": "Data",
		"in_list_view": 1,
	},
	{
		"fieldname": "alist_monthly_sales_value",
		"label": "Monthly Sales Value",
		"fieldtype": "Currency",
	},
	{"fieldname": "alist_business_type", "label": "Business Type", "fieldtype": "Data"},
	{"fieldname": "alist_service_required", "label": "Service Required", "fieldtype": "Data"},
	{"fieldname": "alist_pax", "label": "Pax Kehadiran", "fieldtype": "Int"},
	{
		"fieldname": "alist_event_outcome",
		"label": "Event Outcome",
		"fieldtype": "Select",
		"options": "\nConfirmed\nDeclined\nNo Response",
	},
	{
		"fieldname": "alist_last_outcome",
		"label": "Last Outcome",
		"fieldtype": "Select",
		"options": (
			"\nPickup\nNo Pickup\nReplied\nNo WhatsApp\nMeeting Set\nMeeting Done"
			"\nProposal Requested\nNo Response\nNon-Quality\nBad Lead\nRedundant"
		),
		"in_list_view": 1,
	},
	{
		"fieldname": "alist_pic_name",
		"label": "PIC",
		"fieldtype": "Data",
		"in_list_view": 1,
	},
	{
		"fieldname": "alist_next_follow_up",
		"label": "Next Follow-up",
		"fieldtype": "Datetime",
		"in_list_view": 1,
	},
	{
		"fieldname": "alist_remark",
		"label": "Remark",
		"fieldtype": "Small Text",
		"in_list_view": 1,
	},
	{
		"fieldname": "alist_linked_deal",
		"label": "Linked Deal",
		"fieldtype": "Link",
		"options": "CRM Deal",
		"read_only": 1,
	},
	{
		"fieldname": "alist_original_status",
		"label": "Original Workbook Status",
		"fieldtype": "Small Text",
		"read_only": 1,
	},
	{
		"fieldname": "alist_external_lead_id",
		"label": "External Lead ID",
		"fieldtype": "Data",
		"read_only": 1,
	},
	{"fieldname": "alist_campaign_id", "label": "Campaign ID", "fieldtype": "Data", "read_only": 1},
	{"fieldname": "alist_campaign_name", "label": "Campaign Name", "fieldtype": "Data", "read_only": 1},
	{"fieldname": "alist_adset_id", "label": "Ad Set ID", "fieldtype": "Data", "read_only": 1},
	{"fieldname": "alist_adset_name", "label": "Ad Set Name", "fieldtype": "Data", "read_only": 1},
	{"fieldname": "alist_ad_id", "label": "Ad ID", "fieldtype": "Data", "read_only": 1},
	{
		"fieldname": "alist_ad_name",
		"label": "Ad Name",
		"fieldtype": "Data",
		"read_only": 1,
		"in_list_view": 1,
	},
	{"fieldname": "alist_form_id", "label": "Form ID", "fieldtype": "Data", "read_only": 1},
	{"fieldname": "alist_form_name", "label": "Form Name", "fieldtype": "Data", "read_only": 1},
	{"fieldname": "alist_source_tab", "label": "Source Tab", "fieldtype": "Data", "read_only": 1},
	{"fieldname": "alist_source_row", "label": "Source Row", "fieldtype": "Int", "read_only": 1},
	{
		"fieldname": "alist_import_key",
		"label": "Import Key",
		"fieldtype": "Data",
		"unique": 1,
		"read_only": 1,
	},
]


def default_settings() -> dict:
	return {
		"lead_target": 1200,
		"spend_target": 7000,
		"owner_colors": json.dumps(OWNER_COLORS, indent=2),
		"channel_colors": json.dumps(CHANNEL_COLORS, indent=2),
		"assignment_pools": json.dumps(ASSIGNMENT_POOLS, indent=2),
	}
