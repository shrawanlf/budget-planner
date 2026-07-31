package database

import (
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

var (
	client *dynamodb.Client
)

type DBService interface {
	DB() *dynamodb.Client
	Close() error
}

type service struct {
	dbClient *dynamodb.Client
}

func NewService() DBService {
	sdkConfig, err := config.LoadDefaultConfig(context.Background())

	if err != nil {
		log.Fatal(err)
	}

	if client != nil {
		return service{
			dbClient: client,
		}
	}

	client := dynamodb.NewFromConfig(sdkConfig)

	return service{
		dbClient: client,
	}
}

func (s service) DB() *dynamodb.Client {
	return s.dbClient
}

func (s service) Close() error {
	return nil 
}
