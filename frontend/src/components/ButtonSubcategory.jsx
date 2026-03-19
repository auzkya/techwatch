import "./ButtonSubcategory.css";

const ButtonSubcategory = ({ icon, text, onClick }) => {
    return (
        <button onClick={onClick} className="button-subcategory smaller_scale">
            <div className="button-content">
                <h3>
                    {icon && (
                        <span className="subcategory_icon-wrapper">{icon}</span>
                    )}
                </h3>
                <h3>
                    <span className="button-text">{text}</span>
                </h3>
            </div>
        </button>
    );
};

export default ButtonSubcategory;
