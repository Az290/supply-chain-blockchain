package chaincode

import (
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

// ==================== DATA MODELS ====================

type Product struct {
	DocType         string         `json:"docType"`
	ID              string         `json:"id"`
	Name            string         `json:"name"`
	ProductType     string         `json:"productType"`
	Origin          string         `json:"origin"`
	CurrentOwner    string         `json:"currentOwner"`
	CurrentStatus   string         `json:"currentStatus"`
	CreatedAt       string         `json:"createdAt"`
	UpdatedAt       string         `json:"updatedAt"`
	BatchNumber     string         `json:"batchNumber"`
	Quantity        int            `json:"quantity"`
    SoldQuantity    int            `json:"soldQuantity"`
    SoldValue       float64        `json:"soldValue"`
	Unit            string         `json:"unit"`
	Price           float64        `json:"price"`
	ImageHash       string         `json:"imageHash"`
	CertificateHash string         `json:"certificateHash"`
	Description     string         `json:"description"`
	StatusHistory   []StatusRecord `json:"statusHistory"`
	OwnerHistory    []OwnerRecord  `json:"ownerHistory"`
}

type StatusRecord struct {
	Status      string `json:"status"`
	Timestamp   string `json:"timestamp"`
	Location    string `json:"location"`
	UpdatedBy   string `json:"updatedBy"`
	Description string `json:"description"`
	Temperature string `json:"temperature"`
	Humidity    string `json:"humidity"`
}

type OwnerRecord struct {
	From      string `json:"from"`
	To        string `json:"to"`
	Timestamp string `json:"timestamp"`
	TxID      string `json:"txId"`
}

// Participant - Thanh vien tham gia chuoi cung ung
type Participant struct {
	DocType      string `json:"docType"`
	ID           string `json:"id"`
	Name         string `json:"name"`
	Role         string `json:"role"`
	Organization string `json:"organization"`
	Location     string `json:"location"`
	Phone        string `json:"phone"`
	Email        string `json:"email"`
	IsActive     bool   `json:"isActive"`
	CreatedAt    string `json:"createdAt"`
}

// Trang thai hop le
var validStatuses = map[string]int{
	"CREATED":     0,
	"HARVESTED":   1,
	"PROCESSED":   2,
	"PACKAGED":    3,
	"IN_TRANSIT":  4,
	"WAREHOUSED":  5,
	"DISTRIBUTED": 6,
	"IN_STORE":    7,
	"SOLD":        8,
}

// Role hop le
var validRoles = map[string]bool{
	"PRODUCER":    true,
	"PROCESSOR":   true,
	"TRANSPORTER": true,
	"DISTRIBUTOR": true,
	"RETAILER":    true,
	"CONSUMER":    true,
	"ADMIN":       true,
}

// Role duoc phep cap nhat trang thai nao
var roleStatusPermission = map[string][]string{
	"PRODUCER":    {"CREATED", "HARVESTED"},
	"PROCESSOR":   {"PROCESSED", "PACKAGED"},
	"TRANSPORTER": {"IN_TRANSIT", "WAREHOUSED"},
	"DISTRIBUTOR": {"DISTRIBUTED"},
	"RETAILER":    {"IN_STORE", "SOLD"},
	"ADMIN":       {"CREATED", "HARVESTED", "PROCESSED", "PACKAGED", "IN_TRANSIT", "WAREHOUSED", "DISTRIBUTED", "IN_STORE", "SOLD"},
}

// ==================== PARTICIPANT FUNCTIONS ====================

// RegisterParticipant - Dang ky thanh vien moi
func (s *SmartContract) RegisterParticipant(ctx contractapi.TransactionContextInterface, id string, name string, role string, organization string, location string, phone string, email string) error {
	if !validRoles[role] {
		return fmt.Errorf("invalid role: %s. Valid roles: PRODUCER, PROCESSOR, TRANSPORTER, DISTRIBUTOR, RETAILER, ADMIN", role)
	}

	exists, err := s.participantExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("participant %s already exists", id)
	}

	participant := Participant{
		DocType:      "participant",
		ID:           id,
		Name:         name,
		Role:         role,
		Organization: organization,
		Location:     location,
		Phone:        phone,
		Email:        email,
		IsActive:     true,
		CreatedAt:    time.Now().Format(time.RFC3339),
	}

	participantJSON, err := json.Marshal(participant)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState("PARTICIPANT_"+id, participantJSON)
}

