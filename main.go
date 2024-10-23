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
	"go.trulyao.dev/robin/types"
	_ "go.trulyao.dev/seer"
)

func initDB() *bbolt.DB {
	db, err := bbolt.Open("todos.db", 0o600, nil)
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

	i, err := r.
		// Queries
		Add(q("whoami", h.WhoAmI, h.RequireAuth)).
		Add(q("list-todos", h.List, h.RequireAuth)).
		Add(q("get-todo", h.Get, h.RequireAuth)).
		// Mutations
		Add(m("sign-in", h.SignIn)).
		Add(m("sign-up", h.SignUp)).
		Add(m("sign-out", h.SignOut)).
		Add(m("create-todo", h.Create, h.RequireAuth)).
		Add(m("delete-todo", h.Delete, h.RequireAuth)).
		Add(m("toggle-completed", h.ToggleCompleted, h.RequireAuth)).
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

func q[T, K any](
	name string,
	handler robin.QueryFn[T, K],
	middlewares ...types.Middleware,
) robin.Procedure {
	return robin.Query(name, handler).WithMiddleware(middlewares...)
}

func m[T, K any](
	name string,
	handler robin.MutationFn[T, K],
	middlewares ...types.Middleware,
) robin.Procedure {
	return robin.Mutation(name, handler).WithMiddleware(middlewares...)
}
