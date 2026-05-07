import {
    faHeart as faHeartEmpty,
    faStar as faStarEmpty,
    faTrashCan,
} from "@fortawesome/free-regular-svg-icons";
import {
    faEye,
    faEyeSlash,
    faHeart as faHeartFull,
    faPenToSquare,
    faShareFromSquare,
    faStar as faStarFull,
    faStarHalfStroke,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { forwardRef, memo, useEffect, useState } from "react";
import { useAlert } from "../context/AlertContext";
import { useFavourites } from "../hooks/useFavourites";
import "./Item.css";

// Memoizujeme hvězdičky, aby se nepřekreslovaly zbytečně
export const Stars = memo(({ rating = 0, max = 5 }) => {
    const safeRating = Math.min(Math.max(Number(rating) || 0, 0), max);
    const fullStars = Math.floor(safeRating);
    const halfStar = safeRating - fullStars >= 0.5;
    const emptyStars = Math.max(0, max - fullStars - (halfStar ? 1 : 0));

    return (
        <div className="stars_container">
            {[...Array(fullStars)].map((_, i) => (
                <FontAwesomeIcon
                    key={"f" + i}
                    icon={faStarFull}
                    style={{ marginRight: 2 }}
                />
            ))}
            {halfStar && (
                <FontAwesomeIcon
                    key="h"
                    icon={faStarHalfStroke}
                    style={{ marginRight: 2 }}
                />
            )}
            {[...Array(emptyStars)].map((_, i) => (
                <FontAwesomeIcon
                    key={"e" + i}
                    icon={faStarEmpty}
                    style={{ marginRight: 2 }}
                />
            ))}
        </div>
    );
});

// Definujeme hlavní tělo komponenty
const ItemBase = forwardRef((props, ref) => {
    const {
        id,
        profile_picture,
        name,
        rating,
        role,
        onClick,
        isActiveWorker,
        isFavouriteInitially,
        price,
        purpose,
        quantity,
        isOwner,
        activeItem,
        onEdit,
        onDelete,
        onStatusChange,
        onShare,
    } = props;

    const { showAlert } = useAlert();
    const { toggleFavourite } = useFavourites();
    const [isFav, setIsFav] = useState(isFavouriteInitially);
    const isTech = purpose !== undefined && purpose !== null;

    useEffect(() => {
        setIsFav(isFavouriteInitially);
    }, [isFavouriteInitially]);

    const handleFavClick = async (e) => {
        e.stopPropagation();
        const previousState = isFav;
        setIsFav(!previousState);
        try {
            await toggleFavourite(isTech ? "item" : "user", id);
        } catch (error) {
            setIsFav(previousState);
            showAlert("error", "Nepodařilo se uložit do oblíbených.");
        }
    };

    const renderTechInfo = () => {
        const typeText = purpose === "sell" ? "Prodej" : "Rentál";
        if (!price || price === 0) return `${typeText} dohodou`;
        const formattedPrice = new Intl.NumberFormat("cs-CZ").format(price);
        const unit = purpose === "rental" ? " / den" : "";
        return (
            <>
                {typeText} <span className="light-weight-text">za</span>{" "}
                {formattedPrice} Kč{unit}
            </>
        );
    };

    const renderQuantityInfo = () => {
        if (quantity === undefined || quantity === null) return null;
        return <>{quantity} ks</>;
    };

    return (
        <div
            className={`item ${!activeItem && isOwner ? "item-inactive" : ""} ${(isActiveWorker === false || activeItem === false) ? "item-offline" : ""} ${(activeItem === false) ? "item-unclickable" : ""}`}
            onClick={onClick}
            ref={ref}
        >
            <div className="item_image_container">
                <img
                    className="item_profile_img"
                    alt={name}
                    src={profile_picture}
                    loading="lazy"
                />

                {isActiveWorker === false && (
                    <div className="status-badge-offline">Nehledá práci</div>
                )}
                {((activeItem === false) || (!activeItem && isOwner)) && (
                    <div className="status-badge-offline">Neaktivní nabídka</div>
                )}

            </div>

            <div className="item_specs">
                {!isOwner && (
                    <FontAwesomeIcon
                        icon={isFav ? faHeartFull : faHeartEmpty}
                        className={`heart ${isFav ? "fav-active" : ""}`}
                        onClick={handleFavClick}
                    />
                )}

                <div className="rating_row">
                    {rating && rating > 0 ? (
                        <>
                            <div className="stars">
                                <Stars rating={rating} />
                            </div>
                            <p className="stars_number">{rating}</p>
                        </>
                    ) : (
                        <p className="no_rating">Nehodnoceno</p>
                    )}
                </div>

                <p className="name body_base strong">{name}</p>
                {!isTech && (
                    <p className="role">{role?.replace(/;/g, " | ")}</p>
                )}

                {isTech && (
                    <>
                        <p className="role2">{renderTechInfo()}</p>
                        <p className="role2">{renderQuantityInfo()}</p>
                    </>
                )}

                {isOwner && (
                    <div className="item-edit-menu">
                        {/* Tooltip: Skrýt/Zobrazit */}
                        <div className="tooltip-wrapper tooltip-wrapper-auto-width has-tooltip">
                            <FontAwesomeIcon
                                icon={activeItem ? faEyeSlash : faEye}
                                className="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(id, !activeItem);
                                }}
                            />
                            <span className="tooltip-bubble">
                                {activeItem
                                    ? "Skrýt nabídku"
                                    : "Zveřejnit nabídku"}
                            </span>
                        </div>

                        {/* Tooltip: Upravit */}
                        <div className="tooltip-wrapper tooltip-wrapper-auto-width has-tooltip">
                            <FontAwesomeIcon
                                icon={faPenToSquare}
                                className="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(id);
                                }}
                            />
                            <span className="tooltip-bubble">
                                Upravit nabídku
                            </span>
                        </div>

                        {/* Tooltip: Sdílet */}
                        <div className="tooltip-wrapper tooltip-wrapper-auto-width has-tooltip">
                            <FontAwesomeIcon
                                icon={faShareFromSquare}
                                className="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShare(id);
                                }}
                            />
                            <span className="tooltip-bubble">Sdílet</span>
                        </div>

                        {/* Tooltip: Smazat */}
                        <div className="tooltip-wrapper tooltip-wrapper-auto-width has-tooltip">
                            <FontAwesomeIcon
                                icon={faTrashCan}
                                className="icon delete-icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(id);
                                }}
                            />
                            <span className="tooltip-bubble">Smazat</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

// Exportujeme jako memoizovanou komponentu
export default memo(ItemBase, (prev, next) => {
    return (
        prev.id === next.id &&
        prev.isFavouriteInitially === next.isFavouriteInitially &&
        prev.activeItem === next.activeItem &&
        prev.rating === next.rating &&
        prev.isActiveWorker === next.isActiveWorker
    );
});
