# Concert Seat Assignment Web App

> **Project Status**: 🟢 `Standalone Utility Tool`  
> **Tech Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons  
> **Architecture**: Client-side algorithmic seat allocation engine with interactive CSV parsing

A responsive web application designed to automate concert and event seat assignments based on buyer purchase records and tiered seating layouts.

---

## 🌟 Key Features

- **Automated Seat Allocation**: Automatically assigns tickets based on buyer categories (e.g., Diamond, Platinum) and available unblocked seat positions.
- **CSV Data Input & Export**: Paste or upload raw seat maps and ticket buyer lists; download assigned rosters directly as CSV.
- **Hold & Block Handling**: Filters out reserved and blocked seats (`isBlocked: true` or `---` indicators) during the allocation pass.
- **Instant Clipboard Integration**: Single-click copy for fast handoff to ticketing backends or spreadsheet workflows.
- **Responsive UI**: Built with modern shadcn/ui components and Tailwind CSS.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Cards, Tables, Alerts, Inputs, Buttons)
- **Icons**: Lucide React

---

## 🚀 Getting Started

```bash
# Clone repository
git clone https://github.com/faisaladi/concert_seat_assignment.git
cd concert_seat_assignment

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.
