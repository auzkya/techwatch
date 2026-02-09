import React from "react";
import "./ItemSkeleton.css";

import { Stars } from "./Item";

const ItemSkeleton = () => {
    return (
        <div className="listing_skeleton">
            <div className="listing_skeleton_profile_img"></div>
            <div className="listing_skeleton_specs">
                <Stars rating={0} />
                <div className="listing_skeleton_name"></div>
                <div className="listing_skeleton_role"></div>
            </div>
        </div>
    );
};

export default ItemSkeleton;
