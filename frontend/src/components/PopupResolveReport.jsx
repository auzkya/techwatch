import {
    faBan,
    faCircleExclamation,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useScrollLock } from "../hooks/useScrollLock";
import TextArea from "./TextArea";

const PopupResolveReport = ({ report, targetName, onClose, onConfirm }) => {
    // Defaultní akce podle typu cíle
    const isUserReport = report?.target_type?.endsWith("\\User");
    const [action, setAction] = useState(
        isUserReport ? "strike_user" : "delete_content",
    );

    const [adminNote, setAdminNote] = useState("");
    const [reporterNote, setReporterNote] = useState("");
    const [loading, setLoading] = useState(false);

    useScrollLock(!!report);

    if (!report) return null;

    const getStrikes = () => {
        const t = report.target;
        return (
            t?.strikes_count ??
            t?.user?.strikes_count ??
            t?.reviewer?.strikes_count ??
            0
        );
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onConfirm(report.id, { action, adminNote, reporterNote });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    // Definice tlačítek podle typu nahlášení
    const getAvailableActions = () => {
        if (isUserReport) {
            return [
                {
                    value: "strike_user",
                    label: "Strike",
                    icon: faCircleExclamation,
                    className: "action-warning",
                },
                {
                    value: "ban_user",
                    label: "Ban",
                    icon: faBan,
                    className: "action-critical",
                },
            ];
        }
        return [
            {
                value: "delete_content",
                label: "Smazat",
                icon: faTrash,
                className: "action-delete",
            },
            {
                value: "strike_user",
                label: "Smazat + Strike",
                icon: faCircleExclamation,
                className: "action-warning",
            },
            {
                value: "ban_user",
                label: "Smazat + Ban",
                icon: faBan,
                className: "action-critical",
            },
        ];
    };

    return (
        <div className="popup_container" onClick={onClose}>
            <div className="popup_big" onClick={(e) => e.stopPropagation()}>
                <div className="popup_header">
                    <h2>Řešení nahlášení</h2>
                    <p className="popup_header_sub">
                        Cíl: <strong>{targetName}</strong> | Aktuální striky:{" "}
                        <strong className={getStrikes() >= 2 ? "red-text" : ""}>
                            {getStrikes()}/3
                        </strong>
                    </p>
                </div>

                <div className="form-review">
                    {/* Tlačítka pro výběr akce */}
                    <div
                        className="review-fuller"
                        style={{ textAlign: "center" }}
                    >
                        <label
                            className="body_base label-move"
                            style={{ marginTop: "0px" }}
                        >
                            Zvolte rozhodnutí
                        </label>
                        <div className="action-pill-group">
                            {getAvailableActions().map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`status-pill ${opt.className} ${action === opt.value ? "pill-active" : "pill-inactive"}`}
                                    onClick={() => setAction(opt.value)}
                                >
                                    <FontAwesomeIcon
                                        icon={opt.icon}
                                        style={{ fontSize: "0.9rem" }}
                                    />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="review-fuller">
                        <label
                            htmlFor="admin_note_input"
                            className="body_base label-move"
                        >
                            Odůvodnění pro nahlášeného (uvidí v
                            e-mailu/notifikaci)
                        </label>
                        <TextArea
                            id="admin_note_input"
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder={
                                action === "dismiss"
                                    ? "Proč nahlášení ignorujete?"
                                    : "Zadejte důvod vašeho rozhodnutí..."
                            }
                            rows="4"
                        />
                    </div>

                    <div className="review-fuller">
                        <label
                            htmlFor="reporter_note_input"
                            className="body_base label-move"
                        >
                            Zpětná vazba pro oznamovatele
                        </label>
                        <TextArea
                            id="reporter_note_input"
                            value={reporterNote}
                            onChange={(e) => setReporterNote(e.target.value)}
                            placeholder="Děkujeme za nahlášení..."
                            rows="3"
                        />
                    </div>
                </div>

                <div className="popup_footer">
                    <button
                        className={`form-submit half-width center extra_space ${loading ? "loading" : ""}`}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        <p className="strong">
                            {loading ? "Zpracovávám..." : "Potvrdit rozhodnutí"}
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupResolveReport;
