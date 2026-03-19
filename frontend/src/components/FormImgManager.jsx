import {
    closestCenter,
    DndContext,
    DragOverlay,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    rectSortingStrategy,
    SortableContext,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { faFilePdf, faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useRef, useState } from "react";
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";
import { useAlert } from "../context/AlertContext";
import { useScrollLock } from "../hooks/useScrollLock";
import "./FormImgManager.css";

// --------------------------------------------------------
// SORTABLE THUMBNAIL COMPONENT
// --------------------------------------------------------
function SortableThumb({ id, url, fileName, onDelete, setShowFull }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    // detekce PDF souboru - kontrolujeme jak URL, tak název souboru (pro případ nově nahraných souborů bez URL)
    const isPdf = (typeof url === 'string' && url.split('?')[0].toLowerCase().endsWith('.pdf')) ||
        (fileName?.toLowerCase().endsWith('.pdf'));

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1, // Vizuální feedback při tažení
    };

    useEffect(() => {
        if (isPdf) {
            // PDF emulujeme načtení, protože embed/object nemá spolehlivý onload
            const timer = setTimeout(() => setIsLoaded(true), 300);
            return () => clearTimeout(timer);
        }
    }, [isPdf, url]);

    return (
        <div
            className={`img_item ${!isLoaded ? 'skeleton_pulse' : ''}`}
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            {!isLoaded && <div className="skeleton_shimmer"></div>}
            {url ? (
                isPdf ? (
                    <div onClick={() => setShowFull(url)} style={{ height: '100%', opacity: isLoaded ? 1 : 0 }}>
                        {/* Náhled PDF - #toolbar=0 skryje ovládací lištu */}
                        <embed src={`${url}#toolbar=0&navpanes=0&scrollbar=0`} type="application/pdf" className="pdf_thumbnail_embed" />
                        {/* Průhledná vrstva aby šlo na položku kliknout a táhnout ji */}
                        <div className="pdf_overlay_clicker"></div>
                    </div>
                ) : (
                    <img
                        src={url}
                        alt=""
                        draggable="false"
                        onClick={() => setShowFull(url)}
                        className={isLoaded ? 'visible' : 'hidden'} // Plynulý přechod
                        onLoad={() => setIsLoaded(true)} // KLÍČOVÁ OPRAVA: Ukončení skeletonu
                    />
                )
            ) : (
                <div className="img_placeholder">No image</div>
            )}
            {isLoaded && (
                <button className="delete_btn" onClick={(e) => {
                    e.stopPropagation();
                    onDelete(id);
                }}>
                    <FontAwesomeIcon icon={faXmark} />
                </button>
            )}
        </div>
    );
}

