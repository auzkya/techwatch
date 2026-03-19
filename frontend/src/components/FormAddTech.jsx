import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import imageCompression from "browser-image-compression";
import axiosInstance from "../api/axiosInstance";

import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import FormImgManager from "./FormImgManager";
import "./GeneralForm.css";
import InputLogin from "./InputLogin";
import TextArea from "./TextArea";

import { faCircleMinus, faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const FormAddTech = ({ setLoading, isEdit }) => {
    const { id } = useParams(); // ID z URL `/tech/edit/:id`.
    const { user } = useAuth();
    const currentUser = user;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [priceNegotiable, setPriceNegotiable] = useState(false);
    const [category, setCategory] = useState("");
    const [location, setLocation] = useState("");
    const [purpose, setPurpose] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [images, setImages] = useState([]);

    // Konfigurační data pro výběrová pole
    const categoryOptions = [
        { value: "", label: "-- Vyberte kategorii --" },
        { value: "light", label: "Světla" },
        { value: "sound", label: "Zvuk" },
        { value: "video", label: "Video" },
        { value: "rigging_stage", label: "Rigging & stage" },
        { value: "scenography", label: "Scénografie" },
    ];

    const locationOptions = [
        { value: "", label: "-- Vyberte lokalitu --" },
        { value: "praha", label: "Praha" },
        { value: "brno", label: "Brno" },
        { value: "ostrava", label: "Ostrava" },
        { value: "stredocesky", label: "Středočeský kraj" },
        { value: "jihocesky", label: "Jihočeský kraj" },
        { value: "plzensky", label: "Plzeský kraj" },
        { value: "karlovarsky", label: "Karlovarský kraj" },
        { value: "ustecky", label: "Ústecký kraj" },
        { value: "liberecky", label: "Liberecký kraj" },
        { value: "kralovehradecky", label: "Královéhradecký kraj" },
        { value: "vysocina", label: "Vysočina" },
        { value: "jihomoravsky", label: "Jihomoravský kraj" },
        { value: "olomoucky", label: "Olomoucký kraj" },
        { value: "zlinsky", label: "Zlínský kraj" },
        { value: "moravskoslezsky", label: "Moravskoslezský kraj" },
    ];

    const purposeOptions = [
        { value: "", label: "-- Vyberte dostupnost --" },
        { value: "rental", label: "Rentál" },
        { value: "sell", label: "Prodej" },
    ];

    // Stav vlastních select komponent
    const [isCatOpen, setIsCatOpen] = useState(false);
    const [isLocOpen, setIsLocOpen] = useState(false);
    const [isPurpOpen, setIsPurpOpen] = useState(false);

    // Reference pro detekci kliknutí mimo dropdown
    const catRef = useRef(null);
    const locRef = useRef(null);
    const purpRef = useRef(null);

    // Zavření otevřených dropdownů při kliknutí mimo komponentu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isCatOpen && !catRef.current?.contains(event.target))
                setIsCatOpen(false);
            if (isLocOpen && !locRef.current?.contains(event.target))
                setIsLocOpen(false);
            if (isPurpOpen && !purpRef.current?.contains(event.target))
                setIsPurpOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [isCatOpen, isLocOpen, isPurpOpen]);

    const [existingImages, setExistingImages] = useState([]); // Původní obrázky při editaci.
    const removeExistingImage = (urlToRemove) => {
        setExistingImages((prev) => prev.filter((url) => url !== urlToRemove));
    };

    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const handleCheckboxChange = () => {
        setPriceNegotiable(!priceNegotiable);

        // Vymazání ceny při aktivaci režimu "dohodou"
        if (!priceNegotiable) {
            setPrice("");
        }
    };

    // Načtení dat inzerátu při editaci
    useEffect(() => {
        if (isEdit && id && id !== "undefined") {
            const fetchItem = async () => {
                setLoading(true);
                try {
                    const res = await axiosInstance.get(
                        `/api/tech/${id}?for_edit=true`,
                    );
                    const item = res.data.item;

                    setTitle(item.title || "");
                    setDescription(item.description || "");
                    setCategory(item.category || "");
                    setLocation(item.location || "");
                    setPurpose(item.purpose || "");
                    setQuantity(item.quantity || 1);

                    if (item.price) {
                        setPrice(item.price);
                        setPriceNegotiable(false);
                    } else {
                        setPrice("");
                        setPriceNegotiable(true);
                    }
                    if (item.image_urls) {
                        setImages(item.image_urls);
                    }
                } catch (err) {
                    // Zpracování chyb mimo globální 403 redirect v axios interceptoru
                    if (err.response?.status === 404) {
                        showAlert("error", "Inzerát nebyl nalezen.");
                        navigate("/tech");
                    }
                } finally {
                    setLoading(false);
                }
            };
            fetchItem();
        }
    }, [isEdit, id, setLoading, showAlert]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Ruční validace hodnot vlastních selectů
        if (!category) {
            showAlert("error", "Prosím vyplte kategorii.");
            return;
        }
        if (!location) {
            showAlert("error", "Prosím vyberte lokalitu.");
            return;
        }
        if (!purpose) {
            showAlert("error", "Prosím vyberte dostupnost.");
            return;
        }

        // Kontrola celkové velikosti nahraných souborů
        const totalSize =
            images.length > 0
                ? images.reduce((sum, img) => sum + img.size, 0)
                : 0;
        const maxSize = 20 * 1024 * 1024;

        if (totalSize > maxSize) {
            showAlert(
                "error",
                `Celková velikost obrázků (${(totalSize / 1024 / 1024).toFixed(1)} MB) překračuje limit 20 MB. Zkuste nahrát méně obrázků nebo je více zkomprimovat.`,
            );
            return;
        }

        if (description.length > 700) {
            showAlert("error", "Popisek je příliš dlouhý. Zkraťte jej prosím.");
            return; // Zastaví odesílání
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("price", priceNegotiable ? "" : price);
            formData.append("category", category);
            formData.append("location", location);
            formData.append("purpose", purpose);
            formData.append("quantity", quantity || 1);

            // změna z POST na PUT pokud je to editace
            if (isEdit) {
                formData.append("_method", "PUT");
                // Filtrujeme stringy z aktuálního stavu 'images'
                const existingUrls = images.filter(
                    (img) => typeof img === "string",
                );
                formData.append(
                    "existing_images",
                    JSON.stringify(existingUrls),
                );
            }

            const newFiles = images.filter((img) => img instanceof File);

            // Komprese a přidání nových obrázků
            const compressedImages = await Promise.all(
                newFiles.map(async (img) => {
                    const compressed = await imageCompression(img, {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                    });
                    return compressed;
                }),
            );
            compressedImages.forEach((file) => {
                formData.append("images[]", file);
            });

            const url = isEdit ? `/api/tech/${id}` : "/api/tech";
            const res = await axiosInstance.post(url, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            // Získáme ID (u nového z res.data, u editace ho už máme)
            const itemId = isEdit ? id : res.data.item.id;
            // OKAMŽITĚ přesměrujeme na detail inzerátu
            navigate(`/tech/item/${itemId}`, {
                state: {
                    fromMode: null, // Vymažeme mode, aby se necpal do cesty
                    customLabel: "Moje nabídky",
                    userId: user?.id || currentUser?.id, // ID právě přihlášeného uživatele
                    userName: null, // Aby se v cestě skrylo jméno
                },
            });
            // Zobrazíme úspěšný alert, který se vykreslí už na nové stránce
            showAlert(
                "success",
                isEdit
                    ? "Inzerát byl úspěšně aktualizován."
                    : "Inzerát byl úspěšně přidán.",
            );
        } catch (err) {
            const messages = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat()
                : ["Došlo k chybě."];
            setLoading(false);
            messages.forEach((msg) => showAlert("error", msg));
        }
    };

    return (
        <form className="form_add_tech" onSubmit={handleSubmit}>
            <div className="div1">
                <label htmlFor="title" className="body_base label-move">
                    Název
                </label>
                <InputLogin
                    type="text"
                    name="title"
                    placeholder="např. LED reflektor Chauvet SlimPAR Q12 USB"
                    value={title || ""}
                    required
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>
            <div className="div2">
                <label className="body_base label-move">Obrázky</label>
                <FormImgManager
                    images={images}
                    setImages={setImages}
                    className="form_images"
                />
            </div>
            <div className="div3">
                <label htmlFor="description" className="body_base label-move">
                    Popisek
                </label>
                <TextArea
                    name="description"
                    placeholder="např. Reflektor s RGBW LED diodami, ovládání přes DMX, napájení IEC, ideální na menší scény. Mírně poškrábaný kryt, plně funkční."
                    value={description || ""}
                    required
                    rows="7"
                    maxLength="700"
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>
            <div className="div4">
                <label className="body_base label-move">Kategorie</label>
                <div className="custom-select-wrapper" ref={catRef}>
                    <div
                        className={`custom-select-up ${isCatOpen ? "open" : ""}`}
                        onClick={() => setIsCatOpen(!isCatOpen)}
                    >
                        <span className="selected">
                            {categoryOptions.find(
                                (opt) => opt.value === category,
                            )?.label || "-- Vyberte kategorii --"}
                        </span>
                        <span className={`arrow ${isCatOpen ? "rotate" : ""}`}>
                            ▼
                        </span>
                    </div>
                    {isCatOpen && (
                        <div className="options-up">
                            {categoryOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`option ${category === opt.value ? "selected" : ""} ${opt.value === "" ? "gray-text" : ""}`}
                                    onClick={() => {
                                        setCategory(opt.value);
                                        setIsCatOpen(false);
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="div5">
                <label className="body_base label-move">Lokalita</label>
                <div className="custom-select-wrapper" ref={locRef}>
                    <div
                        className={`custom-select-up ${isLocOpen ? "open" : ""}`}
                        onClick={() => setIsLocOpen(!isLocOpen)}
                    >
                        <span
                            className={`selected ${location === "" ? "gray-text" : ""}`}
                        >
                            {locationOptions.find(
                                (opt) => opt.value === location,
                            )?.label || "-- Vyberte lokalitu --"}
                        </span>
                        <span className={`arrow ${isLocOpen ? "rotate" : ""}`}>
                            ▼
                        </span>
                    </div>

                    {isLocOpen && (
                        <div className="options-up">
                            {locationOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`option ${location === opt.value ? "selected" : ""} ${opt.value === "" ? "gray-text" : ""}`}
                                    onClick={() => {
                                        setLocation(opt.value);
                                        setIsLocOpen(false);
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="div6">
                <label className="body_base label-move">Dostupnost</label>
                <div className="custom-select-wrapper" ref={purpRef}>
                    <div
                        className={`custom-select-up ${isPurpOpen ? "open" : ""}`}
                        onClick={() => setIsPurpOpen(!isPurpOpen)}
                    >
                        <span className="selected">
                            {purposeOptions.find((opt) => opt.value === purpose)
                                ?.label || "-- Vyberte dostupnost --"}
                        </span>
                        <span className={`arrow ${isPurpOpen ? "rotate" : ""}`}>
                            ▼
                        </span>
                    </div>
                    {isPurpOpen && (
                        <div className="options-up">
                            {purposeOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`option ${purpose === opt.value ? "selected" : ""} ${opt.value === "" ? "gray-text" : ""}`}
                                    onClick={() => {
                                        setPurpose(opt.value);
                                        setIsPurpOpen(false);
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="div7">
                <label htmlFor="quantity" className="body_base label-move">
                    Množství
                </label>
                <div className="quantity-stepper add-tech-stepper">
                    <div className="stepper-input-wrapper">
                        <input
                            id="quantity"
                            name="quantity"
                            type="text"
                            inputMode="numeric"
                            className="input-login input-inline price-input"
                            value={quantity}
                            required // Důležité pro validaci formuláře
                            onChange={(e) => {
                                const val = e.target.value;
                                // Povoli jen čísla a limit 7 znaků (pro tvých 1 000 000)
                                if (
                                    val === "" ||
                                    (/^[0-9\b]+$/.test(val) && val.length <= 7)
                                ) {
                                    const numVal =
                                        val === "" ? "" : parseInt(val);
                                    // Kontrola horního limitu
                                    if (numVal === "" || numVal <= 1000000) {
                                        setQuantity(numVal);
                                    }
                                }
                            }}
                            onBlur={() => {
                                // Pokud uživatel odejde a pole je prázdné, nastavíme 1
                                if (quantity === "" || quantity < 1)
                                    setQuantity(1);
                            }}
                        />
                        <div className="stepper-input-wrapper-btn-container">
                            <FontAwesomeIcon
                                icon={faCircleMinus}
                                className={`stepper-btn ${quantity <= 1 ? "button_disabled" : ""}`}
                                onClick={() =>
                                    setQuantity((prev) =>
                                        Math.max(1, (parseInt(prev) || 1) - 1),
                                    )
                                }
                            />
                            <FontAwesomeIcon
                                icon={faCirclePlus}
                                className={`stepper-btn ${quantity >= 1000000 ? "button_disabled" : ""}`}
                                onClick={() =>
                                    setQuantity((prev) => {
                                        const next = (parseInt(prev) || 0) + 1;
                                        return next <= 1000000 ? next : prev;
                                    })
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="div8">
                <label htmlFor="price" className="body_base label-move">
                    Cena ( Kč / ks )
                </label>
                <br></br>
                <div className="price-wrapper">
                    <InputLogin
                        type="number"
                        name="price"
                        value={price || ""}
                        required={!priceNegotiable}
                        disabled={priceNegotiable}
                        onChange={(e) => setPrice(e.target.value)}
                        extraClass={`price-input ${priceNegotiable ? "disabled-input" : ""}`}
                    />
                    <div className="checkbox-container">
                        <input
                            type="checkbox"
                            id="dohodou"
                            name="dohodou"
                            value="dohodou"
                            className="custom-checkbox"
                            checked={priceNegotiable}
                            onChange={handleCheckboxChange}
                        />
                        <label htmlFor="dohodou" className="checkbox-text">
                            Dohodou
                        </label>
                    </div>
                </div>
            </div>
            <button type="submit" className="form-submit div9" disabled={false}>
                <p className="strong">{isEdit ? "Uložit změny" : "Přidat"}</p>
            </button>
        </form>
    );
};

export default FormAddTech;
