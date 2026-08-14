// ---------------------------------------------------------------------------
//  L'ONTOLOGIE - la liste unique des champs metier.
//
//  C'est le vocabulaire commun. Le CRM dit 'client.birthDate', AXA affiche
//  'Ne(e) le', Allianz 'Date de naiss.' : les trois designent la meme chose.
//  Sans cette liste au milieu, il faudrait un mapping par compagnie ET par
//  client - 10 compagnies x 50 clients = 500 recettes.
//
//  Recuperee du commit fc3caf1, ou elle etait couverte par 36 tests.
//  NE JAMAIS RENOMMER UNE CLE : les recettes y font reference.
// ---------------------------------------------------------------------------

const ONTOLOGIE = {
    "version": "1.0.0",
    "types": {
        "texte": {
            "formats": [
                "Texte",
                "TEXTE",
                "texte",
                "X XX XX XX XXX XXX XX",
                "XXXXXXXXXXXXXXX",
                "XXX XXX XXX XXXXX",
                "XXXXXXXXXXXXXX",
                "XXX XXX XXX",
                "XXXXXXXXX",
                "XXXXX"
            ],
            "defaut": [
                "Texte",
                "TEXTE",
                "texte"
            ]
        },
        "date": {
            "formats": [
                "JJ/MM/AAAA",
                "JJ-MM-AAAA",
                "JJ.MM.AAAA",
                "JJMMAAAA",
                "AAAA-MM-JJ",
                "J/M/AAAA",
                "JJ/MM/AA",
                "JJ mois AAAA"
            ]
        },
        "entier": {
            "formats": [
                "123",
                "1 234"
            ]
        },
        "decimal": {
            "formats": [
                "1234,56",
                "1234.56",
                "1 234,56",
                "1234"
            ]
        },
        "booleen": {
            "formats": [
                "Oui/Non",
                "OUI/NON",
                "O/N",
                "true/false",
                "1/0",
                "coché"
            ]
        },
        "enum": {
            "formats": [
                "Libellé",
                "LIBELLÉ",
                "libellé",
                "VALEUR"
            ]
        },
        "telephone": {
            "formats": [
                "0XXXXXXXXX",
                "0X XX XX XX XX",
                "0X.XX.XX.XX.XX",
                "0X-XX-XX-XX-XX",
                "+33XXXXXXXXX",
                "+33 X XX XX XX XX",
                "0033XXXXXXXXX"
            ]
        },
        "email": {
            "formats": [
                "nom@domaine.fr",
                "NOM@DOMAINE.FR"
            ]
        },
        "codePostal": {
            "formats": [
                "XXXXX"
            ]
        },
        "iban": {
            "formats": [
                "FRXX XXXX XXXX XXXX XXXX XXXX XXX",
                "FRXXXXXXXXXXXXXXXXXXXXXXXXX"
            ]
        },
        "immatriculation": {
            "formats": [
                "AA-123-AA",
                "AA123AA",
                "AA 123 AA",
                "1234 AB 56"
            ]
        }
    },
    "sections": [
        {
            "id": "identity",
            "label": "Identité",
            "prefixes": [
                "client."
            ]
        },
        {
            "id": "contact",
            "label": "Coordonnées",
            "prefixes": [
                "client."
            ]
        },
        {
            "id": "household",
            "label": "Foyer",
            "prefixes": [
                "spouse.",
                "child1.",
                "child2.",
                "child3.",
                "household."
            ]
        },
        {
            "id": "driver",
            "label": "Conducteur",
            "prefixes": [
                "driver."
            ]
        },
        {
            "id": "vehicle",
            "label": "Véhicule",
            "prefixes": [
                "vehicle."
            ]
        },
        {
            "id": "home",
            "label": "Logement",
            "prefixes": [
                "home."
            ]
        },
        {
            "id": "health",
            "label": "Santé",
            "prefixes": [
                "health."
            ]
        },
        {
            "id": "loan",
            "label": "Emprunteur",
            "prefixes": [
                "loan."
            ]
        },
        {
            "id": "business",
            "label": "Professionnel",
            "prefixes": [
                "business."
            ]
        },
        {
            "id": "contract",
            "label": "Contrat",
            "prefixes": [
                "contract."
            ]
        }
    ],
    "fields": [
        {
            "key": "client.civility",
            "section": "identity",
            "label": "Civilité",
            "type": "enum",
            "synonyms": [
                "Titre",
                "Madame ou Monsieur",
                "Vous êtes"
            ],
            "values": [
                {
                    "value": "MONSIEUR",
                    "label": "Monsieur",
                    "synonyms": [
                        "M.",
                        "Mr",
                        "Homme"
                    ]
                },
                {
                    "value": "MADAME",
                    "label": "Madame",
                    "synonyms": [
                        "Mme",
                        "Mlle",
                        "Femme"
                    ]
                }
            ],
            "example": "MONSIEUR"
        },
        {
            "key": "client.lastName",
            "section": "identity",
            "label": "Nom",
            "type": "texte",
            "synonyms": [
                "Nom de famille",
                "Nom d'usage",
                "Nom de l'assuré",
                "Nom du souscripteur"
            ],
            "example": "DUPONT"
        },
        {
            "key": "client.birthName",
            "section": "identity",
            "label": "Nom de naissance",
            "type": "texte",
            "synonyms": [
                "Nom de jeune fille",
                "Nom patronymique"
            ],
            "example": "MARTIN"
        },
        {
            "key": "client.firstName",
            "section": "identity",
            "label": "Prénom",
            "type": "texte",
            "synonyms": [
                "Prénoms",
                "Prénom de l'assuré",
                "Prénom du souscripteur"
            ],
            "example": "Jean"
        },
        {
            "key": "client.birthDate",
            "section": "identity",
            "label": "Date de naissance",
            "type": "date",
            "synonyms": [
                "Né(e) le",
                "Né le",
                "Date de naiss.",
                "Naissance",
                "Date de naissance de l'assuré"
            ],
            "example": "07/03/1985"
        },
        {
            "key": "client.age",
            "section": "identity",
            "label": "Âge",
            "type": "entier",
            "unit": "ANNEES",
            "synonyms": [
                "Âge de l'assuré",
                "Âge du souscripteur",
                "Âge à la souscription"
            ],
            "derived": {
                "from": [
                    "client.birthDate"
                ],
                "computation": "ageEnAnneesRevolues",
                "formula": "années révolues entre client.birthDate et la date du jour"
            },
            "example": "40"
        },
        {
            "key": "client.birthPlace",
            "section": "identity",
            "label": "Lieu de naissance",
            "type": "texte",
            "synonyms": [
                "Ville de naissance",
                "Commune de naissance"
            ],
            "example": "Lyon"
        },
        {
            "key": "client.nationality",
            "section": "identity",
            "label": "Nationalité",
            "type": "texte",
            "synonyms": [
                "Pays de nationalité",
                "Nationalité de l'assuré"
            ],
            "example": "Française"
        },
        {
            "key": "client.profession",
            "section": "identity",
            "label": "Profession",
            "type": "texte",
            "synonyms": [
                "Métier",
                "Catégorie socioprofessionnelle",
                "Activité professionnelle",
                "Profession exercée"
            ],
            "example": "Ingénieur"
        },
        {
            "key": "client.maritalStatus",
            "section": "identity",
            "label": "Situation familiale",
            "type": "enum",
            "synonyms": [
                "Situation de famille",
                "État civil",
                "Statut marital"
            ],
            "values": [
                {
                    "value": "CELIBATAIRE",
                    "label": "Célibataire",
                    "synonyms": [
                        "Seul(e)"
                    ]
                },
                {
                    "value": "MARIE",
                    "label": "Marié(e)",
                    "synonyms": [
                        "Marié",
                        "Mariée"
                    ]
                },
                {
                    "value": "PACSE",
                    "label": "Pacsé(e)",
                    "synonyms": [
                        "PACS",
                        "Pacsé"
                    ]
                },
                {
                    "value": "CONCUBINAGE",
                    "label": "Concubinage",
                    "synonyms": [
                        "Union libre",
                        "Vie maritale"
                    ]
                },
                {
                    "value": "DIVORCE",
                    "label": "Divorcé(e)",
                    "synonyms": [
                        "Divorcé",
                        "Divorcée"
                    ]
                },
                {
                    "value": "SEPARE",
                    "label": "Séparé(e)",
                    "synonyms": [
                        "Séparé",
                        "Séparée"
                    ]
                },
                {
                    "value": "VEUF",
                    "label": "Veuf(ve)",
                    "synonyms": [
                        "Veuf",
                        "Veuve"
                    ]
                }
            ],
            "example": "MARIE"
        },
        {
            "key": "client.socialSecurityNumber",
            "section": "identity",
            "label": "Numéro de sécurité sociale",
            "type": "texte",
            "synonyms": [
                "N° de sécurité sociale",
                "NIR",
                "Numéro d'assuré social",
                "N° INSEE"
            ],
            "formats": [
                "X XX XX XX XXX XXX XX",
                "XXXXXXXXXXXXXXX"
            ],
            "note": "15 chiffres, clé comprise. Certains extranets ne demandent que les 13 premiers.",
            "example": "1 85 03 69 123 456 78"
        },
        {
            "key": "client.addressStreet",
            "section": "contact",
            "label": "Adresse",
            "type": "texte",
            "synonyms": [
                "Adresse postale",
                "N° et libellé de la voie",
                "Rue",
                "Adresse du domicile"
            ],
            "example": "12 rue des Lilas"
        },
        {
            "key": "client.addressComplement",
            "section": "contact",
            "label": "Complément d'adresse",
            "type": "texte",
            "synonyms": [
                "Bâtiment, escalier, étage",
                "Lieu-dit",
                "Complément"
            ],
            "example": "Bâtiment B"
        },
        {
            "key": "client.postalCode",
            "section": "contact",
            "label": "Code postal",
            "type": "codePostal",
            "synonyms": [
                "CP",
                "Code postal du domicile"
            ],
            "example": "69003"
        },
        {
            "key": "client.city",
            "section": "contact",
            "label": "Ville",
            "type": "texte",
            "synonyms": [
                "Commune",
                "Localité",
                "Ville de résidence"
            ],
            "example": "Lyon"
        },
        {
            "key": "client.country",
            "section": "contact",
            "label": "Pays",
            "type": "texte",
            "synonyms": [
                "Pays de résidence"
            ],
            "example": "France"
        },
        {
            "key": "client.mobilePhone",
            "section": "contact",
            "label": "Téléphone mobile",
            "type": "telephone",
            "synonyms": [
                "Portable",
                "Mobile",
                "N° de portable",
                "Tél. mobile",
                "Téléphone portable",
                "Tél. portable",
                "N° de téléphone portable",
                "Numéro de portable",
                "Téléphone"
            ],
            "example": "0612345678"
        },
        {
            "key": "client.landlinePhone",
            "section": "contact",
            "label": "Téléphone fixe",
            "type": "telephone",
            "synonyms": [
                "Fixe",
                "Tél. domicile",
                "N° de téléphone fixe"
            ],
            "example": "0478123456"
        },
        {
            "key": "client.email",
            "section": "contact",
            "label": "Adresse e-mail",
            "type": "email",
            "synonyms": [
                "E-mail",
                "Courriel",
                "Mail",
                "Adresse électronique"
            ],
            "example": "jean.dupont@exemple.fr"
        },
        {
            "key": "client.callbackSlot",
            "section": "contact",
            "label": "Créneau de rappel",
            "type": "enum",
            "synonyms": [
                "Créneau souhaité",
                "Moment de rappel",
                "Quand souhaitez-vous être rappelé",
                "Plage horaire de rappel",
                "Heure de rappel"
            ],
            "values": [
                { "value": "MATIN", "label": "Matin", "synonyms": ["Le matin", "Avant midi"] },
                { "value": "APRES_MIDI", "label": "Après-midi", "synonyms": ["L'après-midi", "Début d'après-midi"] },
                { "value": "SOIREE", "label": "Soirée", "synonyms": ["Le soir", "En soirée", "Fin de journée"] }
            ],
            "example": "MATIN"
        },
        {
            "key": "spouse.lastName",
            "section": "household",
            "label": "Nom du conjoint",
            "type": "texte",
            "synonyms": [
                "Nom du conjoint ou concubin"
            ],
            "example": "DUPONT"
        },
        {
            "key": "spouse.firstName",
            "section": "household",
            "label": "Prénom du conjoint",
            "type": "texte",
            "synonyms": [
                "Prénom du conjoint ou concubin"
            ],
            "example": "Claire"
        },
        {
            "key": "spouse.birthDate",
            "section": "household",
            "label": "Date de naissance du conjoint",
            "type": "date",
            "synonyms": [
                "Conjoint né(e) le",
                "Conjoint né le",
                "Naissance du conjoint"
            ],
            "example": "22/11/1987"
        },
        {
            "key": "child1.birthDate",
            "section": "household",
            "label": "Date de naissance du 1er enfant",
            "type": "date",
            "synonyms": [
                "Enfant 1 - date de naissance",
                "Premier enfant né(e) le"
            ],
            "note": "Emplacement fixe : la phase 1 couvre trois enfants au maximum.",
            "example": "14/06/2012"
        },
        {
            "key": "child2.birthDate",
            "section": "household",
            "label": "Date de naissance du 2e enfant",
            "type": "date",
            "synonyms": [
                "Enfant 2 - date de naissance",
                "Deuxième enfant né(e) le"
            ],
            "example": "03/09/2015"
        },
        {
            "key": "child3.birthDate",
            "section": "household",
            "label": "Date de naissance du 3e enfant",
            "type": "date",
            "synonyms": [
                "Enfant 3 - date de naissance",
                "Troisième enfant né(e) le"
            ],
            "example": "27/01/2019"
        },
        {
            "key": "household.childCount",
            "section": "household",
            "label": "Nombre d'enfants",
            "type": "entier",
            "unit": "PERSONNES",
            "synonyms": [
                "Nb d'enfants",
                "Enfants à charge",
                "Nombre d'enfants à charge"
            ],
            "example": "2"
        },
        {
            "key": "household.memberCount",
            "section": "household",
            "label": "Nombre de personnes au foyer",
            "type": "entier",
            "unit": "PERSONNES",
            "synonyms": [
                "Composition du foyer",
                "Nb de personnes au foyer",
                "Nombre d'occupants"
            ],
            "derived": {
                "from": [
                    "client.maritalStatus",
                    "household.childCount"
                ],
                "computation": "tailleDuFoyer",
                "formula": "1 + 1 si client.maritalStatus vaut MARIE, PACSE ou CONCUBINAGE + household.childCount"
            },
            "example": "4"
        },
        {
            "key": "driver.licenseIssueDate",
            "section": "driver",
            "label": "Date d'obtention du permis",
            "type": "date",
            "synonyms": [
                "Permis obtenu le",
                "Date du permis de conduire",
                "Date de délivrance du permis"
            ],
            "example": "12/09/2003"
        },
        {
            "key": "driver.licenseSeniority",
            "section": "driver",
            "label": "Ancienneté de permis",
            "type": "entier",
            "unit": "ANNEES",
            "synonyms": [
                "Nombre d'années de permis",
                "Ancienneté du permis de conduire"
            ],
            "derived": {
                "from": [
                    "driver.licenseIssueDate"
                ],
                "computation": "anneesDepuis",
                "formula": "années révolues entre driver.licenseIssueDate et la date du jour"
            },
            "example": "22"
        },
        {
            "key": "driver.licenseType",
            "section": "driver",
            "label": "Type de permis",
            "type": "enum",
            "synonyms": [
                "Catégorie de permis",
                "Permis détenu"
            ],
            "values": [
                {
                    "value": "B",
                    "label": "Permis B",
                    "synonyms": [
                        "B - voiture",
                        "Véhicules légers"
                    ]
                },
                {
                    "value": "A",
                    "label": "Permis A",
                    "synonyms": [
                        "A - moto",
                        "Moto toutes cylindrées"
                    ]
                },
                {
                    "value": "A1",
                    "label": "Permis A1",
                    "synonyms": [
                        "A1 - 125 cm³"
                    ]
                },
                {
                    "value": "A2",
                    "label": "Permis A2",
                    "synonyms": [
                        "A2 - moto bridée"
                    ]
                },
                {
                    "value": "AM",
                    "label": "Permis AM",
                    "synonyms": [
                        "AM - cyclomoteur",
                        "BSR"
                    ]
                },
                {
                    "value": "BE",
                    "label": "Permis BE",
                    "synonyms": [
                        "BE - remorque"
                    ]
                },
                {
                    "value": "C",
                    "label": "Permis C",
                    "synonyms": [
                        "C - poids lourd"
                    ]
                },
                {
                    "value": "D",
                    "label": "Permis D",
                    "synonyms": [
                        "D - transport en commun"
                    ]
                }
            ],
            "example": "B"
        },
        {
            "key": "driver.trainingType",
            "section": "driver",
            "label": "Mode d'apprentissage",
            "type": "enum",
            "synonyms": [
                "Type d'apprentissage",
                "Apprentissage de la conduite"
            ],
            "values": [
                {
                    "value": "CLASSIQUE",
                    "label": "Apprentissage classique",
                    "synonyms": [
                        "Filière classique"
                    ]
                },
                {
                    "value": "CONDUITE_ACCOMPAGNEE",
                    "label": "Conduite accompagnée",
                    "synonyms": [
                        "AAC",
                        "Apprentissage anticipé"
                    ]
                },
                {
                    "value": "CONDUITE_SUPERVISEE",
                    "label": "Conduite supervisée",
                    "synonyms": [
                        "Supervisée"
                    ]
                }
            ],
            "example": "CLASSIQUE"
        },
        {
            "key": "driver.bonusMalus",
            "section": "driver",
            "label": "Coefficient bonus-malus",
            "type": "decimal",
            "synonyms": [
                "Bonus-malus",
                "CRM",
                "Coefficient de réduction-majoration",
                "Bonus"
            ],
            "formats": [
                "1234,56",
                "1234.56"
            ],
            "note": "Entre 0,50 et 3,50. Jamais de séparateur de milliers.",
            "example": "0,85"
        },
        {
            "key": "driver.insuranceSeniority",
            "section": "driver",
            "label": "Ancienneté d'assurance",
            "type": "entier",
            "unit": "ANNEES",
            "synonyms": [
                "Nombre d'années d'assurance",
                "Ancienneté comme assuré",
                "Années d'assurance sans interruption"
            ],
            "example": "12"
        },
        {
            "key": "driver.claimCount",
            "section": "driver",
            "label": "Nombre de sinistres",
            "type": "entier",
            "synonyms": [
                "Nb de sinistres",
                "Sinistres sur 36 mois",
                "Nombre de sinistres sur 36 mois",
                "Nombre de sinistres sur 5 ans",
                "Sinistres déclarés"
            ],
            "example": "1"
        },
        {
            "key": "driver.claimResponsibility",
            "section": "driver",
            "label": "Responsabilité du dernier sinistre",
            "type": "enum",
            "synonyms": [
                "Part de responsabilité",
                "Sinistre responsable ou non"
            ],
            "values": [
                {
                    "value": "RESPONSABLE",
                    "label": "Responsable",
                    "synonyms": [
                        "Totalement responsable",
                        "100 % responsable"
                    ]
                },
                {
                    "value": "PARTIELLEMENT_RESPONSABLE",
                    "label": "Partiellement responsable",
                    "synonyms": [
                        "50 % responsable",
                        "Responsabilité partagée"
                    ]
                },
                {
                    "value": "NON_RESPONSABLE",
                    "label": "Non responsable",
                    "synonyms": [
                        "Sans responsabilité"
                    ]
                },
                {
                    "value": "AUCUN_SINISTRE",
                    "label": "Aucun sinistre",
                    "synonyms": [
                        "Pas de sinistre"
                    ]
                }
            ],
            "example": "NON_RESPONSABLE"
        },
        {
            "key": "driver.terminationByInsurer",
            "section": "driver",
            "label": "Résiliation par l'assureur",
            "type": "booleen",
            "synonyms": [
                "Résilié par l'assureur",
                "Antécédent de résiliation",
                "Avez-vous été résilié"
            ],
            "example": "Non"
        },
        {
            "key": "driver.terminationReason",
            "section": "driver",
            "label": "Motif de résiliation",
            "type": "enum",
            "synonyms": [
                "Cause de la résiliation",
                "Raison de la résiliation"
            ],
            "values": [
                {
                    "value": "SANS_OBJET",
                    "label": "Sans objet",
                    "synonyms": [
                        "Jamais résilié"
                    ]
                },
                {
                    "value": "NON_PAIEMENT",
                    "label": "Non-paiement de la prime",
                    "synonyms": [
                        "Défaut de paiement"
                    ]
                },
                {
                    "value": "SINISTRES",
                    "label": "Sinistres trop nombreux",
                    "synonyms": [
                        "Fréquence de sinistres"
                    ]
                },
                {
                    "value": "FAUSSE_DECLARATION",
                    "label": "Fausse déclaration",
                    "synonyms": [
                        "Déclaration inexacte"
                    ]
                },
                {
                    "value": "ALCOOLEMIE",
                    "label": "Alcoolémie ou stupéfiants",
                    "synonyms": [
                        "Conduite en état d'ivresse"
                    ]
                },
                {
                    "value": "SUSPENSION_PERMIS",
                    "label": "Suspension du permis",
                    "synonyms": [
                        "Permis suspendu"
                    ]
                },
                {
                    "value": "AUTRE",
                    "label": "Autre motif",
                    "synonyms": [
                        "Autre cause"
                    ]
                }
            ],
            "example": "SANS_OBJET"
        },
        {
            "key": "driver.licenseSuspension",
            "section": "driver",
            "label": "Suspension de permis",
            "type": "booleen",
            "synonyms": [
                "Retrait de permis",
                "Annulation de permis",
                "Suspension ou annulation du permis"
            ],
            "example": "Non"
        },
        {
            "key": "vehicle.registration",
            "section": "vehicle",
            "label": "Immatriculation",
            "type": "immatriculation",
            "synonyms": [
                "Plaque d'immatriculation",
                "N° d'immatriculation",
                "Numéro minéralogique"
            ],
            "example": "AB-123-CD"
        },
        {
            "key": "vehicle.brand",
            "section": "vehicle",
            "label": "Marque",
            "type": "texte",
            "synonyms": [
                "Marque du véhicule",
                "Constructeur"
            ],
            "example": "RENAULT"
        },
        {
            "key": "vehicle.model",
            "section": "vehicle",
            "label": "Modèle",
            "type": "texte",
            "synonyms": [
                "Modèle du véhicule",
                "Type de véhicule"
            ],
            "example": "Clio V"
        },
        {
            "key": "vehicle.firstRegistrationDate",
            "section": "vehicle",
            "label": "Date de première mise en circulation",
            "type": "date",
            "synonyms": [
                "1ère mise en circulation",
                "Mise en circulation",
                "Date de MEC"
            ],
            "example": "18/04/2019"
        },
        {
            "key": "vehicle.age",
            "section": "vehicle",
            "label": "Âge du véhicule",
            "type": "entier",
            "unit": "ANNEES",
            "synonyms": [
                "Ancienneté du véhicule",
                "Nombre d'années du véhicule"
            ],
            "derived": {
                "from": [
                    "vehicle.firstRegistrationDate"
                ],
                "computation": "anneesDepuis",
                "formula": "années révolues entre vehicle.firstRegistrationDate et la date du jour"
            },
            "example": "6"
        },
        {
            "key": "vehicle.value",
            "section": "vehicle",
            "label": "Valeur du véhicule",
            "type": "decimal",
            "unit": "EUR",
            "synonyms": [
                "Valeur à neuf",
                "Prix d'achat du véhicule",
                "Valeur vénale"
            ],
            "example": "12500,00"
        },
        {
            "key": "vehicle.fuel",
            "section": "vehicle",
            "label": "Énergie",
            "type": "enum",
            "synonyms": [
                "Carburant",
                "Type de carburant",
                "Énergie du véhicule"
            ],
            "values": [
                {
                    "value": "ESSENCE",
                    "label": "Essence",
                    "synonyms": [
                        "Sans plomb",
                        "SP95"
                    ]
                },
                {
                    "value": "DIESEL",
                    "label": "Diesel",
                    "synonyms": [
                        "Gazole",
                        "Gasoil"
                    ]
                },
                {
                    "value": "ELECTRIQUE",
                    "label": "Électrique",
                    "synonyms": [
                        "100 % électrique"
                    ]
                },
                {
                    "value": "HYBRIDE",
                    "label": "Hybride",
                    "synonyms": [
                        "Hybride non rechargeable"
                    ]
                },
                {
                    "value": "HYBRIDE_RECHARGEABLE",
                    "label": "Hybride rechargeable",
                    "synonyms": [
                        "Hybride plug-in"
                    ]
                },
                {
                    "value": "GPL",
                    "label": "GPL",
                    "synonyms": [
                        "Gaz de pétrole liquéfié",
                        "Bicarburation"
                    ]
                }
            ],
            "example": "ESSENCE"
        },
        {
            "key": "vehicle.fiscalPower",
            "section": "vehicle",
            "label": "Puissance fiscale",
            "type": "entier",
            "unit": "CV",
            "synonyms": [
                "Puissance en CV",
                "CV fiscaux",
                "Chevaux fiscaux"
            ],
            "example": "5"
        },
        {
            "key": "vehicle.usage",
            "section": "vehicle",
            "label": "Usage du véhicule",
            "type": "enum",
            "synonyms": [
                "Type d'usage",
                "Utilisation du véhicule"
            ],
            "values": [
                {
                    "value": "PRIVE",
                    "label": "Privé",
                    "synonyms": [
                        "Usage personnel",
                        "Promenade"
                    ]
                },
                {
                    "value": "PRIVE_TRAJET_TRAVAIL",
                    "label": "Privé et trajet domicile-travail",
                    "synonyms": [
                        "Trajet travail",
                        "Promenade et travail"
                    ]
                },
                {
                    "value": "PROFESSIONNEL",
                    "label": "Professionnel",
                    "synonyms": [
                        "Usage professionnel",
                        "Affaires"
                    ]
                },
                {
                    "value": "TOUS_DEPLACEMENTS",
                    "label": "Tous déplacements",
                    "synonyms": [
                        "Tournées",
                        "Usage intensif"
                    ]
                }
            ],
            "example": "PRIVE_TRAJET_TRAVAIL"
        },
        {
            "key": "vehicle.annualMileage",
            "section": "vehicle",
            "label": "Kilométrage annuel",
            "type": "entier",
            "unit": "KM",
            "synonyms": [
                "Km parcourus par an",
                "Nombre de kilomètres par an",
                "Kilométrage par an"
            ],
            "example": "12000"
        },
        {
            "key": "vehicle.parking",
            "section": "vehicle",
            "label": "Lieu de stationnement",
            "type": "enum",
            "synonyms": [
                "Stationnement du véhicule",
                "Type de garage",
                "Où stationne le véhicule"
            ],
            "values": [
                {
                    "value": "GARAGE_FERME",
                    "label": "Garage fermé",
                    "synonyms": [
                        "Box fermé",
                        "Garage individuel"
                    ]
                },
                {
                    "value": "PARKING_COLLECTIF",
                    "label": "Parking collectif",
                    "synonyms": [
                        "Parking souterrain",
                        "Parking résidentiel"
                    ]
                },
                {
                    "value": "TERRAIN_PRIVE",
                    "label": "Terrain privé",
                    "synonyms": [
                        "Cour",
                        "Jardin clos"
                    ]
                },
                {
                    "value": "VOIE_PUBLIQUE",
                    "label": "Voie publique",
                    "synonyms": [
                        "Rue",
                        "Stationnement dans la rue"
                    ]
                }
            ],
            "example": "GARAGE_FERME"
        },
        {
            "key": "home.occupancyStatus",
            "section": "home",
            "label": "Qualité d'occupant",
            "type": "enum",
            "synonyms": [
                "Statut d'occupation",
                "Occupant du logement"
            ],
            "values": [
                {
                    "value": "PROPRIETAIRE_OCCUPANT",
                    "label": "Propriétaire occupant",
                    "synonyms": [
                        "Propriétaire"
                    ]
                },
                {
                    "value": "PROPRIETAIRE_NON_OCCUPANT",
                    "label": "Propriétaire non occupant",
                    "synonyms": [
                        "PNO",
                        "Propriétaire bailleur"
                    ]
                },
                {
                    "value": "LOCATAIRE",
                    "label": "Locataire",
                    "synonyms": [
                        "En location"
                    ]
                },
                {
                    "value": "COLOCATAIRE",
                    "label": "Colocataire",
                    "synonyms": [
                        "En colocation"
                    ]
                },
                {
                    "value": "HEBERGE_GRATUIT",
                    "label": "Hébergé à titre gratuit",
                    "synonyms": [
                        "Occupant à titre gratuit"
                    ]
                }
            ],
            "example": "LOCATAIRE"
        },
        {
            "key": "home.propertyType",
            "section": "home",
            "label": "Type de logement",
            "type": "enum",
            "synonyms": [
                "Nature du bien",
                "Type d'habitation"
            ],
            "values": [
                {
                    "value": "MAISON",
                    "label": "Maison",
                    "synonyms": [
                        "Maison individuelle",
                        "Pavillon"
                    ]
                },
                {
                    "value": "APPARTEMENT",
                    "label": "Appartement",
                    "synonyms": [
                        "Appart"
                    ]
                },
                {
                    "value": "STUDIO",
                    "label": "Studio",
                    "synonyms": [
                        "Studette"
                    ]
                },
                {
                    "value": "AUTRE",
                    "label": "Autre",
                    "synonyms": [
                        "Autre type de bien"
                    ]
                }
            ],
            "example": "APPARTEMENT"
        },
        {
            "key": "home.residenceType",
            "section": "home",
            "label": "Type de résidence",
            "type": "enum",
            "synonyms": [
                "Usage du logement",
                "Résidence principale ou secondaire"
            ],
            "values": [
                {
                    "value": "PRINCIPALE",
                    "label": "Résidence principale",
                    "synonyms": [
                        "Principale"
                    ]
                },
                {
                    "value": "SECONDAIRE",
                    "label": "Résidence secondaire",
                    "synonyms": [
                        "Secondaire"
                    ]
                },
                {
                    "value": "LOCATION_SAISONNIERE",
                    "label": "Location saisonnière",
                    "synonyms": [
                        "Meublé de tourisme"
                    ]
                },
                {
                    "value": "INOCCUPE",
                    "label": "Logement inoccupé",
                    "synonyms": [
                        "Vacant"
                    ]
                }
            ],
            "example": "PRINCIPALE"
        },
        {
            "key": "home.roomCount",
            "section": "home",
            "label": "Nombre de pièces",
            "type": "entier",
            "synonyms": [
                "Nb de pièces",
                "Pièces principales",
                "Nombre de pièces principales"
            ],
            "example": "3"
        },
        {
            "key": "home.surface",
            "section": "home",
            "label": "Surface habitable",
            "type": "decimal",
            "unit": "M2",
            "synonyms": [
                "Superficie",
                "Surface en m²",
                "Surface du logement"
            ],
            "example": "68,50"
        },
        {
            "key": "home.constructionYear",
            "section": "home",
            "label": "Année de construction",
            "type": "entier",
            "synonyms": [
                "Année de construction du bâtiment",
                "Date de construction"
            ],
            "example": "1965"
        },
        {
            "key": "home.hasAlarm",
            "section": "home",
            "label": "Alarme",
            "type": "booleen",
            "synonyms": [
                "Système d'alarme",
                "Présence d'une alarme",
                "Protection anti-intrusion"
            ],
            "example": "Oui"
        },
        {
            "key": "home.hasSwimmingPool",
            "section": "home",
            "label": "Piscine",
            "type": "booleen",
            "synonyms": [
                "Présence d'une piscine",
                "Piscine enterrée"
            ],
            "example": "Non"
        },
        {
            "key": "home.claimCount",
            "section": "home",
            "label": "Nombre de sinistres habitation",
            "type": "entier",
            "synonyms": [
                "Sinistres habitation sur 36 mois",
                "Nb de sinistres sur le logement"
            ],
            "example": "0"
        },
        {
            "key": "home.moveInDate",
            "section": "home",
            "label": "Date d'emménagement",
            "type": "date",
            "synonyms": [
                "Emménagement le",
                "Date d'entrée dans les lieux",
                "Depuis quand",
                "Occupant depuis le"
            ],
            "example": "01/06/2021"
        },
        {
            "key": "health.scheme",
            "section": "health",
            "label": "Régime social",
            "type": "enum",
            "synonyms": [
                "Régime obligatoire",
                "Régime d'assurance maladie",
                "Caisse d'affiliation"
            ],
            "values": [
                {
                    "value": "GENERAL",
                    "label": "Régime général",
                    "synonyms": [
                        "Salarié",
                        "CPAM"
                    ]
                },
                {
                    "value": "AGRICOLE",
                    "label": "Régime agricole",
                    "synonyms": [
                        "MSA",
                        "Exploitant agricole"
                    ]
                },
                {
                    "value": "INDEPENDANT",
                    "label": "Travailleur indépendant",
                    "synonyms": [
                        "TNS",
                        "Ex-RSI"
                    ]
                },
                {
                    "value": "ALSACE_MOSELLE",
                    "label": "Régime Alsace-Moselle",
                    "synonyms": [
                        "Régime local"
                    ]
                },
                {
                    "value": "FONCTIONNAIRE",
                    "label": "Fonctionnaire",
                    "synonyms": [
                        "Fonction publique"
                    ]
                },
                {
                    "value": "ETUDIANT",
                    "label": "Étudiant",
                    "synonyms": [
                        "Régime étudiant"
                    ]
                },
                {
                    "value": "AUTRE",
                    "label": "Autre régime",
                    "synonyms": [
                        "Régime spécial"
                    ]
                }
            ],
            "example": "GENERAL"
        },
        {
            "key": "health.currentInsurer",
            "section": "health",
            "label": "Mutuelle actuelle",
            "type": "texte",
            "synonyms": [
                "Complémentaire santé actuelle",
                "Organisme complémentaire actuel"
            ],
            "example": "Mutuelle Exemple"
        },
        {
            "key": "health.coverageLevel",
            "section": "health",
            "label": "Niveau de garantie",
            "type": "enum",
            "synonyms": [
                "Niveau de couverture",
                "Formule santé souhaitée"
            ],
            "values": [
                {
                    "value": "MINIMUM",
                    "label": "Minimum",
                    "synonyms": [
                        "Essentiel"
                    ]
                },
                {
                    "value": "ECONOMIQUE",
                    "label": "Économique",
                    "synonyms": [
                        "Éco"
                    ]
                },
                {
                    "value": "EQUILIBRE",
                    "label": "Équilibré",
                    "synonyms": [
                        "Intermédiaire santé"
                    ]
                },
                {
                    "value": "CONFORT",
                    "label": "Confort",
                    "synonyms": [
                        "Renforcé"
                    ]
                },
                {
                    "value": "MAXIMUM",
                    "label": "Maximum",
                    "synonyms": [
                        "Premium",
                        "Optimal"
                    ]
                }
            ],
            "example": "EQUILIBRE"
        },
        {
            "key": "health.beneficiaryClause",
            "section": "health",
            "label": "Clause bénéficiaire",
            "type": "texte",
            "synonyms": [
                "Bénéficiaires en cas de décès",
                "Désignation des bénéficiaires"
            ],
            "note": "Texte libre : les bénéficiaires ne sont presque jamais saisis champ par champ.",
            "example": "Mon conjoint, à défaut mes enfants nés ou à naître, à défaut mes héritiers"
        },
        {
            "key": "health.smoker",
            "section": "health",
            "label": "Fumeur",
            "type": "booleen",
            "synonyms": [
                "Statut tabagique",
                "Fumeur ou non-fumeur",
                "Consommation de tabac"
            ],
            "example": "Non"
        },
        {
            "key": "health.height",
            "section": "health",
            "label": "Taille",
            "type": "entier",
            "unit": "CM",
            "synonyms": [
                "Taille en cm",
                "Taille de l'assuré"
            ],
            "example": "178"
        },
        {
            "key": "health.weight",
            "section": "health",
            "label": "Poids",
            "type": "entier",
            "unit": "KG",
            "synonyms": [
                "Poids en kg",
                "Poids de l'assuré"
            ],
            "example": "74"
        },
        {
            "key": "loan.amount",
            "section": "loan",
            "label": "Montant du prêt",
            "type": "decimal",
            "unit": "EUR",
            "synonyms": [
                "Capital emprunté",
                "Montant emprunté",
                "Montant du crédit"
            ],
            "example": "180000,00"
        },
        {
            "key": "loan.duration",
            "section": "loan",
            "label": "Durée du prêt",
            "type": "entier",
            "unit": "MOIS",
            "synonyms": [
                "Durée du crédit",
                "Durée de remboursement",
                "Durée en mois"
            ],
            "note": "Toujours en mois côté ontologie. Les extranets qui affichent des années sont convertis à l'écriture.",
            "example": "240"
        },
        {
            "key": "loan.type",
            "section": "loan",
            "label": "Type de prêt",
            "type": "enum",
            "synonyms": [
                "Nature du prêt",
                "Objet du financement"
            ],
            "values": [
                {
                    "value": "IMMOBILIER_RESIDENCE_PRINCIPALE",
                    "label": "Immobilier - résidence principale",
                    "synonyms": [
                        "Achat résidence principale"
                    ]
                },
                {
                    "value": "IMMOBILIER_RESIDENCE_SECONDAIRE",
                    "label": "Immobilier - résidence secondaire",
                    "synonyms": [
                        "Achat résidence secondaire"
                    ]
                },
                {
                    "value": "IMMOBILIER_LOCATIF",
                    "label": "Immobilier locatif",
                    "synonyms": [
                        "Investissement locatif"
                    ]
                },
                {
                    "value": "TRAVAUX",
                    "label": "Travaux",
                    "synonyms": [
                        "Prêt travaux"
                    ]
                },
                {
                    "value": "CONSOMMATION",
                    "label": "Consommation",
                    "synonyms": [
                        "Crédit à la consommation"
                    ]
                },
                {
                    "value": "PROFESSIONNEL",
                    "label": "Professionnel",
                    "synonyms": [
                        "Prêt professionnel"
                    ]
                }
            ],
            "example": "IMMOBILIER_RESIDENCE_PRINCIPALE"
        },
        {
            "key": "loan.startDate",
            "section": "loan",
            "label": "Date de début du prêt",
            "type": "date",
            "synonyms": [
                "Date de déblocage des fonds",
                "Date de première échéance",
                "Prêt débutant le"
            ],
            "example": "01/06/2021"
        },
        {
            "key": "loan.endDate",
            "section": "loan",
            "label": "Date de fin du prêt",
            "type": "date",
            "synonyms": [
                "Terme du prêt",
                "Échéance finale du prêt"
            ],
            "derived": {
                "from": [
                    "loan.startDate",
                    "loan.duration"
                ],
                "computation": "finDePret",
                "formula": "loan.startDate décalée de loan.duration mois"
            },
            "example": "01/06/2041"
        },
        {
            "key": "loan.coveragePercent",
            "section": "loan",
            "label": "Quotité assurée",
            "type": "decimal",
            "unit": "POURCENT",
            "synonyms": [
                "Quotité",
                "Pourcentage de couverture",
                "Quotité d'assurance"
            ],
            "example": "100,00"
        },
        {
            "key": "loan.coBorrowerBirthDate",
            "section": "loan",
            "label": "Date de naissance du co-emprunteur",
            "type": "date",
            "synonyms": [
                "Co-emprunteur né(e) le",
                "Co-emprunteur né le",
                "Naissance du co-emprunteur"
            ],
            "example": "05/02/1988"
        },
        {
            "key": "loan.coBorrowerCoveragePercent",
            "section": "loan",
            "label": "Quotité du co-emprunteur",
            "type": "decimal",
            "unit": "POURCENT",
            "synonyms": [
                "Quotité assurée du co-emprunteur"
            ],
            "example": "50,00"
        },
        {
            "key": "business.name",
            "section": "business",
            "label": "Raison sociale",
            "type": "texte",
            "synonyms": [
                "Dénomination sociale",
                "Nom de l'entreprise",
                "Nom commercial"
            ],
            "example": "MENUISERIE EXEMPLE"
        },
        {
            "key": "business.legalForm",
            "section": "business",
            "label": "Forme juridique",
            "type": "enum",
            "synonyms": [
                "Statut juridique",
                "Type de société"
            ],
            "values": [
                {
                    "value": "EI",
                    "label": "Entreprise individuelle",
                    "synonyms": [
                        "EI"
                    ]
                },
                {
                    "value": "AUTO_ENTREPRENEUR",
                    "label": "Auto-entrepreneur",
                    "synonyms": [
                        "Micro-entreprise",
                        "Micro-entrepreneur"
                    ]
                },
                {
                    "value": "EURL",
                    "label": "EURL",
                    "synonyms": [
                        "Entreprise unipersonnelle à responsabilité limitée"
                    ]
                },
                {
                    "value": "SARL",
                    "label": "SARL",
                    "synonyms": [
                        "Société à responsabilité limitée"
                    ]
                },
                {
                    "value": "SAS",
                    "label": "SAS",
                    "synonyms": [
                        "Société par actions simplifiée"
                    ]
                },
                {
                    "value": "SASU",
                    "label": "SASU",
                    "synonyms": [
                        "SAS unipersonnelle"
                    ]
                },
                {
                    "value": "SA",
                    "label": "SA",
                    "synonyms": [
                        "Société anonyme"
                    ]
                },
                {
                    "value": "SCI",
                    "label": "SCI",
                    "synonyms": [
                        "Société civile immobilière"
                    ]
                },
                {
                    "value": "SNC",
                    "label": "SNC",
                    "synonyms": [
                        "Société en nom collectif"
                    ]
                },
                {
                    "value": "ASSOCIATION",
                    "label": "Association",
                    "synonyms": [
                        "Association loi 1901"
                    ]
                },
                {
                    "value": "AUTRE",
                    "label": "Autre forme juridique",
                    "synonyms": [
                        "Autre statut"
                    ]
                }
            ],
            "example": "SARL"
        },
        {
            "key": "business.siret",
            "section": "business",
            "label": "SIRET",
            "type": "texte",
            "synonyms": [
                "N° SIRET",
                "Numéro SIRET",
                "N° d'établissement"
            ],
            "formats": [
                "XXX XXX XXX XXXXX",
                "XXXXXXXXXXXXXX"
            ],
            "example": "812 345 678 00023"
        },
        {
            "key": "business.siren",
            "section": "business",
            "label": "SIREN",
            "type": "texte",
            "synonyms": [
                "N° SIREN",
                "Numéro SIREN"
            ],
            "formats": [
                "XXX XXX XXX",
                "XXXXXXXXX"
            ],
            "derived": {
                "from": [
                    "business.siret"
                ],
                "computation": "sirenDepuisSiret",
                "formula": "les 9 premiers chiffres de business.siret"
            },
            "example": "812345678"
        },
        {
            "key": "business.nafCode",
            "section": "business",
            "label": "Code NAF",
            "type": "texte",
            "synonyms": [
                "Code APE",
                "NAF / APE",
                "Activité principale exercée"
            ],
            "formats": [
                "XXXXX"
            ],
            "example": "4332A"
        },
        {
            "key": "business.activity",
            "section": "business",
            "label": "Activité de l'entreprise",
            "type": "texte",
            "synonyms": [
                "Nature de l'activité",
                "Description de l'activité",
                "Activité exercée"
            ],
            "example": "Pose de menuiseries intérieures"
        },
        {
            "key": "business.creationDate",
            "section": "business",
            "label": "Date de création de l'entreprise",
            "type": "date",
            "synonyms": [
                "Date d'immatriculation",
                "Entreprise créée le"
            ],
            "example": "03/02/2016"
        },
        {
            "key": "business.revenue",
            "section": "business",
            "label": "Chiffre d'affaires",
            "type": "decimal",
            "unit": "EUR",
            "synonyms": [
                "CA annuel",
                "Chiffre d'affaires annuel",
                "CA HT"
            ],
            "example": "320000,00"
        },
        {
            "key": "business.employeeCount",
            "section": "business",
            "label": "Effectif",
            "type": "entier",
            "unit": "PERSONNES",
            "synonyms": [
                "Nombre de salariés",
                "Effectif salarié",
                "Nb d'employés"
            ],
            "example": "4"
        },
        {
            "key": "business.premisesSurface",
            "section": "business",
            "label": "Surface des locaux",
            "type": "decimal",
            "unit": "M2",
            "synonyms": [
                "Superficie des locaux",
                "Surface professionnelle"
            ],
            "example": "210,00"
        },
        {
            "key": "business.premisesStatus",
            "section": "business",
            "label": "Statut d'occupation des locaux",
            "type": "enum",
            "synonyms": [
                "Occupation des locaux",
                "Qualité d'occupant des locaux"
            ],
            "values": [
                {
                    "value": "PROPRIETAIRE",
                    "label": "Propriétaire des locaux",
                    "synonyms": [
                        "Locaux en propriété"
                    ]
                },
                {
                    "value": "LOCATAIRE",
                    "label": "Locataire des locaux",
                    "synonyms": [
                        "Locaux loués",
                        "Bail commercial"
                    ]
                },
                {
                    "value": "COPROPRIETAIRE",
                    "label": "Copropriétaire",
                    "synonyms": [
                        "Locaux en copropriété"
                    ]
                },
                {
                    "value": "OCCUPANT_A_TITRE_GRATUIT",
                    "label": "Occupant à titre gratuit",
                    "synonyms": [
                        "Mise à disposition gratuite"
                    ]
                }
            ],
            "example": "LOCATAIRE"
        },
        {
            "key": "contract.effectiveDate",
            "section": "contract",
            "label": "Date d'effet",
            "type": "date",
            "synonyms": [
                "Date de prise d'effet",
                "Date de début des garanties",
                "Effet au",
                "Date d'effet souhaitée"
            ],
            "example": "01/09/2025"
        },
        {
            "key": "contract.paymentFrequency",
            "section": "contract",
            "label": "Périodicité de paiement",
            "type": "enum",
            "synonyms": [
                "Fractionnement",
                "Périodicité",
                "Fractionnement de la cotisation"
            ],
            "values": [
                {
                    "value": "MENSUELLE",
                    "label": "Mensuelle",
                    "synonyms": [
                        "Par mois",
                        "Mensuel"
                    ]
                },
                {
                    "value": "TRIMESTRIELLE",
                    "label": "Trimestrielle",
                    "synonyms": [
                        "Par trimestre",
                        "Trimestriel"
                    ]
                },
                {
                    "value": "SEMESTRIELLE",
                    "label": "Semestrielle",
                    "synonyms": [
                        "Par semestre",
                        "Semestriel"
                    ]
                },
                {
                    "value": "ANNUELLE",
                    "label": "Annuelle",
                    "synonyms": [
                        "Par an",
                        "Annuel"
                    ]
                }
            ],
            "example": "MENSUELLE"
        },
        {
            "key": "contract.paymentMethod",
            "section": "contract",
            "label": "Mode de paiement",
            "type": "enum",
            "synonyms": [
                "Moyen de paiement",
                "Mode de règlement",
                "Mode de règlement des cotisations"
            ],
            "values": [
                {
                    "value": "PRELEVEMENT",
                    "label": "Prélèvement automatique",
                    "synonyms": [
                        "Prélèvement",
                        "SEPA"
                    ]
                },
                {
                    "value": "VIREMENT",
                    "label": "Virement",
                    "synonyms": [
                        "Virement bancaire"
                    ]
                },
                {
                    "value": "CARTE_BANCAIRE",
                    "label": "Carte bancaire",
                    "synonyms": [
                        "CB"
                    ]
                },
                {
                    "value": "CHEQUE",
                    "label": "Chèque",
                    "synonyms": [
                        "Par chèque"
                    ]
                }
            ],
            "example": "PRELEVEMENT"
        },
        {
            "key": "contract.iban",
            "section": "contract",
            "label": "IBAN",
            "type": "iban",
            "synonyms": [
                "N° IBAN",
                "Coordonnées bancaires",
                "RIB"
            ],
            "example": "FR7630006000011234567890189"
        },
        {
            "key": "contract.accountHolder",
            "section": "contract",
            "label": "Titulaire du compte",
            "type": "texte",
            "synonyms": [
                "Nom du titulaire",
                "Titulaire du compte bancaire",
                "Nom et prénom du titulaire"
            ],
            "example": "DUPONT Jean"
        },
        {
            "key": "contract.deductible",
            "section": "contract",
            "label": "Franchise",
            "type": "decimal",
            "unit": "EUR",
            "synonyms": [
                "Montant de la franchise",
                "Franchise en euros"
            ],
            "example": "150,00"
        },
        {
            "key": "contract.coverageFormula",
            "section": "contract",
            "label": "Formule de garantie",
            "type": "enum",
            "synonyms": [
                "Formule choisie",
                "Type de garanties",
                "Formule du contrat"
            ],
            "values": [
                {
                    "value": "TIERS",
                    "label": "Tiers",
                    "synonyms": [
                        "Responsabilité civile",
                        "Au tiers"
                    ]
                },
                {
                    "value": "TIERS_ETENDU",
                    "label": "Tiers étendu",
                    "synonyms": [
                        "Tiers plus",
                        "Tiers confort"
                    ]
                },
                {
                    "value": "TOUS_RISQUES",
                    "label": "Tous risques",
                    "synonyms": [
                        "Toutes garanties"
                    ]
                },
                {
                    "value": "BASIQUE",
                    "label": "Formule basique",
                    "synonyms": [
                        "Formule de base"
                    ]
                },
                {
                    "value": "INTERMEDIAIRE",
                    "label": "Formule médiane",
                    "synonyms": [
                        "Formule intermédiaire"
                    ]
                },
                {
                    "value": "COMPLETE",
                    "label": "Formule complète",
                    "synonyms": [
                        "Formule intégrale"
                    ]
                }
            ],
            "example": "TOUS_RISQUES"
        },
        {
            "key": "contract.previousInsurer",
            "section": "contract",
            "label": "Assureur actuel",
            "type": "texte",
            "synonyms": [
                "Compagnie actuelle",
                "Assureur précédent",
                "Nom de l'assureur actuel"
            ],
            "example": "Assureur Exemple"
        },
        {
            "key": "contract.previousContractEndDate",
            "section": "contract",
            "label": "Date d'échéance du contrat actuel",
            "type": "date",
            "synonyms": [
                "Échéance principale",
                "Date de fin du contrat actuel"
            ],
            "example": "31/12/2025"
        },
        {
            "key": "contract.premiumAmount",
            "section": "contract",
            "label": "Montant de la cotisation",
            "type": "decimal",
            "unit": "EUR",
            "synonyms": [
                "Prime annuelle",
                "Cotisation annuelle",
                "Montant de la prime"
            ],
            "example": "540,00"
        }
    ]
};
