package organizations

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

const (
	driveSheetID  = "1PrRrKP-Nz8lHZOkVhvln2sP6sACod2KxN6SpHQooS6s"
	driveSheetGID = "1025562372"
)

type DriveImportPreview struct {
	SourceURL      string                `json:"sourceUrl"`
	TotalRows      int                   `json:"totalRows"`
	NewRows        int                   `json:"newRows"`
	ExistingRows   int                   `json:"existingRows"`
	SkippedRows    int                   `json:"skippedRows"`
	PreviewEntries []DriveImportRow      `json:"previewEntries"`
	SkippedEntries []DriveImportSkip     `json:"skippedEntries,omitempty"`
}

type DriveImportRow struct {
	SourceRowNumber int      `json:"sourceRowNumber"`
	Name            string   `json:"name"`
	Website         string   `json:"website,omitempty"`
	Vertical        string   `json:"vertical,omitempty"`
	SubVertical     string   `json:"subVertical,omitempty"`
	OrganizationType string  `json:"organizationType,omitempty"`
	OutcomeStatus    string  `json:"outcomeStatus,omitempty"`
	Country         string   `json:"country,omitempty"`
	Region          string   `json:"region,omitempty"`
	City            string   `json:"city,omitempty"`
	Solucion        string   `json:"solucion,omitempty"`
	Notes           string   `json:"notes,omitempty"`
	Mail            string   `json:"mail,omitempty"`
	Founders        []string `json:"founders,omitempty"`
	Warnings        []string `json:"warnings,omitempty"`
}

type DriveImportSkip struct {
	SourceRowNumber int    `json:"sourceRowNumber"`
	Name            string `json:"name,omitempty"`
	Reason          string `json:"reason"`
}

func driveSheetExportURL() string {
	return fmt.Sprintf("https://docs.google.com/spreadsheets/d/%s/export?format=csv&gid=%s", driveSheetID, driveSheetGID)
}

func (h *Handler) PreviewDriveImport(w http.ResponseWriter, r *http.Request) {
	preview, err := h.buildDriveImportPreview()
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(preview)
}

func (h *Handler) CommitDriveImport(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Entries []DriveImportRow `json:"entries"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	created := 0
	published := 0
	inReview := 0
	results := make([]map[string]any, 0, len(payload.Entries))

	for _, entry := range payload.Entries {
		org := driveEntryToOrganization(entry)
		if err := Normalize(org); err != nil {
			results = append(results, map[string]any{
				"name":   entry.Name,
				"status": "error",
				"error":  err.Error(),
			})
			continue
		}

		if err := h.Service.Create(org); err != nil {
			results = append(results, map[string]any{
				"name":   entry.Name,
				"status": "error",
				"error":  err.Error(),
			})
			continue
		}

		finalStatus := StatusInReview
		if org.Lat != nil && org.Lng != nil && driveEntryReadyForPublish(entry) {
			finalStatus = StatusPublished
			published++
		} else {
			inReview++
		}

		_ = h.Repo.UpdateStatus(org.ID, finalStatus)
		created++
		results = append(results, map[string]any{
			"id":          org.ID,
			"name":        org.Name,
			"status":      "created",
			"finalStatus": finalStatus,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"created":   created,
		"published": published,
		"inReview":  inReview,
		"results":   results,
	})
}

func driveEntryReadyForPublish(entry DriveImportRow) bool {
	return strings.TrimSpace(entry.Name) != "" &&
		strings.TrimSpace(entry.Website) != "" &&
		strings.TrimSpace(entry.Country) != "" &&
		strings.TrimSpace(entry.Vertical) != "" &&
		strings.TrimSpace(entry.OrganizationType) != "" &&
		strings.TrimSpace(entry.OutcomeStatus) != "" &&
		(!strings.EqualFold(strings.TrimSpace(entry.Vertical), "otra") || strings.TrimSpace(entry.Notes) != "")
}

func (h *Handler) buildDriveImportPreview() (*DriveImportPreview, error) {
	rows, err := fetchDriveRows()
	if err != nil {
		return nil, err
	}

	existing, err := h.fetchExistingImportIdentities()
	if err != nil {
		return nil, err
	}

	preview := &DriveImportPreview{
		SourceURL:      driveSheetExportURL(),
		PreviewEntries: []DriveImportRow{},
		SkippedEntries: []DriveImportSkip{},
	}

	for _, row := range rows {
		preview.TotalRows++

		if strings.TrimSpace(row.Name) == "" {
			preview.SkippedRows++
			preview.SkippedEntries = append(preview.SkippedEntries, DriveImportSkip{
				SourceRowNumber: row.SourceRowNumber,
				Reason:          "missing_name",
			})
			continue
		}

		identity := normalizeImportIdentity(row.Name, row.Website)
		if existing.matches(identity) {
			preview.ExistingRows++
			continue
		}

		preview.NewRows++
		preview.PreviewEntries = append(preview.PreviewEntries, row.toPreview())
	}

	return preview, nil
}

type driveIdentity struct {
	Name    string
	Website string
}

type driveIdentityIndex struct {
	pairs    map[driveIdentity]bool
	names    map[string]bool
	websites map[string]bool
}

func (d driveIdentityIndex) matches(identity driveIdentity) bool {
	if identity.Name != "" && identity.Website != "" && d.pairs[identity] {
		return true
	}
	if identity.Website != "" && d.websites[identity.Website] {
		return true
	}
	if identity.Name != "" && d.names[identity.Name] {
		return true
	}
	return false
}

func (h *Handler) fetchExistingImportIdentities() (driveIdentityIndex, error) {
	rows, err := h.Repo.DB.Query(`SELECT name, COALESCE(website, '') FROM organizations`)
	if err != nil {
		return driveIdentityIndex{}, err
	}
	defer rows.Close()

	identities := driveIdentityIndex{
		pairs:    map[driveIdentity]bool{},
		names:    map[string]bool{},
		websites: map[string]bool{},
	}
	for rows.Next() {
		var name, website string
		if err := rows.Scan(&name, &website); err != nil {
			return driveIdentityIndex{}, err
		}
		identity := normalizeImportIdentity(name, website)
		if identity.Name != "" {
			identities.names[identity.Name] = true
		}
		if identity.Website != "" {
			identities.websites[identity.Website] = true
		}
		if identity.Name != "" || identity.Website != "" {
			identities.pairs[identity] = true
		}
	}
	return identities, nil
}

type rawDriveRow struct {
	SourceRowNumber int
	Name            string
	Website         string
	Vertical        string
	SubVertical     string
	Country         string
	CityRegion      string
	Solucion        string
	Mail            string
	FoundersRaw     string
}

func (r rawDriveRow) toPreview() DriveImportRow {
	city, region := splitCityRegion(r.CityRegion)
	warnings := make([]string, 0)
	if strings.TrimSpace(r.Website) == "" {
		warnings = append(warnings, "Sin website")
	}
	if strings.TrimSpace(r.Country) == "" {
		warnings = append(warnings, "Sin país")
	}
	if strings.TrimSpace(city) == "" && strings.TrimSpace(region) == "" {
		warnings = append(warnings, "Sin ciudad o región")
	}

	return DriveImportRow{
		SourceRowNumber: r.SourceRowNumber,
		Name:            strings.TrimSpace(r.Name),
		Website:         normalizeWebsiteSafe(strings.TrimSpace(r.Website)),
		Vertical:        normalizeVertical(strings.TrimSpace(r.Vertical)),
		SubVertical:     cleanOptionalString(strings.TrimSpace(r.SubVertical)),
		OrganizationType: "startup",
		OutcomeStatus:    "active",
		Country:         normalizeCountrySafe(strings.TrimSpace(r.Country)),
		Region:          cleanOptionalString(region),
		City:            cleanOptionalString(city),
		Solucion:        cleanOptionalString(strings.TrimSpace(r.Solucion)),
		Notes:           "",
		Mail:            cleanOptionalString(strings.TrimSpace(r.Mail)),
		Founders:        splitFounders(r.FoundersRaw),
		Warnings:        warnings,
	}
}

func driveEntryToOrganization(entry DriveImportRow) *Organization {
	orgType := "startup"
	if clean := cleanOptionalString(entry.OrganizationType); clean != "" {
		orgType = clean
	}
	vertical := entry.Vertical
	if vertical == "" {
		vertical = "otra"
	}
	country := entry.Country
	if country == "" {
		country = "S/D"
	}

	var regionPtr *string
	if clean := cleanOptionalString(entry.Region); clean != "" {
		regionPtr = &clean
	}
	var cityPtr *string
	if clean := cleanOptionalString(entry.City); clean != "" {
		cityPtr = &clean
	}
	var websitePtr *string
	if clean := cleanOptionalString(entry.Website); clean != "" {
		websitePtr = &clean
	}
	var verticalPtr *string
	if clean := cleanOptionalString(vertical); clean != "" {
		verticalPtr = &clean
	}
	// En esta importación web priorizamos el alta exitosa.
	// La subvertical del Drive puede venir fuera de taxonomía y bloquear toda la creación,
	// así que por ahora no la persistimos en el alta automática.
	var subVerticalPtr *string
	var solutionPtr *string
	if clean := cleanOptionalString(entry.Solucion); clean != "" {
		solutionPtr = &clean
	}
	var mailPtr *string
	if clean := cleanOptionalString(entry.Mail); clean != "" {
		mailPtr = &clean
	}
	var orgTypePtr *string
	orgTypePtr = &orgType
	outcomeStatus := "active"
	if clean := cleanOptionalString(entry.OutcomeStatus); clean != "" {
		outcomeStatus = clean
	}
	var outcomeStatusPtr *string
	outcomeStatusPtr = &outcomeStatus
	var notesPtr *string
	if clean := cleanOptionalString(entry.Notes); clean != "" {
		notesPtr = &clean
	} else if vertical == "otra" && solutionPtr != nil {
		note := *solutionPtr
		notesPtr = &note
	}

	return &Organization{
		Name:             strings.TrimSpace(entry.Name),
		Website:          websitePtr,
		Vertical:         verticalPtr,
		SubVertical:      subVerticalPtr,
		Location:         Location{Country: country, Region: regionPtr, City: cityPtr},
		Solucion:         solutionPtr,
		Mail:             mailPtr,
		Founders:         entry.Founders,
		OrganizationType: orgTypePtr,
		OutcomeStatus:    outcomeStatusPtr,
		Notes:            notesPtr,
		Status:           StatusInReview,
	}
}

func fetchDriveRows() ([]rawDriveRow, error) {
	resp, err := http.Get(driveSheetExportURL())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return nil, fmt.Errorf("drive export error: %s %s", resp.Status, string(body))
	}

	reader := csv.NewReader(resp.Body)
	reader.FieldsPerRecord = -1

	headerRow, err := reader.Read()
	if err != nil {
		return nil, err
	}
	headerIndex := make(map[string]int)
	for idx, header := range headerRow {
		headerIndex[slugifyImportHeader(header)] = idx
	}

	rows := []rawDriveRow{}
	sourceRow := 1
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		sourceRow++
		rows = append(rows, rawDriveRow{
			SourceRowNumber: sourceRow,
			Name:            valueAt(record, headerIndex, "name"),
			Website:         valueAt(record, headerIndex, "website"),
			Vertical:        valueAt(record, headerIndex, "vertical"),
			SubVertical:     valueAt(record, headerIndex, "sub_vertical"),
			Country:         valueAt(record, headerIndex, "country"),
			CityRegion:      valueAt(record, headerIndex, "city_region"),
			Solucion:        valueAt(record, headerIndex, "solution"),
			Mail:            valueAt(record, headerIndex, "mail"),
			FoundersRaw:     valueAt(record, headerIndex, "founders"),
		})
	}

	return rows, nil
}

func valueAt(record []string, headers map[string]int, key string) string {
	index, ok := headers[key]
	if !ok || index >= len(record) {
		return ""
	}
	return strings.TrimSpace(record[index])
}

func slugifyImportHeader(value string) string {
	v := strings.ToLower(strings.TrimSpace(value))
	replacer := strings.NewReplacer(
		"á", "a", "é", "e", "í", "i", "ó", "o", "ú", "u", "ü", "u", "ñ", "n",
		"ã", "a", "ç", "c", "°", "", "?", "", "¿", "", `"`, "", "'", "",
		"(", " ", ")", " ", "/", " ", "-", " ", "_", " ", ".", " ", ",", " ",
	)
	v = replacer.Replace(v)
	v = strings.Join(strings.Fields(v), " ")
	switch {
	case strings.Contains(v, "sub vertical"):
		return "sub_vertical"
	case strings.Contains(v, "principal sede de operaciones"), strings.Contains(v, "pais donde se encuentra su principal sede de operaciones"):
		return "country"
	case strings.Contains(v, "ciudad region"):
		return "city_region"
	case strings.Contains(v, "descripcion"), strings.Contains(v, "solucion"):
		return "solution"
	case strings.Contains(v, "founder"):
		return "founders"
	case strings.HasPrefix(v, "mail"):
		return "mail"
	case strings.HasPrefix(v, "vertical"):
		return "vertical"
	case v == "website":
		return "website"
	case v == "name":
		return "name"
	default:
		return strings.ReplaceAll(v, " ", "_")
	}
}

