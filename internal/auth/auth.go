package auth

import (
	"budget_planner/internal/database"
	"budget_planner/util"
	"net/http"

	"github.com/labstack/echo/v4"
)

type loginDto struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type registerDto struct {
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

var authService = NewService(database.NewService())

func RegisterRoutes(e *echo.Echo) {
	authGrp := e.Group("/auth")
	authGrp.POST("/login", handleLogin)
	authGrp.POST("/register", handleRegister)
}

func handleLogin(c echo.Context) error {
	var loginDto loginDto
	if err := c.Bind(&loginDto); err != nil {
		c.JSON(http.StatusBadRequest, util.FormatRes(false, "Invalid request", nil))
	}

	authService.Login(loginDto)
	return nil
}

func handleRegister(c echo.Context) error {
	var registerDto registerDto
	if err := c.Bind(&registerDto); err != nil {
		c.JSON(400, err)
	}
	return nil
}
