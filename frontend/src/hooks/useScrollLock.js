import { useEffect } from "react";

export const useScrollLock = (isLocked) => {
    useEffect(() => {
        if (isLocked) {
            // Zakáži scroll
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = "0px"; // Kompenzace scrollbar width
        } else {
            // Povol scroll
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        }

        // Cleanup
        return () => {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        };
    }, [isLocked]);
};
