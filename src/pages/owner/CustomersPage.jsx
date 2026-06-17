import { useEffect, useRef, useState } from "react";
import { Search, Filter, Plus, Download, Upload, MoreVertical, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, X, ChevronDown, Trash2, GitMerge, MessageCircle } from "lucide-react";
import { api } from "../../api/client";
import IndianPhoneInput from "../../components/IndianPhoneInput";
import { useSalonSettings } from "../../context/SalonSettingsContext";
import { formatApiError } from "../../utils/apiError";
import { downloadFromApi } from "../../utils/download";
import PageLoader from "../../components/PageLoader";

const EMPTY_ADVANCED_FILTERS = {
  gender: "",
  specialDay: "",
  lastVisitedStart: "",
  lastVisitedEnd: "",
  nonReturningDays: "",
  advanceState: "",
  balanceState: "",
  clientRetention: "",
  totalPurchaseMin: "",
  totalPurchaseMax: "",
  averagePurchaseMin: "",
  averagePurchaseMax: "",
  membershipState: "",
  loyaltyState: "",
  packageState: "",
  visitType: "all"
};

const FILTER_SECTIONS = [
  { key: "gender", label: "Gender" },
  { key: "specialDay", label: "Special Day" },
  { key: "lastVisited", label: "Last Visited" },
  { key: "nonReturning", label: "Non-Returning" },
  { key: "advance", label: "Advance" },
  { key: "balance", label: "Balance" },
  { key: "clientRetention", label: "Client Retention" },
  { key: "totalPurchaseAmount", label: "Total Purchase Amount" },
  { key: "avgPurchaseAmount", label: "Avg Purchase Amount" },
  { key: "membership", label: "Membership" },
  { key: "loyalty", label: "Loyalty" },
  { key: "package", label: "Package" }
];

const formatCompactDate = (value, withYear = true) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    ...(withYear ? { year: "numeric" } : {})
  }).replace(/ /g, "-");
};

const isWithinDateRange = (value, start, end) => {
  if (!value) return false;
  const current = new Date(value);
  if (start && current < new Date(start)) return false;
  if (end) {
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    if (current > endDate) return false;
  }
  return true;
};

