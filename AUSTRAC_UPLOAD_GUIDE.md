# QuantumGuard AI - AUSTRAC-Compliant Transaction Upload Guide

## Overview
QuantumGuard AI now includes a comprehensive 8-rule AUSTRAC-compliant risk analysis engine that automatically scores transactions based on Australian regulatory requirements.

## Supported File Formats
- ✅ CSV (.csv)
- ✅ Excel (.xlsx, .xls)
- ✅ JSON (.json)
- ✅ Plain Text (.txt)

## How It Works

### 1. Upload Your Data
Navigate to the **Upload Data** section and drag/drop or select your transaction file.

### 2. Automatic AI Extraction
The system uses AI to intelligently extract transactions from any format:
- Automatically detects column names
- Handles various date formats
- Converts currencies
- Generates transaction IDs if missing

### 3. AUSTRAC 8-Rule Risk Scoring
Each transaction is analyzed against 8 detection rules:

#### Rule 1: Large Transaction Detection (≥$10,000)
- **Weight**: Up to 30 points
- **Trigger**: Transactions ≥ $10,000 AUD
- **AUSTRAC**: Threshold Transaction Report (TTR) required
- **Example**: $15,000 transaction = +15 points

#### Rule 2: Structuring Detection ($9,000-$10,000)
- **Weight**: 25 points
- **Trigger**: Amounts between $9,000 and $9,999
- **AUSTRAC**: Potential structuring to avoid reporting
- **Example**: $9,500 transaction = +25 points + flag

#### Rule 3: Round Amount Patterns
- **Weight**: 10 points
- **Trigger**: Exact multiples of $1,000 or $500
- **AUSTRAC**: Unusual transaction pattern
- **Example**: $5,000.00 or $10,000.00 = +10 points

#### Rule 4: High-Risk Jurisdictions
- **Weight**: 20 points
- **Trigger**: Transactions to/from: KY, PA, VG, BM, LI, MC, BS, TC, KP, IR, SY
- **AUSTRAC**: High-risk geographic location
- **Example**: Transfer to Cayman Islands (KY) = +20 points

#### Rule 5: Cash Transaction Detection
- **Weight**: 15 points
- **Trigger**: Cash-based transactions
- **AUSTRAC**: Physical currency transaction
- **Example**: Cash deposit = +15 points

#### Rule 6: Sanctions/PEP Screening
- **Weight**: 35 points
- **Trigger**: Matches sanctions lists or Politically Exposed Persons
- **AUSTRAC**: Sanctions screening hit or PEP identified
- **Example**: PEP match = +35 points + mandatory flag

#### Rule 7: Velocity Anomaly Detection
- **Weight**: Up to 20 points
- **Trigger**: >5 transactions from same address in 24 hours
- **AUSTRAC**: Unusual transaction frequency
- **Example**: 8 transactions in 24h = +20 points

#### Rule 8: KYC Inconsistency Checks
- **Weight**: Up to 15 points
- **Trigger**: Incomplete data, unusual patterns
- **AUSTRAC**: Customer due diligence concerns
- **Example**: Large transfer with minimal data = +15 points

## Risk Classification

### High Risk (SMR) - Score ≥70
- **Action Required**: Suspicious Matter Report within 3 business days
- **Indicators**: Multiple red flags, mandatory triggers (structuring, sanctions)
- **Monitoring**: Immediate escalation and enhanced surveillance

### Medium Risk (EDD) - Score 40-69
- **Action Required**: Enhanced Due Diligence procedures
- **Indicators**: One or more significant risk factors
- **Monitoring**: Continuous monitoring and documentation

### Low Risk (Normal) - Score <40
- **Action Required**: Standard Customer Due Diligence
- **Indicators**: Minor or no risk factors
- **Monitoring**: Regular monitoring sufficient

## Sample CSV File Format

Create a CSV with these columns (minimum required: **amount**):

