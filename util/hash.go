package util

import (
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type SignTokenJWTOpt struct {
	Id    string
	Email string
}

type JWTClaims struct {
	Id string
	jwt.RegisteredClaims
}

func Hash(b []byte) (string, error) {
	hash, err := bcrypt.GenerateFromPassword(b, bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hash), nil
}

func CompareHash(hash []byte, b []byte) (bool, error) {
	err := bcrypt.CompareHashAndPassword(hash, b)

	if err != nil {
		return false, err
	}

	return true, nil
}

