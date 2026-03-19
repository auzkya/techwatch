import { useState } from "react";
import axiosInstance from "../api/axiosInstance";

export const useFavourites = () => {
    const [favLoading, setFavLoading] = useState(false);

    const toggleFavourite = async (type, id) => {
        setFavLoading(true);
        try {
            const response = await axiosInstance.post(
                `/api/favourites/${type}/${id}`,
            );
            return response.data; // Vrací { status: 'added' / 'removed' }
        } catch (error) {
            console.error("Chyba při ukládání do oblíbených:", error);
            throw error; // Vyhodíme chybu dál, abychom ji mohli v komponentě zachytit
        } finally {
            setFavLoading(false);
        }
    };

    return { toggleFavourite, favLoading };
};
