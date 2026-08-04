package transaction

import (
	"budget_planner/internal/database"
	"time"

	"github.com/labstack/echo/v5"
)

var databaseService = database.NewService()

var transactionService = NewService(databaseService)

type TransactionDto struct {
	CategoryName string  `json:"categoryName"`
	CategoryType string  `json:"categoryType"`
	Amount       float64 `json:"amount"`
	Remarks      *string `json:"remarks"`
}

type CreateTransactionDto struct {
	Transaction TransactionDto
	UserId      string
	Time        time.Time
}

func RegisterRoutes(e *echo.Echo) {
	transactionGrp := e.Group("/transaction")
	transactionGrp.POST("/", handleCreateTransaction)
}

func handleCreateTransaction(c *echo.Context) error {
	return nil
}
