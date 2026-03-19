import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../src/api/axiosInstance.js";
import { ROUTES, buildRoute } from "../routes/RouteNames";
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";

import {
    faHeart as faHeartSolid,
    faChevronLeft,
    faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faHeart,
    faFlag,
    faShareFromSquare,
    faPenToSquare,
    faTrashCan,
} from "@fortawesome/free-regular-svg-icons";

import "./TechPhoto.css";
import { useAlert } from "../context/AlertContext";
import { useFavourites } from "../hooks/useFavourites";
import PopupReport from "./PopupReport";

const TechPhoto = ({
    images = [],
    isLoggedUser,
    itemId,
    isFavouriteInitially,
    onDeleteClick,
}) => {
    const { showAlert } = useAlert();

    const navigate = useNavigate(); // Hook pro přesměrování
    const [loading, setLoading] = useState(false);

    const [isReportPopupOpen, setIsReportPopupOpen] = useState(false);

    // Pro posouvání mezi obrázky (index)
    const [currentIndex, setCurrentIndex] = useState(null); // Změna na index
    const imgRef = useRef();
    const openGallery = (index) => setCurrentIndex(index);
    const closeGallery = () => setCurrentIndex(null);

    // Obsluha klávesnice
    const nextImg = useCallback(
        (e) => {
            if (e) e.stopPropagation();
            setCurrentIndex((prev) => (prev + 1) % images.length);
        },
        [images.length],
    ); // Funkce se změní jen když se změní počet fotek

    const prevImg = useCallback(
        (e) => {
            if (e) e.stopPropagation();
            setCurrentIndex(
                (prev) => (prev - 1 + images.length) % images.length,
            );
        },
        [images.length],
    );
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (currentIndex === null) return;
            if (e.key === "ArrowRight") nextImg(e);
            if (e.key === "ArrowLeft") prevImg(e);
            if (e.key === "Escape") closeGallery();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentIndex, nextImg, prevImg, closeGallery]);

    // Hlavní fotka bude první v poli
    const mainPhoto = images.length > 0 ? images[0] : "placeholder.jpg";
    // Ostatní fotky (od indexu 1 dále)
    const otherPhotos = images.slice(1);

    //zvětšení obrázku
    const [showFull, setShowFull] = useState(false); // Stav pro fullscreen zobrazení obrázku
    const onUpdate = useCallback(({ x, y, scale }) => {
        if (imgRef.current) {
            const value = make3dTransformValue({ x, y, scale });
            imgRef.current.style.setProperty("transform", value);
        }
    }, []);

    const { toggleFavourite } = useFavourites();
    const [isFav, setIsFav] = useState(isFavouriteInitially);

    const handleToggleFav = async () => {
        const previous = isFav;
        setIsFav(!previous); // Optimistický update

        try {
            await toggleFavourite("item", itemId);
        } catch (err) {
            setIsFav(previous); // Rollback při chybě
            showAlert("error", "Nepodařilo se uložit do oblíbených.");
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href);
        showAlert("success", "Odkaz zkopírován do schránky!");
    };

    // --- POPUP LOGIKA ---
    const [deleteItemId, setDeleteItemId] = useState(null); // Ukládáme ID mazané položky
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const openDeletePopup = (itemId) => {
        setDeleteItemId(itemId);
        setShowDeletePopup(true);
    };
    const handleClosePopup = () => {
        setShowDeletePopup(false);
        setDeleteItemId(null);
    };
    // ESC zavře popup
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape" && showDeletePopup) {
                handleClosePopup();
            }
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [showDeletePopup]);

    const confirmDeleteAction = async () => {
        if (!deleteItemId) return;

        handleClosePopup();
        setLoading(true);

        try {
            await axiosInstance.delete(`/api/tech/${deleteItemId}`);

            showAlert("success", "Nabídka byla úspěšně smazána.");

            // Přesměrování na listings uživatele (předpokládám, že máš v AuthContextu ID)
            // Pokud nemáš přístup k ID uživatele zde, můžeš přesměrovat na obecný dashboard
            // nebo si ID poslat jako prop.
            navigate(-1); // Jednoduchý návrat zpět, nebo:
            // navigate(buildRoute(ROUTES.USER_LISTINGS, { id: currentUserId }));
        } catch (err) {
            console.error(err);
            showAlert("error", "Nabídku se nepodařilo smazat.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tech_photo_container">
            <PopupReport
                isOpen={isReportPopupOpen}
                onClose={() => setIsReportPopupOpen(false)}
                targetId={itemId}
                type={"items"}
            />
            <div className="tech_photo_container_main_photo">
                <img
                    src={images[0] || "placeholder.jpg"}
                    alt="main"
                    onClick={() => openGallery(0)}
                />
            </div>

            <div className="tech_photo_container_other_photos_placeholder">
                {images.slice(1).map((img, index) => (
                    <div
                        className="tech_photo_container_other_photo"
                        key={index}
                    >
                        <img
                            src={img}
                            alt={`tech_${index}`}
                            onClick={() => openGallery(index + 1)}
                        />
                    </div>
                ))}
            </div>

            {currentIndex !== null && (
                <div
                    className="loader_container gallery_overlay"
                    onClick={closeGallery}
                >
                    {/* Navigační šipky */}
                    {images.length > 1 && (
                        <>
                            <button
                                className={`gallery_nav prev ${currentIndex === 0 ? "disabled" : ""}`}
                                onClick={prevImg}
                                disabled={currentIndex === 0}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </button>

                            <button
                                className={`gallery_nav next ${currentIndex === images.length - 1 ? "disabled" : ""}`}
                                onClick={nextImg}
                                disabled={currentIndex === images.length - 1}
                            >
                                <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        </>
                    )}

                    <QuickPinchZoom
                        onUpdate={onUpdate}
                        key={currentIndex}
                        maxZoom={5}
                    >
                        <img
                            ref={imgRef}
                            src={images[currentIndex]}
                            alt="fullscreen"
                            className="form_img_full"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </QuickPinchZoom>
                </div>
            )}

            {/* Akční tlačítka - Podmíněné vykreslování */}
            <div className="options">
                {isLoggedUser ? (
                    /* SEKCE PRO VLASTNÍKA */
                    <>
                        <span
                            className="options_span clickable"
                            onClick={() => console.log("Edit")}
                        >
                            <Link
                                to={buildRoute(ROUTES.EDIT_TECH, {
                                    id: itemId,
                                })}
                            >
                                <>
                                    <FontAwesomeIcon
                                        icon={faPenToSquare}
                                        className="options_icon"
                                    />
                                    <p className="options_text">
                                        Upravit nabídku
                                    </p>
                                </>
                            </Link>
                        </span>
                        <br></br>
                        <span
                            className="options_span clickable"
                            onClick={() => copyToClipboard()}
                        >
                            <FontAwesomeIcon
                                icon={faShareFromSquare}
                                className="options_icon"
                            />
                            <p className="options_text">Sdílet</p>
                        </span>
                        <br></br>
                        <span
                            className="options_span clickable"
                            onClick={onDeleteClick}
                        >
                            <FontAwesomeIcon
                                icon={faTrashCan}
                                className="options_icon"
                            />
                            <p className="options_text">Smazat</p>
                        </span>
                    </>
                ) : (
                    /* SEKCE PRO OSTATNÍ */
                    <>
                        <span
                            className="options_span clickable"
                            onClick={handleToggleFav}
                        >
                            <FontAwesomeIcon
                                icon={isFav ? faHeartSolid : faHeart}
                                className={`options_icon ${isFav ? "fav-active" : ""}`}
                            />
                            <p className="options_text">
                                {isFav
                                    ? "Nabídka je uložena"
                                    : "Uložit nabídku"}
                            </p>
                        </span>
                        <br></br>
                        <span
                            className="options_span clickable"
                            onClick={() => copyToClipboard()}
                        >
                            <FontAwesomeIcon
                                icon={faShareFromSquare}
                                className="options_icon"
                            />
                            <p className="options_text">Sdílet</p>
                        </span>
                        <br></br>
                        <span
                            className="options_span clickable danger"
                            onClick={() => setIsReportPopupOpen(true)}
                        >
                            <FontAwesomeIcon
                                icon={faFlag}
                                className="options_icon"
                            />
                            <p className="options_text">Nahlásit</p>
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};

export default TechPhoto;
