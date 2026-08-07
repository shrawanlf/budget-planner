package transaction

import (
	"budget_planner/internal/database"
	"budget_planner/pkg/worker"
	"fmt"
	"strconv"
	"time"
)

type service struct {
	dbService          database.DBService
	notificationWorker *worker.Worker[database.Transaction]
	userBudgetWorker   *worker.Worker[database.Transaction]
}

func NewService(dbService database.DBService, notificationWorker *worker.Worker[database.Transaction], userBudgetWorker *worker.Worker[database.Transaction]) *service {
	return &service{
		dbService:          dbService,
		notificationWorker: notificationWorker,
		userBudgetWorker:   userBudgetWorker,
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
		Time:         strconv.FormatInt(createTxnDto.Time, 10),
		CategoryType: createTxnDto.Transaction.CategoryType,
		CategoryName: createTxnDto.Transaction.CategoryName,
		Amount:       createTxnDto.Transaction.Amount,
		Remarks:      createTxnDto.Transaction.Remarks,
	}
	err := s.dbService.Queries().CreateTransaction(transaction)
	if err != nil {
		return err
	}

	// NOTE: No need to process transactions for income type
	if transaction.CategoryType == "Income" {
		return nil
	}

	worker.PushDataToWorker(s.notificationWorker, transaction)
	worker.PushDataToWorker(s.userBudgetWorker, transaction)

	return nil
}

func (s *service) GetTransactions(userId string, startDate, endDate time.Time) ([]database.Transaction, error) {
	return s.dbService.Queries().GetTransactionsByUserAndDateRange(userId, startDate, endDate)
}

func (s *service) GetTransactionsByCategory(userId string, startDate, endDate time.Time, categoryType, categoryName string) ([]database.Transaction, error) {
	return s.dbService.Queries().GetTransactionsByCategory(userId, startDate, endDate, categoryType, categoryName)
}

func (s *service) GetNotifications(userId string) ([]database.Notification, error) {
	return s.dbService.Queries().GetUserNotifications(userId)
}
