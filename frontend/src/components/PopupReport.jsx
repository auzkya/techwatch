import { useEffect, useRef, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAlert } from "../context/AlertContext";
import { useScrollLock } from "../hooks/useScrollLock";
import TextArea from "./TextArea";

const PopupReport = ({ isOpen, onClose, targetId, type }) => {
    const { showAlert } = useAlert();
    const [reason, setReason] = useState("");
    const [category, setCategory] = useState(""); // Nové: Kategorie důvodu
    const [loading, setLoading] = useState(false);

    // Hodnoty pro custom select
    const [isCatOpen, setIsCatOpen] = useState(false);
    const catRef = useRef(null);

    const reportOptions = [
        { value: "", label: "-- Vyberte důvod --" },
        { value: "spam", label: "Spam / Podvod" },
        { value: "inappropriate", label: "Nevhodný obsah" },
        { value: "wrong_category", label: "Špatná kategorie" },
        { value: "other", label: "Jiné" },
    ];
    // Select logika
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isCatOpen && !catRef.current?.contains(event.target))
                setIsCatOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [isCatOpen]);

    useScrollLock(isOpen);

    const getTitle = () => {
        switch (type) {
            case "items":
                return "Nahlásit inzerát";
            case "users":
                return "Nahlásit uživatele";
            case "reviews_users":
            case "reviews_items":
                return "Nahlásit recenzi";
            default:
                return "Nahlásit";
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setReason("");
            setCategory("");
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!category) {
            showAlert("error", "Vyberte kategorii nahlášení.");
            return;
        }
        if (!reason.trim()) {
            showAlert("error", "Vyplňte doplňující informace.");
            return;
        }
        if (reason.length > 400) {
            showAlert("error", "Popis je příliš dlouhý.");
            return;
        }

        setLoading(true);
        try {
            await axiosInstance.post("/api/reports", {
                target_id: targetId, // ID z props
                type: type, // 'items' | 'users' atd. z props
                category: category, // To, co uživatel vybral v radio/selectu
                reason: reason, // Dobrovolný text z textarea
            });

            showAlert("success", "Nahlášení bylo odesláno ke kontrole.");
            setReason("");
            setCategory("");
            onClose();
        } catch (err) {
            showAlert("error", "Nahlášení se nepodařilo odeslat.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="popup_container" onClick={onClose}>
            <div className="popup_big" onClick={(e) => e.stopPropagation()}>
                <div className="popup_header">
                    <h2>{getTitle()}</h2>
                    <p className="popup_header_sub">
                        Vaše nahlášení prověří admin.
                    </p>
                </div>

                <div className="form-review">
                    <div className="review-fuller">
                        <label className="body_base label-move">
                            Důvod nahlášení
                        </label>
                        <div className="custom-select-wrapper" ref={catRef}>
                            <div
                                className={`custom-select-down ${isCatOpen ? "open" : ""}`}
                                onClick={() => setIsCatOpen(!isCatOpen)}
                            >
                                <span
                                    className={`selected ${category === "" ? "gray-text" : ""}`}
                                >
                                    {reportOptions.find(
                                        (opt) => opt.value === category,
                                    )?.label || "-- Vyberte důvod --"}
                                </span>
                                <span
                                    className={`arrow ${isCatOpen ? "rotate" : ""}`}
                                >
                                    ▼
                                </span>
                            </div>

                            {isCatOpen && (
                                <div className="options-down">
                                    {reportOptions.map((opt) => (
                                        <div
                                            key={opt.value}
                                            className={`option ${category === opt.value ? "selected" : ""} ${opt.value === "" ? "gray-text" : ""}`}
                                            onClick={() => {
                                                setCategory(opt.value);
                                                setIsCatOpen(false);
                                            }}
                                        >
                                            {opt.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <label className="body_base label-move">
                            Doplňující informace
                        </label>
                        <TextArea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Popište nám prosím podrobněji, co je v nepořádku..."
                            rows="7"
                            maxLength="400"
                            required={true}
                        />
                    </div>

                    <button
                        className={`form-submit extra_space half-width center ${loading ? "loading" : ""}`}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        <p className="strong">
                            {loading ? "Odesílám..." : "Odeslat nahlášení"}
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupReport;
