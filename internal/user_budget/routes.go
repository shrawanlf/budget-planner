package budget

import (
	"budget_planner/internal/database"
	"budget_planner/internal/middleware"
	"budget_planner/util"
	"fmt"
	"log"
	"net/http"

	"github.com/labstack/echo/v5"
)

type BudgetDto struct {
	Type   string `json:"type"`
	Name   string `json:"name"`
	Amount float64 `json:"amount"`
}

type SetUserBudgetDto struct {
	Budget []BudgetDto
	UserId string
} 

var databaseService = database.NewService()

func RegisterRoutes(e *echo.Echo) {
	budgetGrp := e.Group("/budget")
	budgetGrp.GET("/categories", handleGetBudgetCategories)
	budgetGrp.Use(middleware.AuthMiddleware(databaseService))
	budgetGrp.POST("/", handleSetBudget)
	budgetGrp.GET("/active", handleGetMeBudget)
}

var budgetService = NewService(databaseService)

func handleGetMeBudget(c *echo.Context) error {
	userId := c.Get("userId").(string)
	fmt.Println(userId)
	budget, err := budgetService.ActiveBudget(userId)

	if err != nil {
		log.Println(err)
		return util.MakeErrorRes(c, err)
	}

	if budget == nil {
		return util.MakeErrorRes(c, util.HttpException(404, "No budget configured for user", nil))
	}

	return c.JSON(http.StatusOK, util.FormatRes(true, "success", budget))
}

func handleGetBudgetCategories(c *echo.Context) error {
	categoryType := c.QueryParam("type")

	categories, err := budgetService.GetBudgetCategories(&categoryType)

	if err != nil {
		return util.MakeErrorRes(c, err)
	}

	return c.JSON(http.StatusOK, util.FormatRes(true, "success", categories))
}

func handleSetBudget(c *echo.Context) error {
	var dto SetUserBudgetDto
	var budgetDto []BudgetDto
	if err := c.Bind(&budgetDto); err != nil {
		return util.MakeErrorRes(c, util.HttpException(http.StatusBadRequest, "Invalid request", nil))
	}

	userId := c.Get("userId").(string)
	dto.UserId = userId
	dto.Budget = budgetDto

	err := budgetService.SetBudget(dto)

	if err != nil {
		return util.MakeErrorRes(c, err)
	}

	return c.JSON(http.StatusOK, util.FormatRes(true, "success", nil))
}
