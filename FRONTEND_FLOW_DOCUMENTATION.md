# Banking App - Frontend Flow Documentation

## Overview
This is a multilingual banking application with voice chatbot support, featuring customer accounts, fund transfers, transaction history, and an admin panel. The frontend is a single-page application (SPA) built with vanilla HTML, CSS, and JavaScript.

---

## 1. Application Architecture

### Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **APIs**: RESTful endpoints with JWT authentication
- **Voice**: Web Speech API (Speech Recognition & Synthesis)
- **Languages Supported**: English (en), Hindi (hi), Marathi (mr), Tamil (ta)

### File Structure
```
public/
├── index.html          # Single-page app with all sections
├── css/
│   └── style.css       # Complete responsive styling
└── js/
    └── app.js          # All application logic
```

### Navigation Map
The app uses a **section-based navigation system** instead of separate pages:
- **Home**: Landing page & public info
- **Signup**: New user registration
- **Login**: Customer authentication
- **Dashboard**: Post-login user view with balance, transfer, transactions
- **Voice Panel**: AI chatbot interface with speech recognition
- **Admin Login**: Admin authentication
- **Admin Panel**: Customer management view
- **PIN Modal**: Security feature for sensitive operations

---

## 2. User Flow: Customer Registration & Login

### 2.1 Sign-Up Flow

**Triggered by**: User clicks "Sign Up" button on home page

**Steps**:
1. User navigates to Signup page
2. Fills form: Name, Phone, Date of Birth, Address, Password, Confirm Password, Language, PIN
3. Clicks "Create Account"
4. **Client-side validation**:
   - Checks if all fields are filled
   - Validates password match (password === confirm password)
   - Validates PIN is 4 digits
   - Validates phone is 10 digits (Indian format)

**API Call** (`POST /api/signup`):
```javascript
{
  name: "Rajesh Kumar",
  phone: "9876543210",
  dob: "1990-01-15",
  addr: "123 Main St, Mumbai",
  password: "SecurePass123",
  pin: "1234",
  lang: "en"
}
```

**Server Processing**:
- Checks for duplicate names
- **Hashes password** using bcryptjs (10 rounds)
- Generates new account number (NB10001, NB10002, etc.)
- Creates customer record with:
  - ID (C001-C010)
  - Account Number (NB10001-NB10010)
  - Balance (₹10,000 opening bonus)
  - PIN (4-digit, stored as plain text)
  - Password Hash (bcryptjs hashed)
  - Language preference
  - Transaction history initialized with opening bonus entry
- Stores in `backend/models/customers.json`
- **Issues JWT token** (expires in 2 hours)

**Frontend Response**:
- Stores JWT token in `sessionStorage.token`
- Displays success message
- Auto-navigates to Dashboard
- Shows "Welcome, [Name]!" message

**Security**:
```
Password Flow:
User enters: "SecurePass123"
→ bcryptjs.hash("SecurePass123", 10)
→ Stored as: "$2a$10$......" (encrypted)
(Client never stores plain password)
```

---

### 2.2 Login Flow

**Triggered by**: User clicks "Log In" on home page

**Steps**:
1. User enters: Account Number OR Name, Password
2. Clicks "Log In"
3. **Client validation**: Checks non-empty fields

**API Call** (`POST /api/login`):
```javascript
{
  id: "NB10001",  // Can also use name
  password: "SecurePass123"
}
```

**Server Processing**:
- Finds customer by account number or name using `findCustomer()`
- **Verifies password** using bcryptjs.compare():
  ```
  bcryptjs.compare("SecurePass123", "$2a$10$......")
  → Returns: true/false
  ```
- If match: Issues JWT token
- If not match: Returns 401 error

**Frontend Response**:
- Stores token in `sessionStorage.token`
- Updates `sessionStorage.currentUser` with user data
- Navigates to Dashboard
- Calls `refreshDash()` to load personalized data

**Note**: Login page also supports **Voice Login** for demo purposes (bypasses password for testing)

---

## 3. Dashboard Flow

### 3.1 Post-Login Dashboard

**Auto-loaded when** user completes Login

**Components**:

#### A. Account Overview
```
┌─────────────────────────────────────┐
│ Welcome, [Customer Name]!           │
│ Account: NB10001                    │
│ Balance: ₹45,000.00                 │
│ Status: Active                      │
└─────────────────────────────────────┘
```

**Data Retrieved from**: `/api/customers/me` (JWT authenticated)

**Displayed Fields**:
- Account number
- Current balance
- Account status
- Language preference
- Phone number
- Account opening date

