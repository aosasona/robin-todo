package main

// This demo does not represent a production-ready application nor best practices, this is simply for demonstration purposes.
import (
	"log"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"todo/handler"
	"todo/repository"
	"todo/ui"

	apperrors "todo/pkg/errors"

	"go.etcd.io/bbolt"
	"go.trulyao.dev/robin"
)

func initDB() *bbolt.DB {
	// Create a data directory if it does not exist
	if _, err := os.Stat("data"); os.IsNotExist(err) {
		if err := os.Mkdir("data", 0o755); err != nil {
			log.Fatalf("Failed to create data directory: %s", err)
		}
	}

	// Initialize BoltDB
	db, err := bbolt.Open("data/todos.db", 0o600, nil)
	if err != nil {
		log.Fatalf("Failed to open BoltDB: %s", err)
	}

	// Create buckets
	err = db.Update(func(tx *bbolt.Tx) error {
		if _, err = tx.CreateBucketIfNotExists([]byte("users")); err != nil {
			return err
		}

		if _, err = tx.CreateBucketIfNotExists([]byte("todos")); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		log.Fatalf("Failed to create buckets: %s", err)
	}

	return db
}

func main() {
	r, err := robin.New(robin.Options{
		CodegenOptions: robin.CodegenOptions{
			Path:             "./ui/src/lib",
			GenerateBindings: true,
			ThrowOnError:     true,
		},
		ErrorHandler: apperrors.ErrorHandler,
	})
	if err != nil {
		log.Fatalf("Failed to create a new Robin instance: %s", err)
	}

	db := initDB()
	repo := repository.New(db)
	h := handler.New(repo)

	r.Use("require-auth", h.RequireAuth)

	i, err := r.
		// Queries
		Add(robin.Q("whoami", h.WhoAmI)).
		Add(robin.Q("list-todos", h.List)).
		Add(robin.Q("get-todo", h.Get)).
		// Mutations
		Add(robin.M("sign-in", h.SignIn).ExcludeMiddleware("require-auth")).
		Add(robin.M("sign-up", h.SignUp).ExcludeMiddleware("require-auth")).
		Add(robin.M("sign-out", h.SignOut).ExcludeMiddleware("require-auth")).
		Add(robin.M("create-todo", h.Create)).
		Add(robin.M("delete-todo", h.Delete)).
		Add(robin.M("toggle-completed", h.ToggleCompleted)).
		Build()
	if err != nil {
		log.Fatalf("Failed to build Robin instance: %s", err)
	}

	if err := i.Export(); err != nil {
		log.Fatalf("Failed to export client: %s", err)
	}

	serve(i.Handler())
}

func serve(handler http.HandlerFunc) {
	// Check if it is using `go run ...` in development mode
	isDev := strings.HasPrefix(os.Args[0], os.TempDir()) || strings.Contains(os.Args[0], "tmp")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	corsOpts := &robin.CorsOptions{
		Origins:          []string{"http://localhost:5173"},
		AllowCredentials: true,
	}

	mux := http.NewServeMux()

	mux.HandleFunc("POST /_robin", func(w http.ResponseWriter, r *http.Request) {
		if isDev {
			robin.CorsHandler(w, corsOpts)
		}
		handler(w, r)
	})

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" && isDev {
			robin.PreflightHandler(w, corsOpts)
			return
		}

		ui.ServeSPA(w, r)
	})

	if isDev {
		slog.Info("🔒 CORS enabled for development")
	}

	slog.Info("📡 Listening on :" + port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Failed to serve Robin instance: %s", err)
	}
}
