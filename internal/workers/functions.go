package workers

import (
	"budget_planner/internal/database"
	"budget_planner/util"
	"fmt"
	"log"
)

func processNotificationAfterTransaction(dbService database.DBService) func(database.Transaction) error {
	return func(transaction database.Transaction) error {
		user, err := dbService.Queries().GetUserById(transaction.UserId)
		if err != nil {
			log.Println("Error fetching user for notifications:", err)
			return err
		}
		if user == nil {
			log.Println("User not found for notifications")
			return nil
		}

		if user.Budget == nil || len(*user.Budget) == 0 {
			return nil
		}

		// Check each expense budget category
		for _, budget := range *user.Budget {
			// Only check expense categories
			if budget.Type != transaction.CategoryType || budget.Type != "Expense" || budget.Name != transaction.CategoryName {
				continue
			}

			// Calculate spending percentage
			var percentage float64
			if budget.Amount > 0 {
				percentage = (budget.AmountSpent / budget.Amount) * 100
			}

			// Check thresholds
			if percentage >= 100 {
				// Budget exceeded - send alert
				title := "Budget Exceeded"
				message := fmt.Sprintf("You have exceeded your %s budget. Spent: $%.2f of $%.2f (%.0f%%)",
					budget.Name, budget.AmountSpent, budget.Amount, percentage)
				err := dbService.Queries().CreateNotification(user.Id, title, message)
				if err != nil {
					log.Println("Error creating exceeded budget notification:", err)
				} else {
					log.Printf("Created exceeded budget notification for user %s: %s\n", user.Id, budget.Name)
				}
			} else if percentage >= 80 && percentage < 100 {
				// Threshold alert - send warning
				title := "Budget Threshold Alert"
				message := fmt.Sprintf("Warning: You have reached %.0f%% of your %s budget. Spent: $%.2f of $%.2f",
					percentage, budget.Name, budget.AmountSpent, budget.Amount)
				err := dbService.Queries().CreateNotification(user.Id, title, message)
				if err != nil {
					log.Println("Error creating threshold alert notification:", err)
				} else {
					log.Printf("Created threshold alert notification for user %s: %s\n", user.Id, budget.Name)
				}
			}

			break
		}

		return nil
	}
}

func processUserBudgetAfterTransaction(dbService database.DBService) func(database.Transaction) error {
	return func(transaction database.Transaction) error {
		user, err := dbService.Queries().GetUserById(transaction.UserId)
		if err != nil {
			log.Println(err)
			return err
		}
		if user == nil {
			log.Panicln("user not found")
			return err
		}

		for i := 0; i < len(*user.Budget); i++ {
			if (*user.Budget)[i].Type == transaction.CategoryType && (*user.Budget)[i].Name == transaction.CategoryName {
				(*user.Budget)[i].AmountSpent += transaction.Amount
				break
			}
		}

		err = dbService.Queries().SetUserBudgetExpense(user.Id, database.UserBudgetExpense{
			UserId:   user.Id,
			Date:     util.GetCurrentMonth(),
			Expenses: user.Budget,
		})

		if err != nil {
			log.Println(err)
			return err
		}

		err = dbService.Queries().SetUserBudget(user.Id, *user.Budget)

		if err != nil {
			log.Println(err)
			return err
		}
		log.Println("budget updated")
		return nil
	}
}
