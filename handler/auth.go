package handler

import (
	"encoding/base64"
	"log/slog"
	"net/http"
	"os"

	"todo/repository"

	apperrors "todo/pkg/errors"

	"go.trulyao.dev/robin"
)

type User struct {
	UserID    int    `json:"user_id"`
	Username  string `json:"username"`
	CreatedAt int64  `json:"created_at"`
}

type SignInInput struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *handler) WhoAmI(ctx *robin.Context, _ robin.Void) (User, error) {
	user, ok := ctx.Get("user").(repository.User)
	if !ok {
		return User{}, apperrors.New(http.StatusUnauthorized, "Unauthorized")
	}

	return User{
		UserID:    user.UserID,
		Username:  user.Username,
		CreatedAt: user.CreatedAt,
	}, nil
}

func (h *handler) SignIn(ctx *robin.Context, data SignInInput) (User, error) {
	user, err := h.repository.UserRepo().FindByUsername(data.Username)
	if err != nil {
		return User{}, err
	}

	matches, err := user.VerifyPassword(data.Password)
	if !matches {
		return User{}, apperrors.New(http.StatusUnauthorized, "Invalid credentials")
	}

	if err != nil {
		slog.Debug(
			"Failed to verify password",
			slog.String("username", user.Username),
			slog.String("error", err.Error()),
		)
		return User{}, err
	}

	base64username := base64.StdEncoding.EncodeToString([]byte(user.Username))
	cookie := http.Cookie{
		Name:     "auth",
		Value:    base64username,
		HttpOnly: true,
		Secure:   os.Getenv("ENV") == "production",
		SameSite: http.SameSiteNoneMode,
		Path:     "/",
		Domain:   "localhost",
	}
	http.SetCookie(ctx.Response(), &cookie)

	return User{
		UserID:    user.UserID,
		Username:  user.Username,
		CreatedAt: user.CreatedAt,
	}, nil
}

func (h *handler) SignUp(
	ctx *robin.Context,
	data repository.CreateUserInput,
) (robin.Void, error) {
	if data.Username == "" {
		return robin.Void{}, apperrors.New(http.StatusBadRequest, "Username is required")
	}

	if data.Password == "" {
		return robin.Void{}, apperrors.New(http.StatusBadRequest, "Password is required")
	}

	if len(data.Password) < 6 {
		return robin.Void{}, apperrors.New(
			http.StatusBadRequest,
			"Password must be at least 6 characters long",
		)
	}

	_, err := h.repository.UserRepo().Create(data)
	if err != nil {
		return robin.Void{}, err
	}

	return robin.Void{}, nil
}
