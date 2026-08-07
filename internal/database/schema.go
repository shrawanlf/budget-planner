package database

import "time"

type UserSession struct {
	Id        string
	ValidTill time.Time
}

type User struct {
	Id       string
	Email    string
	Name     string
	Phone    string
	Session  *UserSession `json:"-"`
	Budget   *[]Budget    `json:"-"`
	Password string       `json:"-"`
}

type Category struct {
	Type string `json:"type"`
	Name string `json:"name"`
}

type Budget struct {
	Type        string  `json:"type"`
	Name        string  `json:"name"`
	Amount      float64 `json:"amount"`
	AmountSpent float64 `json:"amountSpent"`
}

type UserBudgetExpense struct {
	UserId   string    `json:"userId"`
	Date     string    `json:"date"`
	Expenses *[]Budget `json:"expenses"`
}

type Transaction struct {
	UserId       string
	Time         string
	CategoryType string
	CategoryName string
	Amount       float64
	Remarks      *string
}

type Notification struct {
	UserId  string `json:"userId"`
	Title   string `json:"title"`
	Time    int64  `json:"time"`
	Message string `json:"message"`
}