func normalizeImportIdentity(name, website string) driveIdentity {
	return driveIdentity{
		Name:    normalizeComparableSafe(name),
		Website: normalizeWebsiteComparableSafe(website),
	}
}

func normalizeComparableSafe(value string) string {
	value = normalizeComparable(value)
	replacer := strings.NewReplacer("°", "", "'", "", "’", "")
	value = replacer.Replace(value)
	value = strings.Join(strings.Fields(value), " ")
	return value
}

func normalizeWebsiteComparableSafe(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" || value == "n/a" || value == "na" || value == "s/d" {
		return ""
	}
	return normalizeWebsiteComparable(value)
}

func normalizeWebsiteSafe(value string) string {
	value = strings.TrimSpace(value)
	if value == "" || strings.EqualFold(value, "n/a") || strings.EqualFold(value, "na") || strings.EqualFold(value, "s/d") {
		return ""
	}
	return value
}

func normalizeCountrySafe(value string) string {
	value = strings.TrimSpace(value)
	if value == "" || strings.EqualFold(value, "n/a") || strings.EqualFold(value, "na") || strings.EqualFold(value, "s/d") || strings.EqualFold(value, "n/d") {
		return ""
	}
	return value
}

func normalizeComparable(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	replacer := strings.NewReplacer(
		"á", "a", "é", "e", "í", "i", "ó", "o", "ú", "u", "ü", "u", "ñ", "n",
		"ã", "a", "ç", "c", "ı", "i", "°", "",
	)
	value = replacer.Replace(value)
	value = strings.Join(strings.Fields(value), " ")
	return value
}

