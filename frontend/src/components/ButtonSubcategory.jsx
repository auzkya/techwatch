import "./ButtonSubcategory.css";

const ButtonSubcategory = ({icon, text, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="button-subcategory"
        >
            <h3><span>{icon && icon}</span></h3>
            <h3><span>{text}</span></h3>
        </button>
    )
}

export default ButtonSubcategory