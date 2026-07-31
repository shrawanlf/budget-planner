package auth

import "budget_planner/internal/database"

type Service struct {
	dbService database.DBService
}

func NewService(dbService database.DBService) *Service {
	return &Service{
		dbService: dbService,
	}
}

func (as Service) Login(dto loginDto) error {
	return nil
}


func (as Service) Register(dto registerDto) error {
	return nil
}
