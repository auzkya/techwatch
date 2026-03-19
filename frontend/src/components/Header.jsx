import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { buildRoute, ROUTES } from "../routes/RouteNames";

import { format, isSameYear, isToday, isYesterday } from "date-fns";
import { cs } from "date-fns/locale";

import axiosInstance from "../api/axiosInstance";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { cache, CACHE_KEYS } from "../utils/cacheManager";

import {
    faBell as faBellRegular,
    faMessage as faMessageRegular,
} from "@fortawesome/free-regular-svg-icons";
import {
    faBan,
    faBell as faBellSolid,
    faCheckDouble,
    faCircleExclamation,
    faCircleUser,
    faClipboardList,
    faHeadset,
    faHeart,
    faMessage as faMessageSolid,
    faRightFromBracket,
    faStar,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Header.css";

import { ASSETS } from "../config/assets";
import makeSlug from "../utils/makeSlug";
import NotificationMessage from "./NotificationMessage";
import NotificationPopup from "./NotificationPopup";

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, setUser, accessToken } = useAuth();
    const { showAlert } = useAlert();

    // Centrální data notifikací z `NotificationContext`
    const {
        notifications,
        unreadMessagesCount,
        unreadNotifsCount,
        markAsRead,
    } = useNotifications();
    const [searchParams, setSearchParams] = useSearchParams();

    // UI Stavy pro animace a dropdowny
    const [isAnimatingMessage, setIsAnimatingMessage] = useState(false);
    const [isAnimatingBell, setIsAnimatingBell] = useState(false);
    const [openMessages, setOpenMessages] = useState(false);
    const [openNotifications, setOpenNotifications] = useState(false);
    const [openMore, setOpenMore] = useState(false);

    const messagesRef = useRef(null);
    const notificationsRef = useRef(null);
    const moreRef = useRef(null);
    const prevMessagesCount = useRef(unreadMessagesCount);
    const prevNotifsCount = useRef(unreadNotifsCount);

    // Zobrazení notifikace v popupu
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const handleNotificationClick = useCallback(
        (notification) => {
            if (!notification.is_read) {
                markAsRead(notification.id);
            }
            const slug = notification.target_slug || "u";

            if (notification.type === "review_item") {
                navigate(
                    `/tech/item/${notification.target_id}#review-${notification.target_sub_id}`,
                );
            } else if (notification.type === "review_user") {
                navigate(
                    `/user/${notification.target_id}/${slug}#review-${notification.target_sub_id}`,
                );
            } else if (notification.type === "direct_message") {
                setSelectedNotification(notification);
                setIsPopupOpen(true);
            }
            setOpenNotifications(false);
        },
        [markAsRead, navigate],
    ); // Závislosti handleNotificationClick

    // Teď už je bezpečné přidat ji do useEffectu
    useEffect(() => {
        const notifId = searchParams.get("open_notif");

        if (notifId && notifications.length > 0) {
            const targetNotif = notifications.find(
                (n) => n.id === parseInt(notifId),
            );

            if (targetNotif) {
                handleNotificationClick(targetNotif);

                searchParams.delete("open_notif");
                setSearchParams(searchParams);
            }
        }
    }, [searchParams, notifications, handleNotificationClick, setSearchParams]);
    // Pomocná funkce pro Alert Hledám práci
    const showIncompleteProfileAlert = (data) => {
        // Pokud by data byla null nebo prázdná, nastavíme fallback
        if (!data) {
            showAlert("error", "Váš profil není kompletní.");
            return;
        }

        let message = "Váš profil není kompletní.";

        // Důležité: Kontrolujeme explicitně false, aby undefined neházelo falešnou zprávu
        if (data.profileComplete === false) {
            message = (
                <span>
                    Vyplte profil{" "}
                    <Link to={buildRoute(ROUTES.EDIT_PROFILE)}>zde</Link>.
                </span>
            );
        } else if (data.hasSpecializations === false) {
            message = (
                <span>
                    Přidejte alespoň jednu specializaci{" "}
                    <Link to={buildRoute(ROUTES.EDIT_PROFILE)}>zde</Link>.
                </span>
            );
        } else if (data.hasAvatar === false) {
            message = (
                <span>
                    Nastavte si svůj profilový obrázek{" "}
                    <Link to={buildRoute(ROUTES.EDIT_PROFILE)}>zde</Link>.
                </span>
            );
        }

        showAlert("error", message);
    };
    // STAV ODVOZENÝ PÍMO Z DAT (žádný extra useState)
    const isLookingForJob = user?.active_worker_till
        ? new Date(user.active_worker_till) > new Date()
        : false;

    const searchButtonHandler = async () => {
        if (!user) return;

        const isTurningOn = !isLookingForJob;
        const previousDate = user.active_worker_till;

        // KONTROLA PŘEDEM (z Cache) - Pokud už víme, že profil je nekompletní, ani nezkoušíme API
        const eligibility = cache.getProfileEligible();
        if (
            isTurningOn &&
            eligibility &&
            (eligibility.profileComplete === false ||
                eligibility.hasSpecializations === false ||
                eligibility.hasAvatar === false)
        ) {
            showIncompleteProfileAlert(eligibility);
            return;
        }

        // OPTIMISTICKÝ UPDATE - Přepneme UI okamžitě
        // Nastavíme datum na +14 dní (při zapnutí) nebo null (při vypnutí)
        const optimisticDate = isTurningOn
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            : null;

        setUser({ ...user, active_worker_till: optimisticDate });

        try {
            const res = await axiosInstance.post(
                `/api/user/${user.id}/looking-for-job-toggle`,
            );
            const { active_worker_till } = res.data;

            // SYNCHRONIZACE S REALITOU (Backend potvrdil úspěch)
            setUser({ ...user, active_worker_till });
            cache.setActiveWorkerTill(active_worker_till);

            // Pokud to prošlo, můžeme smazat informaci o nekompletním profilu, protože teď už je asi ok
            cache.remove(CACHE_KEYS.PROFILE_ELIGIBLE);

            // Hlášky o úspěchu
            if (active_worker_till) {
                showAlert(
                    "success",
                    "Mód 'Hledám práci' byl aktivován na 14 dní.",
                );
            } else {
                showAlert("info", "Mód 'Hledám práci' byl vypnut.");
            }
        } catch (err) {
            // Vrátíme původní stav v UI
            setUser({ ...user, active_worker_till: previousDate });

            const responseData = err.response?.data;

            if (
                err.response?.status === 422 &&
                responseData?.error === "incomplete_profile"
            ) {
                cache.setProfileEligible(responseData);
                showIncompleteProfileAlert(responseData);
            } else {
                // Zpracování validačních chyb vrácených backendem
                // message může být objekt nebo pole
                let errorMsg = "Nepodařilo se změnit stav.";

                if (typeof responseData?.message === "string") {
                    errorMsg = responseData.message;
                } else if (responseData?.errors) {
                    // Pokud jsou tam validační chyby (např. od validatoru), vezmi první z nich
                    const firstError = Object.values(responseData.errors)[0];
                    errorMsg = Array.isArray(firstError)
                        ? firstError[0]
                        : "Chyba validace dat.";
                }

                showAlert("error", errorMsg);
            }
        }
    };

    // To samé pro avatar - nenechávej tam default a pak useEffect, dej to rovnou:
    const avatarPreview = user?.profile_image_url || ASSETS.default_avatar;
    useEffect(() => {
        if (unreadMessagesCount > prevMessagesCount.current) {
            setIsAnimatingMessage(true);
            setTimeout(() => setIsAnimatingMessage(false), 1000);
        }
        prevMessagesCount.current = unreadMessagesCount;
    }, [unreadMessagesCount]);

    useEffect(() => {
        if (unreadNotifsCount > prevNotifsCount.current) {
            setIsAnimatingBell(true);
            setTimeout(() => setIsAnimatingBell(false), 1000);
        }
        prevNotifsCount.current = unreadNotifsCount;
    }, [unreadNotifsCount]);
    const toggleDropdown = (type) => {
        if (type === "messages") {
            setOpenMessages(!openMessages);
            setOpenNotifications(false);
            setOpenMore(false);
        } else if (type === "notifications") {
            setOpenNotifications(!openNotifications);
            setOpenMessages(false);
            setOpenMore(false);
        } else if (type === "more") {
            setOpenMore(!openMore);
            setOpenMessages(false);
            setOpenNotifications(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                openMessages &&
                !messagesRef.current?.contains(event.target) &&
                !event.target.closest(".button-icon")
            ) {
                setOpenMessages(false);
            }
            if (
                openNotifications &&
                !notificationsRef.current?.contains(event.target) &&
                !event.target.closest(".button-icon")
            ) {
                setOpenNotifications(false);
            }
            if (
                openMore &&
                !moreRef.current?.contains(event.target) &&
                !event.target.closest(".button-icon-profile")
            ) {
                setOpenMore(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [openMessages, openNotifications, openMore]);

    const handleLogout = async () => {
        try {
            await axiosInstance.post("/api/logout");
        } catch (err) {
            console.error(err);
        } finally {
            cache.clear();
            // Místo reloadu jen navigujte a vyčistěte AuthContext (pokud to dělá setUser(null))
            setUser(null);
            window.location.href = buildRoute(ROUTES.LOGIN);
        }
    };

    // Pokud  uživatel není přihlášen, nic nevykresluj
    if (!user) return null;

    const renderMessagesWithDates = () => {
        const directMessages = notifications.filter(
            (n) => n.type === "direct_message",
        );
        const groups = {};

        directMessages.forEach((msg) => {
            const date = new Date(msg.created_at);
            let dateLabel;

            if (isToday(date)) dateLabel = "Dnes";
            else if (isYesterday(date)) dateLabel = "Včera";
            else {
                // Formát: Čt 5. 2. (nebo s rokem, pokud je starší)
                dateLabel = format(
                    date,
                    isSameYear(date, new Date()) ? "eeee d. M." : "d. M. yyyy",
                    { locale: cs },
                );
                // První písmeno velké (čt -> Čt)
                dateLabel =
                    dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
            }

            if (!groups[dateLabel]) groups[dateLabel] = [];
            groups[dateLabel].push(msg);
        });

        return Object.entries(groups).map(([label, msgs]) => (
            <div key={label} className="notification-group">
                <p className="notification-date-separator strong">{label}</p>
                {msgs.map((msg) => (
                    <NotificationMessage
                        key={msg.id}
                        id={msg.id}
                        // Použití msg.sender pro konzistentní data o odesílateli
                        image={
                            msg.sender?.profile_image_url ||
                            ASSETS.default_avatar
                        }
                        name={msg.title}
                        // KONKRÉTNÍ ČAS HH:MM pro dnešní/včerejší, jinak datum
                        date={format(new Date(msg.created_at), "HH:mm")}
                        user={`${msg.sender?.first_name} ${msg.sender?.last_name}:`}
                        text={renderNotificationDescription(msg.description)}
                        read={msg.is_read}
                        onClick={() => handleNotificationClick(msg)}
                    />
                ))}
            </div>
        ));
    };

    const renderNotificationsWithDates = () => {
        // Vše kromě direct_message
        const otherNotifs = notifications.filter(
            (n) => n.type !== "direct_message",
        );
        const groups = {};

        otherNotifs.forEach((notif) => {
            const date = new Date(notif.created_at);
            let dateLabel;

            if (isToday(date)) dateLabel = "Dnes";
            else if (isYesterday(date)) dateLabel = "Včera";
            else {
                dateLabel = format(
                    date,
                    isSameYear(date, new Date()) ? "eeee d. M." : "d. M. yyyy",
                    { locale: cs },
                );
                dateLabel =
                    dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
            }

            if (!groups[dateLabel]) groups[dateLabel] = [];
            groups[dateLabel].push(notif);
        });

        return Object.entries(groups).map(([label, items]) => (
            <div key={label} className="notification-group">
                <p className="notification-date-separator strong">{label}</p>
                {items.map((notif) => (
                    <NotificationMessage
                        key={notif.id}
                        id={notif.id}
                        // Ikona podle typu notifikace (s důrazem pro moderaci)
                        icon={(() => {
                            if (notif.type === "moderation_action") {
                                if (notif.data?.action === "revert")
                                    return (
                                        <FontAwesomeIcon
                                            icon={faHeadset}
                                            className="notif-icon-info"
                                        />
                                    );
                                if (notif.data?.action === "ban_user")
                                    return (
                                        <FontAwesomeIcon
                                            icon={faBan}
                                            className="notif-icon-critical"
                                        />
                                    );
                                if (notif.data?.action === "strike_user")
                                    return (
                                        <FontAwesomeIcon
                                            icon={faCircleExclamation}
                                            className="notif-icon-warning"
                                        />
                                    );
                                return (
                                    <FontAwesomeIcon
                                        icon={faTrash}
                                        className="notif-icon-warning"
                                    />
                                );
                            }
                            if (notif.type === "report_feedback")
                                return (
                                    <FontAwesomeIcon
                                        icon={faHeadset}
                                        className="notif-icon-info"
                                    />
                                );

                            // Původní logika pro recenze a ostatní
                            return (
                                <FontAwesomeIcon
                                    icon={
                                        notif.type === "review_item" ||
                                        notif.type === "review_user"
                                            ? faStar
                                            : faBellSolid
                                    }
                                />
                            );
                        })()}
                        name={notif.title}
                        // Stejná logika času jako u zpráv
                        date={format(new Date(notif.created_at), "HH:mm")}
                        text={renderNotificationDescription(notif.description)}
                        read={notif.is_read}
                        onClick={() => handleNotificationClick(notif)}
                    />
                ))}
            </div>
        ));
    };

    // Pomocná funkce pro formátování popisu notifikace s HTML značkami
    const renderNotificationDescription = (text) => {
        // Rozdělíme text podle "značek", které jsme si poslali z PHP
        const parts = text.split(/(<[^>]*>.*?<\/[^>]*>)/g);

        return parts.map((part, index) => {
            if (part.includes("strong")) {
                return (
                    <span key={index} className="strong">
                        {part.replace(/<[^>]*>/g, "")}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <>
            <header>
                <div className="left">
                    <img
                        className="header_logo"
                        alt="logo"
                        src={ASSETS.logo_side}
                        onClick={() => navigate("/app")}
                    />
                </div>

                <div className="right">
                    <button
                        type="button"
                        className="button-add_item"
                        onClick={() => navigate(buildRoute(ROUTES.ADD_TECH))}
                    >
                        <span>PIDAT NABÍDKU</span>
                    </button>

                    <button
                        type="button"
                        className="button-search_job"
                        onClick={searchButtonHandler}
                    >
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={isLookingForJob}
                                readOnly
                            />
                            <span className="slider round"></span>
                        </label>
                        Hledám práci
                    </button>

                    <button
                        ref={messagesRef}
                        className="button-icon"
                        onClick={() => toggleDropdown("messages")}
                    >
                        <FontAwesomeIcon
                            icon={
                                openMessages ? faMessageSolid : faMessageRegular
                            }
                            className="header_icon"
                        />
                        {unreadMessagesCount > 0 && (
                            <span
                                className={`notification-badge message-badge ${isAnimatingMessage ? "animate-badge" : ""}`}
                            ></span>
                        )}
                    </button>

                    <button
                        ref={notificationsRef}
                        className="button-icon"
                        onClick={() => toggleDropdown("notifications")}
                    >
                        <FontAwesomeIcon
                            icon={
                                openNotifications ? faBellSolid : faBellRegular
                            }
                            className="header_icon"
                        />
                        {unreadNotifsCount > 0 && (
                            <span
                                className={`notification-badge notif-badge ${isAnimatingBell ? "animate-badge" : ""}`}
                            ></span>
                        )}
                    </button>

                    <button
                        ref={moreRef}
                        className="button-icon-profile"
                        onClick={() => toggleDropdown("more")}
                    >
                        <img
                            className="header_avatar"
                            src={avatarPreview}
                            alt="avatar"
                        />
                    </button>
                </div>
            </header>

            {/* DROPDOWN: ZPRÁVY */}
            {openMessages && (
                <div
                    className="header_messages"
                    ref={messagesRef}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="header_messages_heading">
                        <p className="body_base strong">Zprávy</p>
                        <button onClick={() => markAsRead("all", "messages")}>
                            <FontAwesomeIcon
                                icon={faCheckDouble}
                                className="icon"
                            />
                            <p className="body_smallest">Přečíst vše</p>
                        </button>
                    </div>
                    <div className="messages-scroll-area">
                        {notifications.filter(
                            (n) => n.type === "direct_message",
                        ).length > 0 ? (
                            renderMessagesWithDates() // TADY voláme tu novou funkci se skupinami
                        ) : (
                            <div className="empty-notifications">
                                <p className="body_small strong">
                                    Žádné zprávy
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* DROPDOWN: OZNÁMENÍ */}
            {openNotifications && (
                <div
                    className="header_messages"
                    ref={notificationsRef}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="header_messages_heading">
                        <p className="body_base strong">Oznámení</p>
                        <button
                            onClick={() => markAsRead("all", "notifications")}
                        >
                            <FontAwesomeIcon
                                icon={faCheckDouble}
                                className="icon"
                            />
                            <p className="body_smallest">Přečíst vše</p>
                        </button>
                    </div>
                    <div className="messages-scroll-area">
                        {notifications.filter(
                            (n) => n.type !== "direct_message",
                        ).length > 0 ? (
                            renderNotificationsWithDates()
                        ) : (
                            <div className="empty-notifications">
                                <p className="body_small strong">
                                    Žádná oznámení
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* DROPDOWN: PROFIL */}
            {openMore && user && (
                <div
                    className="header_messages"
                    id="profile_popover"
                    ref={moreRef}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <button
                        className="profile_dropdown_button"
                        onClick={() => {
                            // Navigujeme čistě bez state, aby Path nevěděl o předchozím kontextu
                            navigate(
                                buildRoute(ROUTES.USER_DETAIL, {
                                    slug: `${makeSlug(user.first_name)}-${makeSlug(user.last_name)}`,
                                    id: user.id,
                                }),
                            );
                            setOpenMore(false);
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faCircleUser}
                            className="profile_dropdown_button_icon"
                        />
                        <p>Profil</p>
                    </button>

                    <button
                        className="profile_dropdown_button"
                        onClick={() => {
                            // `state` zde není potřeba; breadcrumb využije hodnoty z props
                            navigate(
                                buildRoute(ROUTES.USER_LISTINGS, {
                                    id: user.id,
                                }),
                            );
                            setOpenMore(false);
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faClipboardList}
                            className="profile_dropdown_button_icon"
                        />
                        <p>Moje nabídky</p>
                    </button>

                    <button
                        className="profile_dropdown_button"
                        onClick={() => {
                            navigate(
                                buildRoute(ROUTES.FAVOURITES, { type: "" }),
                            );
                            setOpenMore(false);
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faHeart}
                            className="profile_dropdown_button_icon"
                        />
                        <p>Uložené nabídky</p>
                    </button>

                    <button
                        className="profile_dropdown_button"
                        onClick={handleLogout}
                    >
                        <FontAwesomeIcon
                            icon={faRightFromBracket}
                            className="profile_dropdown_button_icon"
                        />
                        <p>Odhlásit se</p>
                    </button>
                </div>
            )}

            {/* POPUP: DETAIL NOTIFIKACE */}
            {selectedNotification && (
                <NotificationPopup
                    open={isPopupOpen}
                    onClose={() => {
                        setIsPopupOpen(false);
                        setSelectedNotification(null); // Vyčistíme stav po zavření
                    }}
                    notification={selectedNotification}
                />
            )}
        </>
    );
};

export default Header;
