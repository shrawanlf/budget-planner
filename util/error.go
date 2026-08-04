package util

import (
	"errors"
	"log"
	"net/http"

	"github.com/labstack/echo/v5"
)

type HttpError struct {
	StatusCode int
	Message    string
	Data       any
}

func (e HttpError) Error() string {
	return e.Message
}

func MakeErrorRes(c *echo.Context, error error) error {
	log.Println("error", error)
	if err, ok := errors.AsType[HttpError](error); ok {
		return c.JSON(err.StatusCode, FormatRes(false, err.Error(), err.Data))
	}
	return c.JSON(http.StatusInternalServerError, FormatRes(false, "Internal server error", nil))
}

func HttpException(code int, message string, data any) HttpError {
	return HttpError{
		StatusCode: code,
		Message:    message,
		Data:       data,
	}
}

func FormatRes(success bool, message string, data any) map[string]any {
	return map[string]any{
		"success": success,
		"message": message,
		"data":    data,
	}
}
