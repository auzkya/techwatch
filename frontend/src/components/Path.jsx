import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { categoryMap } from "../config/CategoryMap";
import { ROUTES, buildRoute } from "../routes/RouteNames";
import makeSlug from "../utils/makeSlug";
import "./Path.css";

const Path = ({ mode, category, name, customLabel, userName: userNameProp }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Data ze state - fromMode a fromCategory existují jen, když jdeme ze seznamu/vyhledávání
    const { userName: stateUserName, fromMode, fromCategory } = location.state || {};
    const userName = stateUserName || userNameProp;

    // displayMode upřednostní state (odkud jdu), jinak použije prop (kde jsem)
    const displayMode = fromMode || mode;
    const displayCategory = fromCategory || category;

    // --- KLÍČOVÁ LOGIKA PRO ZKRÁCENÍ ---
    // Cestu zkrátíme (skryjeme mode/category) pouze pokud:
    // 1. Jsme na profilu (máme userName a nemáme detail věci 'name')
    // 2. ZÁROVEŇ nemáme informaci o tom, že jsme přišli z nějakého režimu (fromMode je prázdné)
    const isDirectProfileAccess = userName && !name && !fromMode;

    const isTech = displayMode === 'tech';
    const isFavourites = displayMode === 'favourites';
    const isMyListings = customLabel?.toLowerCase() === "moje nabídky";

    const showMode = displayMode && !isMyListings && !isDirectProfileAccess;
    const showCategory = displayCategory && !isMyListings && !isDirectProfileAccess;

    const handleReset = (e, targetPath, type) => {
        // 1. Pokud už na té stránce jsme, spustíme tvůj resetovací event
        if (location.pathname === targetPath) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("reset-filters"));
            return; // Dál už nepokračujeme
        }

        // 2. Pokud jsme na jiné stránce (např. v detailu), musíme navigovat
        // e.preventDefault() zde nevoláme hned, aby Link mohl přirozeně navigovat,
        // nebo ho zavoláme a použijeme navigate (čistší řešení):

        e.preventDefault();
        let newState = { fromMode: displayMode };

        if (type === 'root') {
            newState.fromCategory = null;
        } else if (type === 'category') {
            newState.fromCategory = displayCategory;
        }

        navigate(targetPath, { state: newState });
    };

    return (
        <div className="all-path">
            <div className="path">
                <p className="home">
                    <Link className="path-a" to="/"> <FontAwesomeIcon icon={faHouse} /></Link>
                </p>

                {/* 1. ÚROVEŇ: PRACOVNÍCI / TECHNIKA - Tady chceme RESET FILTRŮ */}
                {showMode && (
                    <>
                        <p>&gt;</p>
                        <p>
                            <Link
                                className="path-a"
                                // Navigace pro oblíbené, techniku nebo pracovníky
                                to={isFavourites ? ROUTES.FAVOURITES : (isTech ? ROUTES.TECH : ROUTES.WORKERS)}
                                onClick={(e) => handleReset(e, isFavourites ? ROUTES.FAVOURITES : (isTech ? ROUTES.TECH : ROUTES.WORKERS), 'root')}
                            >
                                {/* TADY JE OPRAVA POPISKU */}
                                {isFavourites ? "ULOŽENÉ NABÍDKY" : (isTech ? "TECHNIKA" : "PRACOVNÍCI")}
                            </Link>
                        </p>
                    </>
                )}

                {/* 2. ÚROVEŇ: KATEGORIE - Tady chceme zachovat kategorii */}
                {showCategory && (
                    <>
                        <p>&gt;</p>
                        <p>
                            <Link
                                className="path-a"
                                to={isTech ? buildRoute(ROUTES.TECH_CATEGORY, { subcategory: displayCategory }) : buildRoute(ROUTES.WORKERS_CATEGORY, { subcategory: displayCategory })}
                                onClick={(e) => handleReset(e, isTech ? buildRoute(ROUTES.TECH_CATEGORY, { subcategory: displayCategory }) : buildRoute(ROUTES.WORKERS_CATEGORY, { subcategory: displayCategory }), 'category')}
                            >
                                {(categoryMap[displayCategory] || displayCategory).toUpperCase()}
                            </Link>
                        </p>
                    </>
                )}

                {/* 3. ÚROVEŇ: JMÉNO */}
                {userName && (
                    <>
                        <p>&gt;</p>
                        <p>
                            {(customLabel || name) ? (
                                <Link
                                    className="path-a"
                                    to={`/user/${location.pathname.split('/')[2]}/${makeSlug(userName).replace(/_/g, "-")}`}
                                    onClick={(e) => handleReset(e, `/user/${location.pathname.split('/')[2]}/${makeSlug(userName).replace(/_/g, "-")}`)}
                                >
                                    {userName.toUpperCase()}
                                </Link>
                            ) : (
                                <span className="path-a active-path">{userName.toUpperCase()}</span>
                            )}
                        </p>
                    </>
                )}

                {/* 4. ÚROVEŇ: DETAIL */}
                {(customLabel || name) && (
                    <>
                        {customLabel?.toUpperCase() !== userName?.toUpperCase() && (
                            <>
                                <p>&gt;</p>
                                <p className="path-a active-path">
                                    {(customLabel || name).toUpperCase()}
                                </p>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Path;
