from crm.fcrm.doctype.crm_lead.crm_lead import CRMLead


class AListCRMLead(CRMLead):
	@staticmethod
	def default_list_data():
		columns = [
			{"label": "Full Name", "type": "Data", "key": "lead_name", "width": "13rem"},
			{
				"label": "Organization",
				"type": "Link",
				"options": "CRM Organization",
				"key": "organization",
				"width": "11rem",
			},
			{
				"label": "Status",
				"type": "Link",
				"options": "CRM Lead Status",
				"key": "status",
				"width": "8rem",
			},
			{"label": "PIC", "type": "Data", "key": "alist_pic_name", "width": "7rem"},
			{"label": "Channel", "type": "Select", "key": "alist_channel", "width": "8rem"},
			{"label": "WhatsApp", "type": "Data", "key": "mobile_no", "width": "11rem"},
			{
				"label": "Sales Tahunan",
				"type": "Data",
				"key": "alist_annual_sales_band",
				"width": "10rem",
			},
			{
				"label": "Last Outcome",
				"type": "Select",
				"key": "alist_last_outcome",
				"width": "10rem",
			},
			{
				"label": "Next Follow-up",
				"type": "Datetime",
				"key": "alist_next_follow_up",
				"width": "10rem",
			},
			{"label": "Assigned To", "type": "Text", "key": "_assign", "width": "9rem"},
			{"label": "Last Modified", "type": "Datetime", "key": "modified", "width": "8rem"},
		]
		rows = [
			"name",
			"lead_name",
			"organization",
			"status",
			"email",
			"mobile_no",
			"alist_pic_name",
			"alist_channel",
			"alist_annual_sales_band",
			"alist_last_outcome",
			"alist_next_follow_up",
			"lead_owner",
			"first_name",
			"sla_status",
			"response_by",
			"first_response_time",
			"first_responded_on",
			"modified",
			"_assign",
			"image",
		]
		return {"columns": columns, "rows": rows}