```csv
transaction_id,amount,currency,dest_country,timestamp,customer_id,customer_name,occupation,transaction_type
TX001,9500,AUD,AU,2025-10-15 10:30:00,CUST_001,John Smith,Engineer,transfer
TX002,15000,AUD,KY,2025-10-15 11:00:00,CUST_002,Jane Doe,Business Owner,transfer
TX003,500,AUD,US,2025-10-15 12:15:00,CUST_003,Bob Wilson,Teacher,transfer
TX004,10000,AUD,PA,2025-10-15 13:45:00,CUST_004,Alice Brown,Consultant,cash
TX005,25000,AUD,AU,2025-10-15 14:20:00,CUST_005,Charlie Green,Doctor,wire
TX006,50000,AUD,VG,2025-10-15 15:00:00,CUST_006,David Lee,Investor,transfer
TX007,9800,AUD,AU,2025-10-15 15:30:00,CUST_007,Emma White,Accountant,transfer
```

## Example Scores

| Transaction | Amount | Factors | Score | Risk Level |
|-------------|--------|---------|-------|------------|
| TX001 | $9,500 | Structuring | 25 | LOW |
| TX002 | $15,000 | Large + High-risk country | 35 | LOW |
| TX003 | $500 | None | 0 | LOW |
| TX004 | $10,000 | Large + Round + Cash + High-risk | 60 | MEDIUM (EDD) |
| TX005 | $25,000 | Large + Round | 35 | LOW |
| TX006 | $50,000 | Very large + High-risk country | 50 | MEDIUM (EDD) |
| TX007 | $9,800 | Structuring | 25 | LOW |

## After Upload

### 1. Automatic Redirect to Risk Score Dashboard
After successful upload, you'll see:
- **Interactive Scatter Plot**: Amount vs Risk Score
- **Statistics**: Total transactions, high/medium/low risk counts
- **Average Risk Score**: Across all transactions
- **Color-Coded Visualization**: Red (SMR), Orange (EDD), Green (Normal)

### 2. Detailed Analysis
Click on any data point to see:
- Transaction ID and amount
- Final risk score
- Risk level classification
- Triggered rules and explanations
- From/To addresses

### 3. AI Insights
Navigate to **AI Insights** to:
- Ask questions about specific transactions
- Get compliance guidance
- Understand risk factors
- Generate narrative reports

### 4. Export Reports
Go to **Export** section to:
- Download PDF reports with full analysis
- Export CSV with all risk scores
- Generate JSON data for integration
- Save analysis snapshots for comparison

## Best Practices

### Data Quality
- ✅ Include transaction IDs for tracking
- ✅ Provide timestamps for velocity analysis
- ✅ Include destination countries for jurisdiction checks
- ✅ Specify transaction types (cash, wire, transfer)

### Regular Monitoring
- Upload new data daily or weekly
- Compare risk trends over time
- Review high-risk transactions immediately
- Document all SMR-level findings

### Compliance
- Investigate all SMR-level transactions within 3 days
- Apply EDD procedures for medium-risk transactions
- Maintain audit trail of all analyses
- Keep export reports for regulatory review

## Troubleshooting

### "No transactions found"
- Check file format (CSV, Excel, JSON, TXT only)
- Ensure file contains an 'amount' column
- Verify data is not corrupted

### "Analysis timeout"
- Large files are automatically chunked
- Files >500KB may take 2-3 minutes
- Try splitting very large files (>1MB)

### "Missing columns warning"
- System can work with minimal data (just amount)
- More columns = better risk analysis
- Optional: transaction_type, dest_country, timestamp

## Support

For questions or issues:
1. Check AI Insights chatbot for guidance
2. Review Export reports for detailed explanations
3. Consult AUSTRAC documentation for regulatory requirements

---

**Version**: 1.0  
**Last Updated**: 2025-10-20  
**Compliance**: AUSTRAC AML/CTF Act 2006
