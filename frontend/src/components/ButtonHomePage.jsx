import "./ButtonHomePage.css";

const ButtonHomePage = ({icon, text, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="button-homepage"
        >
            <span>{icon && icon}</span>
            <span>{text}</span>
        </button>
    )
}

export default ButtonHomePage