package worker

import (
	"fmt"
	"log"
)

type Worker[T any] struct {
	n               int
	ReceiverChannel *chan T
	Handler         func(T) error
	Retries         int
	ErrorHandler    func(error)
}

func (w *Worker[T]) Spwan() {
	for i := 1; i <= w.n; i++ {
		go func(id string) {
			for value := range *w.ReceiverChannel {
				err := w.Handler(value)
				if err != nil {
					w.ErrorHandler(err)
				}
			}
		}(string(fmt.Sprintf("Worker-%d", i)))
		log.Println("Spawned Worker ", i)
	}
	log.Println("Listening for incoming data")
}

func NewWorker[T any](workerCount int, receiverChannel *chan T, handler func(T) error, retries int, errorHandler func(error)) *Worker[T] {
	return &Worker[T]{
		n:               workerCount,
		ReceiverChannel: receiverChannel,
		Handler:         handler,
		Retries:         retries,
		ErrorHandler:    errorHandler,
	}
}

func PushDataToWorker[T any](worker *Worker[T], data T) {
	*worker.ReceiverChannel <- data
}
