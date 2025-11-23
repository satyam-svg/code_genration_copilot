package handlers

import (
	"backend/internal/database"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type CreateChatRequest struct {
	Title string `json:"title"`
}

type ChatResponse struct {
	ID        int    `json:"id"`
	Title     string `json:"title"`
	UserID    int    `json:"userId"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

type MessageResponse struct {
	ID        int    `json:"id"`
	ChatID    int    `json:"chatId"`
	Role      string `json:"role"`
	Content   string `json:"content"`
	Language  string `json:"language,omitempty"`
	CreatedAt string `json:"createdAt"`
}

type ChatWithMessagesResponse struct {
	Chat     ChatResponse      `json:"chat"`
	Messages []MessageResponse `json:"messages"`
}

// CreateChatHandler creates a new chat session
func (h *Handler) CreateChatHandler(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int)

	var req CreateChatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"success": false, "message": "Invalid request body"})
	}

	title := req.Title
	if title == "" {
		title = "New Chat"
	}

	chat, err := h.db.CreateChat(c.Context(), userID, title)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to create chat"})
	}

	resp := ChatResponse{
		ID:        chat.ID,
		Title:     chat.Title,
		UserID:    chat.UserID,
		CreatedAt: chat.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: chat.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	return c.JSON(fiber.Map{"success": true, "data": resp})
}

// GetChatsHandler returns all chats for the authenticated user
func (h *Handler) GetChatsHandler(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int)

	chats, err := h.db.GetChatsByUser(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to get chats"})
	}

	var chatResponses []ChatResponse
	for _, chat := range chats {
		chatResponses = append(chatResponses, ChatResponse{
			ID:        chat.ID,
			Title:     chat.Title,
			UserID:    chat.UserID,
			CreatedAt: chat.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: chat.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	return c.JSON(fiber.Map{"success": true, "data": chatResponses})
}

// GetChatHandler returns a specific chat with its messages
func (h *Handler) GetChatHandler(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int)
	chatIDStr := c.Params("id")

	chatID, err := strconv.Atoi(chatIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"success": false, "message": "Invalid chat ID"})
	}

	chat, err := h.db.GetChatByID(c.Context(), chatID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"success": false, "message": "Chat not found"})
	}

	// Verify ownership
	if chat.UserID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"success": false, "message": "Access denied"})
	}

	messages, err := h.db.GetMessagesByChat(c.Context(), chatID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to get messages"})
	}

	var messageResponses []MessageResponse
	for _, msg := range messages {
		messageResponses = append(messageResponses, MessageResponse{
			ID:        msg.ID,
			ChatID:    msg.ChatID,
			Role:      msg.Role,
			Content:   msg.Content,
			Language:  msg.Language,
			CreatedAt: msg.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	resp := ChatWithMessagesResponse{
		Chat: ChatResponse{
			ID:        chat.ID,
			Title:     chat.Title,
			UserID:    chat.UserID,
			CreatedAt: chat.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: chat.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		},
		Messages: messageResponses,
	}

	return c.JSON(fiber.Map{"success": true, "data": resp})
}

func dbChatToResponse(chat *database.Chat) ChatResponse {
	return ChatResponse{
		ID:        chat.ID,
		Title:     chat.Title,
		UserID:    chat.UserID,
		CreatedAt: chat.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: chat.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