// GetParticipant - Lay thong tin thanh vien
func (s *SmartContract) GetParticipant(ctx contractapi.TransactionContextInterface, id string) (*Participant, error) {
	participantJSON, err := ctx.GetStub().GetState("PARTICIPANT_" + id)
	if err != nil {
		return nil, fmt.Errorf("failed to read participant: %v", err)
	}
	if participantJSON == nil {
		return nil, fmt.Errorf("participant %s does not exist", id)
	}

	var participant Participant
	err = json.Unmarshal(participantJSON, &participant)
	if err != nil {
		return nil, err
	}
	return &participant, nil
}

// GetAllParticipants - Lay tat ca thanh vien
func (s *SmartContract) GetAllParticipants(ctx contractapi.TransactionContextInterface) ([]*Participant, error) {
	queryString := `{"selector":{"docType":"participant"}}`
	return s.queryParticipants(ctx, queryString)
}

// GetParticipantsByRole - Lay thanh vien theo role
func (s *SmartContract) GetParticipantsByRole(ctx contractapi.TransactionContextInterface, role string) ([]*Participant, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"participant","role":"%s"}}`, role)
	return s.queryParticipants(ctx, queryString)
}

// DeactivateParticipant - Xoa mem thanh vien
func (s *SmartContract) DeactivateParticipant(ctx contractapi.TransactionContextInterface, id string) error {
	participant, err := s.GetParticipant(ctx, id)
	if err != nil {
		return err
	}
	participant.IsActive = false

	participantJSON, err := json.Marshal(participant)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState("PARTICIPANT_"+id, participantJSON)
}

func (s *SmartContract) participantExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	data, err := ctx.GetStub().GetState("PARTICIPANT_" + id)
	if err != nil {
		return false, err
	}
	return data != nil, nil
}

func (s *SmartContract) queryParticipants(ctx contractapi.TransactionContextInterface, queryString string) ([]*Participant, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var participants []*Participant
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var participant Participant
		err = json.Unmarshal(queryResponse.Value, &participant)
		if err != nil {
			return nil, err
		}
		participants = append(participants, &participant)
	}
	return participants, nil
}

// ==================== PRODUCT FUNCTIONS ====================

// InitLedger - Khoi tao du lieu mau
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	timestamp := time.Now().Format(time.RFC3339)

	// Tao thanh vien mau
	participants := []Participant{
		{DocType: "participant", ID: "NSX001", Name: "Nong trai Soc Trang", Role: "PRODUCER", Organization: "Org1", Location: "Soc Trang", Phone: "0901234567", Email: "nsx@soctrang.vn", IsActive: true, CreatedAt: timestamp},
		{DocType: "participant", ID: "CB001", Name: "Nha may che bien ABC", Role: "PROCESSOR", Organization: "Org1", Location: "Can Tho", Phone: "0901234568", Email: "cb@abc.vn", IsActive: true, CreatedAt: timestamp},
		{DocType: "participant", ID: "VC001", Name: "Van chuyen VNPost", Role: "TRANSPORTER", Organization: "Org2", Location: "Ho Chi Minh", Phone: "0901234569", Email: "vc@vnpost.vn", IsActive: true, CreatedAt: timestamp},
		{DocType: "participant", ID: "PP001", Name: "Nha phan phoi MegaMarket", Role: "DISTRIBUTOR", Organization: "Org2", Location: "Ha Noi", Phone: "0901234570", Email: "pp@mega.vn", IsActive: true, CreatedAt: timestamp},
		{DocType: "participant", ID: "BL001", Name: "Sieu thi CoopMart", Role: "RETAILER", Organization: "Org2", Location: "Ha Noi", Phone: "0901234571", Email: "bl@coop.vn", IsActive: true, CreatedAt: timestamp},
	}

	for _, p := range participants {
		pJSON, err := json.Marshal(p)
		if err != nil {
			return err
		}
		err = ctx.GetStub().PutState("PARTICIPANT_"+p.ID, pJSON)
		if err != nil {
			return err
		}
	}

	// Tao san pham mau
	products := []Product{
		{
			DocType: "product", ID: "PROD001", Name: "Gao ST25", ProductType: "Nong san",
			Origin: "Soc Trang, Viet Nam", CurrentOwner: "NSX001", CurrentStatus: "CREATED",
			CreatedAt: timestamp, UpdatedAt: timestamp, BatchNumber: "BATCH-2025-001",
			Quantity: 1000, Unit: "kg", Price: 25000, Description: "Gao ST25 dat giai nhat the gioi",
			StatusHistory: []StatusRecord{
				{Status: "CREATED", Timestamp: timestamp, Location: "Soc Trang", UpdatedBy: "NSX001", Description: "San pham duoc dang ky len he thong", Temperature: "", Humidity: ""},
			},
			OwnerHistory: []OwnerRecord{
				{From: "SYSTEM", To: "NSX001", Timestamp: timestamp},
			},
		},
		{
			DocType: "product", ID: "PROD002", Name: "Ca phe Robusta", ProductType: "Nong san",
			Origin: "Dak Lak, Viet Nam", CurrentOwner: "NSX001", CurrentStatus: "CREATED",
			CreatedAt: timestamp, UpdatedAt: timestamp, BatchNumber: "BATCH-2025-002",
			Quantity: 500, Unit: "kg", Price: 120000, Description: "Ca phe Robusta nguyen chat",
			StatusHistory: []StatusRecord{
				{Status: "CREATED", Timestamp: timestamp, Location: "Dak Lak", UpdatedBy: "NSX001", Description: "San pham duoc dang ky len he thong", Temperature: "", Humidity: ""},
			},
			OwnerHistory: []OwnerRecord{
				{From: "SYSTEM", To: "NSX001", Timestamp: timestamp},
			},
		},
	}

	for _, product := range products {
		productJSON, err := json.Marshal(product)
		if err != nil {
			return err
		}
		err = ctx.GetStub().PutState(product.ID, productJSON)
		if err != nil {
			return err
		}
	}
	return nil
}

// CreateProduct - Tao san pham moi voi kiem tra quyen
func (s *SmartContract) CreateProduct(ctx contractapi.TransactionContextInterface, id string, name string, productType string, origin string, ownerID string, batchNumber string, quantity int, unit string, price float64, description string) error {
	exists, err := s.ProductExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("product %s already exists", id)
	}

	// Kiem tra owner co ton tai va co quyen tao san pham
	participant, err := s.GetParticipant(ctx, ownerID)
	if err != nil {
		// Neu khong tim thay participant, van cho phep tao (backward compatible)
		participant = nil
	}
	if participant != nil && participant.Role != "PRODUCER" {
		return fmt.Errorf("only PRODUCER can create products, got role: %s", participant.Role)
	}

	timestamp := time.Now().Format(time.RFC3339)
	txID := ctx.GetStub().GetTxID()

	product := Product{
		DocType:       "product",
		ID:            id,
		Name:          name,
		ProductType:   productType,
		Origin:        origin,
		CurrentOwner:  ownerID,
		CurrentStatus: "CREATED",
		CreatedAt:     timestamp,
		UpdatedAt:     timestamp,
		BatchNumber:   batchNumber,
		Quantity:      quantity,
		Unit:          unit,
		Price:         price,
		Description:   description,
		StatusHistory: []StatusRecord{
			{Status: "CREATED", Timestamp: timestamp, Location: origin, UpdatedBy: ownerID, Description: "San pham duoc dang ky len he thong", Temperature: "", Humidity: ""},
		},
		OwnerHistory: []OwnerRecord{
			{From: "SYSTEM", To: ownerID, Timestamp: timestamp, TxID: txID},
		},
	}

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(id, productJSON)
}

// UpdateProductStatus - Cap nhat trang thai voi kiem tra quyen
func (s *SmartContract) UpdateProductStatus(ctx contractapi.TransactionContextInterface, id string, newStatus string, location string, updatedBy string, description string, temperature string, humidity string) error {
	product, err := s.ReadProduct(ctx, id)
	if err != nil {
		return err
	}

	participant, err := s.GetParticipant(ctx, updatedBy)
	if err != nil {
		return fmt.Errorf("participant %s does not exist", updatedBy)
	}

	if product.CurrentOwner != updatedBy {
		return fmt.Errorf("only current owner can update product status")
	}

	type transitionRule struct {
		FromStatus string
		ToStatus   string
		Role       string
	}

	allowedTransitions := []transitionRule{
	{FromStatus: "CREATED", ToStatus: "HARVESTED", Role: "PRODUCER"},
	{FromStatus: "HARVESTED", ToStatus: "PROCESSED", Role: "PROCESSOR"},
	{FromStatus: "PROCESSED", ToStatus: "PACKAGED", Role: "PROCESSOR"},
	{FromStatus: "PACKAGED", ToStatus: "IN_TRANSIT", Role: "TRANSPORTER"},
	{FromStatus: "IN_TRANSIT", ToStatus: "WAREHOUSED", Role: "TRANSPORTER"},
	{FromStatus: "WAREHOUSED", ToStatus: "DISTRIBUTED", Role: "DISTRIBUTOR"},
	{FromStatus: "DISTRIBUTED", ToStatus: "IN_STORE", Role: "RETAILER"},
}

	allowed := false
	for _, rule := range allowedTransitions {
		if product.CurrentStatus == rule.FromStatus && newStatus == rule.ToStatus {
			if participant.Role == rule.Role {
				allowed = true
				break
			}
		}
	}

	if !allowed {
		return fmt.Errorf("invalid workflow transition: role %s cannot change status from %s to %s", participant.Role, product.CurrentStatus, newStatus)
	}

	timestamp := time.Now().Format(time.RFC3339)

	statusRecord := StatusRecord{
		Status:      newStatus,
		Timestamp:   timestamp,
		Location:    location,
		UpdatedBy:   updatedBy,
		Description: description,
		Temperature: temperature,
		Humidity:    humidity,
	}

	product.CurrentStatus = newStatus
	product.UpdatedAt = timestamp
	product.StatusHistory = append(product.StatusHistory, statusRecord)

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(id, productJSON)
}

// TransferOwnership - Chuyen quyen so huu
func (s *SmartContract) TransferOwnership(ctx contractapi.TransactionContextInterface, id string, newOwnerID string) error {
	product, err := s.ReadProduct(ctx, id)
	if err != nil {
		return err
	}

	oldOwner := product.CurrentOwner
	if oldOwner == newOwnerID {
		return fmt.Errorf("product already owned by %s", newOwnerID)
	}

	oldParticipant, err := s.GetParticipant(ctx, oldOwner)
	if err != nil {
		return fmt.Errorf("current owner %s does not exist", oldOwner)
	}

	newParticipant, err := s.GetParticipant(ctx, newOwnerID)
	if err != nil {
		return fmt.Errorf("new owner %s does not exist", newOwnerID)
	}

	type transferRule struct {
		OwnerRole     string
		RequiredState string
		ReceiverRole  string
		AutoStatus    string
	}

	transferRules := []transferRule{
	{OwnerRole: "PRODUCER", RequiredState: "HARVESTED", ReceiverRole: "PROCESSOR", AutoStatus: ""},
	{OwnerRole: "PROCESSOR", RequiredState: "PACKAGED", ReceiverRole: "TRANSPORTER", AutoStatus: ""},
	{OwnerRole: "TRANSPORTER", RequiredState: "WAREHOUSED", ReceiverRole: "DISTRIBUTOR", AutoStatus: ""},
	{OwnerRole: "DISTRIBUTOR", RequiredState: "DISTRIBUTED", ReceiverRole: "RETAILER", AutoStatus: ""},
}

	 {
		validTransfer := false
		var autoStatus string

		for _, rule := range transferRules {
			if oldParticipant.Role == rule.OwnerRole {
				if product.CurrentStatus != rule.RequiredState {
					return fmt.Errorf("product must be in status %s before %s can transfer", rule.RequiredState, oldParticipant.Role)
				}
				if newParticipant.Role != rule.ReceiverRole {
					return fmt.Errorf("%s can only transfer to %s", oldParticipant.Role, rule.ReceiverRole)
				}
				validTransfer = true
				autoStatus = rule.AutoStatus
				break
			}
		}

		if !validTransfer {
			return fmt.Errorf("role %s is not allowed to transfer product in this workflow", oldParticipant.Role)
		}

		if autoStatus != "" {
			timestamp := time.Now().Format(time.RFC3339)
			product.CurrentStatus = autoStatus
			product.StatusHistory = append(product.StatusHistory, StatusRecord{
				Status:      autoStatus,
				Timestamp:   timestamp,
				Location:    newParticipant.Location,
				UpdatedBy:   oldOwner,
				Description: "Tu dong cap nhat trang thai khi van chuyen chuyen giao cho ban le",
				Temperature: "",
				Humidity:    "",
			})
		}
	}

	timestamp := time.Now().Format(time.RFC3339)
	txID := ctx.GetStub().GetTxID()

	ownerRecord := OwnerRecord{
		From:      oldOwner,
		To:        newOwnerID,
		Timestamp: timestamp,
		TxID:      txID,
	}

	product.CurrentOwner = newOwnerID
	product.UpdatedAt = timestamp
	product.OwnerHistory = append(product.OwnerHistory, ownerRecord)

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(id, productJSON)
}

// UpdateImageHash - Cap nhat IPFS hash hinh anh
func (s *SmartContract) UpdateImageHash(ctx contractapi.TransactionContextInterface, id string, imageHash string) error {
	product, err := s.ReadProduct(ctx, id)
	if err != nil {
		return err
	}
	product.ImageHash = imageHash
	product.UpdatedAt = time.Now().Format(time.RFC3339)

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(id, productJSON)
}

// UpdateCertificateHash - Cap nhat IPFS hash chung nhan
func (s *SmartContract) UpdateCertificateHash(ctx contractapi.TransactionContextInterface, id string, certHash string) error {
	product, err := s.ReadProduct(ctx, id)
	if err != nil {
		return err
	}
	product.CertificateHash = certHash
	product.UpdatedAt = time.Now().Format(time.RFC3339)

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(id, productJSON)
}

// ReadProduct - Doc thong tin san pham
func (s *SmartContract) ReadProduct(ctx contractapi.TransactionContextInterface, id string) (*Product, error) {
	productJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if productJSON == nil {
		return nil, fmt.Errorf("product %s does not exist", id)
	}

	var product Product
	err = json.Unmarshal(productJSON, &product)
	if err != nil {
		return nil, err
	}
	return &product, nil
}

// GetAllProducts - Lay tat ca san pham
func (s *SmartContract) GetAllProducts(ctx contractapi.TransactionContextInterface) ([]*Product, error) {
	queryString := `{"selector":{"docType":"product"}}`
	return s.queryProducts(ctx, queryString)
}

// GetProductsByStatus - Lay san pham theo trang thai
func (s *SmartContract) GetProductsByStatus(ctx contractapi.TransactionContextInterface, status string) ([]*Product, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"product","currentStatus":"%s"}}`, status)
	return s.queryProducts(ctx, queryString)
}

