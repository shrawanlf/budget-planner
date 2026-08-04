package transaction

import (
	"budget_planner/internal/database"
	"fmt"
	"time"
)

type service struct {
	dbService database.DBService
}

func NewService(dbService database.DBService) *service {
	return &service{
		dbService: dbService,
	}
}

func (s *service) validateCategory(categoryType, categoryName string) error {
	categories, err := s.dbService.Queries().GetCategoryByType(categoryType)
	if err != nil {
		return err
	}

	if len(categories) == 0 {
		return fmt.Errorf("category type '%s' not found", categoryType)
	}

	for _, cat := range categories {
		if cat.Name == categoryName {
			return nil
		}
	}

	return fmt.Errorf("category '%s' not found under type '%s'", categoryName, categoryType)
}

func (s *service) CreateTransaction(createTxnDto CreateTransactionDto) error {
	if err := s.validateCategory(createTxnDto.Transaction.CategoryType, createTxnDto.Transaction.CategoryName); err != nil {
		return err
	}

	transaction := database.Transaction{
		UserId:       createTxnDto.UserId,
		Time:         createTxnDto.Time,
		CategoryType: createTxnDto.Transaction.CategoryType,
		CategoryName: createTxnDto.Transaction.CategoryName,
		Amount:       createTxnDto.Transaction.Amount,
		Remarks:      createTxnDto.Transaction.Remarks,
	}
	return s.dbService.Queries().CreateTransaction(transaction)
}

func (s *service) GetTransactions(userId string, startDate, endDate time.Time) ([]database.Transaction, error) {
	return s.dbService.Queries().GetTransactionsByUserAndDateRange(userId, startDate, endDate)
}
