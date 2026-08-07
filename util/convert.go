package util

import "strconv"

func FloatToString(f float64) string {
	return strconv.FormatFloat(f, 'f', -1, 64)
}
