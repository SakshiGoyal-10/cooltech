import { useState, useEffect, useCallback } from 'react';
import {
  BrowserRouter, Routes, Route, Navigate,
  useNavigate, useLocation,
} from 'react-router-dom';

// ── Layout ────────────────────────────────────────────────────────────────────
import Sidebar from './components/layout/Sidebar';
import Header  from './components/layout/Header';
import Toast   from './components/ui/Toast';

// ── Constants ─────────────────────────────────────────────────────────────────
import { NAV, TITLES } from './constants/navigation';
import { PATH_FOR }    from './constants/routes';

// ── Data ──────────────────────────────────────────────────────────────────────
import {
  jobs, quotations, invoices, complaints, tickets,
  leads,
  INIT_CLOCK_SESSIONS,
} from './data/mockData';

// ── Shared state ──────────────────────────────────────────────────────────────
import { useLeadSources }    from './hooks/useLeadSources';
import { useCustomerTypes }  from './hooks/useCustomerTypes';
import {
  jobsApi, quotationsApi, customersApi, amcApi, invoicesApi,
  techsApi, expensesApi, inventoryApi, leadsApi, purchaseApi,
  suppliersApi, assetsApi, remindersApi, servicesApi, noticesApi,
} from './services/api';

// ── Modals ────────────────────────────────────────────────────────────────────
import {
  NewJobModal, NewQuotationModal, NewCustomerModal, NewAMCModal,
  NewInvoiceModal, AddTechnicianModal, AddExpenseModal, AddInventoryModal,
  NewLeadModal, NewPOModal, NewSupplierModal, NewAssetModal,
  RegisterWarrantyModal, NewNoticeModal, MarkAttendanceModal,
  AdvanceModal, SendQuotationModal, ConvertToJobModal, ReportModal,
  AddAdminUserModal, UseInventoryModal, LogFuelModal, ScheduleAMCModal,
  RequestReviewModal, AssignComplaintModal, ResolveComplaintModal,
  SetReminderModal, CustomReportModal, NewSOModal,
} from './components/modals/Modals';
import {
  SendRemindersModal, RecordPaymentModal, NewPriceItemModal,
  NewReminderModal, ApplyLeaveModal, LogGasModal, NewTaskModal, LogTimeModal,
} from './components/modals/HRModals';

// ── Clock ─────────────────────────────────────────────────────────────────────
import ClockInOutPage from './components/clock/ClockInOutPage';

// ── Pages — Main ─────────────────────────────────────────────────────────────
import Dashboard        from './pages/Dashboard';
import JobsPage         from './pages/JobsPage';
import QuotationsPage   from './pages/QuotationsPage';
import CustomersPage    from './pages/CustomersPage';
import CustomerTypesPage from './pages/CustomerTypesPage';
import AMCPage          from './pages/AMCPage';
import FeedbackPage     from './pages/FeedbackPage';
import NoticeBoardPage  from './pages/NoticeBoardPage';
import SettingsPage     from './pages/SettingsPage';
import DispatchBoard    from './pages/DispatchBoard';
import ReportsPage      from './pages/ReportsPage';
import LogoutPage       from './pages/LogoutPage';

// ── Pages — Finance ───────────────────────────────────────────────────────────
import InvoicesPage      from './pages/finance/InvoicesPage';
import ExpensesPage      from './pages/finance/ExpensesPage';
import PaymentsPage      from './pages/finance/PaymentsPage';
import PriceListPage     from './pages/finance/PriceListPage';
import CreateInvoicePage from './pages/finance/CreateInvoicePage';

