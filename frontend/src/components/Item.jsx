import "./Item.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartEmpty } from '@fortawesome/free-regular-svg-icons';
import { faStar as faStarFull, faStarHalfStroke } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons';

const Stars = ({ rating, max = 5 }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = max - fullStars - (halfStar ? 1 : 0);

    return (
        <div style={{ display: "flex", alignItems: "center" }}>
            {/* Plné hvězdy */}
            {Array(fullStars).fill(0).map((_, i) => (
                <FontAwesomeIcon key={"full" + i} icon={faStarFull} style={{ marginRight: 2 }} />
            ))}
            {/* Půl hvězdy */}
            {halfStar && (
                <FontAwesomeIcon
                    key="half"
                    icon={faStarHalfStroke}
                />
            )}
            {/* Prázdné hvězdy */}
            {Array(emptyStars).fill(0).map((_, i) => (
                <FontAwesomeIcon key={"empty" + i} icon={faStarEmpty} style={{ marginRight: 2 }} />
            ))}
        </div>
    );
};

const Item = ({ profile_picture, name, rating, role, onClick }) => {
    return (
        <div className="item" onClick={onClick}>
            <img className="item_profile_img" alt="profile_img" src={profile_picture} />
            <div className="item_specs">
                <p className="stars"><Stars rating={rating} /></p>
                <p className="stars_number">{rating}</p>
                <FontAwesomeIcon icon={faHeartEmpty} className="heart" />
                <p className="name body_base strong">{name}</p>
                <p className="role">{role?.replace(/;/g, " | ")}</p>
            </div>
        </div>
    );
};

export default Item;
