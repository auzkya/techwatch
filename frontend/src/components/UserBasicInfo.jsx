import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAt, faPhone } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { ROUTES, buildRoute } from "../routes/RouteNames";
import { categoryMap } from "../config/CategoryMap";
import makeSlug from "../utils/makeSlug";
import PopupSendMessage from "./PopupSendMessage";

import "./UserBasicInfo.css";
import { ASSETS } from "../config/assets";

const UserBasicInfo = ({
    currentUser,    // info o tom, zda jsem majitel profilu/inzerátu
    profileImage,
    isActive,
    email,
    phone,
    phoneVisible,
    isTechDetail,   // NOVÁ PROP: rozliší mód zobrazení
    firstName,      // Jméno majitele inzerátu
    lastName,       // Příjmení majitele inzerátu
    specs = [],     // Specializace (pole)
    userId,          // ID uživatele pro proklik na profil
    techTitle,       // Název techniky (pro zobrazení v tech odpovědi na inzerát)
    techId
}) => {
    const navigate = useNavigate();
    const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);

    // Sestavení specializací: "Osvětlovač | Stagehands"
    const formattedSpecs = specs
        .map(s => categoryMap[s.name] || s.name)
        .join(" | ");

    const handleProfileClick = () => {
        if (userId && firstName && lastName) {
            // Vytvoříme slug ze jména a příjmení
            const fullName = `${firstName}-${lastName}`;
            // Pokud tvůj makeSlug dělá podtržítka, tady je přepíšeme na pomlčky
            const slug = makeSlug(fullName).replace(/_/g, "-");

            // Navigujeme na /user/ID/jmeno-prijmeni
            navigate(`/user/${userId}/${slug}`);
        } else if (userId) {
            // Fallback pro jistotu
            navigate(buildRoute(ROUTES.USER_DETAIL, { id: userId }));
        }
    };

    // Logika pro kliknutí na "Ozvat se" - pokud je to tech detail, otevře se popup pro kontaktování ohledně inzerátu
    const handleMessageClick = () => {
        // Pokud je to můj profil nebo není aktivní/tech, nic neděláme (unclickable)
        if (currentUser || (!isActive && !isTechDetail)) return;

        setIsMessagePopupOpen(true);
    };

    return (
        <>
            <div className={`user_basic_info ${isTechDetail ? "tech_mode" : ""}`}>
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
                        <div className="owner_info clickable" onClick={handleProfileClick}>
                            <h3 className="owner_name">{firstName} {lastName}</h3>
                            {formattedSpecs && <p className="owner_specs">{formattedSpecs}</p>}
                        </div>
                    ) : (
                        <>
                            {isActive ? (
                                <h3 className="status_active">HLEDÁ PRÁCI</h3>
                            ) : (
                                <h3 className="status_inactive">NEHLEDÁ PRÁCI</h3>
                            )}
                        </>
                    )}

                    {/* 4) Tlačítko Ozvat se */}
                    <button
                        type="button"
                        className={`form-submit ${(currentUser || (!isActive && !isTechDetail)) ? "unclickable" : ""}`}
                        onClick={handleMessageClick}
                    >
                        <p className="strong">
                            {isTechDetail ? "Ozvat se na nabídku" : "Ozvat se s prací"}
                        </p>
                    </button>

                    {/* 5) Druhé tlačítko */}
                    <button className="secondary_button extra_space" onClick={() => navigate(buildRoute(ROUTES.USER_LISTINGS, { id: userId }))}>
                        <p className="oauth_text strong">
                            {isTechDetail ? "Zobrazit všechny nabídky" : "Zobrazit nabídky techniky"}
                        </p>
                    </button>

                    {/* Kontakt: Email */}
                    <div className="user_basic_info_contact">
                        <FontAwesomeIcon icon={faAt} className="contact_icon" />
                        <p className="contact_text">{email}</p>
                    </div>

                    {/* Kontakt: Telefon */}
                    {(phoneVisible && phone) || currentUser ? (
                        <div className="user_basic_info_contact">
                            <FontAwesomeIcon icon={faPhone} className="contact_icon" />
                            <p className="contact_text">{phone}</p>
                        </div>
                    ) : null}
                </div>
            </div>
            <PopupSendMessage
                isOpen={isMessagePopupOpen}
                onClose={() => setIsMessagePopupOpen(false)}
                targetId={userId}
                targetName={isTechDetail ? techTitle : `${firstName} ${lastName}`}
                type={isTechDetail ? "tech" : "job"}
                techId={isTechDetail ? techId : null}
            />
        </>
    );
}

export default UserBasicInfo;
