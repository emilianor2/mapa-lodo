package geocoding

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sync"
	"time"
)

type Result struct {
	Lat string `json:"lat"`
	Lon string `json:"lon"`
}

type CacheItem struct {
	Lat       float64
	Lng       float64
	ExpiresAt time.Time
}

type NominatimClient struct {
	UserAgent string
	cache     map[string]CacheItem
	mutex     sync.RWMutex
}

func NewNominatimClient(userAgent string) *NominatimClient {
	return &NominatimClient{
		UserAgent: userAgent,
		cache:     make(map[string]CacheItem),
	}
}

func (c *NominatimClient) Geocode(city, region, country string) (float64, float64, error) {
	query := fmt.Sprintf("%s, %s, %s", city, region, country)
	if region == "" {
		query = fmt.Sprintf("%s, %s", city, country)
	}

	// 1. Check cache
	c.mutex.RLock()
	item, ok := c.cache[query]
	c.mutex.RUnlock()

	if ok && time.Now().Before(item.ExpiresAt) {
		return item.Lat, item.Lng, nil
	}

	// 2. HTTP Call
	u := fmt.Sprintf("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=%s", url.QueryEscape(query))

	req, err := http.NewRequest("GET", u, nil)
	if err != nil {
		return 0, 0, err
	}
	req.Header.Set("User-Agent", c.UserAgent)

	httpClient := &http.Client{Timeout: 5 * time.Second}
	resp, err := httpClient.Do(req)
	if err != nil {
		return 0, 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, 0, fmt.Errorf("geocoding service returned status %d", resp.StatusCode)
	}

	var results []Result
	if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
		return 0, 0, err
	}

	if len(results) == 0 {
		return 0, 0, fmt.Errorf("no results found")
	}

	var lat, lng float64
	_, err = fmt.Sscanf(results[0].Lat, "%f", &lat)
	if err != nil {
		return 0, 0, err
	}
	_, err = fmt.Sscanf(results[0].Lon, "%f", &lng)
	if err != nil {
		return 0, 0, err
	}

	// 3. Update cache (24h)
	c.mutex.Lock()
	c.cache[query] = CacheItem{
		Lat:       lat,
		Lng:       lng,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}
	c.mutex.Unlock()

	return lat, lng, nil
}
