package repository

import (
	"encoding/json"
	"net/http"
	"time"

	apperrors "todo/pkg/errors"

	"github.com/matthewhartstonge/argon2"
	"go.etcd.io/bbolt"
)

type User struct {
	UserID    int    `json:"user_id"`
	Username  string `json:"username"`
	Password  string `json:"password"  mirror:"-"`
	CreatedAt int64  `json:"createdAt"`
}

func (u *User) VerifyPassword(password string) (bool, error) {
	return argon2Verify(u.Password, password)
}

type CreateUserInput struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type userRepository struct {
	db *bbolt.DB
}

type UserRepository interface {
	Create(CreateUserInput) (User, error)
	FindByUsername(username string) (User, error)
}

func (r *userRepository) Create(data CreateUserInput) (User, error) {
	user := User{
		Username:  data.Username,
		CreatedAt: time.Now().Unix(),
	}

	hash, err := argon2Hash(data.Password)
	if err != nil {
		return user, err
	}
	user.Password = string(hash)

	err = r.db.Update(func(tx *bbolt.Tx) error {
		bucket := tx.Bucket([]byte("users"))

		// Generate a new user ID
		id, _ := bucket.NextSequence()
		user.UserID = int(id)

		// Check if the user already exists
		if bucket.Get([]byte(data.Username)) != nil {
			return apperrors.Error{Message: "User already exists", Code: http.StatusConflict}
		}

		encoded, err := json.Marshal(user)
		if err != nil {
			return err
		}

		return bucket.Put([]byte(data.Username), encoded)
	})
	if err != nil {
		return user, err
	}

	return user, nil
}

func (r *userRepository) FindByUsername(username string) (User, error) {
	var user User
	err := r.db.View(func(tx *bbolt.Tx) error {
		bucket := tx.Bucket([]byte("users"))
		v := bucket.Get([]byte(username))
		if v == nil {
			return apperrors.Error{
				Message: "Invalid credentials provided",
				Code:    http.StatusNotFound,
			}
		}

		return json.Unmarshal(v, &user)
	})
	if err != nil {
		return user, err
	}

	return user, nil
}

func argon2Hash(password string) ([]byte, error) {
	argon := argon2.DefaultConfig()
	return argon.HashEncoded([]byte(password))
}

func argon2Verify(hash, password string) (bool, error) {
	return argon2.VerifyEncoded([]byte(password), []byte(hash))
}
