import React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { COLORS, FONTS } from "../../constants/tokens";
import Modal from "../ui/Modal";
import { FRow, FInput, FSelect, FTextarea, FBtn } from "../ui/Form";
import { Avatar } from "../ui/Badges";
import AddressFields from "./AddressFields";
import RichTextFileEditor from "./RichTextFileEditor";
import RichTextEditorNoFile from "../ui/RichTextEditorNoFile";
import {
  TECHNICIANS as technicians,
  customers,
  invoices,
  jobs,
} from "../../data/mockData";
import { jobsApi, customersApi, techsApi, invoicesApi,
         expensesApi, complaintsApi, inventoryApi, noticesApi } from '../../services/api';

// ─── Section heading inside modal ────────────────────────────────────────────
const SectionHead = ({ title }) => (
  <div
    style={{
      fontSize: 13,
      fontWeight: 700,
      color: COLORS.h1,
      borderBottom: `2px solid ${COLORS.brand}22`,
      paddingBottom: 8,
      marginBottom: 14,
      marginTop: 6,
      letterSpacing: 0.2,
    }}
  >
    {title}
  </div>
);

const lbl = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  color: COLORS.faint,
  letterSpacing: "0.06em",
  marginBottom: 6,
};

// ─── NewTicketModal ───────────────────────────────────────────────────────────
const NewTicketModal = ({ open, onClose, onSave }) => {
  const [files, setFiles] = useState([]);
  const [autoCreateJob, setAutoCreateJob] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🎫 New Support Ticket"
      width={640}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Customer *">
          <FSelect>
            <option value="">Select customer…</option>
            <option>Sharma Residency</option>
            <option>TechPark Ltd.</option>
            <option>Galaxy Towers</option>
            <option>Sunrise Hotel</option>
            <option>Meera Iyer</option>
            <option>City Mall</option>
            <option>Patel Villa</option>
          </FSelect>
        </FRow>
        <FRow label="Contact Person">
          <FInput placeholder="Auto-fills from customer" />
        </FRow>
      </div>
      <FRow label="Subject *">
        <FInput placeholder="Brief description of the issue…" />
      </FRow>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Issue Type *">
          <FSelect>
            <option value="">Select type…</option>
            <option>Not Cooling</option>
            <option>Water Leakage</option>
            <option>Strange Noise</option>
            <option>Not Turning On</option>
            <option>Remote / Controls Issue</option>
            <option>Gas Leak / Smell</option>
            <option>Error Code on Display</option>
            <option>AMC Scheduled Visit</option>
            <option>Installation Request</option>
            <option>Other</option>
          </FSelect>
        </FRow>
        <FRow label="Priority *">
          <FSelect defaultValue="Medium">
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </FSelect>
        </FRow>
        <FRow label="AC Unit / Model">
          <FInput placeholder="e.g. Daikin 1.5T Inverter" />
        </FRow>
        <FRow label="Location / Site">
          <FInput placeholder="Floor, room or address" />
        </FRow>
        <FRow label="Assign Technician">
          <FSelect>
            <option>Unassigned</option>
            {technicians.map((t) => (
              <option key={t.id}>{t.name}</option>
            ))}
          </FSelect>
        </FRow>
        <FRow label="SLA / Response Time">
          <FSelect defaultValue="12 hrs">
            <option>4 hrs</option>
            <option>12 hrs</option>
            <option>24 hrs</option>
            <option>48 hrs</option>
          </FSelect>
        </FRow>
        <FRow label="Channel">
          <FSelect>
            <option>Phone Call</option>
            <option>WhatsApp</option>
            <option>Email</option>
            <option>Walk-in</option>
            <option>App / Portal</option>
          </FSelect>
        </FRow>
        <FRow label="Linked Job / AMC">
          <FInput placeholder="e.g. JOB-1042 or AMC-007" />
        </FRow>
      </div>
      <FRow label="Description">
        <RichTextFileEditor
          placeholder="Detailed problem description, observations, error codes, when issue started…"
          files={files}
          setFiles={setFiles}
        />
      </FRow>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 8,
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          marginTop: 4,
        }}
      >
        <input
          type="checkbox"
          id="autoJob"
          checked={autoCreateJob}
          onChange={(e) => setAutoCreateJob(e.target.checked)}
          style={{
            width: 15,
            height: 15,
            cursor: "pointer",
            accentColor: COLORS.brand,
          }}
        />
        <label
          htmlFor="autoJob"
          style={{
            fontSize: 13,
            color: COLORS.h2,
            cursor: "pointer",
            fontFamily: FONTS.sans,
          }}
        >
          Auto-create a work order from this ticket on save
        </label>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 8,
        }}
      >
        <FBtn secondary onClick={onClose}>
          Cancel
        </FBtn>
        <FBtn onClick={() => onSave({})}>Save Ticket</FBtn>
      </div>
    </Modal>
  );
};

