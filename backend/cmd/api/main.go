package main

import (
	"log"
	"log/slog" // <-- Mejora 2: Logs estructurados
	"net/http"
	"os"
	"strings"

	"backend/internal/audit"
	"backend/internal/auth"
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/geocoding"
	httpmw "backend/internal/http"
	"backend/internal/organizations"
	"backend/internal/taxonomies"
)

func main() {
	// Configurar el logger global para escribir en JSON a la salida estándar
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// 1. Cargar configuración
	cfg := config.Load()

	// 2. Conectar a la base de datos
	db, err := database.Connect(cfg)
	if err != nil {
		slog.Error("Critical: database connection failed", "error", err)
		os.Exit(1)
	}

	slog.Info("MariaDB connected successfully", "host", cfg.DBHost)

	// 3. Inicializar capas
	orgRepo := organizations.NewRepository(db)
	auditRepo := audit.NewRepository(db)
	taxRepo := taxonomies.NewRepository(db)

	geocoder := geocoding.NewNominatimClient("LODO-Geocode-MVP")
	orgService := organizations.NewService(orgRepo, auditRepo, taxRepo, geocoder)
	orgHandler := organizations.NewHandler(orgService, orgRepo, geocoder)
	taxHandler := taxonomies.NewHandler(taxRepo)

	authRepo := auth.NewRepository(db)
	authHandler := auth.NewHandler(authRepo)

	// 4. Router HTTP Principal
	mux := http.NewServeMux()

	// Mejora A: Healthcheck con validación de DB
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		if err := db.Ping(); err != nil {
			slog.Warn("Healthcheck failed: DB unreachable", "error", err)
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// --- RUTAS ---
	publicMux := http.NewServeMux()
	publicMux.HandleFunc("/public/organizations", orgHandler.ListPublic)
	publicMux.HandleFunc("/public/organizations/aggregates", orgHandler.Aggregates)
	publicMux.HandleFunc("/public/organizations/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/public/organizations/" {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}
		orgHandler.GetPublicByID(w, r)
	})
	publicMux.HandleFunc("/public/taxonomies", taxHandler.ListPublic)
	publicMux.HandleFunc("/auth/login", authHandler.Login)
	publicMux.HandleFunc("/auth/register", authHandler.Register)
	publicMux.HandleFunc("/auth/me", authHandler.Me)
	publicMux.HandleFunc("/auth/logout", authHandler.Logout)
	publicMux.HandleFunc("/auth/change-password", authHandler.ChangePassword)

	adminMux := http.NewServeMux()
	adminMux.HandleFunc("/organizations", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			orgHandler.List(w, r)
		} else if r.Method == http.MethodPost {
			orgHandler.Create(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	adminMux.HandleFunc("/organizations/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case strings.HasSuffix(path, "/review"):
			orgHandler.SubmitForReview(w, r)
		case strings.HasSuffix(path, "/publish"):
			orgHandler.Publish(w, r)
		case strings.HasSuffix(path, "/archive"):
			orgHandler.Archive(w, r)
		case strings.HasSuffix(path, "/geocode"):
			orgHandler.Geocode(w, r)
		case strings.HasSuffix(path, "/coordinates"):
			orgHandler.PatchCoordinates(w, r)
		default:
			switch r.Method {
			case http.MethodGet:
				orgHandler.GetByID(w, r)
			case http.MethodPut, http.MethodPost:
				orgHandler.Update(w, r)
			case http.MethodDelete:
				orgHandler.Delete(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		}
	})

	mux.Handle("/public/", publicMux)
	mux.Handle("/auth/", publicMux)
	mux.Handle("/organizations", httpmw.AuthWithUser(cfg, adminMux))
	mux.Handle("/organizations/", httpmw.AuthWithUser(cfg, adminMux))

	// 5. Servidor
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	slog.Info("Server starting", "port", port)
	log.Fatal(http.ListenAndServe(":"+port, httpmw.CORS(mux)))
}
