import {
    faFlag,
    faHeart,
    faPenToSquare,
    faShareFromSquare,
} from "@fortawesome/free-regular-svg-icons";
import {
    faChevronLeft,
    faChevronRight,
    faHeart as faHeartSolid,
    faListCheck,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import imageCompression from "browser-image-compression";
import { useCallback, useEffect, useRef, useState } from "react";
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useScrollLock } from "../hooks/useScrollLock";
import { ROUTES, buildRoute } from "../routes/RouteNames";

import { useAlert } from "../context/AlertContext";
import { useFavourites } from "../hooks/useFavourites";
import FormImgManager from "./FormImgManager";
import { Stars } from "./Item";
import PopupReport from "./PopupReport";
import "./UserMoreInfo.css";

// Přijímáme props z UserDetail
const UserMoreInfo = ({
    userId,
    isFavouriteInitially,
    isLoggedUser,
    firstName,
    lastName = "",
    review_value,
    reviewsCount = 0,
    bio,
    location,
    createdAt,
    updatedAt,
    price,
    purpose, // 'rental' nebo 'sell'
    isTech,
    specs,
    riderImagesFromDb,
    onRefresh,
    setLoading,
}) => {
    const [images, setImages] = useState(riderImagesFromDb || []);
    const [isReportPopupOpen, setIsReportPopupOpen] = useState(false);

    // Kontrola změn oproti původním datům z DB pro zobrazení tlačítka pro uložení změn v seznamu techniky
    const [hasChanges, setHasChanges] = useState(false);
    useEffect(() => {
        // Pokud ještě nemáme data z DB, změny nejsou
        if (!riderImagesFromDb) return;

        // Jednoduché porovnání: liší se délka?
        if (images.length !== riderImagesFromDb.length) {
            setHasChanges(true);
            return;
        }

        // Liší se obsah nebo pořadí?
        const isDifferent = images.some(
            (img, index) => img !== riderImagesFromDb[index],
        );

        setHasChanges(isDifferent);
    }, [images, riderImagesFromDb]);

    const [isProcessingFiles, setIsProcessingFiles] = useState(false);

    const ImageWithSkeleton = ({ url, isPdf, onClick }) => {
        const [loaded, setLoaded] = useState(false);

        useEffect(() => {
            if (isPdf) {
                setLoaded(true);
            } else {
                setLoaded(false);
            }
        }, [url, isPdf]);

        return (
            <div
                className={`img_wrapper ${!loaded ? "skeleton_pulse" : ""}`}
                onClick={onClick}
                style={{ cursor: "pointer" }}
            >
                {isPdf ? (
                    <div className="pdf_preview_container">
                        {/* Skrytý embed jen pro "přednačtení", pokud je to nutné */}
                        <embed
                            src={url}
                            type="application/pdf"
                            onLoad={() => setLoaded(true)}
                        />
                        <div className="pdf_overlay_clicker"></div>
                    </div>
                ) : (
                    <img
                        src={url}
                        className={`img_item ${loaded ? "visible" : "hidden-abs"}`}
                        alt="rider"
                        onLoad={() => setLoaded(true)}
                    />
                )}
                {!loaded && <div className="skeleton_shimmer" />}
            </div>
        );
    };

    const upscaleImage = (file, minSize = 1200) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    if (img.width >= minSize && img.height >= minSize) {
                        resolve(file);
                        return;
                    }
                    let newWidth, newHeight;
                    if (img.width < img.height) {
                        newHeight = minSize;
                        newWidth = (img.width * minSize) / img.height;
                    } else {
                        newWidth = minSize;
                        newHeight = (img.height * minSize) / img.width;
                    }
                    const canvas = document.createElement("canvas");
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    const ctx = canvas.getContext("2d");
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = "high";
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                    canvas.toBlob((blob) => {
                        resolve(
                            new File([blob], file.name, { type: file.type }),
                        );
                    }, file.type);
                };
            };
        });
    };

    const { toggleFavourite } = useFavourites();
    const [isFav, setIsFav] = useState(isFavouriteInitially);

    const handleToggleFav = async () => {
        const previous = isFav;
        setIsFav(!previous); // Optimistický update

        try {
            await toggleFavourite("user", userId);
        } catch (err) {
            setIsFav(previous); // Rollback při chybě
            showAlert("error", "Nepodařilo se uložit do oblíbených.");
        }
    };

    useEffect(() => {
        if (riderImagesFromDb && riderImagesFromDb.length > 0) {
            // Transformujeme URL na objekty, aby manager věděl, co zobrazit
            setImages(riderImagesFromDb);
            console.log("Nahrané obrázky rideru:", riderImagesFromDb);
        } else {
            // Zabrání chybě "controlled to uncontrolled" nastavením prázdného pole místo null/undefined
            setImages([]);
        }
    }, [riderImagesFromDb]);

    // Pro posouvání mezi obrázky (index)
    const [currentIndex, setCurrentIndex] = useState(null); // Změna na index
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    useScrollLock(currentIndex !== null || isManagerOpen);
    const imgRef = useRef();
    const pdfRef = useRef(null);
    // Pomocná funkce pro detekci PDF
    const isPdfFile = (url) => {
        if (typeof url !== "string") return false;
        return (
            url.toLowerCase().endsWith(".pdf") ||
            url.includes("blob:") ||
            url.includes("application/pdf")
        );
    };

    const openGallery = (index) => setCurrentIndex(index);
    const closeGallery = () => setCurrentIndex(null);

    // Automatický focus na PDF při otevření
    useEffect(() => {
        if (currentIndex !== null && isPdfFile(images[currentIndex])) {
            // Malý timeout zajistí, že DOM je připraven
            const timer = setTimeout(() => {
                pdfRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, images]);

    // Obsluha klávesnice
    const nextImg = useCallback(
        (e) => {
            if (e) e.stopPropagation(); // Přidáme kontrolu, e může být null z klávesnice
            if (currentIndex < images.length - 1) {
                setCurrentIndex((prev) => prev + 1);
            }
        },
        [currentIndex, images.length],
    ); // Funkce se změní jen když se změní index nebo počet fotek

    const prevImg = useCallback(
        (e) => {
            if (e) e.stopPropagation();
            if (currentIndex > 0) {
                setCurrentIndex((prev) => prev - 1);
            }
        },
        [currentIndex],
    );

    // 2. useEffect teď bude stabilní
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

    const { showAlert } = useAlert();
    const [showFull, setShowFull] = useState(false); // Stav pro fullscreen zobrazení obrázku pro nevlastníka (mimo FormImgManager)

    const onUpdate = useCallback(({ x, y, scale }) => {
        if (imgRef.current) {
            const value = make3dTransformValue({ x, y, scale });
            imgRef.current.style.setProperty("transform", value);
        }
    }, []);

    // Formátování data registrace (pokud ho posíláš z Laravelu)
    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString("cs-CZ", {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : "---";

    const locationMap = {
        praha: "Praha",
        brno: "Brno",
        ostrava: "Ostrava",
        stredocesky: "Středočeský kraj",
        jihocesky: "Jihočeský kraj",
        plzensky: "Plzeňský kraj",
        karlovarsky: "Karlovarský kraj",
        ustecky: "Ústecký kraj",
        liberecky: "Liberecký kraj",
        kralovehradecky: "Královéhradecký kraj",
        vysocina: "Vysočina",
        jihomoravsky: "Jihomoravský kraj",
        olomoucky: "Olomoucký kraj",
        zlinsky: "Zlínský kraj",
        moravskoslezsky: "Moravskoslezský kraj",
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href);
        showAlert("success", "Odkaz zkopírován do schránky!");
    };

    // Stav pro obrázky, který sdílíme s FormImgManagerem
    const [isUploading, setIsUploading] = useState(false);

    const handleUpdateRider = async () => {
        setIsProcessingFiles(true);
        const formData = new FormData();
        try {
            formData.append("update_action", "clear_or_update");

            if (images.length > 0) {
                for (const img of images) {
                    if (img instanceof File) {
                        // Kontrola typu souboru
                        if (img.type === "application/pdf") {
                            // PDF neupravujeme, jen přidáme
                            formData.append("images[]", img);
                        } else {
                            // OBRÁZEK - Šetrnější zpracování
                            // Pokud je obrázek už velký, netřeba ho upscaleovat (vypnuto pro čitelnost)
                            // const upscaled = await upscaleImage(img); // Můžeš zvážit zakomentování, pokud to text rozmazává

                            const options = {
                                maxSizeMB: 4, // Zvýšeno z 1MB na 4MB pro zachování detailů textu
                                maxWidthOrHeight: 2560, // Zvýšeno z 1920 pro 2K/4K čitelnost
                                useWebWorker: true,
                                initialQuality: 0.9, // Vysoká počáteční kvalita
                            };
                            const compressedFile = await imageCompression(
                                img,
                                options,
                            );
                            formData.append("images[]", compressedFile);
                        }
                    } else if (typeof img === "string") {
                        formData.append("existing_images[]", img);
                    }
                }
            } else {
                formData.append("clear_all", "1");
            }

            await axiosInstance.post("/api/user/update-rider", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (onRefresh) await onRefresh();
            setHasChanges(false);
            showAlert("success", "Seznam techniky byl úspěšně aktualizován!");
        } catch (err) {
            console.error(err);
            showAlert("error", "Chyba při aktualizaci.");
        } finally {
            setIsProcessingFiles(true);
        }
    };

    // SEKCE POUZE PRO TECHNIKU
    // 1) Logika pro datum (Vloženo vs Upraveno)
    const getDisplayDate = () => {
        if (!createdAt) return "---";
        const created = new Date(createdAt);
        const updated = updatedAt ? new Date(updatedAt) : null;
        // Považujeme za upravené, pokud je rozdíl více než 1 minuta (pro jistotu)
        const isUpdated =
            isTech && updated && updated.getTime() - created.getTime() > 60000;
        const dateToFormat = isUpdated ? updated : created;
        const date = dateToFormat.toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        if (isTech) {
            return isUpdated ? `Upraveno ${date}` : `Vloženo ${date}`;
        }
        return `Uživatelem od ${date}`;
    };

    // 2) Logika pro cenu a lokalitu
    const renderPriceLocation = () => {
        const locName = locationMap[location] || location;
        // Pokud to NENÍ technika (je to profil uživatele), vrať jen lokalitu
        if (!isTech) {
            return <h3 className="price_location_header">{locName}</h3>;
        }
        // Pokud to JE technika, vrať kompletní info (Rentál za... v...)
        const typeText = purpose === "sell" ? "Prodej" : "Rentál";
        let priceValue;
        if (price) {
            priceValue =
                purpose === "rental" ? `${price} Kč / den` : `${price} Kč`;
        } else {
            priceValue = "dohodou";
        }

        return (
            <h3 className="price_location_header">
                {typeText}
                {price ? (
                    <span className="price_location_header_light_weight">
                        {" "}
                        za{" "}
                    </span>
                ) : (
                    <span> </span>
                )}
                {priceValue}
                <span className="price_location_header_light_weight"> v </span>
                {locName}
            </h3>
        );
    };

    const getReviewLabel = (count) => {
        if (count === 1) return "recenze";
        if (count >= 2 && count <= 4) return "recenze";
        return "recenzí";
    };

    return (
        <div className="user_more_info">
            <PopupReport
                isOpen={isReportPopupOpen}
                onClose={() => setIsReportPopupOpen(false)}
                targetId={userId}
                // Pokud je to technika, hlásíme 'items', jinak 'users'
                type={isTech ? "items" : "users"}
            />
            <div className="stars_container">
                <div className="stars">
                    <Stars rating={review_value} />
                </div>
                {reviewsCount > 0 ? (
                    <a href="#reviews_href" className="review_count">
                        {review_value} ({reviewsCount}{" "}
                        {getReviewLabel(reviewsCount)})
                    </a>
                ) : (
                    <a href="#reviews_href" className="review_count">
                        Nehodnoceno
                    </a>
                )}
            </div>

            {/* Dynamické Jméno */}
            <h1 className="name">
                {firstName} {lastName}
            </h1>
            <p className="since">{getDisplayDate()}</p>

            {/* Dynamické specializace (specs) z DB */}
            {!isTech && specs && specs.length > 0 && (
                <div className="category-container">
                    {specs.map((spec) => (
                        <div key={spec.id} className="checkbox">
                            <span>{spec.name}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Popis (Bio) */}
            <p className="description body_base">
                {bio ||
                    (isTech
                        ? "Tento inzerát nemá žádný popis."
                        : "Uživatel o sobě nic nenapsal.")}
            </p>

            {/* Lokalita */}
            <pre>{renderPriceLocation()}</pre>

            {/* SEZNAM TECHNIKY / RIDER */}
            {!isTech && (isLoggedUser || images.length > 0) && (
                <label className="body_base options_span_tech_label">
                    Seznam techniky
                </label>
            )}
            {isLoggedUser && hasChanges && (
                <div
                    className={`options_span_tech ${isProcessingFiles ? "is_busy" : "clickable"}`}
                    // Pokud se zpracovává nebo odesílá, onClick není definován
                    onClick={!isProcessingFiles ? handleUpdateRider : undefined}
                >
                    <FontAwesomeIcon
                        icon={isProcessingFiles ? faSpinner : faListCheck}
                        spin={isProcessingFiles}
                        className="options_icon"
                    />
                    <p className="options_text">
                        {isProcessingFiles
                            ? "Ukládám..."
                            : "Uložit změny v seznamu"}
                    </p>
                </div>
            )}

            <div>
                {isLoggedUser ? (
                    <FormImgManager
                        images={images}
                        setImages={setImages}
                        setIsProcessingFiles={setIsProcessingFiles}
                        isLoggedUser={true}
                        allowPdf={true}
                        onModalOpen={() => setIsManagerOpen(true)}
                        onModalClose={() => setIsManagerOpen(false)}
                        className="user_more_info_images"
                    />
                ) : (
                    <div className="user_more_info_images">
                        {images.map((url, i) => (
                            <ImageWithSkeleton
                                key={i}
                                url={url}
                                isPdf={isPdfFile(url)}
                                onClick={() => openGallery(i)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* FULLSCREEN GALERIE S PODPOROU PDF */}
            {currentIndex !== null && (
                <div
                    className="loader_container gallery_overlay"
                    onClick={closeGallery}
                >
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

                    <div
                        className="gallery_content_wrapper"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isPdfFile(images[currentIndex]) ? (
                            <div className="pdf_viewer_container">
                                <object
                                    ref={pdfRef}
                                    data={`${images[currentIndex]}#toolbar=1&navpanes=0&scrollbar=1`}
                                    type="application/pdf"
                                    className="pdf_embed_view"
                                    tabIndex="0" // Umožní focus
                                >
                                    <div className="pdf_fallback">
                                        <p>
                                            PDF nelze zobrazit přímo v
                                            prohlížeči.
                                        </p>
                                        <a
                                            href={images[currentIndex]}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn_download"
                                        >
                                            Otevřít PDF
                                        </a>
                                    </div>
                                </object>
                            </div>
                        ) : (
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
                                />
                            </QuickPinchZoom>
                        )}
                    </div>
                </div>
            )}

            {/* Akční tlačítka - Podmíněné vykreslování */}
            {/* Nezobrazovat className="options" pokud jde o techniku */}
            {!isTech && (
                <div className="options">
                    {isLoggedUser ? (
                        /* SEKCE PRO VLASTNÍKA */
                        <>
                            <span
                                className="options_span clickable"
                                onClick={() => console.log("Edit")}
                            >
                                <Link to={buildRoute(ROUTES.EDIT_PROFILE)}>
                                    <>
                                        <FontAwesomeIcon
                                            icon={faPenToSquare}
                                            className="options_icon"
                                        />
                                        <p className="options_text">
                                            Upravit profil
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
                                        ? "Pracovník je uložený"
                                        : "Uložit pracovníka"}
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
            )}
        </div>
    );
};

export default UserMoreInfo;