// ─── NewJobModal ──────────────────────────────────────────────────────────────
const NewJobModal = ({ open, onClose, onSave }) => {
  const [files, setFiles] = useState([]);
  const [liveCustomers, setLiveCustomers] = useState([]);
  const [liveTechs, setLiveTechs] = useState([]);
  const [form, setForm] = useState({
    customer: "",
    customerName: "",
    type: "Service",
    priority: "normal",
    technician: "",
    techName: "Unassigned",
    scheduledDate: "",
    scheduledTime: "10:00",
    ac: "",
    issue: "",
    address: "",
  });

  // Load customers & technicians from backend when modal opens
  useEffect(() => {
    if (!open) return;
    customersApi
      .list({ limit: 200 })
      .then((r) => setLiveCustomers(r.data ?? []))
      .catch(() => {});
    techsApi
      .list({ limit: 200 })
      .then((r) => setLiveTechs(r.data ?? []))
      .catch(() => {});
  }, [open]);

  const set = (k) => (e) => {
    const val = e.target.value;
    if (k === "customer") {
      const cust = liveCustomers.find((c) => c._id === val);
      setForm((f) => ({
        ...f,
        customer: val,
        customerName: cust?.name || "",
        address: cust?.address || "",
      }));
    } else if (k === "technician") {
      const tech = liveTechs.find((t) => t._id === val);
      setForm((f) => ({
        ...f,
        technician: val,
        techName: tech?.name || "Unassigned",
      }));
    } else {
      setForm((f) => ({ ...f, [k]: val }));
    }
  };

  const handleSave = () => {
    if (!form.customer) {
      alert("Please select a customer");
      return;
    }
    onSave({
      customer: form.customer,
      customerName: form.customerName,
      type: form.type,
      priority: form.priority,
      technician: form.technician || undefined,
      techName: form.techName,
      scheduledDate: form.scheduledDate || undefined,
      scheduledTime: form.scheduledTime,
      ac: form.ac,
      issue: form.issue,
      address: form.address,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="➕ Create New Work Order"
      width={620}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Customer *">
          <FSelect value={form.customer} onChange={set("customer")}>
            <option value="">-- Select customer --</option>
            {liveCustomers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </FSelect>
        </FRow>
        <FRow label="Job Type">
          <FSelect value={form.type} onChange={set("type")}>
            {[
              "Service",
              "Repair",
              "Installation",
              "AMC Visit",
              "Inspection",
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </FSelect>
        </FRow>
        <FRow label="Priority">
          <FSelect value={form.priority} onChange={set("priority")}>
            {["normal", "high", "urgent"].map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </FSelect>
        </FRow>
        <FRow label="Technician">
          <FSelect value={form.technician} onChange={set("technician")}>
            <option value="">Unassigned</option>
            {liveTechs.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </FSelect>
        </FRow>
        <FRow label="Scheduled Date">
          <FInput
            type="date"
            value={form.scheduledDate}
            onChange={set("scheduledDate")}
          />
        </FRow>
        <FRow label="Scheduled Time">
          <FInput
            type="time"
            value={form.scheduledTime}
            onChange={set("scheduledTime")}
          />
        </FRow>
      </div>
      <FRow label="AC Unit / Equipment">
        <FInput
          placeholder="e.g. Samsung 1.5T Split – Bedroom"
          value={form.ac}
          onChange={set("ac")}
        />
      </FRow>
      <FRow label="Description">
        <RichTextFileEditor
          placeholder="Detailed problem description, observations, error codes…"
          files={files}
          setFiles={setFiles}
          onChange={(val) => setForm((f) => ({ ...f, issue: val }))}
        />
      </FRow>
      <div className="addr-section-label">Customer Address</div>
      <FRow label="Street / Flat / Building">
        <FInput
          placeholder="e.g. Flat 4B, Green Apartments, MG Road"
          value={form.address}
          onChange={set("address")}
        />
      </FRow>
      <AddressFields />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 8,
        }}
      >
        <FBtn secondary onClick={onClose}>
          Cancel
        </FBtn>
        <FBtn onClick={handleSave}>Create Job</FBtn>
      </div>
    </Modal>
  );
};

// ─── NewQuotationModal ────────────────────────────────────────────────────────
const NewQuotationModal = ({ open, onClose, onSave }) => {
  const notesRef = useRef(null);
  const termsRef = useRef(null);
  return (
    <Modal open={open} onClose={onClose} title="📄 New Quotation" width={580}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Customer Name">
          <FInput placeholder="Customer or company" />
        </FRow>
        <FRow label="Contact Person">
          <FInput placeholder="Mr./Ms. Name" />
        </FRow>
        <FRow label="Phone">
          <FInput placeholder="+91 XXXXX XXXXX" type="tel" />
        </FRow>
        <FRow label="Type">
          <FSelect>
            <option>Installation</option>
            <option>Service</option>
            <option>Repair</option>
            <option>AMC</option>
          </FSelect>
        </FRow>
        <FRow label="Valid Till">
          <FInput type="date" defaultValue="2026-03-20" />
        </FRow>
        <FRow label="Items / Description">
          <FTextarea
            placeholder="Item 1 – Daikin 1.5T Inverter Split × 2 @ ₹42,000…"
            rows={4}
          />
        </FRow>
      </div>
      {/* ── NEW: Customer Address ─────────────────────────────────────────── */}
      {/* <div className="addr-section-label">Customer Address</div> */}
      <FRow label="Street / Flat / Building">
        <FInput placeholder="e.g. Flat 4B, Green Apartments, MG Road" />
      </FRow>
      <AddressFields prefix="quot_" />
      <FRow>
        <label style={lbl}>NOTES</label>
        <RichTextEditorNoFile
          placeholder="Additional notes, special instructions, remarks for this quotation…"
          getValueRef={notesRef}
          minHeight={90}
        />
      </FRow>
      <FRow>
        <label style={lbl}>TERMS &amp; CONDITIONS</label>
        <RichTextEditorNoFile
          placeholder="Payment terms, warranty info, cancellation policy, validity clauses…"
          getValueRef={termsRef}
          minHeight={90}
        />
      </FRow>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 8,
        }}
      >
        <FBtn secondary onClick={onClose}>
          Cancel
        </FBtn>
        <FBtn onClick={() => onSave({})}>Create Quotation</FBtn>
      </div>
    </Modal>
  );
};

// ─── AddTypeModal ─────────────────────────────────────────────────────────────
const AddTypeModal = ({
  onClose,
  onSave,
  label = "Type",
  placeholder = "e.g. New type…",
}) => {
  const [value, setValue] = useState("");
  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.white,
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          width: 420,
          padding: "28px 28px 24px",
          fontFamily: FONTS.sans,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.h1 }}>
            Add {label}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              color: COLORS.muted,
              cursor: "pointer",
              lineHeight: 1,
              padding: "0 2px",
            }}
          >
            ×
          </button>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.faint,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 6,
            }}
          >
            {label} <span style={{ color: "#DC2626" }}>*</span>
          </div>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim()) {
                onSave(value.trim());
                onClose();
              }
            }}
            placeholder={placeholder}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1.5px solid ${value ? COLORS.brand : COLORS.border}`,
              fontSize: 13,
              fontFamily: FONTS.sans,
              color: COLORS.h2,
              background: "#FAFAFA",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color .15s",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.white,
              color: COLORS.muted,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: FONTS.sans,
            }}
          >
            Close
          </button>
          <button
            onClick={() => {
              if (value.trim()) {
                onSave(value.trim());
                onClose();
              }
            }}
            disabled={!value.trim()}
            style={{
              padding: "9px 22px",
              borderRadius: 8,
              border: "none",
              background: value.trim()
                ? "linear-gradient(135deg,#ea580c,#c2410c)"
                : COLORS.border,
              color: value.trim() ? "white" : COLORS.muted,
              fontSize: 13,
              fontWeight: 700,
              cursor: value.trim() ? "pointer" : "not-allowed",
              fontFamily: FONTS.sans,
              transition: "background .15s",
            }}
          >
            ✓ Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// ─── NewCustomerModal ─────────────────────────────────────────────────────────
const NewCustomerModal = ({
  open,
  onClose,
  onSave,
  activeTypes = [],
  onAddType,
}) => {
  const fallback = ["Residential", "Commercial"];
  const typeList = activeTypes.length > 0 ? activeTypes : fallback;
  const [selectedType, setSelectedType] = useState(typeList[0] || "");
  const [showAddType, setShowAddType] = useState(false);
  const handleAddType = (newType) => {
    onAddType?.(newType);
    setSelectedType(newType);
  };
  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="👤 Add New Customer"
        width={620}
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <FRow label="Full Name / Company">
            <FInput placeholder="Sharma Residency" />
          </FRow>
          <FRow label="Type">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 13,
                  fontFamily: FONTS.sans,
                  color: COLORS.h2,
                  background: COLORS.white,
                  outline: "none",
                }}
              >
                {typeList.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={() => setShowAddType(true)}
                title="Add new type"
                style={{
                  flexShrink: 0,
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: `1.5px dashed ${COLORS.brand}`,
                  background: `${COLORS.brand}0D`,
                  color: COLORS.brand,
                  fontSize: 20,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                +
              </button>
            </div>
          </FRow>
          <FRow label="Phone">
            <FInput type="tel" placeholder="+91 XXXXX XXXXX" />
          </FRow>
          <FRow label="Email">
            <FInput type="email" placeholder="email@example.com" />
          </FRow>
          <FRow label="AC Units">
            <FInput type="number" placeholder="2" defaultValue="1" />
          </FRow>
          <FRow label="AMC Status">
            <FSelect>
              <option>None</option>
              <option>Active</option>
            </FSelect>
          </FRow>
        </div>
        <div className="addr-section-label">Address</div>
        <FRow label="Street / Flat / Building">
          <FInput placeholder="e.g. Flat 4B, Green Apartments, MG Road" />
        </FRow>
        <AddressFields prefix="cust_" />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 8,
          }}
        >
          <FBtn secondary onClick={onClose}>
            Cancel
          </FBtn>
          <FBtn onClick={() => onSave({})}>Add Customer</FBtn>
        </div>
      </Modal>
      {showAddType && (
        <AddTypeModal
          onClose={() => setShowAddType(false)}
          onSave={handleAddType}
          label="Customer Type"
          placeholder="e.g. Industrial, Government…"
        />
      )}
    </>
  );
};

// ─── NewAMCModal ──────────────────────────────────────────────────────────────
const NewAMCModal = ({ open, onClose, onSave }) => {
  const [files, setFiles] = useState([]);
  const [autoRenew, setAutoRenew] = useState(false);
  const [noDueDate, setNoDueDate] = useState(false);
  const [currency, setCurrency] = useState("INR (₹)");
  const currencies = ["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)", "AED (د.إ)"];
  const [liveCustomers, setLiveCustomers] = useState([]);

  // Only track the 3 required fields as state; rest stays as uncontrolled
  const [customerId, setCustomerId] = useState("");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2027-03-31");
  const [plan, setPlan] = useState("Basic");
  const [units, setUnits] = useState(1);
  const [value, setValue] = useState("");
  const [visits, setVisits] = useState(4);
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (!open) return;
    customersApi
      .list({ limit: 200 })
      .then((r) => setLiveCustomers(r.data ?? []))
      .catch(() => {});
  }, [open]);

  const handleSave = () => {
    if (!customerId) {
      alert("Please select a client");
      return;
    }
    if (!startDate) {
      alert("Start date is required");
      return;
    }
    if (!endDate && !noDueDate) {
      alert("End date is required");
      return;
    }
    const cust = liveCustomers.find((c) => c._id === customerId);
    onSave({
      customer: customerId,
      customerName: cust?.name || "",
      plan,
      start: startDate,
      end: noDueDate
        ? new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString()
        : endDate,
      value: Number(value) || 0,
      visits: Number(visits) || 4,
      units: Number(units) || 1,
      status,
      autoRenew,
      currency,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="📋 New Contract" width={700}>
      <SectionHead title="Contract Details" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Contract Number *">
          <div
            style={{
              display: "flex",
              gap: 0,
              borderRadius: 8,
              overflow: "hidden",
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                background: "#F3F4F6",
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.muted,
                borderRight: `1px solid ${COLORS.border}`,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              CON#
            </div>
            <input
              placeholder="Auto"
              style={{
                flex: 1,
                padding: "8px 10px",
                border: "none",
                outline: "none",
                fontSize: 13,
                fontFamily: FONTS.mono,
                color: COLORS.h2,
                background: COLORS.white,
              }}
            />
          </div>
        </FRow>
        <FRow label="Subject *">
          <FInput placeholder="e.g. Annual Maintenance Contract – Sharma Residency" />
        </FRow>
        <FRow label="Contract Type *">
          <FSelect>
            <option value="">Select type…</option>
            <option>AMC – Basic</option>
            <option>AMC – Comprehensive</option>
            <option>AMC – Premium</option>
            <option>Installation</option>
            <option>Service Agreement</option>
            <option>Rental / Lease</option>
            <option>Warranty Extension</option>
            <option>One-time Repair</option>
          </FSelect>
        </FRow>
        <FRow label="Plan">
          <FSelect value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option>Basic</option>
            <option>Comprehensive</option>
            <option>Premium</option>
            <option>Custom</option>
          </FSelect>
        </FRow>
      </div>
      <FRow label="Description / Scope of Work">
        <RichTextFileEditor
          placeholder="Describe the scope of work, services included, exclusions, SLA terms…"
          files={files}
          setFiles={setFiles}
          minHeight={90}
        />
      </FRow>
      <SectionHead title="Dates & Value" />
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}
      >
        <FRow label="Start Date *">
          <FInput
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </FRow>
        <FRow label="End Date">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <FInput
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={noDueDate}
              style={{ opacity: noDueDate ? 0.4 : 1 }}
            />
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: COLORS.muted,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={noDueDate}
                onChange={(e) => setNoDueDate(e.target.checked)}
                style={{ accentColor: COLORS.brand, cursor: "pointer" }}
              />
              Without Due Date
            </label>
          </div>
        </FRow>
        <FRow label="Visits / Year">
          <FInput
            type="number"
            placeholder="4"
            value={visits}
            onChange={(e) => setVisits(e.target.value)}
          />
        </FRow>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Contract Value (₹) *">
          <FInput
            type="number"
            placeholder="48000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </FRow>
        <FRow label="Currency">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              fontSize: 13,
              fontFamily: FONTS.sans,
              color: COLORS.h2,
              background: COLORS.white,
              outline: "none",
            }}
          >
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </FRow>
        <FRow label="Payment Terms">
          <FSelect>
            <option>Upfront / Full Payment</option>
            <option>Quarterly</option>
            <option>Half-Yearly</option>
            <option>Monthly</option>
            <option>On Completion</option>
            <option>Net 15</option>
            <option>Net 30</option>
          </FSelect>
        </FRow>
        <FRow label="Auto-Renew">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 8,
              background: autoRenew ? `${COLORS.brand}08` : COLORS.bg,
              border: `1px solid ${autoRenew ? COLORS.brand + "40" : COLORS.border}`,
              transition: "all .15s",
              cursor: "pointer",
            }}
            onClick={() => setAutoRenew((v) => !v)}
          >
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={() => setAutoRenew((v) => !v)}
              style={{
                accentColor: COLORS.brand,
                width: 15,
                height: 15,
                cursor: "pointer",
              }}
            />
            <span
              style={{
                fontSize: 13,
                color: autoRenew ? COLORS.brand : COLORS.body,
                fontWeight: autoRenew ? 600 : 400,
                fontFamily: FONTS.sans,
              }}
            >
              {autoRenew ? "Yes — auto-renew on expiry" : "No auto-renewal"}
            </span>
          </div>
        </FRow>
      </div>
      <SectionHead title="AC Equipment" />
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}
      >
        <FRow label="AC Units Covered">
          <FInput
            type="number"
            placeholder="4"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
          />
        </FRow>
        <FRow label="AC Brand / Model">
          <FInput placeholder="e.g. Daikin, Samsung, Voltas" />
        </FRow>
        <FRow label="Capacity (Tons)">
          <FSelect>
            <option>Any / Mixed</option>
            <option>0.75 T</option>
            <option>1.0 T</option>
            <option>1.5 T</option>
            <option>2.0 T</option>
            <option>2.5 T +</option>
            <option>VRF / Cassette</option>
          </FSelect>
        </FRow>
        <FRow label="Assigned Technician">
          <FSelect>
            <option>Unassigned</option>
            {technicians.map((t) => (
              <option key={t.id}>{t.name}</option>
            ))}
          </FSelect>
        </FRow>
        <FRow label="Linked AMC Ref">
          <FInput placeholder="e.g. AMC-221" />
        </FRow>
        <FRow label="Linked Lead">
          <FInput placeholder="e.g. LEAD-045" />
        </FRow>
      </div>
      <SectionHead title="Client Details" />
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}
      >
        <FRow label="Client *">
          <FSelect
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">-- Select client --</option>
            {liveCustomers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </FSelect>
        </FRow>
        <FRow label="Contact Person">
          <FInput placeholder="Mr. / Ms. Name" />
        </FRow>
        <FRow label="Cell / Mobile">
          <FInput type="tel" placeholder="+91 XXXXX XXXXX" />
        </FRow>
        <FRow label="Office Phone">
          <FInput type="tel" placeholder="+91 79 XXXX XXXX" />
        </FRow>
        <FRow label="Email">
          <FInput type="email" placeholder="client@example.com" />
        </FRow>
      </div>
      <FRow label="Street / Building">
        <FInput placeholder="e.g. Flat 4B, Green Apartments, SG Road" />
      </FRow>
      <AddressFields prefix="con_" />
      <div>
        <FRow label="Alternate / Site Address">
          <textarea
            placeholder="e.g. Site address if different from billing…"
            rows={3}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              fontSize: 13,
              fontFamily: FONTS.sans,
              color: COLORS.h2,
              background: "var(--bg)",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </FRow>
      </div>
      <SectionHead title="Signature & Status" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Initial Status">
          <FSelect value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="cancelled">Cancelled</option>
          </FSelect>
        </FRow>
        <FRow label="Send for E-Signature on Save">
          <FSelect>
            <option>No — save as draft</option>
            <option>Yes — send immediately</option>
          </FSelect>
        </FRow>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 12,
        }}
      >
        <FBtn secondary onClick={onClose}>
          Cancel
        </FBtn>
        <FBtn onClick={handleSave}>Create Contract</FBtn>
      </div>
    </Modal>
  );
};

// ─── NewInvoiceModal ──────────────────────────────────────────────────────────
const NewInvoiceModal = ({ open, onClose, onSave }) => (
  <Modal open={open} onClose={onClose} title="🧾 Create Invoice">
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <FRow label="Job / Contract Ref">
        <FSelect>
          <option>JOB-1042</option>
          <option>JOB-1041</option>
          <option>AMC-221</option>
          <option>AMC-215</option>
        </FSelect>
      </FRow>
      <FRow label="Customer">
        <FSelect>
          <option>Sharma Residency</option>
          <option>Sunrise Hotel</option>
          <option>Meera Iyer</option>
          <option>TechPark Ltd.</option>
          <option>City Mall</option>
        </FSelect>
      </FRow>
      <FRow label="Amount (₹)">
        <FInput type="number" placeholder="5000" />
      </FRow>
      <FRow label="Due Date">
        <FInput type="date" defaultValue="2026-03-14" />
      </FRow>
    </div>
    <FRow label="Description / Items">
      <FTextarea
        placeholder="Labour: ₹1200&#10;Parts: R-32 Refrigerant × 1 – ₹2800&#10;Service charge: ₹500"
        rows={4}
      />
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>Generate Invoice</FBtn>
    </div>
  </Modal>
);

// ─── AddOptionModal (mini portal for DynamicSelect) ───────────────────────────
const AddOptionModal = ({ label, placeholder, onClose, onSave }) =>
  createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 11000,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.white,
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          width: 420,
          padding: "28px 28px 22px",
          fontFamily: FONTS.sans,
          animation: "popIn .18s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}`}</style>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                background: `${COLORS.brand}15`,
                color: COLORS.brand,
              }}
            >
              ＋
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.h1 }}>
              Add {label}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#F3F4F6",
              border: "none",
              width: 28,
              height: 28,
              borderRadius: 7,
              fontSize: 15,
              color: COLORS.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
        <OptionInput
          label={label}
          placeholder={placeholder}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
    </div>,
    document.body,
  );

const OptionInput = ({ label, placeholder, onSave, onClose }) => {
  const [value, setValue] = useState("");
  const valid = value.trim().length > 0;
  const submit = () => {
    if (valid) {
      onSave(value.trim());
      onClose();
    }
  };
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: COLORS.faint,
            textTransform: "uppercase",
            letterSpacing: ".06em",
            marginBottom: 7,
          }}
        >
          {label} <span style={{ color: "#DC2626" }}>*</span>
        </div>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "10px 13px",
            borderRadius: 9,
            border: `1.5px solid ${valid ? COLORS.brand : COLORS.border}`,
            fontSize: 13,
            fontFamily: FONTS.sans,
            color: COLORS.h2,
            background: "#FAFAFA",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color .15s",
            boxShadow: valid ? `0 0 0 3px ${COLORS.brand}18` : "none",
          }}
        />
        {valid && (
          <div
            style={{
              fontSize: 11,
              color: COLORS.brand,
              marginTop: 5,
              fontWeight: 600,
            }}
          >
            ✓ "{value.trim()}" will be added to the list
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          onClick={onClose}
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.white,
            color: COLORS.muted,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: FONTS.sans,
          }}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!valid}
          style={{
            padding: "9px 22px",
            borderRadius: 8,
            border: "none",
            background: valid
              ? "linear-gradient(135deg,#ea580c,#c2410c)"
              : COLORS.border,
            color: valid ? "white" : COLORS.muted,
            fontSize: 13,
            fontWeight: 700,
            cursor: valid ? "pointer" : "not-allowed",
            fontFamily: FONTS.sans,
            transition: "all .15s",
          }}
        >
          ✓ Save
        </button>
      </div>
    </>
  );
};

// ─── DynamicSelect ────────────────────────────────────────────────────────────
export const DynamicSelect = ({
  options = [],
  value,
  onChange,
  onAddOption,
  addLabel = "Option",
  addPlaceholder = "Enter new option…",
  disabled = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: `1px solid ${COLORS.border}`,
            fontSize: 13,
            fontFamily: FONTS.sans,
            color: COLORS.h2,
            background: disabled ? "#F9FAFB" : COLORS.white,
            outline: "none",
            cursor: disabled ? "not-allowed" : "default",
          }}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <button
          type="button"
          title={`Add new ${addLabel}`}
          onClick={() => setShowModal(true)}
          style={{
            flexShrink: 0,
            width: 34,
            height: 34,
            borderRadius: 8,
            border: `1.5px dashed ${COLORS.brand}`,
            background: `${COLORS.brand}0D`,
            color: COLORS.brand,
            fontSize: 18,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            transition: "background .15s, transform .1s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${COLORS.brand}1F`;
            e.currentTarget.style.transform = "scale(1.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${COLORS.brand}0D`;
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          ＋
        </button>
      </div>
      {showModal && (
        <AddOptionModal
          label={addLabel}
          placeholder={addPlaceholder}
          onClose={() => setShowModal(false)}
          onSave={(newOpt) => {
            onAddOption(newOpt);
            onChange(newOpt);
          }}
        />
      )}
    </>
  );
};

