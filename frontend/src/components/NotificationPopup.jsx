import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "./NotificationPopup.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faAt } from "@fortawesome/free-solid-svg-icons";
import { format, isToday, isYesterday, isSameYear } from "date-fns";
import { cs } from "date-fns/locale";
import { ASSETS } from "../config/assets";
import { ROUTES, buildRoute } from "../routes/RouteNames";

export default function NotificationPopup({ open, onClose, notification }) {
    const navigate = useNavigate();
    if (!open || !notification) return null;

    const { sender, data, created_at, description, title, tech_info, tech_id } =
        notification;

    // Specs odesílatele
    const profile_job =
        sender?.specs?.length > 0
            ? sender.specs.map((s) => s.name).join(" | ")
            : "Uživatel TechWatch";

    // Systematický čas
    const getFormattedTimestamp = (dateStr) => {
        const date = new Date(dateStr);
        const time = format(date, "HH:mm");

        if (isToday(date)) {
            return `Dnes  ${time}`;
        } else if (isYesterday(date)) {
            return `Včera  ${time}`;
        } else if (isSameYear(date, new Date())) {
            // Např.: Pondělí 5. 2., 14:30
            const dayName = format(date, "eeee", { locale: cs });
            const capitalizedDay =
                dayName.charAt(0).toUpperCase() + dayName.slice(1);
            return `${capitalizedDay} ${format(date, "d. M.")}  ${time}`;
        } else {
            // Starší roky: 5. 2. 2024, 14:30
            return `${format(date, "d. M. yyyy")}  ${time}`;
        }
    };

    const timestamp = getFormattedTimestamp(created_at);

    // Dynamický nadpis
    const renderTitle = () => {
        // Pokud je v datech is_job_offer true, je to pracovní nabídka
        if (data?.is_job_offer) {
            return "Pracovní nabídka";
        }
        // Jinak je to odpověď na techniku (title bereme z notifikace)
        return (
            <>
                Odpověď na <span className="strong">{title}</span>
            </>
        );
    };

    const handleNavigate = (path) => {
        navigate(path);
        onClose();
    };

    const popupContent = (
        <>
            <div className="popover-backdrop" onClick={onClose}>
                <div
                    className="notification-popup"
                    role="dialog"
                    onClick={(e) => e.stopPropagation()}
                >
                    {tech_info?.image ? (
                        <div className="left-right-container">
                            <div className="left">
                                <p className="body_smallest strong date">
                                    {timestamp}
                                </p>
                                <h2>{renderTitle()}</h2>

                                <div
                                    className="profile smaller_opacity"
                                    onClick={() =>
                                        handleNavigate(
                                            buildRoute(ROUTES.USER_DETAIL, {
                                                id: sender?.id,
                                            }),
                                        )
                                    }
                                >
                                    <img
                                        className="profile_img"
                                        src={
                                            sender?.profile_image_url ||
                                            ASSETS.default_avatar
                                        }
                                        alt=""
                                    />
                                    <div className="profile_info">
                                        <h3>
                                            {sender?.first_name}{" "}
                                            {sender?.last_name}
                                        </h3>
                                        <p>{profile_job}</p>
                                    </div>
                                </div>

                                <p className="body_base message-text">
                                    {description}
                                </p>
                            </div>
                            <div className="right">
                                <img
                                    className="smaller_opacity smaller_scale"
                                    src={tech_info.image}
                                    alt={tech_info.title}
                                    onClick={() =>
                                        handleNavigate(
                                            `/tech/item/${tech_info.id}`,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="left full">
                            <p className="body_smallest strong date">
                                {timestamp}
                            </p>
                            <h2>{renderTitle()}</h2>

                            <div
                                className="profile smaller_opacity"
                                onClick={() =>
                                    handleNavigate(
                                        buildRoute(ROUTES.USER_DETAIL, {
                                            id: sender?.id,
                                        }),
                                    )
                                }
                            >
                                <img
                                    className="profile_img"
                                    src={
                                        sender?.profile_image_url ||
                                        ASSETS.default_avatar
                                    }
                                    alt=""
                                />
                                <div className="profile_info">
                                    <h3>
                                        {sender?.first_name} {sender?.last_name}
                                    </h3>
                                    <p>{profile_job}</p>
                                </div>
                            </div>

                            <p className="body_base message-text">
                                {description}
                            </p>
                        </div>
                    )}
                    <div className="contact">
                        <p className="body_base strong">KONTAKT NA ZÁJEMCE</p>
                        <div className="contact_info">
                            {/* Bod 4: Schovat telefon pokud není */}
                            {sender?.phone && (
                                <a href={`tel:${sender.phone}`}>
                                    <FontAwesomeIcon
                                        icon={faPhone}
                                        className="icon"
                                    />
                                    <p className="strong">{sender.phone}</p>
                                </a>
                            )}
                            <a href={`mailto:${sender?.email}`}>
                                <FontAwesomeIcon icon={faAt} className="icon" />
                                <p className="strong">{sender?.email}</p>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(popupContent, document.body);
}
