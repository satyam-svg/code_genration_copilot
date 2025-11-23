package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type Service interface {
	Health() map[string]string
	Close() error
	CreateUser(ctx context.Context, name, email, password string) (*User, error)
	CheckEmailExists(ctx context.Context, email string) (bool, error)
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	CreateChat(ctx context.Context, userId int, title string) (*Chat, error)
	GetChatsByUser(ctx context.Context, userId int) ([]*Chat, error)
	GetChatByID(ctx context.Context, chatId int) (*Chat, error)
	UpdateChatTitle(ctx context.Context, chatId int, title string) error
	CreateMessage(ctx context.Context, chatId int, role, content, language string) (*Message, error)
	GetMessagesByChat(ctx context.Context, chatId int) ([]*Message, error)
}

type User struct {
	ID        int
	Name      string
	Email     string
	Password  string
	CreatedAt time.Time
}

type Chat struct {
	ID        int
	Title     string
	UserID    int
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Message struct {
	ID        int
	ChatID    int
	Role      string
	Content   string
	Language  string
	CreatedAt time.Time
}

type service struct {
	db *sql.DB
}

var _ Service = (*service)(nil)

func New(connectionString string) Service {
	db, err := sql.Open("pgx", connectionString)
	if err != nil {
		log.Fatal(err)
	}

	db.SetMaxIdleConns(5)
	db.SetMaxOpenConns(10)
	db.SetConnMaxLifetime(1 * time.Hour)

	if err := db.Ping(); err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}

	fmt.Println("Connected to PostgreSQL database successfully!")

	return &service{
		db: db,
	}
}

func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	stats := make(map[string]string)

	// Ping the database
	err := s.db.PingContext(ctx)
	if err != nil {
		stats["status"] = "down"
		stats["error"] = fmt.Sprintf("db down: %v", err)
		log.Fatalf("db down: %v", err) // Log fatal error if db is down
		return stats
	}

	// Database is up, add more statistics
	stats["status"] = "up"
	stats["message"] = "It's healthy"

	// Get database stats (like open connections, in use, idle, etc.)
	dbStats := s.db.Stats()
	stats["open_connections"] = fmt.Sprintf("%d", dbStats.OpenConnections)
	stats["in_use"] = fmt.Sprintf("%d", dbStats.InUse)
	stats["idle"] = fmt.Sprintf("%d", dbStats.Idle)
	stats["wait_count"] = fmt.Sprintf("%d", dbStats.WaitCount)
	stats["wait_duration"] = fmt.Sprintf("%v", dbStats.WaitDuration)
	stats["max_idle_closed"] = fmt.Sprintf("%d", dbStats.MaxIdleClosed)
	stats["max_lifetime_closed"] = fmt.Sprintf("%d", dbStats.MaxLifetimeClosed)

	// Evaluate stats to provide a health message
	if dbStats.OpenConnections > 40 { // Assuming 50 is the max for this example
		stats["message"] = "The database is experiencing heavy load."
	}

	if dbStats.WaitCount > 1000 {
		stats["message"] = "The database has a high number of wait events, indicating potential bottlenecks."
	}

	if dbStats.MaxIdleClosed > int64(dbStats.OpenConnections)/2 {
		stats["message"] = "Many idle connections are being closed, consider revising the connection pool settings."
	}

	if dbStats.MaxLifetimeClosed > int64(dbStats.OpenConnections)/2 {
		stats["message"] = "Many connections are being closed due to max lifetime, consider increasing max lifetime or revising the connection pool settings."
	}

	return stats
}

func (s *service) Close() error {
	fmt.Println("Closing database connection...")
	return s.db.Close()
}

func (s *service) CreateUser(ctx context.Context, name, email, password string) (*User, error) {
	query := `
		INSERT INTO users (name, email, password, created_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING id, name, email, password, created_at
	`

	var user User
	err := s.db.QueryRowContext(ctx, query, name, email, password).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Password,
		&user.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &user, nil
}

