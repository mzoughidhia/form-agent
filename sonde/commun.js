// ---------------------------------------------------------------------------
//  Fonctions partagées entre la sonde et le panneau.
// ---------------------------------------------------------------------------

// Clé d'un site. Une page ouverte en file:// n'a pas d'origine — Chrome
// renvoie la chaîne "null" — donc on les regroupe sous une clé unique,
// suffisante pour les essais locaux.
function siteDe(adresse) {
    try {
        const url = new URL(adresse);
        return url.protocol === "file:" ? "file://" : url.origin;
    } catch (erreur) {
        return "";
    }
}

// Nom lisible d'un site, pour l'affichage.
function nomDeSite(cle) {
    if (cle === "file://") {
        return "fichiers locaux";
    }

    try {
        return new URL(cle).hostname;
    } catch (erreur) {
        return cle;
    }
}
