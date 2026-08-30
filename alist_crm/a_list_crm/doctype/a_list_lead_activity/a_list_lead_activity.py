import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class AListLeadActivity(Document):
	def before_insert(self):
		self.occurred_at = self.occurred_at or now_datetime()
		self.actor = self.actor or frappe.session.user

