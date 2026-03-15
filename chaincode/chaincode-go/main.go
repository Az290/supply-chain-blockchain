package main

import (
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/supplychain/chaincode-go/chaincode"
)

func main() {
	supplyChainChaincode, err := contractapi.NewChaincode(&chaincode.SmartContract{})
	if err != nil {
		log.Panicf("Error creating supply chain chaincode: %v", err)
	}

	if err := supplyChainChaincode.Start(); err != nil {
		log.Panicf("Error starting supply chain chaincode: %v", err)
	}
}
