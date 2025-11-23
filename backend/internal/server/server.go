package server

import (
	"backend/internal/database"
	"backend/internal/handlers"
	"backend/internal/routes"

	"github.com/gofiber/fiber/v2"
)

type Server struct {
	db      database.Service
	handler *handlers.Handler
}

func NewServer(db database.Service) *Server {
	return &Server{
		db:      db,
		handler: handlers.NewHandler(db),
	}
}

func (s *Server) RegisterRoutes(app *fiber.App) {
	routes.RegisterRoutes(app, s.handler)
}
