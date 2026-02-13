import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ROUTES, buildRoute } from "../../routes/RouteNames";

import { categoryMap } from "../../config/CategoryMap";

import ButtonSubcategory from "../../components/ButtonSubcategory";
import Item from "../../components/Item";
import ItemSkeleton from "../../components/ItemSkeleton";
import Path from "../../components/Path";
import { ASSETS } from "../../config/assets";
import makeSlug from "../../utils/makeSlug";

import "./Listing.css";

import { faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons';
import { faHandFist, faLightbulb, faMagnifyingGlass, faStar as faStarFull, faVideo, faWrench } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axiosInstance from "../../api/axiosInstance";

const Workers = () => {
    const { subcategory } = useParams();
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const path = useLocation();
    const navigate = useNavigate();

    // STAVY PRO PAGINACI
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const isFetching = useRef(false);

    // FILTRY
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLocation, setSelectedLocation] = useState({ value: "", label: "Celá ČR" });
    const [minRating, setMinRating] = useState(false); // Stav pro checkbox hodnocení

    const [isOpen, setIsOpen] = useState(false); // Stav pro otevření/zavření dropdownu location
    const selectRef = useRef(null);

    // Zavření selectu při kliknutí mimo
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // FUNKCE PRO NAČÍTÁNÍ DAT
    const fetchWorkers = useCallback(async (pageNumber, isInitial = false) => {
        if (isFetching.current && !isInitial) return;
        isFetching.current = true;

        try {
            const response = await axiosInstance.get('/api/workers-listings', {
                params: {
                    subcategory,
                    location: selectedLocation.value,
                    search: searchTerm,
                    minRating: minRating,
                    page: pageNumber
                }
            });
            const newWorkers = response.data.data || [];
            setWorkers(prev => {
                if (isInitial) return newWorkers;
                const existingIds = new Set(prev.map(w => w.id));
                const uniqueNewWorkers = newWorkers.filter(w => !existingIds.has(w.id));
                return [...prev, ...uniqueNewWorkers];
            });
            setHasMore(response.data.next_page_url !== null);
        } catch (error) {
            console.error("Chyba:", error);
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [subcategory, selectedLocation.value, searchTerm, minRating]);

    // Reset a první načtení při změně filtrů
    useEffect(() => {
        setPage(1);
        setHasMore(true);

        // KLÍČOVÁ ZMĚNA: Okamžitě vymažeme staré výsledky, aby neproblikávaly se skeletony
        setWorkers([]);
        setLoading(true);

        const timeoutId = setTimeout(() => fetchWorkers(1, true), 300);
        return () => clearTimeout(timeoutId);
    }, [fetchWorkers]);

    // Načítání dalších stránek
    useEffect(() => {
        if (page > 1) fetchWorkers(page, false);
    }, [page, fetchWorkers]);

    // INFINITE SCROLL OBSERVER
    const observer = useRef();
    const lastWorkerRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        }, { rootMargin: '0px 0px 200px 0px', threshold: 0.1 });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        const performReset = () => {
            setSearchTerm("");
            setSelectedLocation({ value: "", label: "Celá ČR" });
            setMinRating(false);
            setPage(1);
            // fetchWorkers se spustí automaticky díky závislosti na searchTerm
        };

        window.addEventListener("reset-filters", performReset);
        return () => window.removeEventListener("reset-filters", performReset);
    }, []);

    // MEMOIZACE SEZNAMU (šetří výkon)
    // 1. OPRAVA: handleItemClick už máš v useCallback, to je super.
    const handleItemClick = useCallback((id, firstName, lastName) => {
        const slug = makeSlug(`${firstName}-${lastName}`);
        const fullName = `${firstName} ${lastName}`; // Vytvoříme jméno
        navigate(`/user/${id}/${slug}`, {
            state: {
                fromCategory: subcategory,
                fromMode: "workers",
                userName: fullName
            }
        });
    }, [navigate, subcategory]);

    // 2. OPTIMALIZACE: Memoizujeme pouze pole komponent, ne logiku uvnitř
    /*const memoizedWorkers = useMemo(() => {
        return workers.map((worker, index) => {
            const isLast = workers.length === index + 1;
            return (
                <Item
                    key={worker.id}
                    id={worker.id}
                    ref={isLast ? lastWorkerRef : null}
                    isFavouriteInitially={worker.is_favourite}
                    profile_picture={worker.profile_image_url || ASSETS.default_avatar}
                    rating={worker.review_value}
                    name={`${worker.first_name ?? ''} ${worker.last_name ?? ''}`}
                    role={worker.formatted_specs}
                    // Zásadní změna: Předáváme celého workera, nebo parametry vyřešíme v Itemu
                    // Aby onClick zůstal stabilní, Item by měl volat onClick(id, name, surname) interně
                    workerData={worker}
                    onClick={handleItemClick}
                />
            );
        });
    }, [workers, lastWorkerRef, handleItemClick]);*/

    // Definice povolených podkategorií
    const allowedSubcategories = ["light_technician", "sound_technician", "av_technician", "rigger", "stagehands"];

    // Pokud subcategory není v povolených podkategotiích, přesměruj na 404
    if (subcategory && !allowedSubcategories.includes(subcategory)) {
        return <Navigate to={buildRoute(ROUTES.NOT_FOUND)} replace />;
    }

    // Pokud subcategory není v povolených podkategotiích, přesměruj na 404
    const titleHero = !subcategory
        ? categoryMap[path.pathname.split("/")[1]]
        : categoryMap[subcategory];

    const locationOptions = [
        { value: "", label: "Celá ČR" },
        { value: "praha", label: "Praha" },
        { value: "brno", label: "Brno" },
        { value: "ostrava", label: "Ostrava" },
        { value: "stredocesky", label: "Středočeský kraj" },
        { value: "jihocesky", label: "Jihočeský kraj" },
        { value: "plzensky", label: "Plzeňský kraj" },
        { value: "karlovarsky", label: "Karlovarský kraj" },
        { value: "ustecky", label: "Ústecký kraj" },
        { value: "liberecky", label: "Liberecký kraj" },
        { value: "kralovehradecky", label: "Královéhradecký kraj" },
        { value: "vysocina", label: "Vysočina" },
        { value: "jihomoravsky", label: "Jihomoravský kraj" },
        { value: "olomoucky", label: "Olomoucký kraj" },
        { value: "zlinsky", label: "Zlínský kraj" },
        { value: "moravskoslezsky", label: "Moravskoslezský kraj" },
    ];

    const createSlug = (user) => `${user.first_name}-${user.last_name}`.toLowerCase();

    return (
        <>
            <Path mode="workers" category={subcategory} />
            <h1 className="list_title">{titleHero}</h1>

            <div className="search_bar-container">
                <div className="search_bar-box">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="search_bar-icon" />
                    <input className="search_bar" placeholder="Vyhledávejte" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}>
                    </input>
                </div>
            </div>


            {!subcategory && (
                <div className="workers-nav">
                    {/* Tady budou tlačítka pro podkategorie */}
                    <ButtonSubcategory
                        icon={<FontAwesomeIcon icon={faLightbulb} />}
                        text="Osvětlovač"
                        onClick={() => navigate(buildRoute(ROUTES.WORKERS_CATEGORY, { subcategory: "light_technician" }))}
                    />
                    <ButtonSubcategory
                        icon={<svg xmlns="http://www.w3.org/2000/svg" height="100" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-device-speaker"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M17 2a3 3 0 0 1 3 3v14a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3v-14a3 3 0 0 1 3 -3zm-5 9a4 4 0 0 0 -3.995 3.8l-.005 .2a4 4 0 1 0 4 -4m0 -5a1 1 0 0 0 -1 1v.01a1 1 0 0 0 2 0v-.01a1 1 0 0 0 -1 -1" /></svg>}
                        text="Zvukař"
                        onClick={() => navigate(buildRoute(ROUTES.WORKERS_CATEGORY, { subcategory: "sound_technician" }))}
                    />
                    <ButtonSubcategory
                        icon={<FontAwesomeIcon icon={faVideo} />}
                        text="AV Technik"
                        onClick={() => navigate(buildRoute(ROUTES.WORKERS_CATEGORY, { subcategory: "av_technician" }))}
                    />
                    <ButtonSubcategory
                        icon={<FontAwesomeIcon icon={faWrench} />}
                        text="Rigger"
                        onClick={() => navigate(buildRoute(ROUTES.WORKERS_CATEGORY, { subcategory: "rigger" }))}
                    />
                    <ButtonSubcategory
                        icon={<FontAwesomeIcon icon={faHandFist} />}
                        text="Stagehands"
                        onClick={() => navigate(buildRoute(ROUTES.WORKERS_CATEGORY, { subcategory: "stagehands" }))}
                    />
                </div>
            )}
            <div className="list-container">
                <div className="all-filters">
                    <div className="filters">
                        <div className="location" ref={selectRef}>
                            <div className="custom-select-wrapper">
                                <div className="location">
                                    <div className="custom-select-wrapper">
                                        <label className="body_base label-move">Lokalita</label>
                                        <div className={`custom-select ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(!isOpen)}>
                                            <span className="selected">{selectedLocation.label}</span>
                                            <span className={`arrow ${isOpen ? "rotate" : ""}`}>▼</span>
                                        </div>
                                        {isOpen && (
                                            <div className="options">
                                                {locationOptions.map((opt) => (
                                                    <div
                                                        key={opt.value}
                                                        className={`option ${selectedLocation.value === opt.value ? "selected" : ""}`}
                                                        onClick={() => {
                                                            setSelectedLocation(opt);
                                                            setIsOpen(false);
                                                        }}
                                                    >
                                                        {opt.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <label htmlFor="rating" className="body_base label-move">Hodnocení</label>
                        <div id="rating" className="checkbox-container checkbox-container-filter">
                            <input
                                type="checkbox"
                                id="visible"
                                className="custom-checkbox"
                                checked={minRating}
                                onChange={() => setMinRating(!minRating)}
                            />
                            <label htmlFor="visible" className="checkbox-text">
                                <FontAwesomeIcon icon={faStarFull} className="star" />
                                <FontAwesomeIcon icon={faStarFull} className="star" />
                                <FontAwesomeIcon icon={faStarFull} className="star" />
                                <FontAwesomeIcon icon={faStarFull} className="star" />
                                <FontAwesomeIcon icon={faStarEmpty} className="star" /> a více
                            </label>
                        </div>
                    </div>

                </div>
                <div className="all-items">
                    {/* Renderování seznamu */}
                    {workers.map((worker, index) => (
                        <Item
                            key={worker.id} // Zásadní: ID, ne index!
                            id={worker.id}
                            ref={workers.length === index + 1 ? lastWorkerRef : null} // Ref přímo do Itemu
                            isFavouriteInitially={worker.is_favourite}
                            profile_picture={worker.profile_image_url || ASSETS.default_avatar}
                            rating={worker.review_value}
                            name={`${worker.first_name ?? ''} ${worker.last_name ?? ''}`}
                            role={worker.formatted_specs}
                            onClick={() => handleItemClick(worker.id, worker.first_name, worker.last_name)}
                        />
                    ))}

                    {/* Načítací skeletony pod seznamem */}
                    {loading && (
                        Array.from({ length: 4 }).map((_, index) => (
                            <ItemSkeleton key={`skeleton-${index}`} />
                        ))
                    )}

                    {/* Prázdný stav */}
                    {!loading && workers.length === 0 && (
                        <div className="no-results_listing-container">
                            <h2 className="no-results_listing">Nebyli nalezeni žádní pracovníci.</h2>
                        </div>
                    )}
                </div>
            </div>

        </>
    )
}

export default Workers
