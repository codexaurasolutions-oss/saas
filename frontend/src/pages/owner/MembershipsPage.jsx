import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useSalonSettings } from "../../context/SalonSettingsContext";
import EmptyState from "../../components/EmptyState";
import { formatApiError } from "../../utils/apiError";
import ModuleTabs from "../../components/ModuleTabs";
import PageLoader from "../../components/PageLoader";
import "./MembershipsPage.css";

const emptyMembership = {
  membershipType: "Fixed", // 'Fixed' or 'Percentage'
  name: "",
  isActive: true,
  price: "",
  validityDays: "",
  renewalReminder: "",
  isSharable: false,
  applySelectedDays: false,
  applySelectedServices: false,
  description: "",
  benefits: [{ label: "", value: "" }],
  benefitType: "WALLET_VALUE", // We will set this dynamically based on membershipType
  discountValue: "",
  walletValue: "",
  serviceIds: []
};
const emptyPackage = { name: "", price: 0, totalSessions: 5, validityDays: 60, services: [], products: [], includeProducts: false };
const emptyPackageRedeem = { customerPackageId: "", serviceId: "", sessionsUsed: 1, note: "" };
const normalizeRows = (value) => Array.isArray(value) ? value : value?.items || value?.rows || [];
const normalizeBenefits = (value) => {
  const rows = Array.isArray(value) ? value : [];
  return rows.length ? rows.map((item) => ({ label: item.label || "", value: item.value || "" })) : [{ label: "", value: "" }];
};
const cleanBenefits = (value) => normalizeBenefits(value).map((item) => ({
  label: String(item.label || "").trim(),
  value: String(item.value || "").trim()
})).filter((item) => item.label);