#### B. Quick Actions
**Buttons**:
- 💬 Open Voice Chatbot
- 💸 Make a Transfer
- 📱 View Transactions
- 🔐 Change PIN
- 🔌 Logout

#### C. Recent Transactions
**Table showing**:
- Date of transaction
- Description (Transfer to X, Received from Y)
- Amount (₹)
- Type (CR/DR)
- Current balance after transaction
- Status (Success/Pending)

**Data Source**: `customer.txns[]` array from user object

---

### 3.2 Money Transfer Feature

**Triggered by**: User clicks "Make a Transfer" button

**UI Flow**:
1. Opens transfer form modal/section
2. User enters: Beneficiary Name, Amount, Transfer Mode
3. Selects mode: NEFT, IMPS, or UPI
4. Clicks "Transfer"
5. **PIN Verification Modal** appears:
   ```
   ┌──────────────────┐
   │ Enter Your PIN   │
   │ [_] [_] [_] [_]  │
   └──────────────────┘
   ```
   - User enters 4-digit PIN
   - Each digit masked with bullet

**Validation**:
- Amount > 0 and ≤ balance
- Beneficiary exists in system (unless UPI mode)
- PIN matches customer's PIN (case-sensitive)

**API Call** (`POST /api/transfer`):
```javascript
{
  to: "Priya Sharma",           // Beneficiary name or UPI ID
  amount: 5000,
  mode: "NEFT",                 // NEFT, IMPS, UPI
  pin: "1234"
}
// Requires: Authorization: Bearer <JWT_TOKEN>
```

**Server Processing**:
- Verifies PIN matches `customer.pin`
- Checks sufficient balance
- Debits sender account
- Credits receiver account
- Creates transaction record in both customers' `txns` array
- **Also logs to** `backend/models/transactions.json` with:
  - Transaction ID
  - From Account Number
  - To Account Number
  - Amount
  - Mode
  - Date
  - Status
- Updates database file
- Returns success with updated balances

**Frontend Response**:
- Closes PIN modal
- Shows success toast: "Transfer of ₹5,000 successful!"
- Updates dashboard balance
- Refreshes transaction list
- Logs transaction to browser console

---

## 4. Voice Chatbot Interaction

### 4.1 Voice Panel UI

**Accessed by**: Dashboard → "💬 Open Voice Chatbot" button

**Interface**:
```
┌─────────────────────────────────────┐
│ Voice Chat Panel - Nova             │
│ ──────────────────────────────────  │
│ [Lang] English | Hindi | Marathi    │
│ ──────────────────────────────────  │
│ Chat Log Area                       │
│ ┌─────────────────────────────────┐ │
│ │ Nova: Hello! How can I help you?│ │
│ │                                 │ │
│ │ You: What is my balance?        │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ ──────────────────────────────────  │
│ [🎤 Listen] [✍️ Type] [⏹️ Stop]    │
│ Text Input: [________________] Send  │
└─────────────────────────────────────┘
```

### 4.2 Voice Recognition Flow

**Triggered by**: User clicks "🎤 Listen" button

**Steps**:

1. **Microphone Activation**:
   - Requests browser microphone permission
   - Shows listening indicator (animated)
   - Button text changes to "🎤 Listening..."

2. **Speech-to-Text** (Web Speech API):
   - Captures user's voice
   - Converts to text using browser's speech recognition
   - Supports language: English (en-IN), Hindi (hi-IN), Marathi (mr-IN), Tamil (ta-IN)

3. **Intent Detection** (NLP on client):
   - Analyzes text from `backend/models/chatbot-training.json`
   - Identifies intent:
     - **BALANCE**: "What is my balance?", "Show balance"
     - **TRANSFER**: "Transfer money", "Send ₹5000 to X"
     - **TRANSACTIONS**: "Show transaction history"
     - **ACCOUNT_INFO**: "Show account details"

4. **PIN Protection Logic**:
   - If intent requires sensitive data (BALANCE, TRANSFER, ACCOUNT_INFO):
     - **Shows PIN Modal** (same as transfer)
     - User enters 4-digit PIN
     - Client verifies: `pin === customer.pin`
     - If valid: Proceeds to response
     - If invalid: Shows error, asks to retry

5. **API Call** (if needed):
   - For BALANCE: Calls `/api/customers/me` to get fresh data
   - For TRANSACTIONS: Calls `/api/transactions/me`
   - For TRANSFER: Parses amount and beneficiary, shows transfer form

6. **Response Generation**:
   - Retrieves response from `chatbot-training.json`
   - Fills template with actual data:
     ```
     Template: "Your balance is ₹{balance}. Account: {accNo}"
     Result: "Your balance is ₹45,000. Account: NB10001"
     ```
   - Selected by language: English/Hindi/Marathi/Tamil

