import json

import frappe
from frappe.model.document import Document


class AListSettings(Document):
	def validate(self):
		for fieldname in ("owner_colors", "channel_colors", "assignment_pools"):
			try:
				value = json.loads(self.get(fieldname) or "{}")
			except json.JSONDecodeError:
				frappe.throw(f"{self.meta.get_label(fieldname)} must be valid JSON")
			if not isinstance(value, dict):
				frappe.throw(f"{self.meta.get_label(fieldname)} must be a JSON object")

