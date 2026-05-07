import {
    faBan,
    faCheckDouble,
    faCircleExclamation,
    faEyeSlash,
    faGears,
    faMessage,
    faPeopleGroup,
    faStar,
    faTrash
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./AdminReportTable.css";

const AdminResolvedTable = ({ reports, onRevert }) => {
    const typeTranslations = {
        Item: "Inzerát",
        User: "Uživatel",
        ReviewUser: "Recenze uživatele",
        ReviewItem: "Recenze inzerátu",
    };

    // Definice vzhledu pilulek podle resolution_action z DB
    const actionMap = {
        delete_content: {
            label: "Smazáno",
            icon: faTrash,
            class: "action-delete",
        },
        hide_content: {
            label: "Skryto",
            icon: faEyeSlash,
            class: "action-hide",
        },
        warn_user: {
            label: "Napomenuto",
            icon: faMessage,
            class: "action-warn",
        },
        strike_user: {
            label: "Strike",
            icon: faCircleExclamation,
            class: "action-strike",
        },
        ban_user: {
            label: "Ban uživatele",
            icon: faBan,
            class: "action-ban",
        },
        dismissed: {
            label: "Ignorováno",
            icon: faEyeSlash,
            class: "action-info",
        },
        dismiss: {
            label: "Ignorováno",
            icon: faEyeSlash,
            class: "action-info",
        },
    };

    const getTargetLink = (report) => {
        const target = report.target;
        if (!target) return "#";
        const model = report.target_type.split("\\").pop();
        switch (model) {
            case "User":
                return `/user/${target.id}/${target.first_name?.toLowerCase()}-${target.last_name?.toLowerCase()}`;
            case "Item":
                return `/tech/item/${target.id}`;
            case "ReviewUser":
                return `/user/${target.reviewed_user_id}/profile#review-${target.id}`;
            case "ReviewItem":
                return `/tech/item/${target.item_id}#review-${target.id}`;
            default:
                return "#";
        }
    };

    const getTargetName = (report) => {
        const target = report.target;
        // Pokud target neexistuje vůbec (např. byl smazán natvrdo z DB), pak teprve "Smazáno"
        if (!target) return "Obsah nenávratně smazán";

        const model = report.target_type.split("\\").pop();

        if (model === "Item") return target.title;
        if (model === "User") return `${target.first_name} ${target.last_name}`;

        if (model.includes("Review")) {
            // Použijeme data z reviewer, který by měl být načten přes withTrashed
            const reviewer = target.reviewer;
            return reviewer
                ? `Recenze od ${reviewer.first_name} ${reviewer.last_name}`
                : "Recenze (autor smazán)";
        }

        return "Neznámý cíl";
    };

    return (
        <div className="report-table-wrapper resolved-table">
            <table className="admin-custom-table">
                <thead>
                    <tr>
                        <th>Vyřízeno</th>
                        <th>Typ</th>
                        <th>Cíl nahlášení</th>
                        <th>Důvod nahlášení</th>
                        <th>Nahlásil</th>
                        <th>Rozhodnutí</th>
                        <th>Odůvodnění admina</th>
                        <th>Akce</th>
                    </tr>
                </thead>
                <tbody>
                    {reports?.map((report) => {
                        // Priorita: resolution_action z DB -> status dismissed -> fallback
                        const actionKey =
                            report.resolution_action ||
                            (report.status === "dismissed"
                                ? "dismissed"
                                : "default");
                        const actionData = actionMap[actionKey] || {
                            label: "Vyřešeno",
                            icon: faCheckDouble,
                            class: "",
                        };

                        const model = report.target_type.split("\\").pop();
                        const isSoftDeleted = report.target?.deleted_at != null;

                        return (
                            <tr key={report.id} className="resolved-row">
                                <td className="col-date">
                                    <div className="date-wrapper">
                                        <span className="date-main">
                                            {report.resolved_at
                                                ? new Date(
                                                    report.resolved_at,
                                                ).toLocaleDateString("cs-CZ")
                                                : "---"}
                                        </span>
                                        <small className="resolved-by">
                                            Admin ID: {report.resolved_by}
                                        </small>
                                    </div>
                                </td>

                                <td className="col-type">
                                    <div className="type-badge">
                                        <FontAwesomeIcon
                                            icon={
                                                model === "User"
                                                    ? faPeopleGroup
                                                    : model === "Item"
                                                        ? faGears
                                                        : faStar
                                            }
                                        />
                                        <span>
                                            {typeTranslations[model] || model}
                                        </span>
                                    </div>
                                </td>

                                <td className="col-target">
                                    <div
                                        className={`target-container ${report.target?.deleted_at ? "is-deleted" : ""}`}
                                    >
                                        <a
                                            href={getTargetLink(report)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="target-link"
                                        >
                                            {report.target?.deleted_at && (
                                                <span className="reason-content">
                                                    SMAZÁNO
                                                </span>
                                            )}
                                            <strong>
                                                {getTargetName(report)}
                                            </strong>
                                        </a>
                                        <small>
                                            {report.target?.email ||
                                                report.target?.reviewer
                                                    ?.email ||
                                                report.target?.user?.email ||
                                                "E-mail nedostupný"}
                                        </small>
                                    </div>
                                </td>

                                <td className="col-report-reason reason-content">
                                    <span>
                                        {report.reason || <i>Bez důvodu</i>}
                                    </span>
                                </td>

                                <td className="col-reporter">
                                    <span>
                                        {report.reporter
                                            ? `${report.reporter.first_name} ${report.reporter.last_name}`
                                            : "Systém"}
                                    </span>
                                </td>

                                <td className="col-status">
                                    <div
                                        className={`status-pill ${actionData.class}`}
                                    >
                                        <FontAwesomeIcon
                                            icon={actionData.icon}
                                        />
                                        <span>{actionData.label}</span>
                                    </div>
                                </td>

                                <td className="col-notes">
                                    <div className="notes-stack">
                                        {!report.admin_note ? (
                                            <i className="no-note">
                                                Bez poznámky
                                            </i>
                                        ) : (
                                            <>
                                                {report.admin_note && (
                                                    <div className="note-item admin">
                                                        {report.admin_note}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>

                                <td className="col-actions">
                                    <button
                                        className="btn-revert"
                                        onClick={() => onRevert(report)}
                                    >
                                        Zvrátit
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default AdminResolvedTable;
