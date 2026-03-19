import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { useScrollLock } from "../../hooks/useScrollLock";
import makeSlug from "../../utils/makeSlug";

import Path from "../../components/Path";
import PopupReview from "../../components/PopupReview";
import UserBasicInfo from "../../components/UserBasicInfo";
import UserMoreInfo from "../../components/UserMoreInfo";

import axiosInstance from "../../api/axiosInstance";
import Review from "../../components/Reviews";
import { useScrollToHash } from "../../hooks/useScrollToHash";
import "./UserDetail.css";

import { faPencil } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const UserDetail = () => {
    // Použití ID z URL; slug slouží pouze pro čitelnost adresy
    const { id, slug } = useParams();
    const { user: currentUser } = useAuth();

    const { showAlert } = useAlert();

    // Kontrola administrátorských oprávnění
    const isAdmin =
        currentUser &&
        ["admin_moderator", "super_admin"].includes(currentUser.role);

    const isLoggedUser = currentUser && String(currentUser.id) === String(id);

    // Zobrazení akce recenze pouze pro přihlášeného uživatele mimo vlastní profil
    const canWriteReview = currentUser && String(currentUser.id) !== String(id);
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    const location = useLocation();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fromCategory = location.state?.fromCategory;
    const fromMode = location.state?.fromMode;

    const [isReviewPopupOpen, setIsReviewPopupOpen] = useState(false);

    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);
    // Vyhledání recenze aktuálního uživatele
    const existingReview = reviews.find(
        (r) => String(r.reviewer_id) === String(currentUser?.id),
    );
    const fetchReviews = async () => {
        try {
            setLoadingReviews(true);
            const res = await axiosInstance.get(`/api/user/${id}/reviews`);
            setReviews(res.data);
        } catch (err) {
            console.error("Chyba při načítání recenzí:", err);
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleReviewSubmit = async (reviewData) => {
        setActionLoading(true);
        try {
            if (existingReview) {
                await axiosInstance.put(
                    `/api/reviews-user/${existingReview.id}`,
                    reviewData,
                );
                showAlert("success", "Recenze byla aktualizována");
            } else {
                await axiosInstance.post(`/api/user/${id}/reviews`, reviewData);
                showAlert("success", "Recenze byla přidána");
            }

            // Obnovení recenzí i profilu po uložení změny
            await Promise.all([fetchReviews(), fetchUser()]);
        } catch (err) {
            showAlert("error", "Chyba při ukládání recenze.");
        } finally {
            setIsReviewPopupOpen(false);
            setActionLoading(false);
        }
    };

    const handleDeleteReviewClick = (reviewId) => {
        setReviewToDelete(reviewId);
        setShowDeletePopup(true);
    };

    const handleConfirmDelete = async () => {
        setShowDeletePopup(false);
        setActionLoading(true);
        try {
            await axiosInstance.delete(`/api/reviews-user/${reviewToDelete}`);
            showAlert("success", "Recenze byla smazána");
            await Promise.all([fetchReviews(), fetchUser()]);
        } catch (err) {
            showAlert("error", "Chyba při mazání recenze.");
        } finally {
            setActionLoading(false);
        }
    };

    useScrollLock(actionLoading || isReviewPopupOpen || showDeletePopup);

    const searchedUserID = id;

    const fetchUser = useCallback(async () => {
        if (!searchedUserID) return;

        try {
            setInitialLoading(true);
            const response = await axiosInstance.get(
                `/api/user/${searchedUserID}`,
            );

            setProfileData({
                ...response.data.user,
                rider_images: response.data.rider_images,
            });
        } catch (error) {
            console.error("Chyba při načítání uživatele:", error);
            setProfileData(null);
        } finally {
            setInitialLoading(false);
        }
    }, [searchedUserID]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // Opakované vyhodnocení hash kotvy po načtení recenzí
    useScrollToHash([reviews]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await axiosInstance.get(`/api/user/${id}/reviews`);
                setReviews(res.data);
            } catch (err) {
                console.error("Chyba při načítání recenzí:", err);
            } finally {
                setLoadingReviews(false);
            }
        };
        fetchReviews();
    }, [id]);

    useEffect(() => {
        if (profileData) {
            const fullName = `${profileData.first_name}-${profileData.last_name}`;
            // Normalizace slugu na pomlčky místo podtržítek
            const correctSlug = makeSlug(fullName).replace(/_/g, "-");

            if (slug !== correctSlug) {
                navigate(`/user/${id}/${correctSlug}`, {
                    replace: true,
                    state: location.state,
                });
            }
        }
    }, [profileData, id, slug, navigate, location.state]);

    useEffect(() => {
        if (!isLoggedUser || !currentUser || !profileData) return;

        // Porovnání hodnot aktivního stavu bez porovnávání objektů
        if (currentUser.active_worker_till !== profileData.active_worker_till) {
            setProfileData((prev) => ({
                ...prev,
                active_worker_till: currentUser.active_worker_till,
            }));
        }
    }, [currentUser, profileData, isLoggedUser]);

    // Scroll na konkrétní recenzi po příchodu z notifikace
    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.startsWith("#review-")) {
            // Zpoždění kvůli dokončení renderu po načtení dat
            setTimeout(() => {
                const element = document.getElementById(hash.substring(1));
                if (element) {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                    element.classList.add("highlight-flash");
                }
            }, 500);
        }
    }, [location]);

    if (initialLoading)
        return (
            <div className="loader_container">
                <div className="loader"></div>
            </div>
        );
    if (!profileData) {
        return (
            <div className="no-results_tech-container">
                <h2 className="no-results_tech">Uživatel nenalezen</h2>
            </div>
        );
    }

    const isBanned = profileData.is_banned;
    const isActive = profileData.active_worker_till
        ? new Date(profileData.active_worker_till) > new Date()
        : false;

    if (isBanned && !isAdmin) {
        return (
            <div className="no-results_tech-container">
                <h2 className="no-results_tech">Tento uživatel je zabanován</h2>
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

            <Path
                mode={fromMode}
                category={fromCategory}
                userName={`${profileData.first_name} ${profileData.last_name}`}
            />

            {isBanned && isAdmin && (
                <div className="deleted-warning-bar strong">
                    Tento uživatel je zabanován. Vidíte ho pouze jako
                    administrátor.
                </div>
            )}

            <PopupReview
                isOpen={isReviewPopupOpen}
                onClose={() => setIsReviewPopupOpen(false)}
                onSubmit={handleReviewSubmit}
                onDelete={() => handleDeleteReviewClick(id)}
                targetName={`${profileData.first_name} ${profileData.last_name}`}
                type="user"
                initialData={
                    existingReview
                        ? {
                              // Mapování polí z databáze na vstupní strukturu popupu
                              rating: existingReview.review_value,
                              pros: existingReview.pros || [""],
                              cons: existingReview.cons || [""],
                              text: existingReview.review,
                          }
                        : null
                }
            />
            {showDeletePopup && (
                <div
                    className="popup_container"
                    onClick={() => setShowDeletePopup(false)}
                >
                    <div
                        className="popup_small"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Opravdu chcete tuto recenzi trvale smazat?</h3>
                        <div className="cropped">
                            <button
                                className="form-submit"
                                onClick={handleConfirmDelete}
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
            <div
                className="user_container"
                style={isBanned ? { pointerEvents: "none", opacity: 0.8 } : {}}
            >
                <UserBasicInfo
                    currentUser={isLoggedUser}
                    profileImage={profileData.profile_image_url}
                    isActive={isActive}
                    email={profileData.email}
                    phone={profileData.phone}
                    phoneVisible={profileData.phone_visible}
                    userId={profileData.id}
                    firstName={profileData.first_name}
                    lastName={profileData.last_name}
                    isTechDetail={false}
                />

                <UserMoreInfo
                    userId={profileData.id}
                    isFavouriteInitially={profileData.is_favourite}
                    isLoggedUser={isLoggedUser}
                    firstName={profileData.first_name}
                    lastName={profileData.last_name}
                    review_value={profileData.review_value || 0}
                    reviewsCount={profileData.reviews_count || 0}
                    bio={profileData.bio}
                    location={profileData.location}
                    createdAt={profileData.created_at}
                    specs={profileData.specs}
                    riderImagesFromDb={profileData.rider_images}
                    onRefresh={fetchUser}
                    setLoading={setActionLoading}
                />
            </div>

            <div
                className="reviews_container"
                id="reviews_href"
                style={isBanned ? { pointerEvents: "none", opacity: 0.8 } : {}}
            >
                <h2 className="strong">
                    Pracovní recenze <span>({reviews.length})</span>
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
                <div className="all-reviews">
                    {loadingReviews ? (
                        <div className="loader_container_reviews">
                            <div className="loader"></div>
                        </div>
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
                                Tento uživatel zatím nemá žádné recenze.
                            </h3>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UserDetail;