// ─── Section heading ──────────────────────────────────────────────────────────
const SectionHeads = ({ title, icon }) => (
  <div
    style={{
      fontSize: 12,
      fontWeight: 800,
      color: COLORS.h1,
      borderBottom: `2px solid ${COLORS.brand}22`,
      paddingBottom: 8,
      marginBottom: 14,
      marginTop: 18,
      letterSpacing: 0.3,
      display: "flex",
      alignItems: "center",
      gap: 7,
      textTransform: "uppercase",
    }}
  >
    {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
    {title}
  </div>
);

// ─── FileUploadField ──────────────────────────────────────────────────────────
const FileUploadField = ({
  label,
  accept = "image/*,application/pdf",
  hint,
  icon = "📎",
}) => {
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef();
  return (
    <div>
      <div
        style={{
          border: `2px dashed ${fileName ? COLORS.brand : COLORS.border}`,
          borderRadius: 10,
          padding: "14px 16px",
          textAlign: "center",
          cursor: "pointer",
          background: fileName ? `${COLORS.brand}06` : "#FAFAFA",
          transition: "all .15s",
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) setFileName(f.name);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files[0]) setFileName(e.target.files[0].name);
          }}
        />
        <div style={{ fontSize: 22, marginBottom: 4 }}>
          {fileName ? "✅" : icon}
        </div>
        {fileName ? (
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.brand }}>
            {fileName}
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.h2,
                marginBottom: 2,
              }}
            >
              Click or drag to upload {label}
            </div>
            <div style={{ fontSize: 11, color: COLORS.muted }}>
              {hint || "JPG, PNG or PDF · Max 5 MB"}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── PhotoUpload ──────────────────────────────────────────────────────────────
const PhotoUpload = () => {
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 0",
      }}
    >
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          cursor: "pointer",
          background: preview ? "transparent" : `${COLORS.brand}15`,
          border: `2px dashed ${COLORS.brand}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 28 }}>👤</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = (ev) => setPreview(ev.target.result);
          r.readAsDataURL(f);
        }}
      />
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h2 }}>
          Profile Photo
        </div>
        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
          JPG or PNG · Max 2 MB
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            marginTop: 6,
            padding: "5px 14px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            border: `1.5px solid ${COLORS.brand}`,
            background: `${COLORS.brand}10`,
            color: COLORS.brand,
            cursor: "pointer",
            fontFamily: FONTS.sans,
          }}
        >
          {preview ? "✏️ Change" : "+ Upload"}
        </button>
      </div>
    </div>
  );
};

// ─── ToggleField ──────────────────────────────────────────────────────────────
const ToggleField = ({ value, onChange, onLabel = "Yes", offLabel = "No" }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 12px",
      borderRadius: 8,
      background: value ? `${COLORS.brand}08` : COLORS.bg,
      border: `1px solid ${value ? COLORS.brand + "40" : COLORS.border}`,
      cursor: "pointer",
      transition: "all .15s",
    }}
    onClick={() => onChange(!value)}
  >
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
      style={{
        accentColor: COLORS.brand,
        width: 15,
        height: 15,
        cursor: "pointer",
      }}
    />
    <span
      style={{
        fontSize: 13,
        color: value ? COLORS.brand : COLORS.body,
        fontWeight: value ? 600 : 400,
        fontFamily: FONTS.sans,
      }}
    >
      {value ? onLabel : offLabel}
    </span>
  </div>
);

// ─── Default fallback lists (used when parent doesn't pass lookup props) ──────
const FALLBACK_ROLES = [
  "Junior Technician",
  "Technician",
  "Senior Technician",
  "Lead Technician",
  "Supervisor",
  "Foreman",
];
const FALLBACK_DEPARTMENTS = [
  "Field Service",
  "Installation",
  "AMC",
  "Repair",
  "VRF / Chillers",
];
const FALLBACK_EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelancer",
  "Apprentice",
];
const FALLBACK_REPORTING_TO = [
  "Admin / Owner",
  ...technicians
    .filter((t) => t.role?.includes("Senior") || t.role?.includes("Supervisor"))
    .map((t) => t.name),
];
const FALLBACK_VEHICLE_TYPES = [
  "None",
  "Bike (Own)",
  "Bike (Company)",
  "Van (Company)",
];
const FALLBACK_BANKS = [
  "SBI – State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra",
  "Bank of Baroda",
  "Punjab National Bank",
  "Canara Bank",
  "Union Bank",
  "IndusInd Bank",
  "Other",
];

// ─── AddTechnicianModal ───────────────────────────────────────────────────────
// Props:
//   open, onClose, onSave   — standard modal props
//   lookups                 — { roles, departments, employmentTypes, reportingTo, vehicleTypes, banks }
//                             arrays of ACTIVE option strings from TechnicianLookups page
//   onAddLookup             — fn(listKey, newValue) called when user adds a new option via + button
//                             so the parent can sync it back to TechnicianLookups state
// ─────────────────────────────────────────────────────────────────────────────
const AddTechnicianModal = ({
  open,
  onClose,
  onSave,
  lookups = {},
  onAddLookup,
}) => {
  // Resolve lists: prefer parent-provided (active-only), fall back to defaults
  const roles = lookups.roles?.length ? lookups.roles : FALLBACK_ROLES;
  const departments = lookups.departments?.length
    ? lookups.departments
    : FALLBACK_DEPARTMENTS;
  const employmentTypes = lookups.employmentTypes?.length
    ? lookups.employmentTypes
    : FALLBACK_EMPLOYMENT_TYPES;
  const reportingTo = lookups.reportingTo?.length
    ? lookups.reportingTo
    : FALLBACK_REPORTING_TO;
  const vehicleTypes = lookups.vehicleTypes?.length
    ? lookups.vehicleTypes
    : FALLBACK_VEHICLE_TYPES;
  const banks = lookups.banks?.length ? lookups.banks : FALLBACK_BANKS;

  // Selected values for each dynamic select
  const [role, setRole] = useState(() => roles[1] ?? roles[0] ?? "");
  const [dept, setDept] = useState(() => departments[0] ?? "");
  const [empType, setEmpType] = useState(() => employmentTypes[0] ?? "");
  const [reporter, setReporter] = useState(() => reportingTo[0] ?? "");
  const [vehicleType, setVehicleType] = useState(() => vehicleTypes[0] ?? "");
  const [bank, setBank] = useState("");

  // Other state
  const [loginAllowed, setLoginAllowed] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [whatsappNotif, setWhatsappNotif] = useState(false);

  // When user adds a new option via + button:
  // 1. Tell the parent (so TechnicianLookups table gets updated)
  // 2. Auto-select the new option in this field
  const handleAdd = useCallback(
    (listKey, setter) => (newVal) => {
      onAddLookup?.(listKey, newVal);
      setter(newVal);
    },
    [onAddLookup],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="👷 Add New Technician"
      width={700}
    >
      <PhotoUpload />

      {/* ── BASIC INFORMATION ─────────────────────────────────────────────── */}
      <SectionHeads title="Basic Information" icon="🪪" />
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}
      >
        <FRow label="Employee ID">
          <div
            style={{
              display: "flex",
              gap: 0,
              borderRadius: 8,
              overflow: "hidden",
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div
              style={{
                padding: "8px 10px",
                background: "#F3F4F6",
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.muted,
                borderRight: `1px solid ${COLORS.border}`,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              TECH#
            </div>
            <input
              placeholder="Auto"
              style={{
                flex: 1,
                padding: "8px 10px",
                border: "none",
                outline: "none",
                fontSize: 13,
                fontFamily: FONTS?.mono || FONTS.sans,
                color: COLORS.h2,
                background: COLORS.white,
              }}
            />
          </div>
        </FRow>
        <FRow label="Salutation">
          <FSelect>
            <option value="">--</option>
            <option>Mr.</option>
            <option>Ms.</option>
            <option>Mrs.</option>
            <option>Dr.</option>
          </FSelect>
        </FRow>
        <FRow label="Full Name *">
          <FInput placeholder="e.g. Ravi Kumar" />
        </FRow>

        {/* Role — syncs additions back to parent lookup table */}
        <FRow label="Role *">
          <DynamicSelect
            options={roles}
            value={role}
            onChange={setRole}
            onAddOption={handleAdd("roles", setRole)}
            addLabel="Role"
            addPlaceholder="e.g. Master Technician, HVAC Engineer…"
          />
        </FRow>

        {/* Department */}
        <FRow label="Department">
          <DynamicSelect
            options={departments}
            value={dept}
            onChange={setDept}
            onAddOption={handleAdd("departments", setDept)}
            addLabel="Department"
            addPlaceholder="e.g. VRF Premium, Ducting, Solar HVAC…"
          />
        </FRow>

        {/* Employment Type */}
        <FRow label="Employment Type">
          <DynamicSelect
            options={employmentTypes}
            value={empType}
            onChange={setEmpType}
            onAddOption={handleAdd("employmentTypes", setEmpType)}
            addLabel="Employment Type"
            addPlaceholder="e.g. Seasonal, On-call, Sub-contractor…"
          />
        </FRow>

        <FRow label="Gender">
          <FSelect>
            <option value="">Select…</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </FSelect>
        </FRow>
        <FRow label="Date of Birth">
          <FInput type="date" />
        </FRow>
        <FRow label="Blood Group">
          <FSelect>
            <option value="">Select…</option>
            {["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </FSelect>
        </FRow>
        <FRow label="Marital Status">
          <FSelect>
            <option>Single</option>
            <option>Married</option>
            <option>Divorced</option>
            <option>Widowed</option>
          </FSelect>
        </FRow>
        <FRow label="Nationality">
          <FInput placeholder="Indian" defaultValue="Indian" />
        </FRow>
        <FRow label="Religion / Category">
          <FSelect>
            <option value="">Optional…</option>
            <option>General</option>
            <option>OBC</option>
            <option>SC/ST</option>
            <option>EWS</option>
          </FSelect>
        </FRow>
      </div>

      {/* ── CONTACT DETAILS ───────────────────────────────────────────────── */}
      <SectionHeads title="Contact Details" icon="📞" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Mobile / WhatsApp *">
          <FInput type="tel" placeholder="+91 XXXXX XXXXX" />
        </FRow>
        <FRow label="Alternate Phone">
          <FInput type="tel" placeholder="+91 XXXXX XXXXX" />
        </FRow>
        <FRow label="Email">
          <FInput type="email" placeholder="name@cooltech.com" />
        </FRow>
        <FRow label="Personal Email">
          <FInput type="email" placeholder="personal@gmail.com" />
        </FRow>
        <FRow label="Emergency Contact Name">
          <FInput placeholder="e.g. Suresh Kumar (Father)" />
        </FRow>
        <FRow label="Emergency Contact Phone">
          <FInput type="tel" placeholder="+91 XXXXX XXXXX" />
        </FRow>
      </div>

      {/* ── ADDRESS ───────────────────────────────────────────────────────── */}
      <SectionHeads title="Address" icon="🏠" />
      <FRow label="Street / Flat / Building">
        <FInput
          placeholder="e.g. Flat 4B, Green Apartments, MG Road"
          name="tech_street"
        />
      </FRow>
      <AddressFields prefix="tech_" />

      {/* ── JOB DETAILS ───────────────────────────────────────────────────── */}
      <SectionHeads title="Job Details" icon="💼" />
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}
      >
        <FRow label="Join Date *">
          <FInput type="date" defaultValue="2026-04-01" />
        </FRow>
        <FRow label="Probation End Date">
          <FInput type="date" />
        </FRow>
        <FRow label="Status">
          <FSelect>
            <option>available</option>
            <option>busy</option>
            <option>off</option>
            <option>on-leave</option>
          </FSelect>
        </FRow>
        <FRow label="Basic Salary (₹) *">
          <FInput type="number" placeholder="22000" />
        </FRow>
        <FRow label="Daily Allowance (₹)">
          <FInput type="number" placeholder="200" />
        </FRow>
        <FRow label="Overtime Rate (₹/hr)">
          <FInput type="number" placeholder="150" />
        </FRow>

        {/* Reporting To */}
        <FRow label="Reporting To">
          <DynamicSelect
            options={reportingTo}
            value={reporter}
            onChange={setReporter}
            onAddOption={handleAdd("reportingTo", setReporter)}
            addLabel="Reporting To"
            addPlaceholder="e.g. Regional Manager, Senior Supervisor…"
          />
        </FRow>

        <FRow label="Service Area *">
          <FInput placeholder="e.g. Bengaluru South" />
        </FRow>
        <FRow label="Work Shift">
          <FSelect>
            <option>Morning (8 AM – 5 PM)</option>
            <option>Afternoon (12 PM – 9 PM)</option>
            <option>Flexible</option>
            <option>On-call</option>
          </FSelect>
        </FRow>
      </div>

      {/* ── AC SKILLS ─────────────────────────────────────────────────────── */}
      <SectionHeads title="AC Skills & Certifications" icon="❄️" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Skills (comma separated)">
          <FInput placeholder="Split, VRF, Inverter, Cassette, Chiller" />
        </FRow>
        <FRow label="Experience (Years)">
          <FInput type="number" placeholder="3" />
        </FRow>
        <FRow label="AC Brands Expertise">
          <FInput placeholder="e.g. Daikin, Voltas, Samsung, LG, Carrier" />
        </FRow>
        <FRow label="Specialization">
          <FSelect>
            <option>General Service</option>
            <option>Installation & Commissioning</option>
            <option>VRF / VRV Systems</option>
            <option>Chiller Plants</option>
            <option>Duct / Central AC</option>
            <option>Refrigerant Handling</option>
          </FSelect>
        </FRow>
        <FRow label="HVAC Certification">
          <FSelect>
            <option value="">None / Not certified</option>
            <option>RAC Technician (ITI)</option>
            <option>HVAC Diploma</option>
            <option>ASHRAE Certified</option>
            <option>CAREL Certified</option>
            <option>OEM Trained (Daikin / Carrier)</option>
          </FSelect>
        </FRow>
        <FRow label="Certification No. / Expiry">
          <FInput placeholder="e.g. RAC-2021-09876  |  Exp: 12-2027" />
        </FRow>
      </div>

      {/* ── VEHICLE / ASSET ───────────────────────────────────────────────── */}
      <SectionHeads title="Vehicle / Asset" icon="🏍️" />
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}
      >
        {/* Vehicle Type */}
        <FRow label="Vehicle Type">
          <DynamicSelect
            options={vehicleTypes}
            value={vehicleType}
            onChange={setVehicleType}
            onAddOption={handleAdd("vehicleTypes", setVehicleType)}
            addLabel="Vehicle Type"
            addPlaceholder="e.g. Three-Wheeler, Electric Bike…"
          />
        </FRow>
        <FRow label="Vehicle Reg. No.">
          <FInput placeholder="KA01AB1234" />
        </FRow>
        <FRow label="Driving Licence No.">
          <FInput placeholder="KA2020XXXX" />
        </FRow>
      </div>

      {/* ── IDENTITY DOCUMENTS ────────────────────────────────────────────── */}
      <SectionHeads title="Identity Documents" icon="📄" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Aadhaar Number">
          <FInput placeholder="XXXX  XXXX  XXXX" maxLength={14} />
        </FRow>
        <FRow label="PAN Number">
          <FInput
            placeholder="ABCDE1234F"
            maxLength={10}
            style={{ textTransform: "uppercase" }}
          />
        </FRow>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginTop: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: COLORS.faint,
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            AADHAAR CARD UPLOAD <span style={{ color: "#DC2626" }}>*</span>
          </div>
          <div
            style={{
              border: `2px dashed #3B82F680`,
              borderRadius: 10,
              padding: "16px 14px",
              background: "#EFF6FF",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
            onClick={() => document.getElementById("aadhaar-upload")?.click()}
          >
            <input
              id="aadhaar-upload"
              type="file"
              accept="image/*,application/pdf"
              style={{ display: "none" }}
            />
            <div style={{ fontSize: 28 }}>🪪</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8" }}>
              Upload Aadhaar Card
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#6B7280",
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              Front &amp; Back · JPG, PNG or PDF
              <br />
              Max 5 MB
            </div>
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: COLORS.faint,
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            PAN CARD UPLOAD <span style={{ color: "#DC2626" }}>*</span>
          </div>
          <div
            style={{
              border: `2px dashed #10B98180`,
              borderRadius: 10,
              padding: "16px 14px",
              background: "#F0FDF4",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
            onClick={() => document.getElementById("pan-upload")?.click()}
          >
            <input
              id="pan-upload"
              type="file"
              accept="image/*,application/pdf"
              style={{ display: "none" }}
            />
            <div style={{ fontSize: 28 }}>💳</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>
              Upload PAN Card
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#6B7280",
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              Clear scan / photo
              <br />
              JPG, PNG or PDF · Max 5 MB
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginTop: 14,
        }}
      >
        <FRow label="Driving Licence Upload (optional)">
          <FileUploadField
            label="Driving Licence"
            icon="🏍️"
            hint="JPG, PNG or PDF · Max 5 MB"
          />
        </FRow>
        <FRow label="HVAC Certification Upload (optional)">
          <FileUploadField
            label="Certification"
            icon="📜"
            hint="JPG, PNG or PDF · Max 5 MB"
          />
        </FRow>
      </div>

      {/* ── BANK DETAILS ──────────────────────────────────────────────────── */}
      <SectionHeads title="Bank Details (for Salary)" icon="🏦" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Account Holder Name">
          <FInput placeholder="As per bank account" />
        </FRow>

        {/* Bank Name */}
        <FRow label="Bank Name">
          <DynamicSelect
            options={["Select bank…", ...banks]}
            value={bank || "Select bank…"}
            onChange={(v) => setBank(v === "Select bank…" ? "" : v)}
            onAddOption={(v) => {
              handleAdd("banks", setBank)(v);
            }}
            addLabel="Bank"
            addPlaceholder="e.g. Federal Bank, IDFC First, Jana Small Finance…"
          />
        </FRow>

        <FRow label="Account Number">
          <FInput placeholder="XXXXXXXXXXXXXXXX" />
        </FRow>
        <FRow label="IFSC Code">
          <FInput
            placeholder="SBIN0001234"
            style={{ textTransform: "uppercase" }}
          />
        </FRow>
        <FRow label="Account Type">
          <FSelect>
            <option>Savings</option>
            <option>Current</option>
          </FSelect>
        </FRow>
        <FRow label="UPI ID (optional)">
          <FInput placeholder="name@upi" />
        </FRow>
      </div>

      {/* ── SYSTEM ACCESS ─────────────────────────────────────────────────── */}
      <SectionHeads title="System Access & Notifications" icon="🔐" />
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}
      >
        <FRow label="App Login Allowed">
          <ToggleField
            value={loginAllowed}
            onChange={setLoginAllowed}
            onLabel="Yes – grant app access"
            offLabel="No – field only"
          />
        </FRow>
        <FRow label="Email Notifications">
          <ToggleField
            value={emailNotif}
            onChange={setEmailNotif}
            onLabel="Yes – send emails"
            offLabel="No emails"
          />
        </FRow>
        <FRow label="WhatsApp Notifications">
          <ToggleField
            value={whatsappNotif}
            onChange={setWhatsappNotif}
            onLabel="Yes – WhatsApp alerts"
            offLabel="No WhatsApp"
          />
        </FRow>
      </div>
      {loginAllowed && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginTop: 14,
          }}
        >
          <FRow label="Temporary Password *">
            <FInput type="password" placeholder="Min 8 characters" />
          </FRow>
          <FRow label="User Role">
            <FSelect>
              <option>Technician (Field)</option>
              <option>Senior Technician</option>
              <option>Supervisor</option>
            </FSelect>
          </FRow>
        </div>
      )}

      {/* ── INTERNAL NOTES ────────────────────────────────────────────────── */}
      <SectionHeads title="Internal Notes" icon="📝" />
      <FRow label="Notes / Remarks">
        <textarea
          placeholder="Any internal notes about this technician…"
          rows={3}
          style={{
            width: "100%",
            padding: "9px 12px",
            borderRadius: 8,
            border: `1px solid ${COLORS.border}`,
            fontSize: 13,
            fontFamily: FONTS.sans,
            color: COLORS.h2,
            background: COLORS.white,
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </FRow>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 16,
        }}
      >
        <FBtn secondary onClick={onClose}>
          Cancel
        </FBtn>
        <FBtn onClick={() => onSave({})}>Add Technician</FBtn>
      </div>
    </Modal>
  );
};