// --------------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------------
export default function FormImgManager({ images, setImages, className, allowPdf = false, setIsProcessingFiles }) {
    const [internalImages, setInternalImages] = useState(() => {
        if (!Array.isArray(images)) return []; // Bezpečnostní pojistka
        return images.map((img, i) => ({ id: "img-" + i, url: img }));
    });

    const [activeId, setActiveId] = useState(null);
    const fileInputRef = useRef(null);
    const addIndexRef = useRef(null);
    const [showFull, setShowFull] = useState(false);
    useScrollLock(showFull !== false || activeId !== null);
    const { showAlert } = useAlert();

    const pdfFullRef = useRef(null);

    // useEffect pro focus PDF v manažeru
    useEffect(() => {
        if (showFull && typeof showFull === 'string' && showFull.toLowerCase().endsWith('.pdf')) {
            setTimeout(() => pdfFullRef.current?.focus(), 100);
        }
    }, [showFull]);

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
    useEffect(() => {
        if (!Array.isArray(images)) return;

        const newInternalImages = images.map((img, i) => {
            // 1. Pokud je img UŽ URL string (z databáze)
            if (typeof img === "string") {
                return {
                    id: "img-db-" + i + "-" + img.substring(img.length - 10), // stabilnější ID
                    url: img,
                    file: img
                };
            }

            // 2. Pokud je img File objekt (nově nahraný)
            if (img instanceof File) {
                return {
                    id: "img-file-" + i + "-" + img.name,
                    url: URL.createObjectURL(img),
                    file: img
                };
            }

            // 3. Fallback pro objekty typu {url: '...', file: ...}
            if (img && typeof img === "object" && img.url) {
                return {
                    id: "img-obj-" + i,
                    url: img.url,
                    file: img.file || img
                };
            }

            return null;
        }).filter(Boolean); // Odstraní případné neplatné záznamy

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
            reader.onerror = () => {
                console.error("FileReader selhal");
                resolve(file); // Vracíme původní při chybě
            };
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onerror = () => {
                    console.error("Načtení Image selhalo");
                    resolve(file);
                };
                img.onload = () => {
                    // Pokud je už velký nebo má extrémní rozlišení, které by zabilo Canvas
                    if ((img.width >= minSize && img.height >= minSize) || img.width > 5000 || img.height > 5000) {
                        console.log("Upscale není nutný nebo je obrázek příliš velký pro bezpečný upscale.");
                        resolve(file);
                        return;
                    }

                    try {
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
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = "high";
                        ctx.drawImage(img, 0, 0, newWidth, newHeight);

                        canvas.toBlob((blob) => {
                            if (!blob) {
                                console.error("Canvas toBlob selhal (vrátil null)");
                                resolve(file);
                                return;
                            }
                            const upscaledFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now(),
                            });
                            console.log("Upscale úspěšný:", newWidth, "x", newHeight);
                            resolve(upscaledFile);
                        }, file.type, 0.9); // Přidána kvalita 0.9 pro úsporu místa
                    } catch (e) {
                        console.error("Chyba při práci s Canvasem:", e);
                        resolve(file);
                    }
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

        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        const oversizedFiles = files.filter(f => f.size > MAX_SIZE);

        if (oversizedFiles.length > 0) {
            // Zde nahraďte vaším toastem/notifikací
            showAlert("error", `Soubor ${oversizedFiles[0].name} je příliš velký. Max. velikost je 10MB.`);
            return;
        }

        setIsProcessingFiles?.(true);

        try {
            const uploads = await Promise.all(
                files.map(async (file) => {
                    // LOGIKA PRO PDF: Pokud je to PDF, neupscalujeme
                    if (file.type === "application/pdf") {
                        return {
                            id: "img-" + crypto.randomUUID(),
                            url: URL.createObjectURL(file),
                            file: file
                        };
                    }

                    // LOGIKA PRO OBRÁZKY: Upscale proběhne jen u nich
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
            const filesToSync = newList.map((i) => i.file);
            setImages(filesToSync);

        } catch (error) {
            console.error("Chyba při zpracování:", error);
            showAlert("error", "Nepodařilo se zpracovat soubory.");
        } finally {
            setIsProcessingFiles?.(false);
        }
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
                    // Dynamicky nastavíme accept podle toho, zda je PDF povolené
                    accept={allowPdf ? "image/*,application/pdf" : "image/*"}
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
                                <SortableThumb id={img.id} url={img.url} fileName={img.file?.name} onDelete={handleDelete} setShowFull={setShowFull} />
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
                                {activeItem.url.toLowerCase().endsWith('.pdf') || activeItem.file?.name?.toLowerCase().endsWith('.pdf') ? (
                                    <div className="pdf_preview_placeholder"><FontAwesomeIcon icon={faFilePdf} size="3x" /></div>
                                ) : (
                                    <img src={activeItem.url} alt="" />
                                )}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
            {/* FULLSCREEN MODAL */}
            {showFull && (
                <div className="loader_container gallery_overlay" onClick={() => setShowFull(false)}>
                    {/* Kontrola zda jde o PDF podle URL nebo typu v internalImages */}
                    {(internalImages.find(img => img.url === showFull)?.file?.type === "application/pdf" || showFull.toLowerCase().includes(".pdf")) ? (
                        <div className="pdf_preview_full" onClick={(e) => e.stopPropagation()}>
                            {/* Trik pro Firefox: neviditelný input pro získání focusu */}
                            <input
                                style={{ position: 'absolute', opacity: 0, height: 0 }}
                                autoFocus
                                ref={(input) => input && input.focus()}
                            />
                            <object
                                data={showFull}
                                type="application/pdf"
                                width="100%"
                                height="100%"
                            >
                                {/* Fallback pokud prohlížeč neumí zobrazit PDF přímo */}
                                <iframe src={showFull} width="100%" height="100%" title="PDF preview"></iframe>
                            </object>
                        </div>
                    ) : (
                        <QuickPinchZoom
                            onUpdate={onUpdate}
                            wheelScaleFactor={1000}
                            animationDuration={150}
                            minZoom={1}
                            maxZoom={5}
                        >
                            <img
                                ref={imgRef}
                                src={showFull}
                                alt="fullscreen"
                                className="form_img_full"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </QuickPinchZoom>
                    )}
                </div>
            )}
        </>
    );
}
