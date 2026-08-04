package database

import (
	"budget_planner/util"
	"context"
	"log"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/google/uuid"
)

type Queries struct {
	dbClient *dynamodb.Client
}

func newQueries(dbClient *dynamodb.Client) Queries {
	return Queries{
		dbClient: dbClient,
	}
}

func (q Queries) SetUserBudget(userId string, budgets []Budget) error {
	update := expression.Set(expression.Name("Budget"), expression.Value(budgets))
	expr, err := expression.NewBuilder().WithUpdate(update).Build()

	if err != nil {
		return err
	}

	_, err = q.dbClient.UpdateItem(context.Background(), &dynamodb.UpdateItemInput{
		TableName: aws.String("User"),
		Key: map[string]types.AttributeValue{
			"Id": &types.AttributeValueMemberS{Value: userId},
		},
		ReturnValues: types.ReturnValueUpdatedNew,
		UpdateExpression: expr.Update(),
		ExpressionAttributeValues: expr.Values(),
		ExpressionAttributeNames:  expr.Names(),
	})

	if err != nil {
		return err
	}

	return nil
}

func (q Queries) GetCategoryByType(categoryType string) ([]Category, error) {
	var categories []Category
	result, err := q.dbClient.Query(context.Background(), &dynamodb.QueryInput{
		TableName:              aws.String("Category"),
		KeyConditionExpression: aws.String("Type = :v_categoryType"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":v_categoryType": &types.AttributeValueMemberS{Value: categoryType},
		},
	})
	if err != nil {
		return nil, err
	}
	err = attributevalue.UnmarshalListOfMaps(result.Items, &categories)
	if err != nil {
		return nil, err
	}

	if len(categories) == 0 {
		return nil, nil
	}

	return categories, nil
}

func (q Queries) GetAllCategories() ([]Category, error) {
	var categories []Category
	result, err := q.dbClient.Scan(context.Background(), &dynamodb.ScanInput{
		TableName: aws.String("Category"),
	})
	if err != nil {
		return nil, err
	}
	err = attributevalue.UnmarshalListOfMaps(result.Items, &categories)
	if err != nil {
		return nil, err
	}

	if len(categories) == 0 {
		return nil, nil
	}
	return categories, nil
}

func (q Queries) GetUserById(userId string) (*User, error) {
	var user User
	result, err := q.dbClient.GetItem(context.Background(), &dynamodb.GetItemInput{
		TableName: aws.String("User"),
		Key: map[string]types.AttributeValue{
			"Id": &types.AttributeValueMemberS{Value: userId},
		},
	})

	if err != nil {
		return nil, err
	}

	err = attributevalue.UnmarshalMap(result.Item, &user)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (q Queries) CreateUser(email string, password string) (*User, error) {
	var user *User = &User{}
	hashedPassword, err := util.Hash([]byte(password))
	if err != nil {
		return nil, err
	}
	user.Password = hashedPassword
	user.Email = email
	user.Id = uuid.NewString()

	_, err = q.dbClient.PutItem(context.Background(), &dynamodb.PutItemInput{
		TableName: aws.String("User"),
		Item: map[string]types.AttributeValue{
			"Id":       &types.AttributeValueMemberS{Value: user.Id},
			"Email":    &types.AttributeValueMemberS{Value: user.Email},
			"Password": &types.AttributeValueMemberS{Value: user.Password},
		},
	})

	if err != nil {
		return nil, err
	}

	return user, nil
}

func (q Queries) GetUserByEmail(email string) (*User, error) {
	var users []User
	result, err := q.dbClient.Query(context.Background(), &dynamodb.QueryInput{
		TableName:              aws.String("User"),
		IndexName:              aws.String("EmailIndex"),
		KeyConditionExpression: aws.String("Email = :v_email"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":v_email": &types.AttributeValueMemberS{Value: email},
		},
	})
	if err != nil {
		return nil, err
	}
	err = attributevalue.UnmarshalListOfMaps(result.Items, &users)
	if err != nil {
		return nil, err
	}

	if len(users) == 0 {
		return nil, nil
	}

	return &users[0], nil
}

func (q Queries) CreateTransaction(transaction Transaction) error {
	transactionId := uuid.NewString()
	item := map[string]types.AttributeValue{
		"Id":               &types.AttributeValueMemberS{Value: transactionId},
		"UserId":           &types.AttributeValueMemberS{Value: transaction.UserId},
		"Time":             &types.AttributeValueMemberS{Value: strconv.FormatInt(transaction.Time.Unix(), 10)},
		"CategoryType":     &types.AttributeValueMemberS{Value: transaction.CategoryType},
		"CategoryName":     &types.AttributeValueMemberS{Value: transaction.CategoryName},
		"Amount":           &types.AttributeValueMemberN{Value: util.FloatToString(transaction.Amount)},
	}
	if transaction.Remarks != nil {
		item["Remarks"] = &types.AttributeValueMemberS{Value: *transaction.Remarks}
	}

	_, err := q.dbClient.PutItem(context.Background(), &dynamodb.PutItemInput{
		TableName: aws.String("Transaction"),
		Item:      item,
	})
	return err
}

func (q Queries) GetTransactionsByUserAndDateRange(userId string, startDate, endDate time.Time) ([]Transaction, error) {
	var transactions []Transaction
	startUnix := strconv.FormatInt(startDate.Unix(), 10)
	endUnix := strconv.FormatInt(endDate.Unix(), 10)

	log.Println("start", startUnix, "end", endUnix)

	filter := expression.And(
		expression.GreaterThanEqual(expression.Name("Time"), expression.Value(startUnix)),
		expression.LessThanEqual(expression.Name("Time"), expression.Value(endUnix)),
	)
	expr, err := expression.NewBuilder().WithFilter(filter).Build()
	if err != nil {
		return nil, err
	}

	attrValues := expr.Values()
	attrValues[":userId"] = &types.AttributeValueMemberS{Value: userId}

	result, err := q.dbClient.Query(context.Background(), &dynamodb.QueryInput{
		TableName:                 aws.String("Transaction"),
		KeyConditionExpression:    aws.String("UserId = :userId"),
		FilterExpression:          expr.Filter(),
		ExpressionAttributeValues: attrValues,
		ExpressionAttributeNames:  expr.Names(),
	})

	if err != nil {
		return nil, err
	}

	err = attributevalue.UnmarshalListOfMaps(result.Items, &transactions)
	if err != nil {
		return nil, err
	}

	if len(transactions) == 0 {
		return []Transaction{}, nil
	}

	return transactions, nil
}
