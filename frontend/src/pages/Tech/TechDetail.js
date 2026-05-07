import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { ASSETS } from "../../config/assets";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { useScrollLock } from "../../hooks/useScrollLock";

import Path from "../../components/Path";
import PopupReview from "../../components/PopupReview";
import Review from "../../components/Reviews";
import TechPhoto from "../../components/TechPhoto";
import UserBasicInfo from "../../components/UserBasicInfo";
import UserMoreInfo from "../../components/UserMoreInfo";
import { useScrollToHash } from "../../hooks/useScrollToHash";

import { faPencil } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./TechDetail.css";

const TechDetail = () => {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const { showAlert } = useAlert();
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin =
        currentUser &&
        ["admin_moderator", "super_admin"].includes(currentUser.role);

    // Stavy pro inzerát
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    // Stavy pro recenze
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Stavy pro Popupy
    const [isReviewPopupOpen, setIsReviewPopupOpen] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false); // Pro mazání inzerátu
    const [showReviewDeletePopup, setShowReviewDeletePopup] = useState(false); // Pro mazání recenze
    const [reviewToDelete, setReviewToDelete] = useState(null);

    // Zámek scrollování
    useScrollLock(
        (loading && !item) ||
        actionLoading ||
        isReviewPopupOpen ||
        showDeletePopup ||
        showReviewDeletePopup,
    );

    const isOwner = currentUser && String(currentUser.id) === String(item?.user_id);

    const canWriteReview = currentUser && !isOwner;

    const existingReview = reviews.find(
        (r) => String(r.reviewer_id) === String(currentUser?.id),
    );

    // --- Načítání Dat ---
    const fetchTech = useCallback(async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const res = await axiosInstance.get(`/api/tech/${id}`);
            setItem(res.data.item);
        } catch (err) {
            console.error("Chyba při načítání:", err);
            if (!isSilent) setItem(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchReviews = useCallback(async (isSilent = false) => {
        try {
            if (isSilent) setLoadingReviews(true);
            const res = await axiosInstance.get(`/api/item/${id}/reviews`);

            // Pokud je to silent update, dáme DOMu čas na animaci
            if (isSilent) {
                setTimeout(() => {
                    setReviews(res.data);
                    setLoadingReviews(false);
                }, 150);
            } else {
                setReviews(res.data);
                setLoadingReviews(false);
            }
        } catch (err) {
            console.error("Chyba při načítání recenzí:", err);
            setLoadingReviews(false);
        }
    }, [id]);

    // Relatime Reviews pomocí Echo
    useEffect(() => {
        if (!id || !window.Echo) return;

        const channel = window.Echo.channel(`item.${id}`);

        console.log(`📡 Poslouchám změny na kanálu: item.${id}`);

        channel.listen(".ReviewUpdated", (e) => {
            console.log("⚡ Realtime update: Nová recenze detekována", e);

            // Silent update, aby stránka nezmizela
            fetchReviews(true);
            fetchTech(true);
        });

        return () => {
            window.Echo.leaveChannel(`item.${id}`);
        };
    }, [id, fetchReviews, fetchTech]);

    useEffect(() => {
        fetchTech();
        fetchReviews();
    }, [fetchTech, fetchReviews]);

    // --- Handler pro Inzerát ---
    const handleDeleteItem = async () => {
        try {
            setActionLoading(true);
            await axiosInstance.delete(`/api/items/${id}`);
            showAlert("success", "Nabídka byla úspěšně smazána.");
            navigate(`/user/${currentUser.id}/listings`);
        } catch (err) {
            showAlert("error", "Nabídku se nepodařilo smazat.");
        } finally {
            setActionLoading(false);
            setShowDeletePopup(false);
        }
    };

    // Funkce pro aktualizaci stavu aktivity z potomka
    const handleStatusToggle = (newActiveStatus) => {
        setItem(prev => ({
            ...prev,
            active_item: newActiveStatus
        }));
    };

    // --- Handlery pro Recenze ---
    const handleReviewSubmit = async (reviewData) => {
        setActionLoading(true);
        try {
            if (existingReview) {
                await axiosInstance.put(
                    `/api/reviews-item/${existingReview.id}`,
                    reviewData,
                );
                showAlert("success", "Recenze techniky aktualizována");
            } else {
                await axiosInstance.post(`/api/item/${id}/reviews`, reviewData);
                showAlert("success", "Recenze techniky přidána");
            }
            // Načíst znovu recenze I inzerát
            await Promise.all([fetchReviews(true), fetchTech(true)]);
        } catch (err) {
            showAlert("error", "Chyba při ukládání recenze.");
        } finally {
            setIsReviewPopupOpen(false);
            setActionLoading(false);
        }
    };

    // --- Scroll na recenzi po kliknutí z notifikace ---
    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.startsWith("#review-")) {
            // Počkáme chvíli, než se recenze načtou z API
            setTimeout(() => {
                const element = document.getElementById(hash.substring(1));
                if (element) {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }
            }, 500); // Timeout je nutný, pokud se data teprve stahují
        }
    }, [location]);

    const handleDeleteReviewClick = (reviewId) => {
        setReviewToDelete(reviewId);
        setShowReviewDeletePopup(true);
    };

    const handleConfirmDeleteReview = async () => {
        setShowReviewDeletePopup(false);
        setActionLoading(true);
        try {
            await axiosInstance.delete(`/api/reviews-item/${reviewToDelete}`);
            showAlert("success", "Recenze smazána");
            // Opět načíst obojí
            await Promise.all([fetchReviews(), fetchTech()]);
        } catch (err) {
            showAlert("error", "Chyba při mazání recenze.");
        } finally {
            setActionLoading(false);
        }
    };

    useScrollToHash([reviews]); // Spustí se i po načtení recenzí - důležité pro scroll na recenzi z notifikace

    if (loading && !item)
        return (
            <div className="loader_container">
                <div className="loader"></div>
            </div>
        );
    // Inzerát je smazaný
    if (!item) {
        return (
            <div className="no-results_tech-container">
                <h2 className="no-results_tech">
                    Tato nabídka neexistuje nebo byla trvale odstraněna
                </h2>
            </div>
        );
    }

    // Kontrola neaktivního inzerátu (soft-delete nebo active_item)
    const isActuallyDeleted = item.is_deleted;
    const isInactive = !item.active_item && !isActuallyDeleted;

    if (isActuallyDeleted && !isAdmin) {
        return (
            <div className="no-results_tech-container">
                <h2 className="no-results_tech">Tato nabídka byla smazána</h2>
            </div>
        );
    }
    if (isInactive && !isOwner) {
        return (
            <div className="no-results_tech-container">
                <h2 className="no-results_tech">Tato nabídka je neaktivní</h2>
            </div>
        );
    }

    return (
        <>
            {actionLoading && (
                <div className="loader_container">
                    <div className="loader" />
                </div>
            )}

            {/* Path */}
            <Path
                mode="tech"
                category={item.category}
                name={item.title}
            />

            {/* Varovné pruhy */}
            {isActuallyDeleted && isAdmin && (
                <div className="deleted-warning-bar strong">
                    Tato nabídka byla smazána. Vidíte ji pouze jako
                    administrátor.
                </div>
            )}

            {isInactive && isOwner && (
                <div className="non_active-warning-bar strong">
                    Tato nabídka je neaktivní. Vidíte ji pouze jako její
                    majitel.
                </div>
            )}

            {/* Popup pro Recenze */}
            <PopupReview
                isOpen={isReviewPopupOpen}
                onClose={() => setIsReviewPopupOpen(false)}
                onSubmit={handleReviewSubmit}
                onDelete={() => handleDeleteReviewClick(id)}
                targetName={item.title}
                type="item"
                initialData={
                    existingReview
                        ? {
                            rating: existingReview.review_value,
                            pros: existingReview.pros || [""],
                            cons: existingReview.cons || [""],
                            text: existingReview.review,
                        }
                        : null
                }
            />

            {/* Popup pro Smazání Inzerátu */}
            {showDeletePopup && (
                <div
                    className="popup_container"
                    onClick={() => setShowDeletePopup(false)}
                >
                    <div
                        className="popup_small"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Opravdu chcete tuto nabídku trvale smazat?</h3>
                        <div className="cropped">
                            <button
                                className="form-submit"
                                onClick={handleDeleteItem}
                            >
                                <p
                                    className="strong"
                                    style={{ color: "white" }}
                                >
                                    Ano
                                </p>
                            </button>
                            <button
                                className="secondary_button"
                                onClick={() => setShowDeletePopup(false)}
                            >
                                <p className="oauth_text strong">Ne</p>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup pro Smazání Recenze */}
            {showReviewDeletePopup && (
                <div
                    className="popup_container"
                    onClick={() => setShowReviewDeletePopup(false)}
                >
                    <div
                        className="popup_small"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Opravdu chcete tuto recenzi trvale smazat?</h3>
                        <div className="cropped">
                            <button
                                className="form-submit"
                                onClick={handleConfirmDeleteReview}
                            >
                                <p
                                    className="strong"
                                    style={{ color: "white" }}
                                >
                                    Ano
                                </p>
                            </button>
                            <button
                                className="secondary_button"
                                onClick={() => setShowReviewDeletePopup(false)}
                            >
                                <p className="oauth_text strong">Ne</p>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div
                className="tech_container"
                style={
                    isActuallyDeleted
                        ? { pointerEvents: "none", opacity: 0.8 }
                        : {}
                }
            >
                <TechPhoto
                    itemId={item.id}
                    images={
                        item.image_urls?.length > 0
                            ? item.image_urls
                            : [ASSETS.default_item]
                    }
                    isLoggedUser={isOwner}
                    isActiveInitially={item.active_item}
                    onStatusChange={handleStatusToggle}
                    isFavouriteInitially={item.is_favourite}
                    onDeleteClick={() => setShowDeletePopup(true)}
                />
                <UserMoreInfo
                    isTech={true}
                    firstName={item.title}
                    review_value={item.review_value || 0}
                    reviewsCount={item.reviews_count || 0}
                    bio={item.description}
                    location={item.location}
                    price={item.price}
                    purpose={item.purpose}
                    createdAt={item.created_at}
                    updatedAt={item.updated_at}
                />
                <UserBasicInfo
                    isTechDetail={true}
                    currentUser={isOwner}
                    userId={item.user?.id}
                    firstName={item.user?.first_name}
                    lastName={item.user?.last_name}
                    profileImage={item.user?.profile_image_url}
                    obs_email={item.user?.obs_email}
                    obs_phone={item.user?.obs_phone}
                    email={item.user?.email}
                    phone={item.user?.phone}
                    phoneVisible={item.user?.phone_visible}
                    specs={item.user?.specs || []}
                    techTitle={item.title}
                    techId={item.id}
                />
            </div>

            <div
                className="reviews_container"
                id="reviews_href"
                style={
                    isActuallyDeleted
                        ? { pointerEvents: "none", opacity: 0.8 }
                        : {}
                }
            >
                <h2 className="strong">
                    Recenze zařízení <span>({reviews.length})</span>
                </h2>
                {canWriteReview && (
                    <button
                        type="button"
                        className="write-review"
                        onClick={() => setIsReviewPopupOpen(true)}
                    >
                        <FontAwesomeIcon
                            icon={faPencil}
                            className="options_icon"
                        />
                        <p className="body_base strong">
                            {existingReview
                                ? "Upravit recenzi"
                                : "Napsat recenzi"}
                        </p>
                    </button>
                )}
                <div className={`all-reviews ${loadingReviews && reviews.length > 0 ? 'refreshing-opacity' : ''}`}>
                    {loadingReviews && reviews.length === 0 ? (
                        <div className="loader"></div>
                    ) : reviews.length > 0 ? (
                        reviews.map((rev) => (
                            <Review
                                key={rev.id}
                                reviewData={rev}
                                currentUser={currentUser}
                                onEdit={() => setIsReviewPopupOpen(true)}
                                onDelete={() => handleDeleteReviewClick(rev.id)}
                            />
                        ))
                    ) : (
                        <div className="no-results_listing-container-reviews">
                            <h3 className="no-results_listing">
                                Toto zařízení zatím nemá žádné recenze.
                            </h3>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default TechDetail;
