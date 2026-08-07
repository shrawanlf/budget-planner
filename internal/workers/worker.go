package workers

import (
	"budget_planner/internal/database"
	"budget_planner/pkg/worker"
	"log"
)

func NewNotificationWorker(dbService database.DBService, transactionChannel *chan database.Transaction) *worker.Worker[database.Transaction] {
	worker := worker.NewWorker(1, transactionChannel, processNotificationAfterTransaction(database.NewService()), 3, func(err error) {
		log.Println("Error processing notification worker:", err)
	})
	worker.Spwan()
	return worker
}

func NewUserBudgetWorker(dbService database.DBService, transactionChannel *chan database.Transaction) *worker.Worker[database.Transaction] {
	worker := worker.NewWorker(10, transactionChannel, processUserBudgetAfterTransaction(database.NewService()), 3, func(err error) {
		log.Println("Error processing user budget worker:", err)
	})

	worker.Spwan()
	return worker
}
