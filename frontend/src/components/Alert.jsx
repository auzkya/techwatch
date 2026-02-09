import "./Alert.css";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCircleExclamation,
    faCircleCheck,
    faInfoCircle,
    faXmark
} from "@fortawesome/free-solid-svg-icons";

export default function Alert({
    type = "success",
    message,
    onClose,
    duration = 5000
}) {
    const [visible, setVisible] = useState(true);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);
    const remainingRef = useRef(duration);

    const startTimer = () => {
        startTimeRef.current = Date.now();

        timerRef.current = setTimeout(() => {
            setVisible(false);
        }, remainingRef.current);
    };

    const pauseTimer = () => {
        clearTimeout(timerRef.current);
        remainingRef.current -= Date.now() - startTimeRef.current;
    };

    useEffect(() => {
        startTimer();
        return () => clearTimeout(timerRef.current);
    }, []);

    const handleTransitionEnd = () => {
        if (!visible) onClose();
    };

    if (!message) return null;

    let color, icon, label;
    switch (type) {
        case "error":
            color = "var(--danger, #ff2323ff)"; // fallback barva
            icon = faCircleExclamation;
            label = "Chyba";
            break;
        case "info":
            color = "var(--info, #3498db)";
            icon = faInfoCircle;
            label = "Info";
            break;
        case "success":
        default:
            color = "var(--success, #2ecc71)";
            icon = faCircleCheck;
            label = "Úspěch";
            break;
    }

    return (
        <div
            className={`alert ${visible ? "visible" : "hidden"}`}
            style={{
                color,
                borderColor: color,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)"
            }}
            onMouseEnter={pauseTimer}
            onMouseLeave={startTimer}
            onTransitionEnd={handleTransitionEnd}
        >
            <button className="alert-close" onClick={onClose}>
                <FontAwesomeIcon icon={faXmark} />
            </button>

            <div className="alert-title">
                <FontAwesomeIcon icon={icon} />
                <p className="alert-message">{message}</p>
            </div>
        </div>
    );
}
