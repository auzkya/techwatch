import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import Path from "../../components/Path";
import Item from "../../components/Item";
import ButtonSubcategory from "../../components/ButtonSubcategory";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faVideo, faLightbulb, faWrench, faMasksTheater } from '@fortawesome/free-solid-svg-icons';
import { categoryMap } from "../../config/CategoryMap";
import "../../components/GeneralForm.css";
import ItemSkeleton from "../../components/ItemSkeleton";
import { useAlert } from "../../context/AlertContext";
import { ASSETS } from "../../config/assets";

const UserListings = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const [items, setItems] = useState([]);
    const [ownerName, setOwnerName] = useState("");
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true); // Nový stav pro první velký load
    const [isOwner, setIsOwner] = useState(false);

    // Stavy filtrů
    const [searchTerm, setSearchTerm] = useState("");
    const [activeSubcategory, setActiveSubcategory] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");

    // --- POPUP LOGIKA ---
    const [deleteItemId, setDeleteItemId] = useState(null); // Ukládáme ID mazané položky
    const [showDeletePopup, setShowDeletePopup] = useState(false);

    const openDeletePopup = (itemId) => {
        setDeleteItemId(itemId);
        setShowDeletePopup(true);
    };

    const handleClosePopup = () => {
        setShowDeletePopup(false);
        setDeleteItemId(null);
    };

    // ESC zavře popup
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape" && showDeletePopup) {
                handleClosePopup();
            }
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [showDeletePopup]);

    // --- API FUNKCE ---

    const handleStatusChange = async (itemId, newStatus) => {
        const previousItems = [...items];
        const statusForBe = newStatus ? 1 : 0;

        setItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, active_item: statusForBe } : item
            )
        );

        try {
            await axiosInstance.patch(`/api/items/${itemId}/status`, {
                active_item: statusForBe
            });
        } catch (err) {
            setItems(previousItems);
            showAlert("error", "Chyba komunikace se serverem.");
        }
    };

    const confirmDeleteAction = async () => {
        if (!deleteItemId) return;

        const idToDel = deleteItemId;
        handleClosePopup(); // Zavřít popup hned
        setLoading(true);

        try {
            await axiosInstance.delete(`/api/items/${idToDel}`);
            setItems(prevItems => prevItems.filter(item => item.id !== idToDel));
            showAlert("success", "Nabídka byla úspěšně smazána.");
        } catch (err) {
            showAlert("error", "Nabídku se nepodařilo smazat.");
        } finally {
            setLoading(false);
        }
    };

    // useEffect pro fetchListings zůstává stejný...
    useEffect(() => {
        const fetchListings = async () => {
            // Pokud jde o filtr (search/status), loading zapneme, ale initialLoad už ne
            setLoading(true);
            try {
                const response = await axiosInstance.get(`/api/user-listings/${id}`, {
                    params: { search: searchTerm, subcategory: activeSubcategory, status: statusFilter }
                });
                setItems(response.data.items);
                setOwnerName(response.data.owner_name);
                setIsOwner(response.data.is_owner);
            } catch (err) {
                console.error("Chyba při načítání:", err);
            } finally {
                setLoading(false);
                setInitialLoad(false); // První načtení je hotovo
            }
        };

        const timer = setTimeout(fetchListings, 300);
        return () => clearTimeout(timer);
    }, [id, searchTerm, activeSubcategory, statusFilter]);

    const getFirstImage = (img) => {
        if (!img) return ASSETS.default_item;
        if (Array.isArray(img)) return img[0] || ASSETS.default_item;
        return img;
    };

    // 1. POKUD SE STRÁNKA NAČÍTÁ POPRVÉ (nemáme ani jméno, ani isOwner)
    if (initialLoad) {
        return (
            <>
                <div className="loader_container"><div className="loader"></div></div>
            </>
        );
    }

    // 2. POKUD UŽ MÁME DATA O MAJITELI, ALE DOČÍTÁME POLOŽKY (např. při změně filtru)
    return (
        <>
            <Path
                mode={isOwner ? null : "tech"}
                category={isOwner ? null : activeSubcategory}
                customLabel={isOwner ? "Moje nabídky" : ownerName}
            />

            <h1 className="list_title">
                {isOwner ? "Moje nabídky" : ownerName.toUpperCase()}
            </h1>

            {/* --- MAZACÍ POPUP --- */}
            {showDeletePopup && (
                <div className="popup_container" onClick={handleClosePopup}>
                    <div className="popup_small" onClick={(e) => e.stopPropagation()}>
                        <h3>Opravdu chcete tuto nabídku trvale smazat?</h3>
                        <div className="cropped">
                            <button
                                type="button"
                                className="form-submit"
                                onClick={confirmDeleteAction}
                            >
                                <p className="strong" style={{ color: 'white' }}>Ano</p>
                            </button>
                            <button
                                type="button"
                                className="secondary_button"
                                onClick={handleClosePopup}
                            >
                                <p className="oauth_text strong">Ne</p>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isOwner ? null : (
                <div className="status-filter-container">
                    {['all', 'active', 'inactive'].map((s) => (
                        <label key={s} className="checkbox">
                            <input
                                type="radio"
                                name="status"
                                checked={statusFilter === s}
                                onChange={() => setStatusFilter(s)}
                            />
                            <span className="body_base">
                                {s === 'all' ? 'Vše' : s === 'active' ? 'Aktivní' : 'Neaktivní'}
                            </span>
                        </label>
                    ))}
                </div>
            )}

            <div className="list-container">
                <div className="all-items-full">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <ItemSkeleton key={index} />
                        ))
                    ) : items.length > 0 ? (
                        items.map(item => (
                            <div key={item.id} className="item-admin-card">
                                <Item
                                    id={item.id}
                                    profile_picture={getFirstImage(item.images)}
                                    name={item.title}
                                    price={item.price}
                                    purpose={item.purpose}
                                    activeItem={item.active_item}
                                    isOwner={isOwner}
                                    onEdit={(id) => navigate(`/tech/edit/${id}`)}
                                    onDelete={(id) => openDeletePopup(id)} // Voláme popup
                                    onStatusChange={handleStatusChange}
                                    onShare={(id) => {
                                        navigator.clipboard.writeText(`${window.location.origin}/tech/item/${id}`);
                                        showAlert("success", "Odkaz zkopírován do schránky!");
                                    }}
                                    onClick={() => navigate(`/tech/item/${item.id}`)}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="no-results_listing-container">
                            <h2 className="no-results_listing">Nebyly nalezeny žádné nabídky.</h2>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UserListings;
