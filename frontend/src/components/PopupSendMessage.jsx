import React, { useState } from "react";
import TextArea from "./TextArea";
import { useScrollLock } from "../hooks/useScrollLock";
import axiosInstance from "../api/axiosInstance";
import { useAlert } from "../context/AlertContext";

const PopupSendMessage = ({ isOpen, onClose, targetId, targetName, type, techId }) => {
    const { showAlert } = useAlert();
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    useScrollLock(isOpen);

    const handleSubmit = async () => {
        if (!text.trim()) {
            showAlert("error", "Zpráva nesmí být prázdná.");
            return;
        }

        if (text.length > 500) {
            showAlert("error", "Zpráva je příliš dlouhá. Zkraťte ji prosím.");
        }
        setLoading(true);
        try {
            // Použijeme tvůj existující endpoint sendInquiry
            await axiosInstance.post("/api/notifications/send", {
                recipient_id: targetId,
                title: type === "job" ? "Pracovní nabídka" : targetName,
                message: text,
                type: type,
                tech_id: techId
            });

            showAlert("success", "Zpráva byla úspěšně odeslána.");
            setText(""); // Vyčistit formulář
            onClose();    // Zavřít popup
        } catch (err) {
            console.error(err);
            showAlert("error", "Zprávu se nepodařilo odeslat.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="popup_container" onClick={onClose}>
            <div className="popup_big" onClick={(e) => e.stopPropagation()}>
                <div className="popup_header">
                    <h2>
                        {type === "job" ? "Ozvat se s prací" : "Ozvat se na nabídku"}
                    </h2>
                    <p className="popup_header_sub">Zprávu odešleme spolu s Vašimi kontaktními údaji</p>
                </div>

                <div className="form-review">
                    <div className="review-fuller">
                        <label className="body_base label-move">Vaše zpráva</label>
                        <TextArea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Napište Vaši zprávu"
                            rows="7"
                            maxLength="500"
                        />
                    </div>

                    <button
                        className={`form-submit extra_space half-width center ${loading ? "loading" : ""}`}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        <p className="strong">{loading ? "Odesílám..." : "Odeslat zprávu"}</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupSendMessage;