export default function MembershipsPage() {
  const location = useLocation();
  const { id: routeId } = useParams();
  const { formatMoney } = useSalonSettings();
  const customerId = location.pathname.includes("/customers/") ? routeId : "";
  const editableMembershipId = location.pathname.includes("/admin/memberships/") && location.pathname.includes("/edit") ? routeId : "";
  const editablePackageId = location.pathname.includes("/admin/packages/") && location.pathname.includes("/edit") ? routeId : "";
  const [memberships, setMemberships] = useState([]);
  const [packages, setPackages] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const [membershipForm, setMembershipForm] = useState(emptyMembership);
  const [packageForm, setPackageForm] = useState(emptyPackage);
  const [assignMembershipForm, setAssignMembershipForm] = useState({ customerId: customerId || "", membershipPlanId: "", startsAt: "" });
  const [assignPackageForm, setAssignPackageForm] = useState({ customerId: customerId || "", packageId: "", startsAt: "" });
  const [redeemForm, setRedeemForm] = useState(emptyPackageRedeem);
  const [membershipLifecycleForm, setMembershipLifecycleForm] = useState({ customerMembershipId: "", topUpAmount: 0, upgradePlanId: "", transferCustomerId: "", note: "" });
  const [packageLifecycleForm, setPackageLifecycleForm] = useState({ customerPackageId: "", additionalSessions: 0, transferCustomerId: "", note: "" });
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);

  const applyWorkspaceData = useCallback(async ({
    membershipResponse,
    packageResponse,
    serviceResponse,
    productResponse,
    customerResponse,
    activeCustomerId = "",
    active = true,
    membershipId = editableMembershipId,
    packageId = editablePackageId
  }) => {
    if (!active) return;

    const nextMemberships = membershipResponse.status === "fulfilled" ? normalizeRows(membershipResponse.value.data) : [];
    const nextPackages = packageResponse.status === "fulfilled" ? normalizeRows(packageResponse.value.data) : [];
    const nextServices = serviceResponse.status === "fulfilled" ? normalizeRows(serviceResponse.value.data) : [];
    const nextProducts = productResponse?.status === "fulfilled" ? normalizeRows(productResponse.value.data) : [];
    const nextCustomers = customerResponse.status === "fulfilled" ? normalizeRows(customerResponse.value.data) : [];

    setMemberships(nextMemberships);
    setPackages(nextPackages);
    setServices(nextServices);
    setProducts(nextProducts);
    setCustomers(nextCustomers);

    if (activeCustomerId) {
      try {
        const historyResponse = await api.get(`/owner/customers/${activeCustomerId}/history`);
        if (!active) return;
        setSelectedCustomerHistory(historyResponse.data);
      } catch {
        if (!active) return;
        setSelectedCustomerHistory(null);
      }
    } else {
      setSelectedCustomerHistory(null);
    }

    if (membershipId) {
      try {
        const membershipDetail = await api.get(`/owner/memberships/${membershipId}`);
        if (!active) return;
        setMembershipForm({
          membershipType: membershipDetail.data.benefitType === "DISCOUNT_PERCENT" ? "Percentage" : "Fixed",
          name: membershipDetail.data.name || "",
          isActive: true, // Assuming true by default if no active flag
          description: membershipDetail.data.description || "",
          benefits: normalizeBenefits(membershipDetail.data.benefits),
          price: membershipDetail.data.price || "",
          validityDays: membershipDetail.data.validityDays || "",
          renewalReminder: "", // not in db yet?
          isSharable: false, // not in db yet?
          applySelectedDays: false,
          applySelectedServices: (membershipDetail.data.services || []).length > 0,
          benefitType: membershipDetail.data.benefitType || "WALLET_VALUE",
          discountValue: membershipDetail.data.discountValue || "",
          walletValue: membershipDetail.data.walletValue || "",
          serviceIds: (membershipDetail.data.services || []).map((item) => item.serviceId)
        });
      } catch {
        if (!active) return;
      }
    }

    if (packageId) {
      try {
        const packageDetail = await api.get(`/owner/packages/${packageId}`);
        if (!active) return;
        setPackageForm({
          name: packageDetail.data.name || "",
          price: packageDetail.data.price || 0,
          totalSessions: packageDetail.data.totalSessions || 5,
          validityDays: packageDetail.data.validityDays || 60,
          services: (packageDetail.data.services || []).map((item) => ({
            serviceId: item.serviceId,
            sessions: item.sessions || 1
          })),
          products: (packageDetail.data.products || []).map((item) => ({
            productId: item.productId,
            quantity: item.quantity || 1
          })),
          includeProducts: (packageDetail.data.products || []).length > 0
        });
      } catch {
        if (!active) return;
      }
    }

    const failedCoreLoads = [membershipResponse, packageResponse, serviceResponse, customerResponse].filter((entry) => entry.status !== "fulfilled");
    if (failedCoreLoads.length) {
      setStatus((current) => ({
        ...current,
        error: "Some memberships workspace data could not be loaded completely. Available lists are still usable."
      }));
    } else {
      setStatus((current) => ({ ...current, error: "" }));
    }
  }, [editableMembershipId, editablePackageId]);

  const loadAll = async (activeCustomerId = customerId || assignMembershipForm.customerId || assignPackageForm.customerId || "") => {
    setLoading(true);
    try {
      const [membershipResponse, packageResponse, serviceResponse, productResponse, customerResponse] = await Promise.allSettled([
        api.get("/owner/memberships"),
        api.get("/owner/packages"),
        api.get("/owner/services"),
        api.get("/owner/inventory/products"),
        api.get("/owner/customers")
      ]);
      await applyWorkspaceData({ membershipResponse, packageResponse, serviceResponse, productResponse, customerResponse, activeCustomerId });
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not load memberships, packages, customers, or services"), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [membershipResponse, packageResponse, serviceResponse, productResponse, customerResponse] = await Promise.allSettled([
          api.get("/owner/memberships"),
          api.get("/owner/packages"),
          api.get("/owner/services"),
          api.get("/owner/inventory/products"),
          api.get("/owner/customers")
        ]);
        await applyWorkspaceData({
          membershipResponse,
          packageResponse,
          serviceResponse,
          productResponse,
          customerResponse,
          activeCustomerId: customerId,
          active,
          membershipId: editableMembershipId,
          packageId: editablePackageId
        });
      } catch (error) {
        if (!active) return;
        setStatus({ error: formatApiError(error, "Could not load memberships workspace"), success: "" });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [applyWorkspaceData, customerId, editableMembershipId, editablePackageId]);

  const toggleMembershipService = (serviceId) => {
    setMembershipForm((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(serviceId) ? current.serviceIds.filter((id) => id !== serviceId) : [...current.serviceIds, serviceId]
    }));
  };

  const updateMembershipBenefit = (index, patch) => {
    setMembershipForm((current) => ({
      ...current,
      benefits: normalizeBenefits(current.benefits).map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
    }));
  };

  const addMembershipBenefit = () => {
    setMembershipForm((current) => ({
      ...current,
      benefits: [...normalizeBenefits(current.benefits), { label: "", value: "" }]
    }));
  };

  const removeMembershipBenefit = (index) => {
    setMembershipForm((current) => {
      const nextBenefits = normalizeBenefits(current.benefits).filter((_, itemIndex) => itemIndex !== index);
      return { ...current, benefits: nextBenefits.length ? nextBenefits : [{ label: "", value: "" }] };
    });
  };

  const togglePackageService = (serviceId) => {
    setPackageForm((current) => ({
      ...current,
      services: current.services.some((item) => item.serviceId === serviceId)
        ? current.services.filter((item) => item.serviceId !== serviceId)
        : [...current.services, { serviceId, sessions: 1 }]
    }));
  };

  const togglePackageProduct = (productId) => {
    setPackageForm((current) => ({
      ...current,
      products: current.products.some((item) => item.productId === productId)
        ? current.products.filter((item) => item.productId !== productId)
        : [...current.products, { productId, quantity: 1 }]
    }));
  };

  const [serviceSearch, setServiceSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const activeSection = location.pathname.includes("/packages") ? "packages" : "memberships";
  const customerMembershipMode = location.pathname.includes("/customers/") && location.pathname.includes("/memberships");
  const customerPackageMode = location.pathname.includes("/customers/") && location.pathname.includes("/packages");
  const membershipEditMode = Boolean(editableMembershipId);
  const packageEditMode = Boolean(editablePackageId);
  const customerScopeLabel = customerId ? "Customer linked" : "All customers";
  const customerPackageOptions = useMemo(
    () => (selectedCustomerHistory?.packages || []).filter((item) => item.status === "ACTIVE" && Number(item.remainingSessions || 0) > 0),
    [selectedCustomerHistory]
  );
  const effectiveCustomerPackageId = redeemForm.customerPackageId || customerPackageOptions[0]?.id || "";
  const customerOptions = customers.map((customer) => (
    <option key={customer.id} value={customer.id}>{customer.name} {customer.phone ? `- ${customer.phone}` : ""}</option>
  ));

  return (
    <div className="mem-page">
      <div className="page-shell">
      <ModuleTabs
        title="Memberships & Packages"
        description="Control recurring loyalty products, prepaid sessions, and service access in one revenue workspace."
        items={[
          { label: "Membership Plans", to: "/admin/memberships", hint: "Recurring" },
          { label: "Create Membership", to: "/admin/memberships/create", hint: "New" },
          { label: "Packages", to: "/admin/packages", hint: "Prepaid" },
          { label: "Create Package", to: "/admin/packages/create", hint: "New" },
          ...(customerId ? [
            { label: "Customer Memberships", to: `/admin/customers/${customerId}/memberships`, hint: "Assigned" },
            { label: "Customer Packages", to: `/admin/customers/${customerId}/packages`, hint: "Balance" }
          ] : [])
        ]}
        actions={customerId ? <Link to={`/admin/customers/${customerId}/history`} className="module-tab">Back to CRM</Link> : null}
      />
      <div className="settings-section-grid">
        {/* ================= COLUMN 1: LIST COLUMN (LEFT SIDE) ================= */}
        {/* Membership list (if activeSection is memberships) */}
        {activeSection === "memberships" && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
            {customerMembershipMode ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>Assigned Memberships</h3>
                {loading ? <PageLoader compact title="Loading memberships" /> : null}
                <div className="list-stack" style={{ overflowY: "auto", flex: 1 }}>
                  {(selectedCustomerHistory?.memberships || []).map((item) => (
                    <div key={item.id} className="list-item" style={{ padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "white" }}>
                      <div className="item-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>{item.membershipPlan?.name}</strong>
                        <span className="badge" style={{ fontSize: "0.7rem", background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: "20px" }}>{item.status}</span>
                      </div>
                      <div className="item-meta" style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                        Ends {String(item.endsAt).slice(0, 10)} | Wallet {formatMoney(Number(item.remainingWalletValue || 0))}
                      </div>
                      <div className="inline-actions" style={{ marginTop: "10px" }}>
                        <button type="button" className="secondary-button" onClick={() => setMembershipLifecycleForm((current) => ({ ...current, customerMembershipId: item.id }))} style={{ padding: "4px 8px", fontSize: "0.75rem" }}>Manage Lifecycle</button>
                      </div>
                    </div>
                  ))}
                  {!loading && !selectedCustomerHistory?.memberships?.length && <EmptyState title="No memberships assigned yet" message="Assign a membership to start tracking customer benefits." />}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                <div>
                  <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>Membership Plans</h3>
                  {loading ? <PageLoader compact title="Loading plans" /> : null}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "calc(100vh - 280px)", overflowY: "auto", paddingRight: "4px" }}>
                    {memberships.map((item) => {
                      const isSelected = editableMembershipId === item.id;
                      const typeLabel = item.benefitType === "DISCOUNT_PERCENT" ? "Percentage" : "Fixed";
                      return (
                        <Link
                          key={item.id}
                          to={`/admin/memberships/${item.id}/edit`}
                          style={{
                            display: "block",
                            padding: "16px 20px",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: "14px",
                            transition: "all 0.2s",
                            background: isSelected ? "#3b82f6" : "#f1f5f9",
                            color: isSelected ? "white" : "#1e293b",
                            border: isSelected ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                            boxShadow: isSelected ? "0 4px 6px -1px rgba(59, 130, 246, 0.2)" : "none"
                          }}
                        >
                          {item.name} ({typeLabel})
                        </Link>
                      );
                    })}
                    {!loading && !memberships.length && <EmptyState title="No membership plans yet" message="Create your first membership plan to launch recurring loyalty offers." />}
                  </div>
                </div>
                <div style={{ marginTop: "20px" }}>
                  <Link
                    to="/admin/memberships/create"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      padding: "12px",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "14px",
                      textDecoration: "none",
                      boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                      textAlign: "center",
                      boxSizing: "border-box"
                    }}
                  >
                    Create New Plan
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Package list (if activeSection is packages) */}
        {activeSection === "packages" && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
            {customerPackageMode ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>Assigned Packages</h3>
                {loading ? <PageLoader compact title="Loading packages" /> : null}
                <div className="list-stack" style={{ overflowY: "auto", flex: 1 }}>
                  {(selectedCustomerHistory?.packages || []).map((item) => (
                    <div key={item.id} className="list-item" style={{ padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "white" }}>
                      <div className="item-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>{item.package?.name}</strong>
                        <span className="badge" style={{ fontSize: "0.7rem", background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: "20px" }}>{item.status}</span>
                      </div>
                      <div className="item-meta" style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                        Remaining {item.remainingSessions} | Ends {String(item.endsAt).slice(0, 10)}
                      </div>
                      <div className="inline-actions" style={{ marginTop: "10px" }}>
                        <button type="button" className="secondary-button" onClick={() => setPackageLifecycleForm((current) => ({ ...current, customerPackageId: item.id }))} style={{ padding: "4px 8px", fontSize: "0.75rem" }}>Manage Lifecycle</button>
                      </div>
                    </div>
                  ))}
                  {!loading && !selectedCustomerHistory?.packages?.length && <EmptyState title="No packages assigned yet" message="Assign a package to start tracking customer prepaid sessions." />}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                <div>
                  <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>Packages</h3>
                  {loading ? <PageLoader compact title="Loading packages" /> : null}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "calc(100vh - 280px)", overflowY: "auto", paddingRight: "4px" }}>
                    {packages.map((item) => {
                      const isSelected = editablePackageId === item.id;
                      return (
                        <Link
                          key={item.id}
                          to={`/admin/packages/${item.id}/edit`}
                          style={{
                            display: "block",
                            padding: "16px 20px",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: "14px",
                            transition: "all 0.2s",
                            background: isSelected ? "#3b82f6" : "#f1f5f9",
                            color: isSelected ? "white" : "#1e293b",
                            border: isSelected ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                            boxShadow: isSelected ? "0 4px 6px -1px rgba(59, 130, 246, 0.2)" : "none"
                          }}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                    {!loading && !packages.length && <EmptyState title="No packages yet" message="Create your first package to launch prepaid session bundles." />}
                  </div>
                </div>
                <div style={{ marginTop: "20px" }}>
                  <Link
                    to="/admin/packages/create"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      padding: "12px",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "14px",
                      textDecoration: "none",
                      boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                      textAlign: "center",
                      boxSizing: "border-box"
                    }}
                  >
                    Create New Package
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= COLUMN 2: FORM/ASSIGN COLUMN (RIGHT SIDE) ================= */}
        {/* Membership Create/Edit Form (if activeSection is memberships & not customerMembershipMode) */}
        {activeSection === "memberships" && !customerMembershipMode && (
          <div style={{ background: "white", padding: "24px 32px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", height: "100%", boxSizing: "border-box", overflowY: "auto" }}>
            <h2 style={{ color: "#0f172a", margin: "0 0 16px 0", fontSize: "1.25rem", fontWeight: 700, paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              {membershipEditMode ? "Update Membership Plan" : "Create Membership Plan"}
            </h2>
            
            <form onSubmit={async (event) => {
              event.preventDefault();
              setStatus({ error: "", success: "" });
              try {
                if (!membershipForm.name.trim()) throw new Error("Membership name is required.");
                const isFixed = membershipForm.membershipType === "Fixed";
                const payload = {
                  ...membershipForm,
                  name: membershipForm.name.trim(),
                  description: membershipForm.description.trim(),
                  benefits: cleanBenefits(membershipForm.benefits),
                  price: Number(membershipForm.price),
                  validityDays: Number(membershipForm.validityDays),
                  benefitType: isFixed ? "WALLET_VALUE" : "DISCOUNT_PERCENT",
                  walletValue: isFixed ? Number(membershipForm.walletValue || 0) : 0,
                  discountValue: !isFixed ? Number(membershipForm.discountValue || 0) : 0,
                  renewalReminder: Number(membershipForm.renewalReminder || 0),
                  isSharable: membershipForm.isSharable,
                  applySelectedDays: membershipForm.applySelectedDays,
                  applySelectedServices: membershipForm.applySelectedServices,
                  serviceIds: membershipForm.applySelectedServices ? membershipForm.serviceIds : []
                };
                if (membershipEditMode) {
                  await api.patch(`/owner/memberships/${editableMembershipId}`, payload);
                } else {
                  await api.post("/owner/memberships", payload);
                }
                setMembershipForm(emptyMembership);
                await loadAll();
                setStatus({ error: "", success: membershipEditMode ? "Membership updated." : "Membership created." });
              } catch (error) {
                setStatus({ error: formatApiError(error, "Could not save membership"), success: "" });
              }
            }} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Membership Type Radio */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "8px" }}>Membership Type:</label>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem", color: "#475569", fontWeight: 500 }}>
                    <input 
                      type="radio" 
                      name="membershipType" 
                      value="Fixed" 
                      checked={membershipForm.membershipType === "Fixed"} 
                      onChange={() => setMembershipForm({ ...membershipForm, membershipType: "Fixed" })}
                      style={{ width: "18px", height: "18px", accentColor: "#3b82f6", cursor: "pointer" }}
                    />
                    Fixed
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem", color: "#475569", fontWeight: 500 }}>
                    <input 
                      type="radio" 
                      name="membershipType" 
                      value="Percentage" 
                      checked={membershipForm.membershipType === "Percentage"} 
                      onChange={() => setMembershipForm({ ...membershipForm, membershipType: "Percentage" })}
                      style={{ width: "18px", height: "18px", accentColor: "#3b82f6", cursor: "pointer" }}
                    />
                    Percentage
                  </label>
                </div>
              </div>

              {/* Name & Active */}
              <div style={{ display: "flex", gap: "24px", alignItems: "center", width: "100%" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter Name" 
                    value={membershipForm.name} 
                    onChange={(e) => setMembershipForm({ ...membershipForm, name: e.target.value })} 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box", outline: "none", background: "white" }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                  <input 
                    type="checkbox" 
                    id="membership-active-checkbox"
                    checked={membershipForm.isActive} 
                    onChange={(e) => setMembershipForm({ ...membershipForm, isActive: e.target.checked })}
                    style={{ accentColor: "#3b82f6", width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="membership-active-checkbox" style={{ fontSize: "0.88rem", fontWeight: 600, color: "#475569", cursor: "pointer" }}>Active</label>
                </div>
              </div>

              {/* Fees, Validity, Renewal Reminder */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", width: "100%" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Fees</label>
                  <input 
                    type="number" 
                    placeholder="Enter Fee" 
                    value={membershipForm.price} 
                    onChange={(e) => setMembershipForm({ ...membershipForm, price: e.target.value })} 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Validity</label>
                  <input 
                    type="number" 
                    placeholder="In Days" 
                    value={membershipForm.validityDays} 
                    onChange={(e) => setMembershipForm({ ...membershipForm, validityDays: e.target.value })} 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Renewal Reminder</label>
                  <input 
                    type="number" 
                    placeholder="In Days" 
                    value={membershipForm.renewalReminder} 
                    onChange={(e) => setMembershipForm({ ...membershipForm, renewalReminder: e.target.value })} 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
              </div>

              {/* Benefit Amount or Standard Discount */}
              {membershipForm.membershipType === "Fixed" ? (
                <div style={{ width: "calc(33.33% - 11px)" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Benefit Amount</label>
                  <input 
                    type="number" 
                    placeholder="Enter Benefit" 
                    value={membershipForm.walletValue} 
                    onChange={(e) => setMembershipForm({ ...membershipForm, walletValue: e.target.value })} 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
              ) : (
                <div style={{ width: "calc(33.33% - 11px)" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Standard Discount '%'</label>
                  <input 
                    type="number" 
                    placeholder="Enter Discount" 
                    value={membershipForm.discountValue} 
                    onChange={(e) => setMembershipForm({ ...membershipForm, discountValue: e.target.value })} 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
              )}

              {/* Toggles */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => setMembershipForm(cur => ({ ...cur, isSharable: !cur.isSharable }))}>
                  <span style={{ fontSize: "0.88rem", color: "#475569", fontWeight: 600 }}>Membership Sharable</span>
                  <div style={{ position: "relative", width: "40px", height: "22px", background: membershipForm.isSharable ? "#3b82f6" : "#cbd5e1", borderRadius: "20px", transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: "3px", left: membershipForm.isSharable ? "21px" : "3px", width: "16px", height: "16px", background: "white", borderRadius: "50%", transition: "left 0.2s" }}></div>
                  </div>
                </div>

                {membershipForm.membershipType === "Percentage" && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => setMembershipForm(cur => ({ ...cur, applySelectedDays: !cur.applySelectedDays }))}>
                      <span style={{ fontSize: "0.88rem", color: "#475569", fontWeight: 600 }}>Apply Membership For Selected Days</span>
                      <div style={{ position: "relative", width: "40px", height: "22px", background: membershipForm.applySelectedDays ? "#3b82f6" : "#cbd5e1", borderRadius: "20px", transition: "background 0.2s" }}>
                        <div style={{ position: "absolute", top: "3px", left: membershipForm.applySelectedDays ? "21px" : "3px", width: "16px", height: "16px", background: "white", borderRadius: "50%", transition: "left 0.2s" }}></div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => setMembershipForm(cur => ({ ...cur, applySelectedServices: !cur.applySelectedServices }))}>
                      <span style={{ fontSize: "0.88rem", color: "#475569", fontWeight: 600 }}>Apply Membership On Selected Services</span>
                      <div style={{ position: "relative", width: "40px", height: "22px", background: membershipForm.applySelectedServices ? "#3b82f6" : "#cbd5e1", borderRadius: "20px", transition: "background 0.2s" }}>
                        <div style={{ position: "absolute", top: "3px", left: membershipForm.applySelectedServices ? "21px" : "3px", width: "16px", height: "16px", background: "white", borderRadius: "50%", transition: "left 0.2s" }}></div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Service Selection for Percentage (If enabled) */}
              {membershipForm.membershipType === "Percentage" && membershipForm.applySelectedServices && (
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "8px" }}>Select Services</label>
                  <input 
                    type="text" 
                    placeholder="Search services..." 
                    value={serviceSearch} 
                    onChange={(e) => setServiceSearch(e.target.value)} 
                    style={{ marginBottom: "12px", padding: "8px 12px", width: "100%", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "0.8rem", outline: "none" }}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
                    {services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase())).map((service) => {
                      const isSelected = membershipForm.serviceIds.includes(service.id);
                      return (
                        <button 
                          type="button" 
                          key={service.id} 
                          onClick={() => toggleMembershipService(service.id)}
                          style={{
                            padding: "6px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                            background: isSelected ? "#3b82f6" : "white",
                            color: isSelected ? "white" : "#475569",
                            border: isSelected ? "1px solid #3b82f6" : "1px solid #cbd5e1"
                          }}
                        >
                          {service.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "10px 0" }} />

              {/* Bottom Totals */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "0.95rem", color: "#475569", fontWeight: 600 }}>
                  Total Amount To Pay: <span style={{ color: "#0f172a", fontWeight: 800, marginLeft: "6px" }}>{formatMoney(Number(membershipForm.price || 0))}</span>
                </div>
                
                {membershipForm.membershipType === "Fixed" && (
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "14px 16px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", marginTop: "8px" }}>
                    <span style={{ fontSize: "0.95rem", color: "#1e3a8a", fontWeight: 600 }}>
                      Final benefit amount is: <strong style={{ color: "#2563eb", fontWeight: 800, marginLeft: "4px" }}>{formatMoney(Number(membershipForm.price || 0) + Number(membershipForm.walletValue || 0))}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setMembershipForm(emptyMembership)} style={{ padding: "10px 24px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 32px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Save</button>
              </div>

            </form>
          </div>
        )}

        {/* Package Create/Edit Form (if activeSection is packages & not customerPackageMode) */}
        {activeSection === "packages" && !customerPackageMode && (
          <div style={{ background: "white", padding: "24px 32px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", height: "100%", boxSizing: "border-box", overflowY: "auto" }}>
            <h2 style={{ color: "#0f172a", margin: "0 0 16px 0", fontSize: "1.25rem", fontWeight: 700, paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              {packageEditMode ? "Update Package" : "Create Package"}
            </h2>
            <form onSubmit={async (event) => {
              event.preventDefault();
              setStatus({ error: "", success: "" });
              try {
                if (!packageForm.name.trim()) throw new Error("Package name is required.");
                if (!packageForm.services.length) throw new Error("Select at least one service for this package.");
                const payload = {
                  ...packageForm,
                  name: packageForm.name.trim(),
                  price: Number(packageForm.price),
                  totalSessions: Number(packageForm.totalSessions),
                  validityDays: Number(packageForm.validityDays),
                  services: packageForm.services.map((item) => ({
                    serviceId: item.serviceId,
                    sessions: Number(item.sessions || 1)
                  })),
                  products: packageForm.includeProducts ? packageForm.products.map((item) => ({
                    productId: item.productId,
                    quantity: Number(item.quantity || 1)
                  })) : []
                };
                if (packageEditMode) {
                  await api.patch(`/owner/packages/${editablePackageId}`, payload);
                } else {
                  await api.post("/owner/packages", payload);
                }
                setPackageForm(emptyPackage);
                setServiceSearch("");
                setProductSearch("");
                await loadAll();
                setStatus({ error: "", success: packageEditMode ? "Package updated." : "Package created." });
              } catch (error) {
                setStatus({ error: formatApiError(error, "Could not save package"), success: "" });
              }
            }} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Name & Active */}
              <div style={{ display: "flex", gap: "24px", alignItems: "center", width: "100%" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Package name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Bridal Package" 
                    value={packageForm.name} 
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })} 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box", outline: "none", background: "white" }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                  <input 
                    type="checkbox" 
                    id="package-active-checkbox"
                    defaultChecked={true}
                    style={{ accentColor: "#3b82f6", width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="package-active-checkbox" style={{ fontSize: "0.88rem", fontWeight: 600, color: "#475569", cursor: "pointer" }}>Active</label>
                </div>
              </div>

              {/* Price, Total Sessions, Validity */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", width: "100%" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Price</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0" 
                    value={packageForm.price} 
                    onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })} 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Total sessions</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="5" 
                    value={packageForm.totalSessions} 
                    onChange={(e) => setPackageForm({ ...packageForm, totalSessions: e.target.value })} 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Validity (Days)</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="60" 
                    value={packageForm.validityDays} 
                    onChange={(e) => setPackageForm({ ...packageForm, validityDays: e.target.value })} 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => setPackageForm(cur => ({ ...cur, includeProducts: !cur.includeProducts }))}>
                  <span style={{ fontSize: "0.88rem", color: "#475569", fontWeight: 600 }}>Does this package include physical products?</span>
                  <div style={{ position: "relative", width: "40px", height: "22px", background: packageForm.includeProducts ? "#3b82f6" : "#cbd5e1", borderRadius: "20px", transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: "3px", left: packageForm.includeProducts ? "21px" : "3px", width: "16px", height: "16px", background: "white", borderRadius: "50%", transition: "left 0.2s" }}></div>
                  </div>
                </div>
              </div>

              {/* Included Services Selection */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "8px" }}>Included Services</label>
                <input 
                  type="text" 
                  placeholder="Search services..." 
                  value={serviceSearch} 
                  onChange={(e) => setServiceSearch(e.target.value)} 
                  style={{ marginBottom: "12px", padding: "8px 12px", width: "100%", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "0.8rem", outline: "none" }}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
                  {services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase())).map((service) => {
                    const isSelected = packageForm.services.some((item) => item.serviceId === service.id);
                    return (
                      <button 
                        type="button" 
                        key={service.id} 
                        onClick={() => togglePackageService(service.id)}
                        style={{
                          padding: "6px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                          background: isSelected ? "#3b82f6" : "white",
                          color: isSelected ? "white" : "#475569",
                          border: isSelected ? "1px solid #3b82f6" : "1px solid #cbd5e1"
                        }}
                      >
                        {service.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Included Products Selection */}
              {packageForm.includeProducts && (
                <div style={{ background: "#fdf8f5", padding: "16px", borderRadius: "8px", border: "1px solid #f0e1df" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "8px" }}>Included Products</label>
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={productSearch} 
                    onChange={(e) => setProductSearch(e.target.value)} 
                    style={{ marginBottom: "12px", padding: "8px 12px", width: "100%", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "0.8rem", outline: "none" }}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
                    {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map((product) => {
                      const isSelected = packageForm.products.some((item) => item.productId === product.id);
                      return (
                        <button 
                          type="button" 
                          key={product.id} 
                          onClick={() => togglePackageProduct(product.id)}
                          style={{
                            padding: "6px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                            background: isSelected ? "#f97316" : "white",
                            color: isSelected ? "white" : "#475569",
                            border: isSelected ? "1px solid #f97316" : "1px solid #cbd5e1"
                          }}
                        >
                          {product.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "10px 0" }} />

              {/* Bottom Totals */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "0.95rem", color: "#475569", fontWeight: 600 }}>
                  Total Amount To Pay: <span style={{ color: "#0f172a", fontWeight: 800, marginLeft: "6px" }}>{formatMoney(Number(packageForm.price || 0))}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setPackageForm(emptyPackage)} style={{ padding: "10px 24px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 32px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Save</button>
              </div>

            </form>
          </div>
        )}

        {/* Assign Membership Form (if activeSection is memberships & customerMembershipMode is true) */}
        {activeSection === "memberships" && customerMembershipMode && (
          <div style={{ background: "white", padding: "24px 32px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", height: "100%", boxSizing: "border-box" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 16px 0", fontSize: "1.25rem", fontWeight: 700, paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>Assign Membership</h3>
            <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600, marginBottom: "16px" }}>{customerScopeLabel}</div>
            <form onSubmit={async (event) => {
              event.preventDefault();
              setStatus({ error: "", success: "" });
              try {
                await api.post("/owner/memberships/assign", {
                  ...assignMembershipForm,
                  customerId: customerId || assignMembershipForm.customerId,
                  startsAt: assignMembershipForm.startsAt || undefined
                });
                await loadAll(customerId || assignMembershipForm.customerId);
                setAssignMembershipForm({ customerId: customerId || "", membershipPlanId: "", startsAt: "" });
                setStatus({ error: "", success: "Membership assigned." });
              } catch (error) {
                setStatus({ error: formatApiError(error, "Could not assign membership"), success: "" });
              }
            }} style={{ display: "grid", gap: "16px", maxWidth: "480px" }}>
              {!customerId && (
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Customer</label>
                  <select value={assignMembershipForm.customerId} onChange={async (event) => {
                    const nextCustomerId = event.target.value;
                    setAssignMembershipForm((current) => ({ ...current, customerId: nextCustomerId }));
                    if (nextCustomerId) await loadAll(nextCustomerId);
                  }} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                    <option value="">Select customer</option>
                    {loading ? <option value="" disabled>Loading customers...</option> : null}
                    {customerOptions}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Membership plan</label>
                <select value={assignMembershipForm.membershipPlanId} onChange={(event) => setAssignMembershipForm((current) => ({ ...current, membershipPlanId: event.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                  <option value="">Select membership plan</option>
                  {memberships.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Starts At</label>
                <input type="date" value={assignMembershipForm.startsAt} onChange={(event) => setAssignMembershipForm((current) => ({ ...current, startsAt: event.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>
              <button style={{ padding: "10px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", marginTop: "8px" }}>Assign Membership</button>
            </form>
          </div>
        )}

        {/* Assign Package Form (if activeSection is packages & customerPackageMode is true) */}
        {activeSection === "packages" && customerPackageMode && (
          <div style={{ background: "white", padding: "24px 32px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", height: "100%", boxSizing: "border-box" }}>
            <h3 style={{ color: "#0f172a", margin: "0 0 16px 0", fontSize: "1.25rem", fontWeight: 700, paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>Assign Package</h3>
            <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600, marginBottom: "16px" }}>{customerScopeLabel}</div>
            <form onSubmit={async (event) => {
              event.preventDefault();
              setStatus({ error: "", success: "" });
              try {
                await api.post("/owner/packages/assign", {
                  ...assignPackageForm,
                  customerId: customerId || assignPackageForm.customerId,
                  startsAt: assignPackageForm.startsAt || undefined
                });
                await loadAll(customerId || assignPackageForm.customerId);
                setAssignPackageForm({ customerId: customerId || "", packageId: "", startsAt: "" });
                setStatus({ error: "", success: "Package assigned." });
              } catch (error) {
                setStatus({ error: formatApiError(error, "Could not assign package"), success: "" });
              }
            }} style={{ display: "grid", gap: "16px", maxWidth: "480px" }}>
              {!customerId && (
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Customer</label>
                  <select value={assignPackageForm.customerId} onChange={async (event) => {
                    const nextCustomerId = event.target.value;
                    setAssignPackageForm((current) => ({ ...current, customerId: nextCustomerId }));
                    if (nextCustomerId) await loadAll(nextCustomerId);
                  }} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                    <option value="">Select customer</option>
                    {loading ? <option value="" disabled>Loading customers...</option> : null}
                    {customerOptions}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Package</label>
                <select value={assignPackageForm.packageId} onChange={(event) => setAssignPackageForm((current) => ({ ...current, packageId: event.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                  <option value="">Select package</option>
                  {packages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>Starts At</label>
                <input type="date" value={assignPackageForm.startsAt} onChange={(event) => setAssignPackageForm((current) => ({ ...current, startsAt: event.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>
              <button style={{ padding: "10px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", marginTop: "8px" }}>Assign Package</button>
            </form>
          </div>
        )}
      </div>

      {activeSection === "packages" && (
        <div className="panel-card" style={{ marginTop: 18 }}>
          <h3>Redeem Package Session</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            Use this when a customer consumes prepaid sessions without a direct POS redemption flow.
          </p>
          <form onSubmit={async (event) => {
            event.preventDefault();
            setStatus({ error: "", success: "" });
            try {
              await api.post("/owner/packages/redeem", {
                ...redeemForm,
                customerPackageId: effectiveCustomerPackageId,
                sessionsUsed: Number(redeemForm.sessionsUsed)
              });
              await loadAll(customerId || assignPackageForm.customerId);
              setRedeemForm(emptyPackageRedeem);
              setStatus({ error: "", success: "Package session redeemed." });
            } catch (error) {
              setStatus({ error: formatApiError(error, "Could not redeem package"), success: "" });
            }
          }} style={{ display: "grid", gap: 10 }}>
            <label>
              <span className="muted">Customer package</span>
              <select value={effectiveCustomerPackageId} onChange={(event) => setRedeemForm((current) => ({ ...current, customerPackageId: event.target.value }))}>
              <option value="">Select customer package</option>
              {customerPackageOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.package?.name} - {selectedCustomerHistory?.name || "Customer"} ({item.remainingSessions} left)
                </option>
              ))}
            </select>
            </label>
            <label>
              <span className="muted">Service</span>
              <select value={redeemForm.serviceId} onChange={(event) => setRedeemForm((current) => ({ ...current, serviceId: event.target.value }))}>
              <option value="">Select service</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select>
            </label>
            <input type="number" min="1" value={redeemForm.sessionsUsed} onChange={(event) => setRedeemForm((current) => ({ ...current, sessionsUsed: event.target.value }))} placeholder="Sessions used" />
            <textarea rows="3" value={redeemForm.note} onChange={(event) => setRedeemForm((current) => ({ ...current, note: event.target.value }))} placeholder="Redemption note" />
            <button disabled={!customerPackageOptions.length}>Redeem Package</button>
          </form>
        </div>
      )}

      {selectedCustomerHistory && (
        <div className="settings-section-grid" style={{ marginTop: 18 }}>
          <div className="panel-card">
            <h3>Customer Membership History</h3>
            <div className="list-stack">
              {(selectedCustomerHistory.memberships || []).map((item) => (
                <div key={item.id} className="list-item">
                  <div className="item-head">
                    <strong>{item.membershipPlan?.name}</strong>
                    <span className="badge">{item.status}</span>
                  </div>
                  <div className="item-meta">Ends {String(item.endsAt).slice(0, 10)} | Wallet {Number(item.remainingWalletValue || 0).toFixed(2)}</div>
                  <div className="item-meta">Usage records {(item.usageLogs || []).length}</div>
                </div>
              ))}
              {!loading && !selectedCustomerHistory.memberships?.length && <EmptyState title="No membership history yet" message="Once memberships are assigned, customer history and usage logs will appear here." />}
            </div>
          </div>
          <div className="panel-card">
            <h3>Customer Package History</h3>
            <div className="list-stack">
              {(selectedCustomerHistory.packages || []).map((item) => (
                <div key={item.id} className="list-item">
                  <div className="item-head">
                    <strong>{item.package?.name}</strong>
                    <span className="badge">{item.status}</span>
                  </div>
                  <div className="item-meta">Remaining {item.remainingSessions} | Ends {String(item.endsAt).slice(0, 10)}</div>
                  <div className="item-meta">Usage records {(item.usageLogs || []).length}</div>
                </div>
              ))}
              {!loading && !selectedCustomerHistory.packages?.length && <EmptyState title="No package history yet" message="Assigned packages and redemption usage will appear here once active." />}
            </div>
          </div>
        </div>
      )}

      {(status.error || status.success) && (
        <div className="panel-card" style={{ marginTop: 18 }}>
          {status.error && <p className="error-text">{status.error}</p>}
          {status.success && <p className="success-text">{status.success}</p>}
        </div>
      )}

      {(customerMembershipMode || customerPackageMode) && (
        <div className="settings-section-grid" style={{ marginTop: 18 }}>
          {customerMembershipMode && (
            <div className="panel-card">
              <h3>Membership Lifecycle</h3>
              <form style={{ display: "grid", gap: 10 }}>
                <label>
              <span className="muted">Assigned membership</span>
              <select value={membershipLifecycleForm.customerMembershipId} onChange={(event) => setMembershipLifecycleForm((current) => ({ ...current, customerMembershipId: event.target.value }))}>
                  <option value="">Select assigned membership</option>
                  {(selectedCustomerHistory?.memberships || []).map((item) => (
                    <option key={item.id} value={item.id}>{item.membershipPlan?.name} - {item.status}</option>
                  ))}
                </select>
            </label>
                <label>
              <span className="muted">Wallet top-up amount</span>
              <input type="number" min="0" value={membershipLifecycleForm.topUpAmount} placeholder="Wallet top-up amount" onChange={(event) => setMembershipLifecycleForm((current) => ({ ...current, topUpAmount: event.target.value }))} />
            </label>
                <label>
              <span className="muted">Upgrade to plan</span>
              <select value={membershipLifecycleForm.upgradePlanId} onChange={(event) => setMembershipLifecycleForm((current) => ({ ...current, upgradePlanId: event.target.value }))}>
                  <option value="">Upgrade to plan</option>
                  {memberships.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
            </label>
                <label>
              <span className="muted">Transfer to another customer</span>
              <select value={membershipLifecycleForm.transferCustomerId} onChange={(event) => setMembershipLifecycleForm((current) => ({ ...current, transferCustomerId: event.target.value }))}>
                  <option value="">Transfer to another customer</option>
                  {customers.filter((customer) => customer.id !== customerId).map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                </select>
            </label>
                <textarea rows="3" value={membershipLifecycleForm.note} placeholder="Lifecycle note" onChange={(event) => setMembershipLifecycleForm((current) => ({ ...current, note: event.target.value }))} />
                <div className="inline-actions">
                  <button type="button" className="secondary-button" onClick={async () => {
                    await api.post(`/owner/customer-memberships/${membershipLifecycleForm.customerMembershipId}/renew`, { note: membershipLifecycleForm.note });
                    await loadAll(customerId);
                    setStatus({ error: "", success: "Membership renewed." });
                  }}>Renew</button>
                  <button type="button" className="secondary-button" onClick={async () => {
                    await api.post(`/owner/customer-memberships/${membershipLifecycleForm.customerMembershipId}/top-up`, {
                      amount: Number(membershipLifecycleForm.topUpAmount || 0),
                      note: membershipLifecycleForm.note
                    });
                    await loadAll(customerId);
                    setStatus({ error: "", success: "Membership top-up posted." });
                  }}>Top Up</button>
                  <button type="button" className="secondary-button" onClick={async () => {
                    await api.post(`/owner/customer-memberships/${membershipLifecycleForm.customerMembershipId}/upgrade`, {
                      membershipPlanId: membershipLifecycleForm.upgradePlanId,
                      note: membershipLifecycleForm.note
                    });
                    await loadAll(customerId);
                    setStatus({ error: "", success: "Membership upgraded." });
                  }}>Upgrade</button>
                  <button type="button" onClick={async () => {
                    await api.post(`/owner/customer-memberships/${membershipLifecycleForm.customerMembershipId}/transfer`, {
                      customerId: membershipLifecycleForm.transferCustomerId,
                      note: membershipLifecycleForm.note
                    });
                    await loadAll(customerId);
                    setStatus({ error: "", success: "Membership transferred." });
                  }}>Transfer</button>
                </div>
              </form>
            </div>
          )}

          {customerPackageMode && (
            <div className="panel-card">
              <h3>Package Lifecycle</h3>
              <form style={{ display: "grid", gap: 10 }}>
                <label>
              <span className="muted">Assigned package</span>
              <select value={packageLifecycleForm.customerPackageId} onChange={(event) => setPackageLifecycleForm((current) => ({ ...current, customerPackageId: event.target.value }))}>
                  <option value="">Select assigned package</option>
                  {(selectedCustomerHistory?.packages || []).map((item) => (
                    <option key={item.id} value={item.id}>{item.package?.name} - {item.status}</option>
                  ))}
                </select>
            </label>
                <label>
              <span className="muted">Extra sessions on renewal</span>
              <input type="number" min="0" value={packageLifecycleForm.additionalSessions} placeholder="Extra sessions on renewal" onChange={(event) => setPackageLifecycleForm((current) => ({ ...current, additionalSessions: event.target.value }))} />
            </label>
                <label>
              <span className="muted">Transfer to another customer</span>
              <select value={packageLifecycleForm.transferCustomerId} onChange={(event) => setPackageLifecycleForm((current) => ({ ...current, transferCustomerId: event.target.value }))}>
                  <option value="">Transfer to another customer</option>
                  {customers.filter((customer) => customer.id !== customerId).map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                </select>
            </label>
                <textarea rows="3" value={packageLifecycleForm.note} placeholder="Lifecycle note" onChange={(event) => setPackageLifecycleForm((current) => ({ ...current, note: event.target.value }))} />
                <div className="inline-actions">
                  <button type="button" className="secondary-button" onClick={async () => {
                    await api.post(`/owner/customer-packages/${packageLifecycleForm.customerPackageId}/renew`, {
                      additionalSessions: Number(packageLifecycleForm.additionalSessions || 0),
                      note: packageLifecycleForm.note
                    });
                    await loadAll(customerId);
                    setStatus({ error: "", success: "Package renewed." });
                  }}>Renew</button>
                  <button type="button" onClick={async () => {
                    await api.post(`/owner/customer-packages/${packageLifecycleForm.customerPackageId}/transfer`, {
                      customerId: packageLifecycleForm.transferCustomerId,
                      note: packageLifecycleForm.note
                    });
                    await loadAll(customerId);
                    setStatus({ error: "", success: "Package transferred." });
                  }}>Transfer</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {(status.error || status.success) && (
        <div className="panel-card" style={{ marginTop: 18 }}>
          {status.error && <p className="error-text">{status.error}</p>}
          {status.success && <p className="success-text">{status.success}</p>}
        </div>
      )}
    </div>
    </div>
  );
}

