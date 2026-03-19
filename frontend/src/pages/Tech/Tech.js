import { useCallback, useEffect, useRef, useState } from "react";
import {
    Navigate,
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";
import { ROUTES, buildRoute } from "../../routes/RouteNames";

import { categoryMap } from "../../config/CategoryMap";

import ButtonSubcategory from "../../components/ButtonSubcategory";
import Item from "../../components/Item";
import ItemSkeleton from "../../components/ItemSkeleton";
import Path from "../../components/Path";
import { ASSETS } from "../../config/assets";

import "../Workers/Listing.css";

import { faStar as faStarEmpty } from "@fortawesome/free-regular-svg-icons";
import {
    faCircleMinus,
    faCirclePlus,
    faLightbulb,
    faMagnifyingGlass,
    faMasksTheater,
    faStar as faStarFull,
    faVideo,
    faWrench,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axiosInstance from "../../api/axiosInstance";

const Tech = () => {
    const { subcategory } = useParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const path = useLocation();
    const navigate = useNavigate();

    // STAVY PRO PAGINACI
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const isFetching = useRef(false);

    const [isOpen, setIsOpen] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [isOpen3, setIsOpen3] = useState(false);
    const selectRef1 = useRef(null); // Pro Lokalitu (isOpen)
    const selectRef2 = useRef(null); // Pro Dostupnost (isOpen2)
    const selectRef3 = useRef(null); // Pro Řazení (isOpen3)

    // STAVY FILTRŮ
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLocation, setSelectedLocation] = useState({
        value: "",
        label: "Celá ČR",
    });
    const [selectedPurpose, setSelectedPurpose] = useState({
        value: "all",
        label: "Vše",
    });
    const [selectedSorting, setSelectedSorting] = useState({
        value: "created_at",
        label: "Data přidání",
    });
    const [minRating, setMinRating] = useState(false); // Hodnocení zařízení

    const [filters, setFilters] = useState({
        //maxPrice: 100000,
        onAgreement: false,
        quantity: 1,
    });

    // FUNKCE PRO NAČÍTÁNÍ (stejná logika jako ve Workers)
    const fetchItems = useCallback(
        async (pageNumber, isInitial = false) => {
            if (isFetching.current && !isInitial) return;
            isFetching.current = true;

            try {
                const response = await axiosInstance.get("/api/tech-listings", {
                    params: {
                        subcategory,
                        location: selectedLocation.value,
                        search: searchTerm,
                        minRating: minRating,
                        purpose: selectedPurpose.value,
                        on_agreement: filters.onAgreement,
                        quantity: filters.quantity,
                        sort_by: selectedSorting.value,
                        page: pageNumber,
                    },
                });

                const newItems = response.data.data || [];

                setItems((prev) => {
                    if (isInitial) return newItems;
                    const existingIds = new Set(prev.map((item) => item.id));
                    const uniqueNewItems = newItems.filter(
                        (item) => !existingIds.has(item.id),
                    );
                    return [...prev, ...uniqueNewItems];
                });

                setHasMore(response.data.next_page_url !== null);
            } catch (error) {
                console.error("Chyba při načítání techniky:", error);
            } finally {
                setLoading(false);
                isFetching.current = false;
            }
        },
        [
            subcategory,
            selectedLocation.value,
            searchTerm,
            minRating,
            filters,
            selectedPurpose.value,
            selectedSorting.value,
        ],
    );

    // Reset při změně filtrů (debounce 300ms)
    useEffect(() => {
        setPage(1);
        setHasMore(true);

        // OKAMŽITÁ AKCE: Vymazat staré položky a zapnout loading
        setItems([]);
        setLoading(true);

        const timeoutId = setTimeout(() => fetchItems(1, true), 300);
        return () => clearTimeout(timeoutId);
    }, [fetchItems]);
    // Načtení další stránky
    useEffect(() => {
        if (page > 1) fetchItems(page, false);
    }, [page, fetchItems]);

    // INFINITE SCROLL OBSERVER (200px offset jako ve Workers)
    const observer = useRef();
    const lastItemRef = useCallback(
        (node) => {
            if (loading) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore) {
                        setPage((prev) => prev + 1);
                    }
                },
                { rootMargin: "0px 0px 200px 0px", threshold: 0.1 },
            );

            if (node) observer.current.observe(node);
        },
        [loading, hasMore],
    );

    // Logika obrázků (zjednodušená verze)
    const getFirstImage = (imagesData) => {
        if (!imagesData) return ASSETS.default_item;
        if (Array.isArray(imagesData))
            return imagesData[0] || ASSETS.default_item;
        return imagesData;
    };

    // OPTIMALIZACE: Jeden listener pro všechny dropdowny
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && !selectRef1.current?.contains(event.target))
                setIsOpen(false);
            if (isOpen2 && !selectRef2.current?.contains(event.target))
                setIsOpen2(false);
            if (isOpen3 && !selectRef3.current?.contains(event.target))
                setIsOpen3(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, isOpen2, isOpen3]);

    // Event bus pro reset filtrů z komponenty Path
    useEffect(() => {
        const performReset = () => {
            setSearchTerm("");
            setSelectedLocation({ value: "", label: "Celá ČR" });
            setSelectedPurpose({ value: "all", label: "Vše" });
            setSelectedSorting({ value: "created_at", label: "Data přidání" });
            setMinRating(false);
            setFilters({
                onAgreement: false,
                quantity: 1,
            });
            setPage(1);
        };

        window.addEventListener("reset-filters", performReset);
        return () => window.removeEventListener("reset-filters", performReset);
    }, []);

    const allowedSubcategories = [
        "light",
        "sound",
        "video",
        "rigging_stage",
        "scenography",
    ];

    if (subcategory && !allowedSubcategories.includes(subcategory)) {
        return <Navigate to={buildRoute(ROUTES.NOT_FOUND)} replace />;
    }

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

    const purposeOptions = [
        { value: "all", label: "Vše" },
        { value: "rental", label: "Rentál" },
        { value: "sell", label: "Prodej" },
    ];

    const sortingOptions = [
        { value: "created_at", label: "Data přidání" },
        { value: "review_value", label: "Hodnocení" },
        { value: "price_asc", label: "Ceny (vzestupně)" },
        { value: "price_desc", label: "Ceny (sestupně)" },
    ];

    const handleQuantityChange = (val) => {
        // Regulární výraz: povolí pouze prázdný řetězec nebo celá čísla
        if (val === "" || /^[0-9\b]+$/.test(val)) {
            const newValue = val === "" ? "" : Math.max(1, parseInt(val) || 1);
            setFilters({ ...filters, quantity: newValue });
        }
    };
    const handleBlur = () => {
        // Pokud uživatel smaže vše a odejde z pole, nastavíme 1
        if (filters.quantity === "") {
            setFilters({ ...filters, quantity: 1 });
        }
    };

    return (
        <>
            <Path mode="tech" category={subcategory} />
            <h1 className="list_title">{titleHero}</h1>

            <div className="search_bar-container">
                <div className="search_bar-box">
                    <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                        className="search_bar-icon"
                    />
                    <input
                        className="search_bar"
                        placeholder="Vyhledávejte techniku"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {!subcategory && (
                <div className="workers-nav">
                    {/* Tady budou tlačítka pro podkategorie */}
                    <ButtonSubcategory
                        key={"light"}
                        icon={<FontAwesomeIcon icon={faLightbulb} />}
                        text="Světla"
                        onClick={() =>
                            navigate(
                                buildRoute(ROUTES.TECH_CATEGORY, {
                                    subcategory: "light",
                                }),
                            )
                        }
                    />
                    <ButtonSubcategory
                        key={"sound"}
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="100"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="icon icon-tabler icons-tabler-filled icon-tabler-device-speaker"
                            >
                                <path
                                    stroke="none"
                                    d="M0 0h24v24H0z"
                                    fill="none"
                                />
                                <path d="M17 2a3 3 0 0 1 3 3v14a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3v-14a3 3 0 0 1 3 -3zm-5 9a4 4 0 0 0 -3.995 3.8l-.005 .2a4 4 0 1 0 4 -4m0 -5a1 1 0 0 0 -1 1v.01a1 1 0 0 0 2 0v-.01a1 1 0 0 0 -1 -1" />
                            </svg>
                        }
                        text="Zvuk"
                        onClick={() =>
                            navigate(
                                buildRoute(ROUTES.TECH_CATEGORY, {
                                    subcategory: "sound",
                                }),
                            )
                        }
                    />
                    <ButtonSubcategory
                        key={"video"}
                        icon={<FontAwesomeIcon icon={faVideo} />}
                        text="Video"
                        onClick={() =>
                            navigate(
                                buildRoute(ROUTES.TECH_CATEGORY, {
                                    subcategory: "video",
                                }),
                            )
                        }
                    />
                    <ButtonSubcategory
                        key={"rigging_stage"}
                        icon={<FontAwesomeIcon icon={faWrench} />}
                        text="Rigging & stage"
                        onClick={() =>
                            navigate(
                                buildRoute(ROUTES.TECH_CATEGORY, {
                                    subcategory: "rigging_stage",
                                }),
                            )
                        }
                    />
                    <ButtonSubcategory
                        key={"scenography"}
                        icon={<FontAwesomeIcon icon={faMasksTheater} />}
                        text="Scénografie"
                        onClick={() =>
                            navigate(
                                buildRoute(ROUTES.TECH_CATEGORY, {
                                    subcategory: "scenography",
                                }),
                            )
                        }
                    />
                </div>
            )}

            <div className="list-container">
                <div className="all-filters">
                    <div className="filters">
                        {/* ŘAZENÍ */}
                        <div className="location" ref={selectRef3}>
                            <div className="custom-select-wrapper">
                                <label className="body_base label-move">
                                    Řadit dle
                                </label>
                                <div
                                    className={`custom-select-down ${isOpen3 ? "open" : ""}`}
                                    onClick={() => setIsOpen3(!isOpen3)}
                                >
                                    <span className="selected">
                                        {selectedSorting.label}
                                    </span>
                                    <span
                                        className={`arrow ${isOpen3 ? "rotate" : ""}`}
                                    >
                                        ▼
                                    </span>
                                </div>
                                {isOpen3 && (
                                    <div className="options-down">
                                        {sortingOptions.map((opt) => (
                                            <div
                                                key={opt.value}
                                                className={`option ${selectedSorting.value === opt.value ? "selected" : ""}`}
                                                onClick={() => {
                                                    setSelectedSorting(opt);
                                                    setIsOpen3(false);
                                                }}
                                            >
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* DOSTUPNOST */}
                        <div className="location">
                            <div
                                className="custom-select-wrapper"
                                ref={selectRef2}
                            >
                                <label className="body_base label-move">
                                    Dostupnost
                                </label>
                                <div
                                    className={`custom-select-down ${isOpen2 ? "open" : ""}`}
                                    onClick={() => setIsOpen2(!isOpen2)}
                                >
                                    <span className="selected">
                                        {selectedPurpose.label}
                                    </span>
                                    <span
                                        className={`arrow ${isOpen2 ? "rotate" : ""}`}
                                    >
                                        ▼
                                    </span>
                                </div>
                                {isOpen2 && (
                                    <div className="options-down">
                                        {purposeOptions.map((opt) => (
                                            <div
                                                key={opt.value}
                                                className={`option ${selectedPurpose.value === opt.value ? "selected" : ""}`}
                                                onClick={() => {
                                                    setSelectedPurpose(opt);
                                                    setIsOpen2(false);
                                                }}
                                            >
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* LOKALITA */}
                        <div className="location">
                            <div
                                className="custom-select-wrapper"
                                ref={selectRef1}
                            >
                                <label className="body_base label-move">
                                    Lokalita
                                </label>
                                <div
                                    className={`custom-select-down ${isOpen ? "open" : ""}`}
                                    onClick={() => setIsOpen(!isOpen)}
                                >
                                    <span className="selected">
                                        {selectedLocation.label}
                                    </span>
                                    <span
                                        className={`arrow ${isOpen ? "rotate" : ""}`}
                                    >
                                        ▼
                                    </span>
                                </div>
                                {isOpen && (
                                    <div className="options-down">
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

                        {/* MNOŽSTVÍ */}
                        <label className="body_base label-move">
                            Min. množství
                        </label>
                        <div className="quantity-stepper">
                            <div className="stepper-input-wrapper">
                                <input
                                    id="quantity"
                                    name="quantity"
                                    type="text"
                                    inputMode="numeric"
                                    className="input-login input-inline"
                                    value={filters.quantity}
                                    onChange={(e) =>
                                        handleQuantityChange(e.target.value)
                                    }
                                    onBlur={handleBlur}
                                />
                                <div className="stepper-input-wrapper-btn-container">
                                    <FontAwesomeIcon
                                        icon={faCircleMinus}
                                        className={`stepper-btn ${filters.quantity <= 1 ? "button_disabled" : ""}`}
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                quantity: Math.max(
                                                    1,
                                                    prev.quantity - 1,
                                                ),
                                            }))
                                        }
                                        disabled={filters.quantity <= 1}
                                    />
                                    <FontAwesomeIcon
                                        icon={faCirclePlus}
                                        className="stepper-btn"
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                quantity: prev.quantity + 1,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* HODNOCENÍ ZAŘÍZENÍ */}
                        <label
                            htmlFor="rating"
                            className="body_base label-move"
                        >
                            Hodnocení zařízení
                        </label>
                        <div
                            id="rating"
                            className="checkbox-container checkbox-container-filter"
                        >
                            <input
                                type="checkbox"
                                id="visible"
                                className="custom-checkbox"
                                checked={minRating}
                                onChange={() => setMinRating(!minRating)}
                            />
                            <label htmlFor="visible" className="checkbox-text">
                                <FontAwesomeIcon
                                    icon={faStarFull}
                                    className="star"
                                />
                                <FontAwesomeIcon
                                    icon={faStarFull}
                                    className="star"
                                />
                                <FontAwesomeIcon
                                    icon={faStarFull}
                                    className="star"
                                />
                                <FontAwesomeIcon
                                    icon={faStarFull}
                                    className="star"
                                />
                                <FontAwesomeIcon
                                    icon={faStarEmpty}
                                    className="star"
                                />{" "}
                                a více
                            </label>
                        </div>
                    </div>
                </div>

                <div className="all-items">
                    {items.map((item, index) => (
                        <Item
                            key={item.id}
                            id={item.id}
                            ref={
                                items.length === index + 1 ? lastItemRef : null
                            }
                            isFavouriteInitially={item.is_favourite}
                            profile_picture={getFirstImage(item.images)}
                            rating={item.review_value}
                            name={item.title}
                            price={item.price}
                            purpose={item.purpose}
                            quantity={item.quantity}
                            onClick={() =>
                                navigate(`/tech/item/${item.id}`, {
                                    state: {
                                        fromCategory: subcategory,
                                        fromMode: "tech",
                                    },
                                })
                            }
                        />
                    ))}

                    {/* Skeletony při načítání dalších stránek */}
                    {loading &&
                        Array.from({ length: 4 }).map((_, index) => (
                            <ItemSkeleton key={`skeleton-${index}`} />
                        ))}

                    {/* Prázdný stav - zobrazí se jen když není loading a seznam je prázdný */}
                    {!loading && items.length === 0 && (
                        <div className="no-results_listing-container">
                            <h2 className="no-results_listing">
                                Nebyla nalezena žádná technika.
                            </h2>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Tech;
