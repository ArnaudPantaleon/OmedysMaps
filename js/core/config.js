export const CONFIG = {

  map: {
    center: [46.8, 2.5],
    zoom:   6
  },

  // Statuts cabinets
  statusCabinet: {
    "Ouvert":             { color: "#009597", checked: true  },
    "Ouverture en cours": { color: "#f59e0b", checked: true  },
    "Virtuel":            { color: "#64748b", checked: false }
  },

  // Statuts salles
  statusSalle: {
    "Ouvertes":               { color: "#579bfc", checked: true  },
    "Ouverture en cours":     { color: "#f59e0b", checked: false  },
    "Telesecretariat OMEDYS": { color: "#009597", checked: true  }
  },

  // Types de sites (salles)
  typeSite: {
    "ESMS":                              { checked: false },
    "CDS/MSP/CM":                        { checked: true },
    "CPTS":                              { checked: true },
    "Cabinet Infirmier":                 { checked: true },
    "Pharmacie":                         { checked: true },
    "Laboratoire":                       { checked: true },
    "Salle":                             { checked: true },
    "Salle collectivité":                { checked: true },
    "ODYS":                              { checked: true },
    "Etablissement scolaire":            { checked: true },
    "Foyer d'accueil":                   { checked: true },
    "Domicile":                          { checked: true },
    "Vehicule de télémédecine assistée": { checked: true },
    "véhicule de télémédecine assitée":  { checked: true }
  }

}
