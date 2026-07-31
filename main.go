package main

import "fmt"

/**
Exported function
*/
func DoSmth() {

}


/**
Local Function
*/
func doSmth() error {
	return nil
}


/*
Intefaces
*/
type I interface {
	M()
	setM(s string)
}

type T struct {
	S string
}

// This method means type T implements the interface I,
// but we don't need to explicitly declare that it does so.
func (t T) M() {
	fmt.Println(t.S)
}

func (t *T) setM(s string) {
	t.S = s
}

func main() {
	var i T = T{"hello"}
	i.setM("Hello")
	i.M()
}
