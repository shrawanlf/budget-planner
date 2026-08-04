package budget

import (
	"budget_planner/internal/database"
)

type service struct {
	dbService database.DBService
}

func NewService(dbService database.DBService) *service {
	return &service{
		dbService: dbService,
	}
}

func (as service) ActiveBudget(userId string) (*[]database.Budget, error) {
	user, err := as.dbService.Queries().GetUserById(userId)

	if err != nil {
		return nil, err
	}

	return user.Budget, nil
}

func (as service) GetBudgetCategories(categoryType *string) ([]database.Category, error) {
	var categories []database.Category
	var err error
	if categoryType != nil {
		categories, err = as.dbService.Queries().GetCategoryByType(*categoryType)
		if err != nil {
			return nil, err
		}
	} else {
		categories, err = as.dbService.Queries().GetAllCategories()
		if err != nil {
			return nil, err
		}
	}
	return categories, nil
}

func (as service) SetBudget(dto SetUserBudgetDto) error {
	var budget []database.Budget
	for _, b := range dto.Budget {
		budget = append(budget, database.Budget{
			Amount: b.Amount,
			Type:   b.Type,
			Name:   b.Name,
		})
	}
	err := as.dbService.Queries().SetUserBudget(dto.UserId, budget)

	if err != nil {
		return err
	}

	return nil
}
