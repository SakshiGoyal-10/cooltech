// ─── Central API Service ──────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const headers = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('token')
    ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
    : {}),
});

const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = '/';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const crud = (resource) => ({
  list:    (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/${resource}${qs ? '?' + qs : ''}`);
  },
  get:     (id)       => req('GET',    `/${resource}/${id}`),
  create:  (body)     => req('POST',   `/${resource}`, body),
  update:  (id, body) => req('PUT',    `/${resource}/${id}`, body),
  remove:  (id)       => req('DELETE', `/${resource}/${id}`),
  restore: (id)       => req('PUT',    `/${resource}/${id}/restore`),
});

// ── Existing APIs ─────────────────────────────────────────────────────────────
export const customersApi  = crud('customers');
export const techsApi      = crud('technicians');
export const jobsApi       = {
  ...crud('jobs'),
  assign:   (id, b) => req('PUT',  `/jobs/${id}/assign`, b),
  complete: (id, b) => req('PUT',  `/jobs/${id}/complete`, b),
};
export const amcApi        = crud('amc');
export const quotationsApi = {
  ...crud('quotations'),
  convert: (id) => req('POST', `/quotations/${id}/convert`),
  updateStatus:(id, b)  => req('PATCH', `/quotations/${id}/status`, b),
  sendEmail:  (id, b)   => req('POST',  `/quotations/${id}/send-email`, b),
};
export const invoicesApi = {
  ...crud('invoices'),
  pay:         (id, b)    => req('PUT',   `/invoices/${id}/pay`, b),
  updateStatus: (id, body) => req('PATCH', `/invoices/${id}/status`, body),
};
export const paymentsApi   = crud('payments');
export const expensesApi   = {
  ...crud('expenses'),
  approve: (id)    => req('PUT', `/expenses/${id}/approve`),
  reject:  (id)    => req('PUT', `/expenses/${id}/reject`),
};
export const inventoryApi  = {
  ...crud('inventory'),
  adjustStock: (id, adj) => req('PUT', `/inventory/${id}/stock`, { adjustment: adj }),
  lowStock:    ()        => req('GET', '/inventory/alerts/low-stock'),
};
export const leadsApi      = {
  ...crud('leads'),
  addActivity: (id, b) => req('POST', `/leads/${id}/activities`, b),
  convert:     (id)    => req('POST', `/leads/${id}/convert`),
};
export const complaintsApi = {
  ...crud('complaints'),
  resolve: (id, r) => req('PUT', `/complaints/${id}/resolve`, { resolution: r }),
};
export const ticketsApi    = {
  ...crud('tickets'),
  addMessage: (id, b) => req('POST', `/tickets/${id}/messages`, b),
  resolve:    (id)    => req('PUT',  `/tickets/${id}/resolve`),
};
export const attendanceApi = {
  list:   (p)    => req('GET',    `/attendance?${new URLSearchParams(p)}`),
  upsert: (b)    => req('POST',   `/attendance/upsert`, b),
  update: (id,b) => req('PUT',    `/attendance/${id}`, b),
  delete: (b)    => req('DELETE', `/attendance?technician=${b.technician}&date=${encodeURIComponent(b.date)}`),
};
export const salaryApi     = {
  ...crud('salary'),
  pay: (id) => req('PUT', `/salary/${id}/pay`),
};
export const suppliersApi  = crud('suppliers');
export const purchaseApi   = crud('purchase-orders');
export const assetsApi     = crud('assets');
export const contractsApi  = {
  ...crud('contracts'),
  sign: (id) => req('PUT', `/contracts/${id}/sign`),
};
export const remindersApi  = crud('reminders');
export const servicesApi   = crud('services');
export const usersApi      = crud('users');
export const dashboardApi  = () => req('GET', '/dashboard/stats');

export const leavesApi = {
  list:    (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/leaves${qs ? '?' + qs : ''}`);
  },
  stats:   ()            => req('GET',   '/leaves/stats'),
  get:     (id)          => req('GET',   `/leaves/${id}`),
  create:  (body)        => req('POST',  `/leaves`, body),
  update:  (id, body)    => req('PUT',   `/leaves/${id}`, body),
  delete:  (id)          => req('DELETE',`/leaves/${id}`),
  approve: (id, body={}) => req('PATCH', `/leaves/${id}/approve`, body),
  reject:  (id, body={}) => req('PATCH', `/leaves/${id}/reject`,  body),
};