// ─── Remaining modals (unchanged) ─────────────────────────────────────────────

const AddExpenseModal = ({ open, onClose, onSave }) => (
  <Modal open={open} onClose={onClose} title="💸 Add Expense Claim">
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <FRow label="Category">
        <FSelect>
          <option>Fuel</option>
          <option>Tools</option>
          <option>Parts</option>
          <option>Training</option>
          <option>Office</option>
          <option>Miscellaneous</option>
        </FSelect>
      </FRow>
      <FRow label="Technician">
        <FSelect>
          <option>Admin</option>
          {technicians.map((t) => (
            <option key={t.id}>{t.name}</option>
          ))}
        </FSelect>
      </FRow>
      <FRow label="Amount (₹)">
        <FInput type="number" placeholder="500" />
      </FRow>
      <FRow label="Date">
        <FInput type="date" defaultValue="2026-03-03" />
      </FRow>
    </div>
    <FRow label="Description">
      <FTextarea placeholder="Describe the expense…" rows={2} />
    </FRow>
    <FRow label="Receipt Attached">
      <div
        style={{
          border: `2px dashed ${COLORS.border}`,
          borderRadius: 8,
          padding: 16,
          textAlign: "center",
          cursor: "pointer",
          background: "#FAFAFA",
        }}
      >
        <div style={{ fontSize: 20, marginBottom: 4 }}>📎</div>
        <div style={{ fontSize: 12, color: COLORS.muted }}>
          Click to upload receipt (JPG, PDF)
        </div>
      </div>
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>Submit Claim</FBtn>
    </div>
  </Modal>
);

const AddInventoryModal = ({ open, onClose, onSave }) => (
  <Modal open={open} onClose={onClose} title="📦 Add Inventory Item">
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <FRow label="Item Name">
        <FInput placeholder="R-32 Refrigerant" />
      </FRow>
      <FRow label="Category">
        <FSelect>
          <option>Refrigerant</option>
          <option>Filter</option>
          <option>Electrical</option>
          <option>Piping</option>
          <option>Lubricant</option>
          <option>Tools</option>
        </FSelect>
      </FRow>
      <FRow label="SKU">
        <FInput placeholder="REF-R32" />
      </FRow>
      <FRow label="Unit">
        <FSelect>
          <option>Cylinder</option>
          <option>Piece</option>
          <option>Meter</option>
          <option>Litre</option>
          <option>Set</option>
        </FSelect>
      </FRow>
      <FRow label="Quantity">
        <FInput type="number" placeholder="10" />
      </FRow>
      <FRow label="Reorder Level">
        <FInput type="number" placeholder="5" />
      </FRow>
      <FRow label="Unit Cost (₹)">
        <FInput type="number" placeholder="2800" />
      </FRow>
      <FRow label="Supplier">
        <FSelect>
          <option>RefriTech</option>
          <option>FilterPro</option>
          <option>ElecWorld</option>
          <option>CopperCo</option>
          <option>OilMax</option>
        </FSelect>
      </FRow>
    </div>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>Add Item</FBtn>
    </div>
  </Modal>
);

