import React, { useRef, useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import imageCompression from "browser-image-compression";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import "./AvatarUpload.css";
import { ASSETS } from "../config/assets";

export default function AvatarUpload({ avatarPreview, onAvatarReady }) {
    const fileInputRef = useRef(null);

    const [src, setSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [showCrop, setShowCrop] = useState(false);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        console.log(croppedArea, croppedAreaPixels);
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const onSelectFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        e.target.value = "";

        const objectUrl = URL.createObjectURL(file);
        setSrc(objectUrl);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setShowCrop(true);
    };

    const saveAvatar = async () => {
        if (!croppedAreaPixels) return;

        const canvas = document.createElement("canvas");
        const image = new Image();
        image.src = src;

        await new Promise((res) => (image.onload = res));

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
        );

        const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", 0.9),
        );

        const compressed = await imageCompression(blob, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 500,
            useWebWorker: true,
        });

        // 🔹 předáme rodiči, NIC neodesíláme
        onAvatarReady(compressed);
        handleClose();
    };

    const handleClose = () => {
        setShowCrop(false);
        setSrc(null);
        setCroppedAreaPixels(null);
    };

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === "Escape" && showCrop) {
                handleClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [showCrop]);

    return (
        <>
            <div
                className="profile_picture"
                onClick={() => fileInputRef.current?.click()}
            >
                <img
                    src={avatarPreview || ASSETS.default_avatar}
                    alt="avatar"
                />
                <div className="avatar_overlay">
                    <FontAwesomeIcon icon={faPenToSquare} />
                </div>
            </div>

            <input
                type="file"
                accept="image/*"
                hidden
                ref={fileInputRef}
                onChange={onSelectFile}
            />

            {showCrop && (
                <div className="crop_modal">
                    <div className="crop_container">
                        <Cropper
                            image={src}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            objectFit="cover"
                            restrictPosition={true}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    </div>
                    <div className="zoom_slider">
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.01}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                        />
                    </div>
                    <div className="crop_actions">
                        <button
                            type="button"
                            className="crop_actions_cancel"
                            onClick={() => setShowCrop(false)}
                        >
                            <p className="strong">Zrušit</p>
                        </button>

                        <button
                            type="button"
                            className="crop_actions_save"
                            onClick={saveAvatar}
                        >
                            <p className="strong">Uložit</p>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
