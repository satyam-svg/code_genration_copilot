package handlers

import (
	"backend/internal/database"

	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	db database.Service
}

func NewHandler(db database.Service) *Handler {
	return &Handler{
		db: db,
	}
}

func (h *Handler) HealthHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "ok",
		"message": "Server is running",
	})
}
