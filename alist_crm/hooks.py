app_name = "alist_crm"
app_title = "A-List CRM"
app_publisher = "Adletic Agency"
app_description = "A-List Malaysia CRM customisations"
app_email = "hello@adleticagency.com"
app_license = "mit"

required_apps = ["crm"]
after_install = "alist_crm.setup.run"
after_migrate = "alist_crm.setup.run"

add_to_apps_screen = [
	{
		"name": "alist",
		"logo": "/assets/alist_crm/images/alist-logo.png",
		"title": "A-List CRM",
		"route": "/crm/leads",
		"has_permission": "alist_crm.api.has_app_permission",
	}
]

website_route_rules = [
	{"from_route": "/alist/<path:app_path>", "to_route": "alist"},
]

doc_events = {
	"CRM Lead": {
		"before_insert": "alist_crm.services.assignment.assign_if_needed",
	},
}

override_doctype_class = {
	"CRM Lead": "alist_crm.overrides.lead.AListCRMLead",
}

override_whitelisted_methods = {
	"crm.api.activities.get_activities": "alist_crm.overrides.activities.get_activities",
	"crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_fields_layout": (
		"alist_crm.overrides.fields_layout.get_fields_layout"
	),
	"crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_sidepanel_sections": (
		"alist_crm.overrides.fields_layout.get_sidepanel_sections"
	),
}

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "alist_crm",
# 		"logo": "/assets/alist_crm/logo.png",
# 		"title": "A-List CRM",
# 		"route": "/alist_crm",
# 		"has_permission": "alist_crm.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/alist_crm/css/alist_crm.css"
# app_include_js = "/assets/alist_crm/js/alist_crm.js"

# include js, css files in header of web template
# web_include_css = "/assets/alist_crm/css/alist_crm.css"
# web_include_js = "/assets/alist_crm/js/alist_crm.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "alist_crm/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "alist_crm/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "alist_crm.utils.jinja_methods",
# 	"filters": "alist_crm.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "alist_crm.install.before_install"
# after_install = "alist_crm.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "alist_crm.uninstall.before_uninstall"
# after_uninstall = "alist_crm.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "alist_crm.utils.before_app_install"
# after_app_install = "alist_crm.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "alist_crm.utils.before_app_uninstall"
# after_app_uninstall = "alist_crm.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "alist_crm.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"alist_crm.tasks.all"
# 	],
# 	"daily": [
# 		"alist_crm.tasks.daily"
# 	],
# 	"hourly": [
# 		"alist_crm.tasks.hourly"
# 	],
# 	"weekly": [
# 		"alist_crm.tasks.weekly"
# 	],
# 	"monthly": [
# 		"alist_crm.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "alist_crm.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "alist_crm.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "alist_crm.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["alist_crm.utils.before_request"]
# after_request = ["alist_crm.utils.after_request"]

# Job Events
# ----------
# before_job = ["alist_crm.utils.before_job"]
# after_job = ["alist_crm.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"alist_crm.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []
