package organizations

import (
	"backend/internal/audit"
	"backend/internal/geocoding"
	"backend/internal/taxonomies"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	repo      *Repository
	auditRepo *audit.Repository
	taxRepo   taxonomies.Repository
	geocoder  *geocoding.NominatimClient

	taxCache      map[string]map[string]bool
	taxCacheTime  time.Time
	taxCacheMutex sync.RWMutex
}

func NewService(repo *Repository, auditRepo *audit.Repository, taxRepo taxonomies.Repository, geocoder *geocoding.NominatimClient) *Service {
	return &Service{
		repo:      repo,
		auditRepo: auditRepo,
		taxRepo:   taxRepo,
		geocoder:  geocoder,
	}
}

// --- HELPER DE COMPARACIÓN FLEXIBLE ---

func flexibleMatch(input string, target string) bool {
	clean := func(s string) string {
		s = strings.ToLower(s)
		s = strings.ReplaceAll(s, " ", "")
		s = strings.ReplaceAll(s, "_", "")
		s = strings.ReplaceAll(s, "-", "")
		return s
	}
	return clean(input) == clean(target)
}

// --- MÉTODOS DEL SERVICE ---

func (s *Service) Create(org *Organization) error {
	if org.ID == "" {
		org.ID = uuid.New().String()
	}

	if err := s.ValidateTaxonomies(org); err != nil {
		return err
	}

	if (org.City != nil && *org.City != "") || (org.Region != nil && *org.Region != "") || (org.Country != nil && *org.Country != "") {
		city := ""
		if org.City != nil {
			city = *org.City
		}
		region := ""
		if org.Region != nil {
			region = *org.Region
		}
		country := ""
		if org.Country != nil {
			country = *org.Country
		}

		lat, lng, err := s.geocoder.Geocode(city, region, country)
		if err == nil {
			org.Lat = &lat
			org.Lng = &lng
		} else {
			log.Printf("Geocoding error for %s: %v", org.Name, err)
		}
	}

	org.Status = StatusDraft
	return s.repo.Create(org)
}

func (s *Service) Update(org *Organization) error {
	if err := s.ValidateTaxonomies(org); err != nil {
		return err
	}

	existing, err := s.repo.FindByID(org.ID)
	if err != nil {
		return err
	}

	cityChanged := (org.City == nil && existing.City != nil) || (org.City != nil && existing.City == nil) || (org.City != nil && existing.City != nil && *org.City != *existing.City)
	regionChanged := (org.Region == nil && existing.Region != nil) || (org.Region != nil && existing.Region == nil) || (org.Region != nil && existing.Region != nil && *org.Region != *existing.Region)
	countryChanged := (org.Country == nil && existing.Country != nil) || (org.Country != nil && existing.Country == nil) || (org.Country != nil && existing.Country != nil && *org.Country != *existing.Country)

	if cityChanged || regionChanged || countryChanged {
		city := ""
		if org.City != nil {
			city = *org.City
		}
		region := ""
		if org.Region != nil {
			region = *org.Region
		}
		country := ""
		if org.Country != nil {
			country = *org.Country
		}

		lat, lng, err := s.geocoder.Geocode(city, region, country)
		if err == nil {
			org.Lat = &lat
			org.Lng = &lng
		}
	} else {
		org.Lat = existing.Lat
		org.Lng = existing.Lng
	}

	org.Status = existing.Status
	return s.repo.Update(org)
}

func (s *Service) Delete(id string, force bool) error {
	org, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}

	if org.Status == StatusPublished {
		_ = s.auditRepo.Log(&audit.AuditLog{
			EntityID:    id,
			EntityType:  "Organization",
			Action:      "ARCHIVE",
			FromStatus:  "PUBLISHED",
			ToStatus:    "ARCHIVED",
			PerformedBy: "system",
		})
		return s.repo.UpdateStatus(id, StatusArchived)
	}

	if org.Status == StatusArchived && !force {
		return fmt.Errorf("la organización ya está archivada, use force=true para borrado físico")
	}

	return s.repo.Delete(id)
}

