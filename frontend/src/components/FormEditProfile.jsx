import { useState, useEffect, useRef } from "react";

import axiosInstance from "../api/axiosInstance";
import imageCompression from "browser-image-compression";

import "./GeneralForm.css";
import InputLogin from "./InputLogin";
import TextArea from "./TextArea";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";

import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import { faPenToSquare, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

import { useNavigate } from "react-router-dom";
import AvatarUpload from "./AvatarUpload";

const FormEditProfile = ({ setLoading }) => {
    const { user, loading } = useAuth();
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
    const [phone, setPhone] = useState("");
    const [phoneVisible, setPhoneVisible] = useState("");
    const [phoneError, setPhoneError] = useState(false);
    const [showPhonePopup, setShowPhonePopup] = useState(false);
    // phone status: "idle" | "checking" | "unverified" | "verified"
    const [phoneStatus, setPhoneStatus] = useState("idle");

    const [avatarLoaded, setAvatarLoaded] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    //Twilio phone verification
    const [otpSent, setOtpSent] = useState(false);

    const phonePopupRef = useRef(null);
    const phonePopupInstance = useRef(null);

    const phoneFormRef = useRef(null);
    const phoneFormInstance = useRef(null);

    const [phonePopupStep, setPhonePopupStep] = useState("phone"); // "phone" | "otp"

    const [otp, setOtp] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [alreadyTried, setAlreadyTried] = useState(false);



    useEffect(() => {

        if (!user) {
            setAvatarLoaded(true);
            return;
        }

        setFName(user.first_name || "");
        setLName(user.last_name || "");
        setBio(user.bio || "");
        setLocation(user.location || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setPhoneVisible(user.phone_visible || false);
        setCategory(user.category || []);

        if (!user.profile_image_url) {
            setAvatarLoaded(true);
            return;
        }

        const img = new Image();
        img.src = user.profile_image_url;

        img.onload = () => {
            setAvatarPreview(user.profile_image_url);
            setAvatarLoaded(true);
        };

        img.onerror = () => {
            setAvatarLoaded(true);
        };
    }, [user]);

    // inicializuje hlavní input
    useEffect(() => {
        if (!phoneFormRef.current) return;

        phoneFormInstance.current = intlTelInput(phoneFormRef.current, {
            initialCountry: "cz",
            preferredCountries: ["cz", "sk"],
            separateDialCode: true,

            // žádná validace
            utilsScript: null,
        });

        return () => {
            phoneFormInstance.current?.destroy();
            phoneFormInstance.current = null;
        };
    }, []);

    // inicializuje popup input
    useEffect(() => {
        if (!showPhonePopup) return;
        if (!phonePopupRef.current) return;

        phonePopupInstance.current = intlTelInput(phonePopupRef.current, {
            initialCountry: "cz",
            preferredCountries: ["cz", "sk"],
            separateDialCode: true,
            utilsScript: null,
        });

        return () => {
            phonePopupInstance.current?.destroy();
            phonePopupInstance.current = null;
        };
    }, [showPhonePopup]);

    // synchronizuje hodnotu mezi phone1 a phone 2
    useEffect(() => {
        if (!showPhonePopup) return;

        const mainIti = phoneFormInstance.current;
        const popupIti = phonePopupInstance.current;
        const mainInput = phoneFormRef.current;

        if (!mainIti || !popupIti || !mainInput) return;

        const raw = mainInput.value.trim();
        if (!raw) return;

        const dialCode = mainIti.getSelectedCountryData().dialCode;
        const fullNumber = `+${dialCode}${raw.replace(/\D/g, "")}`;

        popupIti.setNumber(fullNumber);
    }, [showPhonePopup]);

    // zavření popupu tlačítkem ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                setShowPhonePopup(false);
            }
        };

        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, []);

    // countdown
    useEffect(() => {
        if (countdown <= 0) return;

        const timer = setTimeout(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown]);

    const handleAvatarReady = (file) => {
        if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleCheckboxChange = () => setPhoneVisible(!phoneVisible);

    const toggleCategory = (value) => {
        setCategory(prev => {
            const next = prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value];
            console.log("category array:", next);
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (phone && phoneStatus !== "verified") {
            showAlert(
                "error",
                "Zadané telefonní číslo musí být ověřeno, nebo ponechte pole prázdné"
            );
            return;
        }

        setSubmitting(true);
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("bio", bio);
            formData.append("phone", phone);
            formData.append("phone_visible", phoneVisible ? 1 : 0);
            category.forEach(cat => {
                console.log("Appending spec:", cat);
                formData.append("spec[]", cat);
            });
            formData.append("location", location);
            formData.append("email", email);
            if (avatarFile) formData.append("avatar", avatarFile);

            await axiosInstance.put("/api/user", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            showAlert("success", "Profil byl aktualizován.");
            navigate("/");
        } catch (err) {
            setSubmitting(false);
            setLoading(false);
            const messages = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat()
                : ["Došlo k chybě."];
            messages.forEach(msg => showAlert("error", msg));
        }
    };

    const checkPhoneOwnership = async () => {
        const iti = phoneFormInstance.current;
        const input = phoneFormRef.current;
        if (!iti || !input) return;

        const raw = input.value.trim();
        const digits = raw.replace(/\D/g, "");
        if (!digits) return;

        const dialCode = iti.getSelectedCountryData().dialCode;
        const number = `+${dialCode}${digits}`;

        setPhoneStatus("checking");

        try {
            const res = await axiosInstance.post("/api/phone-check", { phone: number });

            if (res.data.exists) {
                setPhone(number);
                setPhoneStatus("verified");
                setPhoneError(false);
                console.log(number+phoneStatus);
            } else {
                setPhoneStatus("unverified");
                setPhoneError(true);
                console.log(number+phoneStatus);
            }
        } catch {
            setPhoneStatus("unverified");
            setPhoneError(true);
        }
    };

    const blurTimeout = useRef(null);

    const handlePhoneBlur = () => {
        clearTimeout(blurTimeout.current);
        blurTimeout.current = setTimeout(checkPhoneOwnership, 500);
    };

    const handlePopupSubmit = async () => {
        const iti = phonePopupInstance.current;
        const input = phonePopupRef.current;

        if (!iti || !input) {
            showAlert("error", "Telefonní pole není připravené");
            return;
        }

        const raw = input.value.trim();
        const digits = raw.replace(/\D/g, "");

        if (!digits) {
            showAlert("error", "Zadejte telefonní číslo");
            return;
        }

        const dialCode = iti.getSelectedCountryData().dialCode;
        const phoneNumber = `+${dialCode}${digits}`;

        try {
            // 1️⃣ lookup
            const lookup = await axiosInstance.post("/api/phone-lookup", {
                phone: phoneNumber,
            });

            // 2️⃣ kontrola duplicity
            const check = await axiosInstance.post("/api/phone-check", {
                phone: lookup.data.phone,
            });

            if (check.data.exists) {
                showAlert("error", "Číslo už je přiřazené jinému uživateli");
                return;
            }


            // uložit + poslat OTP (SPRÁVNĚ)
            setPhone(lookup.data.phone);
            await sendOtp(lookup.data.phone);

        } catch (err) {
            showAlert(
                "error",
                err.response?.data?.error || "Chyba při odesílání SMS"
            );
        }
    };


    const handlePhoneVerified = (verifiedNumber) => {
        setPhone(verifiedNumber);
        setPhoneError(false);
        setShowPhonePopup(false);
    };

    const sendOtp = async (phoneNumber) => {
        try {
            await axiosInstance.post("/api/send-otp", {
                phone: phoneNumber,
            });

            setPhonePopupStep("otp");
            setCountdown(59);
            setAlreadyTried(true);

            showAlert("success", "Ověřovací SMS byla odeslána");
        } catch (err) {
            showAlert(
                "error",
                err.response?.data?.error || "Chyba při odesílání ověřovací SMS"
            );
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            showAlert("error", "Kód musí mít 6 číslic");
            return;
        }

        try {
            const res = await axiosInstance.post("/api/verify-otp", {
                phone,
                code: otp,
            });

            if (!res.data.success) {
                showAlert("error", "Neplatný kód");
                return;
            }

            showAlert("success", "Telefon byl ověřen");

            setPhoneStatus("verified");
            setPhoneError(false);
            setShowPhonePopup(false);
            setPhonePopupStep("phone");
            setOtp("");

        } catch {
            showAlert("error", "Chyba při ověřování kódu");
        }
    };

    return (
        <>
            {showPhonePopup && (
                <div
                    className="popup_container"
                    onClick={() => {
                        setShowPhonePopup(false);
                        setPhonePopupStep("phone");
                        setOtp("");
                    }}
                >
                    <div className="popup" onClick={(e) => e.stopPropagation()}>
                        <h2>Ověření telefonního čísla</h2>

                        <div className="cropped">

                            {/* PHONE STEP */}
                            <div style={{ display: phonePopupStep === "phone" ? "block" : "none" }}>
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

                            {/* OTP STEP */}
                            <div style={{ display: phonePopupStep === "otp" ? "block" : "none" }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="input-login"
                                    placeholder="Zadejte 6místný kód"
                                    value={otp}
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
                                    {countdown > 0
                                        ? <p className="strong button_disabled">Odeslat znovu znovu za {countdown}s</p>
                                        : alreadyTried
                                            ? <p className="strong">Odeslat znovu</p>
                                            : <p className="strong">Odeslat ověřovací SMS</p>
                                    }
                                </button>

                            </div>

                        </div>
                    </div>
                </div>
            )}

            <form className="form_edit_profile" onSubmit={handleSubmit}>
                <div className="name">

                    <label htmlFor="first_name" className="body_base label-move">Křestní jméno</label>
                    <InputLogin
                        type="text"
                        name="first_name"
                        placeholder=""
                        value={fName}
                        required
                        onChange={(e) => setFName(e.target.value)}
                        extraClass="disabled-input"
                        disabled
                    />
                    <div className="gap_between_names"></div>
                    <label htmlFor="last_name" className="body_base label-move">Příjmení</label>
                    <InputLogin
                        type="text"
                        name="last_name"
                        placeholder=""
                        value={lName}
                        required
                        onChange={(e) => setLName(e.target.value)}
                        extraClass="disabled-input"
                        disabled
                    />
                </div>
                <div className="avatar">
                    <AvatarUpload
                        avatarPreview={avatarPreview}
                        onAvatarReady={handleAvatarReady}

                    />
                </div>
                <div className="bio">
                    <label htmlFor="bio" className="body_base label-move">Bio</label>
                    <TextArea
                        type="text"
                        name="bio"
                        placeholder="např. Pracoval jsem 2 roky jako bedňák pro Shameless. Nyní 4 roky pracuji jako kulisák v kulturním centru Kino Vzlet a divadlu Studio Hrdinů."
                        value={bio}
                        rows="7"
                        maxlength="700"
                        onChange={(e) => setBio(e.target.value)}
                    />
                </div>
                <div className="category">
                    <legend>
                        Specializace
                    </legend>
                    <div className="category-grid">
                        <label className="checkbox">
                            <input type="checkbox" value='osvetlovac' checked={category.includes("osvetlovac")}
                                onChange={() => toggleCategory("osvetlovac")} />
                            <span>Osvětlovač
<FontAwesomeIcon icon={faCircleCheck} className="input-selected-icon" />
                            </span>
                        </label>
                        <label className="checkbox">
                            <input type="checkbox" value='zvukar' checked={category.includes("zvukar")}
                                onChange={() => toggleCategory("zvukar")} />
                            <span>Zvukař
                                <FontAwesomeIcon icon={faCircleCheck} className="input-selected-icon" />
                            </span>
                        </label>
                        <label className="checkbox">
                            <input type="checkbox" value='av-technik' checked={category.includes("av-technik")}
                                onChange={() => toggleCategory("av-technik")} />
                            <span>AV technik
                                <FontAwesomeIcon icon={faCircleCheck} className="input-selected-icon" />
                            </span>
                        </label>
                        <label className="checkbox">
                            <input type="checkbox" value='rigger' checked={category.includes("rigger")}
                                onChange={() => toggleCategory("rigger")} />
                            <span>Rigger
                                <FontAwesomeIcon icon={faCircleCheck} className="input-selected-icon" />
                            </span>
                        </label>
                        <label className="checkbox">
                            <input type="checkbox" value='stagehands' checked={category.includes("stagehands")}
                                onChange={() => toggleCategory("stagehands")} />
                            <span>Stagehands
                                <FontAwesomeIcon icon={faCircleCheck} className="input-selected-icon" />
                            </span>
                        </label>
                    </div>

                </div>
                <div className="location">
                    <label htmlFor="location" className="body_base label-move">Lokalita</label><br></br>
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
                <div className="email">
                    <label htmlFor="email" className="body_base label-move">Email</label>
                    <InputLogin
                        type="email"
                        name="email"
                        placeholder=""
                        value={email}
                        required
                        onChange={(e) => setEmail(e.target.value)}
                        extraClass="disabled-input"
                        disabled
                    />
                </div>
                <div className="phone">
                    <label htmlFor="phone" className="body_base label-move">Telefon</label>
                    {/*<InputLogin
                        type="tel"
                        name="phone"
                        placeholder=""
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />*/}
                    <input
                        type="tel"
                        id="phone1"
                        className="input-login"
                        ref={phoneFormRef}
                        onBlur={handlePhoneBlur}
                        onInput={() => {
                            setPhoneStatus("idle");
                            setPhoneError(false);
                        }}
                    />
                    { phone && phoneStatus !== "verified" && (<FontAwesomeIcon icon={faCircleExclamation} className="input_error" onClick={(e) => {
                        e.preventDefault();
                        setShowPhonePopup(true);
                    }} />)}
                    <div className="checkbox-container">
                        <input type="checkbox" id="visible" name="visible" value="visible" className="custom-checkbox"
                            checked={phoneVisible}
                            onChange={handleCheckboxChange} />
                        <label htmlFor="visible" className="checkbox-text">Viditelné</label>
                    </div>

                    {otpSent && (
                        <div>
                            <input
                                type="text"
                                placeholder="Zadejte OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                            <button type="button" onClick={() => { }}>Ověřit OTP</button>
                        </div>
                    )}
                </div>

                <button type="submit" className="form-submit form-edit-profile-submit div8" disabled={false}>
                    <p className="strong">Aktualizovat</p>
                </button>
            </form>
        </>
    );
};

export default FormEditProfile;
