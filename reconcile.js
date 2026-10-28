// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n");

// Only the latest attempt for each txn_id counts.
const latest = new Map();
for (const line of lines) {
  if (line.trim().length === 0) continue;
  let event;
  try {
    event = JSON.parse(line);
  } catch {
    continue; // unreadable line
  }
  if (!event || !event.txn_id) continue;
  const prev = latest.get(event.txn_id);
  if (!prev || Date.parse(event.ts) >= Date.parse(prev.ts)) {
    latest.set(event.txn_id, event);
  }
}

// Amounts are sometimes strings with thousands separators, e.g. "4,804.15".
function parseAmount(a) {
  return typeof a === "number" ? a : Number(String(a).replace(/,/g, ""));
}

let total = 0;
let count = 0;
for (const event of latest.values()) {
  if (event.status === "success") {
    total += parseAmount(event.amount);
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
