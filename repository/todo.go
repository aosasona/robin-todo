package repository

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"go.etcd.io/bbolt"
)

type Todo struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Completed   bool   `json:"completed"`
	CreatedAt   int64  `json:"createdAt"`
	LastUpdated int64  `json:"lastUpdated"`
}

type todoRepository struct {
	db *bbolt.DB
}

type CreateTodoInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Completed   bool   `json:"completed"`
	UserID      int    `json:"-"` // UserID is not exposed to the client, we will set this in the handler
}

type TodoRepository interface {
	Create(CreateTodoInput) (Todo, error)
	FindByUserID(id int) ([]Todo, error)
	FindByID(id, userID int) (Todo, error)
	Delete(id, userID int) error
	ToggleCompleted(id, userID int) error
}

func (r *todoRepository) Create(data CreateTodoInput) (Todo, error) {
	todo := Todo{
		Title:       data.Title,
		Description: data.Description,
		Completed:   data.Completed,
		CreatedAt:   time.Now().Unix(),
		LastUpdated: time.Now().Unix(),
	}

	err := r.db.Update(func(tx *bbolt.Tx) error {
		id, err := tx.Bucket([]byte("todos")).NextSequence()
		if err != nil {
			return err
		}
		todo.ID = int(id)

		b, err := json.Marshal(todo)
		if err != nil {
			return err
		}

		recordID := fmt.Sprintf("%d:%d", data.UserID, todo.ID)
		return tx.Bucket([]byte("todos")).Put([]byte(recordID), b)
	})

	return todo, err
}

func (r *todoRepository) FindByID(id, userID int) (Todo, error) {
	var todo Todo

	err := r.db.View(func(tx *bbolt.Tx) error {
		key := fmt.Sprintf("%d:%d", userID, id)
		v := tx.Bucket([]byte("todos")).Get([]byte(key))
		if v == nil {
			return fmt.Errorf("Task with id %d not found", id)
		}

		return json.Unmarshal(v, &todo)
	})

	return todo, err
}

func (r *todoRepository) FindByUserID(userID int) ([]Todo, error) {
	var todos []Todo

	err := r.db.View(func(tx *bbolt.Tx) error {
		bucket := tx.Bucket([]byte("todos"))
		cursor := bucket.Cursor()

		strUserID := strconv.Itoa(userID)
		prefix := []byte(strUserID + ":")

		for k, v := cursor.Seek(prefix); k != nil && bytes.HasPrefix(k, prefix); k, v = cursor.Next() {
			if strUserID != string(k[:len(strUserID)]) {
				continue
			}

			var todo Todo
			if err := json.Unmarshal(v, &todo); err != nil {
				return err
			}

			todos = append(todos, todo)
		}

		return nil
	})

	return todos, err
}

func (r *todoRepository) Delete(id int, userID int) error {
	return r.db.Update(func(tx *bbolt.Tx) error {
		key := fmt.Sprintf("%d:%d", userID, id)
		return tx.Bucket([]byte("todos")).Delete([]byte(key))
	})
}

func (r *todoRepository) ToggleCompleted(id int, userID int) error {
	return r.db.Update(func(tx *bbolt.Tx) error {
		key := fmt.Sprintf("%d:%d", userID, id)
		b := tx.Bucket([]byte("todos"))

		v := b.Get([]byte(key))
		if v == nil {
			return fmt.Errorf("todo with id %d not found", id)
		}

		var todo Todo
		if err := json.Unmarshal(v, &todo); err != nil {
			return err
		}

		todo.Completed = !todo.Completed
		todo.LastUpdated = time.Now().Unix()

		data, err := json.Marshal(todo)
		if err != nil {
			return err
		}

		return b.Put([]byte(key), data)
	})
}
