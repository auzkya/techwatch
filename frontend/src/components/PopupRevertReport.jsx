import {
    faBan,
    faCheckDouble,
    faCircleExclamation,
    faEyeSlash,
    faMessage,
    faTrash
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useScrollLock } from "../hooks/useScrollLock";
import "./GeneralForm.css";
import TextArea from "./TextArea";

const PopupRevertReport = ({ report, targetName, onClose, onConfirm }) => {
    const [notify, setNotify] = useState(true);
    const [loading, setLoading] = useState(false);

    const [revertNote, setRevertNote] = useState("");
    const allowsOptionalNote = ["hide_content", "warn_user"].includes(report.resolution_action || report.action);

    useScrollLock(!!report);

    const getTargetLink = () => {
        const target = report?.target;
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

    if (!report) return null;

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

    const actionKey = report.resolution_action || (report.status === "dismissed" ? "dismissed" : "default");
    const currentAction = actionMap[actionKey] || {
        label: "Vyřešeno",
        icon: faCheckDouble,
        class: "action-default"
    };
    const isResolved = report.status === "resolved";
    // Detekce postihu pro label
    const hasPenalty = report.admin_note !== null;

    const getStrikes = () => {
        return report?.target?.strikes_count ?? 0;
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onConfirm(report.id, {
                notify: allowsOptionalNote ? !!revertNote : notify, // U skrytí/napomenutí notifikujeme jen pokud je text
                revertNote: revertNote || null
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="popup_container" onClick={onClose}>
            <div className="popup_big" onClick={(e) => e.stopPropagation()}>
                <div className="popup_header">
                    <h2>Zvrátit rozhodnutí</h2>
                    <p className="popup_header_sub">
                        Cíl:{" "}
                        <a
                            href={getTargetLink()}
                            target="_blank"
                            rel="noreferrer"
                            className="target-link-popuop"
                        >
                            <strong>{targetName}</strong>
                        </a>
                        {" "}| Aktuální striky:{" "}
                        <span className={`strong ${getStrikes() >= 2 ? "red-text" : ""}`}>
                            {getStrikes()}/3
                        </span>
                        {" "}| Aktuální stav:{" "}
                        <span className={`strong status-pill ${currentAction.class}`}>
                            <FontAwesomeIcon
                                icon={currentAction.icon}
                                style={{ fontSize: "0.9rem" }}
                            />
                            {currentAction.label}
                        </span>
                    </p>
                </div>

                <div className="form-review">
                    <p style={{ textAlign: "center" }}>
                        Zvrácením se nahlášení vrátí do tabulky Moderace.
                        <br></br> Pokud byl obsah smazán nebo uživatel
                        strikován/zabanován, dopady se stornujou.
                    </p>

                    {/* Standardní checkbox pro Ban/Strike/Delete */}
                    {isResolved && !allowsOptionalNote && (
                        <div
                            className="review-fuller"
                            style={{
                                justifyContent: "center",
                                display: "flex",
                                marginTop: "30px",
                            }}
                        >
                            <div className="checkbox-container">
                                <input
                                    type="checkbox"
                                    id="notify-user"
                                    name="notify-user"
                                    className="custom-checkbox"
                                    checked={notify}
                                    onChange={() => setNotify(!notify)}
                                />
                                <label
                                    htmlFor="notify-user"
                                    className="checkbox-text"
                                >
                                    <span className="strong">
                                        Informovat postihnutého uživatele{" "}
                                        {hasPenalty
                                            ? "(Aplikace + E-mail)"
                                            : "(Aplikace)"}
                                    </span>
                                    <br />
                                    <small style={{ opacity: 0.8 }}>
                                        Uživatel dostane systémovou omluvu a
                                        informaci o obnovení.
                                    </small>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Textarea pouze pro Skrytí a Napomenutí */}
                    {isResolved && allowsOptionalNote && (
                        <div className="review-fuller" style={{ marginTop: '20px' }}>
                            <label
                                htmlFor="admin_note_input"
                                className="body_base label-move"
                            >
                                Nepovinná zpráva uživateli (pokud vyplníte, odešle se notifikace):
                            </label>
                            <TextArea
                                id="admin_note_input"
                                value={revertNote}
                                onChange={(e) => setRevertNote(e.target.value)}
                                placeholder="Např.: Omlouváme se, inzerát jsme znovu prověřili a je v pořádku..."
                                rows="4"
                            />
                        </div>
                    )}
                </div>

                <div>
                    <button
                        className={`form-submit half-width extra_space center ${loading ? "loading" : ""}`}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        <p className="strong">
                            {loading ? "Zpracovávám..." : "Zvrátit"}
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupRevertReport;
