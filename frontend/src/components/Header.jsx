import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ROUTES, buildRoute } from "../routes/RouteNames";

import "./Header.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage as faMessageRegular, faBell as faBellRegular, faHeart as faHeartRegular, faCircleUser } from '@fortawesome/free-regular-svg-icons';
import { faMessage as faMessageSolid, faBell as faBellSolid, faCheckDouble, faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';

import NotificationMessage from "./NotificationMessage";
import NotificationPopup from "./NotificationPopup";

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const addButtonHandler = () => {
        console.log('přesměruj na přidání nabídky')
    }

    const [lookingForJob, setLookingForJob] = useState(false);
    const searchButtonHandler = () => {
        if (lookingForJob === false) {
            console.log("zapni mód HLEDÁM PRÁCI");
            setLookingForJob(true);
        } else {
            console.log("vypni mód HLEDÁM PRÁCI");
            setLookingForJob(false);
        }
    };

    const [openMessages, setOpenMessages] = useState(false);
    const [openNotifications, setOpenNotifications] = useState(false);
    const [openMore, setOpenMore] = useState(false);

    // State pro otevření dropdown popoveru
    const [, setopenDropdownId] = useState(null);

    const toggleDropdown = (id) => {
        setopenDropdownId(prev => (prev === id ? null : id));
    };

    // State pro otevření popoveru s detailem zprávy
    const [openPopupId, setopenPopupId] = useState(false);


    const closeAll = () => {
        if (openMessages === true) {
            setOpenMessages(false);
        }
        if (openNotifications === true) {
            setOpenNotifications(false);
        }
        if (openMore === true) {
            setOpenMore(false);
        }
        setopenDropdownId(null);
        setopenPopupId(false);
    };

    // Kontrola, zda jsme na stránce Favourites
    const isFavouritesActive =
        location.pathname === "/favourites" ||
        location.pathname.startsWith("/favourites/");

    return (
        <>
            <header>
                <div className="left">
                    <img className="header_logo" alt="logo" src={require("../assets/img_not_compressed/techwatch_logo_2.png")} onClick={() => navigate(buildRoute(ROUTES.HOME))} />
                </div>
                <div className="right">
                    <button type="button" className="button-add_item" onClick={addButtonHandler}>
                        PŘIDAT NABÍDKU
                    </button>
                    <button type="button" className="button-search_job" onClick={searchButtonHandler}>
                        <label className="switch">
                            <input type="checkbox" checked={lookingForJob} readOnly />
                            <span className="slider round"></span>
                        </label>HLEDÁM PRÁCI
                    </button>
                    <button className="button-icon" onClick={() => { setOpenMessages((prev) => !prev); closeAll(); toggleDropdown("messages"); }}><FontAwesomeIcon icon={openMessages ? faMessageSolid : faMessageRegular} className="header_icon" /></button>
                    <button className="button-icon" onClick={() => { setOpenNotifications((prev) => !prev); closeAll(); toggleDropdown("notifications") }}><FontAwesomeIcon icon={openNotifications ? faBellSolid : faBellRegular} className="header_icon" /></button>
                    <button className="button-icon" onClick={() => { closeAll(); navigate(buildRoute(ROUTES.FAVOURITES, { type: "" })); console.log(isFavouritesActive); }}><FontAwesomeIcon icon={isFavouritesActive ? faHeartSolid : faHeartRegular} className="header_icon" /></button>
                    <button className="button-icon" onClick={() => { setOpenMore((prev) => !prev); closeAll(); toggleDropdown("more")}}><FontAwesomeIcon icon={faCircleUser} className="profile" /></button>
                </div>
            </header>

            {/* Popovery pro jednotlivé zprávy */}
            <NotificationPopup
                id="message_1"
                open={openPopupId === "message_1"}
                onClose={() => setopenPopupId(false)}
                title={
                    <>
                        Odpověď na{" "}
                        <span className="strong">Beamz Revod 9</span>
                    </>
                }
                date="21. června"
                image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiNbd0ztS3lDazPLM1H-rbz5Kq_ugknuPRJhNZrwpjrcjIjg1b6ztWBqjvepnFQoVNKww&usqp=CAU"
                profile_name="Štěpán Hejzlar"
                profile_job={"Osvětlovač | Jevištní technik | Šéf techniky"}
                profile_picture="https://tyhle.cz/images/og/un.jpg"
                text="Ahoj, potřeboval bych tohle světlo od 28. do 29. června, šlo by se domluvit?"
                profile_phone="+420 123 456 789"
                profile_email="stepan.hejzlar@vzlet.cz"
            />
            <NotificationPopup
                id="message_2"
                open={openPopupId === "message_2"}
                onClose={() => setopenPopupId(false)}
                title={
                    <>
                        Odpověď na{" "}
                        <span className="strong">Reflektor ETC Source Four</span>
                    </>
                }
                date="15. dubna"
                image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiNbd0ztS3lDazPLM1H-rbz5Kq_ugknuPRJhNZrwpjrcjIjg1b6ztWBqjvepnFQoVNKww&usqp=CAU"
                profile_name="Štěpán Hejzlar"
                profile_job={"Osvětlovač | Jevištní technik | Šéf techniky"}
                profile_picture="https://tyhle.cz/images/og/un.jpg"
                text="Ahoj, bylo by možné si půjčit tohle světlo na jednu akci 20. června? Děkuju moc za odpověď!"
                profile_phone="+420 123 456 789"
                profile_email="stepan.hejzlar@vzlet.cz"
            />
            <NotificationPopup
                id="message_3"
                open={openPopupId === "message_3"}
                onClose={() => setopenPopupId(false)}
                title={
                    <>
                        Odpověď na{" "}
                        <span className="strong">Pracovní nabídku</span>
                    </>
                }
                date="10. června"
                image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiNbd0ztS3lDazPLM1H-rbz5Kq_ugknuPRJhNZrwpjrcjIjg1b6ztWBqjvepnFQoVNKww&usqp=CAU"
                profile_name="Štěpán Hejzlar"
                profile_job={"Osvětlovač | Jevištní technik | Šéf techniky"}
                profile_picture="https://tyhle.cz/images/og/un.jpg"
                text="Ahoj, vypadl nám na zítřek technik, máš čas?"
                profile_phone="+420 123 456 789"
                profile_email="stepan.hejzlar@vzlet.cz"
            />
            <NotificationPopup
                id="message_4"
                open={openPopupId === "message_4"}
                onClose={() => setopenPopupId(false)}
                title={
                    <>
                        Odpověď na{" "}
                        <span className="strong">Pracovní nabídku</span>
                    </>
                }
                date="3. června"
                image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiNbd0ztS3lDazPLM1H-rbz5Kq_ugknuPRJhNZrwpjrcjIjg1b6ztWBqjvepnFQoVNKww&usqp=CAU"
                profile_name="Václav Hruška"
                profile_job={"Osvětlovač | Šéf techniky"}
                profile_picture="https://static.goout.cloud/studiohrdinucz/2019/09/3394605d-sh_portrety_4x5_web015-819x1024.jpg"
                text="Ahoj, vypadl nám na zítřek technik, máš čas?"
                profile_phone="+420 420 420 420"
                profile_email="vaslav.hruska@studiohrdinu.cz"
            />

            {/* Dropdowny pro zprávy, notifikace a profil */}
            {openMessages && (
                <>
                    <div className="dropdown-backdrop" onClick={() => setOpenMessages(false)} />
                    <div className="header_messages" >
                        <div className="header_messages_heading">
                            <p className="body_base strong">
                                Zprávy
                            </p>
                            <button>
                                <FontAwesomeIcon icon={faCheckDouble} className="icon" />
                                <p className="body_smallest">Označit vše jako přečtené</p>
                            </button>
                        </div>

                        <NotificationMessage
                            id="message_1"
                            image="https://tyhle.cz/images/og/un.jpg"
                            name="Beamz Revo 9"
                            date="21. června"
                            user={"Štěpán Hejzlar:"}
                            text={
                                <>
                                    Ahoj, potřeboval bych tohle světlo od 28. do 29. června, šlo by se domluvit? Potřeboval bych tohle světlo od 28. do 29. června, šlo by se domluvit?
                                </>
                            }
                            read={false}
                            onClick={(id) => {
                                setopenPopupId(id);
                                console.log("Kliknul jsi na " + id);
                            }}
                        />
                        <NotificationMessage
                            id="message_2"
                            image="https://tyhle.cz/images/og/un.jpg"
                            name="Reflektor ETC Source Four"
                            date="15. dubna"
                            user={"Štěpán Hejzlar:"}
                            text={
                                <>
                                    Ahoj, bylo by možné si půjčit tohle světlo na jednu akci 20. června? Děkuju moc za odpověď!
                                </>
                            }
                            read={true}
                            onClick={(id) => {
                                setopenPopupId(id);
                                console.log("Kliknul jsi na " + id);
                            }}
                        />
                        <NotificationMessage
                            id="message_3"
                            image="https://tyhle.cz/images/og/un.jpg"
                            name="Pracovní nabídka"
                            date="10. června"
                            user={"Štěpán Hejzlar:"}
                            text={
                                <>
                                    Ahoj, vypadl nám na zítřek technik, máš čas?
                                </>
                            }
                            read={true}
                            onClick={(id) => {
                                setopenPopupId(id);
                                console.log("Kliknul jsi na " + id);
                            }}
                        />
                        <NotificationMessage
                            id="message_4"
                            image="https://static.goout.cloud/studiohrdinucz/2019/09/3394605d-sh_portrety_4x5_web015-819x1024.jpg"
                            name="Pracovní nabídka"
                            date="3. června"
                            user={"Václav Hruška:"}
                            text={
                                <>
                                    Ahoj, vypadl nám na zítřek technik, máš čas?
                                </>
                            }
                            read={true}
                            onClick={(id) => {
                                setopenPopupId(id);
                                console.log("Kliknul jsi na " + id);
                            }}
                        />
                        <NotificationMessage
                            id="message_1"
                            image="https://tyhle.cz/images/og/un.jpg"
                            name="Beamz Revo 9"
                            date="21. června"
                            user={"Štěpán Hejzlar:"}
                            text={
                                <>
                                    Ahoj, potřeboval bych tohle světlo od 28. do 29. června, šlo by se domluvit? Potřeboval bych tohle světlo od 28. do 29. června, šlo by se domluvit?
                                </>
                            }
                            read={false}
                            onClick={(id) => {
                                setopenPopupId(id);
                                console.log("Kliknul jsi na " + id);
                            }}
                        />
                        <NotificationMessage
                            id="message_2"
                            image="https://tyhle.cz/images/og/un.jpg"
                            name="Reflektor ETC Source Four"
                            date="15. dubna"
                            user={"Štěpán Hejzlar:"}
                            text={
                                <>
                                    Ahoj, bylo by možné si půjčit tohle světlo na jednu akci 20. června? Děkuju moc za odpověď!
                                </>
                            }
                            read={true}
                            onClick={(id) => {
                                setopenPopupId(id);
                                console.log("Kliknul jsi na " + id);
                            }}
                        />
                        <NotificationMessage
                            id="message_3"
                            image="https://tyhle.cz/images/og/un.jpg"
                            name="Pracovní nabídka"
                            date="10. června"
                            user={"Štěpán Hejzlar:"}
                            text={
                                <>
                                    Ahoj, vypadl nám na zítřek technik, máš čas?
                                </>
                            }
                            read={true}
                            onClick={(id) => {
                                setopenPopupId(id);
                                console.log("Kliknul jsi na " + id);
                            }}
                        />
                        <NotificationMessage
                            id="message_4"
                            image="https://static.goout.cloud/studiohrdinucz/2019/09/3394605d-sh_portrety_4x5_web015-819x1024.jpg"
                            name="Pracovní nabídka"
                            date="3. června"
                            user={"Václav Hruška:"}
                            text={
                                <>
                                    Ahoj, vypadl nám na zítřek technik, máš čas?
                                </>
                            }
                            read={true}
                            onClick={(id) => {
                                setopenPopupId(id);
                                console.log("Kliknul jsi na " + id);
                            }}
                        />

                    </div>
                </>
            )}
            {openNotifications && (
                <>
                    <div className="dropdown-backdrop" onClick={() => setOpenNotifications(false)} />
                    <div className="header_messages">
                        <div className="header_messages_heading">
                            <p className="body_base strong">
                                Oznámení
                            </p>
                            <button>
                                <FontAwesomeIcon icon={faCheckDouble} className="icon" />
                                <p className="body_smallest">Označit vše jako přečtené</p>
                            </button>
                        </div>

                        <NotificationMessage
                            icon={<FontAwesomeIcon icon={faMessageRegular} />}
                            name="Hodnocení"
                            date="21. června"
                            text={
                                <>
                                    Štěpán Hejzlar ohodnotil Vaši{" "}
                                    <a href="/">nabídku</a>.
                                </>
                            }
                            read={false}
                            onClick={() => console.log("Kliknul jsi na notifikaci")}
                        />
                        <NotificationMessage
                            icon={<FontAwesomeIcon icon={faMessageRegular} />}
                            name="Oblíbené"
                            date="15. dubna"
                            text={
                                <>
                                    Václav Hruška si přidal Vaši nabídku do{" "}
                                    <a href="/">oblíbených</a>.
                                </>
                            }
                            read={true}
                            onClick={() => console.log("Kliknul jsi na notifikaci")}
                        />
                        <NotificationMessage
                            icon={<FontAwesomeIcon icon={faMessageRegular} />}
                            name="Oblíbené"
                            date="15. dubna"
                            text={
                                <>
                                    Václav Hruška si přidal Vaši nabídku do{" "}
                                    <a href="/">oblíbených</a>.
                                </>
                            }
                            read={true}
                            onClick={() => console.log("Kliknul jsi na notifikaci")}
                        />
                        <NotificationMessage
                            icon={<FontAwesomeIcon icon={faMessageRegular} />}
                            name="Oblíbené"
                            date="15. dubna"
                            text={
                                <>
                                    Václav Hruška si přidal Vaši nabídku do{" "}
                                    <a href="/">oblíbených</a>.
                                </>
                            }
                            read={true}
                            onClick={() => console.log("Kliknul jsi na notifikaci")}
                        />
                        <NotificationMessage
                            icon={<FontAwesomeIcon icon={faMessageRegular} />}
                            name="Oblíbené"
                            date="15. dubna"
                            text={
                                <>
                                    Václav Hruška si přidal Vaši nabídku do{" "}
                                    <a href="/">oblíbených</a>.
                                </>
                            }
                            read={true}
                            onClick={() => console.log("Kliknul jsi na notifikaci")}
                        />
                        <NotificationMessage
                            icon={<FontAwesomeIcon icon={faMessageRegular} />}
                            name="Oblíbené"
                            date="15. dubna"
                            text={
                                <>
                                    Václav Hruška si přidal Vaši nabídku do{" "}
                                    <a href="/">oblíbených</a>.
                                </>
                            }
                            read={true}
                            onClick={() => console.log("Kliknul jsi na notifikaci")}
                        />
                        <NotificationMessage
                            icon={<FontAwesomeIcon icon={faMessageRegular} />}
                            name="Oblíbené"
                            date="15. dubna"
                            text={
                                <>
                                    Václav Hruška si přidal Vaši nabídku do{" "}
                                    <a href="/">oblíbených</a>.
                                </>
                            }
                            read={true}
                            onClick={() => console.log("Kliknul jsi na notifikaci")}
                        />
                        <NotificationMessage
                            icon={<FontAwesomeIcon icon={faMessageRegular} />}
                            name="Oblíbené"
                            date="15. dubna"
                            text={
                                <>
                                    Václav Hruška si přidal Vaši nabídku do{" "}
                                    <a href="/">oblíbených</a>.
                                </>
                            }
                            read={true}
                            onClick={() => console.log("Kliknul jsi na notifikaci")}
                        />
                    </div>
                </>
            )}
            {openMore && (
                <>
                    <div className="dropdown-backdrop" onClick={() => setOpenMore(false)} />
                    <div className="header_messages" id="profile_popover">
                        <button className="profile_dropdown_button" onClick={() => { navigate(buildRoute(ROUTES.PROFILE)); closeAll(); }}>
                            <p>Profil</p>
                        </button>
                        <button className="profile_dropdown_button">
                            <p>Moje nabídky</p>
                        </button>
                        <button className="profile_dropdown_button" >
                            <p>Ověřit profil</p>
                        </button>
                        <button className="profile_dropdown_button" onClick={() => { navigate(buildRoute(ROUTES.SETTINGS)); closeAll(); }}>
                            <p>Nastavení</p>
                        </button>
                        <button className="profile_dropdown_button">
                            <p>Odhlásit se</p>
                        </button>
                    </div>
                </>
            )}
        </>
    )
}

export default Header
