import {
    faCircleQuestion,
    faGears,
    faPeopleGroup,
    faStar,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./AdminReportTable.css";

const AdminReportTable = ({ reports, onResolve }) => {
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

    const formatDateTime = (dateString) => {
        if (!dateString) return "Neznámé";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("cs-CZ", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    const getReportUrgency = (dateString) => {
        const hoursDiff =
            (new Date() - new Date(dateString)) / (1000 * 60 * 60);
        if (hoursDiff > 48) return "urgency-high";
        if (hoursDiff > 24) return "urgency-medium";
        return "";
    };

    const typeTranslations = {
        Item: "Inzerát",
        User: "Uživatel",
        ReviewUser: "Recenze uživatele",
        ReviewItem: "Recenze inzerátu",
    };

    const getTargetIcon = (type) => {
        const model = type.split("\\").pop();
        switch (model) {
            case "User":
                return <FontAwesomeIcon icon={faPeopleGroup} />;
            case "Item":
                return <FontAwesomeIcon icon={faGears} />;
            case "ReviewUser":
            case "ReviewItem":
                return <FontAwesomeIcon icon={faStar} />;
            default:
                return <FontAwesomeIcon icon={faCircleQuestion} />;
        }
    };

    const getTargetName = (report) => {
        const target = report.target;
        if (!target) return "Smazaný obsah";
        const model = report.target_type.split("\\").pop();

        if (model === "Item") return target.title;
        if (model === "User") return `${target.first_name} ${target.last_name}`;

        // Pro recenze: Zkontrolujeme, zda máme objekt reviewer (který vrací Laravel morphWith)
        if (model.includes("Review")) {
            const reviewer = target.reviewer;
            return reviewer
                ? `Recenze od ${reviewer.first_name} ${reviewer.last_name}`
                : "Recenze (neznámý autor)";
        }

        return "Neznámý cíl";
    };

    return (
        <div className="report-table-wrapper">
            <table className="admin-custom-table">
                <thead>
                    <tr>
                        <th>Vytvořeno</th>
                        <th>Typ</th>
                        <th>Cíl nahlášení</th>
                        <th>Kategorie</th>
                        <th>Důvod (podrobně)</th>
                        <th>Nahlásil</th>
                        <th>Akce</th>
                    </tr>
                </thead>
                <tbody>
                    {reports?.map((report) => (
                        <tr
                            key={report.id}
                            className={getReportUrgency(report.created_at)}
                        >
                            <td className="col-date">
                                <div className="date-wrapper">
                                    <span className="date-main">
                                        {formatDateTime(report.created_at)}
                                    </span>
                                    <span className="date-relative">
                                        před{" "}
                                        {Math.round(
                                            (new Date() -
                                                new Date(report.created_at)) /
                                                (1000 * 60 * 60),
                                        )}{" "}
                                        h
                                    </span>
                                </div>
                            </td>
                            <td className="col-type">
                                <div className="type-badge">
                                    <i
                                        className={`fa-solid ${getTargetIcon(report.target_type)}`}
                                    ></i>
                                    {getTargetIcon(report.target_type)}
                                    <span>
                                        {(() => {
                                            const model = report.target_type
                                                .split("\\")
                                                .pop();
                                            return (
                                                typeTranslations[model] || model
                                            ); // Pokud překlad neexistuje, vrátí původní název
                                        })()}
                                    </span>
                                </div>
                            </td>
                            <td className="col-target">
                                <a
                                    href={getTargetLink(report)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="target-link"
                                >
                                    <div className="target-info">
                                        <strong>{getTargetName(report)}</strong>

                                        {/* Zobrazení striků - kontrola existence u targetu (pro User) nebo target->user (pro Item) */}
                                        {(() => {
                                            const target = report.target;
                                            if (!target) return null;

                                            // Pokud je target přímo User, vezmi to z něj, jinak zkus majitele (user/reviewer)
                                            const strikes =
                                                target.strikes_count ??
                                                target.user?.strikes_count ??
                                                target.reviewer?.strikes_count;

                                            return strikes > 0 ? (
                                                <span className="strike-warning">
                                                    <i className="fa-solid fa-triangle-exclamation"></i>{" "}
                                                    {strikes}x Strike
                                                </span>
                                            ) : null;
                                        })()}

                                        <small>
                                            {report.target?.email || // Pokud je cílem přímo User
                                                report.target?.reviewer
                                                    ?.email || // Pokud je cílem Recenze (ReviewItem/ReviewUser)
                                                report.target?.user?.email || // Pokud je cílem Inzerát (Item)
                                                "E-mail nedostupný"}
                                        </small>
                                    </div>
                                </a>
                            </td>
                            <td>
                                <span
                                    className={`badge-category ${report.report_category?.toLowerCase().replace(/\s+/g, "-")}`}
                                >
                                    {report.report_category}
                                </span>
                            </td>
                            <td className="col-reason">
                                <div className="reason-content">
                                    {report.reason || "Bez popisu"}
                                </div>
                            </td>
                            <td className="col-reporter">
                                <a
                                    href={`/user/${report.reporter?.id}/profile`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="reporter-link"
                                >
                                    <div className="reporter-info">
                                        <span>
                                            {report.reporter?.first_name}{" "}
                                            {report.reporter?.last_name}
                                        </span>
                                        <small>{report.reporter?.email}</small>
                                    </div>
                                </a>
                            </td>
                            <td className="col-actions">
                                <div className="actions-stack">
                                    <button
                                        className="btn-resolve"
                                        onClick={() =>
                                            onResolve(report, "resolve")
                                        }
                                    >
                                        Řešit
                                    </button>
                                    <button
                                        className="btn-dismiss"
                                        onClick={() =>
                                            onResolve(report, "dismiss")
                                        }
                                    >
                                        Ignorovat
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminReportTable;
