package handler

import (
	"fmt"
	"log/slog"
	"net/http"

	"todo/repository"

	apperrors "todo/pkg/errors"

	"go.trulyao.dev/robin"
)

type ListTodoResult struct {
	Complete   []repository.Todo `json:"complete"`
	Incomplete []repository.Todo `json:"incomplete"`
}

func (h *handler) List(ctx *robin.Context, _ robin.Void) (ListTodoResult, error) {
	user, ok := ctx.Get("user").(repository.User)
	if !ok {
		slog.Error(
			"failed to get user from context",
			slog.String("user", fmt.Sprintf("%+v", ctx.Get("user"))),
		)

		return ListTodoResult{}, apperrors.New(
			http.StatusInternalServerError,
			"You need to be signed in",
		)
	}

	todos, err := h.repository.TodoRepo().FindByUserID(user.UserID)
	if err != nil {
		slog.Error("failed to fetch todos", slog.String("err", err.Error()))
		return ListTodoResult{}, apperrors.New(
			http.StatusInternalServerError,
			"Failed to fetch tasks",
		)
	}

	// We don't need this extra transform and can just handle it on the client side but this is just an example
	var result ListTodoResult
	for _, todo := range todos {
		if todo.Completed {
			result.Complete = append(result.Complete, todo)
		} else {
			result.Incomplete = append(result.Incomplete, todo)
		}
	}

	return result, nil
}

func (h *handler) Create(
	ctx *robin.Context,
	input repository.CreateTodoInput,
) (repository.Todo, error) {
	user, ok := ctx.Get("user").(repository.User)
	if !ok {
		slog.Error(
			"failed to get user from context",
			slog.String("user", fmt.Sprintf("%+v", ctx.Get("user"))),
		)

		return repository.Todo{}, apperrors.New(
			http.StatusInternalServerError,
			"You need to be signed in to create a todo",
		)
	}

	// Minor validation
	if input.Title == "" {
		return repository.Todo{}, apperrors.New(
			http.StatusBadRequest,
			"title is required",
		)
	}

	input.UserID = user.UserID
	todo, err := h.repository.TodoRepo().Create(input)
	if err != nil {
		slog.Error("failed to create todo", slog.String("err", err.Error()))
		return repository.Todo{}, apperrors.New(
			http.StatusInternalServerError,
			"failed to create todo",
		)
	}

	return todo, nil
}

func (h *handler) Delete(
	ctx *robin.Context,
	id int,
) (robin.Void, error) {
	user, ok := ctx.Get("user").(repository.User)
	if !ok {
		slog.Error(
			"failed to get user from context",
			slog.String("user", fmt.Sprintf("%+v", ctx.Get("user"))),
		)

		return robin.Void{}, apperrors.New(
			http.StatusInternalServerError,
			"You need to be signed in to delete a todo",
		)
	}

	if err := h.repository.TodoRepo().Delete(id, user.UserID); err != nil {
		slog.Error("failed to delete todo", slog.String("err", err.Error()))

		return robin.Void{}, apperrors.New(
			http.StatusInternalServerError,
			"Failed to delete task",
		)
	}

	return robin.Void{}, nil
}

func (h *handler) ToggleCompleted(
	ctx *robin.Context,
	id int,
) (robin.Void, error) {
	user, ok := ctx.Get("user").(repository.User)
	if !ok {
		slog.Error(
			"failed to get user from context",
			slog.String("user", fmt.Sprintf("%+v", ctx.Get("user"))),
		)

		return robin.Void{}, apperrors.New(
			http.StatusInternalServerError,
			"You need to be signed in to complete this action",
		)
	}

	if err := h.repository.TodoRepo().ToggleCompleted(id, user.UserID); err != nil {
		slog.Error("failed to toggle todo", slog.String("err", err.Error()))
		return robin.Void{}, apperrors.New(http.StatusInternalServerError, "Failed to toggle task")
	}

	return robin.Void{}, nil
}
