const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "src", "data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read(name, fallback) {
  ensureDir();
  const fp = path.join(DATA_DIR, name + ".json");
  if (!fs.existsSync(fp)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch {
    return fallback;
  }
}

function write(name, data) {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, name + ".json"), JSON.stringify(data, null, 2));
}

const contacts = [
  { id: "c_1700000000001", name: "Ahmed Al Maktoum", email: "ahmed@example.com", phone: "+971 50 123 4567", subject: "investment", message: "Interested in learning more about real estate investment opportunities in Dubai.", read: false, createdAt: "2026-07-10T08:30:00.000Z" },
  { id: "c_1700000000002", name: "Sarah Johnson", email: "sarah.j@email.com", phone: "+1 555 123 4567", subject: "partnership", message: "We are a US-based private equity firm looking for strategic partnerships in the MENA region.", read: true, createdAt: "2026-07-09T14:15:00.000Z" },
  { id: "c_1700000000003", name: "Raj Patel", email: "raj.patel@company.com", phone: "+91 98765 43210", subject: "general", message: "I would like to schedule a call to discuss potential collaboration opportunities.", read: false, createdAt: "2026-07-08T10:00:00.000Z" },
  { id: "c_1700000000004", name: "Maria Garcia", email: "maria@investgroup.com", phone: "+34 612 345 678", subject: "investment", message: "Our institutional investment group is interested in your hospitality sector portfolio.", read: false, createdAt: "2026-07-07T16:45:00.000Z" },
];

const submissions = [
  { id: "s_1700000000001", firstName: "James", lastName: "Mitchell", email: "james@mitchellcapital.com", phone: "+44 7700 123456", company: "Mitchell Capital Partners", opportunityType: "investment", investmentRange: "5m-25m", message: "We have a compelling investment opportunity in the fintech space.", fileName: "pitch-deck-2026.pdf", read: true, createdAt: "2026-07-11T09:00:00.000Z" },
  { id: "s_1700000000002", firstName: "Lisa", lastName: "Chen", email: "lisa@chenholdings.com", phone: "+65 9123 4567", company: "Chen Holdings Pte Ltd", opportunityType: "joint-venture", investmentRange: "1m-5m", message: "Proposing a JV for a logistics and distribution center in Dubai South.", fileName: "", read: false, createdAt: "2026-07-09T11:30:00.000Z" },
  { id: "s_1700000000003", firstName: "Omar", lastName: "Al Rashid", email: "omar@alrashidgroup.com", phone: "+971 55 555 5555", company: "Al Rashid Group", opportunityType: "partnership", investmentRange: "25m-100m", message: "Seeking a strategic partnership to co-invest in large-scale real estate developments.", fileName: "partnership-proposal.docx", read: false, createdAt: "2026-07-06T13:20:00.000Z" },
];

write("contacts", contacts);
write("submissions", submissions);
console.log("Seed data added!");
