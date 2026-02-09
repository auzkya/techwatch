import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faPlus } from "@fortawesome/free-solid-svg-icons";
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";
import "./FormImgManager.css";

// --------------------------------------------------------
// SORTABLE THUMBNAIL COMPONENT
// --------------------------------------------------------
function SortableThumb({ id, url, onDelete, setShowFull }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        dropAnimation: null,
    };

    return (
        <div className="img_item" ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {url ? (
                <img src={url} alt="" draggable="false" onClick={() => setShowFull(url)} />
            ) : (
                <div className="img_placeholder">No image</div>
            )}
            <button className="delete_btn" onClick={() => onDelete(id)}>
                <FontAwesomeIcon icon={faXmark} />
            </button>
        </div>
    );
}

// --------------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------------
export default function FormImgManager({ images, setImages, className }) {
    const [internalImages, setInternalImages] = useState(() => {
        if (!Array.isArray(images)) return []; // Bezpečnostní pojistka
        return images.map((img, i) => ({ id: "img-" + i, url: img }));
    });

    const [activeId, setActiveId] = useState(null);
    const fileInputRef = useRef(null);
    const addIndexRef = useRef(null);
    const [showFull, setShowFull] = useState(false);

    const imgRef = useRef();

    const onUpdate = useCallback(({ x, y, scale }) => {
        if (imgRef.current) {
            const value = make3dTransformValue({ x, y, scale });
            imgRef.current.style.setProperty("transform", value);
        }
    }, []);

    // Touch-friendly drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 50, tolerance: 5 } })
    );

    // Sync external images
    // Sync external images
    useEffect(() => {
        // Pokud images není pole, nic nedělej (prevence chyby controlled/uncontrolled)
        if (!Array.isArray(images)) return;

        const newInternalImages = images.map((img, i) => {
            // 1. Situace: Je to nově vybraný soubor (File objekt)
            if (img instanceof File) {
                return {
                    id: "img-file-" + i + "-" + img.name,
                    url: URL.createObjectURL(img),
                    file: img
                };
            }

            // 2. Situace: Je to už existující URL string z databáze
            if (typeof img === "string") {
                return {
                    id: "img-db-" + i,
                    url: img, // Použijeme string přímo jako URL
                    file: img // Necháme string i v souboru pro handleUpdateRider
                };
            }

            // 3. Situace: Fallback pro starý formát objektu {url: ...}
            return {
                id: "img-obj-" + i,
                url: img.url || "",
                file: img.file || img
            };
        });

        setInternalImages(newInternalImages);
    }, [images]);

    //Vyčištění alokované paměti pro náhledy
    useEffect(() => {
        return () => {
            internalImages.forEach(i => {
                if (i.file instanceof File) {
                    URL.revokeObjectURL(i.url);  // uvolníme paměť pro náhled
                }
            });
        };
    }, [internalImages]);

    // --------------------------------------------------------
    // Add image button
    // --------------------------------------------------------
    const handleAddClick = (index) => {
        addIndexRef.current = index;
        fileInputRef.current.click();
    };

    // Pomocná funkce pro zvětšení obrázku, pokud je příliš malý
    const upscaleImage = (file, minSize = 1200) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    // Pokud je obrázek už dost velký, neřešíme ho a vracíme původní
                    if (img.width >= minSize && img.height >= minSize) {
                        resolve(file);
                        return;
                    }

                    // Výpočet nového rozměru při zachování poměru stran
                    let newWidth, newHeight;
                    if (img.width < img.height) {
                        newHeight = minSize;
                        newWidth = (img.width * minSize) / img.height;
                    } else {
                        newWidth = minSize;
                        newHeight = (img.height * minSize) / img.width;
                    }

                    const canvas = document.createElement("canvas");
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    const ctx = canvas.getContext("2d");

                    // Vyhlazování pro lepší kvalitu upscalu
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = "high";

                    ctx.drawImage(img, 0, 0, newWidth, newHeight);

                    canvas.toBlob((blob) => {
                        const upscaledFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });
                        resolve(upscaledFile);
                    }, file.type);
                };
            };
        });
    };

    // --------------------------------------------------------
    // Upload selected file(s)
    // --------------------------------------------------------
    const handleFilesSelected = async (event) => {
        const files = Array.from(event.target.files);
        if (!files.length) return;

        const uploads = await Promise.all(
            files.map(async (file) => {
                // Tady proběhne magické zvětšení
                const processedFile = await upscaleImage(file);

                return {
                    id: "img-" + crypto.randomUUID(),
                    url: URL.createObjectURL(processedFile),
                    file: processedFile
                };
            })
        );

        const idx = addIndexRef.current ?? internalImages.length;
        const newList = [
            ...internalImages.slice(0, idx),
            ...uploads,
            ...internalImages.slice(idx),
        ];

        setInternalImages(newList);
        setImages(newList.map((i) => i.file));
    };

    // --------------------------------------------------------
    // Delete one image
    // --------------------------------------------------------
    const handleDelete = (id) => {
        const filtered = internalImages.filter((img) => img.id !== id);
        setInternalImages(filtered);
        setImages(filtered.map((i) => i.file));
    };

    // --------------------------------------------------------
    // Drag handlers
    // --------------------------------------------------------
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        setActiveId(null); // nejdříve zavři overlay

        if (!over || active.id === over.id) return;

        const oldIndex = internalImages.findIndex((i) => i.id === active.id);
        const newIndex = internalImages.findIndex((i) => i.id === over.id);

        const reordered = arrayMove(internalImages, oldIndex, newIndex);

        // okamžitě aktualizuj seznam
        setInternalImages(reordered);
        setImages(reordered.map((i) => i.file));

        // volitelně: zde můžeš volat saveOrderToBackend(reordered)
    };

    const handleDragCancel = () => setActiveId(null);

    // For overlay preview
    let activeItem = internalImages.find((i) => i.id === activeId);

    return (
        <>
            <div className={className}>
                {/* hidden file input */}
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={handleFilesSelected}
                />

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <SortableContext items={internalImages.map((i) => i.id)} strategy={rectSortingStrategy}>
                        {internalImages.map((img, index) => (
                            <div className="img_wrapper" key={img.id}>
                                <SortableThumb id={img.id} url={img.url} onDelete={handleDelete} setShowFull={setShowFull} />
                            </div>
                        ))}

                        {/* + button */}
                        <div className="img_add" onClick={() => handleAddClick(internalImages.length)}>
                            <FontAwesomeIcon icon={faPlus} />
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {activeItem ? (
                            <div className="img_item img_dragging">
                                <img src={activeItem.url} alt="" />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
            {/* FULLSCREEN MODAL */}             {showFull && (
                <div className="loader_container" onClick={() => setShowFull(false)}>
                    <QuickPinchZoom
                        onUpdate={onUpdate}
                        wheelScaleFactor={1000}  // Zvětši hodnotu (ne zmenšuj!)
                        animationDuration={150}
                        draggableUnZoomed={false}
                        enforceBounds={false}    // Vypni boundaries pro plynulejší pohyb
                        minZoom={1}
                        maxZoom={5}
                        inertia={true}           // Zapni setrvačnost
                        inertiaFriction={0.95}   // Nastavení tření setrvačnosti
                    >
                        <img
                            ref={imgRef}
                            src={showFull}
                            alt="fullscreen"
                            className="form_img_full"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </QuickPinchZoom>
                </div>
            )}
        </>
    );
}
