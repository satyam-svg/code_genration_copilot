package handlers

import (
	"backend/internal/auth"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type SignupRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UserResponse struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	CreatedAt string `json:"createdAt"`
}

type SignupResponse struct {
	User  UserResponse `json:"user"`
	Token string       `json:"token"`
}

func (h *Handler) SignupHandler(c *fiber.Ctx) error {
	var req SignupRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Validate input
	if err := validateSignupRequest(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	// Check if email already exists
	existingUser, err := h.db.CheckEmailExists(c.Context(), req.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	if existingUser {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Email already registered",
		})
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to process password",
		})
	}

	// Create user in database
	user, err := h.db.CreateUser(c.Context(), req.Name, req.Email, hashedPassword)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to create user account",
		})
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to generate authentication token",
		})
	}

	// Prepare response
	response := SignupResponse{
		User: UserResponse{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		},
		Token: token,
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Account created successfully",
		"data":    response,
	})
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	User  UserResponse `json:"user"`
	Token string       `json:"token"`
}

func (h *Handler) LoginHandler(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Validate input
	if err := validateLoginRequest(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	// Get user by email
	user, err := h.db.GetUserByEmail(c.Context(), req.Email)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Invalid email or password",
		})
	}

	// Verify password
	if err := auth.CheckPassword(user.Password, req.Password); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Invalid email or password",
		})
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to generate authentication token",
		})
	}

	// Prepare response
	response := LoginResponse{
		User: UserResponse{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		},
		Token: token,
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Login successful",
		"data":    response,
	})
}

func validateLoginRequest(req LoginRequest) error {
	// Validate email
	if strings.TrimSpace(req.Email) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Email is required")
	}
	if !strings.Contains(req.Email, "@") {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid email format")
	}

	// Validate password
	if strings.TrimSpace(req.Password) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Password is required")
	}

	return nil
}

func validateSignupRequest(req SignupRequest) error {

	// Validate name
	if strings.TrimSpace(req.Name) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Name is required")
	}
	if len(req.Name) < 2 {
		return fiber.NewError(fiber.StatusBadRequest, "Name must be at least 2 characters")
	}

	// Validate email
	if strings.TrimSpace(req.Email) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Email is required")
	}
	if !strings.Contains(req.Email, "@") {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid email format")
	}

	// Validate password
	if strings.TrimSpace(req.Password) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Password is required")
	}
	if len(req.Password) < 8 {
		return fiber.NewError(fiber.StatusBadRequest, "Password must be at least 8 characters")
	}

	return nil
}
