package main

import (
	"fmt"
	"net"
	"time"
)

func main() {
	fmt.Println("Testing connectivity to generativelanguage.googleapis.com:443...")
	timeout := 5 * time.Second
	conn, err := net.DialTimeout("tcp", "generativelanguage.googleapis.com:443", timeout)
	if err != nil {
		fmt.Println("Site unreachable, error: ", err)
		return
	}
	defer conn.Close()
	fmt.Println("TCP connection successful")
}
