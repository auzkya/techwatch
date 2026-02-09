import React from "react";
import { Link } from "react-router-dom";
import { categoryMap } from "../config/CategoryMap";
import { ROUTES, buildRoute } from "../routes/RouteNames";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import "./Path.css";

const Path = ({ mode, category, name, customLabel }) => {
    const isTech = mode === 'tech';
    const isWorkers = mode === 'workers';
    const isFavourites = mode === 'favourites'; //

    const isMyListings = customLabel?.toLowerCase() === "moje nabídky";
    const isDirect = mode === 'direct';

    return (
        <div className="all-path">
            <div className="path">
                <p className="home">
                    <Link className="path-a" to="/"> <FontAwesomeIcon icon={faHouse} /></Link>
                </p>

                {/* LOGIKA PRO OBLÍBENÉ */}
                {isFavourites && (
                    <>
                        <p>&gt;</p>
                        <p>
                            <Link className="path-a" to={ROUTES.FAVOURITES}>
                                ULOŽENÉ NABÍDKY
                            </Link>
                        </p>
                        {category && (
                            <>
                                <p>&gt;</p>
                                <p className="path-a active-path">
                                    {category === "workers" ? "PRACOVNÍCI" : "TECHNIKA"}
                                </p>
                            </>
                        )}
                    </>
                )}

                {/* Původní logika pro Techniku/Pracovníky (zůstává, jen přidáme !isFavourites) */}
                {mode && !isMyListings && !isDirect && !isFavourites && (
                    <>
                        <p>&gt;</p>
                        <p>
                            <Link className="path-a" to={isTech ? ROUTES.TECH : ROUTES.WORKERS}>
                                {isTech ? "Technika" : "Pracovníci"}
                            </Link>
                        </p>
                    </>
                )}

                {/* ... zbytek kódu (podkategorie, customLabel atd.) ... */}
                {/* Přidej !isFavourites do podmínek níže, aby se nekryly */}
                {mode && category && !isMyListings && !isDirect && !isFavourites && (
                    <>
                        <p>&gt;</p>
                        <p>
                            <Link
                                className="path-a"
                                to={isTech ? buildRoute(ROUTES.TECH_CATEGORY, { subcategory: category }) : buildRoute(ROUTES.WORKERS_CATEGORY, { subcategory: category })}
                            >
                                {(categoryMap[category] || category || "").toUpperCase()}
                            </Link>
                        </p>
                    </>
                )}

                {/* Jméno nebo "Moje nabídky" (tady isFavourites nevadí, jméno detailu se hodí vždy) */}
                {(customLabel || name) && !isFavourites && (
                    <>
                        <p>&gt;</p>
                        <p className="path-a active-path">{(customLabel || name).toUpperCase()}</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default Path;
