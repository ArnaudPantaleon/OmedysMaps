export const CONFIG = {

  map: {
    themelight: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    themedark: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    center: [46.85, 2.3518],
    zoom:   7,
    mobileZoom:   6
  },

  // Statuts cabinets
  statusCabinet: {
    "Ouvert":             { color: "#009597", checked: true  },
    "Ouverture en cours": { color: "#ffcb00", checked: true  },
    "Virtuel":            { color: "#64748b", checked: false }
  },

  // Statuts salles
  statusSalle: {
    "Ouvertes":               { color: "#00c875", checked: true  },
    "Ouverture en cours":     { color: "#ffcb00", checked: false  },
    "Inactives":              { color: "#757575", checked: false  },
    "Fermees ou refus OTTs":  { color: "#bb3354", checked: false  },
    "En sourcing":            { color: "#ff642e", checked: false  },
    "Telesecretariat OMEDYS": { color: "#ff5ac4", checked: true  }
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