export const timelogsApi = crud('timelogs');

export const chatApi = {
  getChannels:   ()            => req('GET',   '/chat/channels'),
  createChannel: (body)        => req('POST',  '/chat/channels', body),
  deleteChannel: (id)          => req('DELETE',`/chat/channels/${id}`),
  clearUnread:   (id)          => req('PATCH', `/chat/channels/${id}/clear-unread`),
  getOrCreateDM: (techName)    => req('POST',  '/chat/channels/dm', { techName }),
  getMessages:   (channel, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/chat/messages/${channel}${qs ? '?' + qs : ''}`);
  },
  sendMessage:  (body)         => req('POST',  '/chat/messages', body),
  deleteMessage:(id)           => req('DELETE',`/chat/messages/${id}`),
  markRead:     (id, userName) => req('PATCH', `/chat/messages/${id}/read`, { userName }),
  stats:        ()             => req('GET',   '/chat/stats'),
};

export const feedbackApi = {
  ...crud('feedback'),
  stats:           ()       => req('GET',  '/feedback/stats'),
  reply:           (id, r)  => req('PUT',  `/feedback/${id}/reply`,       { reply: r }),
  followUp:        (id, n)  => req('PUT',  `/feedback/${id}/follow-up`,   { note: n }),
  requestFeedback: (body)   => req('POST', '/feedback/request-feedback',  body),
};

export const tasksApi = {
  list:         (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/tasks${qs ? '?' + qs : ''}`);
  },
  stats:        ()            => req('GET',   '/tasks/stats'),
  get:          (id)          => req('GET',   `/tasks/${id}`),
  create:       (body)        => req('POST',  '/tasks', body),
  update:       (id, body)    => req('PUT',   `/tasks/${id}`, body),
  updateStatus: (id, status)  => req('PATCH', `/tasks/${id}/status`, { status }),
  delete:       (id)          => req('DELETE',`/tasks/${id}`),
  restore:      (id)          => req('PUT',   `/tasks/${id}/restore`),
};

export const calendarApi = {
  getEvents:   (month)      => req('GET',    `/calendar${month ? `?month=${month}` : ''}`),
  getAllEvents: ()           => req('GET',    '/calendar/all'),
  stats:       (month)      => req('GET',    `/calendar/stats${month ? `?month=${month}` : ''}`),
  create:      (body)       => req('POST',   '/calendar', body),
  update:      (id, body)   => req('PUT',    `/calendar/${id}`, body),
  delete:      (id)         => req('DELETE', `/calendar/${id}`),
};

// ── NEW: Notice Board ─────────────────────────────────────────────────────────
export const noticesApi = {
  ...crud('notices'),
  pin:    (id) => req('PUT',  `/notices/${id}/pin`),
  markRead:(id)=> req('POST', `/notices/${id}/read`),
};

