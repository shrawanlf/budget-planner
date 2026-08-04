package auth

import (
	"budget_planner/internal/database"
	"budget_planner/util"
	"net/http"

	"github.com/labstack/echo/v5"
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

type LoginResponse struct {
	Token string `json:"token"`
}

var authService = NewService(database.NewService())

func RegisterRoutes(e *echo.Echo) {
	authGrp := e.Group("/auth")
	authGrp.POST("/login", handleLogin)
	authGrp.POST("/register", handleRegister)
}

func handleLogin(c *echo.Context) error {
	var loginDto loginDto
	if err := c.Bind(&loginDto); err != nil {
		return util.MakeErrorRes(c, util.HttpException(http.StatusBadRequest, "Invalid request", nil))
	}
	res, err := authService.Login(loginDto)
	if err != nil {
		return util.MakeErrorRes(c, err)
	}
	return c.JSON(http.StatusOK, util.FormatRes(true, "logged in", res))
}

func handleRegister(c *echo.Context) error {
	var registerDto registerDto
	if err := c.Bind(&registerDto); err != nil {
		c.JSON(400, err)
	}
	err := authService.Register(registerDto)

	if err != nil {
		return util.MakeErrorRes(c, err)
	}

	return c.JSON(http.StatusOK, util.FormatRes(true, "registered", nil))
}
