// Status label/colour maps — drive badge colours for each status key
export const JOB_STATUS={
  new:        {label:"New",         bg:"#EFF6FF",color:"#1D4ED8",dot:"#3B82F6"},
  assigned:   {label:"Assigned",    bg:"#ECFDF5",color:"#065F46",dot:"#10B981"},
  in_progress:{label:"In Progress", bg:"#FFFBEB",color:"#92400E",dot:"#F59E0B"},
  completed:  {label:"Completed",   bg:"#F0FDF4",color:"#166534",dot:"#22C55E"},
  invoiced:   {label:"Invoiced",    bg:"#F5F3FF",color:"#5B21B6",dot:"#8B5CF6"},
  cancelled:  {label:"Cancelled",   bg:"#FEF2F2",color:"#991B1B",dot:"#EF4444"},
};
export const QUOT_STATUS={
  draft:    {label:"Draft",    bg:"#F8FAFC",color:"#475569"},
  sent:     {label:"Sent",     bg:"#EFF6FF",color:"#1D4ED8",dot:"#3B82F6"},
  approved: {label:"Approved", bg:"#F0FDF4",color:"#166534",dot:"#22C55E"},
  rejected: {label:"Rejected", bg:"#FEF2F2",color:"#991B1B",dot:"#EF4444"},
  expired:  {label:"Expired",  bg:"#F8FAFC",color:"#64748B"},
};
export const INV_STATUS={
  paid:   {label:"Paid",    bg:"#F0FDF4",color:"#166534"},
  pending:{label:"Pending", bg:"#FFFBEB",color:"#92400E"},
  overdue:{label:"Overdue", bg:"#FEF2F2",color:"#DC2626"},
};
export const TECH_STATUS={
  available:{label:"Available",bg:"#ECFDF5",color:"#065F46"},
  busy:     {label:"On Job",   bg:"#FFFBEB",color:"#92400E"},
  off:      {label:"Off Duty", bg:"#F8FAFC",color:"#64748B"},
};
export const ATTEND_STATUS={
  present:{label:"Present", bg:"#ECFDF5",color:"#166534"},
  absent: {label:"Absent",  bg:"#FEF2F2",color:"#DC2626"},
  half:   {label:"Half Day",bg:"#FFFBEB",color:"#B45309"},
  holiday:{label:"Holiday", bg:"#F5F3FF",color:"#7C3AED"},
  leave:  {label:"On Leave",bg:"#EFF6FF",color:"#1D4ED8"},
};
export const COMP_STATUS={
  open:       {label:"Open",       bg:"#FEF2F2",color:"#DC2626",dot:"#EF4444"},
  in_progress:{label:"In Progress",bg:"#FFFBEB",color:"#B45309",dot:"#F59E0B"},
  resolved:   {label:"Resolved",   bg:"#F0FDF4",color:"#166534",dot:"#22C55E"},
  closed:     {label:"Closed",     bg:"#F8FAFC",color:"#64748B"},
};
export const EXP_STATUS={
  approved:{label:"Approved",bg:"#F0FDF4",color:"#166534"},
  pending: {label:"Pending", bg:"#FFFBEB",color:"#B45309"},
  rejected:{label:"Rejected",bg:"#FEF2F2",color:"#DC2626"},
};

// src/constants/statusMaps.js

export const TKT_STATUS = {
  open: {
    label: "Open",
    color: "#DC2626",
    bg: "#FEF2F2",
  },
  in_progress: {
    label: "In Progress",
    color: "#B45309",
    bg: "#FFFBEB",
  },
  resolved: {
    label: "Resolved",
    color: "#166534",
    bg: "#F0FDF4",
  },
  closed: {
    label: "Closed",
    color: "#6B7280",
    bg: "#F3F4F6",
  },
};

export const TKT_PRIORITY = {
  low: {
    label: "Low",
    color: "#166534",
    bg: "#F0FDF4",
  },
  medium: {
    label: "Medium",
    color: "#B45309",
    bg: "#FFFBEB",
  },
  high: {
    label: "High",
    color: "#DC2626",
    bg: "#FEF2F2",
  },
  urgent: {
    label: "Urgent",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
};

export const TKT_CATEGORIES = {
  general: {
    label: "General",
    color: "#3B82F6",
    bg: "#EFF6FF",
  },
  breakdown: {
    label: "Breakdown",
    color: "#DC2626",
    bg: "#FEF2F2",
  },
  quality: {
    label: "Quality",
    color: "#B45309",
    bg: "#FFFBEB",
  },
  billing: {
    label: "Billing",
    color: "#166534",
    bg: "#F0FDF4",
  },
  scheduling: {
    label: "Scheduling",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
};

export const PO_STATUS = {
  draft: { label: "Draft", color: "#6B7280", bg: "#F3F4F6" },
  ordered: { label: "Ordered", color: "#0369A1", bg: "#EFF6FF" },
  received: { label: "Received", color: "#166534", bg: "#F0FDF4" },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEF2F2" },
};
/* ══════════════════════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════════════════════ */
