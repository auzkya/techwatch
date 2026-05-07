import {
    faFlag,
    faPenToSquare,
    faTrashCan,
} from "@fortawesome/free-regular-svg-icons";
import { faCircleMinus, faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ASSETS } from "../config/assets";
import { ROUTES, buildRoute } from "../routes/RouteNames";
import makeSlug from "../utils/makeSlug";
import { Stars } from "./Item";
import PopupReport from "./PopupReport";
import "./Reviews.css";

const Review = ({ reviewData, currentUser, onEdit, onDelete }) => {
    const navigate = useNavigate();

    const isAuthor = currentUser && currentUser.id === reviewData.reviewer_id;

    const [isReportPopupOpen, setIsReportPopupOpen] = useState(false);

    // Logika pro určení typu nahlášení
    const reportType = reviewData.item_id ? "reviews_items" : "reviews_users";

    // Formátování data (např. "5. června")
    const formattedDate = new Date(reviewData.created_at).toLocaleDateString(
        "cs-CZ",
        {
            day: "numeric",
            month: "long",
        },
    );

    const handleProfileClick = () => {
        if (
            reviewData.reviewer?.id &&
            reviewData.reviewer?.first_name &&
            reviewData.reviewer?.last_name
        ) {
            const fullName = `${reviewData.reviewer?.first_name}-${reviewData.reviewer?.last_name}`;
            const slug = makeSlug(fullName).replace(/_/g, "-");

            navigate(`/user/${reviewData.reviewer?.id}/${slug}`);
        } else if (reviewData.reviewer?.id) {
            // Fallback pro případ, že jméno není k dispozici
            navigate(
                buildRoute(ROUTES.USER_DETAIL, { id: reviewData.reviewer?.id }),
            );
        }
    };

    return (
        <div className="review_component" id={`review-${reviewData.id}`}>
            <PopupReport
                isOpen={isReportPopupOpen}
                onClose={() => setIsReportPopupOpen(false)}
                targetId={reviewData.id} // ID samotné recenze
                type={reportType}
            />
            <div
                className="review_component_profile"
            >
                <div className="left">
                    <img
                        alt="avatar"
                        className="review_component_avatar"
                        src={
                            reviewData.reviewer?.profile_image_url ||
                            ASSETS.default_avatar
                        }
                    />
                </div>
            </div>

            <div className="review_component_main">
                <div className="profile_header">
                    <h3 className="strong" onClick={handleProfileClick}>
                        {reviewData.reviewer?.first_name}{" "}
                        {reviewData.reviewer?.last_name}
                    </h3>
                    <p className="role">
                        {reviewData.reviewer?.specs &&
                            reviewData.reviewer.specs.length > 0
                            ? reviewData.reviewer.specs
                                .map((s) => s.name)
                                .join(" | ")
                            : "Uživatel TechWatch"}
                    </p>
                </div>
                <div className="review_component_plus-minus">
                    {reviewData.pros?.filter(p => p.trim() !== "").length > 0 && (
                        <div className="review_component_plus-container">
                            {(Array.isArray(reviewData.pros)
                                ? reviewData.pros
                                : []
                            ).map((point, i) => (
                                <div
                                    key={i}
                                    className="review_component_point plus"
                                >
                                    <FontAwesomeIcon
                                        icon={faCirclePlus}
                                        className="icon"
                                    />
                                    <p className="text">{point}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {reviewData.cons?.filter(p => p.trim() !== "").length > 0 && (
                        <div className="review_component_minus-container">
                            {(Array.isArray(reviewData.cons)
                                ? reviewData.cons
                                : []
                            ).map((point, i) => (
                                <div
                                    key={i}
                                    className="review_component_point minus"
                                >
                                    <FontAwesomeIcon
                                        icon={faCircleMinus}
                                        className="icon"
                                    />
                                    <p className="text">{point}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <p className="description">{reviewData.review}</p>

                <div className="review_options">
                    {isAuthor ? (
                        <>
                            <span
                                className="options_span"
                                onClick={() =>
                                    onEdit({
                                        ...reviewData,
                                        rating: reviewData.review_value, // Mapování pro PopupReview
                                        text: reviewData.review, // Mapování pro PopupReview
                                    })
                                }
                            >
                                <FontAwesomeIcon
                                    icon={faPenToSquare}
                                    className="options_icon"
                                />
                                <p className="options_text body_smallest">Upravit recenzi</p>
                            </span>
                            <br />
                            <span className="options_span" onClick={onDelete}>
                                <FontAwesomeIcon
                                    icon={faTrashCan}
                                    className="options_icon"
                                />
                                <p className="options_text body_smallest">Smazat recenzi</p>
                            </span>
                        </>
                    ) : (
                        <span
                            className="options_span"
                            onClick={() => setIsReportPopupOpen(true)}
                        >
                            <FontAwesomeIcon
                                icon={faFlag}
                                className="options_icon"
                            />
                            <p className="options_text body_smallest">Nahlásit recenzi</p>
                        </span>
                    )}
                </div>
            </div>

            <div className="review_component_corner">
                <p className="date body_smallest">Hodnoceno {formattedDate}</p>
                <Stars rating={reviewData.review_value} />
            </div>

        </div>
    );
};

export default Review;
