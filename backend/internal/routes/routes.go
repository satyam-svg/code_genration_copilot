package routes

import (
	"backend/internal/handlers"
	"backend/internal/middleware"

	"github.com/gofiber/fiber/v2"
)

// RegisterRoutes sets up all application routes
func RegisterRoutes(app *fiber.App, h *handlers.Handler) {
	// Public routes (no authentication required)
	app.Get("/health", h.HealthHandler)

	// API v1 routes with /api/v1 prefix
	v1 := app.Group("/api/v1")

	// Public API routes
	auth := v1.Group("/auth")
	auth.Post("/signup", h.SignupHandler)
	auth.Post("/login", h.LoginHandler)

	// Protected API routes (require authentication)
	protected := v1.Group("")
	protected.Use(middleware.AuthMiddleware())
	protected.Post("/generate", h.GenerateCodeHandler)

	// Chat routes
	protected.Post("/chats", h.CreateChatHandler)
	protected.Get("/chats", h.GetChatsHandler)
	protected.Get("/chats/:id", h.GetChatHandler)
}
