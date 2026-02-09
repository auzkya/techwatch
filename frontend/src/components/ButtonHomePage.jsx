import "./ButtonHomePage.css";

const ButtonHomePage = ({icon, text, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="button-homepage smaller_scale"
        >
            <div className="button-content">
                <h3>{icon && <span className="home-page_icon-wrapper">{icon}</span>}</h3>
                <h3><span className="button-text">{text}</span></h3>
            </div>
        </button>
    )
}

export default ButtonHomePage
