package organizations

import (
	"database/sql"
	"encoding/json"
	"strconv"
	"strings"
)

type Repository struct {
	DB *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{DB: db}
}

// orgSelectColumns refleja la estructura exacta de la nueva tabla corporativa
const orgSelectColumns = `
	id, name, website, vertical, sub_vertical, country, region, city,
	logo_url, estadio_actual, solucion, mail, social_media, contact_phone,
	founders, founded, organization_type, outcome_status, business_model, badges,
	notes, status, lat, lng, created_at, updated_at
`

// --- MÉTODOS DE PERSISTENCIA CORE ---

func (r *Repository) Create(org *Organization) error {
	_, err := r.DB.Exec(`
		INSERT INTO organizations (
			id, name, website, vertical, sub_vertical, country, region, city,
			logo_url, estadio_actual, solucion, mail, social_media, contact_phone,
			founders, founded, organization_type, outcome_status, business_model, badges,
			notes, status, lat, lng
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		org.ID, org.Name, org.Website, org.Vertical, org.SubVertical,
		org.Country, org.Region, org.City, org.LogoURL, org.EstadioActual,
		org.Solucion, org.Mail, toJSON(org.SocialMedia), org.ContactPhone,
		toJSON(org.Founders), org.Founded, org.OrganizationType, org.OutcomeStatus,
		org.BusinessModel, toJSON(org.Badges), org.Notes, org.Status, org.Lat, org.Lng,
	)
	return err
}

func (r *Repository) Update(org *Organization) error {
	_, err := r.DB.Exec(`
		UPDATE organizations SET 
			name = ?, website = ?, vertical = ?, sub_vertical = ?, 
			country = ?, region = ?, city = ?, logo_url = ?, 
			estadio_actual = ?, solucion = ?, mail = ?, social_media = ?, 
			contact_phone = ?, founders = ?, founded = ?, 
			organization_type = ?, outcome_status = ?, business_model = ?, 
			badges = ?, notes = ?, lat = ?, lng = ?, 
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`,
		org.Name, org.Website, org.Vertical, org.SubVertical,
		org.Country, org.Region, org.City, org.LogoURL,
		org.EstadioActual, org.Solucion, org.Mail, toJSON(org.SocialMedia),
		org.ContactPhone, toJSON(org.Founders), org.Founded,
		org.OrganizationType, org.OutcomeStatus, org.BusinessModel,
		toJSON(org.Badges), org.Notes, org.Lat, org.Lng, org.ID,
	)
	return err
}

func (r *Repository) Delete(id string) error {
	_, err := r.DB.Exec(`DELETE FROM organizations WHERE id = ?`, id)
	return err
}

func (r *Repository) UpdateStatus(id string, status OrganizationStatus) error {
	_, err := r.DB.Exec(`UPDATE organizations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, status, id)
	return err
}

func (r *Repository) UpdateCoordinates(id string, lat, lng float64) error {
	_, err := r.DB.Exec(`UPDATE organizations SET lat = ?, lng = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, lat, lng, id)
	return err
}

// --- MÉTODOS DE CONSULTA ---

func (r *Repository) FindByID(id string) (*Organization, error) {
	row := r.DB.QueryRow(`SELECT `+orgSelectColumns+` FROM organizations WHERE id = ?`, id)
	return r.scanOrg(row)
}

func (r *Repository) FindPublishedByID(id string) (*Organization, error) {
	row := r.DB.QueryRow(`SELECT `+orgSelectColumns+` FROM organizations WHERE id = ? AND status = 'PUBLISHED'`, id)
	return r.scanOrg(row)
}

func (r *Repository) FindAll() ([]Organization, error) {
	return r.FindFiltered(map[string]string{})
}

func (r *Repository) FindFiltered(params map[string]string) ([]Organization, error) {
	query := `SELECT ` + orgSelectColumns + ` FROM organizations WHERE 1=1`

	whereSQL, args := r.buildWhereClause(params)
	query += whereSQL + " ORDER BY updated_at DESC"

	if limitStr := params["limit"]; limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			query += " LIMIT ?"
			args = append(args, limit)
			if offsetStr := params["offset"]; offsetStr != "" {
				if offset, err := strconv.Atoi(offsetStr); err == nil {
					query += " OFFSET ?"
					args = append(args, offset)
				}
			}
		}
	}

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orgs := make([]Organization, 0)
	for rows.Next() {
		org, err := r.scanOrg(rows)
		if err != nil {
			return nil, err
		}
		orgs = append(orgs, *org)
	}
	return orgs, nil
}

func (r *Repository) GetAggregates(params map[string]string) (*AggregatesResponse, error) {
	if params == nil {
		params = make(map[string]string)
	}
	if params["status"] == "" {
		params["status"] = "PUBLISHED"
	}

	whereSQL, args := r.buildWhereClause(params)

	resp := &AggregatesResponse{}
	var err error

	resp.Countries, err = r.fetchAggregation("country", false, whereSQL, args)
	resp.Verticals, err = r.fetchAggregation("vertical", false, whereSQL, args)
	resp.SubVerticals, err = r.fetchAggregation("sub_vertical", true, whereSQL, args)
	resp.OrganizationTypes, err = r.fetchAggregation("organization_type", false, whereSQL, args)
	resp.Estadios, err = r.fetchAggregation("estadio_actual", true, whereSQL, args)
	resp.OutcomeStatuses, err = r.fetchAggregation("outcome_status", false, whereSQL, args)
	resp.Regions, err = r.fetchAggregation("region", true, whereSQL, args)
	resp.Cities, err = r.fetchAggregation("city", true, whereSQL, args)

	if err != nil {
		return nil, err
	}
	return resp, nil
}

// --- HELPERS INTERNOS ---

func (r *Repository) scanOrg(scanner interface{ Scan(dest ...any) error }) (*Organization, error) {
	var org Organization
	var socialJ, foundersJ, badgesJ *string

	err := scanner.Scan(
		&org.ID, &org.Name, &org.Website, &org.Vertical, &org.SubVertical,
		&org.Country, &org.Region, &org.City, &org.LogoURL, &org.EstadioActual,
		&org.Solucion, &org.Mail, &socialJ, &org.ContactPhone, &foundersJ,
		&org.Founded, &org.OrganizationType, &org.OutcomeStatus, &org.BusinessModel,
		&badgesJ, &org.Notes, &org.Status, &org.Lat, &org.Lng, &org.CreatedAt, &org.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	fromJSON(socialJ, &org.SocialMedia)
	fromJSON(foundersJ, &org.Founders)
	fromJSON(badgesJ, &org.Badges)

	return &org, nil
}

func (r *Repository) buildWhereClause(params map[string]string) (string, []interface{}) {
	var query string
	args := make([]interface{}, 0)

	if status := params["status"]; status != "" {
		query += " AND status = ?"
		args = append(args, status)
	}
	if vertical := params["vertical"]; vertical != "" {
		query += " AND vertical = ?"
		args = append(args, vertical)
	}
	if country := params["country"]; country != "" {
		query += " AND country = ?"
		args = append(args, country)
	}
	if estadio := params["estadioActual"]; estadio != "" {
		query += " AND estadio_actual = ?"
		args = append(args, estadio)
	}
	if region := params["region"]; region != "" {
		query += " AND region = ?"
		args = append(args, region)
	}
	if city := params["city"]; city != "" {
		query += " AND city = ?"
		args = append(args, city)
	}
	if q := params["q"]; q != "" {
		query += " AND (name LIKE ? OR solucion LIKE ? OR city LIKE ? OR country LIKE ?)"
		like := "%" + q + "%"
		args = append(args, like, like, like, like)
	}
	if params["onlyMappable"] == "true" {
		query += " AND lat IS NOT NULL AND lng IS NOT NULL"
	}
	if bbox := params["bbox"]; bbox != "" {
		parts := strings.Split(bbox, ",")
		if len(parts) == 4 {
			query += " AND lat >= ? AND lng >= ? AND lat <= ? AND lng <= ?"
			args = append(args, parts[0], parts[1], parts[2], parts[3])
		}
	}
	return query, args
}

func (r *Repository) fetchAggregation(column string, ignoreEmpty bool, whereSQL string, args []interface{}) ([]AggregateItem, error) {
	query := "SELECT " + column + " as value, COUNT(*) as count FROM organizations WHERE 1=1 " + whereSQL
	if ignoreEmpty {
		query += " AND " + column + " IS NOT NULL AND " + column + " <> ''"
	}
	query += " GROUP BY " + column + " ORDER BY count DESC, value ASC"

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]AggregateItem, 0)
	for rows.Next() {
		var i AggregateItem
		var ns sql.NullString
		if err := rows.Scan(&ns, &i.Count); err != nil {
			return nil, err
		}
		i.Value = ns.String
		items = append(items, i)
	}
	return items, nil
}

// --- HELPERS DE SERIALIZACIÓN JSON ---

func toJSON(v any) *string {
	if v == nil {
		return nil
	}
	b, err := json.Marshal(v)
	if err != nil {
		return nil
	}
	res := string(b)
	return &res
}

func fromJSON(s *string, dst any) {
	if s == nil || *s == "" || *s == "null" {
		return
	}
	_ = json.Unmarshal([]byte(*s), dst)
}