export default function CustomersPage() {
  const { formatMoney } = useSalonSettings();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [activeFilterSection, setActiveFilterSection] = useState("gender");
  const [draftFilters, setDraftFilters] = useState(EMPTY_ADVANCED_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_ADVANCED_FILTERS);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [activeMenuRowId, setActiveMenuRowId] = useState("");
  const [mergeSourceRow, setMergeSourceRow] = useState(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [actionBusy, setActionBusy] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [customerDetailLoading, setCustomerDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState("profile");
  const actionMenuRef = useRef(null);
  const [formData, setFormData] = useState({
    phone: "",
    alternatePhone: "",
    name: "",
    email: "",
    dateOfBirth: "",
    anniversary: "",
    gst: "",
    gender: "female"
  });

  const load = async (searchText = query, selectedFilter = filterType) => {
    setLoading(true);
    try {
      const response = await api.get("/owner/customers", { params: { q: searchText, filter: selectedFilter } });
      setRows(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterType]);

  useEffect(() => {
    if (!activeMenuRowId) return undefined;
    const handleOutsideClick = (event) => {
      if (!actionMenuRef.current?.contains(event.target)) setActiveMenuRowId("");
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeMenuRowId]);

  const openWhatsAppForCustomer = (row) => {
    const digits = String(row.phone || "").replace(/\D/g, "");
    if (!digits) {
      alert("Customer phone number is missing");
      return;
    }
    const whatsappDigits = digits.startsWith("91") ? digits : `91${digits}`;
    window.open(`https://wa.me/${whatsappDigits}`, "_blank", "noopener,noreferrer");
    setActiveMenuRowId("");
  };

  const openCustomerDetail = async (row) => {
    setSelectedCustomer(row);
    setDetailTab("profile");
    setCustomerDetail(null);
    setCustomerDetailLoading(true);
    try {
      const res = await api.get(`/owner/customers/${row.id}`);
      setCustomerDetail(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCustomerDetailLoading(false);
    }
  };

  const closeCustomerDetail = () => {
    setSelectedCustomer(null);
    setCustomerDetail(null);
  };

  const handleExport = async (format) => {
    setShowExportMenu(false);
    try {
      await downloadFromApi(`/owner/customers/export?format=${format}`, { fallbackFilename: `Customers.${format}` });
    } catch (error) {
      alert("Could not export customers");
    }
  };

  const handleAddGuest = async (event) => {
    event.preventDefault();
    try {
      await api.post("/owner/customers", formData);
      setShowAddGuest(false);
      setFormData({
        phone: "",
        alternatePhone: "",
        name: "",
        email: "",
        dateOfBirth: "",
        anniversary: "",
        gst: "",
        gender: "female"
      });
      await load();
    } catch (error) {
      alert(formatApiError(error, "Failed to add guest"));
    }
  };

  const handleDeleteCustomer = async (row) => {
    if (!window.confirm(`Delete ${row.name || "this customer"}? If linked history exists, the system will block deletion.`)) return;
    setActionBusy(row.id);
    try {
      await api.delete(`/owner/customers/${row.id}`);
      setRows((current) => current.filter((entry) => entry.id !== row.id));
      setActiveMenuRowId("");
    } catch (error) {
      alert(formatApiError(error, "Could not delete customer"));
    } finally {
      setActionBusy("");
    }
  };

  const handleMergeCustomer = async () => {
    if (!mergeSourceRow?.id || !mergeTargetId) {
      alert("Please select the target customer");
      return;
    }
    setActionBusy(mergeSourceRow.id);
    try {
      await api.post("/owner/customers/merge", {
        sourceCustomerId: mergeSourceRow.id,
        targetCustomerId: mergeTargetId
      });
      setMergeSourceRow(null);
      setMergeTargetId("");
      setActiveMenuRowId("");
      await load();
    } catch (error) {
      alert(formatApiError(error, "Could not merge customers"));
    } finally {
      setActionBusy("");
    }
  };

  const visibleRows = rows.filter((row) => {
    const genderValue = String(row.gender || "").toLowerCase();
    const totalPurchase = Number(row.totalSpend || 0);
    const averagePurchase = Number(row.averageSpend || 0);
    const totalOrders = Number(row.totalOrders || 0);
    const advanceAmount = Number(row.advanceAmount || 0);
    const balanceAmount = Number(row.balanceAmount || 0);
    const loyalty = Number(row.loyalty || row.loyaltyPoints || 0);
    const membershipCount = Number(row.membershipCount || 0);
    const activeMembershipCount = Number(row.activeMembershipCount || 0);
    const packageCount = Number(row.packageCount || 0);

    if (query) {
      const haystack = `${row.name || ""} ${row.phone || ""} ${row.email || ""}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    if (appliedFilters.gender && genderValue !== appliedFilters.gender) return false;
    if (appliedFilters.specialDay === "birthday" && !isWithinDateRange(row.dateOfBirth, appliedFilters.lastVisitedStart, appliedFilters.lastVisitedEnd)) return false;
    if (appliedFilters.specialDay === "anniversary" && !isWithinDateRange(row.anniversary, appliedFilters.lastVisitedStart, appliedFilters.lastVisitedEnd)) return false;
    if ((appliedFilters.lastVisitedStart || appliedFilters.lastVisitedEnd) && !isWithinDateRange(row.lastVisitAt, appliedFilters.lastVisitedStart, appliedFilters.lastVisitedEnd)) return false;
    if (appliedFilters.nonReturningDays) {
      const thresholdTime = Date.now() - (Number(appliedFilters.nonReturningDays) * 24 * 60 * 60 * 1000);
      const lastVisitTime = row.lastVisitAt ? new Date(row.lastVisitAt).getTime() : 0;
      if (lastVisitTime > thresholdTime) return false;
    }
    if (appliedFilters.advanceState === "yes" && advanceAmount <= 0) return false;
    if (appliedFilters.advanceState === "no" && advanceAmount > 0) return false;
    if (appliedFilters.balanceState === "yes" && balanceAmount <= 0) return false;
    if (appliedFilters.balanceState === "no" && balanceAmount > 0) return false;
    if (appliedFilters.clientRetention === "new" && totalOrders > 1) return false;
    if (appliedFilters.clientRetention === "repeat" && totalOrders < 2) return false;
    if (appliedFilters.visitType === "new" && totalOrders > 1) return false;
    if (appliedFilters.visitType === "repeat" && totalOrders < 2) return false;
    if (appliedFilters.totalPurchaseMin && totalPurchase < Number(appliedFilters.totalPurchaseMin)) return false;
    if (appliedFilters.totalPurchaseMax && totalPurchase > Number(appliedFilters.totalPurchaseMax)) return false;
    if (appliedFilters.averagePurchaseMin && averagePurchase < Number(appliedFilters.averagePurchaseMin)) return false;
    if (appliedFilters.averagePurchaseMax && averagePurchase > Number(appliedFilters.averagePurchaseMax)) return false;
    if (appliedFilters.membershipState === "active" && activeMembershipCount <= 0) return false;
    if (appliedFilters.membershipState === "any" && membershipCount <= 0) return false;
    if (appliedFilters.membershipState === "none" && membershipCount > 0) return false;
    if (appliedFilters.loyaltyState === "yes" && loyalty <= 0) return false;
    if (appliedFilters.loyaltyState === "no" && loyalty > 0) return false;
    if (appliedFilters.packageState === "yes" && packageCount <= 0) return false;
    if (appliedFilters.packageState === "no" && packageCount > 0) return false;
    return true;
  });

  const renderFilterContent = () => {
    switch (activeFilterSection) {
      case "gender":
        return (
          <div className="form-group">
            <label>Gender</label>
            <select value={draftFilters.gender} onChange={(event) => setDraftFilters((current) => ({ ...current, gender: event.target.value }))}>
              <option value="">All</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>
        );
      case "specialDay":
        return (
          <>
            <div className="form-group">
              <label>Special Day</label>
              <select value={draftFilters.specialDay} onChange={(event) => setDraftFilters((current) => ({ ...current, specialDay: event.target.value }))}>
                <option value="">All</option>
                <option value="birthday">Birthday</option>
                <option value="anniversary">Anniversary</option>
              </select>
            </div>
            <div className="form-group">
              <label>Starting Date</label>
              <input type="date" value={draftFilters.lastVisitedStart} onChange={(event) => setDraftFilters((current) => ({ ...current, lastVisitedStart: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>Ending Date</label>
              <input type="date" value={draftFilters.lastVisitedEnd} onChange={(event) => setDraftFilters((current) => ({ ...current, lastVisitedEnd: event.target.value }))} />
            </div>
          </>
        );
      case "lastVisited":
        return (
          <>
            <div className="form-group">
              <label>Starting Date</label>
              <input type="date" value={draftFilters.lastVisitedStart} onChange={(event) => setDraftFilters((current) => ({ ...current, lastVisitedStart: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>Ending Date</label>
              <input type="date" value={draftFilters.lastVisitedEnd} onChange={(event) => setDraftFilters((current) => ({ ...current, lastVisitedEnd: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>Visit Type</label>
              <div className="radio-column">
                <label><input type="radio" name="visitType" checked={draftFilters.visitType === "all"} onChange={() => setDraftFilters((current) => ({ ...current, visitType: "all" }))} /> All</label>
                <label><input type="radio" name="visitType" checked={draftFilters.visitType === "new"} onChange={() => setDraftFilters((current) => ({ ...current, visitType: "new" }))} /> New Guest</label>
                <label><input type="radio" name="visitType" checked={draftFilters.visitType === "repeat"} onChange={() => setDraftFilters((current) => ({ ...current, visitType: "repeat" }))} /> Repetitive Guest</label>
              </div>
            </div>
          </>
        );
      case "nonReturning":
        return (
          <div className="form-group">
            <label>Days Since Last Visit</label>
            <input type="number" min="1" placeholder="90" value={draftFilters.nonReturningDays} onChange={(event) => setDraftFilters((current) => ({ ...current, nonReturningDays: event.target.value }))} />
          </div>
        );
      case "advance":
        return (
          <div className="form-group">
            <label>Advance Status</label>
            <select value={draftFilters.advanceState} onChange={(event) => setDraftFilters((current) => ({ ...current, advanceState: event.target.value }))}>
              <option value="">All</option>
              <option value="yes">Has Advance</option>
              <option value="no">No Advance</option>
            </select>
          </div>
        );
      case "balance":
        return (
          <div className="form-group">
            <label>Balance Status</label>
            <select value={draftFilters.balanceState} onChange={(event) => setDraftFilters((current) => ({ ...current, balanceState: event.target.value }))}>
              <option value="">All</option>
              <option value="yes">Has Balance</option>
              <option value="no">No Balance</option>
            </select>
          </div>
        );
      case "clientRetention":
        return (
          <div className="form-group">
            <label>Retention Type</label>
            <select value={draftFilters.clientRetention} onChange={(event) => setDraftFilters((current) => ({ ...current, clientRetention: event.target.value }))}>
              <option value="">All</option>
              <option value="new">New Guest</option>
              <option value="repeat">Repetitive Guest</option>
            </select>
          </div>
        );
      case "totalPurchaseAmount":
        return (
          <>
            <div className="form-group">
              <label>Minimum Amount</label>
              <input type="number" min="0" value={draftFilters.totalPurchaseMin} onChange={(event) => setDraftFilters((current) => ({ ...current, totalPurchaseMin: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>Maximum Amount</label>
              <input type="number" min="0" value={draftFilters.totalPurchaseMax} onChange={(event) => setDraftFilters((current) => ({ ...current, totalPurchaseMax: event.target.value }))} />
            </div>
          </>
        );
      case "avgPurchaseAmount":
        return (
          <>
            <div className="form-group">
              <label>Minimum Amount</label>
              <input type="number" min="0" value={draftFilters.averagePurchaseMin} onChange={(event) => setDraftFilters((current) => ({ ...current, averagePurchaseMin: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>Maximum Amount</label>
              <input type="number" min="0" value={draftFilters.averagePurchaseMax} onChange={(event) => setDraftFilters((current) => ({ ...current, averagePurchaseMax: event.target.value }))} />
            </div>
          </>
        );
      case "membership":
        return (
          <div className="form-group">
            <label>Membership Status</label>
            <select value={draftFilters.membershipState} onChange={(event) => setDraftFilters((current) => ({ ...current, membershipState: event.target.value }))}>
              <option value="">All</option>
              <option value="active">Active Membership</option>
              <option value="any">Has Membership</option>
              <option value="none">No Membership</option>
            </select>
          </div>
        );
      case "loyalty":
        return (
          <div className="form-group">
            <label>Loyalty Status</label>
            <select value={draftFilters.loyaltyState} onChange={(event) => setDraftFilters((current) => ({ ...current, loyaltyState: event.target.value }))}>
              <option value="">All</option>
              <option value="yes">Has Loyalty</option>
              <option value="no">No Loyalty</option>
            </select>
          </div>
        );
      case "package":
        return (
          <div className="form-group">
            <label>Package Status</label>
            <select value={draftFilters.packageState} onChange={(event) => setDraftFilters((current) => ({ ...current, packageState: event.target.value }))}>
              <option value="">All</option>
              <option value="yes">Has Package</option>
              <option value="no">No Package</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: "10px 16px", background: "#f8fafc", minHeight: "100%", width: "100%" }}>
      <style>
        {`
          .crm-toolbar { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px; }
          .crm-search { display:flex; align-items:center; background:#fff; border:1px solid #e2e8f0; border-radius:20px; padding:5px 12px; width:260px; box-shadow: none; }
          .crm-search input { border:none; outline:none; margin-left:6px; font-size:0.8rem; width:100%; color:#334155; background:transparent; min-height:unset; }
          .crm-actions { display:flex; gap:8px; flex-wrap:wrap; }
          .crm-btn { display:flex; align-items:center; gap:5px; background:#3b82f6; color:#fff; border:none; padding:7px 12px; border-radius:6px; font-size:0.78rem; font-weight:600; cursor:pointer; box-shadow: none; min-height:unset; }
          .crm-btn:hover { background:#2563eb; transform:none; filter:none; }
          .crm-btn-light { background:#f8fafc; color:#2563eb; border:1px solid #bfdbfe; box-shadow:none; }
          .crm-btn-light:hover { background:#eff6ff; }
          .crm-table-container { background:#fff; border-radius:8px; box-shadow: none; overflow:auto; }
          .crm-table { width:100%; border-collapse:collapse; white-space:nowrap; }
          .crm-table th { background:#f8fafc; color:#475569; font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; padding:8px 12px; text-align:left; border-bottom:2px solid #e2e8f0; }
          .crm-table td { padding:8px 12px; font-size:0.78rem; color:#334155; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
          .crm-table tr:hover { background:#f8fafc; }
          .crm-table-checkbox { width:14px; height:14px; accent-color:#3b82f6; min-height:unset; }
          .crm-pagination { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-top:1px solid #e2e8f0; color:#64748b; font-size:0.78rem; gap:10px; }
          .crm-pagination button { background:none; border:none; color:#64748b; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:3px; min-height:unset; box-shadow:none; }
          .crm-pagination button:hover { color:#0f172a; transform:none; filter:none; }
          .modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.4); backdrop-filter:blur(4px); z-index:1000; display:flex; align-items:center; justify-content:center; }
          .modal-content { background:#fff; border-radius:12px; width:min(90vw,520px); max-height:90vh; overflow-y:auto; box-shadow: none; }
          .modal-header { display:flex; justify-content:space-between; align-items:center; padding:14px 18px; border-bottom:1px solid #f1f5f9; }
          .modal-header h3 { margin:0; font-size:1rem; color:#0f172a; }
          .modal-close { background:none; border:none; cursor:pointer; color:#64748b; min-height:unset; box-shadow:none; padding:4px; }
          .modal-body { padding:16px 18px; display:grid; gap:12px; }
          .modal-footer { padding:12px 18px; border-top:1px solid #f1f5f9; display:flex; justify-content:flex-end; gap:8px; }
          .form-group { display:flex; flex-direction:column; gap:4px; }
          .form-group label { font-size:0.8rem; font-weight:600; color:#475569; }
          .form-group input, .form-group select { padding:7px 10px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem; background:#fff; min-height:unset; }
          .radio-group { display:flex; gap:12px; align-items:center; }
          .radio-group label, .radio-column label { display:flex; align-items:center; gap:6px; font-weight:500; cursor:pointer; font-size:0.8rem; }
          .radio-column { display:flex; flex-direction:column; align-items:flex-start; gap:8px; }
          .export-dropdown { position:relative; display:inline-block; }
          .export-menu { position:absolute; top:calc(100% + 4px); right:0; background:#fff; border:1px solid #e2e8f0; border-radius:8px; box-shadow: none; min-width:130px; z-index:50; overflow:hidden; }
          .export-item { width:100%; text-align:left; padding:8px 12px; border:none; background:none; cursor:pointer; font-size:0.8rem; color:#475569; min-height:unset; }
          .export-item:hover { background:#f8fafc; color:#0f172a; }
          .sidebar-modal { position:fixed; top:0; right:0; bottom:0; width:min(92vw,520px); background:#fff; box-shadow: none; z-index:1050; display:flex; flex-direction:column; animation:slideIn 0.28s forwards; }
          @keyframes slideIn { from { transform:translateX(100%); } to { transform:translateX(0); } }
          .sidebar-modal-header { display:flex; justify-content:space-between; align-items:center; padding:14px 18px; border-bottom:1px solid #f1f5f9; }
          .sidebar-modal-body { flex:1; display:flex; overflow:hidden; }
          .filter-categories { width:180px; background:#f8fafc; border-right:1px solid #f1f5f9; overflow-y:auto; }
          .filter-category-btn { width:100%; text-align:left; padding:10px 12px; background:none; border:none; font-size:0.82rem; color:#475569; cursor:pointer; border-bottom:1px solid #e2e8f0; min-height:unset; }
          .filter-category-btn.active { background:#fff; color:#0f766e; font-weight:700; border-left:3px solid #0f766e; }
          .filter-options { flex:1; padding:16px; overflow-y:auto; display:grid; gap:12px; }
          .sidebar-modal-footer { padding:12px 18px; border-top:1px solid #f1f5f9; display:flex; justify-content:flex-end; gap:8px; }
          .crm-row-action { position:relative; overflow:visible; }
          .crm-row-action-trigger { width:32px; height:32px; border-radius:6px; border:1px solid #e2e8f0; background:#f8fafc; color:#475569; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; min-height:unset; box-shadow:none; }
          .crm-row-action-trigger:hover { background:#eff6ff; color:#2563eb; border-color:#bfdbfe; transform:none; filter:none; }
          .crm-row-menu { position:absolute; top:calc(100% + 4px); right:0; min-width:170px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; box-shadow: none; padding:6px; z-index:3000; }
          .crm-row-menu button { width:100%; border:none; background:#fff; border-radius:8px; display:flex; align-items:center; gap:8px; padding:9px 12px; font-size:0.82rem; color:#0f172a; cursor:pointer; margin-bottom:4px; min-height:unset; box-shadow:none; }
          .crm-row-menu button:last-child { margin-bottom:0; }
          .crm-row-menu button:hover { background:#f8fafc; transform:none; filter:none; }
          .crm-row-menu .danger { color:#dc2626; }
          .crm-count-badge { display:inline-flex; align-items:center; justify-content:center; min-width:22px; padding:2px 7px; border-radius:999px; background:#eff6ff; color:#2563eb; font-weight:700; font-size:0.72rem; }
          /* Customer Detail Slide-out Panel */
          .cust-detail-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.25); backdrop-filter:blur(2px); z-index:2000; }
          .cust-detail-panel { position:fixed; top:0; right:0; bottom:0; width:min(95vw,480px); background:#fff; color:#0f172a; display:flex; flex-direction:column; z-index:2001; box-shadow:-8px 0 30px rgba(0,0,0,0.12); animation:slideInRight 0.25s ease-out; }
          @keyframes slideInRight { from { transform:translateX(100%); } to { transform:translateX(0); } }
          .cust-detail-header { padding:16px 20px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e2e8f0; background:#f8fafc; }
          .cust-detail-avatar { width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#3b82f6,#8b5cf6); display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:700; color:#fff; flex-shrink:0; }
          .cust-detail-name { font-size:1rem; font-weight:700; color:#0f172a; }
          .cust-detail-phone { font-size:0.8rem; color:#64748b; }
          .cust-detail-close { background:none; border:none; color:#94a3b8; cursor:pointer; font-size:1.4rem; line-height:1; padding:4px; border-radius:6px; }
          .cust-detail-close:hover { color:#dc2626; background:#fee2e2; }
          .cust-detail-info { padding:14px 20px; display:grid; grid-template-columns:1fr 1fr; gap:10px 16px; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
          .cust-detail-info-row { display:flex; flex-direction:column; gap:2px; }
          .cust-detail-info-label { font-size:0.65rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; font-weight:600; }
          .cust-detail-info-val { font-size:0.82rem; color:#0f172a; font-weight:600; }
          .cust-detail-tabs { display:flex; border-bottom:2px solid #f1f5f9; background:#fff; overflow-x:auto; }
          .cust-detail-tab { flex:1; min-width:80px; padding:12px 8px; background:none; border:none; color:#94a3b8; font-size:0.75rem; font-weight:600; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-2px; white-space:nowrap; text-align:center; transition:all .15s; }
          .cust-detail-tab:hover { color:#334155; }
          .cust-detail-tab.active { color:#2563eb; border-bottom-color:#2563eb; }
          .cust-detail-body { flex:1; overflow-y:auto; padding:16px 20px; background:#fff; }
          .cust-detail-body::-webkit-scrollbar { width:4px; }
          .cust-detail-body::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:4px; }
          .cust-detail-section { margin-bottom:20px; }
          .cust-detail-section-title { font-size:0.7rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:10px; font-weight:700; }
          .cust-order-card { background:#f8fafc; border-radius:10px; padding:14px; margin-bottom:10px; border:1px solid #e2e8f0; transition:box-shadow .15s; }
          .cust-order-card:hover { box-shadow:0 2px 8px rgba(0,0,0,0.06); }
          .cust-order-card-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
          .cust-order-invoice { font-size:0.82rem; font-weight:700; color:#2563eb; }
          .cust-order-date { font-size:0.72rem; color:#94a3b8; }
          .cust-order-amount { font-size:0.9rem; font-weight:700; color:#16a34a; }
          .cust-order-status { font-size:0.65rem; padding:2px 8px; border-radius:999px; font-weight:700; }
          .cust-order-status.PAID { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; }
          .cust-order-status.UNPAID { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; }
          .cust-order-status.PARTIAL { background:#fffbeb; color:#d97706; border:1px solid #fde68a; }
          .cust-order-status.CANCELLED { background:#f8fafc; color:#64748b; border:1px solid #e2e8f0; }
          .cust-order-items { display:flex; flex-direction:column; gap:4px; }
          .cust-order-item { display:flex; justify-content:space-between; font-size:0.75rem; color:#475569; padding:3px 0; border-bottom:1px solid #f1f5f9; }
          .cust-order-item:last-child { border-bottom:none; }
          .cust-order-item-staff { font-size:0.65rem; color:#94a3b8; }
          .cust-membership-card { background:#f8fafc; border-radius:10px; padding:14px; margin-bottom:10px; border:1px solid #e2e8f0; }
          .cust-mem-name { font-size:0.9rem; font-weight:700; color:#0f172a; }
          .cust-mem-status { font-size:0.65rem; padding:2px 8px; border-radius:999px; font-weight:700; display:inline-flex; }
          .cust-mem-status.ACTIVE { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; }
          .cust-mem-status.EXPIRED { background:#f8fafc; color:#64748b; border:1px solid #e2e8f0; }
          .cust-mem-meta { font-size:0.75rem; color:#64748b; margin-top:4px; }
          .cust-pkg-card { background:#f8fafc; border-radius:10px; padding:14px; margin-bottom:10px; border:1px solid #e2e8f0; }
          .cust-pkg-name { font-size:0.9rem; font-weight:700; color:#0f172a; }
          .cust-pkg-sessions { font-size:0.8rem; color:#d97706; font-weight:600; margin-top:4px; }
          .cust-pkg-meta { font-size:0.75rem; color:#64748b; margin-top:4px; }
          .cust-profile-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f1f5f9; font-size:0.82rem; }
          .cust-profile-row:last-child { border-bottom:none; }
          .cust-profile-label { color:#64748b; font-weight:500; }
          .cust-profile-val { color:#0f172a; font-weight:600; text-align:right; max-width:55%; word-break:break-all; }
          @media (max-width: 768px) {
            .crm-toolbar { flex-direction:column; align-items:stretch; }
            .crm-search { width:100%; }
            .crm-actions { overflow-x:auto; padding-bottom:8px; }
            .filter-categories { width:160px; }
            .cust-detail-panel { width:100vw; }
          }
        `}
      </style>

      {showFilters && (
        <div className="modal-overlay" onClick={() => setShowFilters(false)}>
          <div className="sidebar-modal" onClick={(event) => event.stopPropagation()}>
            <div className="sidebar-modal-header">
              <h3>Filters</h3>
              <button className="modal-close" onClick={() => setShowFilters(false)}><X size={20} /></button>
            </div>
            <div className="sidebar-modal-body">
              <div className="filter-categories">
                {FILTER_SECTIONS.map((section) => (
                  <button key={section.key} className={`filter-category-btn ${activeFilterSection === section.key ? "active" : ""}`} onClick={() => setActiveFilterSection(section.key)}>
                    {section.label}
                  </button>
                ))}
              </div>
              <div className="filter-options">
                <div className="form-group">
                  <label>Quick Filter</label>
                  <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
                    <option value="">All Customers</option>
                    <option value="high_spender">High Spenders (INR 10k+)</option>
                    <option value="lost_customer">Non-Returning (90+ Days)</option>
                    <option value="active_membership">Active Membership</option>
                    <option value="active_package">Active Package</option>
                    <option value="birthday_month">Birthday This Month</option>
                    <option value="anniversary_month">Anniversary This Month</option>
                  </select>
                </div>
                {renderFilterContent()}
              </div>
            </div>
            <div className="sidebar-modal-footer">
              <button
                className="crm-btn"
                onClick={() => {
                  setFilterType("");
                  setDraftFilters(EMPTY_ADVANCED_FILTERS);
                  setAppliedFilters(EMPTY_ADVANCED_FILTERS);
                  setShowFilters(false);
                }}
              >
                Clear
              </button>
              <button
                className="crm-btn"
                onClick={() => {
                  setAppliedFilters(draftFilters);
                  setShowFilters(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {mergeSourceRow && (
        <div className="modal-overlay" onClick={() => { setMergeSourceRow(null); setMergeTargetId(""); }}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Merge Customer</h3>
              <button className="modal-close" onClick={() => { setMergeSourceRow(null); setMergeTargetId(""); }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Source Customer</label>
                <input value={`${mergeSourceRow.name || "-"} (${mergeSourceRow.phone || "-"})`} disabled />
              </div>
              <div className="form-group">
                <label>Target Customer</label>
                <select value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)}>
                  <option value="">Select target customer</option>
                  {rows.filter((row) => row.id !== mergeSourceRow.id).map((row) => (
                    <option key={row.id} value={row.id}>{row.name || "-"} ({row.phone || "-"})</option>
                  ))}
                </select>
              </div>
              <div style={{ color: "#64748b", fontSize: "0.92rem" }}>
                Linked invoices, appointments, memberships, packages, loyalty, notifications, timeline, and WhatsApp logs will move into the target customer.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="crm-btn" onClick={() => { setMergeSourceRow(null); setMergeTargetId(""); }}>Cancel</button>
              <button type="button" className="crm-btn" onClick={handleMergeCustomer} disabled={!mergeTargetId || actionBusy === mergeSourceRow.id}>
                {actionBusy === mergeSourceRow.id ? "Merging..." : "Merge Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddGuest && (
        <div className="modal-overlay" onClick={() => setShowAddGuest(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Guest</h3>
              <button className="modal-close" onClick={() => setShowAddGuest(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddGuest}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <IndianPhoneInput required value={formData.phone} onChange={(phone) => setFormData((current) => ({ ...current, phone }))} />
                </div>
                <div className="form-group">
                  <label>Name *</label>
                  <input required type="text" value={formData.name} placeholder="Guest Name" onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <div className="radio-group">
                    <label><input type="radio" name="gender" checked={formData.gender === "female"} onChange={() => setFormData((current) => ({ ...current, gender: "female" }))} /> Female</label>
                    <label><input type="radio" name="gender" checked={formData.gender === "male"} onChange={() => setFormData((current) => ({ ...current, gender: "male" }))} /> Male</label>
                  </div>
                </div>
                <div className="form-group">
                  <label>Alternate Mobile Number</label>
                  <IndianPhoneInput value={formData.alternatePhone} onChange={(alternatePhone) => setFormData((current) => ({ ...current, alternatePhone }))} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} />
                </div>
                <div className="form-group">
                  <label>DOB</label>
                  <input type="date" value={formData.dateOfBirth} onChange={(event) => setFormData((current) => ({ ...current, dateOfBirth: event.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Anniversary Date</label>
                  <input type="date" value={formData.anniversary} onChange={(event) => setFormData((current) => ({ ...current, anniversary: event.target.value }))} />
                </div>
                <div className="form-group">
                  <label>GST Number</label>
                  <input type="text" value={formData.gst} onChange={(event) => setFormData((current) => ({ ...current, gst: event.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="crm-btn" onClick={() => setShowAddGuest(false)}>Cancel</button>
                <button type="submit" className="crm-btn">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="crm-toolbar">
        <div className="crm-search">
          <Search size={18} color="#94a3b8" />
          <input type="text" placeholder="Name Or Number" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && load(query, filterType)} />
        </div>
        <div className="crm-actions">
          <button className="crm-btn crm-btn-light" onClick={() => setShowFilters(true)}><Filter size={16} /> Filters</button>
          <button className="crm-btn" onClick={() => setShowAddGuest(true)}><Plus size={16} /> Add Guest</button>
          <button className="crm-btn"><Download size={16} /> Import</button>
          <div className="export-dropdown">
            <button className="crm-btn" onClick={() => setShowExportMenu((current) => !current)}><Upload size={16} /> Export <ChevronDown size={16} /></button>
            {showExportMenu && (
              <div className="export-menu">
                <button className="export-item" onClick={() => handleExport("xlsx")}>Export as XLSX</button>
                <button className="export-item" onClick={() => handleExport("xls")}>Export as XLS</button>
                <button className="export-item" onClick={() => handleExport("csv")}>Export as CSV</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="crm-table-container">
        {loading ? (
          <PageLoader title="Loading Customers..." message="Please wait while we fetch your CRM data." />
        ) : (
          <>
            <table className="crm-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}><input type="checkbox" className="crm-table-checkbox" /></th>
                  <th>MOBILE NO.</th>
                  <th>NAME</th>
                  <th>GENDER</th>
                  <th>LAST VISITED</th>
                  <th>TOTAL<br />ORDERS</th>
                  <th>TOTAL<br />PURCHASE AMOUNT</th>
                  <th>AVERAGE<br />PURCHASE AMOUNT</th>
                  <th>ONLINE<br />VISITS</th>
                  <th>LOYALTY</th>
                  <th>REFERRAL<br />CODE</th>
                  <th>ADVANCE</th>
                  <th>BALANCE</th>
                  <th>MEMBERSHIP<br />COUNT</th>
                  <th>PACKAGE<br />COUNT</th>
                  <th>BIRTH<br />DATE</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={(event) => {
                      const target = event.target;
                      if (target instanceof Element && target.closest(".crm-row-action")) return;
                      openCustomerDetail(row);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <td><input type="checkbox" className="crm-table-checkbox" /></td>
                    <td style={{ color: "#0f172a", fontWeight: 600 }}>{row.phone || "-"}</td>
                    <td style={{ fontWeight: 600 }}>{row.name || "-"}</td>
                    <td>{row.gender ? `${row.gender.charAt(0).toUpperCase()}${row.gender.slice(1).toLowerCase()}` : "-"}</td>
                    <td>{formatCompactDate(row.lastVisitAt)}</td>
                    <td><span className="crm-count-badge">{Number(row.totalOrders || 0)}</span></td>
                    <td>{Number(row.totalSpend || 0) ? formatMoney(row.totalSpend) : "-"}</td>
                    <td>{Number(row.averageSpend || 0) ? formatMoney(row.averageSpend) : "-"}</td>
                    <td>{Number(row.onlineVisits || 0) || "-"}</td>
                    <td>{Number(row.loyalty || row.loyaltyPoints || 0) || "-"}</td>
                    <td>{row.referralCode || "-"}</td>
                    <td>{Number(row.advanceAmount || 0) ? formatMoney(row.advanceAmount) : "-"}</td>
                    <td>{Number(row.balanceAmount || 0) ? formatMoney(row.balanceAmount) : "-"}</td>
                    <td>{Number(row.membershipCount || 0) || "-"}</td>
                    <td>{Number(row.packageCount || 0) || "-"}</td>
                    <td>{formatCompactDate(row.dateOfBirth, false)}</td>
                    <td className="crm-row-action" onClick={(e) => e.stopPropagation()}>
                      <button className="crm-row-action-trigger" onClick={(e) => { e.stopPropagation(); setActiveMenuRowId((current) => current === row.id ? "" : row.id); }}>
                        <MoreVertical size={18} />
                      </button>
                      {activeMenuRowId === row.id && (
                        <div className="crm-row-menu" ref={actionMenuRef}>
                          <button className="danger" onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(row); }} disabled={actionBusy === row.id}>
                            <Trash2 size={16} /> {actionBusy === row.id ? "Working..." : "Delete"}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setMergeSourceRow(row); setMergeTargetId(""); setActiveMenuRowId(""); }}>
                            <GitMerge size={16} /> Merge
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); openWhatsAppForCustomer(row); }}>
                            <MessageCircle size={16} /> Whatsapp
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan="17" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      No customers found for the current search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="crm-pagination">
              <div style={{ display: "flex", gap: 8 }}>
                <button><ChevronsLeft size={18} /></button>
                <button><ChevronLeft size={18} /></button>
                <button><ChevronRight size={18} /></button>
                <button><ChevronsRight size={18} /></button>
              </div>
              <div>1-{visibleRows.length || 0} of {visibleRows.length || 0}</div>
            </div>
          </>
        )}
      </div>

      {/* Customer Detail Slide-out Panel */}
      {selectedCustomer && (
        <>
          <div className="cust-detail-overlay" onClick={closeCustomerDetail} />
          <div className="cust-detail-panel">
            {/* Header */}
            <div className="cust-detail-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="cust-detail-avatar">{(selectedCustomer.name || "?")[0].toUpperCase()}</div>
                <div>
                  <div className="cust-detail-name">{selectedCustomer.name || "-"}</div>
                  <div className="cust-detail-phone">{selectedCustomer.phone}</div>
                </div>
              </div>
              <button className="cust-detail-close" onClick={closeCustomerDetail}>✕</button>
            </div>

            {/* Quick Info Bar */}
            <div className="cust-detail-info">
              {[
                { label: "Gender", val: selectedCustomer.gender ? selectedCustomer.gender.charAt(0).toUpperCase() + selectedCustomer.gender.slice(1).toLowerCase() : "-" },
                { label: "Birth Date", val: selectedCustomer.dateOfBirth ? new Date(selectedCustomer.dateOfBirth).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not given yet!" },
                { label: "Anniversary", val: selectedCustomer.anniversary ? new Date(selectedCustomer.anniversary).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not given yet!" },
                { label: "Last Visited", val: selectedCustomer.lastVisitAt ? new Date(selectedCustomer.lastVisitAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not visited yet!" },
                { label: "Total Orders", val: Number(selectedCustomer.totalOrders || 0) },
                { label: "Loyalty Points", val: Number(selectedCustomer.loyaltyPoints || selectedCustomer.loyalty || 0) },
              ].map(({ label, val }) => (
                <div key={label} className="cust-detail-info-row">
                  <span className="cust-detail-info-label">{label}</span>
                  <span className="cust-detail-info-val">{val}</span>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="cust-detail-tabs">
              {[
                { key: "profile", icon: "👤", label: "Profile Info" },
                { key: "orders", icon: "📋", label: "Orders" },
                { key: "membership", icon: "🎟", label: "Membership" },
                { key: "packages", icon: "📦", label: "Packages" },
              ].map(t => (
                <button key={t.key} className={`cust-detail-tab${detailTab === t.key ? " active" : ""}`} onClick={() => setDetailTab(t.key)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="cust-detail-body">
              {customerDetailLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading...</div>
              ) : !customerDetail ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Could not load data</div>
              ) : (
                <>
                  {detailTab === "profile" && (
                    <div className="cust-detail-section">
                      {[
                        { label: "Name", val: customerDetail.name || "-" },
                        { label: "Phone", val: customerDetail.phone || "-" },
                        { label: "Email", val: customerDetail.email || "Not given yet!" },
                        { label: "GSTIN", val: customerDetail.gst || "-" },
                        { label: "Gender", val: customerDetail.gender ? customerDetail.gender.charAt(0).toUpperCase() + customerDetail.gender.slice(1) : "-" },
                        { label: "Birth Date", val: customerDetail.dateOfBirth ? new Date(customerDetail.dateOfBirth).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not given yet!" },
                        { label: "Anniversary", val: customerDetail.anniversary ? new Date(customerDetail.anniversary).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not given yet!" },
                        { label: "Last Visited", val: customerDetail.lastVisitAt ? new Date(customerDetail.lastVisitAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not visited yet!" },
                        { label: "Total Spend", val: Number(customerDetail.totalSpend || 0) ? formatMoney(customerDetail.totalSpend) : "-" },
                        { label: "Average Spend", val: Number(customerDetail.averageSpend || 0) ? formatMoney(customerDetail.averageSpend) : "-" },
                        { label: "Loyalty Points", val: Number(customerDetail.loyaltyPoints || 0) },
                        { label: "Source", val: customerDetail.source || "-" },
                        { label: "Notes", val: customerDetail.notes || "-" },
                        { label: "Preferences", val: customerDetail.preferences || "-" },
                        { label: "Allergies", val: customerDetail.allergies || "-" },
                      ].map(({ label, val }) => (
                        <div key={label} className="cust-profile-row">
                          <span className="cust-profile-label">{label}</span>
                          <span className="cust-profile-val">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailTab === "orders" && (
                    <div className="cust-detail-section">
                      <div className="cust-detail-section-title">Order History ({(customerDetail.invoices || []).length})</div>
                      {(customerDetail.invoices || []).length === 0 ? (
                        <div style={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center", padding: "20px 0" }}>No orders yet</div>
                      ) : (
                        (customerDetail.invoices || []).map(inv => (
                          <div key={inv.id} className="cust-order-card">
                            <div className="cust-order-card-head">
                              <div>
                                <div className="cust-order-invoice">Invoice #{inv.invoiceNumber}</div>
                                <div className="cust-order-date">{new Date(inv.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                                <div className="cust-order-amount">{formatMoney(inv.total)}</div>
                                <span className={`cust-order-status ${inv.status}`}>{inv.status}</span>
                              </div>
                            </div>
                            {(inv.items || []).length > 0 && (
                              <div className="cust-order-items">
                                {inv.items.map((item, i) => (
                                  <div key={i} className="cust-order-item">
                                    <div>
                                      <div>{item.serviceName || item.productName || "Item"}</div>
                                      {item.staffName && <div className="cust-order-item-staff">Staff: {item.staffName}</div>}
                                    </div>
                                    <div>{formatMoney(item.lineTotal)}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {Number(inv.balanceAmount || 0) > 0 && (
                              <div style={{ marginTop: "8px", padding: "4px 8px", background: "#7f1d1d", borderRadius: "6px", fontSize: "0.72rem", color: "#fca5a5" }}>
                                Balance Due: {formatMoney(inv.balanceAmount)}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {detailTab === "membership" && (
                    <div className="cust-detail-section">
                      <div className="cust-detail-section-title">Memberships ({(customerDetail.memberships || []).length})</div>
                      {(customerDetail.memberships || []).length === 0 ? (
                        <div style={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center", padding: "20px 0" }}>No memberships</div>
                      ) : (
                        (customerDetail.memberships || []).map(m => {
                          const isActive = m.status === "ACTIVE" && new Date(m.endsAt) > new Date();
                          return (
                            <div key={m.id} className="cust-membership-card">
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div className="cust-mem-name">{m.membershipPlan?.name || "Membership"}</div>
                                <span className={`cust-mem-status ${isActive ? "ACTIVE" : "EXPIRED"}`}>{isActive ? "ACTIVE" : m.status}</span>
                              </div>
                              <div className="cust-mem-meta">
                                Valid: {new Date(m.startsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })} → {new Date(m.endsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                              </div>
                              {m.remainingWalletValue != null && (
                                <div style={{ marginTop: "6px", fontSize: "0.78rem", color: "#10b981", fontWeight: 600 }}>
                                  Wallet Balance: {formatMoney(m.remainingWalletValue)}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {detailTab === "packages" && (
                    <div className="cust-detail-section">
                      <div className="cust-detail-section-title">Packages ({(customerDetail.packages || []).length})</div>
                      {(customerDetail.packages || []).length === 0 ? (
                        <div style={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center", padding: "20px 0" }}>No packages</div>
                      ) : (
                        (customerDetail.packages || []).map(p => {
                          const isActive = String(p.status) === "ACTIVE" && new Date(p.endsAt) > new Date();
                          return (
                            <div key={p.id} className="cust-pkg-card">
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div className="cust-pkg-name">{p.package?.name || "Package"}</div>
                                <span className={`cust-mem-status ${isActive ? "ACTIVE" : "EXPIRED"}`}>{isActive ? "ACTIVE" : p.status}</span>
                              </div>
                              <div className="cust-pkg-sessions">Sessions Remaining: {p.remainingSessions ?? "-"}</div>
                              <div className="cust-pkg-meta">
                                Valid: {new Date(p.startsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })} → {new Date(p.endsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                              </div>
                              {(p.package?.services || []).length > 0 && (
                                <div style={{ marginTop: "10px" }}>
                                  <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Services</div>
                                  {p.package.services.map((svc, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8", padding: "3px 0", borderBottom: "1px solid #2d3748" }}>
                                      <span>{svc.service?.name || "-"}</span>
                                      <span>{svc.sessions || 1} session{svc.sessions > 1 ? "s" : ""}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
