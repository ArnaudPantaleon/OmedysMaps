export const store = {

  datasets: [],
  sites:    [],
  markers:  [],

  filters: {
    // Filtres statut séparés par type de dataset
    statusCabinet: {},   // "Ouvert" / "Ouverture en cours" / "Virtuel"
    statusSalle:   {},   // "Ouvertes" / "Ouverture en cours" / "Telesecretariat OMEDYS"

    // Filtres dataset (cabinet / salle)
    dataset: {
      cabinet: true,
      salle:   true
    },

    // Filtres type de site (salles)
    typeSite: {},

    // Filtres TMS (salles)
    tms: {},             // clé = nom TMS, valeur = bool

    // Filtres géo — null = pas de filtre actif
    region:     null,    // code région ex: "84"
    departement: null    // code dept ex: "31"
  }

}
