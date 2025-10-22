import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import "./NotificationPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faAt } from '@fortawesome/free-solid-svg-icons';

export default function NotificationPopup({
    open,
    onClose,
    id,
    title,
    date,
    image,
    profile_name,
    profile_job,
    profile_picture,
    text,
    profile_phone,
    profile_email
}) {
    // pokud není otevřený, nic nerenderujeme
    useEffect(() => {
        if (!open) return;

        // Zavře všechny nativní popovery, pokud nějaké jsou otevřené
        // (bezpečně - jen pokud API existuje)
        try {
            document.querySelectorAll('[popover]').forEach((p) => {
                try {
                    if (p.matches(':popover-open') && typeof p.hidePopover === 'function') {
                        p.hidePopover();
                    }
                } catch (e) { /* ignore cross-origin/unsupported */ }
            });
        } catch (e) { }

        // ESC zavírání
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    const popup = (
        <>
            <div className="popover-backdrop" onClick={onClose} />
            <div
                className="notification-popup"
                id={id}
                role="dialog"
                aria-modal="true"
            >
                {image ? (
                    <>
                        <div className="left">
                            <p className="body_smallest strong date">{date}</p>
                            <h2>{title}</h2>
                            <a href="/">
                                <div className="profile">
                                    <img className="profile_img" src={profile_picture} alt={profile_name} />
                                    <div className="profile_info">
                                        <h3>{profile_name}</h3>
                                        <p>{profile_job}</p>
                                    </div>
                                </div>
                            </a>
                            <p className="body_base">{text}</p>
                        </div>
                        <div className="right">
                            <img src={image} alt={String(title)} />
                        </div>
                    </>
                ) : (
                    <div className="left full">
                        <p className="body_smallest strong date">{date}</p>
                        <h2>{title}</h2>
                        <a href="/">
                            <div className="profile">
                                <img className="profile_img" src={profile_picture} alt={profile_name} />
                                <div className="profile_info">
                                    <h3>{profile_name}</h3>
                                    <p>{profile_job}</p>
                                </div>
                            </div>
                        </a>
                        <p className="body_base">{text}</p>
                    </div>
                )}

                <div className="contact">
                    <p className="body_base strong">KONTAKT NA ZÁJEMCE</p>
                    <div className="contact_info">
                        <a href={`tel:${profile_phone}`}>
                            <FontAwesomeIcon icon={faPhone} className="icon" />
                            <p className="strong">{profile_phone}</p>
                        </a>
                        <a href={`mailto:${profile_email}`}>
                            <FontAwesomeIcon icon={faAt} className="icon" />
                            <p className="strong">{profile_email}</p>
                        </a>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(popup, document.body);
}
