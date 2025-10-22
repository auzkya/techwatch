import "./Item.css"

const Item = ({profile_picture, name, role, onClick}) => {
    return (
        <div className="item" onClick={onClick}>
            <img className="profile_img" alt="profile_img" src={profile_picture}></img>
            <p className="stars_img">★★★★☆</p><p className="stars_number">4</p>
            <p className="name body_base strong">{name}</p>
            <p className="role">{role?.replace(/;/g, " | ")}</p>
        </div>
    )
}

export default Item