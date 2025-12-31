import { useState, useEffect, useRef } from "react";
import Select from "react-select";
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
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { faStar as faStarFull } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons';

const Workers = () => {
    const { subcategory } = useParams();
    const path = useLocation();
    const navigate = useNavigate();
    const [location, setLocation] = useState("");

    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(false);

    // Definice povolených podkategorií
    const allowedSubcategories = ["light_technician", "sound_technician", "av_technician", "rigger", "stagehands"];

    // Pokud subcategory není v povolených podkategotiích, přesměruj na 404
    if (subcategory && !allowedSubcategories.includes(subcategory)) {
        return <Navigate to="/not_found" replace />;
    }

    // Pokud subcategory není v povolených podkategotiích, přesměruj na 404
    const titleHero = !subcategory
        ? categoryMap[path.pathname.split("/")[1]]
        : categoryMap[subcategory];

    const locationOptions = [
        { value: "", label: "Celá ČR" },
        { value: "praha", label: "Praha" },
        { value: "brno", label: "Brno" },
        { value: "ostrava", label: "Ostrava" },
        { value: "stredocesky", label: "Středočeský kraj" },
        { value: "jihocesky", label: "Jihočeský kraj" },
        { value: "plzensky", label: "Plzeňský kraj" },
        { value: "karlovarsky", label: "Karlovarský kraj" },
        { value: "ustecky", label: "Ústecký kraj" },
        { value: "liberecky", label: "Liberecký kraj" },
        { value: "kralovehradecky", label: "Královéhradecký kraj" },
        { value: "vysocina", label: "Vysočina" },
        { value: "jihomoravsky", label: "Jihomoravský kraj" },
        { value: "olomoucky", label: "Olomoucký kraj" },
        { value: "zlinsky", label: "Zlínský kraj" },
        { value: "moravskoslezsky", label: "Moravskoslezský kraj" },
    ];

    return (
        <>
            <Header />
            <Path type={path.pathname.split("/")[1]} subcategory={subcategory} />
            <h1 className="list_title">{titleHero}</h1>

            <div className="search_bar-container">
                <div className="search_bar-box">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="search_bar-icon" />
                    <input className="search_bar" placeholder="Vyhledávejte">
                    </input>
                </div>
            </div>


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
            <div className="list-container">
                <div className="all-filters">
                    <div className="filters">
                        <div className="location">
                            <div className="custom-select-wrapper">
                                <label className="body_base label-move">Lokalita</label>
                                <div
                                    className={`custom-select ${isOpen ? "open" : ""}`}
                                    onClick={() => setIsOpen(!isOpen)}
                                >
                                    <span className="selected">{selected ? selected.label : "-- Vyberte lokalitu --"}</span>
                                    <span className={`arrow ${isOpen ? "rotate" : ""}`}>▼</span>
                                </div>
                                {isOpen && (
                                    <div className="options">
                                        {locationOptions.map((opt) => (
                                            <div
                                                key={opt.value}
                                                className={`option ${selected?.value === opt.value ? "selected" : ""}`}
                                                onClick={() => {
                                                    setSelected(opt);
                                                    setIsOpen(false);
                                                }}
                                            >
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <label htmlFor="rating" className="body_base label-move">Hodnocení</label>
                        <div id="rating" className="checkbox-container checkbox-container-filter">
                            <input type="checkbox" id="visible" name="visible" value="visible" className="custom-checkbox"/>
                            <label htmlFor="visible" className="checkbox-text"><FontAwesomeIcon icon={faStarFull} className="star" /><FontAwesomeIcon icon={faStarFull} className="star" /><FontAwesomeIcon icon={faStarFull} className="star" /><FontAwesomeIcon icon={faStarFull} className="star" /><FontAwesomeIcon icon={faStarEmpty} className="star" /> a více</label>
                        </div>
                    </div>

                </div>
                <div className="all-items">
                    <Item profile_picture={workers[0].image} rating={workers[0].rating} name={workers[0].name} role={workers[0].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[0].name)}-${workers[0].id}` }))} />
                    <Item profile_picture={workers[1].image} rating={workers[1].rating} name={workers[1].name} role={workers[1].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[1].name)}-${workers[1].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                    <Item profile_picture={workers[2].image} rating={workers[2].rating} name={workers[2].name} role={workers[2].role} onClick={() => navigate(buildRoute(ROUTES.USER_DETAIL, { slug: `${makeSlug(workers[2].name)}-${workers[2].id}` }))} />
                </div>
            </div>

        </>
    )
}

export default Workers
