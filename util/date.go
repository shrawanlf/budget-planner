package util

import (
	"time"
)

func GetCurrentDate() string {
	return time.Now().Format("2006-01-02")
}

// GetCurrentMonth returns the current year-month as "YYYY-MM" — used as the
// key for monthly budget expense snapshots.
func GetCurrentMonth() string {
	return time.Now().Format("2006-01")
}
