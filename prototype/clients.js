// ---------------------------------------------------------------------------
//  LES FICHES CLIENTS — les données statiques.
//
//  Un identifiant court, un nom lisible, et des données rangées SOUS LES
//  CLÉS DE L'ONTOLOGIE. C'est ce qui permet à la même recette de servir
//  pour n'importe quel client.
//
//  ⚠ CLIENTS FICTIFS. À terme ces fiches viendront du CRM, chargées à la
//  demande sous l'identité du courtier, et ne survivront pas à la session.
//  Des données réelles stockées ici resteraient en clair sur le poste.
//
//  Les valeurs sont écrites dans la forme canonique de l'ontologie :
//    date        JJ/MM/AAAA          telephone   0XXXXXXXXX
//    decimal     virgule (0,85)      enum        la VALEUR en majuscules
//  Les variantes d'écriture sont calculées, jamais saisies ici.
// ---------------------------------------------------------------------------

const CLIENTS = [
    {
        id: "42",
        nom: "DUPONT Jean",
        donnees: {
            "client.civility": "MONSIEUR",
            "client.lastName": "DUPONT",
            "client.firstName": "Jean",
            "client.birthDate": "07/03/1985",
            "client.birthPlace": "Lyon",
            "client.nationality": "Française",
            "client.profession": "Ingénieur",
            "client.maritalStatus": "MARIE",
            "client.addressStreet": "12 rue des Lilas",
            "client.addressComplement": "Bâtiment B",
            "client.postalCode": "69003",
            "client.city": "Lyon",
            "client.country": "France",
            "client.mobilePhone": "0612345678",
            "client.landlinePhone": "0478123456",
            "client.email": "jean.dupont@exemple.fr",
            "client.callbackSlot": "SOIREE",

            "household.childCount": "2",
            "spouse.lastName": "DUPONT",
            "spouse.firstName": "Claire",
            "spouse.birthDate": "22/11/1987",
            "child1.birthDate": "14/06/2012",
            "child2.birthDate": "03/09/2015",

            "driver.licenseIssueDate": "12/09/2003",
            "driver.licenseType": "B",
            "driver.trainingType": "CLASSIQUE",
            "driver.bonusMalus": "0,85",
            "driver.insuranceSeniority": "12",
            "driver.claimCount": "1",
            "driver.claimResponsibility": "NON_RESPONSABLE",
            "driver.terminationByInsurer": "Non",
            "driver.licenseSuspension": "Non",

            "vehicle.registration": "AB-123-CD",
            "vehicle.brand": "RENAULT",
            "vehicle.model": "Clio V",
            "vehicle.firstRegistrationDate": "18/04/2019",
            "vehicle.value": "12500,00",
            "vehicle.fuel": "ESSENCE",
            "vehicle.fiscalPower": "5",
            "vehicle.usage": "PRIVE_TRAJET_TRAVAIL",
            "vehicle.annualMileage": "12000",
            "vehicle.parking": "GARAGE_FERME",

            "home.occupancyStatus": "LOCATAIRE",
            "home.propertyType": "APPARTEMENT",
            "home.residenceType": "PRINCIPALE",
            "home.roomCount": "3",
            "home.surface": "68,50",
            "home.constructionYear": "1965",
            "home.hasAlarm": "Oui",
            "home.hasSwimmingPool": "Non",
            "home.moveInDate": "01/06/2021",

            "contract.effectiveDate": "01/09/2025",
            "contract.paymentFrequency": "MENSUELLE",
            "contract.paymentMethod": "PRELEVEMENT",
            "contract.iban": "FR7630006000011234567890189",
            "contract.accountHolder": "DUPONT Jean",
            "contract.previousInsurer": "Assureur Exemple"
        }
    },
    {
        id: "77",
        nom: "MARTIN Claire",
        donnees: {
            "client.civility": "MADAME",
            "client.lastName": "MARTIN",
            "client.firstName": "Claire",
            "client.birthDate": "22/11/1987",
            "client.birthPlace": "Grenoble",
            "client.nationality": "Française",
            "client.maritalStatus": "CELIBATAIRE",
            "client.addressStreet": "5 avenue de la Gare",
            "client.postalCode": "38000",
            "client.city": "Grenoble",
            "client.country": "France",
            "client.mobilePhone": "0755112233",
            "client.email": "claire.martin@exemple.fr",
            "client.callbackSlot": "APRES_MIDI",

            "household.childCount": "0",

            "driver.licenseIssueDate": "03/06/2010",
            "driver.licenseType": "B",
            "driver.trainingType": "CONDUITE_ACCOMPAGNEE",
            "driver.bonusMalus": "0,64",
            "driver.insuranceSeniority": "15",
            "driver.claimCount": "0",
            "driver.claimResponsibility": "AUCUN_SINISTRE",
            "driver.terminationByInsurer": "Non",
            "driver.licenseSuspension": "Non",

            "vehicle.registration": "EF-456-GH",
            "vehicle.brand": "PEUGEOT",
            "vehicle.model": "208",
            "vehicle.firstRegistrationDate": "02/02/2022",
            "vehicle.value": "18900,00",
            "vehicle.fuel": "ELECTRIQUE",
            "vehicle.fiscalPower": "4",
            "vehicle.usage": "PRIVE",
            "vehicle.annualMileage": "8000",
            "vehicle.parking": "PARKING_COLLECTIF",

            "home.occupancyStatus": "PROPRIETAIRE_OCCUPANT",
            "home.propertyType": "MAISON",
            "home.residenceType": "PRINCIPALE",
            "home.roomCount": "5",
            "home.surface": "110,00",
            "home.constructionYear": "2004",
            "home.hasAlarm": "Oui",
            "home.hasSwimmingPool": "Oui",

            "contract.effectiveDate": "15/10/2025",
            "contract.paymentFrequency": "ANNUELLE",
            "contract.paymentMethod": "PRELEVEMENT",
            "contract.iban": "FR1420041010050500013M02606"
        }
    },
    {
        // Fiche VOLONTAIREMENT INCOMPLÈTE : pas de permis, pas de véhicule,
        // pas de bonus-malus. C'est elle qui alimente la liste « à compléter ».
        id: "18",
        nom: "BENALI Sofia",
        donnees: {
            "client.civility": "MADAME",
            "client.lastName": "BENALI",
            "client.firstName": "Sofia",
            "client.birthDate": "30/01/1996",
            "client.maritalStatus": "PACSE",
            "client.addressStreet": "3 impasse des Vignes",
            "client.postalCode": "34000",
            "client.city": "Montpellier",
            "client.mobilePhone": "0699887766",
            "client.email": "sofia.benali@exemple.fr",

            "home.occupancyStatus": "LOCATAIRE",
            "home.propertyType": "STUDIO",
            "home.residenceType": "PRINCIPALE",
            "home.roomCount": "1",
            "home.surface": "28,00",

            "contract.effectiveDate": "01/12/2025"
        }
    },
    {
        // Profil AUTO complet, mais l'inverse du 42 : diesel, malus, résilié
        // pour non-paiement. Il éprouve les énumérations sur leurs autres
        // valeurs — un formulaire qui marche avec « Essence » et « Non »
        // peut très bien échouer sur « Diesel » et « Oui ».
        id: "55",
        nom: "LOPEZ Marc",
        donnees: {
            "client.civility": "MONSIEUR",
            "client.lastName": "LOPEZ",
            "client.firstName": "Marc",
            "client.birthDate": "19/08/1978",
            "client.birthPlace": "Toulouse",
            "client.nationality": "Espagnole",
            "client.profession": "Artisan menuisier",
            "client.maritalStatus": "DIVORCE",
            "client.addressStreet": "27 chemin du Moulin",
            "client.addressComplement": "Lieu-dit Les Cèdres",
            "client.postalCode": "31400",
            "client.city": "Toulouse",
            "client.country": "France",
            "client.mobilePhone": "0781459023",
            "client.landlinePhone": "0561884512",
            "client.email": "marc.lopez@exemple.fr",
            "client.callbackSlot": "APRES_MIDI",

            "household.childCount": "1",
            "child1.birthDate": "05/05/2010",

            "driver.licenseIssueDate": "24/01/1997",
            "driver.licenseType": "B",
            "driver.trainingType": "CLASSIQUE",
            "driver.bonusMalus": "1,26",
            "driver.insuranceSeniority": "28",
            "driver.claimCount": "3",
            "driver.claimResponsibility": "RESPONSABLE",
            "driver.terminationByInsurer": "Oui",
            "driver.terminationReason": "NON_PAIEMENT",
            // « Non » ici, et non « Oui » : deux données valant « Oui » dans
            // la même fiche rendent le rapprochement par valeur indécidable,
            // et le champ n'est pas appris. Résilié pour non-paiement, pas
            // pour une suspension — la fiche reste cohérente.
            "driver.licenseSuspension": "Non",

            "vehicle.registration": "JK-789-LM",
            "vehicle.brand": "CITROEN",
            "vehicle.model": "Berlingo",
            "vehicle.firstRegistrationDate": "09/11/2014",
            "vehicle.value": "7400,00",
            "vehicle.fuel": "DIESEL",
            "vehicle.fiscalPower": "7",
            "vehicle.usage": "PROFESSIONNEL",
            "vehicle.annualMileage": "27000",
            "vehicle.parking": "VOIE_PUBLIQUE",

            "contract.effectiveDate": "01/10/2025",
            "contract.paymentFrequency": "TRIMESTRIELLE",
            "contract.paymentMethod": "VIREMENT",
            "contract.iban": "FR7612548029981234567890161",
            "contract.accountHolder": "LOPEZ Marc",
            "contract.previousInsurer": "Ancienne Compagnie"
        }
    },
    {
        // Profil LOGEMENT complet : propriétaire, maison, date
        // d'emménagement. C'est lui qui remplit le parcours en trois pages
        // de bout en bout, profession comprise.
        id: "61",
        nom: "NGUYEN Linh",
        donnees: {
            "client.civility": "MADAME",
            "client.lastName": "NGUYEN",
            "client.firstName": "Linh",
            "client.birthDate": "12/04/1991",
            "client.birthPlace": "Nantes",
            "client.nationality": "Française",
            "client.profession": "Infirmière",
            "client.maritalStatus": "PACSE",
            "client.addressStreet": "8 rue du Verger",
            "client.addressComplement": "Escalier C, 2e étage",
            "client.postalCode": "44000",
            "client.city": "Nantes",
            "client.country": "France",
            "client.mobilePhone": "0640127788",
            "client.email": "linh.nguyen@exemple.fr",
            "client.callbackSlot": "MATIN",

            "household.childCount": "1",
            "spouse.lastName": "TRAN",
            "spouse.firstName": "Minh",
            "spouse.birthDate": "07/07/1989",
            "child1.birthDate": "18/02/2020",

            "home.occupancyStatus": "PROPRIETAIRE_OCCUPANT",
            "home.propertyType": "MAISON",
            "home.residenceType": "PRINCIPALE",
            "home.roomCount": "4",
            "home.surface": "92,00",
            "home.constructionYear": "1998",
            "home.hasAlarm": "Non",
            "home.hasSwimmingPool": "Non",
            "home.claimCount": "0",
            "home.moveInDate": "15/03/2023",

            "contract.effectiveDate": "01/11/2025",
            "contract.paymentFrequency": "MENSUELLE",
            "contract.paymentMethod": "PRELEVEMENT",
            "contract.iban": "FR7630004000031234567890143",
            "contract.accountHolder": "NGUYEN Linh"
        }
    },
    {
        // Profil FOYER : conjoint, trois enfants, coordonnées bancaires.
        // C'est lui qui remplit les blocs dépliés du formulaire 5.
        id: "73",
        nom: "GARCIA Paulo",
        donnees: {
            "client.civility": "MONSIEUR",
            "client.lastName": "GARCIA",
            "client.firstName": "Paulo",
            "client.birthDate": "02/12/1980",
            "client.birthPlace": "Marseille",
            "client.nationality": "Portugaise",
            "client.profession": "Chef de chantier",
            "client.maritalStatus": "MARIE",
            "client.addressStreet": "14 boulevard des Pins",
            "client.postalCode": "13008",
            "client.city": "Marseille",
            "client.country": "France",
            "client.mobilePhone": "0668223344",
            "client.email": "paulo.garcia@exemple.fr",
            "client.callbackSlot": "MATIN",

            "household.childCount": "3",
            "spouse.lastName": "GARCIA",
            "spouse.firstName": "Ana",
            "spouse.birthDate": "16/09/1983",
            "child1.birthDate": "21/03/2011",
            "child2.birthDate": "04/07/2014",
            "child3.birthDate": "29/12/2018",

            "home.occupancyStatus": "PROPRIETAIRE_OCCUPANT",
            "home.propertyType": "APPARTEMENT",
            "home.residenceType": "PRINCIPALE",
            "home.roomCount": "5",
            "home.surface": "104,00",
            "home.moveInDate": "01/09/2016",

            "contract.effectiveDate": "01/08/2025",
            "contract.paymentFrequency": "MENSUELLE",
            "contract.paymentMethod": "PRELEVEMENT",
            "contract.iban": "FR7610278073110002056980184",
            "contract.accountHolder": "GARCIA Paulo"
        }
    }
];

const Clients = (function () {
    "use strict";

    function parIdentifiant(identifiant) {
        const cherche = String(identifiant || "").trim().toLowerCase();

        return CLIENTS.find((client) => client.id.toLowerCase() === cherche) || null;
    }

    function liste() {
        return CLIENTS.map((client) => ({ id: client.id, nom: client.nom }));
    }

    return { parIdentifiant, liste };
}());
