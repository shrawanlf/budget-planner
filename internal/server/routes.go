package server

import (
	"budget_planner/internal/auth"
	"budget_planner/internal/budget"
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
)

func (s *Server) RegisterRoutes() http.Handler {
	e := echo.New()
	e.Use(middleware.RequestLogger())
	e.Use(middleware.Recover())

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"https://*", "http://*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	auth.RegisterRoutes(e)
	budget.RegisterRoutes(e)
	e.GET("/", s.HelloWorldHandler)

	return e
}

func (s *Server) HelloWorldHandler(c *echo.Context) error {
	resp := map[string]string{
		"message": "Hello World",
	}

	return c.JSON(http.StatusOK, resp)
}
