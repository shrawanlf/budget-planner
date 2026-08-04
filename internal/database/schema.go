package database

import "time"

type UserSession struct {
	Id        string
	ValidTill time.Time
}

type User struct {
	Id       string
	Email    string
	Session  *UserSession
	Budget   *[]Budget
	Password string
}

type Category struct {
	Type string `json:"type"`
	Name string `json:"name"`
}

type Budget struct {
	Type   string  `json:"type"`
	Name   string  `json:"name"`
	Amount float64 `json:"amount"`
}

type Transaction struct {
	UserId       string
	Time         time.Time
	CategoryType string
	CategoryName string
	Amount       float64
	Remarks      *string
}

type UserBudgetOverview struct {
	Type        string
	Name        string
	AmountSpent float64
}
