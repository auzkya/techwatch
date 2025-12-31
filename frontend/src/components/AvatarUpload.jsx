import React, { useRef, useState, useEffect } from "react";
import Cropper from "react-easy-crop";
import imageCompression from "browser-image-compression";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import "./AvatarUpload.css";

export default function AvatarUpload({ avatarPreview, onAvatarReady }) {
    const fileInputRef = useRef(null);

    const [src, setSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [minZoom, setMinZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCrop, setShowCrop] = useState(false);

    const onSelectFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setSrc(objectUrl);

        const img = new Image();
        img.src = objectUrl;

        img.onload = () => {
            const imgWidth = img.width;
            const imgHeight = img.height;

            const CROP_SIZE = 500;

            const zoomX = CROP_SIZE / imgWidth;
            const zoomY = CROP_SIZE / imgHeight;

            const coverZoom = Math.max(zoomX, zoomY);

            // MIN zoom dovolíme menší (ale ne úplně)
            const calculatedMinZoom = Math.min(coverZoom, 1);

            setMinZoom(calculatedMinZoom);
            setZoom(coverZoom); // start vždy "cover"
            setCrop({ x: 0, y: 0 });

            setShowCrop(true);
        };
    };

    const onCropComplete = (_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    };

    const saveAvatar = async () => {
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
            croppedAreaPixels.height
        );

        const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", 0.9)
        );

        const compressed = await imageCompression(blob, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1000,
            useWebWorker: true,
        });

        // 🔹 předáme rodiči, NIC neodesíláme
        onAvatarReady(compressed);

        setShowCrop(false);
        setSrc(null);
    };

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                setShowCrop(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, []);

    return (
        <>
            <div
                className="profile_picture"
                onClick={() => fileInputRef.current.click()}
            >
                <img
                    src={
                        avatarPreview ||
                        "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg"
                    }
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
                            minZoom={minZoom}
                            aspect={1}
                            cropShape="round"
                            restrictPosition={true}
                            objectFit="cover"
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
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
