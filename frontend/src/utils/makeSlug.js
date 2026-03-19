const makeSlug = (name) =>
    name
        .toLowerCase()
        .normalize("NFD") // odstraní diakritiku
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9-]/g, "");

export default makeSlug;