// GetProductsByOwner - Lay san pham theo chu so huu
func (s *SmartContract) GetProductsByOwner(ctx contractapi.TransactionContextInterface, ownerID string) ([]*Product, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"product","currentOwner":"%s"}}`, ownerID)
	return s.queryProducts(ctx, queryString)
}

// GetProductsByType - Lay san pham theo loai
func (s *SmartContract) GetProductsByType(ctx contractapi.TransactionContextInterface, productType string) ([]*Product, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"product","productType":"%s"}}`, productType)
	return s.queryProducts(ctx, queryString)
}

// GetProductHistory - Lay lich su san pham tu ledger
func (s *SmartContract) GetProductHistory(ctx contractapi.TransactionContextInterface, id string) ([]map[string]interface{}, error) {
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get history: %v", err)
	}
	defer resultsIterator.Close()

	var history []map[string]interface{}
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		record := map[string]interface{}{
			"txId":      response.TxId,
			"timestamp": time.Unix(response.Timestamp.Seconds, 0).Format(time.RFC3339),
			"isDelete":  response.IsDelete,
		}
		if !response.IsDelete {
			var product Product
			err = json.Unmarshal(response.Value, &product)
			if err != nil {
				return nil, err
			}
			record["product"] = product
		}
		history = append(history, record)
	}
	return history, nil
}