// ── Pages — HR ────────────────────────────────────────────────────────────────
import AttendancePage       from './pages/hr/AttendancePage';
import SalaryPage           from './pages/hr/SalaryPage';
import TechniciansPage      from './pages/hr/TechniciansPage';
import LeaveManagementPage  from './pages/hr/LeaveManagementPage';
import PerformancePage      from './pages/hr/PerformancePage';
import RecruitmentPage      from './pages/hr/RecruitmentPage';
import TechniciansLookups   from './pages/hr/TechnicianLookups';
import GeneratePayroll      from './pages/hr/GeneratePayroll';
import AdvanceIncentivePage from './pages/hr/AdvanceIncentivePage';

// ── Pages — Operations ────────────────────────────────────────────────────────
import InventoryPage      from './pages/operations/InventoryPage';
import PurchaseOrdersPage from './pages/operations/PurchaseOrdersPage';
import SuppliersPage      from './pages/operations/SuppliersPage';
import AssetsPage         from './pages/operations/AssetsPage';
import WarrantyPage       from './pages/operations/WarrantyPage';
import GasLogPage         from './pages/operations/GasLogPage';

// ── Pages — CRM ───────────────────────────────────────────────────────────────
import LeadsPage        from './pages/crm/LeadsPage';
import LeadSourcesPage  from './pages/crm/LeadSourcesPage';
import ComplaintsPage   from './pages/crm/ComplaintsPage';
import RemindersPage    from './pages/crm/RemindersPage';
import CRMAnalyticsPage from './pages/crm/CRMAnalyticsPage';

// ── Pages — Marketing ─────────────────────────────────────────────────────────
import SocialDashboard    from './pages/marketing/SocialDashboard';
import PostSchedulerPage  from './pages/marketing/PostSchedulerPage';
import CampaignPage       from './pages/marketing/CampaignPage';
import WhatsAppPage       from './pages/marketing/WhatsAppPage';
import ReviewsPage        from './pages/marketing/ReviewsPage';
import ContentLibraryPage from './pages/marketing/ContentLibraryPage';

// ── Pages — Productivity ──────────────────────────────────────────────────────
import TaskManagerPage from './pages/productivity/TaskManagerPage';
import KanbanPage      from './pages/productivity/KanbanPage';
import TeamChatPage    from './pages/productivity/TeamChatPage';
import TimeLogPage     from './pages/productivity/TimeLogPage';
import ProjectsPage    from './pages/productivity/ProjectsPage';
import ContractsPage   from './pages/productivity/ContractsPage';

// ── Pages — Support ───────────────────────────────────────────────────────────
import TicketsPage       from './pages/support/TicketsPage';
import NotificationsPage from './pages/support/NotificationsPage';
import ClientPortalPage  from './pages/support/ClientPortalPage';
import CalendarPage      from './pages/CalendarPage';
import ServicesPage      from './pages/ServicesPage';
import ACErrorCodesPage  from './pages/ACErrorCodesPage';
import DeletedItemsPage  from './pages/DeletedItemsPage';
import LoginPage         from './pages/LoginPage';
import ProfilePage       from './pages/ProfilePage';
import AccountSettingsPage from './pages/AccountSettingsPage';

// =============================================================================
//  ROUTE MAP
// =============================================================================
const ROUTE_MAP = [
  { id: 'dashboard',          component: Dashboard },
  { id: 'jobs',               component: JobsPage },
  { id: 'quotations',         component: QuotationsPage },
  { id: 'customers',          component: CustomersPage },
  { id: 'customer_type',      component: CustomerTypesPage },
  { id: 'amc',                component: AMCPage },
  { id: 'feedback',           component: FeedbackPage },
  { id: 'notices',            component: NoticeBoardPage },
  { id: 'settings',           component: SettingsPage },
  { id: 'dispatch',           component: DispatchBoard },
  { id: 'reports',            component: ReportsPage },
  { id: 'invoices',           component: InvoicesPage },
  { id: 'create_invoice',     component: CreateInvoicePage },
  { id: 'expenses',           component: ExpensesPage },
  { id: 'payments',           component: PaymentsPage },
  { id: 'pricelist',          component: PriceListPage },
  { id: 'attendance',         component: AttendancePage },
  { id: 'salary',             component: SalaryPage },
  { id: 'payroll',            component: GeneratePayroll },
  { id: 'advance_incentive',  component: AdvanceIncentivePage },
  { id: 'technicians',        component: TechniciansPage },
  { id: 'technician_lookups', component: TechniciansLookups },
  { id: 'leave',              component: LeaveManagementPage },
  { id: 'performance',        component: PerformancePage },
  { id: 'recruitment',        component: RecruitmentPage },
  { id: 'clock',              component: ClockInOutPage },
  { id: 'inventory',          component: InventoryPage },
  { id: 'purchase',           component: PurchaseOrdersPage },
  { id: 'suppliers',          component: SuppliersPage },
  { id: 'assets',             component: AssetsPage },
  { id: 'warranty',           component: WarrantyPage },
  { id: 'gaslog',             component: GasLogPage },
  { id: 'leads',              component: LeadsPage },
  { id: 'lead_sources',       component: LeadSourcesPage },
  { id: 'complaints',         component: ComplaintsPage },
  { id: 'reminders',          component: RemindersPage },
  { id: 'services',           component: ServicesPage },
  { id: 'crm_analytics',      component: CRMAnalyticsPage },
  { id: 'sm_dashboard',       component: SocialDashboard },
  { id: 'sm_posts',           component: PostSchedulerPage },
  { id: 'sm_campaign',        component: CampaignPage },
  { id: 'sm_whatsapp',        component: WhatsAppPage },
  { id: 'sm_reviews',         component: ReviewsPage },
  { id: 'error_codes',        component: ACErrorCodesPage },
  { id: 'sm_content',         component: ContentLibraryPage },
  { id: 'tasks',              component: TaskManagerPage },
  { id: 'kanban',             component: KanbanPage },
  { id: 'teamchat',           component: TeamChatPage },
  { id: 'timelog',            component: TimeLogPage },
  { id: 'projects',           component: ProjectsPage },
  { id: 'contracts',          component: ContractsPage },
  { id: 'tickets',            component: TicketsPage },
  { id: 'notifications',      component: NotificationsPage },
  { id: 'client_portal',      component: ClientPortalPage },
  { id: 'calendar',           component: CalendarPage },
  { id: 'deleted_item',       component: DeletedItemsPage },
  { id: 'profile',            component: ProfilePage },
  { id: 'account_settings',   component: AccountSettingsPage },
];

const SPECIAL_PROPS = new Set([
  'dashboard', 'jobs', 'clock', 'lead_sources', 'customer_type',
  'sm_dashboard', 'notifications', 'logout', 'profile',
  // ↓ advance_incentive needs prefillAdvance injected
  'advance_incentive',
]);

// =============================================================================
//  Helper
// =============================================================================
async function saveWithFallback(apiFn, data, successMsg, showToast, closeModal) {
  try {
    await apiFn(data);
    showToast(successMsg);
    closeModal();
  } catch (e) {
    showToast(e.message || 'Something went wrong', 'error');
  }
}

