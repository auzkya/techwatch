import { faHouse } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { categoryMap } from "../config/CategoryMap";
import { ROUTES, buildRoute } from "../routes/RouteNames";
import makeSlug from "../utils/makeSlug";
import "./Path.css";

import "./Path.css";

const Path = ({
    mode,           // "tech" | "workers" | "favourites"
    category,       // slug kategorie
    userName,       // jméno uživatele
    userId,         // ID uživatele
    customLabel,    // "Moje nabídky" atd.
    name            // název detailu položky
}) => {

    // Pomocná funkce pro text vs odkaz
    const BreadcrumbItem = ({ to, label, isLast }) => (
        <>
            <p>&rsaquo;</p>
            <p>
                {isLast ? (
                    <span className="path-a active-path">{label.toUpperCase()}</span>
                ) : (
                    <Link className="path-a" to={to}>
                        {label.toUpperCase()}
                    </Link>
                )}
            </p>
        </>
    );

    return (
        <div className="all-path">
            <div className="path">
                {/* 0. HOME */}
                <p className="home">
                    <Link className="path-a" to="/app">
                        <FontAwesomeIcon icon={faHouse} />
                    </Link>
                </p>

                {/* 1. HLAVNÍ SEKCE */}
                {mode && (
                    <BreadcrumbItem
                        to={mode === "tech" ? ROUTES.TECH : mode === "workers" ? ROUTES.WORKERS : ROUTES.FAVOURITES}
                        label={mode === "tech" ? "TECHNIKA" : mode === "workers" ? "PRACOVNÍCI" : "ULOŽENÉ NABÍDKY"}
                        isLast={!category && !userName && !customLabel && !name}
                    />
                )}

                {/* 2. KATEGORIE */}
                {category && (
                    <BreadcrumbItem
                        to={buildRoute(mode === "tech" ? ROUTES.TECH_CATEGORY : ROUTES.WORKERS_CATEGORY, { subcategory: category })}
                        label={categoryMap[category] || category}
                        isLast={!userName && !customLabel && !name}
                    />
                )}

                {/* 3. UŽIVATEL / MOJE NABÍDKY */}
                {(userName || customLabel) && (
                    <BreadcrumbItem
                        to={customLabel === "Moje nabídky"
                            ? `/user/${userId}/listings`
                            : `/user/${userId}/${makeSlug(userName || "").replace(/_/g, "-")}`}
                        label={customLabel || userName}
                        isLast={!name}
                    />
                )}

                {/* 4. DETAIL POLOŽKY */}
                {name && (
                    <>
                        <p>&rsaquo;</p>
                        <p><span className="path-a active-path">{name.toUpperCase()}</span></p>
                    </>
                )}
            </div>
        </div>
    );
};

export default Path;
