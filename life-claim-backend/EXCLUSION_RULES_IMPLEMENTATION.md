# Exclusion Rules Implementation

## Overview
This implementation applies exclusion rules to cases uploaded via Excel, similar to the Java `checkForExclusionRule` method. Cases are automatically segregated into exclusion or non-exclusion cases in the `CAPS_ADD_ASSESSOR_POOL_CASES` table.

## Components Created

### 1. Models
- **CapsAddAssessorPoolCases** (`src/models/add/CapsAddAssessorPoolCases.js`)
  - Model for `CAPS_ADD_ASSESSOR_POOL_CASES` table
  - Stores case information with exclusion status

- **CapsAddExclusionMaster** (`src/models/add/CapsAddExclusionMaster.js`)
  - Model for `CAPS_ADD_EXCLUSION_MASTER` table
  - Stores exclusion rule configurations (exclusion types and values)

### 2. Services
- **exclusionRulesService** (`src/services/add/exclusionRulesService.js`)
  - Implements the `checkForExclusionRule` function
  - Applies all 10 exclusion rules:
    1. Claim received
    2. In-active policy status
    3. RCD more than 3 years
    4. Annual Premium > 5 lakh saving cases
    5. NRI customer
    6. Top advisor
    7. Partner Exclusion
    8. Product Norms
    9. Minor Life Assured
    10. ULIP Policy

### 3. Data Access Layer
- **capsAssessorPoolCasesDao** (`src/dataAccess/add/capsAssessorPoolCasesDao.js`)
  - `upsertAssessorPoolCase`: Inserts or updates a case in the assessor pool table
  - `batchUpsertAssessorPoolCases`: Batch processing for multiple cases

### 4. Controllers
- **exclusionRulesController** (`src/controllers/add/exclusionRulesController.js`)
  - `applyExclusionRulesToCase`: Apply rules to a single case
  - `applyExclusionRulesToMultipleCases`: Apply rules to multiple cases

### 5. Routes
- `POST /api/capsAddDetails/applyExclusionRules` - Apply rules to a single case
- `POST /api/capsAddDetails/applyExclusionRulesBatch` - Apply rules to multiple cases

## How It Works

### Automatic Application During Excel Upload
When Excel data is uploaded via `/api/capsAddDetails/addValue`:
1. Cases are inserted into `CAPS_ADD_DETAILS`
2. Exclusion rules are automatically applied to each case
3. Cases are inserted/updated in `CAPS_ADD_ASSESSOR_POOL_CASES` with:
   - `IS_EXCLUDED`: 'Y' if exclusion rule matched, 'N' otherwise
   - `EXCLUSION_TYPE`: The type of exclusion if applicable
   - `STATUS`: 'Exclusion' or 'Non-Exclusion'
   - All other relevant case data

### Manual Application
If exclusion rules need to be re-applied (e.g., after contract or life assured details are added):
```javascript
// Single case
POST /api/capsAddDetails/applyExclusionRules
{
  "caseId": 123,
  "batchId": 1234567890  // optional
}

// Multiple cases
POST /api/capsAddDetails/applyExclusionRulesBatch
{
  "caseIds": [123, 456, 789],
  "batchId": 1234567890  // optional
}
```

## Exclusion Rules Logic

The rules are applied in order, and the first matching rule sets the exclusion type:

1. **Claim received**: Checks if `POLICY_STATUS` matches exclusion values from master table
2. **In-active policy status**: Checks if `POLICY_STATUS` matches inactive statuses
3. **RCD more than 3 years**: Calculates years since Risk Commencement Date
4. **Annual Premium > 5 lakh**: For products starting with E or U, checks if annual premium >= 500000
5. **NRI customer**: Checks if residential status is 'N'
6. **Top advisor**: Checks if advisor code matches exclusion values
7. **Partner Exclusion**: Checks if partner name matches exclusion values
8. **Product Norms**: Checks product code against exclusion values or if it starts with G or I
9. **Minor Life Assured**: Checks if age <= 18
10. **ULIP Policy**: Checks if product code matches ULIP exclusion values

## Database Tables Required

### CAPS_ADD_EXCLUSION_MASTER
This table should contain exclusion rule configurations:
```sql
CREATE TABLE CAPS_ADD_EXCLUSION_MASTER (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    EXCLUSION_TYPE VARCHAR(100) NOT NULL,
    EXCLUSION_VALUE VARCHAR(255) NOT NULL
);
```

Example data:
- EXCLUSION_TYPE: 'Claim received', EXCLUSION_VALUE: 'Claimed'
- EXCLUSION_TYPE: 'Top advisor', EXCLUSION_VALUE: 'ADV001'
- etc.

### CAPS_ADD_ASSESSOR_POOL_CASES
Already defined in the user's requirements. The implementation populates this table automatically.

## Notes

- Exclusion rules are applied automatically during Excel upload, but may not catch all rules if contract or life assured details are not yet populated
- Use the manual application endpoints to re-apply rules after all data is available
- The service handles missing data gracefully - if contract or life assured details are not available, only applicable rules are checked
- Annual premium is automatically calculated and updated in `CAPS_ADD_CONTRACT_DETAILS` when exclusion rules are applied
