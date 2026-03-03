package organizations

// AggregateItem representa un valor de taxonomía y cuántas organizaciones lo tienen.
type AggregateItem struct {
	Value string `json:"value"`
	Count int    `json:"count"`
}

// AggregatesResponse agrupa los conteos para los filtros del mapa y dashboard.
type AggregatesResponse struct {
	Countries         []AggregateItem `json:"countries"`
	Verticals         []AggregateItem `json:"verticals"`    // Antes SectorsPrimary
	SubVerticals      []AggregateItem `json:"subVerticals"` // Antes SectorsSecondary
	OrganizationTypes []AggregateItem `json:"organizationTypes"`
	Estadios          []AggregateItem `json:"estadios"` // Antes Stages
	OutcomeStatuses   []AggregateItem `json:"outcomeStatuses"`
	Regions           []AggregateItem `json:"regions"`
	Cities            []AggregateItem `json:"cities"`
}
