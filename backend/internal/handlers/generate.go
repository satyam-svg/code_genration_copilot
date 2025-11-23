package handlers

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type GenerateRequest struct {
	ChatID   *int   `json:"chatId,omitempty"`
	Prompt   string `json:"prompt"`
	Language string `json:"language"`
}

type GenerateResponse struct {
	ChatID int    `json:"chatId"`
	Code   string `json:"code"`
}

// GenerateCodeHandler handles code generation requests using Gemini API.
func (h *Handler) GenerateCodeHandler(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int)

	var req GenerateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"success": false, "message": "Invalid request body"})
	}

	// Create or get chat
	var chatID int
	var isNewChat bool
	if req.ChatID != nil {
		// Verify chat exists and belongs to user
		chat, err := h.db.GetChatByID(c.Context(), *req.ChatID)
		if err != nil || chat.UserID != userID {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"success": false, "message": "Invalid chat ID"})
		}
		chatID = *req.ChatID
		isNewChat = false
	} else {
		// Create new chat with a temporary title
		chat, err := h.db.CreateChat(c.Context(), userID, "New Chat")
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to create chat"})
		}
		chatID = chat.ID
		isNewChat = true
	}

	// Save user message
	_, err := h.db.CreateMessage(c.Context(), chatID, "user", req.Prompt, req.Language)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to save message"})
	}

	// Update chat title with first prompt if it's a new chat
	if isNewChat {
		// Truncate prompt to 50 characters for the title
		title := req.Prompt
		if len(title) > 50 {
			title = title[:50] + "..."
		}
		_ = h.db.UpdateChatTitle(c.Context(), chatID, title)
	}

	// Initialize Gemini client
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "GEMINI_API_KEY not set"})
	}
	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": fmt.Sprintf("Failed to create Gemini client: %v", err)})
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-2.5-flash")
	prompt := fmt.Sprintf("Generate %s code for: %s. Return ONLY the raw code. Do not include markdown formatting, backticks, or any explanations.", req.Language, req.Prompt)
	respAI, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": fmt.Sprintf("Gemini generation error: %v", err)})
	}
	if len(respAI.Candidates) == 0 || len(respAI.Candidates[0].Content.Parts) == 0 {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "No content returned from Gemini"})
	}
	generatedCode := fmt.Sprintf("%v", respAI.Candidates[0].Content.Parts[0])

	// Clean up the output to ensure only code is returned
	generatedCode = strings.TrimSpace(generatedCode)
	// Remove markdown code block delimiters if present
	if strings.HasPrefix(generatedCode, "```") {
		// Find the first newline to remove the opening tag (e.g., ```python)
		if newlineIdx := strings.Index(generatedCode, "\n"); newlineIdx != -1 {
			generatedCode = generatedCode[newlineIdx+1:]
		}
	}
	generatedCode = strings.TrimSuffix(generatedCode, "```")
	generatedCode = strings.TrimSpace(generatedCode)

	// Save AI response
	_, err = h.db.CreateMessage(c.Context(), chatID, "assistant", generatedCode, req.Language)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to save AI response"})
	}

	resp := GenerateResponse{
		ChatID: chatID,
		Code:   generatedCode,
	}
	return c.JSON(fiber.Map{"success": true, "data": resp})
}
