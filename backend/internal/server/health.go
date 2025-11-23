package server

import (
	"github.com/gofiber/fiber/v2"
)

func (s *Server) HealthHandler(c *fiber.Ctx) error {
	resp := s.db.Health()
	return c.JSON(resp)
}
