import frappe
from frappe.model.document import Document
from frappe.utils import flt


class AListDailyMarketing(Document):
	def validate(self):
		self.lead_spend = max(flt(self.lead_spend), 0)
		self.awareness_spend = max(flt(self.awareness_spend), 0)
		duplicate = frappe.db.exists(
			"A-List Daily Marketing",
			{"date": self.date, "channel": self.channel, "name": ["!=", self.name]},
		)
		if duplicate:
			frappe.throw("A daily marketing row already exists for this date and channel")