func (s *service) CheckEmailExists(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`

	var exists bool
	err := s.db.QueryRowContext(ctx, query, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check email: %w", err)
	}

	return exists, nil
}

func (s *service) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	query := `
		SELECT id, name, email, password, created_at
		FROM users
		WHERE email = $1
	`

	var user User
	err := s.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Password,
		&user.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

func (s *service) CreateChat(ctx context.Context, userId int, title string) (*Chat, error) {
	query := `
		INSERT INTO chats (user_id, title, created_at, updated_at)
		VALUES ($1, $2, NOW(), NOW())
		RETURNING id, user_id, title, created_at, updated_at
	`

	var chat Chat
	err := s.db.QueryRowContext(ctx, query, userId, title).Scan(
		&chat.ID,
		&chat.UserID,
		&chat.Title,
		&chat.CreatedAt,
		&chat.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create chat: %w", err)
	}

	return &chat, nil
}

func (s *service) GetChatsByUser(ctx context.Context, userId int) ([]*Chat, error) {
	query := `
		SELECT id, user_id, title, created_at, updated_at
		FROM chats
		WHERE user_id = $1
		ORDER BY updated_at DESC
	`

	rows, err := s.db.QueryContext(ctx, query, userId)
	if err != nil {
		return nil, fmt.Errorf("failed to get chats: %w", err)
	}
	defer rows.Close()

	var chats []*Chat
	for rows.Next() {
		var chat Chat
		err := rows.Scan(
			&chat.ID,
			&chat.UserID,
			&chat.Title,
			&chat.CreatedAt,
			&chat.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan chat: %w", err)
		}
		chats = append(chats, &chat)
	}

	return chats, nil
}

func (s *service) GetChatByID(ctx context.Context, chatId int) (*Chat, error) {
	query := `
		SELECT id, user_id, title, created_at, updated_at
		FROM chats
		WHERE id = $1
	`

	var chat Chat
	err := s.db.QueryRowContext(ctx, query, chatId).Scan(
		&chat.ID,
		&chat.UserID,
		&chat.Title,
		&chat.CreatedAt,
		&chat.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("chat not found")
		}
		return nil, fmt.Errorf("failed to get chat: %w", err)
	}

	return &chat, nil
}

func (s *service) UpdateChatTitle(ctx context.Context, chatId int, title string) error {
	query := `
		UPDATE chats
		SET title = $1, updated_at = NOW()
		WHERE id = $2
	`

	_, err := s.db.ExecContext(ctx, query, title, chatId)
	if err != nil {
		return fmt.Errorf("failed to update chat title: %w", err)
	}

	return nil
}

func (s *service) CreateMessage(ctx context.Context, chatId int, role, content, language string) (*Message, error) {
	query := `
		INSERT INTO messages (chat_id, role, content, language, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id, chat_id, role, content, language, created_at
	`

	var message Message
	var lang sql.NullString
	err := s.db.QueryRowContext(ctx, query, chatId, role, content, language).Scan(
		&message.ID,
		&message.ChatID,
		&message.Role,
		&message.Content,
		&lang,
		&message.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create message: %w", err)
	}

	if lang.Valid {
		message.Language = lang.String
	}

	// Update chat's updated_at timestamp
	_, _ = s.db.ExecContext(ctx, "UPDATE chats SET updated_at = NOW() WHERE id = $1", chatId)

	return &message, nil
}

func (s *service) GetMessagesByChat(ctx context.Context, chatId int) ([]*Message, error) {
	query := `
		SELECT id, chat_id, role, content, language, created_at
		FROM messages
		WHERE chat_id = $1
		ORDER BY created_at ASC
	`

	rows, err := s.db.QueryContext(ctx, query, chatId)
	if err != nil {
		return nil, fmt.Errorf("failed to get messages: %w", err)
	}
	defer rows.Close()

	var messages []*Message
	for rows.Next() {
		var message Message
		var lang sql.NullString
		err := rows.Scan(
			&message.ID,
			&message.ChatID,
			&message.Role,
			&message.Content,
			&lang,
			&message.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan message: %w", err)
		}
		if lang.Valid {
			message.Language = lang.String
		}
		messages = append(messages, &message)
	}

	return messages, nil
}