// ── NEW: Notifications ────────────────────────────────────────────────────────
export const notificationsApi = {
  list:     (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/notifications${qs ? '?' + qs : ''}`);
  },
  create:   (body)  => req('POST',   '/notifications', body),
  markRead: (id)    => req('PATCH',  `/notifications/${id}/read`),
  markAll:  ()      => req('PATCH',  '/notifications/read-all'),
  delete:   (id)    => req('DELETE', `/notifications/${id}`),
  clearAll: ()      => req('DELETE', '/notifications'),
};

// ── NEW: Recruitment ──────────────────────────────────────────────────────────
export const recruitmentApi = {
  ...crud('recruitment'),
  advance: (id)        => req('PUT', `/recruitment/${id}/advance`),
  reject:  (id, body)  => req('PUT', `/recruitment/${id}/reject`, body),
  stats:   ()          => req('GET', '/recruitment/stats/summary'),
};

// ── NEW: Performance ──────────────────────────────────────────────────────────
export const performanceApi = {
  ...crud('performance'),
  calculate: (body) => req('POST', '/performance/calculate', body),
};

// ── NEW: Advance & Incentive ──────────────────────────────────────────────────
export const advanceIncentiveApi = {
  ...crud('advance-incentive'),
  approve:  (id)         => req('PUT', `/advance-incentive/${id}/approve`),
  reject:   (id)         => req('PUT', `/advance-incentive/${id}/reject`),
  pay:      (id)         => req('PUT', `/advance-incentive/${id}/pay`),
  summary:  (techId, p)  => req('GET', `/advance-incentive/summary/${techId}${p?.month ? `?month=${p.month}` : ''}`),
};

// ── NEW: Gas Log ──────────────────────────────────────────────────────────────
export const gaslogApi = {
  ...crud('gaslog'),
  usageStats: () => req('GET', '/gaslog/stats/usage'),
};

// ── NEW: Warranty ─────────────────────────────────────────────────────────────
export const warrantyApi = {
  ...crud('warranty'),
  expiring: (days = 30) => req('GET', `/warranty/alerts/expiring?days=${days}`),
  claim:    (id)        => req('PUT', `/warranty/${id}/claim`),
};

// ── NEW: Projects ─────────────────────────────────────────────────────────────
export const projectsApi = {
  ...crud('projects'),
  updateProgress: (id, progress) => req('PUT', `/projects/${id}/progress`, { progress }),
  stats:          ()             => req('GET', '/projects/stats/summary'),
};

// ── NEW: Customer Types ───────────────────────────────────────────────────────
export const customerTypesApi = crud('customer-types');

// ── NEW: Lead Sources ─────────────────────────────────────────────────────────
export const leadSourcesApi = {
  ...crud('lead-sources'),
  performance: () => req('GET', '/lead-sources/stats/performance'),
};

// ── NEW: Campaigns ────────────────────────────────────────────────────────────
export const campaignsApi = {
  ...crud('campaigns'),
  launch:  (id) => req('PUT', `/campaigns/${id}/launch`),
  pause:   (id) => req('PUT', `/campaigns/${id}/pause`),
  stats:   ()   => req('GET', '/campaigns/stats/overview'),
};

// ── NEW: Reviews ──────────────────────────────────────────────────────────────
export const reviewsApi = {
  ...crud('reviews'),
  respond: (id, response) => req('PUT', `/reviews/${id}/respond`, { response }),
  stats:   ()             => req('GET', '/reviews/stats/summary'),
};

// ── NEW: Post Scheduler ───────────────────────────────────────────────────────
export const postsApi = {
  ...crud('posts'),
  publish:  (id)  => req('PUT', `/posts/${id}/publish`),
  stats:    ()    => req('GET', '/posts/stats/overview'),
};

// ── NEW: AC Error Codes ───────────────────────────────────────────────────────
export const errorCodesApi = {
  ...crud('error-codes'),
  bulkImport: (codes) => req('POST', '/error-codes/bulk', { codes }),
};

// ── NEW: Content Library ──────────────────────────────────────────────────────
export const contentLibraryApi = {
  ...crud('content-library'),
  use: (id) => req('PUT', `/content-library/${id}/use`),
};

// ── NEW: WhatsApp Marketing ───────────────────────────────────────────────────
export const whatsappApi = {
  ...crud('whatsapp'),
  bulkSend: (body) => req('POST', '/whatsapp/bulk-send', body),
  stats:    ()     => req('GET',  '/whatsapp/stats/overview'),
};

// ── NEW: Reports ──────────────────────────────────────────────────────────────
export const reportsApi = {
  overview: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/reports/overview${qs ? '?' + qs : ''}`);
  },
  monthly: (year) => req('GET', `/reports/monthly${year ? `?year=${year}` : ''}`),
};

// ── NEW: Deleted Items ────────────────────────────────────────────────────────
export const deletedItemsApi = {
  list: () => req('GET', '/deleted-items'),
};

// ── NEW: Technicians Lookup ────────────────────────────────────────────────────────
export const technicianLookupsApi = {
  // GET /technician-lookups?category=role  (omit category to get all)
  list:     (category = '')   => req('GET',    `/technician-lookups${category ? `?category=${category}` : ''}`),
  create:   (body)            => req('POST',   '/technician-lookups', body),
  update:   (id, body)        => req('PUT',    `/technician-lookups/${id}`, body),
  remove:   (id)              => req('DELETE', `/technician-lookups/${id}`),
  seed:     ()                => req('POST',   '/technician-lookups/seed'),
  reset:    (category)        => req('POST',   `/technician-lookups/reset/${category}`),
};