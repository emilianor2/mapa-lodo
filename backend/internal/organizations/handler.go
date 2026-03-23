package organizations

import (
	"backend/internal/geocoding"
	"encoding/json"
	"net/http"
	"strings"
)

// Handler expone los endpoints HTTP para organizaciones.
type Handler struct {
	Service  *Service
	Repo     *Repository
	Geocoder *geocoding.NominatimClient
}

func NewHandler(service *Service, repo *Repository, geocoder *geocoding.NominatimClient) *Handler {
	return &Handler{
		Service:  service,
		Repo:     repo,
		Geocoder: geocoder,
	}
}

// --- ENDPOINTS ADMINISTRATIVOS (CRUD) ---

// Create crea una organización en estado DRAFT.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var org Organization
	if err := json.NewDecoder(r.Body).Decode(&org); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if err := Normalize(&org); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Service.Create(&org); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(org)
}

// Update actualiza los campos permitidos de una organización.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path)
	if id == "" {
		http.Error(w, "ID es obligatorio para actualizar", http.StatusBadRequest)
		return
	}

	var org Organization
	if err := json.NewDecoder(r.Body).Decode(&org); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	org.ID = id
	if err := Normalize(&org); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Service.Update(&org); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(org)
}

// GetByID devuelve el detalle administrativo completo.
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path)
	if id == "" {
		http.Error(w, "ID inválido o no proporcionado", http.StatusBadRequest)
		return
	}

	org, err := h.Repo.FindByID(id)
	if err != nil {
		http.Error(w, "Organization not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(org)
}

// List devuelve la lista filtrada para administración.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	params := getQueryParams(r)
	orgs, err := h.Repo.FindFiltered(params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orgs)
}

// Delete elimina o archiva una organización.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path)
	if id == "" {
		http.Error(w, "ID requerido para eliminar", http.StatusBadRequest)
		return
	}

	force := r.URL.Query().Get("force") == "true"

	if err := h.Service.Delete(id, force); err != nil {
		if strings.Contains(err.Error(), "force=true") {
			http.Error(w, err.Error(), http.StatusConflict)
		} else {
			http.Error(w, err.Error(), http.StatusBadRequest)
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// --- FLUJO DE ESTADOS (LIFECYCLE) ---

func (h *Handler) SubmitForReview(w http.ResponseWriter, r *http.Request) {
	id := extractActionID(r.URL.Path, "review")
	if id == "" {
		http.Error(w, "ID no encontrado en la ruta de revisión", http.StatusBadRequest)
		return
	}
	if err := h.Service.SubmitForReview(id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) Publish(w http.ResponseWriter, r *http.Request) {
	id := extractActionID(r.URL.Path, "publish")
	if id == "" {
		http.Error(w, "ID no encontrado en la ruta de publicación", http.StatusBadRequest)
		return
	}
	if err := h.Service.Publish(id); err != nil {
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) Archive(w http.ResponseWriter, r *http.Request) {
	id := extractActionID(r.URL.Path, "archive")
	if id == "" {
		http.Error(w, "ID no encontrado en la ruta de archivo", http.StatusBadRequest)
		return
	}
	if err := h.Service.Archive(id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// --- ENDPOINTS PÚBLICOS ---

func (h *Handler) ListPublic(w http.ResponseWriter, r *http.Request) {
	params := getQueryParams(r)
	params["status"] = string(StatusPublished)

	orgs, err := h.Repo.FindFiltered(params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orgs)
}

func (h *Handler) GetPublicByID(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path)
	org, err := h.Repo.FindPublishedByID(id)
	if err != nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(org)
}

func (h *Handler) Aggregates(w http.ResponseWriter, r *http.Request) {
	params := getQueryParams(r)
	data, err := h.Repo.GetAggregates(params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// --- GEOPOSICIONAMIENTO ---

func (h *Handler) Geocode(w http.ResponseWriter, r *http.Request) {
	id := extractActionID(r.URL.Path, "geocode")
	if id == "" {
		id = extractID(r.URL.Path)
	}

	if id == "" {
		http.Error(w, "ID missing", http.StatusBadRequest)
		return
	}

	org, err := h.Repo.FindByID(id)
	if err != nil {
		http.Error(w, "Not found: "+id, http.StatusNotFound)
		return
	}

	city := ""
	if org.Location.City != nil {
		city = *org.Location.City
	}
	region := ""
	if org.Location.Region != nil {
		region = *org.Location.Region
	}

	lat, lng, err := h.Geocoder.Geocode(city, region, org.Location.Country)
	if err != nil {
		http.Error(w, "Geocoding error: "+err.Error(), http.StatusBadGateway)
		return
	}

	if err := h.Repo.UpdateCoordinates(id, lat, lng); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) PatchCoordinates(w http.ResponseWriter, r *http.Request) {
	id := extractActionID(r.URL.Path, "coordinates")
	if id == "" {
		id = extractID(r.URL.Path) // Fallback por si la URL no tiene sufijo
	}

	if id == "" {
		http.Error(w, "ID inválido para coordenadas", http.StatusBadRequest)
		return
	}

	var coords struct {
		Lat float64 `json:"lat"`
		Lng float64 `json:"lng"`
	}

	if err := json.NewDecoder(r.Body).Decode(&coords); err != nil {
		http.Error(w, "Invalid body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Repo.UpdateCoordinates(id, coords.Lat, coords.Lng); err != nil {
		http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "coordinates updated successfully"}`))
}

// --- HELPERS INTERNOS MEJORADOS ---

func extractID(path string) string {
	parts := strings.Split(strings.Trim(path, "/"), "/")

	// Buscamos dinámicamente el segmento después de "organizations"
	for i, p := range parts {
		if p == "organizations" && i+1 < len(parts) {
			id := parts[i+1]
			// Validamos que no sea una palabra clave de acción
			reserved := map[string]bool{
				"review": true, "publish": true, "archive": true,
				"geocode": true, "coordinates": true, "aggregates": true,
			}
			if reserved[id] {
				return ""
			}
			return id
		}
	}
	return ""
}

func extractActionID(path string, action string) string {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	for i, p := range parts {
		// En /organizations/{id}/{action}, el ID es el anterior a la acción
		if p == action && i > 0 {
			return parts[i-1]
		}
	}
	return ""
}

func getQueryParams(r *http.Request) map[string]string {
	params := make(map[string]string)
	for k, v := range r.URL.Query() {
		if len(v) > 0 {
			params[k] = v[0]
		}
	}
	return params
}
