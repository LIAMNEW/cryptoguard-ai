# Transaction Dataset Examples

This folder contains realistic example transaction datasets for testing AUSTRAC compliance detection.

## Files

### 1. `example_banking_transactions.csv`
**Format:** Banking/Traditional Finance  
**Size:** 30 transactions  
**Scenarios Included:**
- ✅ **Structuring (TXN009-011, TXN019-022, TXN026-028)**: Multiple cash deposits just under $10k threshold followed by rapid transfers
- ✅ **Layering (TXN014-016)**: Large deposit followed by multiple international transfers within 48 hours
- ✅ **High-Risk Jurisdictions**: Transfers to UAE, Cayman Islands, Malaysia
- ✅ **Normal Activity**: Regular salary deposits, bill payments, business transactions for baseline comparison

**Key Patterns:**
- John Smith: 3 cash deposits ($8,500-$9,200) + overseas transfer to Malaysia
- Robert Taylor: 3 cash deposits ($8,800-$9,400) + transfer to new account
- Kevin White: 2 cash deposits ($9,500-$9,700) + Cayman Islands transfer
- David Brown: Layering pattern with consecutive offshore transfers

### 2. `example_blockchain_transactions.csv`
**Format:** Blockchain/Crypto  
**Size:** 20 transactions  
**Scenarios Included:**
- ✅ **Rapid Layering (0xabc123-125)**: Large deposit split and moved through multiple wallets within hours
- ✅ **Mixer/Tumbler Usage (0xabc132)**: Transaction through mixing service
- ✅ **Smurfing (0xabc136-139)**: Multiple small transactions just under common thresholds
- ✅ **Exchange Round-Tripping (0xabc128-129)**: Large amounts moving in/out of exchanges
- ✅ **Chain Hopping**: Multiple intermediary wallets

**Key Patterns:**
- Wallet 0x742d35Cc: $125k deposit → split to 2 wallets in same day
- Wallet 0x8u9i0o1p: $180k → split to 2 separate wallets within 2 hours
- Wallet 0x1e2r3t4y: 4 transactions of $8,500-$9,200 over 6 days (structuring)

### 3. `example_mixed_scenarios.json`
**Format:** JSON (mixed banking + blockchain)  
**Size:** 21 transactions  
**Scenarios Included:**
- ✅ **Clear Structuring Pattern**: Jane Doe - 3 deposits under $10k, then offshore transfer
- ✅ **Textbook Layering**: 4-stage layering through blockchain intermediaries
- ✅ **High-Risk Jurisdiction**: Direct transfer to North Korea
- ✅ **Velocity Spike**: Customer with $150-200 normal activity suddenly does 3x $15k+ in one day
- ✅ **Profile Inconsistency**: Student purchasing $85k luxury car
- ✅ **Circular Transactions**: Funds moving in circle through 3 wallets
- ✅ **Normal Baseline**: Regular salary, rent, groceries for comparison

**Annotated:** Each transaction includes notes explaining the suspicious pattern

## Expected AUSTRAC Rule Triggers

### Structuring Examples Should Trigger:
- ✅ Rule: STRUCT_CASH_DEPOSITS (≥3 deposits $8k-$9,999 in 7 days)
- ✅ Expected Score: +25 points (HIGH severity)
- ✅ AUSTRAC Indicator: Structuring

### Layering Examples Should Trigger:
- ✅ Rule: LAYER_RAPID_MOVEMENT (≥2 transfers within 48h)
- ✅ Expected Score: +25 points (HIGH severity)
- ✅ AUSTRAC Indicator: Layering

### High-Risk Geo Should Trigger:
- ✅ Rule: GEO_HIGH_RISK (transfers to sanctioned/high-risk countries)
- ✅ Expected Score: +20 points (HIGH severity)
- ✅ Countries: North Korea, Cayman Islands, UAE (depending on configuration)

### Velocity Spike Should Trigger:
- ✅ Rule: VELOCITY_SPIKE (≥5× baseline or ≥3× amount percentile)
- ✅ Expected Score: +15 points (MEDIUM severity)
- ✅ Pattern: $150-200 average → $15k-22k suddenly

### Profile Inconsistency Should Trigger:
- ✅ Rule: PROFILE_INCONSISTENT (activity doesn't match occupation/income)
- ✅ Expected Score: +15 points (MEDIUM severity)
- ✅ Example: Student buying $85k car

## How to Use

1. **Upload via UI**: Go to the main dashboard and use the file upload component
2. **Supported Formats**: CSV, JSON (XLSX support also available)
3. **Field Mapping**: The system auto-maps common field names:
   - `transaction_id` / `id` / `txn_id`
   - `from_address` / `from` / `sender` / `payer`
   - `to_address` / `to` / `recipient` / `payee`
   - `amount` / `value`
   - `timestamp` / `date` / `time`

4. **After Upload**: Transactions will be:
   - Stored in `transactions` table
   - Automatically scored by AUSTRAC compliance engine
   - Generate scorecards with risk levels (NORMAL/EDD/SMR)
   - Create SMR drafts for high-risk transactions

## Testing Checklist

Upload each file and verify:

- [ ] Structuring patterns flagged as SMR or EDD
- [ ] Layering detected within 48-hour window
- [ ] High-risk jurisdiction transfers flagged
- [ ] Velocity spikes identified
- [ ] Normal transactions score as NORMAL
- [ ] SMR drafts generated with plain English narratives
- [ ] Due dates calculated (24h for TF, 3 business days otherwise)

## Data Privacy Note

All example data uses fictional names, addresses, and wallet IDs. No real customer information is included.
