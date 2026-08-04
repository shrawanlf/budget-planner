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
	Queries() Queries
}

type service struct {
	dbClient *dynamodb.Client
}

func NewService() DBService {
	if client != nil {
		return service{
			dbClient: client,
		}
	}

	sdkConfig, err := config.LoadDefaultConfig(context.Background())

	if err != nil {
		log.Fatal(err)
	}

	client = dynamodb.NewFromConfig(sdkConfig)

	return service{
		dbClient: client,
	}
}

func (s service) Queries() Queries {
	return newQueries(s.dbClient)
}

func (s service) DB() *dynamodb.Client {
	return s.dbClient
}

func (s service) Close() error {
	return nil 
}
