"use strict";
(() => {
  // ontology.json
  var ontology_default = {
    version: "1.0.0",
    types: {
      texte: {
        formats: [
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
        defaut: ["Texte", "TEXTE", "texte"]
      },
      date: {
        formats: [
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
      entier: {
        formats: ["123", "1 234"]
      },
      decimal: {
        formats: ["1234,56", "1234.56", "1 234,56", "1234"]
      },
      booleen: {
        formats: ["Oui/Non", "OUI/NON", "O/N", "true/false", "1/0", "coch\xE9"]
      },
      enum: {
        formats: ["Libell\xE9", "LIBELL\xC9", "libell\xE9", "VALEUR"]
      },
      telephone: {
        formats: [
          "0XXXXXXXXX",
          "0X XX XX XX XX",
          "0X.XX.XX.XX.XX",
          "0X-XX-XX-XX-XX",
          "+33XXXXXXXXX",
          "+33 X XX XX XX XX",
          "0033XXXXXXXXX"
        ]
      },
      email: {
        formats: ["nom@domaine.fr", "NOM@DOMAINE.FR"]
      },
      codePostal: {
        formats: ["XXXXX"]
      },
      iban: {
        formats: [
          "FRXX XXXX XXXX XXXX XXXX XXXX XXX",
          "FRXXXXXXXXXXXXXXXXXXXXXXXXX"
        ]
      },
      immatriculation: {
        formats: ["AA-123-AA", "AA123AA", "AA 123 AA", "1234 AB 56"]
      }
    },
    sections: [
      { id: "identity", label: "Identit\xE9", prefixes: ["client."] },
      { id: "contact", label: "Coordonn\xE9es", prefixes: ["client."] },
      { id: "household", label: "Foyer", prefixes: ["spouse.", "child1.", "child2.", "child3.", "household."] },
      { id: "driver", label: "Conducteur", prefixes: ["driver."] },
      { id: "vehicle", label: "V\xE9hicule", prefixes: ["vehicle."] },
      { id: "home", label: "Logement", prefixes: ["home."] },
      { id: "health", label: "Sant\xE9", prefixes: ["health."] },
      { id: "loan", label: "Emprunteur", prefixes: ["loan."] },
      { id: "business", label: "Professionnel", prefixes: ["business."] },
      { id: "contract", label: "Contrat", prefixes: ["contract."] }
    ],
    fields: [
      {
        key: "client.civility",
        section: "identity",
        label: "Civilit\xE9",
        type: "enum",
        synonyms: ["Titre", "Madame ou Monsieur", "Vous \xEAtes"],
        values: [
          { value: "MONSIEUR", label: "Monsieur", synonyms: ["M.", "Mr", "Homme"] },
          { value: "MADAME", label: "Madame", synonyms: ["Mme", "Mlle", "Femme"] }
        ],
        example: "MONSIEUR"
      },
      {
        key: "client.lastName",
        section: "identity",
        label: "Nom",
        type: "texte",
        synonyms: ["Nom de famille", "Nom d'usage", "Nom de l'assur\xE9", "Nom du souscripteur"],
        example: "DUPONT"
      },
      {
        key: "client.birthName",
        section: "identity",
        label: "Nom de naissance",
        type: "texte",
        synonyms: ["Nom de jeune fille", "Nom patronymique"],
        example: "MARTIN"
      },
      {
        key: "client.firstName",
        section: "identity",
        label: "Pr\xE9nom",
        type: "texte",
        synonyms: ["Pr\xE9noms", "Pr\xE9nom de l'assur\xE9", "Pr\xE9nom du souscripteur"],
        example: "Jean"
      },
      {
        key: "client.birthDate",
        section: "identity",
        label: "Date de naissance",
        type: "date",
        synonyms: ["N\xE9(e) le", "N\xE9 le", "Date de naiss.", "Naissance", "Date de naissance de l'assur\xE9"],
        example: "07/03/1985"
      },
      {
        key: "client.age",
        section: "identity",
        label: "\xC2ge",
        type: "entier",
        unit: "ANNEES",
        synonyms: ["\xC2ge de l'assur\xE9", "\xC2ge du souscripteur", "\xC2ge \xE0 la souscription"],
        derived: {
          from: ["client.birthDate"],
          computation: "ageEnAnneesRevolues",
          formula: "ann\xE9es r\xE9volues entre client.birthDate et la date du jour"
        },
        example: "40"
      },
      {
        key: "client.birthPlace",
        section: "identity",
        label: "Lieu de naissance",
        type: "texte",
        synonyms: ["Ville de naissance", "Commune de naissance"],
        example: "Lyon"
      },
      {
        key: "client.nationality",
        section: "identity",
        label: "Nationalit\xE9",
        type: "texte",
        synonyms: ["Pays de nationalit\xE9", "Nationalit\xE9 de l'assur\xE9"],
        example: "Fran\xE7aise"
      },
      {
        key: "client.maritalStatus",
        section: "identity",
        label: "Situation familiale",
        type: "enum",
        synonyms: ["Situation de famille", "\xC9tat civil", "Statut marital"],
        values: [
          { value: "CELIBATAIRE", label: "C\xE9libataire", synonyms: ["Seul(e)"] },
          { value: "MARIE", label: "Mari\xE9(e)", synonyms: ["Mari\xE9", "Mari\xE9e"] },
          { value: "PACSE", label: "Pacs\xE9(e)", synonyms: ["PACS", "Pacs\xE9"] },
          { value: "CONCUBINAGE", label: "Concubinage", synonyms: ["Union libre", "Vie maritale"] },
          { value: "DIVORCE", label: "Divorc\xE9(e)", synonyms: ["Divorc\xE9", "Divorc\xE9e"] },
          { value: "SEPARE", label: "S\xE9par\xE9(e)", synonyms: ["S\xE9par\xE9", "S\xE9par\xE9e"] },
          { value: "VEUF", label: "Veuf(ve)", synonyms: ["Veuf", "Veuve"] }
        ],
        example: "MARIE"
      },
      {
        key: "client.socialSecurityNumber",
        section: "identity",
        label: "Num\xE9ro de s\xE9curit\xE9 sociale",
        type: "texte",
        synonyms: ["N\xB0 de s\xE9curit\xE9 sociale", "NIR", "Num\xE9ro d'assur\xE9 social", "N\xB0 INSEE"],
        formats: ["X XX XX XX XXX XXX XX", "XXXXXXXXXXXXXXX"],
        note: "15 chiffres, cl\xE9 comprise. Certains extranets ne demandent que les 13 premiers.",
        example: "1 85 03 69 123 456 78"
      },
      {
        key: "client.addressStreet",
        section: "contact",
        label: "Adresse",
        type: "texte",
        synonyms: ["Adresse postale", "N\xB0 et libell\xE9 de la voie", "Rue", "Adresse du domicile"],
        example: "12 rue des Lilas"
      },
      {
        key: "client.addressComplement",
        section: "contact",
        label: "Compl\xE9ment d'adresse",
        type: "texte",
        synonyms: ["B\xE2timent, escalier, \xE9tage", "Lieu-dit", "Compl\xE9ment"],
        example: "B\xE2timent B"
      },
      {
        key: "client.postalCode",
        section: "contact",
        label: "Code postal",
        type: "codePostal",
        synonyms: ["CP", "Code postal du domicile"],
        example: "69003"
      },
      {
        key: "client.city",
        section: "contact",
        label: "Ville",
        type: "texte",
        synonyms: ["Commune", "Localit\xE9", "Ville de r\xE9sidence"],
        example: "Lyon"
      },
      {
        key: "client.country",
        section: "contact",
        label: "Pays",
        type: "texte",
        synonyms: ["Pays de r\xE9sidence"],
        example: "France"
      },
      {
        key: "client.mobilePhone",
        section: "contact",
        label: "T\xE9l\xE9phone mobile",
        type: "telephone",
        synonyms: ["Portable", "Mobile", "N\xB0 de portable", "T\xE9l. mobile"],
        example: "0612345678"
      },
      {
        key: "client.landlinePhone",
        section: "contact",
        label: "T\xE9l\xE9phone fixe",
        type: "telephone",
        synonyms: ["Fixe", "T\xE9l. domicile", "N\xB0 de t\xE9l\xE9phone fixe"],
        example: "0478123456"
      },
      {
        key: "client.email",
        section: "contact",
        label: "Adresse e-mail",
        type: "email",
        synonyms: ["E-mail", "Courriel", "Mail", "Adresse \xE9lectronique"],
        example: "jean.dupont@exemple.fr"
      },
      {
        key: "spouse.lastName",
        section: "household",
        label: "Nom du conjoint",
        type: "texte",
        synonyms: ["Nom du conjoint ou concubin"],
        example: "DUPONT"
      },
      {
        key: "spouse.firstName",
        section: "household",
        label: "Pr\xE9nom du conjoint",
        type: "texte",
        synonyms: ["Pr\xE9nom du conjoint ou concubin"],
        example: "Claire"
      },
      {
        key: "spouse.birthDate",
        section: "household",
        label: "Date de naissance du conjoint",
        type: "date",
        synonyms: ["Conjoint n\xE9(e) le", "Conjoint n\xE9 le", "Naissance du conjoint"],
        example: "22/11/1987"
      },
      {
        key: "child1.birthDate",
        section: "household",
        label: "Date de naissance du 1er enfant",
        type: "date",
        synonyms: ["Enfant 1 - date de naissance", "Premier enfant n\xE9(e) le"],
        note: "Emplacement fixe : la phase 1 couvre trois enfants au maximum.",
        example: "14/06/2012"
      },
      {
        key: "child2.birthDate",
        section: "household",
        label: "Date de naissance du 2e enfant",
        type: "date",
        synonyms: ["Enfant 2 - date de naissance", "Deuxi\xE8me enfant n\xE9(e) le"],
        example: "03/09/2015"
      },
      {
        key: "child3.birthDate",
        section: "household",
        label: "Date de naissance du 3e enfant",
        type: "date",
        synonyms: ["Enfant 3 - date de naissance", "Troisi\xE8me enfant n\xE9(e) le"],
        example: "27/01/2019"
      },
      {
        key: "household.childCount",
        section: "household",
        label: "Nombre d'enfants",
        type: "entier",
        unit: "PERSONNES",
        synonyms: ["Nb d'enfants", "Enfants \xE0 charge", "Nombre d'enfants \xE0 charge"],
        example: "2"
      },
      {
        key: "household.memberCount",
        section: "household",
        label: "Nombre de personnes au foyer",
        type: "entier",
        unit: "PERSONNES",
        synonyms: ["Composition du foyer", "Nb de personnes au foyer", "Nombre d'occupants"],
        derived: {
          from: ["client.maritalStatus", "household.childCount"],
          computation: "tailleDuFoyer",
          formula: "1 + 1 si client.maritalStatus vaut MARIE, PACSE ou CONCUBINAGE + household.childCount"
        },
        example: "4"
      },
      {
        key: "driver.licenseIssueDate",
        section: "driver",
        label: "Date d'obtention du permis",
        type: "date",
        synonyms: ["Permis obtenu le", "Date du permis de conduire", "Date de d\xE9livrance du permis"],
        example: "12/09/2003"
      },
      {
        key: "driver.licenseSeniority",
        section: "driver",
        label: "Anciennet\xE9 de permis",
        type: "entier",
        unit: "ANNEES",
        synonyms: ["Nombre d'ann\xE9es de permis", "Anciennet\xE9 du permis de conduire"],
        derived: {
          from: ["driver.licenseIssueDate"],
          computation: "anneesDepuis",
          formula: "ann\xE9es r\xE9volues entre driver.licenseIssueDate et la date du jour"
        },
        example: "22"
      },
      {
        key: "driver.licenseType",
        section: "driver",
        label: "Type de permis",
        type: "enum",
        synonyms: ["Cat\xE9gorie de permis", "Permis d\xE9tenu"],
        values: [
          { value: "B", label: "Permis B", synonyms: ["B - voiture", "V\xE9hicules l\xE9gers"] },
          { value: "A", label: "Permis A", synonyms: ["A - moto", "Moto toutes cylindr\xE9es"] },
          { value: "A1", label: "Permis A1", synonyms: ["A1 - 125 cm\xB3"] },
          { value: "A2", label: "Permis A2", synonyms: ["A2 - moto brid\xE9e"] },
          { value: "AM", label: "Permis AM", synonyms: ["AM - cyclomoteur", "BSR"] },
          { value: "BE", label: "Permis BE", synonyms: ["BE - remorque"] },
          { value: "C", label: "Permis C", synonyms: ["C - poids lourd"] },
          { value: "D", label: "Permis D", synonyms: ["D - transport en commun"] }
        ],
        example: "B"
      },
      {
        key: "driver.trainingType",
        section: "driver",
        label: "Mode d'apprentissage",
        type: "enum",
        synonyms: ["Type d'apprentissage", "Apprentissage de la conduite"],
        values: [
          { value: "CLASSIQUE", label: "Apprentissage classique", synonyms: ["Fili\xE8re classique"] },
          { value: "CONDUITE_ACCOMPAGNEE", label: "Conduite accompagn\xE9e", synonyms: ["AAC", "Apprentissage anticip\xE9"] },
          { value: "CONDUITE_SUPERVISEE", label: "Conduite supervis\xE9e", synonyms: ["Supervis\xE9e"] }
        ],
        example: "CLASSIQUE"
      },
      {
        key: "driver.bonusMalus",
        section: "driver",
        label: "Coefficient bonus-malus",
        type: "decimal",
        synonyms: ["Bonus-malus", "CRM", "Coefficient de r\xE9duction-majoration", "Bonus"],
        formats: ["1234,56", "1234.56"],
        note: "Entre 0,50 et 3,50. Jamais de s\xE9parateur de milliers.",
        example: "0,85"
      },
      {
        key: "driver.insuranceSeniority",
        section: "driver",
        label: "Anciennet\xE9 d'assurance",
        type: "entier",
        unit: "ANNEES",
        synonyms: ["Nombre d'ann\xE9es d'assurance", "Anciennet\xE9 comme assur\xE9", "Ann\xE9es d'assurance sans interruption"],
        example: "12"
      },
      {
        key: "driver.claimCount",
        section: "driver",
        label: "Nombre de sinistres",
        type: "entier",
        synonyms: ["Nb de sinistres", "Sinistres sur 36 mois", "Nombre de sinistres sur 5 ans"],
        example: "1"
      },
      {
        key: "driver.claimResponsibility",
        section: "driver",
        label: "Responsabilit\xE9 du dernier sinistre",
        type: "enum",
        synonyms: ["Part de responsabilit\xE9", "Sinistre responsable ou non"],
        values: [
          { value: "RESPONSABLE", label: "Responsable", synonyms: ["Totalement responsable", "100 % responsable"] },
          { value: "PARTIELLEMENT_RESPONSABLE", label: "Partiellement responsable", synonyms: ["50 % responsable", "Responsabilit\xE9 partag\xE9e"] },
          { value: "NON_RESPONSABLE", label: "Non responsable", synonyms: ["Sans responsabilit\xE9"] },
          { value: "AUCUN_SINISTRE", label: "Aucun sinistre", synonyms: ["Pas de sinistre"] }
        ],
        example: "NON_RESPONSABLE"
      },
      {
        key: "driver.terminationByInsurer",
        section: "driver",
        label: "R\xE9siliation par l'assureur",
        type: "booleen",
        synonyms: ["R\xE9sili\xE9 par l'assureur", "Ant\xE9c\xE9dent de r\xE9siliation", "Avez-vous \xE9t\xE9 r\xE9sili\xE9"],
        example: "Non"
      },
      {
        key: "driver.terminationReason",
        section: "driver",
        label: "Motif de r\xE9siliation",
        type: "enum",
        synonyms: ["Cause de la r\xE9siliation", "Raison de la r\xE9siliation"],
        values: [
          { value: "SANS_OBJET", label: "Sans objet", synonyms: ["Jamais r\xE9sili\xE9"] },
          { value: "NON_PAIEMENT", label: "Non-paiement de la prime", synonyms: ["D\xE9faut de paiement"] },
          { value: "SINISTRES", label: "Sinistres trop nombreux", synonyms: ["Fr\xE9quence de sinistres"] },
          { value: "FAUSSE_DECLARATION", label: "Fausse d\xE9claration", synonyms: ["D\xE9claration inexacte"] },
          { value: "ALCOOLEMIE", label: "Alcool\xE9mie ou stup\xE9fiants", synonyms: ["Conduite en \xE9tat d'ivresse"] },
          { value: "SUSPENSION_PERMIS", label: "Suspension du permis", synonyms: ["Permis suspendu"] },
          { value: "AUTRE", label: "Autre motif", synonyms: ["Autre cause"] }
        ],
        example: "SANS_OBJET"
      },
      {
        key: "driver.licenseSuspension",
        section: "driver",
        label: "Suspension de permis",
        type: "booleen",
        synonyms: ["Retrait de permis", "Annulation de permis", "Suspension ou annulation du permis"],
        example: "Non"
      },
      {
        key: "vehicle.registration",
        section: "vehicle",
        label: "Immatriculation",
        type: "immatriculation",
        synonyms: ["Plaque d'immatriculation", "N\xB0 d'immatriculation", "Num\xE9ro min\xE9ralogique"],
        example: "AB-123-CD"
      },
      {
        key: "vehicle.brand",
        section: "vehicle",
        label: "Marque",
        type: "texte",
        synonyms: ["Marque du v\xE9hicule", "Constructeur"],
        example: "RENAULT"
      },
      {
        key: "vehicle.model",
        section: "vehicle",
        label: "Mod\xE8le",
        type: "texte",
        synonyms: ["Mod\xE8le du v\xE9hicule", "Type de v\xE9hicule"],
        example: "Clio V"
      },
      {
        key: "vehicle.firstRegistrationDate",
        section: "vehicle",
        label: "Date de premi\xE8re mise en circulation",
        type: "date",
        synonyms: ["1\xE8re mise en circulation", "Mise en circulation", "Date de MEC"],
        example: "18/04/2019"
      },
      {
        key: "vehicle.age",
        section: "vehicle",
        label: "\xC2ge du v\xE9hicule",
        type: "entier",
        unit: "ANNEES",
        synonyms: ["Anciennet\xE9 du v\xE9hicule", "Nombre d'ann\xE9es du v\xE9hicule"],
        derived: {
          from: ["vehicle.firstRegistrationDate"],
          computation: "anneesDepuis",
          formula: "ann\xE9es r\xE9volues entre vehicle.firstRegistrationDate et la date du jour"
        },
        example: "6"
      },
      {
        key: "vehicle.value",
        section: "vehicle",
        label: "Valeur du v\xE9hicule",
        type: "decimal",
        unit: "EUR",
        synonyms: ["Valeur \xE0 neuf", "Prix d'achat du v\xE9hicule", "Valeur v\xE9nale"],
        example: "12500,00"
      },
      {
        key: "vehicle.fuel",
        section: "vehicle",
        label: "\xC9nergie",
        type: "enum",
        synonyms: ["Carburant", "Type de carburant", "\xC9nergie du v\xE9hicule"],
        values: [
          { value: "ESSENCE", label: "Essence", synonyms: ["Sans plomb", "SP95"] },
          { value: "DIESEL", label: "Diesel", synonyms: ["Gazole", "Gasoil"] },
          { value: "ELECTRIQUE", label: "\xC9lectrique", synonyms: ["100 % \xE9lectrique"] },
          { value: "HYBRIDE", label: "Hybride", synonyms: ["Hybride non rechargeable"] },
          { value: "HYBRIDE_RECHARGEABLE", label: "Hybride rechargeable", synonyms: ["Hybride plug-in"] },
          { value: "GPL", label: "GPL", synonyms: ["Gaz de p\xE9trole liqu\xE9fi\xE9", "Bicarburation"] }
        ],
        example: "ESSENCE"
      },
      {
        key: "vehicle.fiscalPower",
        section: "vehicle",
        label: "Puissance fiscale",
        type: "entier",
        unit: "CV",
        synonyms: ["Puissance en CV", "CV fiscaux", "Chevaux fiscaux"],
        example: "5"
      },
      {
        key: "vehicle.usage",
        section: "vehicle",
        label: "Usage du v\xE9hicule",
        type: "enum",
        synonyms: ["Type d'usage", "Utilisation du v\xE9hicule"],
        values: [
          { value: "PRIVE", label: "Priv\xE9", synonyms: ["Usage personnel", "Promenade"] },
          { value: "PRIVE_TRAJET_TRAVAIL", label: "Priv\xE9 et trajet domicile-travail", synonyms: ["Trajet travail", "Promenade et travail"] },
          { value: "PROFESSIONNEL", label: "Professionnel", synonyms: ["Usage professionnel", "Affaires"] },
          { value: "TOUS_DEPLACEMENTS", label: "Tous d\xE9placements", synonyms: ["Tourn\xE9es", "Usage intensif"] }
        ],
        example: "PRIVE_TRAJET_TRAVAIL"
      },
      {
        key: "vehicle.annualMileage",
        section: "vehicle",
        label: "Kilom\xE9trage annuel",
        type: "entier",
        unit: "KM",
        synonyms: ["Km parcourus par an", "Nombre de kilom\xE8tres par an", "Kilom\xE9trage par an"],
        example: "12000"
      },
      {
        key: "vehicle.parking",
        section: "vehicle",
        label: "Lieu de stationnement",
        type: "enum",
        synonyms: ["Stationnement du v\xE9hicule", "Type de garage", "O\xF9 stationne le v\xE9hicule"],
        values: [
          { value: "GARAGE_FERME", label: "Garage ferm\xE9", synonyms: ["Box ferm\xE9", "Garage individuel"] },
          { value: "PARKING_COLLECTIF", label: "Parking collectif", synonyms: ["Parking souterrain", "Parking r\xE9sidentiel"] },
          { value: "TERRAIN_PRIVE", label: "Terrain priv\xE9", synonyms: ["Cour", "Jardin clos"] },
          { value: "VOIE_PUBLIQUE", label: "Voie publique", synonyms: ["Rue", "Stationnement dans la rue"] }
        ],
        example: "GARAGE_FERME"
      },
      {
        key: "home.occupancyStatus",
        section: "home",
        label: "Qualit\xE9 d'occupant",
        type: "enum",
        synonyms: ["Statut d'occupation", "Occupant du logement"],
        values: [
          { value: "PROPRIETAIRE_OCCUPANT", label: "Propri\xE9taire occupant", synonyms: ["Propri\xE9taire"] },
          { value: "PROPRIETAIRE_NON_OCCUPANT", label: "Propri\xE9taire non occupant", synonyms: ["PNO", "Propri\xE9taire bailleur"] },
          { value: "LOCATAIRE", label: "Locataire", synonyms: ["En location"] },
          { value: "COLOCATAIRE", label: "Colocataire", synonyms: ["En colocation"] },
          { value: "HEBERGE_GRATUIT", label: "H\xE9berg\xE9 \xE0 titre gratuit", synonyms: ["Occupant \xE0 titre gratuit"] }
        ],
        example: "LOCATAIRE"
      },
      {
        key: "home.propertyType",
        section: "home",
        label: "Type de logement",
        type: "enum",
        synonyms: ["Nature du bien", "Type d'habitation"],
        values: [
          { value: "MAISON", label: "Maison", synonyms: ["Maison individuelle", "Pavillon"] },
          { value: "APPARTEMENT", label: "Appartement", synonyms: ["Appart"] },
          { value: "STUDIO", label: "Studio", synonyms: ["Studette"] },
          { value: "AUTRE", label: "Autre", synonyms: ["Autre type de bien"] }
        ],
        example: "APPARTEMENT"
      },
      {
        key: "home.residenceType",
        section: "home",
        label: "Type de r\xE9sidence",
        type: "enum",
        synonyms: ["Usage du logement", "R\xE9sidence principale ou secondaire"],
        values: [
          { value: "PRINCIPALE", label: "R\xE9sidence principale", synonyms: ["Principale"] },
          { value: "SECONDAIRE", label: "R\xE9sidence secondaire", synonyms: ["Secondaire"] },
          { value: "LOCATION_SAISONNIERE", label: "Location saisonni\xE8re", synonyms: ["Meubl\xE9 de tourisme"] },
          { value: "INOCCUPE", label: "Logement inoccup\xE9", synonyms: ["Vacant"] }
        ],
        example: "PRINCIPALE"
      },
      {
        key: "home.roomCount",
        section: "home",
        label: "Nombre de pi\xE8ces",
        type: "entier",
        synonyms: ["Nb de pi\xE8ces", "Pi\xE8ces principales", "Nombre de pi\xE8ces principales"],
        example: "3"
      },
      {
        key: "home.surface",
        section: "home",
        label: "Surface habitable",
        type: "decimal",
        unit: "M2",
        synonyms: ["Superficie", "Surface en m\xB2", "Surface du logement"],
        example: "68,50"
      },
      {
        key: "home.constructionYear",
        section: "home",
        label: "Ann\xE9e de construction",
        type: "entier",
        synonyms: ["Ann\xE9e de construction du b\xE2timent", "Date de construction"],
        example: "1965"
      },
      {
        key: "home.hasAlarm",
        section: "home",
        label: "Alarme",
        type: "booleen",
        synonyms: ["Syst\xE8me d'alarme", "Pr\xE9sence d'une alarme", "Protection anti-intrusion"],
        example: "Oui"
      },
      {
        key: "home.hasSwimmingPool",
        section: "home",
        label: "Piscine",
        type: "booleen",
        synonyms: ["Pr\xE9sence d'une piscine", "Piscine enterr\xE9e"],
        example: "Non"
      },
      {
        key: "home.claimCount",
        section: "home",
        label: "Nombre de sinistres habitation",
        type: "entier",
        synonyms: ["Sinistres habitation sur 36 mois", "Nb de sinistres sur le logement"],
        example: "0"
      },
      {
        key: "health.scheme",
        section: "health",
        label: "R\xE9gime social",
        type: "enum",
        synonyms: ["R\xE9gime obligatoire", "R\xE9gime d'assurance maladie", "Caisse d'affiliation"],
        values: [
          { value: "GENERAL", label: "R\xE9gime g\xE9n\xE9ral", synonyms: ["Salari\xE9", "CPAM"] },
          { value: "AGRICOLE", label: "R\xE9gime agricole", synonyms: ["MSA", "Exploitant agricole"] },
          { value: "INDEPENDANT", label: "Travailleur ind\xE9pendant", synonyms: ["TNS", "Ex-RSI"] },
          { value: "ALSACE_MOSELLE", label: "R\xE9gime Alsace-Moselle", synonyms: ["R\xE9gime local"] },
          { value: "FONCTIONNAIRE", label: "Fonctionnaire", synonyms: ["Fonction publique"] },
          { value: "ETUDIANT", label: "\xC9tudiant", synonyms: ["R\xE9gime \xE9tudiant"] },
          { value: "AUTRE", label: "Autre r\xE9gime", synonyms: ["R\xE9gime sp\xE9cial"] }
        ],
        example: "GENERAL"
      },
      {
        key: "health.currentInsurer",
        section: "health",
        label: "Mutuelle actuelle",
        type: "texte",
        synonyms: ["Compl\xE9mentaire sant\xE9 actuelle", "Organisme compl\xE9mentaire actuel"],
        example: "Mutuelle Exemple"
      },
      {
        key: "health.coverageLevel",
        section: "health",
        label: "Niveau de garantie",
        type: "enum",
        synonyms: ["Niveau de couverture", "Formule sant\xE9 souhait\xE9e"],
        values: [
          { value: "MINIMUM", label: "Minimum", synonyms: ["Essentiel"] },
          { value: "ECONOMIQUE", label: "\xC9conomique", synonyms: ["\xC9co"] },
          { value: "EQUILIBRE", label: "\xC9quilibr\xE9", synonyms: ["Interm\xE9diaire sant\xE9"] },
          { value: "CONFORT", label: "Confort", synonyms: ["Renforc\xE9"] },
          { value: "MAXIMUM", label: "Maximum", synonyms: ["Premium", "Optimal"] }
        ],
        example: "EQUILIBRE"
      },
      {
        key: "health.beneficiaryClause",
        section: "health",
        label: "Clause b\xE9n\xE9ficiaire",
        type: "texte",
        synonyms: ["B\xE9n\xE9ficiaires en cas de d\xE9c\xE8s", "D\xE9signation des b\xE9n\xE9ficiaires"],
        note: "Texte libre : les b\xE9n\xE9ficiaires ne sont presque jamais saisis champ par champ.",
        example: "Mon conjoint, \xE0 d\xE9faut mes enfants n\xE9s ou \xE0 na\xEEtre, \xE0 d\xE9faut mes h\xE9ritiers"
      },
      {
        key: "health.smoker",
        section: "health",
        label: "Fumeur",
        type: "booleen",
        synonyms: ["Statut tabagique", "Fumeur ou non-fumeur", "Consommation de tabac"],
        example: "Non"
      },
      {
        key: "health.height",
        section: "health",
        label: "Taille",
        type: "entier",
        unit: "CM",
        synonyms: ["Taille en cm", "Taille de l'assur\xE9"],
        example: "178"
      },
      {
        key: "health.weight",
        section: "health",
        label: "Poids",
        type: "entier",
        unit: "KG",
        synonyms: ["Poids en kg", "Poids de l'assur\xE9"],
        example: "74"
      },
      {
        key: "loan.amount",
        section: "loan",
        label: "Montant du pr\xEAt",
        type: "decimal",
        unit: "EUR",
        synonyms: ["Capital emprunt\xE9", "Montant emprunt\xE9", "Montant du cr\xE9dit"],
        example: "180000,00"
      },
      {
        key: "loan.duration",
        section: "loan",
        label: "Dur\xE9e du pr\xEAt",
        type: "entier",
        unit: "MOIS",
        synonyms: ["Dur\xE9e du cr\xE9dit", "Dur\xE9e de remboursement", "Dur\xE9e en mois"],
        note: "Toujours en mois c\xF4t\xE9 ontologie. Les extranets qui affichent des ann\xE9es sont convertis \xE0 l'\xE9criture.",
        example: "240"
      },
      {
        key: "loan.type",
        section: "loan",
        label: "Type de pr\xEAt",
        type: "enum",
        synonyms: ["Nature du pr\xEAt", "Objet du financement"],
        values: [
          { value: "IMMOBILIER_RESIDENCE_PRINCIPALE", label: "Immobilier - r\xE9sidence principale", synonyms: ["Achat r\xE9sidence principale"] },
          { value: "IMMOBILIER_RESIDENCE_SECONDAIRE", label: "Immobilier - r\xE9sidence secondaire", synonyms: ["Achat r\xE9sidence secondaire"] },
          { value: "IMMOBILIER_LOCATIF", label: "Immobilier locatif", synonyms: ["Investissement locatif"] },
          { value: "TRAVAUX", label: "Travaux", synonyms: ["Pr\xEAt travaux"] },
          { value: "CONSOMMATION", label: "Consommation", synonyms: ["Cr\xE9dit \xE0 la consommation"] },
          { value: "PROFESSIONNEL", label: "Professionnel", synonyms: ["Pr\xEAt professionnel"] }
        ],
        example: "IMMOBILIER_RESIDENCE_PRINCIPALE"
      },
      {
        key: "loan.startDate",
        section: "loan",
        label: "Date de d\xE9but du pr\xEAt",
        type: "date",
        synonyms: ["Date de d\xE9blocage des fonds", "Date de premi\xE8re \xE9ch\xE9ance", "Pr\xEAt d\xE9butant le"],
        example: "01/06/2021"
      },
      {
        key: "loan.endDate",
        section: "loan",
        label: "Date de fin du pr\xEAt",
        type: "date",
        synonyms: ["Terme du pr\xEAt", "\xC9ch\xE9ance finale du pr\xEAt"],
        derived: {
          from: ["loan.startDate", "loan.duration"],
          computation: "finDePret",
          formula: "loan.startDate d\xE9cal\xE9e de loan.duration mois"
        },
        example: "01/06/2041"
      },
      {
        key: "loan.coveragePercent",
        section: "loan",
        label: "Quotit\xE9 assur\xE9e",
        type: "decimal",
        unit: "POURCENT",
        synonyms: ["Quotit\xE9", "Pourcentage de couverture", "Quotit\xE9 d'assurance"],
        example: "100,00"
      },
      {
        key: "loan.coBorrowerBirthDate",
        section: "loan",
        label: "Date de naissance du co-emprunteur",
        type: "date",
        synonyms: ["Co-emprunteur n\xE9(e) le", "Co-emprunteur n\xE9 le", "Naissance du co-emprunteur"],
        example: "05/02/1988"
      },
      {
        key: "loan.coBorrowerCoveragePercent",
        section: "loan",
        label: "Quotit\xE9 du co-emprunteur",
        type: "decimal",
        unit: "POURCENT",
        synonyms: ["Quotit\xE9 assur\xE9e du co-emprunteur"],
        example: "50,00"
      },
      {
        key: "business.name",
        section: "business",
        label: "Raison sociale",
        type: "texte",
        synonyms: ["D\xE9nomination sociale", "Nom de l'entreprise", "Nom commercial"],
        example: "MENUISERIE EXEMPLE"
      },
      {
        key: "business.legalForm",
        section: "business",
        label: "Forme juridique",
        type: "enum",
        synonyms: ["Statut juridique", "Type de soci\xE9t\xE9"],
        values: [
          { value: "EI", label: "Entreprise individuelle", synonyms: ["EI"] },
          { value: "AUTO_ENTREPRENEUR", label: "Auto-entrepreneur", synonyms: ["Micro-entreprise", "Micro-entrepreneur"] },
          { value: "EURL", label: "EURL", synonyms: ["Entreprise unipersonnelle \xE0 responsabilit\xE9 limit\xE9e"] },
          { value: "SARL", label: "SARL", synonyms: ["Soci\xE9t\xE9 \xE0 responsabilit\xE9 limit\xE9e"] },
          { value: "SAS", label: "SAS", synonyms: ["Soci\xE9t\xE9 par actions simplifi\xE9e"] },
          { value: "SASU", label: "SASU", synonyms: ["SAS unipersonnelle"] },
          { value: "SA", label: "SA", synonyms: ["Soci\xE9t\xE9 anonyme"] },
          { value: "SCI", label: "SCI", synonyms: ["Soci\xE9t\xE9 civile immobili\xE8re"] },
          { value: "SNC", label: "SNC", synonyms: ["Soci\xE9t\xE9 en nom collectif"] },
          { value: "ASSOCIATION", label: "Association", synonyms: ["Association loi 1901"] },
          { value: "AUTRE", label: "Autre forme juridique", synonyms: ["Autre statut"] }
        ],
        example: "SARL"
      },
      {
        key: "business.siret",
        section: "business",
        label: "SIRET",
        type: "texte",
        synonyms: ["N\xB0 SIRET", "Num\xE9ro SIRET", "N\xB0 d'\xE9tablissement"],
        formats: ["XXX XXX XXX XXXXX", "XXXXXXXXXXXXXX"],
        example: "812 345 678 00023"
      },
      {
        key: "business.siren",
        section: "business",
        label: "SIREN",
        type: "texte",
        synonyms: ["N\xB0 SIREN", "Num\xE9ro SIREN"],
        formats: ["XXX XXX XXX", "XXXXXXXXX"],
        derived: {
          from: ["business.siret"],
          computation: "sirenDepuisSiret",
          formula: "les 9 premiers chiffres de business.siret"
        },
        example: "812345678"
      },
      {
        key: "business.nafCode",
        section: "business",
        label: "Code NAF",
        type: "texte",
        synonyms: ["Code APE", "NAF / APE", "Activit\xE9 principale exerc\xE9e"],
        formats: ["XXXXX"],
        example: "4332A"
      },
      {
        key: "business.activity",
        section: "business",
        label: "Activit\xE9 de l'entreprise",
        type: "texte",
        synonyms: ["Nature de l'activit\xE9", "Description de l'activit\xE9", "Activit\xE9 exerc\xE9e"],
        example: "Pose de menuiseries int\xE9rieures"
      },
      {
        key: "business.creationDate",
        section: "business",
        label: "Date de cr\xE9ation de l'entreprise",
        type: "date",
        synonyms: ["Date d'immatriculation", "Entreprise cr\xE9\xE9e le"],
        example: "03/02/2016"
      },
      {
        key: "business.revenue",
        section: "business",
        label: "Chiffre d'affaires",
        type: "decimal",
        unit: "EUR",
        synonyms: ["CA annuel", "Chiffre d'affaires annuel", "CA HT"],
        example: "320000,00"
      },
      {
        key: "business.employeeCount",
        section: "business",
        label: "Effectif",
        type: "entier",
        unit: "PERSONNES",
        synonyms: ["Nombre de salari\xE9s", "Effectif salari\xE9", "Nb d'employ\xE9s"],
        example: "4"
      },
      {
        key: "business.premisesSurface",
        section: "business",
        label: "Surface des locaux",
        type: "decimal",
        unit: "M2",
        synonyms: ["Superficie des locaux", "Surface professionnelle"],
        example: "210,00"
      },
      {
        key: "business.premisesStatus",
        section: "business",
        label: "Statut d'occupation des locaux",
        type: "enum",
        synonyms: ["Occupation des locaux", "Qualit\xE9 d'occupant des locaux"],
        values: [
          { value: "PROPRIETAIRE", label: "Propri\xE9taire des locaux", synonyms: ["Locaux en propri\xE9t\xE9"] },
          { value: "LOCATAIRE", label: "Locataire des locaux", synonyms: ["Locaux lou\xE9s", "Bail commercial"] },
          { value: "COPROPRIETAIRE", label: "Copropri\xE9taire", synonyms: ["Locaux en copropri\xE9t\xE9"] },
          { value: "OCCUPANT_A_TITRE_GRATUIT", label: "Occupant \xE0 titre gratuit", synonyms: ["Mise \xE0 disposition gratuite"] }
        ],
        example: "LOCATAIRE"
      },
      {
        key: "contract.effectiveDate",
        section: "contract",
        label: "Date d'effet",
        type: "date",
        synonyms: ["Date de prise d'effet", "Date de d\xE9but des garanties", "Effet au", "Date d'effet souhait\xE9e"],
        example: "01/09/2025"
      },
      {
        key: "contract.paymentFrequency",
        section: "contract",
        label: "P\xE9riodicit\xE9 de paiement",
        type: "enum",
        synonyms: ["Fractionnement", "P\xE9riodicit\xE9", "Fractionnement de la cotisation"],
        values: [
          { value: "MENSUELLE", label: "Mensuelle", synonyms: ["Par mois", "Mensuel"] },
          { value: "TRIMESTRIELLE", label: "Trimestrielle", synonyms: ["Par trimestre", "Trimestriel"] },
          { value: "SEMESTRIELLE", label: "Semestrielle", synonyms: ["Par semestre", "Semestriel"] },
          { value: "ANNUELLE", label: "Annuelle", synonyms: ["Par an", "Annuel"] }
        ],
        example: "MENSUELLE"
      },
      {
        key: "contract.paymentMethod",
        section: "contract",
        label: "Mode de paiement",
        type: "enum",
        synonyms: ["Moyen de paiement", "Mode de r\xE8glement", "Mode de r\xE8glement des cotisations"],
        values: [
          { value: "PRELEVEMENT", label: "Pr\xE9l\xE8vement automatique", synonyms: ["Pr\xE9l\xE8vement", "SEPA"] },
          { value: "VIREMENT", label: "Virement", synonyms: ["Virement bancaire"] },
          { value: "CARTE_BANCAIRE", label: "Carte bancaire", synonyms: ["CB"] },
          { value: "CHEQUE", label: "Ch\xE8que", synonyms: ["Par ch\xE8que"] }
        ],
        example: "PRELEVEMENT"
      },
      {
        key: "contract.iban",
        section: "contract",
        label: "IBAN",
        type: "iban",
        synonyms: ["N\xB0 IBAN", "Coordonn\xE9es bancaires", "RIB"],
        example: "FR7630006000011234567890189"
      },
      {
        key: "contract.deductible",
        section: "contract",
        label: "Franchise",
        type: "decimal",
        unit: "EUR",
        synonyms: ["Montant de la franchise", "Franchise en euros"],
        example: "150,00"
      },
      {
        key: "contract.coverageFormula",
        section: "contract",
        label: "Formule de garantie",
        type: "enum",
        synonyms: ["Formule choisie", "Type de garanties", "Formule du contrat"],
        values: [
          { value: "TIERS", label: "Tiers", synonyms: ["Responsabilit\xE9 civile", "Au tiers"] },
          { value: "TIERS_ETENDU", label: "Tiers \xE9tendu", synonyms: ["Tiers plus", "Tiers confort"] },
          { value: "TOUS_RISQUES", label: "Tous risques", synonyms: ["Toutes garanties"] },
          { value: "BASIQUE", label: "Formule basique", synonyms: ["Formule de base"] },
          { value: "INTERMEDIAIRE", label: "Formule m\xE9diane", synonyms: ["Formule interm\xE9diaire"] },
          { value: "COMPLETE", label: "Formule compl\xE8te", synonyms: ["Formule int\xE9grale"] }
        ],
        example: "TOUS_RISQUES"
      },
      {
        key: "contract.previousInsurer",
        section: "contract",
        label: "Assureur actuel",
        type: "texte",
        synonyms: ["Compagnie actuelle", "Assureur pr\xE9c\xE9dent", "Nom de l'assureur actuel"],
        example: "Assureur Exemple"
      },
      {
        key: "contract.previousContractEndDate",
        section: "contract",
        label: "Date d'\xE9ch\xE9ance du contrat actuel",
        type: "date",
        synonyms: ["\xC9ch\xE9ance principale", "Date de fin du contrat actuel"],
        example: "31/12/2025"
      },
      {
        key: "contract.premiumAmount",
        section: "contract",
        label: "Montant de la cotisation",
        type: "decimal",
        unit: "EUR",
        synonyms: ["Prime annuelle", "Cotisation annuelle", "Montant de la prime"],
        example: "540,00"
      }
    ]
  };

  // src/core/texte/normaliser.ts
  var LONGUEUR_LIBELLE = 120;
  function normaliser(texte2) {
    return (texte2 ?? "").replace(/\s+/g, " ").trim().slice(0, LONGUEUR_LIBELLE);
  }
  function normaliserLibelle(texte2) {
    return normaliser(texte2).toLowerCase().normalize("NFD").replace(new RegExp("\\p{Mn}", "gu"), "").replace(/[^a-z0-9]+/g, " ").trim();
  }

  // src/core/ontology/ontologie.ts
  var TYPES_CANONIQUES = [
    "texte",
    "date",
    "entier",
    "decimal",
    "booleen",
    "enum",
    "telephone",
    "email",
    "codePostal",
    "iban",
    "immatriculation"
  ];
  var UNITES = [
    "EUR",
    "POURCENT",
    "ANNEES",
    "MOIS",
    "KM",
    "M2",
    "CM",
    "KG",
    "CV",
    "PERSONNES"
  ];
  var TYPES_AVEC_UNITE = ["entier", "decimal"];

  // src/core/ontology/valider.ts
  var MOTIF_VERSION = /^\d+\.\d+\.\d+$/;
  var MOTIF_CLE = /^[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)+$/;
  var MOTIF_PREFIXE = /^[a-z][a-zA-Z0-9]*\.$/;
  var MOTIF_VALEUR_ENUM = /^[A-Z][A-Z0-9_]*$/;
  var MOTIF_CALCUL = /^[a-z][a-zA-Z0-9]*$/;
  var MOTIF_IDENTIFIANT = /^[a-z][a-zA-Z0-9]*$/;
  var MOTIF_EXEMPLE = {
    texte: /\S/,
    date: /^\d{2}\/\d{2}\/\d{4}$/,
    entier: /^-?\d+$/,
    decimal: /^-?\d+(?:,\d+)?$/,
    booleen: /^(?:Oui|Non)$/,
    enum: MOTIF_VALEUR_ENUM,
    telephone: /^0\d{9}$/,
    email: /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/,
    codePostal: /^(?:\d{5}|2[AB]\d{3})$/,
    iban: /^FR\d{2}[0-9A-Z]{23}$/,
    immatriculation: /^[A-Z]{2}-\d{3}-[A-Z]{2}$/
  };
  var CLES_CHAMP = /* @__PURE__ */ new Set([
    "key",
    "section",
    "label",
    "type",
    "synonyms",
    "example",
    "values",
    "derived",
    "unit",
    "formats",
    "note"
  ]);
  var CLES_SECTION = /* @__PURE__ */ new Set(["id", "label", "prefixes"]);
  var CLES_VALEUR = /* @__PURE__ */ new Set(["value", "label", "synonyms"]);
  var CLES_DERIVE = /* @__PURE__ */ new Set(["from", "computation", "formula"]);
  var CLES_RACINE = /* @__PURE__ */ new Set(["version", "types", "sections", "fields"]);
  function estObjet(valeur) {
    return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
  }
  function estTexteNonVide(valeur) {
    return typeof valeur === "string" && valeur.trim() !== "";
  }
  function estListeDeTextes(valeur) {
    return Array.isArray(valeur) && valeur.length > 0 && valeur.every(estTexteNonVide);
  }
  function premierDoublon(valeurs) {
    const vus = /* @__PURE__ */ new Set();
    for (const valeur of valeurs) {
      if (vus.has(valeur)) {
        return valeur;
      }
      vus.add(valeur);
    }
    return null;
  }
  function clesInattendues(objet, connues) {
    return Object.keys(objet).filter((cle) => !connues.has(cle));
  }
  function validerTypes(brut, signaler) {
    const catalogues = /* @__PURE__ */ new Map();
    if (!estObjet(brut)) {
      signaler("types", "bloc \xAB types \xBB absent ou mal form\xE9");
      return catalogues;
    }
    for (const cle of clesInattendues(brut, new Set(TYPES_CANONIQUES))) {
      signaler(`types.${cle}`, `type inconnu \u2014 les types sont : ${TYPES_CANONIQUES.join(", ")}`);
    }
    for (const type of TYPES_CANONIQUES) {
      const entree = brut[type];
      if (!estObjet(entree)) {
        signaler(`types.${type}`, "catalogue de formats absent");
        continue;
      }
      const formats = entree["formats"];
      if (!estListeDeTextes(formats)) {
        signaler(`types.${type}.formats`, "liste de formats absente ou vide");
        continue;
      }
      const doublon = premierDoublon(formats);
      if (doublon !== null) {
        signaler(`types.${type}.formats`, `format d\xE9clar\xE9 deux fois : \xAB ${doublon} \xBB`);
      }
      const connus = new Set(formats);
      let defaut = formats;
      const brutDefaut = entree["defaut"];
      if (brutDefaut !== void 0) {
        if (!estListeDeTextes(brutDefaut)) {
          signaler(`types.${type}.defaut`, "liste de formats par d\xE9faut vide ou mal form\xE9e");
        } else {
          const intrus = brutDefaut.filter((format) => !connus.has(format));
          if (intrus.length > 0) {
            signaler(`types.${type}.defaut`, `hors catalogue : ${intrus.join(", ")}`);
          }
          defaut = brutDefaut;
        }
      }
      catalogues.set(type, { formats: connus, defaut });
    }
    return catalogues;
  }
  function validerSections(brut, signaler) {
    const sections = /* @__PURE__ */ new Map();
    if (!Array.isArray(brut) || brut.length === 0) {
      signaler("sections", "liste des sections absente ou vide");
      return sections;
    }
    brut.forEach((section, rang) => {
      const ou = estObjet(section) && estTexteNonVide(section["id"]) ? `sections.${section["id"]}` : `sections[${rang}]`;
      if (!estObjet(section)) {
        signaler(ou, "section mal form\xE9e");
        return;
      }
      for (const cle of clesInattendues(section, CLES_SECTION)) {
        signaler(ou, `cl\xE9 inattendue \xAB ${cle} \xBB`);
      }
      const id = section["id"];
      if (!estTexteNonVide(id) || !MOTIF_IDENTIFIANT.test(id)) {
        signaler(ou, "identifiant de section absent ou hors camelCase");
        return;
      }
      if (sections.has(id)) {
        signaler(ou, "section d\xE9clar\xE9e deux fois");
        return;
      }
      if (!estTexteNonVide(section["label"])) {
        signaler(ou, "libell\xE9 de section absent");
      }
      const prefixes = section["prefixes"];
      if (!estListeDeTextes(prefixes)) {
        signaler(ou, "liste de pr\xE9fixes absente ou vide");
        return;
      }
      for (const prefixe of prefixes) {
        if (!MOTIF_PREFIXE.test(prefixe)) {
          signaler(ou, `pr\xE9fixe \xAB ${prefixe} \xBB \u2014 attendu \xAB quelquechose. \xBB`);
        }
      }
      sections.set(id, prefixes);
    });
    return sections;
  }
  function validerChamps(brut, contexte) {
    const { catalogues, sections, signaler } = contexte;
    if (!Array.isArray(brut) || brut.length === 0) {
      signaler("fields", "liste des champs absente ou vide");
      return;
    }
    const cles = /* @__PURE__ */ new Set();
    const libelles = /* @__PURE__ */ new Map();
    const sectionsUtilisees = /* @__PURE__ */ new Set();
    const prefixesUtilises = /* @__PURE__ */ new Set();
    const derives = /* @__PURE__ */ new Map();
    brut.forEach((champ, rang) => {
      const cle = estObjet(champ) ? champ["key"] : void 0;
      const ou = estTexteNonVide(cle) ? cle : `fields[${rang}]`;
      if (!estObjet(champ)) {
        signaler(ou, "champ mal form\xE9");
        return;
      }
      for (const inattendue of clesInattendues(champ, CLES_CHAMP)) {
        signaler(ou, `cl\xE9 inattendue \xAB ${inattendue} \xBB`);
      }
      if (!estTexteNonVide(cle) || !MOTIF_CLE.test(cle)) {
        signaler(ou, "cl\xE9 absente ou hors camelCase point\xE9e (attendu \xAB client.birthDate \xBB)");
        return;
      }
      if (cles.has(cle)) {
        signaler(ou, "cl\xE9 d\xE9clar\xE9e deux fois");
        return;
      }
      cles.add(cle);
      const section = champ["section"];
      const prefixe = `${cle.slice(0, cle.indexOf("."))}.`;
      if (!estTexteNonVide(section)) {
        signaler(ou, "section absente");
      } else if (!sections.has(section)) {
        signaler(ou, `section inconnue \xAB ${section} \xBB`);
      } else {
        const prefixesDeLaSection = sections.get(section) ?? [];
        if (!prefixesDeLaSection.includes(prefixe)) {
          signaler(
            ou,
            `le pr\xE9fixe \xAB ${prefixe} \xBB n'appartient pas \xE0 la section \xAB ${section} \xBB (elle d\xE9clare : ${prefixesDeLaSection.join(", ")})`
          );
        } else {
          prefixesUtilises.add(`${section}|${prefixe}`);
        }
        sectionsUtilisees.add(section);
      }
      const type = champ["type"];
      const typeCanonique = estTexteNonVide(type) && TYPES_CANONIQUES.includes(type) ? type : null;
      if (typeCanonique === null) {
        signaler(ou, `type inconnu \u2014 les types sont : ${TYPES_CANONIQUES.join(", ")}`);
      }
      const libelle = champ["label"];
      const synonymes = champ["synonyms"];
      if (!estTexteNonVide(libelle)) {
        signaler(ou, "libell\xE9 absent");
      }
      if (!estListeDeTextes(synonymes)) {
        signaler(ou, "au moins un synonyme est attendu");
      }
      const candidats = [
        ...estTexteNonVide(libelle) ? [libelle] : [],
        ...estListeDeTextes(synonymes) ? synonymes : []
      ];
      const dejaVus = /* @__PURE__ */ new Set();
      for (const candidat of candidats) {
        const normalise = normaliserLibelle(candidat);
        if (normalise === "") {
          signaler(ou, `\xAB ${candidat} \xBB ne laisse rien une fois normalis\xE9`);
          continue;
        }
        if (dejaVus.has(normalise)) {
          signaler(ou, `libell\xE9 r\xE9p\xE9t\xE9 dans le champ : \xAB ${candidat} \xBB`);
          continue;
        }
        dejaVus.add(normalise);
        const proprietaire = libelles.get(normalise);
        if (proprietaire !== void 0 && proprietaire !== cle) {
          signaler(
            ou,
            `\xAB ${candidat} \xBB est d\xE9j\xE0 revendiqu\xE9 par ${proprietaire} \u2014 le dictionnaire de libell\xE9s ne saurait pas trancher`
          );
          continue;
        }
        libelles.set(normalise, cle);
      }
      const valeurs = champ["values"];
      if (typeCanonique === "enum") {
        validerValeursEnum(valeurs, ou, signaler);
      } else if (valeurs !== void 0) {
        signaler(ou, "seul un champ de type \xAB enum \xBB porte des valeurs");
      }
      const exemple = champ["example"];
      if (!estTexteNonVide(exemple)) {
        signaler(ou, "exemple absent");
      } else if (typeCanonique !== null) {
        const motif = MOTIF_EXEMPLE[typeCanonique];
        if (!motif.test(exemple)) {
          signaler(ou, `l'exemple \xAB ${exemple} \xBB ne correspond pas au type \xAB ${typeCanonique} \xBB`);
        } else if (typeCanonique === "enum" && Array.isArray(valeurs)) {
          const declarees = valeurs.filter(estObjet).map((valeur) => valeur["value"]);
          if (!declarees.includes(exemple)) {
            signaler(ou, `l'exemple \xAB ${exemple} \xBB ne fait pas partie des valeurs d\xE9clar\xE9es`);
          }
        }
      }
      const unite = champ["unit"];
      if (unite !== void 0) {
        if (!estTexteNonVide(unite) || !UNITES.includes(unite)) {
          signaler(ou, `unit\xE9 inconnue \u2014 les unit\xE9s sont : ${UNITES.join(", ")}`);
        } else if (typeCanonique !== null && !TYPES_AVEC_UNITE.includes(typeCanonique)) {
          signaler(ou, `un champ de type \xAB ${typeCanonique} \xBB ne porte pas d'unit\xE9`);
        }
      }
      const formats = champ["formats"];
      if (formats !== void 0) {
        if (!estListeDeTextes(formats)) {
          signaler(ou, "liste de formats vide ou mal form\xE9e");
        } else if (typeCanonique !== null) {
          const catalogue = catalogues.get(typeCanonique);
          const doublon = premierDoublon(formats);
          if (doublon !== null) {
            signaler(ou, `format d\xE9clar\xE9 deux fois : \xAB ${doublon} \xBB`);
          }
          if (catalogue !== void 0) {
            const intrus = formats.filter((format) => !catalogue.formats.has(format));
            if (intrus.length > 0) {
              signaler(
                ou,
                `format hors du catalogue de \xAB ${typeCanonique} \xBB : ${intrus.join(", ")}`
              );
            }
          }
        }
      }
      const derive = champ["derived"];
      if (derive !== void 0) {
        const sources = validerDerive(derive, ou, signaler);
        if (sources !== null) {
          derives.set(cle, sources);
        }
      }
      const note = champ["note"];
      if (note !== void 0 && !estTexteNonVide(note)) {
        signaler(ou, "note vide \u2014 l'omettre plut\xF4t");
      }
    });
    validerReferencesDerivees(derives, cles, signaler);
    for (const [id, prefixes] of sections) {
      if (!sectionsUtilisees.has(id)) {
        signaler(`sections.${id}`, "section d\xE9clar\xE9e mais aucun champ ne s'y range");
        continue;
      }
      for (const prefixe of prefixes) {
        if (!prefixesUtilises.has(`${id}|${prefixe}`)) {
          signaler(`sections.${id}`, `pr\xE9fixe \xAB ${prefixe} \xBB d\xE9clar\xE9 mais jamais utilis\xE9`);
        }
      }
    }
  }
  function validerValeursEnum(brut, ou, signaler) {
    if (!Array.isArray(brut) || brut.length === 0) {
      signaler(ou, "un champ \xAB enum \xBB d\xE9clare ses valeurs canoniques");
      return;
    }
    const valeursVues = /* @__PURE__ */ new Set();
    const libellesVus = /* @__PURE__ */ new Set();
    for (const valeur of brut) {
      if (!estObjet(valeur)) {
        signaler(ou, "valeur d'\xE9num\xE9ration mal form\xE9e");
        continue;
      }
      for (const cle of clesInattendues(valeur, CLES_VALEUR)) {
        signaler(ou, `cl\xE9 inattendue dans une valeur : \xAB ${cle} \xBB`);
      }
      const canonique = valeur["value"];
      if (!estTexteNonVide(canonique) || !MOTIF_VALEUR_ENUM.test(canonique)) {
        signaler(ou, `valeur \xAB ${String(canonique)} \xBB \u2014 attendu des MAJUSCULES sans accent`);
      } else if (valeursVues.has(canonique)) {
        signaler(ou, `valeur d\xE9clar\xE9e deux fois : \xAB ${canonique} \xBB`);
      } else {
        valeursVues.add(canonique);
      }
      const libelle = valeur["label"];
      if (!estTexteNonVide(libelle)) {
        signaler(ou, `libell\xE9 absent pour la valeur \xAB ${String(canonique)} \xBB`);
      }
      const synonymes = valeur["synonyms"];
      if (!Array.isArray(synonymes) || !synonymes.every(estTexteNonVide)) {
        signaler(ou, `synonymes mal form\xE9s pour la valeur \xAB ${String(canonique)} \xBB`);
        continue;
      }
      for (const texte2 of [...estTexteNonVide(libelle) ? [libelle] : [], ...synonymes]) {
        const normalise = normaliserLibelle(texte2);
        if (normalise === "") {
          signaler(ou, `\xAB ${texte2} \xBB ne laisse rien une fois normalis\xE9`);
          continue;
        }
        if (libellesVus.has(normalise)) {
          signaler(ou, `deux valeurs r\xE9pondent au m\xEAme libell\xE9 : \xAB ${texte2} \xBB`);
          continue;
        }
        libellesVus.add(normalise);
      }
    }
  }
  function validerDerive(brut, ou, signaler) {
    if (!estObjet(brut)) {
      signaler(ou, "bloc \xAB derived \xBB mal form\xE9");
      return null;
    }
    for (const cle of clesInattendues(brut, CLES_DERIVE)) {
      signaler(ou, `cl\xE9 inattendue dans \xAB derived \xBB : \xAB ${cle} \xBB`);
    }
    const calcul = brut["computation"];
    if (!estTexteNonVide(calcul) || !MOTIF_CALCUL.test(calcul)) {
      signaler(ou, "identifiant de calcul absent ou hors camelCase");
    }
    if (!estTexteNonVide(brut["formula"])) {
      signaler(ou, "un champ d\xE9riv\xE9 \xE9nonce sa formule en fran\xE7ais \u2014 c'est ce que relit le courtier");
    }
    const sources = brut["from"];
    if (!estListeDeTextes(sources)) {
      signaler(ou, "un champ d\xE9riv\xE9 cite au moins une source");
      return null;
    }
    return sources;
  }
  function validerReferencesDerivees(derives, cles, signaler) {
    for (const [cle, sources] of derives) {
      for (const source of sources) {
        if (source === cle) {
          signaler(cle, "champ d\xE9riv\xE9 de lui-m\xEAme");
        } else if (!cles.has(source)) {
          signaler(cle, `champ d\xE9riv\xE9 : source inconnue \xAB ${source} \xBB`);
        }
      }
    }
    for (const cle of derives.keys()) {
      if (meneA(cle, cle, derives, /* @__PURE__ */ new Set())) {
        signaler(cle, "cycle entre champs d\xE9riv\xE9s \u2014 aucun ne pourrait \xEAtre calcul\xE9");
      }
    }
  }
  function meneA(depart, courant, derives, vus) {
    for (const source of derives.get(courant) ?? []) {
      if (source === depart) {
        return true;
      }
      if (!vus.has(source)) {
        vus.add(source);
        if (meneA(depart, source, derives, vus)) {
          return true;
        }
      }
    }
    return false;
  }
  function valider(donnees) {
    const anomalies = [];
    const signaler = (ou, probleme) => {
      anomalies.push({ ou, probleme });
    };
    if (!estObjet(donnees)) {
      signaler("ontologie", "le document n'est pas un objet");
      return anomalies;
    }
    for (const cle of clesInattendues(donnees, CLES_RACINE)) {
      signaler("ontologie", `cl\xE9 inattendue \xAB ${cle} \xBB`);
    }
    const version = donnees["version"];
    if (!estTexteNonVide(version) || !MOTIF_VERSION.test(version)) {
      signaler("version", "attendu \xAB MAJEURE.MINEURE.CORRECTIF \xBB");
    }
    const catalogues = validerTypes(donnees["types"], signaler);
    const sections = validerSections(donnees["sections"], signaler);
    validerChamps(donnees["fields"], { catalogues, sections, signaler });
    return anomalies;
  }
  function ontologieValidee(donnees) {
    const anomalies = valider(donnees);
    if (anomalies.length > 0) {
      const detail = anomalies.map((anomalie) => `  ${anomalie.ou} : ${anomalie.probleme}`).join("\n");
      throw new Error(`Ontologie incoh\xE9rente \u2014 ${anomalies.length} anomalie(s) :
${detail}`);
    }
    return donnees;
  }

  // src/core/ontology/consulter.ts
  function champsDeSection(ontologie, section) {
    return ontologie.fields.filter((champ) => champ.section === section);
  }
  function formatsDe(ontologie, champ) {
    if (champ.formats !== void 0) {
      return champ.formats;
    }
    const catalogue = ontologie.types[champ.type];
    return catalogue.defaut ?? catalogue.formats;
  }
  function indexDesLibelles(ontologie) {
    const index = /* @__PURE__ */ new Map();
    for (const champ of ontologie.fields) {
      for (const texte2 of [champ.label, ...champ.synonyms]) {
        index.set(normaliserLibelle(texte2), champ.key);
      }
    }
    return index;
  }

  // essai/ontologie.ts
  var ONTOLOGIE = ontologieValidee(ontology_default);
  var INDEX = indexDesLibelles(ONTOLOGIE);
  var PAR_CLE = new Map(ONTOLOGIE.fields.map((champ) => [champ.key, champ]));
  var $ = (id) => document.getElementById(id);
  function chercherLibelle(saisi) {
    const normalise = normaliserLibelle(saisi);
    const cle = INDEX.get(normalise);
    $("normalise").textContent = normalise === "" ? "\u2014" : normalise;
    if (saisi.trim() === "") {
      $("resultat").className = "resultat vide";
      $("resultat").textContent = "Tapez un libell\xE9, ou choisissez-en un ci-dessus.";
      return;
    }
    if (cle === void 0) {
      $("resultat").className = "resultat inconnu";
      $("resultat").replaceChildren(
        texte("strong", "Aucun champ canonique."),
        texte("div", "L'agent refuserait de remplir plut\xF4t que de deviner (r\xE8gle S5). Au sprint 3, c'est l\xE0 que le courtier tranche une fois, et que la recette apprend.")
      );
      return;
    }
    const champ = PAR_CLE.get(cle);
    if (champ === void 0) {
      return;
    }
    $("resultat").className = "resultat trouve";
    $("resultat").replaceChildren(
      texte("div", champ.key, "cle-trouvee"),
      texte("div", `${champ.label} \xB7 ${sectionDe(champ)} \xB7 type ${champ.type}` + (champ.unit === void 0 ? "" : ` \xB7 en ${champ.unit}`)),
      texte("div", `\xE9critures accept\xE9es : ${formatsDe(ONTOLOGIE, champ).join("  \xB7  ")}`, "pale"),
      ...champ.derived === void 0 ? [] : [texte("div", `calcul\xE9 : ${champ.derived.formula}`, "pale")],
      ...champ.values === void 0 ? [] : [texte(
        "div",
        `valeurs : ${champ.values.map((valeur) => valeur.value).join(", ")}`,
        "pale"
      )]
    );
  }
  function texte(balise, contenu, classe = "") {
    const element = document.createElement(balise);
    element.textContent = contenu;
    if (classe !== "") {
      element.className = classe;
    }
    return element;
  }
  function sectionDe(champ) {
    return ONTOLOGIE.sections.find((section) => section.id === champ.section)?.label ?? champ.section;
  }
  function afficherOntologie(filtre) {
    const cherche = normaliserLibelle(filtre);
    const corps = $("corps");
    let visibles = 0;
    corps.replaceChildren();
    for (const section of ONTOLOGIE.sections) {
      const champs = champsDeSection(ONTOLOGIE, section.id).filter((champ) => retient(champ, cherche));
      if (champs.length === 0) {
        continue;
      }
      visibles += champs.length;
      const entete = document.createElement("tr");
      const cellule2 = document.createElement("td");
      cellule2.colSpan = 5;
      cellule2.className = "section";
      cellule2.textContent = `${section.label} \u2014 ${champs.length}`;
      entete.append(cellule2);
      corps.append(entete);
      for (const champ of champs) {
        corps.append(ligneDe(champ));
      }
    }
    $("compteur").textContent = `${visibles} / ${ONTOLOGIE.fields.length}`;
  }
  function retient(champ, cherche) {
    if (cherche === "") {
      return true;
    }
    const matiere = [champ.key, champ.label, ...champ.synonyms].map(normaliserLibelle).join(" ");
    return matiere.includes(cherche);
  }
  function ligneDe(champ) {
    const ligne = document.createElement("tr");
    const type = champ.type + (champ.unit === void 0 ? "" : ` (${champ.unit})`);
    const details = champ.values !== void 0 ? champ.values.map((valeur) => valeur.value).join(" \xB7 ") : formatsDe(ONTOLOGIE, champ).join(" \xB7 ");
    ligne.append(
      cellule(champ.key, "mono cle"),
      cellule(champ.label + (champ.derived === void 0 ? "" : "  \u21A9 calcul\xE9")),
      cellule(String(champ.synonyms.length), "num"),
      cellule(type, "mono pale"),
      cellule(champ.derived === void 0 ? details : champ.derived.formula, "mono pale petit")
    );
    return ligne;
  }
  function cellule(contenu, classe = "") {
    const td = document.createElement("td");
    td.textContent = contenu;
    if (classe !== "") {
      td.className = classe;
    }
    return td;
  }
  function casser(modifier) {
    const copie = structuredClone(ONTOLOGIE);
    modifier(copie);
    return copie;
  }
  function champMutable(ontologie, cle) {
    const trouve = ontologie.fields.find((champ) => champ.key === cle);
    if (trouve === void 0) {
      throw new Error(`champ \xAB ${cle} \xBB absent`);
    }
    return trouve;
  }
  var DEMONSTRATIONS = [
    {
      libelle: "Telle qu'elle est livr\xE9e",
      explication: "Le fichier du d\xE9p\xF4t, tel quel.",
      produire: () => ONTOLOGIE
    },
    {
      libelle: "Deux champs revendiquent \xAB N\xE9(e) le \xBB",
      explication: "En voyant ce libell\xE9, l'agent ne saurait pas s'il s'agit de l'assur\xE9 ou du conjoint. Il devinerait \u2014 c'est exactement ce que le validateur emp\xEAche.",
      produire: () => casser((ontologie) => {
        champMutable(ontologie, "spouse.birthDate").synonyms.push("N\xE9(e) le");
      })
    },
    {
      libelle: "Une valeur d'\xE9num\xE9ration en minuscules",
      explication: "Les valeurs canoniques sont en MAJUSCULES. \xAB celibataire \xBB et \xAB CELIBATAIRE \xBB finiraient par cohabiter dans les recettes.",
      produire: () => casser((ontologie) => {
        const valeurs = champMutable(ontologie, "client.maritalStatus").values;
        if (valeurs !== void 0 && valeurs[0] !== void 0) {
          valeurs[0].value = "celibataire";
        }
      })
    },
    {
      libelle: "Un champ calcul\xE9 pointe une cl\xE9 inexistante",
      explication: "L'\xE2ge se calcule depuis \xAB client.dateDeNaissance \xBB, qui n'existe pas. Rien ne planterait au chargement : l'\xE2ge serait simplement vide, un jour, chez un client.",
      produire: () => casser((ontologie) => {
        champMutable(ontologie, "client.age").derived = {
          from: ["client.dateDeNaissance"],
          computation: "ageEnAnneesRevolues",
          formula: "ann\xE9es r\xE9volues depuis client.dateDeNaissance"
        };
      })
    },
    {
      libelle: "Un cycle entre champs calcul\xE9s",
      explication: "L'\xE2ge se calcule depuis la date de naissance\u2026 qui se calculerait depuis l'\xE2ge. Aucun des deux n'est calculable.",
      produire: () => casser((ontologie) => {
        champMutable(ontologie, "client.birthDate").derived = {
          from: ["client.age"],
          computation: "naissanceDepuisAge",
          formula: "date du jour moins client.age ann\xE9es"
        };
      })
    },
    {
      libelle: "Un format invent\xE9",
      explication: "\xAB le 7 mars \xBB n'est pas dans le catalogue du type date. Le g\xE9n\xE9rateur de variantes du sprint 3 ne saurait pas le produire.",
      produire: () => casser((ontologie) => {
        champMutable(ontologie, "client.birthDate").formats = ["JJ/MM/AAAA", "le 7 mars"];
      })
    }
  ];
  function eprouver(demonstration) {
    const anomalies = valider(demonstration.produire());
    $("explication").textContent = demonstration.explication;
    $("anomalies").replaceChildren(
      anomalies.length === 0 ? texte("div", "Aucune anomalie \u2014 le build passe.", "ligne ok") : texte("div", `${anomalies.length} anomalie(s) \u2014 le build \xE9choue.`, "ligne attention"),
      ...anomalies.map((anomalie) => texte("div", `${anomalie.ou}
    ${anomalie.probleme}`, "ligne anomalie"))
    );
  }
  var SUGGESTIONS = [
    "Date de naissance",
    "DATE DE NAISSANCE :",
    "N\xE9 le",
    "N\xE9(e) le",
    "Coefficient bonus-malus",
    "N\xB0 SIRET",
    "Superficie",
    "Quotit\xE9",
    "Fractionnement",
    "Nom du chien"
  ];
  var $saisie = $("libelle");
  for (const suggestion of SUGGESTIONS) {
    const bouton = document.createElement("button");
    bouton.textContent = suggestion;
    bouton.className = "suggestion";
    bouton.addEventListener("click", () => {
      $saisie.value = suggestion;
      chercherLibelle(suggestion);
    });
    $("suggestions").append(bouton);
  }
  $saisie.addEventListener("input", () => {
    chercherLibelle($saisie.value);
  });
  var $filtre = $("filtre");
  $filtre.addEventListener("input", () => {
    afficherOntologie($filtre.value);
  });
  var boutons = [];
  for (const demonstration of DEMONSTRATIONS) {
    const bouton = document.createElement("button");
    bouton.textContent = demonstration.libelle;
    bouton.addEventListener("click", () => {
      for (const autre of boutons) {
        autre.className = "";
      }
      bouton.className = "fort";
      eprouver(demonstration);
    });
    boutons.push(bouton);
    $("demonstrations").append(bouton);
  }
  boutons[0].className = "fort";
  $("version").textContent = ONTOLOGIE.version;
  $("total").textContent = String(ONTOLOGIE.fields.length);
  $("libelles").textContent = String(INDEX.size);
  chercherLibelle("");
  afficherOntologie("");
  eprouver(DEMONSTRATIONS[0]);
})();
