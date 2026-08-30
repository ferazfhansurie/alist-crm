let csrfToken = null;

export function setCsrfToken(token) {
  csrfToken = token;
}

async function request(method, args = {}, httpMethod = 'GET') {
  const url = new URL(`/api/method/alist_crm.api.${method}`, window.location.origin);
  const options = { method: httpMethod, credentials: 'include', headers: {} };
  if (httpMethod === 'GET') {
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });
  } else {
    options.headers['Content-Type'] = 'application/json';
    if (csrfToken) options.headers['X-Frappe-CSRF-Token'] = csrfToken;
    options.body = JSON.stringify(args);
  }
  const response = await fetch(url, options);
  let payload = {};
  try { payload = await response.json(); } catch { payload = {}; }
  if (!response.ok || payload.exc_type) {
    const serverMessage = payload._server_messages
      ? JSON.parse(payload._server_messages).map((item) => JSON.parse(item).message).join(' ')
      : null;
    const error = new Error(serverMessage || payload.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload.message;
}

export const api = {
  session: () => request('session'),
  settings: () => request('workspace_settings'),
  listLeads: (args) => request('list_leads', args),
  leadDetail: (name) => request('lead_detail', { name }),
  updateLead: (args) => request('update_lead', args, 'POST'),
  applyAction: (args) => request('apply_lead_action', args, 'POST'),
  reassign: (args) => request('reassign_lead', args, 'POST'),
  dailyReport: (month) => request('daily_report', { month }),
  monthlySummary: () => request('monthly_summary'),
  saveTargets: (args) => request('save_targets', args, 'POST'),
  saveMarketing: (args) => request('save_daily_marketing', args, 'POST')
};
