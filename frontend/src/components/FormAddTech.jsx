import { useState, useEffect } from "react";

import axiosInstance from "../api/axiosInstance";
import imageCompression from "browser-image-compression";

import "./GeneralForm.css";
import FormImgManager from "./FormImgManager";
import InputLogin from "./InputLogin";
import TextArea from "./TextArea";
import { useAlert } from "../context/AlertContext";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';

import { useNavigate } from "react-router-dom";

const FormAddTech = ({ setLoading }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [priceNegotiable, setPriceNegotiable] = useState(false);
    const [category, setCategory] = useState("");
    const [location, setLocation] = useState("");
    const [purpose, setPurpose] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [images, setImages] = useState([]);

    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const handleCheckboxChange = () => {
        setPriceNegotiable(!priceNegotiable);

        // pokud zapnuto -> smaž cenu
        if (!priceNegotiable) {
            setPrice("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {

            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("price", priceNegotiable ? "" : price);
            formData.append("category", category);
            formData.append("location", location);
            formData.append("purpose", purpose);
            formData.append("quantity", quantity);
            // obrázky
            const compressedImages = await Promise.all(
                images.map(async (img) => {
                    const compressed = await imageCompression(img, {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                    });
                    return compressed;
                })
            );
            compressedImages.forEach((file) => {
                formData.append("images[]", file);
            });

            await axiosInstance.post("/api/tech", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            showAlert("success", "Technika byla úspěšně přidána.");
            // Navigace po krátké prodlevě, aby alert stihl vykreslit
            setTimeout(() => navigate("/"), 100);
        } catch (err) {
            const messages = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat()
                : ["Došlo k chybě."];
            messages.forEach(msg => showAlert("error", msg));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="form_add_tech" onSubmit={handleSubmit}>
            <div className="div1">
                <label htmlFor="title" className="body_base label-move">Název</label>
                <InputLogin
                    type="text"
                    name="title"
                    placeholder="např. LED reflektor Chauvet SlimPAR Q12 USB"
                    value={title}
                    required
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>
            <div className="div2">
                <label className="body_base label-move">Obrázky</label>
                <FormImgManager images={images} setImages={setImages} />
            </div>
            <div className="div3">
                <label htmlFor="description" className="body_base label-move">Popisek</label>
                <TextArea
                    type="text"
                    name="description"
                    placeholder="např. Reflektor s RGBW LED diodami, ovládání přes DMX, napájení IEC, ideální na menší scény. Mírně poškrábaný kryt, plně funkční."
                    value={description}
                    required
                    rows="7"
                    maxlength="700"
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>
            <div className="div4">
                <label htmlFor="category" className="body_base label-move">Kategorie</label><br></br>
                <select className="input-login" value={category} onChange={(e) => setCategory(e.target.value)} required>
                    <option value="">-- Vyberte kategorii --</option>
                    <option value="svetla">Světla</option>
                    <option value="zvuk">Zvuk</option>
                    <option value="video">Video</option>
                    <option value="rigging">Rigging a stage</option>
                    <option value="scenografie">Scénografie</option>
                </select>
            </div>
            <div className="div5">
                <label htmlFor="location" className="body_base label-move">Lokalita</label><br></br>
                <select className="input-login" value={location} onChange={(e) => setLocation(e.target.value)} required>
                    <option value="">-- Vyberte lokalitu --</option>
                    <option value="praha">Praha</option>
                    <option value="brno">Brno</option>
                    <option value="ostrava">Ostrava</option>
                    <option value="stredocesky">Středočeský kraj</option>
                    <option value="jihocesky">Jihočeský kraj</option>
                    <option value="plzensky">Plzeňský kraj</option>
                    <option value="karlovarsky">Karlovarský kraj</option>
                    <option value="ustecky">Ústecký kraj</option>
                    <option value="liberecky">Liberecký kraj</option>
                    <option value="kralovehradecky">Královéhradecký kraj</option>
                    <option value="vysocina">Vysočina</option>
                    <option value="jihomoravsky">Jihomoravský kraj</option>
                    <option value="olomoucky">Olomoucký kraj</option>
                    <option value="zlinsky">Zlínský kraj</option>
                    <option value="moravskoslezsky">Moravskoslezský kraj</option>
                </select>
            </div>
            <div className="div6">
                <label htmlFor="purpose" className="body_base label-move">Dostupnost</label><br></br>
                <select className="input-login" value={purpose} onChange={(e) => setPurpose(e.target.value)} required>
                    <option value="">-- Vyberte dostupnost --</option>
                    <option value="rental">Rentál</option>
                    <option value="sell">Prodej</option>
                </select>
            </div>
            <div className="div7">
                <label htmlFor="quantity" className="body_base label-move">Počet</label><br></br>
                <InputLogin
                    type="number"
                    name="quantity"
                    value={quantity}
                    required
                    onChange={(e) => setQuantity(e.target.value)}
                    extraClass={`price-input`}
                />
            </div>
            <div className="div8">
                <label htmlFor="price" className="body_base label-move">Cena ( Kč / ks )</label><br></br>
                <div className="price-wrapper">
                    <InputLogin
                        type="number"
                        name="price"
                        value={price}
                        required={!priceNegotiable}
                        disabled={priceNegotiable}
                        onChange={(e) => setPrice(e.target.value)}
                        extraClass={`price-input ${priceNegotiable ? "disabled-input" : ""}`}
                    />
                    <div className="checkbox-container">
                        <input type="checkbox" id="dohodou" name="dohodou" value="dohodou" className="custom-checkbox"
                            checked={priceNegotiable}
                            onChange={handleCheckboxChange} />
                        <label htmlFor="dohodou" className="checkbox-text">Dohodou</label>
                    </div>
                </div>

            </div>
            <button type="submit" className="form-submit div9" disabled={false}>
                <p className="strong">Přidat</p>
            </button>
        </form>
    );
};

export default FormAddTech;