// GetStatistics - Thong ke du lieu chuoi cung ung
func (s *SmartContract) GetStatistics(ctx contractapi.TransactionContextInterface) (map[string]interface{}, error) {
	stats := map[string]interface{}{}

	// Dem san pham theo trang thai
	statusCount := map[string]int{}
	for status := range validStatuses {
		products, err := s.GetProductsByStatus(ctx, status)
		if err == nil {
			statusCount[status] = len(products)
		} else {
			statusCount[status] = 0
		}
	}
	stats["productsByStatus"] = statusCount

	// Tong so san pham
	allProducts, err := s.GetAllProducts(ctx)
	if err == nil {
		stats["totalProducts"] = len(allProducts)

		// Tinh tong gia tri
		totalValue := 0.0
		totalQuantity := 0
        totalSoldQuantity := 0
		totalSoldValue := 0.0
		for _, p := range allProducts {
			totalValue += p.Price * float64(p.Quantity)
			totalQuantity += p.Quantity
            totalSoldQuantity += p.SoldQuantity
			totalSoldValue += p.SoldValue
		}
		stats["totalValue"] = totalValue
		stats["totalQuantity"] = totalQuantity
        stats["totalSoldQuantity"] = totalSoldQuantity
		stats["totalSoldValue"] = totalSoldValue
	} else {
		stats["totalProducts"] = 0
		stats["totalValue"] = 0
		stats["totalQuantity"] = 0
	}

	// Tong so thanh vien
	allParticipants, err := s.GetAllParticipants(ctx)
	if err == nil {
		stats["totalParticipants"] = len(allParticipants)

		roleCount := map[string]int{}
		for _, p := range allParticipants {
			roleCount[p.Role]++
		}
		stats["participantsByRole"] = roleCount
	} else {
		stats["totalParticipants"] = 0
	}

	return stats, nil
}

