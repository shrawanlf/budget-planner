package middleware

import (
	"budget_planner/internal/database"
	"budget_planner/util"
	"fmt"

	"github.com/labstack/echo/v5"
)

func AuthMiddleware(dbService database.DBService) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return echo.ErrUnauthorized
			}

			claims, err := util.VerifyJWT(authHeader, "secret")

			if err != nil {
				fmt.Println("error", err)
				return util.HttpException(500, err.Error(), nil)
			}
			fmt.Println("service", dbService)

			user, err := dbService.Queries().GetUserById(claims.Id)

			if err != nil {
				return util.HttpException(500, err.Error(), nil)
			}

			if user == nil {
				return util.HttpException(401, "Unauthorized", nil)
			}

			c.Set("userId", user.Id)
			return next(c)
		}
	}
}
