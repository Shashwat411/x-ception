const path = require('path');

let db;

async function init() {
  // dynamic import for ESM-only lowdb
  const { Low } = await import('lowdb');
  const { JSONFile } = await import('lowdb/node');

  const file = path.join(__dirname, 'data.json');
  const adapter = new JSONFile(file);
  const defaultData = { customers: [], transactions: [], nextAccNo: 10021 };
  db = new Low(adapter, defaultData);

  // ensure file has something valid so lowdb's read() doesn't choke
  const fs = require('fs');
  try {
    const stats = fs.statSync(file);
    if (stats.size === 0) {
      fs.writeFileSync(file, JSON.stringify(defaultData));
    }
  } catch (e) {
    // file may not exist yet
    fs.writeFileSync(file, JSON.stringify(defaultData));
  }

  await db.read();
  // db.data now has defaultData if file was empty

  // seed 20 dummy customers if none exist
  if (db.data.customers.length === 0) {
    db.data.customers = [
      { accNo: "NB10001", name: "Rajesh Sharma", phone: "+91 9876543210", dob: "1985-06-15", addr: "304 Oberoi Gardens, Mumbai - 400053", balance: 124562.8, pin: "1234", password: "pass123", lang: "en", txns: [] },
      { accNo: "NB10002", name: "Priya Deshmukh", phone: "+91 9876543211", dob: "1990-03-22", addr: "12 Shivaji Nagar, Pune - 411005", balance: 87450.0, pin: "5678", password: "pass123", lang: "mr", txns: [] },
      { accNo: "NB10003", name: "Rahul Kumar", phone: "+91 9876543212", dob: "1988-11-10", addr: "56 Gandhi Road, Delhi - 110001", balance: 210000.0, pin: "2345", password: "pass123", lang: "hi", txns: [] },
      { accNo: "NB10004", name: "Anita Pillai", phone: "+91 9876543213", dob: "1993-07-18", addr: "88 Anna Salai, Chennai - 600002", balance: 45230.5, pin: "6789", password: "pass123", lang: "ta", txns: [] },
      { accNo: "NB10005", name: "Suresh Patil", phone: "+91 9876543214", dob: "1975-12-05", addr: "22 MG Road, Nagpur - 440001", balance: 320000.0, pin: "3456", password: "pass123", lang: "mr", txns: [] },
      { accNo: "NB10006", name: "Meena Iyer", phone: "+91 9876543215", dob: "1992-09-30", addr: "45 Besant Nagar, Chennai - 600090", balance: 62000.0, pin: "7890", password: "pass123", lang: "ta", txns: [] },
      { accNo: "NB10007", name: "Amit Singh", phone: "+91 9876543216", dob: "1987-04-14", addr: "78 Civil Lines, Lucknow - 226001", balance: 155000.0, pin: "4567", password: "pass123", lang: "hi", txns: [] },
      { accNo: "NB10008", name: "Kavitha Reddy", phone: "+91 9876543217", dob: "1995-01-25", addr: "33 Jubilee Hills, Hyderabad - 500033", balance: 93200.0, pin: "8901", password: "pass123", lang: "en", txns: [] },
      { accNo: "NB10009", name: "Deepak Nair", phone: "+91 9876543218", dob: "1983-08-09", addr: "19 MG Road, Kochi - 682016", balance: 480000.0, pin: "1357", password: "pass123", lang: "en", txns: [] },
      { accNo: "NB10010", name: "Sunita Gupta", phone: "+91 9876543219", dob: "1978-05-20", addr: "67 Ashram Road, Ahmedabad - 380009", balance: 75600.0, pin: "2468", password: "pass123", lang: "hi", txns: [] },
      { accNo: "NB10011", name: "Vikram Patel", phone: "+91 9876543220", dob: "1991-10-11", addr: "102 Navrangpura, Ahmedabad - 380009", balance: 138000.0, pin: "1122", password: "pass123", lang: "en", txns: [] },
      { accNo: "NB10012", name: "Lavanya Krishnan", phone: "+91 9876543221", dob: "1994-02-28", addr: "55 T Nagar, Chennai - 600017", balance: 51000.0, pin: "3344", password: "pass123", lang: "ta", txns: [] },
      { accNo: "NB10013", name: "Mohan Joshi", phone: "+91 9876543222", dob: "1969-07-07", addr: "8 Tilak Road, Pune - 411002", balance: 695000.0, pin: "5566", password: "pass123", lang: "mr", txns: [] },
      { accNo: "NB10014", name: "Pooja Yadav", phone: "+91 9876543223", dob: "1997-12-15", addr: "29 Gomti Nagar, Lucknow - 226010", balance: 34500.0, pin: "7788", password: "pass123", lang: "hi", txns: [] },
      { accNo: "NB10015", name: "Arjun Menon", phone: "+91 9876543224", dob: "1986-03-03", addr: "77 Palayam, Thiruvananthapuram - 695034", balance: 270000.0, pin: "9900", password: "pass123", lang: "en", txns: [] },
      { accNo: "NB10016", name: "Rekha Bansal", phone: "+91 9876543225", dob: "1980-09-17", addr: "44 Chandni Chowk, Delhi - 110006", balance: 117000.0, pin: "1212", password: "pass123", lang: "hi", txns: [] },
      { accNo: "NB10017", name: "Karthik Sundaram", phone: "+91 9876543226", dob: "1993-06-22", addr: "61 Coimbatore Main Rd, Coimbatore - 641001", balance: 88900.0, pin: "3434", password: "pass123", lang: "ta", txns: [] },
      { accNo: "NB10018", name: "Neha Wagh", phone: "+91 9876543227", dob: "1996-11-30", addr: "15 FC Road, Pune - 411004", balance: 43700.0, pin: "5656", password: "pass123", lang: "mr", txns: [] },
      { accNo: "NB10019", name: "Ganesh Rao", phone: "+91 9876543228", dob: "1974-04-19", addr: "39 Indiranagar, Bengaluru - 560038", balance: 520000.0, pin: "7878", password: "pass123", lang: "en", txns: [] },
      { accNo: "NB10020", name: "Divya Sharma", phone: "+91 9876543229", dob: "1998-08-08", addr: "23 Banjara Hills, Hyderabad - 500034", balance: 29800.0, pin: "9090", password: "pass123", lang: "hi", txns: [] }
    ];
    await db.write();
  }
}

module.exports = { db, init };
