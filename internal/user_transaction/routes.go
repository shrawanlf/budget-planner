package transaction

import (
	"budget_planner/internal/database"
	"budget_planner/internal/middleware"
	"budget_planner/util"
	"fmt"
	"net/http"
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
	transactionGrp.Use(middleware.AuthMiddleware(databaseService))
	transactionGrp.POST("/", handleCreateTransaction)
	transactionGrp.GET("/", handleGetTransactions)
}

func handleGetTransactions(c *echo.Context) error {
	userId := c.Get("userId").(string)
	startDate := c.QueryParam("startDate")
	endDate := c.QueryParam("endDate")

	if startDate == "" || endDate == "" {
		return util.MakeErrorRes(c, util.HttpException(http.StatusBadRequest, "startDate and endDate query parameters are required", nil))
	}

	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return util.MakeErrorRes(c, util.HttpException(http.StatusBadRequest, "Invalid startDate format, use YYYY-MM-DD", nil))
	}

	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		return util.MakeErrorRes(c, util.HttpException(http.StatusBadRequest, "Invalid endDate format, use YYYY-MM-DD", nil))
	}

	if start.After(end) {
		return util.MakeErrorRes(c, util.HttpException(http.StatusBadRequest, "startDate must be before endDate", nil))
	}

	fmt.Println(start, end)

	transactions, err := transactionService.GetTransactions(userId, start, end)
	if err != nil {
		return util.MakeErrorRes(c, util.HttpException(http.StatusInternalServerError, "Failed to fetch transactions", nil))
	}

	return c.JSON(http.StatusOK, util.FormatRes(true, "Transactions fetched successfully", transactions))
}

func handleCreateTransaction(c *echo.Context) error {
	var transactionDto TransactionDto
	if err := c.Bind(&transactionDto); err != nil {
		return util.MakeErrorRes(c, util.HttpException(http.StatusBadRequest, "Invalid request body", nil))
	}

	if transactionDto.Amount <= 0 {
		return util.MakeErrorRes(c, util.HttpException(http.StatusBadRequest, "Amount must be greater than 0", nil))
	}

	userId := c.Get("userId").(string)

	createTxnDto := CreateTransactionDto{
		Transaction: transactionDto,
		UserId:      userId,
		Time:        time.Now(),
	}

	if err := transactionService.CreateTransaction(createTxnDto); err != nil {
		return util.MakeErrorRes(c, util.HttpException(http.StatusInternalServerError, err.Error(), nil))
	}

	return c.JSON(http.StatusCreated, util.FormatRes(true, "Transaction created successfully", nil))
}