const AddLeadSourceModal = ({ onClose, onSave }) => {
  const [value, setValue] = useState("");
  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.white,
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          width: 420,
          padding: "28px 28px 24px",
          fontFamily: FONTS.sans,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.h1 }}>
            Add Lead Source
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              color: COLORS.muted,
              cursor: "pointer",
              lineHeight: 1,
              padding: "0 2px",
            }}
          >
            ×
          </button>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.faint,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 6,
            }}
          >
            Lead Source <span style={{ color: "#DC2626" }}>*</span>
          </div>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim()) {
                onSave(value.trim());
                onClose();
              }
            }}
            placeholder="e.g. Instagram, Trade Fair…"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1.5px solid ${value ? COLORS.brand : COLORS.border}`,
              fontSize: 13,
              fontFamily: FONTS.sans,
              color: COLORS.h2,
              background: "#FAFAFA",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color .15s",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.white,
              color: COLORS.muted,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: FONTS.sans,
            }}
          >
            Close
          </button>
          <button
            onClick={() => {
              if (value.trim()) {
                onSave(value.trim());
                onClose();
              }
            }}
            disabled={!value.trim()}
            style={{
              padding: "9px 22px",
              borderRadius: 8,
              border: "none",
              background: value.trim()
                ? "linear-gradient(135deg,#ea580c,#c2410c)"
                : COLORS.border,
              color: value.trim() ? "white" : COLORS.muted,
              fontSize: 13,
              fontWeight: 700,
              cursor: value.trim() ? "pointer" : "not-allowed",
              fontFamily: FONTS.sans,
              transition: "background .15s",
            }}
          >
            ✓ Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const NewLeadModal = ({ open, onClose, onSave, sources = [], onAddSource }) => {
  const [showAddSource, setShowAddSource] = useState(false);
  const SOURCES = sources.length
    ? sources
    : [
        "Referral",
        "Google Ad",
        "Walk-in",
        "Instagram",
        "LinkedIn",
        "Cold Call",
        "Website",
        "Other",
      ];
  const [form, setForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    type: "Residential",
    units: 2,
    source: "Other",
    value: "",
    assignedTo: "",
    notes: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleAddSource = (newSource) => {
    onAddSource?.(newSource);
    setForm((f) => ({ ...f, source: newSource }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      alert("Company / Name is required");
      return;
    }
    onSave({
      name: form.name.trim(),
      contact: form.contact,
      phone: form.phone,
      email: form.email,
      type: form.type,
      units: Number(form.units) || 1,
      source: form.source,
      value: Number(form.value) || 0,
      assignedTo: form.assignedTo,
      notes: form.notes,
      stage: "new",
      score: 0,
      temp: "cold",
    });
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="🎯 Add New Lead">
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <FRow label="Company / Name *">
            <FInput
              placeholder="ABC Apartments"
              value={form.name}
              onChange={set("name")}
            />
          </FRow>
          <FRow label="Contact Person">
            <FInput
              placeholder="Mr. Sharma"
              value={form.contact}
              onChange={set("contact")}
            />
          </FRow>
          <FRow label="Phone">
            <FInput
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={form.phone}
              onChange={set("phone")}
            />
          </FRow>
          <FRow label="Email">
            <FInput
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={set("email")}
            />
          </FRow>
          <FRow label="Type">
            <FSelect value={form.type} onChange={set("type")}>
              {["Residential", "Commercial", "Industrial"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </FSelect>
          </FRow>
          <FRow label="AC Units">
            <FInput
              type="number"
              placeholder="2"
              value={form.units}
              onChange={set("units")}
            />
          </FRow>
          <FRow label="Source">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={form.source}
                onChange={set("source")}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 13,
                  fontFamily: FONTS.sans,
                  color: COLORS.h2,
                  background: COLORS.white,
                  outline: "none",
                }}
              >
                {SOURCES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={() => setShowAddSource(true)}
                title="Add new source"
                style={{
                  flexShrink: 0,
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: `1.5px dashed ${COLORS.brand}`,
                  background: `${COLORS.brand}0D`,
                  color: COLORS.brand,
                  fontSize: 20,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                +
              </button>
            </div>
          </FRow>
          <FRow label="Potential Value (₹)">
            <FInput
              type="number"
              placeholder="40000"
              value={form.value}
              onChange={set("value")}
            />
          </FRow>
          <FRow label="Assigned To">
            <FInput
              placeholder="Rajesh P."
              value={form.assignedTo}
              onChange={set("assignedTo")}
            />
          </FRow>
        </div>
        <FRow label="Notes">
          <FTextarea
            placeholder="Initial enquiry details…"
            rows={2}
            value={form.notes}
            onChange={set("notes")}
          />
        </FRow>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 8,
          }}
        >
          <FBtn secondary onClick={onClose}>
            Cancel
          </FBtn>
          <FBtn onClick={handleSave}>Create Lead</FBtn>
        </div>
      </Modal>
      {showAddSource && (
        <AddLeadSourceModal
          onClose={() => setShowAddSource(false)}
          onSave={handleAddSource}
        />
      )}
    </>
  );
};

// const NewPOModal = ({ open, onClose, onSave }) => (
//   <Modal open={open} onClose={onClose} title="🛒 New Purchase Order">
//     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
//       <FRow label="Supplier"><FSelect><option>RefriTech Pvt Ltd</option><option>FilterPro Industries</option><option>ElecWorld Distributors</option><option>CopperCo Metals</option><option>OilMax Lubricants</option></FSelect></FRow>
//       <FRow label="Expected Delivery"><FInput type="date" defaultValue="2026-03-08" /></FRow>
//     </div>
//     <FRow label="Items (one per line)"><FTextarea placeholder="R-32 Refrigerant × 10 @ ₹2800&#10;R-410A Refrigerant × 5 @ ₹3200" rows={4} /></FRow>
//     <FRow label="Notes"><FTextarea placeholder="Any special instructions…" rows={2} /></FRow>
//     <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
//       <FBtn secondary onClick={onClose}>Cancel</FBtn>
//       <FBtn onClick={() => onSave({})}>Create PO</FBtn>
//     </div>
//   </Modal>
// );

// ─── NewPOModal ───────────────────────────────────────────────────────────────
const NewPOModal = ({ open, onClose, onSave }) => {
  const [items, setItems] = useState([
    { id: 1, name: "", category: "Refrigerant", qty: "", price: "" },
  ]);
  const [gst, setGst] = useState(18);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: Date.now(), name: "", category: "Refrigerant", qty: "", price: "" },
    ]);

  const removeItem = (id) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const updateItem = (id, field, value) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );

  const subtotal = items.reduce(
    (sum, i) => sum + (parseFloat(i.qty) || 0) * (parseFloat(i.price) || 0),
    0,
  );
  const gstAmt = (subtotal * gst) / 100;
  const total = subtotal + gstAmt;

  const fmt = (n) =>
    "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const ITEM_CATEGORIES = [
    "Refrigerant",
    "Compressor",
    "PCB / Electrical",
    "Filter / Mesh",
    "Capacitor",
    "Copper Pipe",
    "Drain Pipe",
    "Gas Valve",
    "Fan Motor",
    "Remote / Sensor",
    "Lubricant",
    "Tool",
    "Other",
  ];

  const rowStyle = {
    display: "grid",
    gridTemplateColumns: "2fr 1.3fr 70px 100px 28px",
    gap: 6,
    alignItems: "center",
    padding: "8px 10px",
    background: COLORS.bg,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
  };

  const colHdrStyle = {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.faint,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  const miniInput = {
    width: "100%",
    padding: "7px 9px",
    borderRadius: 7,
    border: `1px solid ${COLORS.border}`,
    fontSize: 12,
    fontFamily: FONTS.sans,
    color: COLORS.h2,
    background: COLORS.white,
    outline: "none",
    boxSizing: "border-box",
  };

  const miniSelect = { ...miniInput, cursor: "pointer" };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🛒 New Purchase Order"
      width={680}
    >
      {/* ── SUPPLIER & META ─────────────────────────────────────────────── */}
      <SectionHead title="Supplier & Order Info" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Supplier *">
          <FSelect>
            <option value="">Select supplier…</option>
            <option>RefriTech Pvt Ltd</option>
            <option>FilterPro Industries</option>
            <option>ElecWorld Distributors</option>
            <option>CopperCo Metals</option>
            <option>OilMax Lubricants</option>
            <option>Daikin India</option>
            <option>Voltas Spares</option>
            <option>Samsung HVAC Parts</option>
          </FSelect>
        </FRow>
        <FRow label="PO Type *">
          <FSelect>
            <option>Refrigerant Restock</option>
            <option>Spare Parts</option>
            <option>Tools & Equipment</option>
            <option>Consumables</option>
            <option>Compressor Unit</option>
            <option>PCB / Electrical</option>
            <option>Piping & Fittings</option>
            <option>Miscellaneous</option>
          </FSelect>
        </FRow>
        <FRow label="Expected Delivery">
          <FInput type="date" defaultValue="2026-04-26" />
        </FRow>
        <FRow label="Urgency">
          <FSelect>
            <option>Normal</option>
            <option>High – Next Day</option>
            <option>Urgent – Same Day</option>
            <option>Low – Flexible</option>
          </FSelect>
        </FRow>
        <FRow label="Linked Job / Work Order">
          <FInput placeholder="e.g. JOB-1042 (leave blank if stock order)" />
        </FRow>
        <FRow label="Requested By">
          <FSelect>
            <option>Admin / Store</option>
            {technicians.map((t) => (
              <option key={t.id}>{t.name}</option>
            ))}
          </FSelect>
        </FRow>
      </div>

      {/* ── LINE ITEMS ──────────────────────────────────────────────────── */}
      <SectionHead title="Line Items" />

      {/* Column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.3fr 70px 100px 28px",
          gap: 6,
          padding: "0 10px",
          marginBottom: 6,
        }}
      >
        <span style={colHdrStyle}>Item / Description</span>
        <span style={colHdrStyle}>Category</span>
        <span style={colHdrStyle}>Qty</span>
        <span style={colHdrStyle}>Unit Price (₹)</span>
        <span />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 7,
          marginBottom: 10,
        }}
      >
        {items.map((item) => (
          <div key={item.id} style={rowStyle}>
            <input
              style={miniInput}
              placeholder="Item name / description"
              value={item.name}
              onChange={(e) => updateItem(item.id, "name", e.target.value)}
            />
            <select
              style={miniSelect}
              value={item.category}
              onChange={(e) => updateItem(item.id, "category", e.target.value)}
            >
              {ITEM_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              style={miniInput}
              type="number"
              placeholder="0"
              value={item.qty}
              onChange={(e) => updateItem(item.id, "qty", e.target.value)}
            />
            <input
              style={miniInput}
              type="number"
              placeholder="0"
              value={item.price}
              onChange={(e) => updateItem(item.id, "price", e.target.value)}
            />
            <button
              onClick={() => removeItem(item.id)}
              style={{
                background: "none",
                border: "none",
                color: "#EF4444",
                fontSize: 18,
                cursor: "pointer",
                padding: 0,
                lineHeight: 1,
                opacity: items.length === 1 ? 0.3 : 1,
              }}
              disabled={items.length === 1}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addItem}
        style={{
          width: "100%",
          padding: "8px 0",
          borderRadius: 8,
          border: `1.5px dashed ${COLORS.brand}`,
          background: `${COLORS.brand}08`,
          color: COLORS.brand,
          fontSize: 12,
          fontWeight: 700,
          fontFamily: FONTS.sans,
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        + Add Item
      </button>

      {/* ── TOTALS ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {/* Subtotal */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: COLORS.faint,
              letterSpacing: "0.05em",
              marginBottom: 4,
            }}
          >
            SUBTOTAL
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: COLORS.h1,
              fontFamily: FONTS.mono,
            }}
          >
            {fmt(subtotal)}
          </div>
        </div>
        {/* GST */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: COLORS.faint,
                letterSpacing: "0.05em",
              }}
            >
              GST
            </span>
            <select
              value={gst}
              onChange={(e) => setGst(Number(e.target.value))}
              style={{
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 5,
                border: `1px solid ${COLORS.border}`,
                fontFamily: FONTS.sans,
                color: COLORS.h2,
                background: COLORS.white,
                outline: "none",
              }}
            >
              {[0, 5, 12, 18, 28].map((r) => (
                <option key={r} value={r}>
                  {r}%
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: COLORS.h1,
              fontFamily: FONTS.mono,
            }}
          >
            {fmt(gstAmt)}
          </div>
        </div>
        {/* Total */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: `${COLORS.brand}10`,
            border: `1.5px solid ${COLORS.brand}30`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: COLORS.brand,
              letterSpacing: "0.05em",
              marginBottom: 4,
            }}
          >
            TOTAL
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: COLORS.brand,
              fontFamily: FONTS.mono,
            }}
          >
            {fmt(total)}
          </div>
        </div>
      </div>

      {/* ── PAYMENT & DELIVERY ──────────────────────────────────────────── */}
      <SectionHead title="Payment & Delivery" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Payment Terms">
          <FSelect>
            <option>Immediate / Cash</option>
            <option>50% Advance + 50% on Delivery</option>
            <option>Net 7</option>
            <option>Net 15</option>
            <option>Net 30</option>
            <option>Credit Account</option>
          </FSelect>
        </FRow>
        <FRow label="Delivery Location">
          <FSelect>
            <option>Main Warehouse</option>
            <option>Field – Tech Pickup</option>
            <option>Customer Site Direct</option>
            <option>Branch Office</option>
          </FSelect>
        </FRow>
      </div>

      {/* ── NOTES & ATTACHMENT ──────────────────────────────────────────── */}
      <SectionHead title="Notes & Attachment" />
      <FRow label="Notes / Special Instructions">
        <FTextarea
          placeholder="Packing preferences, brand specifications, delivery instructions, any substitution rules…"
          rows={2}
        />
      </FRow>
      <FRow label="Attach Proforma / Supplier Quote">
        <div
          style={{
            border: `2px dashed ${COLORS.border}`,
            borderRadius: 8,
            padding: "12px 14px",
            textAlign: "center",
            cursor: "pointer",
            background: "#FAFAFA",
          }}
          onClick={() => document.getElementById("po-attach")?.click()}
        >
          <input
            id="po-attach"
            type="file"
            accept="image/*,application/pdf"
            style={{ display: "none" }}
          />
          <div style={{ fontSize: 18, marginBottom: 4 }}>📎</div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>
            Click to attach proforma invoice or supplier quote · PDF, JPG · Max
            5 MB
          </div>
        </div>
      </FRow>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 12,
        }}
      >
        <FBtn secondary onClick={onClose}>
          Cancel
        </FBtn>
        <FBtn onClick={() => onSave({})}>Create PO</FBtn>
      </div>
    </Modal>
  );
};

const NewSupplierModal = ({ open, onClose, onSave }) => (
  <Modal open={open} onClose={onClose} title="🏭 Add New Supplier">
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <FRow label="Company Name">
        <FInput placeholder="ABC Traders" />
      </FRow>
      <FRow label="Category">
        <FSelect>
          <option>Refrigerant</option>
          <option>Filter</option>
          <option>Electrical</option>
          <option>Piping</option>
          <option>Lubricant</option>
          <option>Tools</option>
        </FSelect>
      </FRow>
      <FRow label="Contact Person">
        <FInput placeholder="Mr. Patel" />
      </FRow>
      <FRow label="Phone">
        <FInput type="tel" placeholder="+91 XXXXX XXXXX" />
      </FRow>
      <FRow label="Email">
        <FInput type="email" placeholder="sales@supplier.com" />
      </FRow>
      <FRow label="Payment Terms">
        <FSelect>
          <option>Immediate</option>
          <option>15 days</option>
          <option>30 days</option>
          <option>45 days</option>
        </FSelect>
      </FRow>
    </div>
    <FRow label="Address">
      <FTextarea placeholder="Full address…" rows={2} />
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>Add Supplier</FBtn>
    </div>
  </Modal>
);

const NewAssetModal = ({ open, onClose, onSave }) => (
  <Modal open={open} onClose={onClose} title="🚗 Add Asset / Vehicle">
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <FRow label="Asset Name">
        <FInput placeholder="Honda Activa – 3" />
      </FRow>
      <FRow label="Type">
        <FSelect>
          <option>Vehicle</option>
          <option>Equipment</option>
        </FSelect>
      </FRow>
      <FRow label="Sub-Type">
        <FSelect>
          <option>Service Van</option>
          <option>Bike</option>
          <option>Parts Delivery</option>
          <option>Vacuum Pump</option>
          <option>Testing Tool</option>
        </FSelect>
      </FRow>
      <FRow label="Reg / Serial No.">
        <FInput placeholder="KA01XY1234" />
      </FRow>
      <FRow label="Year">
        <FInput type="number" placeholder="2026" />
      </FRow>
      <FRow label="Value (₹)">
        <FInput type="number" placeholder="95000" />
      </FRow>
      <FRow label="Assigned To">
        <FSelect>
          <option>Office</option>
          {technicians.map((t) => (
            <option key={t.id}>{t.name}</option>
          ))}
        </FSelect>
      </FRow>
      <FRow label="Insurance Expiry">
        <FInput type="date" />
      </FRow>
    </div>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>Add Asset</FBtn>
    </div>
  </Modal>
);

// const RegisterWarrantyModal = ({ open, onClose, onSave }) => (
//   <Modal open={open} onClose={onClose} title="🛡️ Register Warranty">
//     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
//       <FRow label="Customer"><FSelect><option>Sharma Residency</option><option>Meera Iyer</option><option>TechPark Ltd.</option><option>City Mall</option><option>Patel Villa</option></FSelect></FRow>
//       <FRow label="AC Unit Description"><FInput placeholder="Samsung 1.5T Split – Bedroom" /></FRow>
//       <FRow label="Brand"><FInput placeholder="Samsung" /></FRow>
//       <FRow label="Model No."><FInput placeholder="AR18AY3YAWK" /></FRow>
//       <FRow label="Serial No."><FInput placeholder="SAM2026BLR099" /></FRow>
//       <FRow label="Warranty Type"><FSelect><option>Comprehensive</option><option>Compressor</option><option>Parts Only</option><option>Parts & Labour</option></FSelect></FRow>
//       <FRow label="Install Date"><FInput type="date" /></FRow>
//       <FRow label="Warranty End"><FInput type="date" /></FRow>
//       <FRow label="Technician"><FSelect>{technicians.map(t => <option key={t.id}>{t.name}</option>)}</FSelect></FRow>
//     </div>
//     <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
//       <FBtn secondary onClick={onClose}>Cancel</FBtn>
//       <FBtn onClick={() => onSave({})}>Register Warranty</FBtn>
//     </div>
//   </Modal>
// );

const RegisterWarrantyModal = ({ open, onClose, onSave }) => (
  <Modal open={open} onClose={onClose} title="🛡️ Register Warranty" width={680}>
    <SectionHead title="Customer & Unit" />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <FRow label="Customer">
        <FSelect>
          <option>Sharma Residency</option>
          <option>Meera Iyer</option>
          <option>TechPark Ltd.</option>
          <option>City Mall</option>
          <option>Patel Villa</option>
        </FSelect>
      </FRow>
      <FRow label="AC Unit Description">
        <FInput placeholder="Samsung 1.5T Split – Bedroom" />
      </FRow>
      <FRow label="Brand">
        <FInput placeholder="Samsung" />
      </FRow>
      <FRow label="Model No.">
        <FInput placeholder="AR18AY3YAWK" />
      </FRow>
      <FRow label="Serial No.">
        <FInput placeholder="SAM2026BLR099" />
      </FRow>
      <FRow label="AC Type">
        <FSelect>
          <option>Split AC</option>
          <option>Window AC</option>
          <option>Cassette AC</option>
          <option>Tower / Floor Standing</option>
          <option>Ducted / Central</option>
          <option>VRF / VRV</option>
          <option>Portable</option>
        </FSelect>
      </FRow>
      <FRow label="Capacity (Tons)">
        <FSelect>
          <option>0.75 T</option>
          <option>1.0 T</option>
          <option>1.5 T</option>
          <option>2.0 T</option>
          <option>2.5 T</option>
          <option>3.0 T +</option>
        </FSelect>
      </FRow>
      <FRow label="Technician (Installed By)">
        <FSelect>
          {technicians.map((t) => (
            <option key={t.id}>{t.name}</option>
          ))}
        </FSelect>
      </FRow>
    </div>

    <SectionHead title="Purchase & Installation" />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <FRow label="Purchase Date">
        <FInput type="date" />
      </FRow>
      <FRow label="Invoice / Bill No.">
        <FInput placeholder="e.g. INV-2024-00892" />
      </FRow>
      <FRow label="Install Date">
        <FInput type="date" />
      </FRow>
      <FRow label="Purchase Source">
        <FSelect>
          <option>Dealer / Retailer</option>
          <option>Online (Amazon / Flipkart)</option>
          <option>Brand Showroom</option>
          <option>Installed by Us</option>
          <option>Other</option>
        </FSelect>
      </FRow>
    </div>

    <SectionHead title="Warranty Coverage" />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <FRow label="Warranty Type">
        <FSelect>
          <option>Comprehensive</option>
          <option>Compressor Only</option>
          <option>Parts Only</option>
          <option>Parts & Labour</option>
          <option>Extended</option>
        </FSelect>
      </FRow>
      <FRow label="Warranty Status">
        <FSelect>
          <option>Active</option>
          <option>Expired</option>
          <option>Void</option>
          <option>Claimed</option>
          <option>Pending Registration</option>
        </FSelect>
      </FRow>
      <FRow label="Warranty Start Date">
        <FInput type="date" />
      </FRow>
      <FRow label="Warranty End Date">
        <FInput type="date" />
      </FRow>
      <FRow label="Compressor Warranty End">
        <FInput type="date" />
      </FRow>
      <FRow label="Parts Warranty Period">
        <FSelect>
          <option>1 Year</option>
          <option>2 Years</option>
          <option>3 Years</option>
          <option>5 Years</option>
          <option>As per OEM</option>
        </FSelect>
      </FRow>
      <FRow label="Labour Covered?">
        <FSelect>
          <option>Yes – Labour Included</option>
          <option>No – Parts Only</option>
        </FSelect>
      </FRow>
      <FRow label="AMC Required to Keep Warranty Valid?">
        <FSelect>
          <option>No</option>
          <option>Yes – AMC Mandatory</option>
        </FSelect>
      </FRow>
      <FRow label="Linked AMC Ref">
        <FInput placeholder="e.g. AMC-221 (if applicable)" />
      </FRow>
      <FRow label="Alert Before Expiry">
        <FSelect>
          <option>30 Days Before</option>
          <option>60 Days Before</option>
          <option>90 Days Before</option>
          <option>No Alert</option>
        </FSelect>
      </FRow>
    </div>

    <SectionHead title="Claim History" />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <FRow label="No. of Claims Used">
        <FInput type="number" placeholder="0" defaultValue="0" />
      </FRow>
      <FRow label="Last Claim Date">
        <FInput type="date" />
      </FRow>
    </div>
    <FRow label="Claim Notes / Remarks">
      <textarea
        placeholder="e.g. Compressor replaced on 12-Jan-2025 under warranty claim #WC-009…"
        rows={2}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
          fontSize: 13,
          fontFamily: FONTS.sans,
          color: COLORS.h2,
          background: COLORS.white,
          resize: "vertical",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </FRow>

    <SectionHead title="Documents" />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <FileUploadField
        label="Warranty Card"
        icon="🛡️"
        hint="JPG, PNG or PDF · Max 5 MB"
      />
      <FileUploadField
        label="Purchase Invoice"
        icon="🧾"
        hint="JPG, PNG or PDF · Max 5 MB"
      />
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 16,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>Register Warranty</FBtn>
    </div>
  </Modal>
);

const NewNoticeModal = ({ open, onClose, onSave, editId }) => {
  const EMPTY = { title: '', category: 'Operations', priority: 'Normal', target: 'all', isPinned: false, content: '', postedBy: 'Admin' };
  const [form,   setForm]   = React.useState(EMPTY);
  const [saving, setSaving] = React.useState(false);

  // ── Load existing notice when editing ──────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    if (editId) {
      noticesApi.get(editId)          // fetch by ID — add this to your api service if missing
        .then(doc => setForm({
          title:    doc.title    || '',
          category: doc.category || 'Operations',
          priority: doc.priority === 'high' || doc.priority === 'urgent' ? 'High' : 'Normal',
          target:   doc.target   || 'all',
          isPinned: doc.isPinned || false,
          content:  doc.content  || '',
          postedBy: doc.postedBy || 'Admin',
        }))
        .catch(() => {});
    } else {
      setForm(EMPTY);   // fresh form for new notice
    }
  }, [open, editId]);

  const handleClose = () => { setForm(EMPTY); onClose(); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title:    form.title.trim(),
        content:  form.content.trim(),
        category: form.category,
        priority: form.priority === 'High' ? 'high' : 'medium',
        target:   form.target,
        isPinned: form.isPinned,
        postedBy: form.postedBy,
      };
      await onSave(payload, editId);   // pass editId so parent knows create vs update
      setForm(EMPTY);
    } finally { setSaving(false); }
  };

  const isEditing = !!editId;

  return (
    <Modal open={open} onClose={handleClose}
      title={isEditing ? '✏️ Edit Notice' : '📢 Post New Notice'}   // ← dynamic title
    >
      <FRow label="Title">
        <FInput placeholder="Notice title…" value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
      </FRow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FRow label="Type">
          <FSelect value={form.category}
            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
            <option>Operations</option><option>Policy</option><option>Holiday</option>
            <option>Training</option><option>Achievement</option><option>General</option>
            <option>HR</option><option>Finance</option><option>Safety</option><option>Urgent</option>
          </FSelect>
        </FRow>
        <FRow label="Priority">
          <FSelect value={form.priority}
            onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
            <option>Normal</option><option>High</option>
          </FSelect>
        </FRow>
        <FRow label="Target">
          <FSelect value={form.target}
            onChange={e => setForm(p => ({ ...p, target: e.target.value }))}>
            <option value="all">All Staff</option>
            <option value="technicians">Technicians Only</option>
            <option value="admin">Admin Only</option>
          </FSelect>
        </FRow>
        <FRow label="Pin to top">
          <FSelect value={form.isPinned ? 'Yes – Pin' : 'No'}
            onChange={e => setForm(p => ({ ...p, isPinned: e.target.value === 'Yes – Pin' }))}>
            <option>No</option><option>Yes – Pin</option>
          </FSelect>
        </FRow>
      </div>
      <FRow label="Content">
        <FTextarea placeholder="Notice content…" rows={4} value={form.content}
          onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
      </FRow>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <FBtn secondary onClick={handleClose}>Cancel</FBtn>
        <FBtn onClick={handleSave}>
          {saving ? (isEditing ? 'Saving…' : 'Posting…') : (isEditing ? 'Save Changes' : 'Post Notice')}
        </FBtn>
      </div>
    </Modal>
  );
};

const MarkAttendanceModal = ({ open, onClose, onSave }) => (
  <Modal
    open={open}
    onClose={onClose}
    title="📅 Mark Today's Attendance"
    width={600}
  >
    <div
      style={{
        marginBottom: 14,
        padding: "10px 14px",
        borderRadius: 8,
        background: "#FFFBEB",
        border: "1px solid #FDE68A",
        fontSize: 12,
        color: "#92400E",
        fontWeight: 600,
      }}
    >
      Marking attendance for: <strong>March 3, 2026</strong>
    </div>
    {technicians.map((t) => (
      <div
        key={t.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "11px 0",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <Avatar
          name={t.name}
          size={32}
          color={t.status === "available" ? "#10B981" : COLORS.brand}
        />
        <div
          style={{ flex: 1, fontSize: 13, fontWeight: 600, color: COLORS.h2 }}
        >
          {t.name}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            ["P", "Present", "#F0FDF4", "#16A34A"],
            ["A", "Absent", "#FEF2F2", "#DC2626"],
            ["HD", "Half Day", "#FFFBEB", "#B45309"],
            ["L", "Leave", "#EFF6FF", "#0369A1"],
          ].map(([v, label, bg, color]) => (
            <label key={v} style={{ cursor: "pointer" }}>
              <input
                type="radio"
                name={`att-${t.id}`}
                value={v}
                defaultChecked={v === "P"}
                style={{ display: "none" }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "4px 9px",
                  borderRadius: 5,
                  background: bg,
                  color,
                  border: `1px solid ${color}30`,
                  cursor: "pointer",
                  display: "block",
                }}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    ))}
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 16,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>Save Attendance</FBtn>
    </div>
  </Modal>
);

const AdvanceModal = ({ open, onClose, onSave, techName = "" }) => (
  <Modal open={open} onClose={onClose} title="⬆ Give Advance" width={420}>
    <FRow label="Technician">
      <FInput defaultValue={techName} placeholder="Technician name" />
    </FRow>
    <FRow label="Amount (₹)">
      <FInput type="number" placeholder="5000" />
    </FRow>
    <FRow label="Recovery Month">
      <FSelect>
        <option>March 2026</option>
        <option>April 2026</option>
        <option>May 2026</option>
      </FSelect>
    </FRow>
    <FRow label="Reason">
      <FTextarea placeholder="Reason for advance…" rows={2} />
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>Approve Advance</FBtn>
    </div>
  </Modal>
);

const SendQuotationModal = ({ open, onClose, onSave, quotId = "" }) => (
  <Modal
    open={open}
    onClose={onClose}
    title="📧 Send Quotation to Customer"
    width={460}
  >
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 8,
        background: "#F0F9FF",
        border: "1px solid #BAE6FD",
        marginBottom: 14,
      }}
    >
      <div style={{ fontSize: 12, color: "#0369A1", fontWeight: 600 }}>
        {quotId} – Ready to send
      </div>
    </div>
    <FRow label="Send Via">
      <FSelect>
        <option>Email</option>
        <option>WhatsApp</option>
        <option>Both</option>
      </FSelect>
    </FRow>
    <FRow label="To Email">
      <FInput type="email" placeholder="customer@email.com" />
    </FRow>
    <FRow label="Message">
      <FTextarea
        defaultValue="Dear Customer, please find attached the quotation for your AC service. We look forward to working with you. Regards, CoolTech AC Services."
        rows={3}
      />
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>📤 Send Now</FBtn>
    </div>
  </Modal>
);

const ConvertToJobModal = ({ open, onClose, onSave, quotId = "" }) => (
  <Modal
    open={open}
    onClose={onClose}
    title="✓ Convert Quotation to Job"
    width={460}
  >
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 8,
        background: "#F0FDF4",
        border: "1px solid #BBF7D0",
        marginBottom: 14,
      }}
    >
      <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>
        {quotId} – Approved quotation
      </div>
    </div>
    <FRow label="Scheduled Date">
      <FInput type="date" defaultValue="2026-03-06" />
    </FRow>
    <FRow label="Scheduled Time">
      <FInput type="time" defaultValue="10:00" />
    </FRow>
    <FRow label="Assign Technician">
      <FSelect>
        <option>Unassigned</option>
        {technicians.map((t) => (
          <option key={t.id}>{t.name}</option>
        ))}
      </FSelect>
    </FRow>
    <FRow label="Job Type">
      <FSelect>
        <option>Installation</option>
        <option>Service</option>
        <option>Repair</option>
        <option>AMC Visit</option>
      </FSelect>
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn color="#16A34A" onClick={() => onSave({})}>
        Create Job Order
      </FBtn>
    </div>
  </Modal>
);

const ReportModal = ({ open, onClose, title, format }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={`📊 Generate: ${title}`}
    width={460}
  >
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <FRow label="From Date">
        <FInput type="date" defaultValue="2026-01-01" />
      </FRow>
      <FRow label="To Date">
        <FInput type="date" defaultValue="2026-03-03" />
      </FRow>
      <FRow label="Group By">
        <FSelect>
          <option>Monthly</option>
          <option>Weekly</option>
          <option>Daily</option>
        </FSelect>
      </FRow>
      <FRow label="Format">
        <FInput defaultValue={format} style={{ background: COLORS.white }} />
      </FRow>
    </div>
    <FRow label="Filter (optional)">
      <FSelect>
        <option>All Technicians</option>
        {technicians.map((t) => (
          <option key={t.id}>{t.name}</option>
        ))}
      </FSelect>
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={onClose}>⬇ Download {format}</FBtn>
    </div>
  </Modal>
);

const AddAdminUserModal = ({ open, onClose, onSave }) => (
  <Modal open={open} onClose={onClose} title="👤 Add Admin User" width={440}>
    <FRow label="Full Name">
      <FInput placeholder="Name" />
    </FRow>
    <FRow label="Email">
      <FInput type="email" placeholder="user@cooltech.com" />
    </FRow>
    <FRow label="Role">
      <FSelect>
        <option>Manager</option>
        <option>Accountant</option>
        <option>Dispatcher</option>
        <option>Super Admin</option>
      </FSelect>
    </FRow>
    <FRow label="Temporary Password">
      <FInput type="password" placeholder="Set initial password" />
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>Add User</FBtn>
    </div>
  </Modal>
);

const UseInventoryModal = ({ open, onClose, onSave, itemName = "" }) => (
  <Modal
    open={open}
    onClose={onClose}
    title="📦 Log Inventory Usage"
    width={440}
  >
    <FRow label="Item">
      <FInput defaultValue={itemName} />
    </FRow>
    <FRow label="Quantity Used">
      <FInput type="number" placeholder="1" defaultValue="1" />
    </FRow>
    <FRow label="Job Reference">
      <FSelect>
        <option>JOB-1042</option>
        <option>JOB-1041</option>
        <option>JOB-1040</option>
        <option>JOB-1039</option>
      </FSelect>
    </FRow>
    <FRow label="Technician">
      <FSelect>
        {technicians.map((t) => (
          <option key={t.id}>{t.name}</option>
        ))}
      </FSelect>
    </FRow>
    <FRow label="Notes">
      <FInput placeholder="Optional notes" />
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>Log Usage</FBtn>
    </div>
  </Modal>
);

const LogFuelModal = ({ open, onClose, onSave, assetName = "" }) => (
  <Modal open={open} onClose={onClose} title="⛽ Log Fuel Entry" width={440}>
    <FRow label="Vehicle">
      <FInput defaultValue={assetName} />
    </FRow>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <FRow label="Date">
        <FInput type="date" defaultValue="2026-03-03" />
      </FRow>
      <FRow label="Litres">
        <FInput type="number" placeholder="20" />
      </FRow>
      <FRow label="Rate (₹/L)">
        <FInput type="number" placeholder="95" />
      </FRow>
      <FRow label="Current KM">
        <FInput type="number" placeholder="42850" />
      </FRow>
    </div>
    <FRow label="Fuel Station">
      <FInput placeholder="HP / BPCL / IOC – Location" />
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>Log Entry</FBtn>
    </div>
  </Modal>
);

const ScheduleAMCModal = ({ open, onClose, onSave, contractId = "" }) => (
  <Modal
    open={open}
    onClose={onClose}
    title="📅 Schedule AMC Visit"
    width={440}
  >
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        background: "#F0FDF4",
        border: "1px solid #BBF7D0",
        marginBottom: 14,
        fontSize: 12,
        color: "#16A34A",
        fontWeight: 600,
      }}
    >
      {contractId}
    </div>
    <FRow label="Visit Date">
      <FInput type="date" defaultValue="2026-04-05" />
    </FRow>
    <FRow label="Visit Time">
      <FInput type="time" defaultValue="10:00" />
    </FRow>
    <FRow label="Assign Technician">
      <FSelect>
        {technicians.map((t) => (
          <option key={t.id}>{t.name}</option>
        ))}
      </FSelect>
    </FRow>
    <FRow label="Notes">
      <FTextarea placeholder="Visit notes or special instructions…" rows={2} />
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>Schedule Visit</FBtn>
    </div>
  </Modal>
);

const RequestReviewModal = ({ open, onClose, onSave }) => (
  <Modal
    open={open}
    onClose={onClose}
    title="⭐ Request Customer Review"
    width={460}
  >
    <FRow label="Customer">
      <FSelect>
        {customers.map((c) => (
          <option key={c.id}>{c.name}</option>
        ))}
      </FSelect>
    </FRow>
    <FRow label="Job Reference">
      <FSelect>
        <option>JOB-1042</option>
        <option>JOB-1041</option>
        <option>JOB-1040</option>
      </FSelect>
    </FRow>
    <FRow label="Send Via">
      <FSelect>
        <option>SMS</option>
        <option>WhatsApp</option>
        <option>Email</option>
      </FSelect>
    </FRow>
    <FRow label="Message">
      <FTextarea
        defaultValue="Hi! Thank you for choosing CoolTech AC Services. We hope you're happy with our service. Please spare 30 seconds to leave us a review – it means a lot!"
        rows={3}
      />
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>📤 Send Request</FBtn>
    </div>
  </Modal>
);

const AssignComplaintModal = ({ open, onClose, onSave, compId = "" }) => (
  <Modal open={open} onClose={onClose} title="📋 Assign Complaint" width={440}>
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        marginBottom: 14,
        fontSize: 12,
        color: "#DC2626",
        fontWeight: 600,
      }}
    >
      {compId}
    </div>
    <FRow label="Assign To">
      <FSelect>
        {technicians.map((t) => (
          <option key={t.id}>{t.name}</option>
        ))}
      </FSelect>
    </FRow>
    <FRow label="Priority">
      <FSelect>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </FSelect>
    </FRow>
    <FRow label="Target Resolution Date">
      <FInput type="date" defaultValue="2026-03-06" />
    </FRow>
    <FRow label="Internal Notes">
      <FTextarea placeholder="Instructions for the technician…" rows={2} />
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>Assign</FBtn>
    </div>
  </Modal>
);

const ResolveComplaintModal = ({ open, onClose, onSave, compId = "" }) => (
  <Modal open={open} onClose={onClose} title="✅ Resolve Complaint" width={460}>
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        background: "#FFFBEB",
        border: "1px solid #FDE68A",
        marginBottom: 14,
        fontSize: 12,
        color: "#92400E",
        fontWeight: 600,
      }}
    >
      {compId}
    </div>
    <FRow label="Resolution Action Taken">
      <FTextarea
        placeholder="Describe what was done to resolve the complaint…"
        rows={3}
      />
    </FRow>
    <FRow label="Customer Communication">
      <FSelect>
        <option>Apology sent via WhatsApp</option>
        <option>Phone call made</option>
        <option>Email sent</option>
        <option>In-person visit done</option>
      </FSelect>
    </FRow>
    <FRow label="Compensation Given">
      <FSelect>
        <option>None</option>
        <option>Discount on next service</option>
        <option>Free re-service</option>
        <option>Refund issued</option>
      </FSelect>
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn color="#16A34A" onClick={() => onSave({})}>
        Mark Resolved
      </FBtn>
    </div>
  </Modal>
);

const SetReminderModal = ({ open, onClose, onSave }) => (
  <Modal
    open={open}
    onClose={onClose}
    title="⏰ Set Follow-up Reminder"
    width={420}
  >
    <FRow label="Date">
      <FInput type="date" defaultValue="2026-03-10" />
    </FRow>
    <FRow label="Time">
      <FInput type="time" defaultValue="11:00" />
    </FRow>
    <FRow label="Type">
      <FSelect>
        <option>📞 Call</option>
        <option>💬 WhatsApp</option>
        <option>📧 Email</option>
        <option>🏠 Site Visit</option>
      </FSelect>
    </FRow>
    <FRow label="Note">
      <FTextarea placeholder="Reminder note…" rows={2} />
    </FRow>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
      }}
    >
      <FBtn secondary onClick={onClose}>
        Cancel
      </FBtn>
      <FBtn onClick={() => onSave({})}>Set Reminder</FBtn>
    </div>
  </Modal>
);

// const CustomReportModal = ({ open, onClose, onSave }) => (
//   <Modal
//     open={open}
//     onClose={onClose}
//     title="📊 Build Custom Report"
//     width={520}
//   >
//     <FRow label="Report Name">
//       <FInput placeholder="My Custom Report" />
//     </FRow>
//     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
//       <FRow label="Module">
//         <FSelect>
//           <option>Jobs</option>
//           <option>Revenue</option>
//           <option>Technicians</option>
//           <option>Invoices</option>
//           <option>Expenses</option>
//           <option>Inventory</option>
//           <option>Complaints</option>
//         </FSelect>
//       </FRow>
//       <FRow label="Chart Type">
//         <FSelect>
//           <option>Bar Chart</option>
//           <option>Line Chart</option>
//           <option>Pie Chart</option>
//           <option>Table</option>
//         </FSelect>
//       </FRow>
//       <FRow label="From Date">
//         <FInput type="date" defaultValue="2026-01-01" />
//       </FRow>
//       <FRow label="To Date">
//         <FInput type="date" defaultValue="2026-03-31" />
//       </FRow>
//       <FRow label="Group By">
//         <FSelect>
//           <option>Month</option>
//           <option>Week</option>
//           <option>Technician</option>
//           <option>Job Type</option>
//         </FSelect>
//       </FRow>
//       <FRow label="Export Format">
//         <FSelect>
//           <option>PDF</option>
//           <option>CSV</option>
//           <option>Excel</option>
//         </FSelect>
//       </FRow>
//     </div>
//     <div
//       style={{
//         display: "flex",
//         justifyContent: "flex-end",
//         gap: 10,
//         marginTop: 8,
//       }}
//     >
//       <FBtn secondary onClick={onClose}>
//         Cancel
//       </FBtn>
//       <FBtn onClick={() => onSave({})}>Generate Report</FBtn>
//     </div>
//   </Modal>
// );


// ─── Module config ─────────────────────────────────────────────────────────────

const MODULE_CFG = {
  Jobs:        { api: jobsApi,       dateKey: 'createdAt', valueKey: null,       labelKey: 'jobType'     },
  Revenue:     { api: invoicesApi,   dateKey: 'createdAt', valueKey: 'amount',   labelKey: 'status'      },
  Technicians: { api: techsApi,      dateKey: 'createdAt', valueKey: 'completed',labelKey: 'name'        },
  Invoices:    { api: invoicesApi,   dateKey: 'createdAt', valueKey: 'amount',   labelKey: 'status'      },
  Expenses:    { api: expensesApi,   dateKey: 'date',      valueKey: 'amount',   labelKey: 'category'    },
  Inventory:   { api: inventoryApi,  dateKey: 'createdAt', valueKey: 'quantity', labelKey: 'name'        },
  Complaints:  { api: complaintsApi, dateKey: 'createdAt', valueKey: null,       labelKey: 'category'    },
};

const GROUP_FNS = {
  Month:      i => new Date(i._date).toLocaleString('default', { month: 'short', year: '2-digit' }),
  Week:       i => { const d = new Date(i._date); return `W${Math.ceil(d.getDate()/7)} ${d.toLocaleString('default',{month:'short'})}`; },
  Technician: i => i.technician?.name || i.assignedTo?.name || i.technicianName || 'Unknown',
  'Job Type': i => i.jobType || i.type || i.category || 'Other',
};

const BAR_COLORS = ['#F97316','#3B82F6','#10B981','#8B5CF6','#EC4899','#F59E0B','#06B6D4','#EF4444'];

// ─── Download helpers ──────────────────────────────────────────────────────────
const downloadBlob = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};
const toCSV = (headers, rows) => {
  const esc = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
  return [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
};

// ─── SVG Chart ────────────────────────────────────────────────────────────────
const SVGChart = ({ data, type }) => {
  if (!data?.length) return null;

  // ── Single data point warning ──────────────────────────────────────────────
  if (data.length === 1 && type !== 'Table') {
    const val = data[0].value;
    if (type === 'Pie Chart') {
      // Full circle for single item
      return (
        <svg viewBox="0 0 468 190" style={{ width: '100%' }}>
          <circle cx={95} cy={95} r={78} fill={BAR_COLORS[0]} opacity={0.88} />
          <text x={95} y={99} fontSize={13} fill="#fff" textAnchor="middle" fontWeight={700}>100%</text>
          <g transform="translate(210,80)">
            <rect width={12} height={12} rx={2} fill={BAR_COLORS[0]} />
            <text x={18} y={11} fontSize={11} fill="#475569">{data[0].label} — {val.toLocaleString()}</text>
          </g>
          <text x={234} y={160} fontSize={10} fill="#94A3B8" textAnchor="middle">
            Only 1 group found — try changing "Group By" for more segments
          </text>
        </svg>
      );
    }
    if (type === 'Line Chart') {
      return (
        <svg viewBox="0 0 468 190" style={{ width: '100%' }}>
          <line x1={48} y1={12} x2={48} y2={146} stroke="#E2E8F0" strokeWidth={1} />
          <line x1={48} y1={146} x2={456} y2={146} stroke="#E2E8F0" strokeWidth={1} />
          <circle cx={234} cy={79} r={7} fill={BAR_COLORS[0]} stroke="#fff" strokeWidth={2} />
          <text x={234} y={64} fontSize={11} fill="#475569" textAnchor="middle" fontWeight={700}>
            {data[0].label}: {val.toLocaleString()}
          </text>
          <text x={234} y={168} fontSize={10} fill="#94A3B8" textAnchor="middle">
            Only 1 group — try "Week" or "Job Type" grouping for a line
          </text>
        </svg>
      );
    }
  }

  const W = 468, H = 190, P = { t: 12, r: 12, b: 44, l: 48 };
  const cW = W - P.l - P.r, cH = H - P.t - P.b;
  const max = Math.max(...data.map(d => d.value), 1);

  if (type === 'Table') return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>{['Label','Value'].map(h => (
            <th key={h} style={{ padding: '7px 12px', background: '#F1F5F9', color: '#475569', fontWeight: 700, border: '1px solid #E2E8F0', textAlign: 'left' }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i} style={{ background: i % 2 ? '#F8FAFC' : '#fff' }}>
              <td style={{ padding: '6px 12px', border: '1px solid #E2E8F0', color: '#1E293B' }}>{d.label}</td>
              <td style={{ padding: '6px 12px', border: '1px solid #E2E8F0', color: '#1E293B', fontWeight: 700 }}>{d.value.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (type === 'Pie Chart') {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let angle = -Math.PI / 2;
    const cx = 95, cy = 90, r = 75;
    const slices = data.map((d, i) => {
      const sweep = (d.value / total) * 2 * Math.PI;
      const safeSweep = Math.min(sweep, 2 * Math.PI - 0.001); // prevent degenerate arc
      const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      angle += sweep;
      const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
      return {
        path: `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${safeSweep > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`,
        color: BAR_COLORS[i % BAR_COLORS.length],
        label: d.label,
        pct: Math.round((d.value / total) * 100)
      };
    });
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.88} />)}
        {slices.slice(0, 7).map((s, i) => (
          <g key={i} transform={`translate(205,${16 + i * 22})`}>
            <rect width={11} height={11} rx={2} fill={s.color} />
            <text x={16} y={10} fontSize={10} fill="#475569">
              {s.label.length > 18 ? s.label.slice(0, 18) + '…' : s.label} ({s.pct}%)
            </text>
          </g>
        ))}
      </svg>
    );
  }

  const barW = cW / data.length;
  const pts  = data.map((d, i) => `${P.l + i * barW + barW / 2},${P.t + cH * (1 - d.value / max)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = P.t + cH * (1 - t);
        return <g key={t}>
          <line x1={P.l} y1={y} x2={W - P.r} y2={y} stroke="#E2E8F0" strokeWidth={1} />
          <text x={P.l - 5} y={y + 4} fontSize={8} fill="#94A3B8" textAnchor="end">
            {max * t >= 1000 ? `${Math.round(max * t / 1000)}k` : Math.round(max * t)}
          </text>
        </g>;
      })}

      {type === 'Line Chart' ? (
        <>
          <polyline fill="none" stroke={BAR_COLORS[0]} strokeWidth={2.5} strokeLinejoin="round" points={pts} />
          {data.map((d, i) => {
            const x = P.l + i * barW + barW / 2, y = P.t + cH * (1 - d.value / max);
            return <circle key={i} cx={x} cy={y} r={4} fill={BAR_COLORS[0]} stroke="#fff" strokeWidth={1.5} />;
          })}
        </>
      ) : (
        data.map((d, i) => {
          const bH = (d.value / max) * cH;
          return (
            <rect key={i}
              x={P.l + i * barW + barW * 0.12} y={P.t + cH - bH}
              width={barW * 0.76} height={bH} rx={3}
              fill={BAR_COLORS[i % BAR_COLORS.length]} opacity={0.85}
            />
          );
        })
      )}

      {data.map((d, i) => (
        <text key={i} x={P.l + i * barW + barW / 2} y={H - P.b + 14}
          fontSize={8.5} fill="#94A3B8" textAnchor="middle">
          {d.label.length > 7 ? d.label.slice(0, 7) + '…' : d.label}
        </text>
      ))}
    </svg>
  );
};