// DeleteProduct - Xoa san pham (chi ADMIN)
func (s *SmartContract) DeleteProduct(ctx contractapi.TransactionContextInterface, id string, deletedBy string) error {
	exists, err := s.ProductExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("product %s does not exist", id)
	}

	// Kiem tra quyen xoa
	participant, err := s.GetParticipant(ctx, deletedBy)
	if err == nil && participant != nil {
		return fmt.Errorf("delete product is disabled for data integrity on blockchain")
	}
	if false {
		return fmt.Errorf("only ADMIN can delete products")
	}

	return ctx.GetStub().DelState(id)
}

// ProductExists - Kiem tra san pham ton tai
func (s *SmartContract) ProductExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	productJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	return productJSON != nil, nil
}

// VerifyProduct - Xac thuc san pham (tra ve thong tin xac thuc)
func (s *SmartContract) VerifyProduct(ctx contractapi.TransactionContextInterface, id string) (map[string]interface{}, error) {
	product, err := s.ReadProduct(ctx, id)
	if err != nil {
		return nil, err
	}

	verification := map[string]interface{}{
		"isAuthentic":    true,
		"productId":      product.ID,
		"productName":    product.Name,
		"origin":         product.Origin,
		"currentOwner":   product.CurrentOwner,
		"currentStatus":  product.CurrentStatus,
		"totalTransfers": len(product.OwnerHistory),
		"totalUpdates":   len(product.StatusHistory),
		"createdAt":      product.CreatedAt,
		"lastUpdated":    product.UpdatedAt,
		"hasCertificate": product.CertificateHash != "",
		"hasImage":       product.ImageHash != "",
		"batchNumber":    product.BatchNumber,
	}

	return verification, nil
}

