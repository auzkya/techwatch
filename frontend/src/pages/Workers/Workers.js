import React from "react"
import { useParams, useLocation, Navigate, useNavigate } from "react-router-dom"
import { ROUTES, buildRoute } from "../../routes/RouteNames"

import { categoryMap } from "../../config/CategoryMap"

import Header from "../../components/Header"
import Path from "../../components/Path"
import ButtonSubcategory from "../../components/ButtonSubcategory"
import Item from "../../components/Item"

import workers from "../../assets/data/data"
import makeSlug from "../../utils/makeSlug"

import "./Workers.css"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMessage } from '@fortawesome/free-regular-svg-icons'

const Workers = () => {
    const { subcategory } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Definice povolených podkategorií
    const allowedSubcategories = ["light_technician", "sound_technician", "av_technician", "rigger", "stagehands"];

    // Pokud subcategory není v povolených podkategotiích, přesměruj na 404
    if (subcategory && !allowedSubcategories.includes(subcategory)) {
        return <Navigate to="/not_found" replace />;
    }

    // Pokud subcategory není v povolených podkategotiích, přesměruj na 404
    const titleHero = !subcategory
        ? categoryMap[location.pathname.split("/")[1]]
        : categoryMap[subcategory];

    return (
        <>
            <Header />
            <Path type={location.pathname.split("/")[1]} subcategory={subcategory} />
            <h1>{titleHero}</h1>

            {!subcategory && (
                <div className="workers-nav">
                    {/* Tady budou tlačítka pro podkategorie */}
                    <ButtonSubcategory
                        icon={<FontAwesomeIcon icon={faMessage} />}
                        text="Osvětlovač"
                        onClick={() => navigate(buildRoute(ROUTES.WORKERS_CATEGORY, { subcategory: "light_technician" }))}
                    />
                    <ButtonSubcategory
                        icon={<FontAwesomeIcon icon={faMessage} />}
                        text="Zvukař"
                        onClick={() => navigate(buildRoute(ROUTES.WORKERS_CATEGORY, { subcategory: "sound_technician" }))}
                    />
                    <ButtonSubcategory
                        icon={<FontAwesomeIcon icon={faMessage} />}
                        text="AV Technik"
                        onClick={() => navigate(buildRoute(ROUTES.WORKERS_CATEGORY, { subcategory: "av_technician" }))}
                    />
                    <ButtonSubcategory
                        icon={<FontAwesomeIcon icon={faMessage} />}
                        text="Rigger"
                        onClick={() => navigate(buildRoute(ROUTES.WORKERS_CATEGORY, { subcategory: "rigger" }))}
                    />
                    <ButtonSubcategory
                        icon={<FontAwesomeIcon icon={faMessage} />}
                        text="Stagehands"
                        onClick={() => navigate(buildRoute(ROUTES.WORKERS_CATEGORY, { subcategory: "stagehands" }))}
                    />
                </div>
            )}
            <div className="all-filters">

            </div>
            <div className="all-items">
                <Item profile_picture={workers[0].image} name={workers[0].name} role={workers[0].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[0].name)}-${workers[0].id}` }))} />
                <Item profile_picture={workers[1].image} name={workers[1].name} role={workers[1].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[1].name)}-${workers[1].id}` }))} />
                <Item profile_picture={workers[2].image} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
            </div>
        </>
    )
}

export default Workers