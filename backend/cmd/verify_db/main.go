package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Get database URL
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	// Connect to database
	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}

	fmt.Println("✅ Connected to database successfully!\n")

	// Verify tables exist
	tables := []string{"users", "languages", "generations"}

	for _, table := range tables {
		var exists bool
		query := fmt.Sprintf("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '%s')", table)
		err := db.QueryRow(query).Scan(&exists)
		if err != nil {
			log.Fatalf("Error checking table %s: %v", table, err)
		}

		if exists {
			// Count rows
			var count int
			countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s", table)
			db.QueryRow(countQuery).Scan(&count)
			fmt.Printf("✅ Table '%s' exists (rows: %d)\n", table, count)
		} else {
			fmt.Printf("❌ Table '%s' does NOT exist\n", table)
		}
	}

	fmt.Println("\n🎉 Database verification complete!")
}
