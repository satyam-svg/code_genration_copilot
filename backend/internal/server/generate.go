package server

import (
	"github.com/gofiber/fiber/v2"
)

type GenerateRequest struct {
	Prompt   string `json:"prompt"`
	Language string `json:"language"`
}

type GenerateResponse struct {
	Code string `json:"code"`
}

func (s *Server) GenerateCodeHandler(c *fiber.Ctx) error {
	var req GenerateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).SendString("Invalid request body")
	}

	// TODO: Integrate with AI model API here
	// For now, return a mock response
	resp := GenerateResponse{
		Code: "// Generated code for: " + req.Prompt + "\n// Language: " + req.Language + "\n\nfunc main() {\n\tprintln(\"Hello World\")\n}",
	}

	return c.JSON(resp)
}