7. **Text-to-Speech**:
   - Uses browser's Web Speech API (SpeechSynthesis)
   - Speaks response in selected language
   - Chat log updates with both user and Nova's message
   - Message timestamps added

---

### 4.3 Chat Log Display

**Format**:
```
┌──────────────────────┐
│ Nova: Hello! I'm Nova│  (Left-aligned, timestamp)
│ [14:32]              │
│                      │
│          You: Hi Nova│  (Right-aligned, timestamp)
│          [14:32]     │
│                      │
│ Nova: How can I help?│  (Left-aligned)
│ [14:33]              │
└──────────────────────┘
```

**Features**:
- Auto-scroll to latest message
- Persistent within session (cleared on logout)
- Avatars: "Nova:" vs "You:"
- Timestamps in 12-hour format
- Different styling for user vs assistant messages

---

### 4.4 Language Switching

**Accessed by**: Language buttons in voice panel

**Buttons**: English | Hindi | Marathi | Tamil

**Effect**:
- Changes all UI text to selected language
  - Button labels: "🎤 Listen" → "🎤 सुनो" (Hindi)
  - Chat responses: English → Hindi/Marathi/Tamil
  - Command recognition: English → Hindi/Marathi/Tamil
  - Speech synthesis language: Changes TTS voice

**Implementation**:
- All text stored in `STRINGS` object in `app.js`:
  ```javascript
  STRINGS['listen_btn']['en'] = "🎤 Listen"
  STRINGS['listen_btn']['hi'] = "🎤 सुनो"
  STRINGS['listen_btn']['mr'] = "🎤 ऐका"
  ```
- Language-specific chatbot responses from `chatbot-training.json`

**Saved Preference**: Stored in `sessionStorage.vpLang`

---

## 5. Admin Panel Flow

### 5.1 Admin Login

**Accessed by**: Admin tab on home page

**Credentials**:
- Admin ID: `ADMIN001`
- Admin Password: `admin123`

**API Call** (`POST /api/admin/login`):
```javascript
{
  id: "ADMIN001",
  password: "admin123"
}
```

**Response**:
- Issues JWT token for admin
- Stores in `sessionStorage.adminToken`
- Navigates to Admin Panel

---

### 5.2 Admin Customer Management

**Admin Panel View**:
```
┌──────────────────────────────────────────┐
│ Bank Admin Dashboard                     │
│ ──────────────────────────────────────── │
│ Total Customers: 10                      │
│ Active Accounts: 10                      │
│ ──────────────────────────────────────── │
│                                          │
│ Customer Directory (Tabular View)        │
│ ┌────────────────────────────────────┐  │
│ │ Name    │ AccNo  │ Balance │ Action│  │
│ │─────────┼────────┼─────────┼───────│  │
│ │ Rajesh  │ NB1001 │ 50,000  │Edit  │  │
│ │ Priya   │ NB1002 │ 75,000  │Edit  │  │
│ │ ...     │ ...    │ ...     │...   │  │
│ └────────────────────────────────────┘  │
│                                          │
│ [+ Add New Customer] [↻ Refresh]        │
└──────────────────────────────────────────┘
```

**API Calls**:

#### GET All Customers
```
GET /api/admin/customers
Headers: Authorization: Bearer <ADMIN_TOKEN>
Response: Array of all customers (passwords redacted)
```

#### Edit Customer

**Triggered by**: Admin clicks "Edit" button next to customer

**Modal Opens**:
```
┌──────────────────────────────┐
│ Edit Customer - Rajesh Kumar │
│                              │
│ Name: [Rajesh Kumar]        │
│ Phone: [9876543210]         │
│ DOB: [1990-01-15]           │
│ Address: [123 Main St]      │
│ Balance: [50000]            │
│ PIN: [1234]                 │
│ Language: [English]         │
│ Status: [Active]            │
│                              │
│ [Save] [Cancel]             │
└──────────────────────────────┘
```

**API Call** (`PUT /api/admin/customers/:accNo`):
```javascript
{
  name: "Rajesh Kumar",
  phone: "9876543210",
  dob: "1990-01-15",
  addr: "123 Main St",
  balance: 55000,        // Can increase/decrease balance
  pin: "5678",           // Can change PIN
  lang: "hi",            // Can change language
  status: "Inactive"     // Can freeze account
}
```

**Server Processing**:
- Validates admin token
- Updates customer fields in `customers.json`
- **Does NOT allow password change** (security)
- Logs change (optional)
- Returns updated customer record

