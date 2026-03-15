#!/bin/bash

export PATH=${PWD}/../fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../fabric-samples/config
export VERBOSE=false

CHANNEL_NAME="supplychannel"
COMPOSE_FILE=docker/docker-compose.yaml

C_GREEN='\033[0;32m'
C_RED='\033[0;31m'
C_BLUE='\033[0;34m'
C_RESET='\033[0m'

successln() { echo -e "${C_GREEN}$1${C_RESET}"; }
errorln() { echo -e "${C_RED}$1${C_RESET}"; }
infoln() { echo -e "${C_BLUE}$1${C_RESET}"; }

function generateCrypto() {
    infoln "========== Generating certificates =========="
    cryptogen generate --config=./organizations/cryptogen/crypto-config-orderer.yaml --output="organizations"
    cryptogen generate --config=./organizations/cryptogen/crypto-config-producer.yaml --output="organizations"
    cryptogen generate --config=./organizations/cryptogen/crypto-config-logistics.yaml --output="organizations"
    cryptogen generate --config=./organizations/cryptogen/crypto-config-retailer.yaml --output="organizations"
    successln "========== Certificates generated =========="
}

function generateGenesisBlock() {
    infoln "========== Generating genesis block =========="
    FABRIC_CFG_PATH=${PWD}/configtx configtxgen -profile SupplyChainChannel \
        -outputBlock ./channel-artifacts/${CHANNEL_NAME}.block -channelID $CHANNEL_NAME
    successln "========== Genesis block generated =========="
}

function networkUp() {
    if [ ! -d "organizations/ordererOrganizations" ]; then
        generateCrypto
    fi
    if [ ! -f "channel-artifacts/${CHANNEL_NAME}.block" ]; then
        generateGenesisBlock
    fi

    infoln "========== Starting network =========="
    docker compose -f $COMPOSE_FILE up -d
    sleep 5
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "supplychain|couchdb"
    successln "========== Network started =========="
}

function createChannel() {
    infoln "========== Creating channel: $CHANNEL_NAME =========="

    local ORDERER_CA=${PWD}/organizations/ordererOrganizations/supplychain.com/tlsca/tlsca.supplychain.com-cert.pem

    infoln "Joining orderer1..."
    osnadmin channel join --channelID $CHANNEL_NAME \
        --config-block ./channel-artifacts/${CHANNEL_NAME}.block \
        -o localhost:7053 --ca-file $ORDERER_CA \
        --client-cert ${PWD}/organizations/ordererOrganizations/supplychain.com/orderers/orderer1.supplychain.com/tls/server.crt \
        --client-key ${PWD}/organizations/ordererOrganizations/supplychain.com/orderers/orderer1.supplychain.com/tls/server.key

    infoln "Joining orderer2..."
    osnadmin channel join --channelID $CHANNEL_NAME \
        --config-block ./channel-artifacts/${CHANNEL_NAME}.block \
        -o localhost:8053 --ca-file $ORDERER_CA \
        --client-cert ${PWD}/organizations/ordererOrganizations/supplychain.com/orderers/orderer2.supplychain.com/tls/server.crt \
        --client-key ${PWD}/organizations/ordererOrganizations/supplychain.com/orderers/orderer2.supplychain.com/tls/server.key

    infoln "Joining orderer3..."
    osnadmin channel join --channelID $CHANNEL_NAME \
        --config-block ./channel-artifacts/${CHANNEL_NAME}.block \
        -o localhost:9053 --ca-file $ORDERER_CA \
        --client-cert ${PWD}/organizations/ordererOrganizations/supplychain.com/orderers/orderer3.supplychain.com/tls/server.crt \
        --client-key ${PWD}/organizations/ordererOrganizations/supplychain.com/orderers/orderer3.supplychain.com/tls/server.key

    sleep 3

    export CORE_PEER_TLS_ENABLED=true

    infoln "Joining peer0.producer..."
    export CORE_PEER_LOCALMSPID=ProducerMSP
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/producer.supplychain.com/peers/peer0.producer.supplychain.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/producer.supplychain.com/users/Admin@producer.supplychain.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block
    if [ $? -ne 0 ]; then errorln "Failed to join Producer peer"; exit 1; fi

    infoln "Joining peer0.logistics..."
    export CORE_PEER_LOCALMSPID=LogisticsMSP
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/logistics.supplychain.com/peers/peer0.logistics.supplychain.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/logistics.supplychain.com/users/Admin@logistics.supplychain.com/msp
    export CORE_PEER_ADDRESS=localhost:8051
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block
    if [ $? -ne 0 ]; then errorln "Failed to join Logistics peer"; exit 1; fi

    infoln "Joining peer0.retailer..."
    export CORE_PEER_LOCALMSPID=RetailerMSP
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/retailer.supplychain.com/peers/peer0.retailer.supplychain.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/retailer.supplychain.com/users/Admin@retailer.supplychain.com/msp
    export CORE_PEER_ADDRESS=localhost:9051
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block
    if [ $? -ne 0 ]; then errorln "Failed to join Retailer peer"; exit 1; fi

    successln "========== Channel created and all peers joined =========="
}

