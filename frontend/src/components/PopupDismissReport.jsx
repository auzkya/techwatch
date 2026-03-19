import { useState } from "react";
import { useScrollLock } from "../hooks/useScrollLock";

const PopupDismissReport = ({ report, targetName, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);

    useScrollLock(!!report);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onConfirm(report.id, {
                action: 'dismiss',
                adminNote: 'Ignorováno moderátorem',
                reporterNote: ''
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const getStrikes = () => {
        const t = report.target;
        return t?.strikes_count ?? t?.user?.strikes_count ?? t?.reviewer?.strikes_count ?? 0;
    };

    return (
        <div className="popup_container" onClick={onClose}>
            <div className="popup_big" onClick={(e) => e.stopPropagation()}>
                <div className="popup_header">
                    <h2>Ignorovat nahlášení</h2>
                    <p className="popup_header_sub">
                        Cíl: <strong>{targetName}</strong> | Aktuální striky: <strong className={getStrikes() >= 2 ? "red-text" : ""}>{getStrikes()}/3</strong>
                    </p>
                </div>
                <div className="form-review" style={{textAlign:'center'}}>
                    <p>
                        Opravdu si přejete toto nahlášení ignorovat? <br />
                        <strong>Obsah zůstane zachován a nebudou provedeny žádné sankce.</strong>
                    </p>
                </div>
                <div>
                    <button
                        className={`form-submit half-width extra_space center ${loading ? "loading" : ""}`}
                        onClick={handleSubmit}
                    >
                        <p className="strong">
                            {loading ? "Zpracovávám..." : "Ignorovat"}
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupDismissReport;