package auth

import (
	"budget_planner/internal/database"
	"budget_planner/util"
)

type service struct {
	dbService database.DBService
}

func NewService(dbService database.DBService) *service {
	return &service{
		dbService: dbService,
	}
}

func (as service) Login(dto loginDto) (LoginResponse, error) {
	var res LoginResponse
	user, err := as.dbService.Queries().GetUserByEmail(dto.Email)
	if err != nil {
		return res, err
	}
	if user == nil {
		return res, util.HttpException(404, "User not found", nil)
	}
	token, err := util.SignJWT(util.SignTokenJWTOpt{
		Id: user.Id,
	})
	if err != nil {
		return res, err
	}
	res.Token = token
	res.User = *user
	return res, nil
}

func (as service) Register(dto registerDto) error {
	user, err := as.dbService.Queries().GetUserByEmail(dto.Email)

	if err != nil {
		return err
	}

	if user != nil {
		return util.HttpException(400, "User by this email already exists", nil)
	}

	_, err = as.dbService.Queries().CreateUser(dto.Email, dto.Password, dto.Name, dto.Phone)

	if err != nil {
		return err
	}

	return nil
}
