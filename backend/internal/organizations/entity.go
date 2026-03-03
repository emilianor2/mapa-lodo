package organizations

import "time"

// OrganizationStatus representa el estado del ciclo de vida del dato.
type OrganizationStatus string

const (
	StatusDraft     OrganizationStatus = "DRAFT"
	StatusInReview  OrganizationStatus = "IN_REVIEW"
	StatusPublished OrganizationStatus = "PUBLISHED"
	StatusArchived  OrganizationStatus = "ARCHIVED"
)

// Organization es la entidad principal con la estructura corporativa completa.
type Organization struct {
	ID               string             `json:"id"`
	Name             string             `json:"name"`
	Website          *string            `json:"website,omitempty"`
	Vertical         string             `json:"vertical"`             // Ej: agtech, biotech_bioinputs
	SubVertical      *string            `json:"subVertical,omitempty"`  // Ej: digital_ag, crop_genomics
	Country          string             `json:"country"`
	Region           string             `json:"region"`
	City             string             `json:"city"`
	LogoURL          *string            `json:"logoUrl,omitempty"`
	EstadioActual    *string            `json:"estadioActual,omitempty"` // Etapa de Madurez
	Solucion         *string            `json:"solucion,omitempty"`      // Antes Description
	Mail             *string            `json:"mail,omitempty"`          // Antes ContactEmail
	SocialMedia      map[string]string  `json:"socialMedia,omitempty"`   // Objeto flexible (LinkedIn, IG, etc.)
	ContactPhone     *string            `json:"contactPhone,omitempty"`
	Founders         []string           `json:"founders,omitempty"`      // Lista de fundadores
	Founded          *int               `json:"founded,omitempty"`       // Año de fundación
	OrganizationType string             `json:"organizationType"`        // Startup, Inversor, etc.
	OutcomeStatus    string             `json:"outcomeStatus"`           // Activa, Adquirida, etc.
	BusinessModel    *string            `json:"businessModel,omitempty"` // B2B, B2C, etc.
	Badges           []string           `json:"badges,omitempty"`        // Unicornio, B-Corp, etc.
	Notes            *string            `json:"notes,omitempty"`         // Obligatorio si Vertical es "OTRA"
	Status           OrganizationStatus `json:"status"`
	Lat              *float64           `json:"lat,omitempty"`
	Lng              *float64           `json:"lng,omitempty"`
	CreatedAt        time.Time          `json:"createdAt"`
	UpdatedAt        time.Time          `json:"updatedAt"`
}

// OrganizationSummary se utilizará para listados rápidos y mapeo.
type OrganizationSummary struct {
	ID       string   `json:"id"`
	Name     string   `json:"name"`
	Vertical string   `json:"vertical"`
	Country  string   `json:"country"`
	Lat      *float64 `json:"lat,omitempty"`
	Lng      *float64 `json:"lng,omitempty"`
	Status   string   `json:"status"`
}