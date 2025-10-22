import { useParams } from "react-router-dom";

import Header from "../../components/Header"

import "./UserDetail.css"

const UserDetail = () => {
    const { slug } = useParams();

    // Rozdělíme slug a id
    const [nameSlug, id] = slug.split("-"); // ["adam_auzky", "384"]

    // Pokud chceš, můžeš z nameSlug udělat zpět jméno s mezerou:
    const name = nameSlug.replace(/_/g, " ");

    return (
        <>
            <Header />
            <h1>Detail pracujícího</h1>
            <p>Jméno: {name}</p>
            <p>ID: {id}</p>
        </>
    );
};

export default UserDetail;