import React, { useState, useEffect } from "react";
import TextArea from "./TextArea";
import { useScrollLock } from "../hooks/useScrollLock";
import axiosInstance from "../api/axiosInstance";
import { useAlert } from "../context/AlertContext";

const PopupReport = ({ isOpen, onClose, targetId, type }) => {
    const { showAlert } = useAlert();
    const [reason, setReason] = useState("");
    const [category, setCategory] = useState(""); // Nové: Kategorie důvodu
    const [loading, setLoading] = useState(false);

    useScrollLock(isOpen);

    const getTitle = () => {
        switch (type) {
            case "items": return "Nahlásit inzerát";
            case "users": return "Nahlásit uživatele";
            case "reviews_users":
            case "reviews_items": return "Nahlásit recenzi";
            default: return "Nahlásit";
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
            showAlert("error", "Prosím, vyberte kategorii nahlášení.");
            return;
        }
        if (!reason.trim()) {
            showAlert("error", "Prosím, vyplňte doplňující informace.");
            return;
        }
        if (reason.length > 500) {
            showAlert("error", "Popis je příliš dlouhý.");
            return;
        }

        setLoading(true);
        try {
            await axiosInstance.post("/api/reports", {
                target_id: targetId, // ID z props
                type: type,          // 'items' | 'users' atd. z props
                category: category, // To, co uživatel vybral v radio/selectu
                reason: reason,         // Dobrovolný text z textarea
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
                    <p className="popup_header_sub">Vaše nahlášení prověří admin.</p>
                </div>

                <div className="form-review">
                    <div className="review-fuller">
                        <label className="body_base label-move">Důvod nahlášení</label>
                        <select
                            className="form_textarea" // Použijeme stejný styl jako u inputů
                            style={{ marginBottom: "15px", height: "45px" }}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="">-- Vyberte důvod --</option>
                            <option value="spam">Spam / Podvod</option>
                            <option value="inappropriate">Nevhodný obsah / vulgarismy</option>
                            <option value="wrong_category">Špatná kategorie / informace</option>
                            <option value="other">Jiné</option>
                        </select>

                        <label className="body_base label-move">Doplňující informace</label>
                        <TextArea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Popište nám prosím podrobněji, co je v nepořádku..."
                            rows="7"
                            maxLength="500"
                        />
                    </div>

                    <button
                        className={`form-submit extra_space half-width center ${loading ? "loading" : ""}`}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        <p className="strong">{loading ? "Odesílám..." : "Odeslat nahlášení"}</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupReport;
