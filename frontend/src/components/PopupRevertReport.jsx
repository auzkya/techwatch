import { useState } from "react";
import { useScrollLock } from "../hooks/useScrollLock";
import "./GeneralForm.css";

const PopupRevertReport = ({ report, targetName, onClose, onConfirm }) => {
    const [notify, setNotify] = useState(true);
    const [loading, setLoading] = useState(false);

    useScrollLock(!!report);

    if (!report) return null;

    const isResolved = report.status === "resolved";

    // Detekce postihu pro label
    const hasPenalty = report.admin_note !== null;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Posíláme ID reportu, boolean o notifikaci a text omluvy
            // Pokud to nebylo 'resolved', notify bude vždy false
            await onConfirm(report.id, { notify: isResolved ? notify : false });
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
                        Cíl: <strong>{targetName}</strong> | Aktuální stav:{" "}
                        <strong>
                            {report.status === "resolved"
                                ? "Vyřešeno"
                                : "Ignorováno"}
                        </strong>
                    </p>
                </div>

                <div className="form-review">
                    <p style={{ textAlign: "center" }}>
                        Zvrácením se nahlášení vrátí do stavu "Čekající".
                        <br></br> Pokud byl obsah smazán nebo uživatel
                        strikován/zabanován, akce se stornuje.
                    </p>

                    {/* Checkbox zobrazíme POUZE pokud byl report vyřešen (smazán/banován) */}
                    {isResolved && (
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
