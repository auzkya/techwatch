import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Přidáno useParams
import axiosInstance from "../../api/axiosInstance";
import { ROUTES, buildRoute } from "../../routes/RouteNames";

import ButtonSubcategory from "../../components/ButtonSubcategory";
import Item from "../../components/Item";
import ItemSkeleton from "../../components/ItemSkeleton";
import Path from "../../components/Path";
import { ASSETS } from "../../config/assets";
import makeSlug from "../../utils/makeSlug";

import { faGears, faMagnifyingGlass, faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import "../Workers/Listing.css";

const Favourites = () => {
    const { subcategory } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [data, setData] = useState({ workers: [], tech: [] });

    useEffect(() => {
        const fetchFavs = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get('/api/favourites', {
                    params: { search: searchTerm }
                });
                setData({
                    workers: response.data.workers || [],
                    tech: response.data.tech || []
                });
            } catch (error) {
                console.error("Chyba:", error);
            } finally {
                setLoading(false);
            }
        };
        const timeoutId = setTimeout(fetchFavs, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // LOGIKA PRO BOD 2: Příprava dat pro zobrazení
    const workersWithFlag = data.workers.map(w => ({ ...w, itemType: 'worker' }));
    const techWithFlag = data.tech.map(t => ({ ...t, itemType: 'tech' }));

    let displayItems = [];
    if (!subcategory) {
        displayItems = [...workersWithFlag, ...techWithFlag];
    } else if (subcategory === "workers") {
        displayItems = workersWithFlag;
    } else if (subcategory === "tech") {
        displayItems = techWithFlag;
    }

    return (
        <>
            <Path mode="favourites" category={subcategory} />

            <h1 className="list_title">
                {!subcategory ? "Uložené nabídky" : subcategory === "workers" ? "Uložení pracovníci" : "Uložená technika"}
            </h1>

            <div className="search_bar-container">
                <div className="search_bar-box">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="search_bar-icon" />
                    <input
                        className="search_bar"
                        placeholder="Hledejte v oblíbených"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* LOGIKA PRO BOD 1: Tlačítka zmizí, pokud je uživatel v podkategorii */}
            {!subcategory && (
                <div className="workers-nav">
                    <ButtonSubcategory
                        icon={<FontAwesomeIcon icon={faPeopleGroup} />}
                        text="Pracovníci"
                        onClick={() => navigate(buildRoute(ROUTES.FAVOURITES_CATEGORY, { subcategory: "workers" }))}
                    />
                    <ButtonSubcategory
                        icon={<FontAwesomeIcon icon={faGears} />}
                        text="Technika"
                        onClick={() => navigate(buildRoute(ROUTES.FAVOURITES_CATEGORY, { subcategory: "tech" }))}
                    />
                </div>
            )}

            <div className="list-container">
                <div className="all-items-full">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <ItemSkeleton key={`skeleton-${index}`} />
                        ))
                    ) : displayItems.length > 0 ? (
                        displayItems.map(item => {
                            const isWorker = item.itemType === 'worker';

                            // 1. Sjednocení polí (Důležité: u techniky používáš item.title v Tech.js)
                            const displayName = isWorker
                                ? `${item.first_name ?? ''} ${item.last_name ?? ''}`
                                : (item.title || item.name); // fallback pokud by backend poslal name místo title

                            // 2. Příprava slugu pro dělníky (stejná logika jako ve Workers)
                            const workerSlug = isWorker ? makeSlug(`${item.first_name}-${item.last_name}`) : "";

                            return (
                                <Item
                                    key={`${item.itemType}-${item.id}`}
                                    id={item.id}
                                    isFavouriteInitially={true}
                                    // Fallback na defaultní obrázky
                                    profile_picture={isWorker
                                        ? (item.profile_image_url || ASSETS.default_avatar)
                                        : (item.main_image_url || ASSETS.default_item)
                                    }
                                    rating={item.review_value}
                                    name={displayName}
                                    role={isWorker ? item.formatted_specs : null}
                                    price={item.price}
                                    purpose={item.purpose}
                                    onClick={() => {
                                        if (isWorker) {
                                            navigate(`/user/${item.id}/${workerSlug}`, {
                                                state: { fromMode: "favourites" }
                                            });
                                        } else {
                                            navigate(`/tech/item/${item.id}`, {
                                                state: { fromMode: "favourites" }
                                            });
                                        }
                                    }}
                                />
                            );
                        })
                    ) : (
                        <div className="no-results_listing-container">
                            <h2 className="no-results_listing">
                                {searchTerm
                                    ? "Nebylo nalezeno nic, co by odpovídalo hledání."
                                    : `Nemáte ${subcategory === 'workers' ? 'žádné uložené pracovníky' : subcategory === 'tech' ? 'žádnou uloženou techniku' : 'žádné uložené nabídky'}.`
                                }
                            </h2>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Favourites;
