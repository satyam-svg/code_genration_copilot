package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"backend/internal/database"
	"backend/internal/server"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	cwd, _ := os.Getwd()
	fmt.Println("Current working directory:", cwd)

	// Load environment variables
	envPath := filepath.Join(cwd, ".env")
	fmt.Printf("Loading .env from: %s\n", envPath)
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}
	db := database.New(dbURL)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Code Generation Copilot v1.0.0",
	})

	// Configure CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000, https://code-genration-copilot.vercel.app",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, HEAD, PUT, DELETE, PATCH",
	}))

	srv := server.NewServer(db)
	srv.RegisterRoutes(app)

	// Create a channel to listen for OS signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Run server in a goroutine
	go func() {
		fmt.Printf("Server starting on port %s...\n", port)
		if err := app.Listen(":" + port); err != nil {
			log.Fatalf("Could not start server: %v", err)
		}
	}()

	// Wait for signal
	<-stop
	fmt.Println("\nShutting down server...")

	// Shutdown Fiber app
	if err := app.Shutdown(); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	// Close database connection
	if err := db.Close(); err != nil {
		log.Fatalf("Error closing database connection: %v", err)
	}

	fmt.Println("Server exited properly")
}
