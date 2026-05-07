import { useCallback, useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import AdminCharts from "../../components/AdminCharts";
import AdminReportTable from "../../components/AdminReportTable";
import AdminResolvedTable from "../../components/AdminResolvedTable";
import PopupDismissReport from "../../components/PopupDismissReport";
import PopupResolveReport from "../../components/PopupResolveReport";
import PopupRevertReport from "../../components/PopupRevertReport";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import { buildRoute, ROUTES } from "../../routes/RouteNames";
import { cache } from "../../utils/cacheManager";
import "./AdminDashboard.css";

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [resolvedReports, setResolvedReports] = useState([]); // State pro historii
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem("adminActiveTab") || "stats";
    });
    const [selectedReport, setSelectedReport] = useState(null);
    const [revertReport, setRevertReport] = useState(null);
    const [dismissReport, setDismissReport] = useState(null);

    const { setLoading } = useLoading();
    const { user, setUser } = useAuth();
    const { showAlert } = useAlert();

    const canViewStats = [
        "admin_viewer",
        "admin_moderator",
        "super_admin",
    ].includes(user?.role);
    const canModerate = ["admin_moderator", "super_admin"].includes(user?.role);

    useEffect(() => {
        localStorage.setItem("adminActiveTab", activeTab);
    }, [activeTab]);

    // Načítání dat (statistiky i historie)
    const fetchStats = useCallback(
        async (range = "6months") => {
            setLoading(true);
            try {
                // Spustí oba requesty paralelně
                const [statsRes, historyRes] = await Promise.all([
                    axiosInstance.get(`/api/dashboard-stats?range=${range}`),
                    axiosInstance.get("/api/admin/resolved-reports")
                ]);

                // Updatujeme stavy najednou
                setStats(statsRes.data);
                setResolvedReports(historyRes.data);
            } catch (error) {
                console.error("Chyba při načítání dat dashboardu:", error);
                showAlert("error", "Nepodařilo se synchronizovat data.");
            } finally {
                setLoading(false);
            }
        },
        [setLoading, showAlert]
    );

    useEffect(() => {
        if (canViewStats) {
            fetchStats();
        }
    }, [canViewStats]);

    const handleLogout = async () => {
        try {
            await axiosInstance.post("/api/logout");
        } catch (err) {
            console.error(err);
        } finally {
            cache.clear();
            setUser(null);
            window.location.href = buildRoute(ROUTES.LOGIN);
        }
    };

    const getTargetDisplayName = (report) => {
        if (!report?.target) return "Neznámý cíl";
        const model = report.target_type.split("\\").pop();

        switch (model) {
            case "Item":
                return report.target.title;
            case "User":
                return `${report.target.first_name} ${report.target.last_name}`;
            case "ReviewUser":
            case "ReviewItem":
                const reviewer = report.target.reviewer;
                const fullName = reviewer
                    ? `${reviewer.first_name || ""} ${reviewer.last_name || ""}`.trim()
                    : "uživatele";

                return `Recenze od ${fullName}`;
            default:
                return model;
        }
    };

    const handleResolveReport = (report, type) => {
        if (type === "dismiss") {
            setDismissReport(report);
        } else {
            setSelectedReport(report);
        }
    };

    const handleActionConfirm = async (reportId, payload) => {
        try {
            await axiosInstance.post(
                `/api/admin/reports/${reportId}/resolve`,
                payload,
            );
            showAlert("success", "Nahlášení bylo úspěšně vyřešeno.");
            fetchStats(); // Osvěžíme všechna data (včetně historie)
            setSelectedReport(null);
        } catch (err) {
            showAlert("error", "Nepodařilo se uložit rozhodnutí.");
        }
    };

    const handleRevertClick = (report) => {
        setRevertReport(report);
    };

    // Tato funkce provede skutečné volání na API po potvrzení v popupu
    const handleRevertConfirm = async (reportId, payload) => {
        setLoading(true);
        try {
            // Payload obsahuje { notify, revertNote }
            await axiosInstance.post(`/api/admin/reports/${reportId}/revert`, {
                notify: payload.notify,
                revert_note: payload.revertNote,
            });

            showAlert("success", "Akce byla úspěšně zvrácena.");
            await fetchStats(); // Refresh dat a historie
            setRevertReport(null);
        } catch (error) {
            console.error("Chyba při zvrácení:", error);
            showAlert("error", "Nepodařilo se zvrátit akci.");
        } finally {
            setLoading(false);
        }
    };

    if (!stats) return null;

    return (
        <div className="admin-container">
            <button className="admin-logout" onClick={handleLogout}>
                <p>Odhlásit se</p>
            </button>

            <header className="admin-header">
                <div className="admin-tabs">
                    {/* 1. TLAČÍTKO - STATISTIKY */}
                    <button
                        className={activeTab === "stats" ? "active" : ""}
                        onClick={() => setActiveTab("stats")}
                    >
                        <i className="fa-solid fa-chart-line"></i> Statistiky
                    </button>

                    {/* 2. TLAČÍTKO - MODERACE */}
                    {canModerate && (
                        <button
                            className={
                                activeTab === "moderation" ? "active" : ""
                            }
                            onClick={() => setActiveTab("moderation")}
                        >
                            <i className="fa-solid fa-shield-halved"></i>{" "}
                            Moderace
                            {stats?.pending_reports_count > 0 && (
                                <span className="badge">
                                    {stats.pending_reports_count}
                                </span>
                            )}
                        </button>
                    )}

                    {/* 3. TLAČÍTKO - HISTORIE */}
                    {canModerate && (
                        <button
                            className={activeTab === "history" ? "active" : ""}
                            onClick={() => setActiveTab("history")}
                        >
                            <i className="fa-solid fa-clock-rotate-left"></i>{" "}
                            Historie
                        </button>
                    )}
                </div>
            </header>

            <div className="admin-content">
                {/* SEKCE STATISTIKY */}
                {activeTab === "stats" && (
                    <div className="fade-in">
                        <div className="admin-summary-cards">
                            <div className="stat-card">
                                <span className="label">Celkem uživatelů</span>
                                <strong className="value">
                                    {stats.users_count.toLocaleString()}
                                </strong>
                            </div>
                            <div className="stat-card">
                                <span className="label">Inzeráty techniky</span>
                                <strong className="value">
                                    {stats.items_count.toLocaleString()}
                                </strong>
                            </div>
                            <div className="stat-card">
                                <span className="label">K vyřízení</span>
                                <strong className="value">
                                    {stats.pending_reports_count}
                                </strong>
                            </div>
                        </div>
                        <AdminCharts data={stats} onRangeChange={fetchStats} />
                    </div>
                )}
            </div>

            <div className="admin-content2">
                {/* SEKCE MODERACE */}
                {activeTab === "moderation" && canModerate && (
                    <div className="fade-in">
                        <div className="section-header">
                            <h3>Aktuální nahlášení</h3>
                        </div>
                        {stats.reports && stats.reports.length > 0 ? (
                            <AdminReportTable
                                reports={stats.reports}
                                onResolve={handleResolveReport}
                            />
                        ) : (
                            <div className="empty-state">
                                <i className="fa-solid fa-check-circle"></i>
                                <p
                                    className="body_base"
                                    style={{ textAlign: "center" }}
                                >
                                    Všechna nahlášení jsou vyřízena.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* SEKCE HISTORIE */}
                {activeTab === "history" && canModerate && (
                    <div className="fade-in">
                        <div className="section-header">
                            <h3>Historie rozhodnutí</h3>
                        </div>
                        {resolvedReports.length > 0 ? (
                            <AdminResolvedTable
                                reports={resolvedReports}
                                onRevert={handleRevertClick}
                            />
                        ) : (
                            <div className="empty-state">
                                <p
                                    className="body_base"
                                    style={{ textAlign: "center" }}
                                >
                                    Historie je prázdná.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Popup pro řešení */}
            {selectedReport && (
                <PopupResolveReport
                    report={selectedReport}
                    targetName={getTargetDisplayName(selectedReport)}
                    onClose={() => setSelectedReport(null)}
                    onConfirm={handleActionConfirm}
                />
            )}

            {/* Popup pro ignorování (NOVÝ) */}
            {dismissReport && (
                <PopupDismissReport
                    report={dismissReport}
                    targetName={getTargetDisplayName(dismissReport)}
                    onClose={() => setDismissReport(null)}
                    onConfirm={handleActionConfirm}
                />
            )}

            {/* Popup pro zvrácení */}
            {revertReport && (
                <PopupRevertReport
                    report={revertReport}
                    targetName={getTargetDisplayName(revertReport)}
                    onClose={() => setRevertReport(null)}
                    onConfirm={handleRevertConfirm}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