func normalizeWebsiteComparable(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return ""
	}
	if !strings.Contains(value, "://") {
		value = "https://" + value
	}
	parsed, err := url.Parse(value)
	if err != nil {
		return strings.TrimSuffix(value, "/")
	}
	host := strings.TrimPrefix(parsed.Hostname(), "www.")
	path := strings.TrimSuffix(parsed.EscapedPath(), "/")
	if path == "" || path == "/" {
		return host
	}
	return host + path
}

func normalizeWebsite(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	return value
}

func normalizeVertical(value string) string {
	v := normalizeComparable(value)
	switch v {
	case "agtech", "agriculture":
		return "agtech"
	case "biotechnology & bioinputs", "biotechnology and bioinputs", "biotech":
		return "biotech_bioinputs"
	case "foodtech", "food":
		return "foodtech"
	case "climatech", "climate":
		return "climatech"
	case "circular economy", "circular":
		return "circular_economy"
	default:
		return "otra"
	}
}

func normalizeCountry(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	return value
}

func splitCityRegion(value string) (string, string) {
	value = strings.TrimSpace(value)
	if value == "" {
		return "", ""
	}
	parts := strings.Split(value, "/")
	if len(parts) >= 2 {
		return strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1])
	}
	return strings.TrimSpace(value), ""
}

func splitFounders(value string) []string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	founders := make([]string, 0, len(parts))
	for _, part := range parts {
		if clean := strings.TrimSpace(part); clean != "" {
			founders = append(founders, clean)
		}
	}
	return founders
}

func cleanOptionalString(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	if strings.EqualFold(value, "s/d") || strings.EqualFold(value, "n/d") {
		return ""
	}
	return value
}
