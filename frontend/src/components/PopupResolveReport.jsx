import {
    faBan,
    faCircleExclamation,
    faEyeSlash,
    faMessage,
    faTrash
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useAlert } from "../context/AlertContext";
import { useScrollLock } from "../hooks/useScrollLock";
import TextArea from "./TextArea";

const PopupResolveReport = ({ report, targetName, onClose, onConfirm }) => {
    // Defaultní akce podle typu cíle
    const isUserReport = report?.target_type?.endsWith("\\User");
    const isItemReport = report?.target_type?.endsWith("\\Item");
    const [action, setAction] = useState(
        isUserReport ? "warn_user" : (isItemReport ? "hide_content" : "delete_content")
    );

    // Pomocná funkce pro vygenerování odkazu (stejná logika jako v tabulce)
    const getTargetLink = () => {
        const target = report?.target;
        if (!target) return "#";
        const model = report.target_type.split("\\").pop();

        switch (model) {
            case "User":
                return `/user/${target.id}/${target.first_name?.toLowerCase()}-${target.last_name?.toLowerCase()}`;
            case "Item":
                return `/tech/item/${target.id}`;
            case "ReviewUser":
                return `/user/${target.reviewed_user_id}/profile#review-${target.id}`;
            case "ReviewItem":
                return `/tech/item/${target.item_id}#review-${target.id}`;
            default:
                return "#";
        }
    };

    const { showAlert } = useAlert();

    const [adminNote, setAdminNote] = useState("");
    const [reporterNote, setReporterNote] = useState("");
    const [loading, setLoading] = useState(false);

    const [showHelp, setShowHelp] = useState(false);

    useScrollLock(!!report);

    if (!report) return null;

    const getStrikes = () => {
        const t = report.target;
        return (
            t?.strikes_count ??
            t?.user?.strikes_count ??
            t?.reviewer?.strikes_count ??
            0
        );
    };

    const handleSubmit = async () => {
        if (!adminNote.trim()) {
            showAlert("error", "Prosím, vyplňte odůvodnění."); // Nebo jiný vizuální error
            return; // Zastaví vykonávání, nepustí to na API
        }

        setLoading(true);
        try {
            await onConfirm(report.id, { action, adminNote, reporterNote });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    // Definice tlačítek podle typu nahlášení
    const getAvailableActions = () => {
        if (isUserReport) {
            return [
                {
                    value: "warn_user",
                    label: "Napomenout",
                    icon: faMessage,
                    className: "action-warn",
                },
                {
                    value: "strike_user",
                    label: "Strike",
                    icon: faCircleExclamation,
                    className: "action-strike",
                },
                {
                    value: "ban_user",
                    label: "Ban",
                    icon: faBan,
                    className: "action-ban",
                },
            ];
        }
        else if (isItemReport) {
            return [
                {
                    value: "hide_content",
                    label: "Skrýt",
                    icon: faEyeSlash,
                    className: "action-hide",
                },
                {
                    value: "delete_content",
                    label: "Smazat",
                    icon: faTrash,
                    className: "action-delete",
                },
                {
                    value: "strike_user",
                    label: "Smazat + Strike",
                    icon: faCircleExclamation,
                    className: "action-strike",
                },
                {
                    value: "ban_user",
                    label: "Smazat + Ban",
                    icon: faBan,
                    className: "action-ban",
                },
            ]
        }
        return [
            {
                value: "delete_content",
                label: "Smazat",
                icon: faTrash,
                className: "action-delete",
            },
            {
                value: "strike_user",
                label: "Smazat + Strike",
                icon: faCircleExclamation,
                className: "action-strike",
            },
            {
                value: "ban_user",
                label: "Smazat + Ban",
                icon: faBan,
                className: "action-ban",
            },
        ];
    };

    return (
        <div className="popup_container" onClick={onClose}>
            <div className="popup_big" onClick={(e) => e.stopPropagation()}>
                <span
                    className="help-toggle"
                    onClick={() => setShowHelp(!showHelp)}
                >
                    {showHelp ? "Skrýt nápovědu" : "Jak to funguje?"}
                </span>
                <div className="popup_header">
                    <h2>Řešení nahlášení</h2>
                    <p className="popup_header_sub">
                        Cíl: <a
                            href={getTargetLink()}
                            target="_blank"
                            rel="noreferrer"
                            className="target-link-popuop"
                        >
                            <strong>{targetName}</strong>
                        </a>
                        {" "}| Aktuální striky:{" "}
                        <span className={`strong ${getStrikes() >= 2 ? "red-text" : ""}`}>
                            {getStrikes()}/3
                        </span>
                    </p>
                </div>

                <div className="form-review">
                    {/* Tlačítka pro výběr akce */}
                    <div
                        className="review-fuller"
                        style={{ textAlign: "center" }}
                    >
                        <label
                            className="body_base label-move"
                            style={{ marginTop: "0px" }}
                        >
                            Zvolte rozhodnutí
                        </label>
                        <div className="action-pill-group">
                            {getAvailableActions().map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`status-pill ${opt.className} ${action === opt.value ? "pill-active" : "pill-inactive"}`}
                                    onClick={() => setAction(opt.value)}
                                >
                                    <FontAwesomeIcon
                                        icon={opt.icon}
                                        style={{ fontSize: "0.9rem" }}
                                    />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {showHelp && (
                            <div className="body_smallest admin-help-text">
                                <span class="strong action-warn">Napomenout</span> (pouze u uživatelů): Pošle se pouze odůvodnění uživateli do aplikace.
                                <br />
                                <span class="strong action-hide">Skrýt</span> (pouze u inzerátu): Skryje daný inzerát; Pošle se systémová zpráva s odůvodněním uživateli do aplikace.
                                <br />
                                <span class="strong action-delete">Smazat</span> Smaže daný obsah; Pošle se systémová zpráva s odůvodněním uživateli do aplikace.
                                <br />
                                <span class="strong action-strike">Strike</span> Udělí uživateli strike. Pošle se systémová zpráva s odůvodněním uživateli do emailu a aplikace. Při dosažení 3 striků je uživatel automaticky zabanován.
                                <br />
                                <span class="strong action-ban">Ban</span> Zabanování uživatele. Pošle se systémová zpráva s odůvodněním uživateli do emailu a aplikace.
                                <br />
                                *všechny akce jsou možné zvrátit v sekci Historie
                            </div>)}
                    </div>

                    <div className="review-fuller">
                        <label
                            htmlFor="admin_note_input"
                            className="body_base label-move"
                        >
                            Odůvodnění:
                        </label>
                        <TextArea
                            id="admin_note_input"
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder={
                                action === "dismiss"
                                    ? "Proč nahlášení ignorujete?"
                                    : "Zadejte důvod vašeho rozhodnutí..."
                            }
                            rows="4"
                            required={true}
                        />
                        {showHelp && (
                            <div className="body_smallest admin-help-text">
                                Odůvodnění je povinné a stojí za celou systémovou zprávou, např.:
                                <br />
                                <span>
                                    <span class="strong"></span> Dobrý den, Vaše recenze nabídky <span class="strong">„dsadsa“</span> ze dne <span class="strong">18.03.2026</span> byla odstraněna z důvodu porušení pravidel.
                                    <br /><span class="strong">Odůvodnění</span>: <italic>Vaše zpráva</italic>
                                </span>
                            </div>)}
                    </div>

                    <div className="review-fuller">
                        <label
                            htmlFor="reporter_note_input"
                            className="body_base label-move"
                        >
                            Zpětná zpráva pro oznamovatele do aplikace (nepovinné):
                        </label>
                        <TextArea
                            id="reporter_note_input"
                            value={reporterNote}
                            onChange={(e) => setReporterNote(e.target.value)}
                            placeholder="Děkujeme za nahlášení..."
                            rows="3"
                        />
                        {showHelp && (<div className="body_smallest admin-help-text">
                            Pokud nenapíšete zpětnou vazbu, oznamovatel se o ničem nedozví. Nicméně pokud ji napíšete, Vaše zpráva bude to jediné co oznamovatel obdrží.
                        </div>)}
                    </div>
                </div>

                <div className="popup_footer">
                    <button
                        className={`form-submit half-width center extra_space ${loading ? "loading" : ""}`}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        <p className="strong">
                            {loading ? "Zpracovávám..." : "Potvrdit rozhodnutí"}
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupResolveReport;
