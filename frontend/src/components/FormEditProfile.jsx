import { useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import "./GeneralForm.css";
import InputLogin from "./InputLogin";
import TextArea from "./TextArea";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";
import AvatarUpload from "./AvatarUpload";
import { cache, CACHE_KEYS } from "../utils/cacheManager";

const FormEditProfile = ({ setLoading }) => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const [fName, setFName] = useState("");
    const [lName, setLName] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [bio, setBio] = useState("");
    const [category, setCategory] = useState([]);
    const [location, setLocation] = useState("");
    const [email, setEmail] = useState("");

    // Uložené číslo z databáze
    const [savedPhone, setSavedPhone] = useState("");
    const [currentPhone, setCurrentPhone] = useState("");
    const [phoneVisible, setPhoneVisible] = useState(false);
    const [phoneChanged, setPhoneChanged] = useState(false);
    const [showPhonePopup, setShowPhonePopup] = useState(false);
    const [pendingPhone, setPendingPhone] = useState("");

    const phoneFormRef = useRef(null);
    const phoneFormInstance = useRef(null);
    const phonePopupRef = useRef(null);
    const phonePopupInstance = useRef(null);

    const [phonePopupStep, setPhonePopupStep] = useState("phone");
    const [otp, setOtp] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [alreadyTried, setAlreadyTried] = useState(false);

    // Načtení dat uživatele
    useEffect(() => {
        if (!user) return;

        setFName(user.first_name || "");
        setLName(user.last_name || "");
        setBio(user.bio || "");
        setLocation(user.location || "");
        setEmail(user.email || "");

        // ⚠️ KLÍČOVÉ: Uložení původního telefonu
        const userPhone = user.phone || "";
        setSavedPhone(userPhone);
        setCurrentPhone(userPhone);
        setPhoneVisible(user.phone_visible || false);

        // Načtení specializací
        if (user.specs && Array.isArray(user.specs)) {
            setCategory(user.specs.map(spec => spec.slug));
        }

        // Načtení avataru
        if (user.profile_image_url) {
            setAvatarPreview(user.profile_image_url);
        }
    }, [user]);

    // Inicializace hlavního phone inputu
    useEffect(() => {
        if (!phoneFormRef.current) return;

        phoneFormInstance.current = intlTelInput(phoneFormRef.current, {
            initialCountry: "cz",
            preferredCountries: ["cz", "sk"],
            separateDialCode: true,
            utilsScript: null,
        });

        // ⚠️ Nastav uložené číslo do inputu
        if (savedPhone) {
            phoneFormInstance.current.setNumber(savedPhone);
        }

        return () => {
            phoneFormInstance.current?.destroy();
            phoneFormInstance.current = null;
        };
    }, [savedPhone]);

    // Inicializace popup phone inputu
    useEffect(() => {
        if (!showPhonePopup || !phonePopupRef.current) return;

        phonePopupInstance.current = intlTelInput(phonePopupRef.current, {
            initialCountry: "cz",
            preferredCountries: ["cz", "sk"],
            separateDialCode: true,
            utilsScript: null,
        });

        // Nastav aktuální číslo do popup inputu
        if (currentPhone) {
            phonePopupInstance.current.setNumber(currentPhone);
        }

        return () => {
            phonePopupInstance.current?.destroy();
            phonePopupInstance.current = null;
        };
    }, [showPhonePopup, currentPhone]);

    // ESC zavře popup
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape" && showPhonePopup) {
                handleClosePopup();
            }
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [showPhonePopup]);

    // Countdown
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    // ⚠️ NOVÁ LOGIKA: Kontrola změny telefonu při onBlur
    const handlePhoneBlur = () => {

        const iti = phoneFormInstance.current;
        const input = phoneFormRef.current;

        if (!iti || !input) return;

        const raw = input.value.trim();

        // Pokud je pole prázdné
        if (!raw) {
            setCurrentPhone("");
            setPhoneChanged("");
            return;
        }

        const digits = raw.replace(/\D/g, "");
        const dialCode = iti.getSelectedCountryData().dialCode;
        const fullNumber = `+${dialCode}${digits}`;

        setCurrentPhone(fullNumber);

        // ⚠️ Srovnání s uloženým číslem
        setPhoneChanged(fullNumber !== savedPhone);
    };

    const handleAvatarReady = (file) => {
        if (avatarPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const toggleCategory = (value) => {
        setCategory(prev =>
            prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value]
        );
    };

    // ⚠️ POPUP: Krok 1 - Odeslání OTP
    const handlePopupSubmit = async () => {
        const iti = phonePopupInstance.current;
        const input = phonePopupRef.current;
        setLoading(true);

        // Pokud už máme uložené číslo (opakované odeslání z OTP kroku)
        if (pendingPhone && phonePopupStep === "otp") {
            try {
                await sendOtp(pendingPhone);
                setLoading(false);
            } catch (err) {
                setLoading(false);
                showAlert(
                    "error",
                    err.response?.data?.error || "Chyba při odesílání SMS"
                );
            }
            return;
        }

        if (!iti || !input) {
            setLoading(false);
            showAlert("error", "Telefonní pole je prázdné");
            return;
        }

        const raw = input.value.trim();
        const digits = raw.replace(/\D/g, "");

        if (!digits) {
            setLoading(false);
            showAlert("error", "Zadejte telefonní číslo");
            return;
        }

        const dialCode = iti.getSelectedCountryData().dialCode;
        const phoneNumber = `+${dialCode}${digits}`;

        try {
            // 1️⃣ Lookup (normalizace čísla)
            const lookup = await axiosInstance.post("/api/phone-lookup", {
                phone: phoneNumber,
            });

            const normalizedPhone = lookup.data.phone;

            // 2️⃣ Kontrola duplicity (jiný uživatel)
            const check = await axiosInstance.post("/api/phone-check", {
                phone: normalizedPhone,
            });

            if (check.data.exists) {
                showAlert("error", "Číslo je již přiřazené jinému uživateli");
                setLoading(false);
                return;
            }

            // 3️⃣ Uložení a odeslání OTP
            setPendingPhone(normalizedPhone);
            setCurrentPhone(normalizedPhone);
            await sendOtp(normalizedPhone);
            setLoading(false);
        } catch (err) {
            setLoading(false);
            showAlert(
                "error",
                err.response?.data?.error || "Chyba při odesílání SMS"
            );
        }
    };

    const sendOtp = async (phoneNumber) => {
        try {
            await axiosInstance.post("/api/send-otp", {
                phone: phoneNumber,
            });

            setPhonePopupStep("otp");
            setCountdown(59);
            setAlreadyTried(true);
            setLoading(false);
            showAlert("success", "Ověřovací SMS byla odeslána");
        } catch (err) {
            setLoading(false);
            showAlert(
                "error",
                err.response?.data?.error || "Chyba při odesílání SMS"
            );
        }
    };

    // ⚠️ POPUP: Krok 2 - Ověření OTP
    const handleVerifyOtp = async () => {

        setLoading(true);
        if (otp.length !== 6) {
            setLoading(false);
            showAlert("error", "Kód musí mít 6 číslic");
            return;
        }

        try {
            const res = await axiosInstance.post("/api/verify-otp", {
                phone: currentPhone,
                code: otp,
            });

            if (!res.data.success) {
                setLoading(false);
                showAlert("error", "Neplatný kód");
                return;
            }
            setLoading(false);
            showAlert("success", "Telefon byl ověřen");

            // ⚠️ Aktualizuj uložené číslo a zavři popup
            setSavedPhone(currentPhone);
            setPhoneChanged(false);
            handleClosePopup();

        } catch {
            setLoading(false);
            showAlert("error", "Chyba při ověřování kódu");
        }
    };

    const handleClosePopup = () => {
        setShowPhonePopup(false);
        setPhonePopupStep("phone");
        setOtp("");
        setCountdown(0);
    };

    // ⚠️ SUBMIT FORMULÁŘE
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (phoneChanged) {
            showAlert("error", "Telefonní číslo bylo změněno a musí být ověřeno");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("_method", "PUT");
            formData.append("bio", bio);
            formData.append("location", location);

            if (currentPhone) {
                formData.append("phone", currentPhone);
            }

            formData.append("phone_visible", phoneVisible ? "1" : "0");

            category.forEach(cat => {
                formData.append("spec[]", cat);
            });

            if (avatarFile) {
                formData.append("avatar", avatarFile);
            }

            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}:`, value);
            }

            if (bio.length > 700) {
                showAlert("error", "Bio je příliš dlouhé. Zkraťte jej prosím.");
                return; // Zastaví odesílání
            }

            const response = await axiosInstance.post("/api/user", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            // Aktualizujeme user v AuthContext
            setUser(response.data.user);

            navigate(`/user/${response.data.user.id}`);
            cache.remove(CACHE_KEYS.PROFILE_ELIGIBLE); // Smaž starou cache, Header si ji znovu načte
            showAlert("success", "Profil byl úspěšně aktualizován.");

        } catch (err) {
            console.error("❌ Update error:", err);
            console.error("❌ Response data:", err.response?.data);

            const messages = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat()
                : [err.response?.data?.message || "Došlo k chybě"];
            setLoading(false);
            messages.forEach(msg => showAlert("error", msg));
        } /*finally {
            //setLoading(false);
        }*/
    };

    return (
        <>
            {/* POPUP PRO OVĚŘENÍ TELEFONU */}
            {showPhonePopup && (
                <div className="popup_container" onClick={handleClosePopup}>
                    <div className="popup" onClick={(e) => e.stopPropagation()}>
                        <h2>Ověření telefonního čísla</h2>

                        <div className="cropped">
                            {/* PHONE STEP */}
                            {phonePopupStep === "phone" && (
                                <div>
                                    <input
                                        type="tel"
                                        id="phone2"
                                        className="input-login"
                                        placeholder="Zadejte číslo"
                                        ref={phonePopupRef}
                                    />
                                    <button
                                        type="button"
                                        className="form-submit"
                                        onClick={handlePopupSubmit}
                                    >
                                        <p className="strong">Odeslat ověřovací SMS</p>
                                    </button>
                                </div>
                            )}

                            {/* OTP STEP */}
                            {phonePopupStep === "otp" && (
                                <div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        className="input-login"
                                        placeholder="Zadejte 6místný kód"
                                        value={otp || ""}
                                        onChange={(e) =>
                                            setOtp(e.target.value.replace(/\D/g, ""))
                                        }
                                    />
                                    <button
                                        type="button"
                                        className="form-submit"
                                        onClick={handleVerifyOtp}
                                    >
                                        <p className="strong">Potvrdit</p>
                                    </button>
                                    <button
                                        type="button"
                                        className="cropped-send_again"
                                        onClick={handlePopupSubmit}
                                        disabled={countdown > 0}
                                    >
                                        {countdown > 0 ? (
                                            <p className="strong button_disabled">
                                                Odeslat znovu za {countdown}s
                                            </p>
                                        ) : (
                                            <p className="strong">Odeslat znovu</p>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* HLAVNÍ FORMULÁŘ */}
            <form className="form_edit_profile" onSubmit={handleSubmit}>
                {/* Jméno */}
                <div className="name">
                    <label htmlFor="first_name" className="body_base label-move">
                        Křestní jméno
                    </label>
                    <InputLogin
                        type="text"
                        name="first_name"
                        value={fName || ""}
                        required
                        extraClass="disabled-input"
                        disabled
                    />
                    <div className="gap_between_names"></div>
                    <label htmlFor="last_name" className="body_base label-move">
                        Příjmení
                    </label>
                    <InputLogin
                        type="text"
                        name="last_name"
                        value={lName || ""}
                        required
                        extraClass="disabled-input"
                        disabled
                    />
                </div>

                {/* Avatar */}
                <div className="avatar">
                    <AvatarUpload
                        avatarPreview={avatarPreview}
                        onAvatarReady={handleAvatarReady}
                    />
                </div>

                {/* Bio */}
                <div className="bio">
                    <label htmlFor="bio" className="body_base label-move">Bio</label>
                    <TextArea
                        name="bio"
                        placeholder="např. Pracoval jsem 2 roky jako bedňák..."
                        value={bio || ""}
                        rows="7"
                        maxLength="700"
                        onChange={(e) => setBio(e.target.value)}
                    />
                </div>

                {/* Specializace */}
                <div className="category">
                    <legend>Specializace</legend>
                    <div className="category-grid">
                        {['light_technician', 'sound_technician', 'av_technician', 'rigger', 'stagehands'].map(spec => (
                            <label key={spec} className="checkbox">
                                <input
                                    type="checkbox"
                                    value={spec}
                                    checked={category.includes(spec)}
                                    onChange={() => toggleCategory(spec)}
                                />
                                <span>
                                    {spec === 'light_technician' && 'Osvětlovač'}
                                    {spec === 'sound_technician' && 'Zvukař'}
                                    {spec === 'av_technician' && 'AV technik'}
                                    {spec === 'rigger' && 'Rigger'}
                                    {spec === 'stagehands' && 'Stagehands'}
                                    <FontAwesomeIcon icon={faCircleCheck} className="input-selected-icon" />
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Lokalita */}
                <div className="location">
                    <label htmlFor="location" className="body_base label-move">Lokalita</label>
                    <select className="input-login" value={location} onChange={(e) => setLocation(e.target.value)}>
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

                {/* Email */}
                <div className="email">
                    <label htmlFor="email" className="body_base label-move">Email</label>
                    <InputLogin
                        type="email"
                        name="email"
                        value={email || ""}
                        required
                        extraClass="disabled-input"
                        disabled
                    />
                </div>

                {/* Telefon */}
                <div className="phone">
                    <label htmlFor="phone" className="body_base label-move">Telefon</label>
                    <input
                        type="tel"
                        id="phone1"
                        className="input-login"
                        ref={phoneFormRef}
                        onBlur={handlePhoneBlur}
                    />

                    {/* ⚠️ Ikona varování když se telefon změnil */}
                    {phoneChanged && (
                        <FontAwesomeIcon
                            icon={faCircleExclamation}
                            className="input_error"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowPhonePopup(true);
                            }}
                        />
                    )}

                    <div className="checkbox-container">
                        <input
                            type="checkbox"
                            id="visible"
                            className="custom-checkbox"
                            checked={phoneVisible}
                            onChange={() => setPhoneVisible(!phoneVisible)}
                        />
                        <label htmlFor="visible" className="checkbox-text">
                            Viditelné
                        </label>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="form-submit form-edit-profile-submit div8"
                >
                    <p className="strong">Aktualizovat</p>
                </button>
            </form>
        </>
    );
};

export default FormEditProfile;
