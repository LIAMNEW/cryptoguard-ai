# AUSTRAC Transaction Upload & Risk Analysis Guide

## 🚀 Ultra-Fast Upload System (10-100x Faster!)

QuantumGuard AI now features a **blazing-fast** transaction analysis system based on AUSTRAC training data.

### ⚡ Performance Improvements
- **New system**: 1-3 seconds for 100 transactions
- **Batch processing**: Handles 1,000+ transactions in under 10 seconds
- **No LLM delays**: Direct parsing and instant AUSTRAC risk scoring

---

## 📁 Supported File Formats

### CSV Files (Recommended)
**Required Column:** `Amount` or `AmountAUD` (numeric)

**Optional Columns:**
- `TransactionID`, `Date`, `MerchantName`, `Location`, `Country`
- `Channel` (Online, Wire, ATM, In-Person, Mobile)
- `TransactionType`, `Counterparty`, `CustomerID`

### JSON Files
```json
[
  {
    "transaction_id": "TX001",
    "amount": 15000,
    "merchant": "UAE Gold Brokers",
    "location": "Dubai",
    "channel": "wire"
  }
]
```

---

## 🎯 AUSTRAC 6-Factor Risk Scoring

### Factor 1: High-Risk or Foreign Jurisdictions (+1 point)
**High-risk**: Iran, Myanmar, DPRK, Bolivia, British Virgin Islands, UAE, London, Hong Kong

### Factor 2: Large Transactions (+1 point)
Transactions **≥ $15,000 AUD**

### Factor 3: Structuring Pattern (+1 point)
Amounts **$9,000 - $9,999 AUD** (avoid reporting threshold)

### Factor 4: Suspicious Merchant Keywords (+1 point)
"Remit", "Offshore", "Crypto", "Gold Brokers", "Investment", "Phantom", "Fake"

### Factor 5: High-Risk Channels (+1 point)
Wire transfers or ATM withdrawals

### Factor 6: Missing Counterparty (+1 point)
Transfers without specified counterparty

---

## 📊 Risk Classification

| Risk Level | Score | Factors | Action Required |
|------------|-------|---------|-----------------|
| **HIGH** | 67-100 | 4-6 | SMR required within 3 business days |
| **MEDIUM** | 34-66 | 2-3 | Enhanced Due Diligence (EDD) |
| **LOW** | 0-33 | 0-1 | Standard monitoring |

---

## 📋 Sample CSV Format

```csv
TransactionID,Date,Amount,MerchantName,Location,Channel
TX001,2025-01-15,15000,UAE Gold Brokers,Dubai,Wire
TX002,2025-01-15,9500,Phantom Remit,London,ATM
TX003,2025-01-15,5000,Woolworths,Melbourne,In-Person
```

**Download examples:**
- `example_fast_upload.csv` - Basic format
- `example_austrac_training.csv` - 1,000 training transactions

---

## 💡 Best Practices

- Include `Location`/`Country` for geographic analysis
- Add `MerchantName` for keyword detection
- Specify `Channel` for risk scoring
- Max file size: 50 MB
- Recommended: 100-5,000 transactions per file
