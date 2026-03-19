import { faAt, faPhone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { categoryMap } from "../config/CategoryMap";
import { ROUTES, buildRoute } from "../routes/RouteNames";
import makeSlug from "../utils/makeSlug";
import PopupSendMessage from "./PopupSendMessage";

import { ASSETS } from "../config/assets";
import "./UserBasicInfo.css";

const UserBasicInfo = ({
    currentUser, // info o tom, zda jsem majitel profilu/inzerátu
    profileImage,
    isActive,
    email,
    phone,
    phoneVisible,
    isTechDetail, // NOVÁ PROP: rozliší mód zobrazení
    firstName, // Jméno majitele inzerátu
    lastName, // Příjmení majitele inzerátu
    specs = [], // Specializace (pole)
    userId, // ID uživatele pro proklik na profil
    techTitle, // Název techniky (pro zobrazení v tech odpovědi na inzerát)
    techId,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);

    // LOGIKA TOOLTIPU: Určení textu podle situace
    let tooltipText = "";
    if (currentUser) {
        tooltipText = isTechDetail
            ? "Nemůžete se ozvat na vlastní inzerát"
            : "Nemůžete poslat nabídku sami sobě";
    } else if (!isActive && !isTechDetail) {
        tooltipText = "Uživatel momentálně nehledá práci";
    }
    const isUnclickable = !!tooltipText;

    // Sestavení specializací: "Osvětlovač | Stagehands"
    const formattedSpecs = specs
        .map((s) => categoryMap[s.name] || s.name)
        .join(" | ");

    const handleProfileClick = () => {
        if (userId && firstName && lastName) {
            const fullName = `${firstName}-${lastName}`;
            const slug = makeSlug(fullName).replace(/_/g, "-");

            navigate(`/user/${userId}/${slug}`, {
                state: {
                    ...location.state, // Zachová, zda jsi přišel z PRACOVNÍCI > OSVĚTLOVAČ
                    userName: `${firstName} ${lastName}`, // Předá jméno pro Path
                },
            });
        } else if (userId) {
            navigate(buildRoute(ROUTES.USER_DETAIL, { id: userId }), {
                state: { ...location.state },
            });
        }
    };

    const handleShowListings = () => {
        navigate(buildRoute(ROUTES.USER_LISTINGS, { id: userId }), {
            state: {
                ...location.state,
                userName: `${firstName} ${lastName}`, // Aby breadcrumb věděl, čí nabídky to jsou
            },
        });
    };

    // Logika pro kliknutí na "Ozvat se" - pokud je to tech detail, otevře se popup pro kontaktování ohledně inzerátu
    const handleMessageClick = () => {
        // Pokud je to můj profil nebo není aktivní/tech, nic neděláme (unclickable)
        if (currentUser || (!isActive && !isTechDetail)) return;

        setIsMessagePopupOpen(true);
    };

    return (
        <>
            <div
                className={`user_basic_info ${isTechDetail ? "tech_mode" : ""}`}
            >
                <div
                    className={`user_basic_info_profile_picture ${isTechDetail ? "small_avatar clickable" : ""}`}
                    onClick={isTechDetail ? handleProfileClick : undefined}
                >
                    <img
                        src={profileImage || ASSETS.default_avatar}
                        alt="avatar"
                    />
                </div>

                <div className="user_basic_info_details">
                    {/* 2) a 3) Jméno a specializace */}
                    {isTechDetail ? (
                        <div
                            className="owner_info clickable"
                            onClick={handleProfileClick}
                        >
                            <h3 className="owner_name">
                                {firstName} {lastName}
                            </h3>
                            {formattedSpecs && (
                                <p className="owner_specs">{formattedSpecs}</p>
                            )}
                        </div>
                    ) : (
                        <>
                            {isActive ? (
                                <h3 className="status_active">HLEDÁ PRÁCI</h3>
                            ) : (
                                <h3 className="status_inactive">
                                    NEHLEDÁ PRÁCI
                                </h3>
                            )}
                        </>
                    )}

                    {/* 4) Tlačítko Ozvat se s TOOLTIPEM */}
                    <div
                        className={`tooltip-wrapper ${isUnclickable ? "has-tooltip" : ""}`}
                    >
                        <button
                            type="button"
                            className={`form-submit ${isUnclickable ? "unclickable" : ""}`}
                            onClick={handleMessageClick}
                        >
                            <p className="strong">
                                {isTechDetail
                                    ? "Ozvat se na nabídku"
                                    : "Ozvat se s prací"}
                            </p>
                        </button>
                        {isUnclickable && (
                            <span className="tooltip-bubble">
                                {tooltipText}
                            </span>
                        )}
                    </div>

                    {/* 5) Druhé tlačítko */}
                    <button
                        className="secondary_button extra_space"
                        onClick={handleShowListings}
                    >
                        <p className="oauth_text strong">
                            {isTechDetail
                                ? "Zobrazit všechny nabídky"
                                : "Zobrazit nabídky techniky"}
                        </p>
                    </button>

                    {/* Kontakt: Email */}
                    <div className="user_basic_info_contact">
                        <FontAwesomeIcon icon={faAt} className="contact_icon" />
                        <p className="contact_text">{email}</p>
                    </div>

                    {/* Kontakt: Telefon */}
                    {phone && phoneVisible ? (
                        <div className="user_basic_info_contact">
                            <FontAwesomeIcon
                                icon={faPhone}
                                className="contact_icon"
                            />
                            <p className="contact_text">{phone}</p>
                        </div>
                    ) : null}
                </div>
            </div>
            <PopupSendMessage
                isOpen={isMessagePopupOpen}
                onClose={() => setIsMessagePopupOpen(false)}
                targetId={userId}
                targetName={
                    isTechDetail ? techTitle : `${firstName} ${lastName}`
                }
                type={isTechDetail ? "tech" : "job"}
                techId={isTechDetail ? techId : null}
            />
        </>
    );
};

export default UserBasicInfo;