func (s *Service) SubmitForReview(id string) error {
	org, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if org.Status != StatusDraft && org.Status != StatusPublished && org.Status != StatusArchived {
		return fmt.Errorf("transición inválida a revisión desde %s", org.Status)
	}
	return s.repo.UpdateStatus(id, StatusInReview)
}

func (s *Service) Publish(id string) error {
	org, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if org.Status != StatusInReview {
		return fmt.Errorf("la organización debe estar en revisión (IN_REVIEW) para ser publicada")
	}
	if err := ValidateForPublish(org); err != nil {
		return fmt.Errorf("error de validación para publicación: %w", err)
	}
	return s.repo.UpdateStatus(id, StatusPublished)
}

func (s *Service) Reject(id string) error {
	org, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if org.Status != StatusInReview {
		return fmt.Errorf("solo se puede rechazar desde el estado de revisión")
	}
	return s.repo.UpdateStatus(id, StatusDraft)
}

func (s *Service) Archive(id string) error {
	org, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if org.Status == StatusArchived {
		return nil
	}
	return s.repo.UpdateStatus(id, StatusArchived)
}

func (s *Service) ValidateTaxonomies(org *Organization) error {
	s.taxCacheMutex.RLock()
	cacheValid := !s.taxCacheTime.IsZero() && time.Since(s.taxCacheTime) < 60*time.Second
	s.taxCacheMutex.RUnlock()

	var grouped map[string]map[string]bool

	if cacheValid {
		s.taxCacheMutex.RLock()
		grouped = s.taxCache
		s.taxCacheMutex.RUnlock()
	} else {
		allTaxonomies, err := s.taxRepo.FindAll()
		if err != nil {
			return fmt.Errorf("error al cargar taxonomías: %w", err)
		}

		newCache := make(map[string]map[string]bool)
		for _, t := range allTaxonomies {
			if newCache[t.Category] == nil {
				newCache[t.Category] = make(map[string]bool)
			}
			newCache[t.Category][t.Value] = true
		}

		s.taxCacheMutex.Lock()
		s.taxCache = newCache
		s.taxCacheTime = time.Now()
		grouped = s.taxCache
		s.taxCacheMutex.Unlock()
	}

	// 1. Validar Vertical (Llave SQL: 'vertical')
	if org.Vertical != "" && !grouped["vertical"][org.Vertical] {
		return fmt.Errorf("vertical inválida: %s", org.Vertical)
	}

	// 2. Validar Sub-Vertical (Llave SQL: 'subvertical')
	if org.SubVertical != nil && *org.SubVertical != "" && !grouped["subvertical"][*org.SubVertical] {
		return fmt.Errorf("sub-vertical inválida: %s", *org.SubVertical)
	}

	// 3. Validar Estadio Actual (Llave SQL: 'estadioactual')
	if org.EstadioActual != nil && *org.EstadioActual != "" {
		found := false
		for taxValue := range grouped["estadioactual"] {
			if flexibleMatch(*org.EstadioActual, taxValue) {
				*org.EstadioActual = taxValue
				found = true
				break
			}
		}
		if !found {
			return fmt.Errorf("estadioActual inválido: %s", *org.EstadioActual)
		}
	}

	// 4. Validar Modelo de Negocio (Llave SQL: 'businessmodel')
	if org.BusinessModel != nil && *org.BusinessModel != "" {
		found := false
		for taxValue := range grouped["businessmodel"] {
			if flexibleMatch(*org.BusinessModel, taxValue) {
				*org.BusinessModel = taxValue
				found = true
				break
			}
		}
		if !found {
			return fmt.Errorf("businessModel inválido: %s", *org.BusinessModel)
		}
	}

	// 5. Validar Tipo de Organización (Llave SQL: 'organizationtype')
	if org.OrganizationType != "" && !grouped["organizationtype"][org.OrganizationType] {
		return fmt.Errorf("tipo de organización inválido: %s", org.OrganizationType)
	}

	// 6. Validar Badges (Llave SQL: 'badges')
	if len(org.Badges) > 0 {
		for _, b := range org.Badges {
			found := false
			for taxValue := range grouped["badges"] {
				if flexibleMatch(b, taxValue) {
					found = true
					break
				}
			}
			if !found {
				return fmt.Errorf("badge inválido detectado: %s", b)
			}
		}
	}

	return nil
}