**Frontend Update**:
- Refreshes customer table
- Shows "Customer Data Appended Successfully!" toast
- Updates customer row with new values

#### Add New Customer

**Triggered by**: Admin clicks "+ Add New Customer"

**Modal Opens** (similar to edit):
```
┌──────────────────────────────┐
│ Create New Customer          │
│                              │
│ Name: [_____________]        │
│ Phone: [_____________]       │
│ DOB: [_____________]         │
│ Address: [_____________]     │
│ Password: [_____________]    │
│ PIN: [____]                  │
│ Language: [Select...]        │
│ Initial Balance: [10000]     │
│                              │
│ [Create] [Cancel]            │
└──────────────────────────────┘
```

**API Call** (`POST /api/admin/customers`):
```javascript
{
  name: "New Customer",
  phone: "9999999999",
  dob: "1995-06-20",
  addr: "456 Oak St",
  password: "NewSecurePass123",
  pin: "9999",
  lang: "hi",
  balance: 50000          // Admin can set initial balance
}
```

**Server Processing**:
- Validates all required fields
- Checks name not already registered
- **Hashes password** with bcryptjs
- Generates new account number (NB10011, etc.)
- Creates full customer record
- Stores in `customers.json`
- Returns success with new customer details

**Frontend**:
- Closes modal
- Reloads customer table
- Shows "Customer Created Successfully!" toast

---

## 6. Session Management

### 6.1 Token Storage
```javascript
sessionStorage.token = "eyJhbGc..."  // Customer JWT (expires 2h)
sessionStorage.adminToken = "..."     // Admin JWT (expires 2h)
sessionStorage.currentUser = {...}    // Customer object
sessionStorage.vpLang = "en"           // Voice panel language
```

### 6.2 Automatic Logout
- **On page refresh**: Tokens checked and re-validated
- **On token expiry**: Prompt user to re-login
- **On logout click**: All session data cleared
- **On tab close**: Session data persists (same session across tabs)

### 6.3 Protected Routes
**Client-side**: Check `sessionStorage.token` before:
- Showing dashboard
- Allowing API calls
- Displaying voice panel

**Server-side**: All protected routes verify JWT token in `Authorization` header

---

## 7. Data Flow Diagram

### Complete User Journey
```
[Home Page]
    ↓
    ├→ [Sign Up] → Hash Password → Save to customers.json → Issue JWT
    │                                                           ↓
    └→ [Log In] → Verify Password (bcryptjs) → Issue JWT ← ✓
                                                  ↓
                                            [Dashboard]
                                                  ↓
                        ┌─────────────────────────┼─────────────────────────┐
                        ↓                         ↓                         ↓
                  [Transfer]            [View Transactions]        [Voice Chat]
                        ↓                         ↓                         ↓
                  [PIN Modal] ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← PIN Modal
                        ↓                         ↓                         ↓
                   [Verify PIN]              [Fetch API]            [Intent Detection]
                        ↓                         ↓                         ↓
                   [Debit Sender]             [Show List]           [Identify Operation]
                   [Credit Receiver]                                        ↓
                   [Log Transaction]                              [Sensitive Data?]
                        ↓                                              ↓
                   [Update DB]                                   [Yes] → PIN Modal
                   [Refresh UI]                                   [No] → Response

[Admin Login] → [Issue Admin Token] → [Admin Dashboard] → [View/Edit/Add Customers]
                                            ↓
                                      [GET /customers]
                                            ↓
                                      [Render Table]
                                            ↓
                                    [Edit/Add Endpoints]
                                            ↓
                                    [Update customers.json]
```

---

## 8. Error Handling

### User-Facing Errors
**Toast Notifications** (appear at bottom of screen):
- ✅ "Account created successfully!" (green)
- ❌ "Name already registered" (red)
- ❌ "Invalid PIN" (red)
- ❌ "Insufficient balance" (red)
- ✅ "Transfer successful!" (green)
- ❌ "Something went wrong. Please try again." (red)

### Network Error Handling
```javascript
fetch(url, options)
  .then(res => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  })
  .catch(err => {
    showToast("Error: " + err.message, "error");
  })
```

**Common Errors**:
- **401 Unauthorized**: "Please log in again"
- **404 Not Found**: "Customer/Resource not found"
- **400 Bad Request**: "Please check your input"
- **500 Server Error**: "Server error. Please try again later"

---

## 9. Security Features

### 1. Password Hashing
- **Algorithm**: bcryptjs (10 salt rounds)
- **Storage**: Only hash stored, never plain text
- **Verification**: Using bcryptjs.compare()

