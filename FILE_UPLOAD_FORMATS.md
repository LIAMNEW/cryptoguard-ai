# Supported Transaction File Formats

## Standard Formats (Fully Supported)

### 1. Banking Transactions CSV

**Required Fields:**
- `transaction_id` - Unique identifier
- `from_address` - Sender (account number or name)
- `to_address` - Recipient
- `amount` - Transaction value
- `timestamp` - ISO 8601 format date/time

**Optional Fields:**
- `transaction_type` - Type of transaction (e.g., cash_deposit, wire_transfer)

**Example:**
```csv
transaction_id,from_address,to_address,amount,timestamp,transaction_type
TXN001,John Smith - ACC12345,Savings Account,8500,2025-01-15T09:30:00Z,cash_deposit
```

### 2. Blockchain Transactions CSV

**Required Fields:**
- `transaction_id` - Transaction hash or ID
- `from_address` - Sender wallet address
- `to_address` - Recipient wallet address
- `amount` - Value transferred
- `timestamp` - ISO 8601 format date/time

**Optional Fields:**
- `transaction_hash` - Blockchain hash
- `block_number` - Block number
- `gas_fee` - Transaction fee
- `transaction_type` - Type (e.g., transfer)

**Example:**
```csv
transaction_id,from_address,to_address,amount,timestamp,transaction_hash,block_number,gas_fee,transaction_type
0xabc123,0x742d35Cc...,0x8f3Cf7ad...,125000,2025-01-10T08:15:00Z,0xdef456abc789,15234567,0.025,transfer
```

### 3. JSON Format

**Structure:**
```json
{
  "transactions": [
    {
      "transaction_id": "TXN001",
      "from_address": "Account123",
      "to_address": "Account456",
      "amount": 10000,
      "timestamp": "2025-01-15T10:00:00Z",
      "transaction_type": "transfer",
      "notes": "Optional description"
    }
  ]
}
```

## Research/ML Formats (Partial Support)

### 4. Elliptic Dataset Format

**Schema:**
```csv
txid,feature_1,feature_2,feature_3,feature_4,feature_5,class
tx0001,0.170701,0.861182,0.254065,-0.034746,-0.377651,2
```

**Mapping:**
- `txid` → `transaction_id`
- `class` → `label` (1=fraud, 2=legitimate)
- Features are preserved but not currently used in AUSTRAC scoring

**Note:** This format lacks sender/recipient addresses and amounts, which are critical for AUSTRAC compliance. Use for ML research only.

### 5. Quantum Transactions Format

**Schema:**
```csv
transaction_id,feature_1,feature_2,feature_3,feature_4,feature_5,label
tx_58w3x...,0.019263,0.164197,0.825956,-0.890915,-0.294735,legitimate
```

**Mapping:**
- `transaction_id` → `transaction_id`
- `label` → Classification (legitimate/fraud)
- Features preserved

**Note:** Similar to Elliptic format - missing critical transaction details for compliance.

### 6. Blockchain Analysis Results Format

**Schema:**
```csv
transaction_id,feature_1,...,feature_5,label,from_address,to_address,timestamp,value,transaction_size,hour,day,is_peak_hour,high_activity_sender,high_activity_receiver
```

**Mapping:**
- Has both ML features AND transaction details
- `value` → `amount`
- All standard fields supported
- Extra features preserved for future ML enhancement

## Field Mapping Rules

The upload system automatically maps common field name variations:

### Transaction ID
- `transaction_id`, `txid`, `id`, `tx_id`, `hash`

### Sender
- `from_address`, `from`, `sender`, `payer`, `source`

### Recipient
- `to_address`, `to`, `recipient`, `payee`, `destination`

### Amount
- `amount`, `value`, `sum`, `total`

### Timestamp
- `timestamp`, `date`, `time`, `created_at`, `datetime`

### Label/Classification
- `label`, `class`, `classification`, `is_fraud`, `suspicious`

## File Size Limits

- **Maximum file size:** 20MB
- **Maximum rows:** No hard limit, but 1000+ transactions will trigger batch processing
- **Supported formats:** CSV, JSON, XLSX (via CSV export)

## Validation Rules

1. **Required Fields:** Must have at minimum: transaction_id, amount, timestamp
2. **Date Format:** ISO 8601 (YYYY-MM-DDTHH:MM:SSZ) preferred
3. **Amount:** Must be numeric, > 0
4. **Unique IDs:** Transaction IDs should be unique (duplicates may be rejected)

## Upload Recommendations

### For AUSTRAC Compliance Analysis
✅ Use standard banking or blockchain CSV format
✅ Include sender and recipient information
✅ Include transaction amounts and timestamps
✅ Add transaction_type for better classification

### For ML Model Training
✅ Include labeled data (fraud/legitimate)
✅ Include features if available
✅ Use consistent labeling scheme
❌ Research formats alone insufficient for compliance

## Error Handling

Common upload errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid file format" | Unsupported file type | Use CSV or JSON |
| "Missing required fields" | No transaction_id or amount | Add required columns |
| "Invalid date format" | Non-ISO date | Convert to YYYY-MM-DDTHH:MM:SSZ |
| "CPU timeout" | Very large file (Fixed!) | Files now process in batches |
| "Duplicate key" | Reusing transaction IDs | Ensure unique IDs |

## Example Files Location

See the repository root for example files:
- `example_banking_transactions.csv`
- `example_blockchain_transactions.csv`
- `example_mixed_scenarios.json`
- `TRANSACTION_EXAMPLES_README.md` (detailed documentation)

## Custom Format Support

Need to upload a custom format? Contact support or:

1. Export your data to match one of the standard formats above
2. Create a mapping script to convert your format
3. Submit a feature request for native support

## Future Format Support

Planned additions:
- [ ] Excel (XLSX) direct import
- [ ] XML transaction feeds
- [ ] Real-time API streaming
- [ ] Multi-currency transactions
- [ ] Cross-chain transaction tracking
