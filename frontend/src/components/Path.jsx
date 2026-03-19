import { faHouse } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { categoryMap } from "../config/CategoryMap";
import { ROUTES, buildRoute } from "../routes/RouteNames";
import makeSlug from "../utils/makeSlug";
import "./Path.css";

const Path = ({
    mode,
    category,
    name,
    customLabel,
    userName: userNameProp,
    userId: userIdProp,
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Data ze state - fromMode a fromCategory existují jen, když jdeme ze seznamu/vyhledávání
    const {
        userId: stateUserId,
        userName: stateUserName,
        fromMode,
        fromCategory,
        customLabel: stateCustomLabel,
    } = location.state || {};
    const userId =
        userIdProp ||
        stateUserId ||
        (location.pathname.split("/")[1] === "user"
            ? location.pathname.split("/")[2]
            : null);
    const userName = stateUserName || userNameProp;

    // displayMode upřednostní state (odkud jdu), jinak použije prop (kde jsem)
    const displayMode = fromMode || mode;
    const displayCategory = fromCategory || category;

    const isMyListings =
        customLabel?.toLowerCase() === "moje nabídky" ||
        stateCustomLabel?.toLowerCase() === "moje nabídky";

    const isDirectProfileAccess = userName && !name && !fromMode;
    const isTech = displayMode === "tech";
    const isFavourites = displayMode === "favourites";

    const showMode = displayMode && !isMyListings && !isDirectProfileAccess;
    const showCategory =
        displayCategory && !isMyListings && !isDirectProfileAccess;
    const shouldShowUserName = userName && !isMyListings;

    const pathParts = location.pathname.split("/");
    const myListingsPath = `/user/${userId}/listings`;

    const handleReset = (e, targetPath, type) => {
        // Pokud už je otevřená cílová stránka, spustit resetovací událost
        if (location.pathname === targetPath) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("reset-filters"));
            return; // Dál už nepokračujeme
        }

        // Pokud jsme na jiné stránce (např. v detailu), musíme navigovat
        // e.preventDefault() zde nevoláme hned, aby Link mohl přirozeně navigovat,
        // nebo ho zavoláme a použijeme navigate (čistší řešení):

        e.preventDefault();
        let newState = { fromMode: displayMode };

        if (type === "root") {
            newState.fromCategory = null;
        } else if (type === "category") {
            newState.fromCategory = displayCategory;
        }

        navigate(targetPath, { state: newState });
    };

    return (
        <div className="all-path">
            <div className="path">
                <p className="home">
                    <Link className="path-a" to="/app">
                        {" "}
                        <FontAwesomeIcon icon={faHouse} />
                    </Link>
                </p>

                {/* 1. úroveň: pracovníci/technika, reset filtrů */}
                {showMode && (
                    <>
                        <p>&rsaquo;</p>
                        <p>
                            <Link
                                className="path-a"
                                // Navigace pro oblíbené, techniku nebo pracovníky
                                to={
                                    isFavourites
                                        ? ROUTES.FAVOURITES
                                        : isTech
                                          ? ROUTES.TECH
                                          : ROUTES.WORKERS
                                }
                                onClick={(e) =>
                                    handleReset(
                                        e,
                                        isFavourites
                                            ? ROUTES.FAVOURITES
                                            : isTech
                                              ? ROUTES.TECH
                                              : ROUTES.WORKERS,
                                        "root",
                                    )
                                }
                            >
                                {/* Korekce popisku */}
                                {isFavourites
                                    ? "ULOŽENÉ NABÍDKY"
                                    : isTech
                                      ? "TECHNIKA"
                                      : "PRACOVNÍCI"}
                            </Link>
                        </p>
                    </>
                )}

                {/* 2. úroveň: kategorie, zachování zvoleného filtru */}
                {showCategory && (
                    <>
                        <p>&rsaquo;</p>
                        <p>
                            <Link
                                className="path-a"
                                to={
                                    isTech
                                        ? buildRoute(ROUTES.TECH_CATEGORY, {
                                              subcategory: displayCategory,
                                          })
                                        : buildRoute(ROUTES.WORKERS_CATEGORY, {
                                              subcategory: displayCategory,
                                          })
                                }
                                onClick={(e) =>
                                    handleReset(
                                        e,
                                        isTech
                                            ? buildRoute(ROUTES.TECH_CATEGORY, {
                                                  subcategory: displayCategory,
                                              })
                                            : buildRoute(
                                                  ROUTES.WORKERS_CATEGORY,
                                                  {
                                                      subcategory:
                                                          displayCategory,
                                                  },
                                              ),
                                        "category",
                                    )
                                }
                            >
                                {(
                                    categoryMap[displayCategory] ||
                                    displayCategory
                                ).toUpperCase()}
                            </Link>
                        </p>
                    </>
                )}

                {/* 3. ÚROVEŇ: JMÉNO nebo MOJE NABÍDKY */}
                {(shouldShowUserName || isMyListings) && (
                    <>
                        <p>&rsaquo;</p>
                        <p>
                            {isMyListings ? (
                                // Pokud máme název (jsme v detailu), "Moje nabídky" je odkaz
                                // Pokud název nemáme (jsme v seznamu), je to jen text
                                name ? (
                                    <Link
                                        className="path-a"
                                        to={myListingsPath}
                                        onClick={(e) =>
                                            handleReset(e, myListingsPath)
                                        }
                                    >
                                        MOJE NABÍDKY
                                    </Link>
                                ) : (
                                    <span className="path-a active-path">
                                        MOJE NABÍDKY
                                    </span>
                                )
                            ) : // Standardní jméno uživatele pro cizí profily
                            name ? (
                                <Link
                                    className="path-a"
                                    to={`/user/${userId}/${makeSlug(userName).replace(/_/g, "-")}`}
                                    onClick={(e) =>
                                        handleReset(
                                            e,
                                            `/user/${userId}/${makeSlug(userName).replace(/_/g, "-")}`,
                                        )
                                    }
                                >
                                    {userName.toUpperCase()}
                                </Link>
                            ) : (
                                <span className="path-a active-path">
                                    {userName.toUpperCase()}
                                </span>
                            )}
                        </p>
                    </>
                )}

                {/* 4. ÚROVEŇ: NÁZEV ZAŘÍZENÍ */}
                {name && (
                    <>
                        <p>&rsaquo;</p>
                        <p>
                            <span className="path-a active-path">
                                {name.toUpperCase()}
                            </span>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default Path;