### 2. PIN Protection
- **Storage**: Plain 4-digit PIN in customer record
- **Usage**: Required for:
  - Money transfers
  - Viewing balance (via chatbot)
  - Accessing account details (via chatbot)

### 3. JWT Token Security
- **Expiration**: 2 hours
- **Location**: sessionStorage (vulnerable to XSS, but acceptable for demo)
- **Header**: `Authorization: Bearer <TOKEN>`
- **Verification**: Server validates before processing

### 4. Admin Access Control
- **Separate credentials**: ADMIN001/admin123
- **Admin middleware**: Verified on every admin route
- **Password filtering**: Admin routes exclude password hashes from responses

### 5. Voice Login (Demo)
- **Caveat**: No password required for demo purposes
- **Real-world**: Should require authentication

---

## 10. Browser Compatibility

### Required APIs
- **Web Speech API**: Chrome, Edge, Opera (limited Safari/Firefox support)
- **JavaScript Features**: ES6+ (Arrow functions, async/await, destructuring)
- **Storage**: sessionStorage availability

### Testing Browsers
- ✅ Chrome 90+
- ✅ Chromium-based Edge
- ⚠️ Firefox (limited speech recognition)
- ⚠️ Safari (limited speech synthesis)

---

## 11. Utility Functions in app.js

### Navigation
- `setSection(sectionId)`: Show/hide UI sections
- `openVP()`: Open voice panel
- `closeVP()`: Close voice panel
- `vpLang(lang)`: Change chatbot language

### Authentication
- `doSignup()`: Registration workflow
- `doLogin()`: User login
- `doAdminLogin()`: Admin login
- `doLogout()`: Clear session and return to home

### API Wrappers
- `api(endpoint, method, data, token)`: Generic fetch wrapper
- `refreshDash()`: Load user dashboard data
- `refreshAdmin()`: Load admin panel data

### Chatbot
- `vpSend()`: Process chat message (text input)
- `vpMic()`: Activate microphone
- `vpSpeak()`: Text-to-speech response
- `handleVoiceCommand(text)`: Intent detection logic
- `parseTransferIntent(text)`: Extract beneficiary and amount from voice

### UI Helpers
- `showToast(msg, type)`: Display notification
- `showPINModal(callback)`: PIN input dialog
- `formatCurrency(amount)`: Format numbers to ₹X,XXX.XX

---

## 12. Example: Complete Balance Check via Voice

**User Flow**:
```
1. User logged in → Dashboard open
2. Clicks "💬 Open Voice Chatbot"
3. Voice panel opens with "Nova: Hello! How can I help?"
4. Clicks "🎤 Listen"
5. Says: "What is my balance?"
6. Speech-to-text converts: "What is my balance"
7. Intent detected: BALANCE (requires PIN)
8. PIN Modal appears
9. User enters: "1234"
10. Client verifies: sessionStorage.currentUser.pin === "1234" ✓
11. Calls: GET /api/customers/me
12. Response: { accNo: "NB10001", balance: 45000 }
13. Formats response: "Your balance is ₹45,000. Account: NB10001"
14. Reads response with text-to-speech
15. Chat log updated with both user and Nova messages
16. User continues in conversation
```

---

## 13. Troubleshooting

### Microphone not working
- Check browser permissions: Settings → Privacy & Security
- Ensure HTTPS or localhost (microphone requires secure context)
- Check speaker/audio is not muted

### Speech recognition not responding
- Verify browser supports Web Speech API
- Check language setting matches microphone input
- Ensure clear audio, mic positioned correctly

### Transfer fails with "Invalid PIN"
- PIN is 4 digits and case-sensitive
- PIN is stored in customer record, verify during signup
- Cannot change PIN in this version (future enhancement)

### Admin can't edit customer balance
- Ensure logged in with ADMIN001/admin123
- Token must be valid (check browser console)
- Balance field must be a number

---

## 14. Future Enhancements

1. **PIN Management**: Allow customers to change PIN in dashboard
2. **Two-Factor Authentication**: OTP verification for high-value transfers
3. **Transaction History**: Detailed filtering by date range, amount, type
4. **Scheduled Transfers**: Future-dated transactions
5. **Bill Payments**: Integration with BILLER system
6. **Investment Module**: Mutual funds, FDs, stocks
7. **Loan Management**: Apply, track, repay loans
8. **Chatbot ML**: Real ML model instead of rules-based
9. **Mobile App**: Native iOS/Android apps
10. **Blockchain Integration**: For audit trail and transparency

---

**Document Version**: 1.0  
**Last Updated**: Current Session  
**Application**: Multi-Lingual Banking App with AI Chatbot  
**Status**: Production Ready (Demo)