// ─── Modal ─────────────────────────────────────────────────────────────────────
const CustomReportModal = ({ open, onClose, onSave }) => {
  const today  = new Date().toISOString().slice(0, 10);
  const threeM = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);

  const [name,      setName]      = useState('My Custom Report');
  const [module,    setModule]    = useState('Jobs');
  const [chartType, setChartType] = useState('Bar Chart');
  const [from,      setFrom]      = useState(threeM);
  const [to,        setTo]        = useState(today);
  const [groupBy,   setGroupBy]   = useState('Month');
  const [exportFmt, setExportFmt] = useState('PDF');
  const [chartData, setChartData] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const generate = async () => {
  setLoading(true); setError(''); setChartData(null);
  try {
    const cfg = MODULE_CFG[module];
    const res = await cfg.api.list({ from, to, limit: 1000 });
    
    const raw = Array.isArray(res) ? res : (res?.data ?? []);
    
    const items = raw.map(item => ({
      ...item,
      _date: item[cfg.dateKey] || item.createdAt || item.date,
    })).filter(item => {
      if (!item._date) return true;
      const d = new Date(item._date);
      return d >= new Date(from) && d <= new Date(to + 'T23:59:59');
    });
    
    if (!items.length) {
      setError('No records found for this date range.');
      setLoading(false);
      return;
    }

    const gFn = GROUP_FNS[groupBy] || GROUP_FNS.Month;
    const groups = {};
    items.forEach(item => {
      const key = gFn(item);
      if (!groups[key]) groups[key] = { label: key, value: 0, count: 0 };
      groups[key].value += cfg.valueKey ? (Number(item[cfg.valueKey]) || 0) : 1;
      groups[key].count++;
    });
      
    setChartData(Object.values(groups));
  } catch (e) {
    console.error('Generate error:', e);
    setError('Failed to fetch: ' + (e.message || 'Unknown error'));
  }
  setLoading(false);
};

  const doExport = () => {
  if (!chartData) return;
  const slug = name.replace(/\s+/g, '_');
  const ts   = new Date().toISOString().slice(0, 10);
  const rows = chartData.map(d => [d.label, d.value]);

  if (exportFmt === 'CSV') {
    downloadBlob(toCSV(['Label', 'Value'], rows), `${slug}_${ts}.csv`, 'text/csv');

  } else if (exportFmt === 'Excel') {
    downloadBlob(
      [['Label','Value'], ...rows].map(r => r.join('\t')).join('\n'),
      `${slug}_${ts}.xls`,
      'application/vnd.ms-excel'
    );

  } else {
    // ── PDF: grab the live SVG from DOM and embed it ──────────────────────
    const svgEl   = document.querySelector('.custom-report-chart svg');
    const svgHTML = svgEl ? svgEl.outerHTML : '';

    const tableHTML = `
      <table>
        <thead><tr><th>Label</th><th>Value</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1].toLocaleString()}</td></tr>`).join('')}</tbody>
      </table>`;

    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>${name}</title>
      <style>
        body  { font-family: sans-serif; padding: 32px; color: #111; }
        h2    { font-size: 18px; margin-bottom: 4px; }
        p     { font-size: 12px; color: #64748b; margin-bottom: 24px; }
        .chart-wrap { margin-bottom: 24px; border: 1px solid #e2e8f0;
                      border-radius: 8px; padding: 16px; background: #f8fafc; }
        svg   { width: 100%; max-width: 680px; display: block; }
        table { border-collapse: collapse; width: 100%; font-size: 13px; }
        th,td { border: 1px solid #ddd; padding: 8px 14px; text-align: left; }
        th    { background: #f4f4f4; font-weight: 700; }
        tr:nth-child(even) { background: #f9fafb; }
      </style></head>
      <body>
        <h2>${name}</h2>
        <p>${module} · ${from} → ${to} · Grouped by ${groupBy} · ${chartType}</p>
        ${svgHTML ? `<div class="chart-wrap">${svgHTML}</div>` : ''}
        ${tableHTML}
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }
};

  return (
    <Modal open={open} onClose={onClose} title="📊 Build Custom Report" width={520}>

      <FRow label="Report Name">
        <FInput value={name} onChange={e => setName(e.target.value)} placeholder="My Custom Report" />
      </FRow>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Module">
          <FSelect value={module} onChange={e => { setModule(e.target.value); setChartData(null); }}>
            {Object.keys(MODULE_CFG).map(m => <option key={m}>{m}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Chart Type">
          <FSelect value={chartType} onChange={e => setChartType(e.target.value)}>
            {['Bar Chart','Line Chart','Pie Chart','Table'].map(c => <option key={c}>{c}</option>)}
          </FSelect>
        </FRow>
        <FRow label="From Date">
          <FInput type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </FRow>
        <FRow label="To Date">
          <FInput type="date" value={to} onChange={e => setTo(e.target.value)} />
        </FRow>
        <FRow label="Group By">
          <FSelect value={groupBy} onChange={e => setGroupBy(e.target.value)}>
            {Object.keys(GROUP_FNS).map(g => <option key={g}>{g}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Export Format">
          <FSelect value={exportFmt} onChange={e => setExportFmt(e.target.value)}>
            {['PDF','CSV','Excel'].map(f => <option key={f}>{f}</option>)}
          </FSelect>
        </FRow>
      </div>

      {/* Error */}
      {error && (
        <div style={{ margin: '10px 0', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#DC2626', fontSize: 12 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: 13 }}>
          ⏳ Fetching data from backend…
        </div>
      )}

      {/* Chart preview */}
      {chartData && !loading && (
  <div
    className="custom-report-chart"
    style={{ marginTop: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}
  >
    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .5 }}>
      Preview — {module} · Grouped by {groupBy}
    </div>
    <SVGChart data={chartData} type={chartType} />
  </div>
)}

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
        <FBtn secondary onClick={onClose}>Cancel</FBtn>
        <FBtn secondary onClick={generate} disabled={loading}>
          {loading ? '⏳ Loading…' : '▶ Generate'}
        </FBtn>
        {chartData && !loading && (
          <FBtn onClick={doExport}>⬇ Export {exportFmt}</FBtn>
        )}
      </div>
    </Modal>
  );
};

// ─── NewSOModal ───────────────────────────────────────────────────────────────
const NewSOModal = ({ open, onClose, onSave }) => {
  const [items, setItems] = useState([
    { id: 1, name: "", category: "Split AC", qty: "", price: "" },
  ]);
  const [gst, setGst] = useState(18);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: Date.now(), name: "", category: "Split AC", qty: "", price: "" },
    ]);
  const removeItem = (id) =>
    setItems((prev) => prev.filter((i) => i.id !== id));
  const updateItem = (id, field, value) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );

  const subtotal = items.reduce(
    (s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.price) || 0),
    0,
  );
  const gstAmt = (subtotal * gst) / 100;
  const total = subtotal + gstAmt;
  const fmt = (n) =>
    "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const ITEM_CATEGORIES = [
    "Split AC",
    "Window AC",
    "Cassette AC",
    "Portable AC",
    "Duct AC",
    "Installation Kit",
    "Copper Pipe",
    "Stabilizer",
    "AMC Package",
    "Extended Warranty",
    "Spare Part",
    "Other",
  ];

  const rowStyle = {
    display: "grid",
    gridTemplateColumns: "2fr 1.3fr 70px 100px 28px",
    gap: 6,
    alignItems: "center",
    padding: "8px 10px",
    background: COLORS.bg,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
  };
  const miniInput = {
    width: "100%",
    padding: "7px 9px",
    borderRadius: 7,
    border: `1px solid ${COLORS.border}`,
    fontSize: 12,
    fontFamily: FONTS.sans,
    color: COLORS.h2,
    background: COLORS.white,
    outline: "none",
    boxSizing: "border-box",
  };
  const miniSelect = { ...miniInput, cursor: "pointer" };
  const colHdrStyle = {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.faint,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🛍️ New Customer Order"
      width={680}
    >
      <SectionHead title="Customer Info" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FRow label="Customer *">
          <FSelect>
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </FSelect>
        </FRow>
        <FRow label="Phone">
          <FInput type="tel" placeholder="+91 XXXXX XXXXX" />
        </FRow>
        <FRow label="Delivery Date *">
          <FInput type="date" defaultValue="2026-04-25" />
        </FRow>
        <FRow label="Payment Status">
          <FSelect>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
          </FSelect>
        </FRow>
      </div>
      <FRow label="Delivery Address">
        <FInput placeholder="e.g. 12, Satellite Road, Ahmedabad" />
      </FRow>

      <SectionHead title="Line Items" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.3fr 70px 100px 28px",
          gap: 6,
          padding: "0 10px",
          marginBottom: 6,
        }}
      >
        <span style={colHdrStyle}>Item / Description</span>
        <span style={colHdrStyle}>Category</span>
        <span style={colHdrStyle}>Qty</span>
        <span style={colHdrStyle}>Unit Price (₹)</span>
        <span />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 7,
          marginBottom: 10,
        }}
      >
        {items.map((item) => (
          <div key={item.id} style={rowStyle}>
            <input
              style={miniInput}
              placeholder="Item name / description"
              value={item.name}
              onChange={(e) => updateItem(item.id, "name", e.target.value)}
            />
            <select
              style={miniSelect}
              value={item.category}
              onChange={(e) => updateItem(item.id, "category", e.target.value)}
            >
              {ITEM_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              style={miniInput}
              type="number"
              placeholder="0"
              value={item.qty}
              onChange={(e) => updateItem(item.id, "qty", e.target.value)}
            />
            <input
              style={miniInput}
              type="number"
              placeholder="0"
              value={item.price}
              onChange={(e) => updateItem(item.id, "price", e.target.value)}
            />
            <button
              onClick={() => removeItem(item.id)}
              disabled={items.length === 1}
              style={{
                background: "none",
                border: "none",
                color: "#EF4444",
                fontSize: 18,
                cursor: "pointer",
                padding: 0,
                lineHeight: 1,
                opacity: items.length === 1 ? 0.3 : 1,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addItem}
        style={{
          width: "100%",
          padding: "8px 0",
          borderRadius: 8,
          border: `1.5px dashed ${COLORS.brand}`,
          background: `${COLORS.brand}08`,
          color: COLORS.brand,
          fontSize: 12,
          fontWeight: 700,
          fontFamily: FONTS.sans,
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        + Add Item
      </button>

      {/* Totals */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: COLORS.faint,
              letterSpacing: "0.05em",
              marginBottom: 4,
            }}
          >
            SUBTOTAL
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: COLORS.h1,
              fontFamily: FONTS.mono,
            }}
          >
            {fmt(subtotal)}
          </div>
        </div>
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: COLORS.faint,
                letterSpacing: "0.05em",
              }}
            >
              GST
            </span>
            <select
              value={gst}
              onChange={(e) => setGst(Number(e.target.value))}
              style={{
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 5,
                border: `1px solid ${COLORS.border}`,
                fontFamily: FONTS.sans,
                color: COLORS.h2,
                background: COLORS.white,
                outline: "none",
              }}
            >
              {[0, 5, 12, 18, 28].map((r) => (
                <option key={r} value={r}>
                  {r}%
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: COLORS.h1,
              fontFamily: FONTS.mono,
            }}
          >
            {fmt(gstAmt)}
          </div>
        </div>
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: `${COLORS.brand}10`,
            border: `1.5px solid ${COLORS.brand}30`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: COLORS.brand,
              letterSpacing: "0.05em",
              marginBottom: 4,
            }}
          >
            TOTAL
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: COLORS.brand,
              fontFamily: FONTS.mono,
            }}
          >
            {fmt(total)}
          </div>
        </div>
      </div>

      <SectionHead title="Notes" />
      <FRow label="Order Notes / Instructions">
        <FTextarea
          placeholder="Special delivery instructions, installation preferences, notes for the team…"
          rows={2}
        />
      </FRow>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 12,
        }}
      >
        <FBtn secondary onClick={onClose}>
          Cancel
        </FBtn>
        <FBtn onClick={() => onSave({})}>Create Order</FBtn>
      </div>
    </Modal>
  );
};

export {
  NewJobModal,
  NewQuotationModal,
  NewCustomerModal,
  NewAMCModal,
  NewInvoiceModal,
  AddTechnicianModal,
  AddExpenseModal,
  AddInventoryModal,
  NewLeadModal,
  NewPOModal,
  NewSupplierModal,
  NewAssetModal,
  RegisterWarrantyModal,
  NewNoticeModal,
  MarkAttendanceModal,
  AdvanceModal,
  SendQuotationModal,
  ConvertToJobModal,
  ReportModal,
  AddAdminUserModal,
  UseInventoryModal,
  LogFuelModal,
  ScheduleAMCModal,
  RequestReviewModal,
  AssignComplaintModal,
  ResolveComplaintModal,
  SetReminderModal,
  CustomReportModal,
  NewTicketModal,
  NewSOModal,
};