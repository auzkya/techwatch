import { faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons';
import { faCircleMinus, faCirclePlus, faStar as faStarFull, faStarHalfStroke } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from "react";
import ReactStars from "react-rating-stars-component";
import { useAlert } from "../context/AlertContext";
import { useScrollLock } from "../hooks/useScrollLock";
import InputLogin from "./InputLogin";
import TextArea from "./TextArea";

const PopupReview = ({ isOpen, onClose, onSubmit, targetName, initialData, type }) => {
    const { showAlert } = useAlert();

    const [pros, setPros] = useState([""]);
    const [cons, setCons] = useState([""]);
    const [text, setText] = useState("");
    const [rating, setRating] = useState(0);

    useScrollLock(isOpen);

    // Načtení dat při editaci
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // EDITACE: Nastavíme data z props
                const initialPros = Array.isArray(initialData.pros) && initialData.pros.length > 0
                    ? [...initialData.pros, ""]
                    : [""];
                const initialCons = Array.isArray(initialData.cons) && initialData.cons.length > 0
                    ? [...initialData.cons, ""]
                    : [""];

                setPros(initialPros);
                setCons(initialCons);
                setText(initialData.text || initialData.review || ""); // Přidáno initialData.review kvůli DB názvu
                setRating(Number(initialData.rating) || Number(initialData.review_value) || 0);
            } else {
                // NOVÁ RECENZE: Reset
                setPros([""]);
                setCons([""]);
                setText("");
                setRating(0);
            }
        }
        // DŮLEŽITÉ: Odebrali jsme initialData ze závislostí, aby se state nepřepisoval během psaní
    }, [isOpen]);

    // Logika pro přidávání dynamických polí
    const handleDynamicChange = (index, value, setter, currentArray) => {
        let newArr = [...currentArray];
        newArr[index] = value;

        // 1. PŘIDÁVÁNÍ: Pokud píšu do posledního a není prázdný, přidám nový prázdný řádek
        if (index === newArr.length - 1 && value.trim() !== "") {
            newArr.push("");
        }

        // 2. MAZÁNÍ: Pokud je input prázdný, není poslední a uživatel klikl jinam (nebo umazal)
        // Filtrujeme pole tak, aby zůstaly jen zaplněné položky + jedna prázdná na konci
        const filtered = newArr.filter((item, i) => {
            // Ponecháme vše, co není prázdné
            if (item.trim() !== "") return true;
            // Ponecháme prázdné pouze pokud je to poslední prvek v poli
            return i === newArr.length - 1;
        });

        setter(filtered);
    };
    const handleSubmit = () => {
        if (rating === 0) {
            showAlert("error", "Pro odeslání recenze je nutné zvolit počet hvězdiček");
            return;
        }
        if (text.length > 500) {
            showAlert("error", "Slovní recenze je příliš dlouhá. Zkraťte ji prosím.");
            return; // Zastaví odesílání
        }
        // Odfiltrovat prázdné položky z polí
        const cleanPros = pros.filter(p => p.trim() !== "");
        const cleanCons = cons.filter(c => c.trim() !== "");

        onSubmit({ rating, pros: cleanPros, cons: cleanCons, text, type });
    };

    if (!isOpen) return null;

    return (
        <div className="popup_container" onClick={onClose}>
            <div className="popup_big" onClick={(e) => e.stopPropagation()}>

                <h2>{initialData ? "Upravit recenzi na" : "Recenze na"} <span>{targetName}</span></h2>

                <div className="form-review">
                    <div className="react-stars-container">
                        {/* Klíč rating-${rating} vynutí překreslení, když se hodnota změní zvenčí */}
                        <ReactStars
                            key={`rating-${rating}`}
                            count={5}
                            size={40}
                            isHalf={true}
                            value={rating}
                            onChange={(val) => setRating(val)}
                            emptyIcon={<FontAwesomeIcon icon={faStarEmpty} />}
                            halfIcon={<FontAwesomeIcon icon={faStarHalfStroke} />}
                            filledIcon={<FontAwesomeIcon icon={faStarFull} />}
                            edit={true}
                        />
                    </div>

                    <div className="review-columns review-fuller">
                        <div className="review-halfer">
                            <label className="body_base label-move">Co bylo v pořádku</label>
                            {pros.map((p, i) => (
                                <div key={`pro-cont-${i}`} className="input-with-icon">
                                    <FontAwesomeIcon icon={faCirclePlus} className="icon plus" />
                                    <InputLogin
                                        value={p}
                                        onChange={(e) => handleDynamicChange(i, e.target.value, setPros, pros)}
                                        placeholder="Přidat"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="review-halfer">
                            <label className="body_base label-move">Co v pořádku nebylo</label>
                            {cons.map((c, i) => (
                                <div key={`con-cont-${i}`} className="input-with-icon">
                                    <FontAwesomeIcon icon={faCircleMinus} className="icon minus" />
                                    <InputLogin
                                        value={c}
                                        onChange={(e) => handleDynamicChange(i, e.target.value, setCons, cons)}
                                        placeholder="Přidat"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="review-fuller">
                        <label className="body_base label-move">Slovní recenze</label>
                        <TextArea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Napište Vaši recenzi zde..."
                            rows="5"
                            maxLength="500"
                        />
                    </div>

                    {/*initialData ? (
                        <>
                            <button className="form-submit extra_space half-width" onClick={handleSubmit}>
                                <p className="strong">Aktualizovat recenzi</p>
                            </button>
                            <button className="secondary_button_review extra_space half-width" onClick={handleDelete}>
                                <p className="strong">Smazat recenzi</p>
                            </button>
                        </>
                    ) : (
                        <button className="form-submit extra_space half-width center" onClick={handleSubmit}>
                            <p className="strong">Vložit recenzi</p>
                        </button>
                    )*/}

                    <button className="form-submit extra_space" onClick={handleSubmit}>
                        <p className="strong">{initialData ? "Aktualizovat recenzi" : "Vložit recenzi"}</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupReview;
