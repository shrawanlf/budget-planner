package transaction

import "budget_planner/internal/database"

type service struct {
	dbService database.DBService
}

func NewService(dbService database.DBService) *service {
	return &service{
		dbService: dbService,
	}
}