function deployCC() {
    local CC_NAME=${1:-supplychain}
    local CC_PATH=${2:-../fabric-samples/supplychain/chaincode-go}
    local CC_VERSION=${3:-1.0}
    local CC_SEQUENCE=${4:-1}

    local ORDERER_CA=${PWD}/organizations/ordererOrganizations/supplychain.com/tlsca/tlsca.supplychain.com-cert.pem

    infoln "========== Deploying chaincode: $CC_NAME =========="

    infoln "Packaging chaincode..."
    peer lifecycle chaincode package ${CC_NAME}.tar.gz --path $CC_PATH --lang golang --label ${CC_NAME}_${CC_VERSION}

    infoln "Installing on Producer..."
    export CORE_PEER_LOCALMSPID=ProducerMSP
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/producer.supplychain.com/peers/peer0.producer.supplychain.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/producer.supplychain.com/users/Admin@producer.supplychain.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
    peer lifecycle chaincode install ${CC_NAME}.tar.gz

    infoln "Installing on Logistics..."
    export CORE_PEER_LOCALMSPID=LogisticsMSP
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/logistics.supplychain.com/peers/peer0.logistics.supplychain.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/logistics.supplychain.com/users/Admin@logistics.supplychain.com/msp
    export CORE_PEER_ADDRESS=localhost:8051
    peer lifecycle chaincode install ${CC_NAME}.tar.gz

    infoln "Installing on Retailer..."
    export CORE_PEER_LOCALMSPID=RetailerMSP
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/retailer.supplychain.com/peers/peer0.retailer.supplychain.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/retailer.supplychain.com/users/Admin@retailer.supplychain.com/msp
    export CORE_PEER_ADDRESS=localhost:9051
    peer lifecycle chaincode install ${CC_NAME}.tar.gz

    # Get package ID
    export CORE_PEER_LOCALMSPID=ProducerMSP
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/producer.supplychain.com/peers/peer0.producer.supplychain.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/producer.supplychain.com/users/Admin@producer.supplychain.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
    PACKAGE_ID=$(peer lifecycle chaincode queryinstalled --output json | jq -r ".installed_chaincodes[-1].package_id")
    infoln "Package ID: $PACKAGE_ID"

    infoln "Approving for Producer..."
    peer lifecycle chaincode approveformyorg -o localhost:7050 \
        --ordererTLSHostnameOverride orderer1.supplychain.com --tls --cafile $ORDERER_CA \
        --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION \
        --package-id $PACKAGE_ID --sequence $CC_SEQUENCE

    infoln "Approving for Logistics..."
    export CORE_PEER_LOCALMSPID=LogisticsMSP
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/logistics.supplychain.com/peers/peer0.logistics.supplychain.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/logistics.supplychain.com/users/Admin@logistics.supplychain.com/msp
    export CORE_PEER_ADDRESS=localhost:8051
    peer lifecycle chaincode approveformyorg -o localhost:7050 \
        --ordererTLSHostnameOverride orderer1.supplychain.com --tls --cafile $ORDERER_CA \
        --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION \
        --package-id $PACKAGE_ID --sequence $CC_SEQUENCE

    infoln "Approving for Retailer..."
    export CORE_PEER_LOCALMSPID=RetailerMSP
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/retailer.supplychain.com/peers/peer0.retailer.supplychain.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/retailer.supplychain.com/users/Admin@retailer.supplychain.com/msp
    export CORE_PEER_ADDRESS=localhost:9051
    peer lifecycle chaincode approveformyorg -o localhost:7050 \
        --ordererTLSHostnameOverride orderer1.supplychain.com --tls --cafile $ORDERER_CA \
        --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION \
        --package-id $PACKAGE_ID --sequence $CC_SEQUENCE

    infoln "Checking commit readiness..."
    peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME \
        --name $CC_NAME --version $CC_VERSION --sequence $CC_SEQUENCE --output json

    infoln "Committing chaincode..."
    peer lifecycle chaincode commit -o localhost:7050 \
        --ordererTLSHostnameOverride orderer1.supplychain.com --tls --cafile $ORDERER_CA \
        --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --sequence $CC_SEQUENCE \
        --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/producer.supplychain.com/peers/peer0.producer.supplychain.com/tls/ca.crt \
        --peerAddresses localhost:8051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/logistics.supplychain.com/peers/peer0.logistics.supplychain.com/tls/ca.crt \
        --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/retailer.supplychain.com/peers/peer0.retailer.supplychain.com/tls/ca.crt

    infoln "Querying committed chaincode..."
    peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name $CC_NAME

    successln "========== Chaincode deployed =========="
}

function networkDown() {
    infoln "========== Stopping network =========="
    docker compose -f $COMPOSE_FILE down --volumes --remove-orphans 2>/dev/null
    docker rm -f $(docker ps -aq --filter "name=dev-peer") 2>/dev/null
    docker rmi -f $(docker images -q --filter "reference=dev-peer*") 2>/dev/null
    rm -rf organizations/ordererOrganizations organizations/peerOrganizations
    rm -rf channel-artifacts/*
    rm -f *.tar.gz
    successln "========== Network stopped =========="
}

if [ "$1" = "up" ]; then networkUp
elif [ "$1" = "down" ]; then networkDown
elif [ "$1" = "channel" ]; then createChannel
elif [ "$1" = "deploycc" ]; then deployCC $2 $3 $4 $5
elif [ "$1" = "all" ]; then networkUp; sleep 3; createChannel
else
    echo "Usage:"
    echo "  ./network.sh up       - Start network"
    echo "  ./network.sh down     - Stop & clean"
    echo "  ./network.sh channel  - Create channel"
    echo "  ./network.sh deploycc - Deploy chaincode"
    echo "  ./network.sh all      - Start + channel"
fi