// =============================================================================
//  AppShell
// =============================================================================
function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const activePage = Object.entries(PATH_FOR).find(([, p]) => p === location.pathname)?.[0] ?? 'dashboard';

  const [openJob,        setOpenJob]        = useState(null);
  const [sidebarOpen,    setSidebarOpen]    = useState(window.innerWidth >= 1024);
  const [time,           setTime]           = useState(new Date());
  const [modal,          setModal]          = useState(null);
  const [toast,          setToast]          = useState(null);

  // ── Advance prefill state ─────────────────────────────────────────────────
  // Stores { empId, name, role } when "Give Advance" is clicked on a technician.
  // Passed into AdvanceIncentivePage so it auto-opens the modal pre-filled.
  const [prefillAdvance, setPrefillAdvance] = useState(null);

  const { sources: leadSources, activeSources: activeLeadSources, addSource: addLeadSource, deleteSource: deleteLeadSource, toggleSource: toggleLeadSource } = useLeadSources();
  const { types: customerTypes, addType: addCustomerType, deleteType: deleteCustomerType, toggleType: toggleCustomerType } = useCustomerTypes();

  const [clockStatus,    setClockStatus]    = useState('out');
  const [clockInTime,    setClockInTime]    = useState(null);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [totalBreakSecs, setTotalBreakSecs] = useState(0);
  const [clockSessions,  setClockSessions]  = useState(INIT_CLOCK_SESSIONS || []);
  const [notifs,         setNotifs]         = useState([]);

  const setPage = useCallback((id) => {
    navigate(PATH_FOR[id] ?? '/');
    setOpenJob(null);
  }, [navigate]);

  const clockProps = {
    clockStatus, setClockStatus,
    clockInTime, setClockInTime,
    breakStartTime, setBreakStartTime,
    totalBreakSecs, setTotalBreakSecs,
    clockSessions, setClockSessions,
    setPage,
  };

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const urgentCount = jobs.filter(j =>
    j.priority === 'urgent' && !['completed', 'cancelled'].includes(j.status)
  ).length;
  const overdueInv = invoices.filter(i => i.status === 'overdue').length;
  const openComps  = complaints.filter(c => c.status === 'open').length;

  const badges = {
    jobs:        urgentCount,
    invoices:    overdueInv,
    complaints:  openComps,
    quotations:  quotations.filter(q => q.status === 'sent').length,
    leads:       leads.filter(l => l.stage === 'new').length,
    sm_reviews:  0,
    tickets:     tickets.filter(t => t.status === 'open').length,
    recruitment: 0,
  };

  // ── openModal ──────────────────────────────────────────────────────────────
  // Special case: modal type 'advance' navigates to the Extras page
  // and stores prefillTech so AdvanceIncentivePage opens the modal pre-filled.
  const openModal = useCallback((type, data = {}) => {
    if (type === 'advance') {
      // Store prefill data, then navigate to the Advance & Incentive page
      setPrefillAdvance(data.prefillTech ?? null);
      navigate(PATH_FOR['advance_incentive'] ?? '/salary/extras');
      return;
    }
    setModal({ type, data });
  }, [navigate]);

  const closeModal = () => setModal(null);
  const showToast  = useCallback(msg => { setToast(msg); closeModal(); }, []);

  // ── getPageElement ─────────────────────────────────────────────────────────
  const getPageElement = (id, Page) => {
    if (!SPECIAL_PROPS.has(id)) return <Page openModal={openModal} />;
    switch (id) {
      case 'profile':
        return <Page clockProps={clockProps} />;
      case 'dashboard':
        return <Page setPage={setPage} openModal={openModal} clockProps={clockProps} />;
      case 'jobs':
        return <Page openJob={openJob} setOpenJob={setOpenJob} openModal={openModal} />;
      case 'clock': {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return <Page {...clockProps} openModal={openModal} currentUserId={user._id || user.id} />;
      }
      case 'customer_type':
        return <Page types={customerTypes} onAdd={addCustomerType} onDelete={deleteCustomerType} onToggle={toggleCustomerType} />;
      case 'lead_sources':
        return <Page sources={leadSources} onAdd={addLeadSource} onDelete={deleteLeadSource} onToggle={toggleLeadSource} />;
      case 'sm_dashboard':
        return <Page setPage={setPage} />;
      case 'notifications':
        return <Page setPage={setPage} />;
      case 'logout':
        return <Page setPage={setPage} />;

      // ── KEY CHANGE: pass prefillAdvance into AdvanceIncentivePage ──────────
      // Also clear it once the page mounts so re-visiting doesn't re-trigger
      case 'advance_incentive':
        return (
          <Page
            openModal={openModal}
            prefillAdvance={prefillAdvance}
            onPrefillConsumed={() => setPrefillAdvance(null)}
          />
        );

      default:
        return <Page openModal={openModal} />;
    }
  };

  return (
    <div className="app-shell">
      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <RecordPaymentModal    open={modal?.type === 'record_payment'}    onClose={closeModal} onSave={() => showToast('Payment recorded!')} />
      <SendRemindersModal    open={modal?.type === 'send_reminder_all'} onClose={closeModal} onSave={() => showToast('Reminders sent!')} />
      <NewPriceItemModal     open={modal?.type === 'new_price_item'}    onClose={closeModal} onSave={async (data) => { await saveWithFallback(servicesApi.create, data, 'Price item saved!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <NewReminderModal      open={modal?.type === 'new_reminder'}      onClose={closeModal} onSave={async (data) => { await saveWithFallback(remindersApi.create, data, 'Reminder added!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <ApplyLeaveModal       open={modal?.type === 'apply_leave'}       onClose={closeModal} onSave={() => showToast('Leave submitted!')} />
      <LogGasModal           open={modal?.type === 'log_gas'}           onClose={closeModal} onSave={() => showToast('Gas log saved!')} />
      <NewTaskModal          open={modal?.type === 'new_task'}          onClose={closeModal} onSave={() => showToast('Task created!')} />
      <LogTimeModal          open={modal?.type === 'new_timelog'}       onClose={closeModal} onSave={() => { showToast('Time logged!'); window.dispatchEvent(new Event('focus')); }} />
      <NewJobModal           open={modal?.type === 'new_job'}           onClose={closeModal} onSave={async (data) => { await saveWithFallback(jobsApi.create, data, 'Work order created!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <NewQuotationModal     open={modal?.type === 'new_quotation'}     onClose={closeModal} onSave={async (data) => { await saveWithFallback(quotationsApi.create, data, 'Quotation created!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <NewCustomerModal      open={modal?.type === 'new_customer'}      onClose={closeModal} onSave={async (data) => { await saveWithFallback(customersApi.create, data, 'Customer added!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <NewAMCModal           open={modal?.type === 'new_amc'}           onClose={closeModal} onSave={async (data) => { await saveWithFallback(amcApi.create, data, 'AMC Contract created!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <NewInvoiceModal       open={modal?.type === 'new_invoice'}       onClose={closeModal} onSave={async (data) => { await saveWithFallback(invoicesApi.create, data, 'Invoice generated!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <AddTechnicianModal    open={modal?.type === 'new_tech'}          onClose={closeModal} onSave={async (data) => { await saveWithFallback(techsApi.create, data, 'Technician added!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <AddExpenseModal       open={modal?.type === 'new_expense'}       onClose={closeModal} onSave={async (data) => { await saveWithFallback(expensesApi.create, data, 'Expense submitted!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <AddInventoryModal     open={modal?.type === 'new_inventory'}     onClose={closeModal} onSave={async (data) => { await saveWithFallback(inventoryApi.create, data, 'Item added!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <NewLeadModal          open={modal?.type === 'new_lead'}          onClose={closeModal} onSave={async (data) => { await saveWithFallback(leadsApi.create, data, 'Lead created!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }}
                             sources={activeLeadSources} onAddSource={addLeadSource} />
      <NewPOModal            open={modal?.type === 'new_po'}            onClose={closeModal} onSave={async (data) => { await saveWithFallback(purchaseApi.create, data, 'PO created!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <NewSOModal            open={modal?.type === 'new_so'}            onClose={closeModal} onSave={() => showToast('SO created!')} />
      <NewSupplierModal      open={modal?.type === 'new_supplier'}      onClose={closeModal} onSave={async (data) => { await saveWithFallback(suppliersApi.create, data, 'Supplier added!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <NewAssetModal         open={modal?.type === 'new_asset'}         onClose={closeModal} onSave={async (data) => { await saveWithFallback(assetsApi.create, data, 'Asset registered!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <RegisterWarrantyModal open={modal?.type === 'new_warranty'}      onClose={closeModal} onSave={() => showToast('Warranty registered!')} />
      <NewNoticeModal
        open={modal?.type === 'new_notice'}
        onClose={closeModal}
        editId={modal?.data?.id}
        onSave={async (data, editId) => {
          try {
            if (editId) {
              await noticesApi.update(editId, data);
              showToast('Notice updated!');
            } else {
              await noticesApi.create(data);
              showToast('Notice posted!');
            }
            closeModal();
            window.dispatchEvent(new Event('focus'));
          } catch {
            showToast('Failed to save notice.');
          }
        }}
      />
      <MarkAttendanceModal   open={modal?.type === 'mark_attendance'}   onClose={closeModal} onSave={() => showToast('Attendance saved!')} />
      <AdvanceModal          open={modal?.type === 'give_advance'}      onClose={closeModal} onSave={() => showToast('Advance approved!')}  techName={modal?.data?.techName} />
      <SendQuotationModal    open={modal?.type === 'send_quotation'}    onClose={closeModal} onSave={() => showToast('Quotation sent!')}    quotId={modal?.data?.id} />
      <ConvertToJobModal     open={modal?.type === 'convert_to_job'}    onClose={closeModal} onSave={() => showToast('Job created!')}       quotId={modal?.data?.id} />
      <ReportModal           open={modal?.type === 'report'}            onClose={closeModal} title={modal?.data?.title || ''} format={modal?.data?.format || 'PDF'} />
      <AddAdminUserModal     open={modal?.type === 'new_admin'}         onClose={closeModal} onSave={() => showToast('Admin user added!')} />
      <UseInventoryModal     open={modal?.type === 'use_inventory'}     onClose={closeModal} onSave={() => showToast('Usage logged!')}      itemName={modal?.data?.name} />
      <LogFuelModal          open={modal?.type === 'log_fuel'}          onClose={closeModal} onSave={() => showToast('Fuel logged!')}       assetName={modal?.data?.name} />
      <ScheduleAMCModal      open={modal?.type === 'schedule_amc'}      onClose={closeModal} onSave={() => showToast('Visit scheduled!')}   contractId={modal?.data?.id} />
      <RequestReviewModal    open={modal?.type === 'request_review'}    onClose={closeModal} onSave={() => showToast('Review request sent!')} />
      <AssignComplaintModal  open={modal?.type === 'assign_complaint'}  onClose={closeModal} onSave={() => showToast('Complaint assigned!')} compId={modal?.data?.id} />
      <ResolveComplaintModal open={modal?.type === 'resolve_complaint'} onClose={closeModal} onSave={() => showToast('Complaint resolved!')} compId={modal?.data?.id} />
      <SetReminderModal      open={modal?.type === 'set_reminder'}      onClose={closeModal} onSave={() => showToast('Reminder set!')} />
      <CustomReportModal     open={modal?.type === 'custom_report'}     onClose={closeModal} onSave={() => showToast('Generating report…')} />

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar
        page={activePage}
        setPage={setPage}
        setOpenJob={setOpenJob}
        badges={badges}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        clockStatus={clockStatus}
        NAV={NAV}
      />

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="main-area">
        <Header
          page={activePage}
          openJob={openJob}
          TITLES={TITLES}
          time={time}
          clockProps={clockProps}
          urgentCount={urgentCount}
          overdueInv={overdueInv}
          openComps={openComps}
          setPage={setPage}
          setSidebarOpen={setSidebarOpen}
          notifs={notifs} setNotifs={setNotifs}
        />

        <div className="page-content">
          <Routes>
            {ROUTE_MAP.map(({ id, component: Page }) => (
              <Route
                key={id}
                path={PATH_FOR[id]}
                element={getPageElement(id, Page)}
              />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
//  Auth Guard
// =============================================================================
function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// =============================================================================
//  App root
// =============================================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/*" element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  );
}