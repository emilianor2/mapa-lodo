package organizations

import (
	"fmt"
	"strings"
)

// Normalize limpia y valida los datos de una organización antes de persistirlos.
func Normalize(org *Organization) error {
	// 1. Trim en campos de texto obligatorios
	org.ID = strings.TrimSpace(org.ID)
	org.Name = strings.TrimSpace(org.Name)
	org.Vertical = strings.TrimSpace(org.Vertical)
	org.Country = strings.TrimSpace(org.Country)
	org.Region = strings.TrimSpace(org.Region)
	org.City = strings.TrimSpace(org.City)
	org.OrganizationType = strings.TrimSpace(org.OrganizationType)
	org.OutcomeStatus = strings.TrimSpace(org.OutcomeStatus)

	// 2. Validación de campos mínimos indispensables para existir en la DB
	if org.Name == "" {
		return fmt.Errorf("el nombre de la organización es obligatorio")
	}
	if org.Vertical == "" {
		return fmt.Errorf("la vertical de negocio es obligatoria")
	}

	// 3. Normalizar campos opcionales (Punteros a string)
	org.Website = normalizeOptional(org.Website)
	org.SubVertical = normalizeOptional(org.SubVertical)
	org.EstadioActual = normalizeOptional(org.EstadioActual)
	org.Solucion = normalizeOptional(org.Solucion)
	org.Mail = normalizeOptional(org.Mail)
	org.ContactPhone = normalizeOptional(org.ContactPhone)
	org.Notes = normalizeOptional(org.Notes)
	org.LogoURL = normalizeOptional(org.LogoURL)
	org.BusinessModel = normalizeOptional(org.BusinessModel)

	// --- Lógica de validación para "OTRA / OTRO" ---
	isVerticalOtra := strings.EqualFold(org.Vertical, "otra") || strings.EqualFold(org.Vertical, "otro")
	if isVerticalOtra {
		if org.Notes == nil || len(strings.TrimSpace(*org.Notes)) < 3 {
			return fmt.Errorf("al seleccionar 'OTRA' como vertical, debe detallar la categoría en el campo de notas")
		}
	}

	// 4. Validar consistencia de coordenadas geográficas
	if (org.Lat != nil && org.Lng == nil) || (org.Lat == nil && org.Lng != nil) {
		return fmt.Errorf("se deben proporcionar ambos valores (latitud y longitud) o ninguno")
	}

	// 5. Validar año de fundación (Founded)
	if org.Founded != nil {
		currentYear := 2026
		if *org.Founded < 1850 || *org.Founded > currentYear {
			return fmt.Errorf("el año de fundación (%d) no es válido", *org.Founded)
		}
	}

	// 6. Limpieza profunda de Slices (Founders, Badges)
	org.Founders = cleanSlice(org.Founders)
	org.Badges = cleanSlice(org.Badges)

	return nil
}

// ValidateForPublish realiza el checklist corporativo antes de permitir el paso a PUBLISHED.
// Esta es la función que service.go necesita encontrar.
func ValidateForPublish(org *Organization) error {
	if org.Name == "" || org.Vertical == "" || org.Country == "" || org.OrganizationType == "" {
		return fmt.Errorf("faltan campos geográficos (país) o de categorización obligatorios")
	}

	if org.Solucion == nil || len(*org.Solucion) < 20 {
		return fmt.Errorf("la solución (descripción) es muy corta (mínimo 20 caracteres para publicar)")
	}

	// Regla: Contacto mínimo (Website o Redes Sociales)
	hasContact := (org.Website != nil && *org.Website != "")
	if org.SocialMedia != nil {
		if li, ok := org.SocialMedia["linkedin"]; ok && strings.TrimSpace(li) != "" {
			hasContact = true
		}
	}

	if !hasContact {
		return fmt.Errorf("se requiere al menos un enlace de contacto (Sitio Web o LinkedIn) para publicar")
	}

	// Regla especial: Si es Startup -> Estadio Actual es obligatorio
	if strings.EqualFold(org.OrganizationType, "Startup") {
		if org.EstadioActual == nil || *org.EstadioActual == "" {
			return fmt.Errorf("el estadioActual es obligatorio para organizaciones de tipo Startup")
		}
	}

	return nil
}

// Helpers para normalización
func normalizeOptional(s *string) *string {
	if s == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*s)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func cleanSlice(items []string) []string {
	if items == nil {
		return nil
	}
	cleaned := make([]string, 0)
	for _, item := range items {
		trimmed := strings.TrimSpace(item)
		if trimmed != "" {
			cleaned = append(cleaned, trimmed)
		}
	}
	if len(cleaned) == 0 {
		return nil
	}
	return cleaned
}
