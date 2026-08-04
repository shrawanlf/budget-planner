package util

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func SignJWT(opt SignTokenJWTOpt) (string, error) {
	claims := JWTClaims{
		Id: opt.Id,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "budget_planner",
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	fmt.Println(token)

	tokenStr, err := token.SignedString([]byte("secret"))

	if err != nil {
		return "", err
	}

	return tokenStr, nil
}

func VerifyJWT(token string, secret string) (*JWTClaims, error) {
	parsedToken, error := jwt.ParseWithClaims(token, &JWTClaims{}, func(t *jwt.Token) (any, error) {
		return []byte(secret), nil
	})

	if error != nil {
		return nil, error
	}

	if _, ok := parsedToken.Claims.(*JWTClaims); !ok {
		return nil, HttpException(400, "Invalid token", nil)
	}

	return parsedToken.Claims.(*JWTClaims), nil
}