// SearchProducts - Tim kiem san pham theo ten
func (s *SmartContract) SearchProducts(ctx contractapi.TransactionContextInterface, keyword string) ([]*Product, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"product","name":{"$regex":"%s"}}}`, keyword)
	return s.queryProducts(ctx, queryString)
}

// GetProductCountByStatus - Dem san pham theo trang thai (cho thong ke)
func (s *SmartContract) GetProductCountByStatus(ctx contractapi.TransactionContextInterface) (string, error) {
	result := map[string]int{}
	for status := range validStatuses {
		products, err := s.GetProductsByStatus(ctx, status)
		if err == nil {
			result[status] = len(products)
		}
	}
	resultJSON, err := json.Marshal(result)
	if err != nil {
		return "", err
	}
	return string(resultJSON), nil
}

// UpdateProductPrice - Cap nhat gia san pham
func (s *SmartContract) UpdateProductPrice(ctx contractapi.TransactionContextInterface, id string, newPrice string) error {
	product, err := s.ReadProduct(ctx, id)
	if err != nil {
		return err
	}

	price, err := strconv.ParseFloat(newPrice, 64)
	if err != nil {
		return fmt.Errorf("invalid price: %s", newPrice)
	}

	product.Price = price
	product.UpdatedAt = time.Now().Format(time.RFC3339)

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(id, productJSON)
}

// SellRetail - Ban le va tru ton kho tren blockchain
func (s *SmartContract) SellRetail(ctx contractapi.TransactionContextInterface, id string, quantityStr string, soldBy string, priceStr string, location string) error {
	product, err := s.ReadProduct(ctx, id)
	if err != nil {
		return err
	}

	participant, err := s.GetParticipant(ctx, soldBy)
	if err != nil {
		return fmt.Errorf("seller %s does not exist", soldBy)
	}
	if participant.Role != "RETAILER" {
		return fmt.Errorf("only RETAILER can sell retail, got role: %s", participant.Role)
	}
	if product.CurrentStatus != "IN_STORE" {
		return fmt.Errorf("product must be IN_STORE before retail sale, current status: %s", product.CurrentStatus)
	}

	quantity, err := strconv.Atoi(quantityStr)
	if err != nil || quantity <= 0 {
		return fmt.Errorf("invalid sale quantity: %s", quantityStr)
	}
	if quantity > product.Quantity {
		return fmt.Errorf("sale quantity %d exceeds available quantity %d", quantity, product.Quantity)
	}

	salePrice := product.Price
	if priceStr != "" {
		parsedPrice, priceErr := strconv.ParseFloat(priceStr, 64)
		if priceErr != nil || parsedPrice < 0 {
			return fmt.Errorf("invalid retail price: %s", priceStr)
		}
		if parsedPrice > 0 {
			salePrice = parsedPrice
			product.Price = parsedPrice
		}
	}

	if location == "" {
		location = participant.Location
	}

	product.Quantity -= quantity
    product.SoldQuantity += quantity
	product.SoldValue += float64(quantity) * salePrice
	timestamp := time.Now().Format(time.RFC3339)
	description := fmt.Sprintf("Ban le %d %s voi gia %.2f", quantity, product.Unit, salePrice)
	newStatus := product.CurrentStatus
	if product.Quantity == 0 {
		newStatus = "SOLD"
		product.CurrentStatus = "SOLD"
		description = description + "; da ban het lo hang"
	}

	product.UpdatedAt = timestamp
	product.StatusHistory = append(product.StatusHistory, StatusRecord{
		Status:      newStatus,
		Timestamp:   timestamp,
		Location:    location,
		UpdatedBy:   soldBy,
		Description: description,
		Temperature: "",
		Humidity:    "",
	})

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(id, productJSON)
}

// Helper: query products
func (s *SmartContract) queryProducts(ctx contractapi.TransactionContextInterface, queryString string) ([]*Product, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		// Fallback: neu khong ho tro rich query (LevelDB), dung GetStateByRange
		return s.getAllProductsFallback(ctx)
	}
	defer resultsIterator.Close()

	var products []*Product
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var product Product
		err = json.Unmarshal(queryResponse.Value, &product)
		if err != nil {
			return nil, err
		}
		products = append(products, &product)
	}
	return products, nil
}

// Fallback khi khong co CouchDB
func (s *SmartContract) getAllProductsFallback(ctx contractapi.TransactionContextInterface) ([]*Product, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var products []*Product
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var product Product
		err = json.Unmarshal(queryResponse.Value, &product)
		if err != nil {
			continue
		}
		if product.DocType == "product" {
			products = append(products, &product)
		}
	}
	return products, nil
}
