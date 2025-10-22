import "./NotificationMessage.css";

const NotificationMessage = ({ id, icon, image, name, date, user, text, read, onClick }) => {

    return (
        <button
            onClick={() => onClick(id)}
            className="button-notification_message"
            popoverTarget={id}
        >

            <div className="left">
                {icon && (
                    <div className="icon_wrapper">
                        {icon}
                    </div>
                )}
                {image && (
                    <div
                        className="image_wrapper"
                        style={{ backgroundImage: `url(${image})` }}
                    />
                )}
            </div>
            <div className="right">
                {read === false && <p className="middot">•</p>}<p className="name strong">{name}</p>
                <p className="date body_smallest strong">{date}</p><br></br>
                <p className="text"><span className="strong">{user}</span> {text}</p>
            </div>
        </button>
    )
}

export default NotificationMessage