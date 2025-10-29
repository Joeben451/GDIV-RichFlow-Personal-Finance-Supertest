import React, { useState } from "react";
import "./IncomeSection.css";

interface IncomeItem {
  id: number;
  name: string;
  amount: string;
}

const IncomeSection: React.FC = () => {
  const [earnedIncome, setEarnedIncome] = useState<IncomeItem[]>([]);
  const [portfolioIncome, setPortfolioIncome] = useState<IncomeItem[]>([]);
  const [passiveIncome, setPassiveIncome] = useState<IncomeItem[]>([]);

  // handle add income
  const handleAddIncome = (
    section: "earned" | "portfolio" | "passive",
    name: string,
    amount: string
  ) => {
    if (!name.trim() || !amount.trim()) return;
    const newItem: IncomeItem = {
      id: Date.now(),
      name,
      amount: parseFloat(amount).toFixed(2),
    };

    if (section === "earned") setEarnedIncome([...earnedIncome, newItem]);
    if (section === "portfolio") setPortfolioIncome([...portfolioIncome, newItem]);
    if (section === "passive") setPassiveIncome([...passiveIncome, newItem]);
  };

  // handle delete income
  const handleDelete = (section: "earned" | "portfolio" | "passive", id: number) => {
    if (section === "earned") setEarnedIncome(earnedIncome.filter((i) => i.id !== id));
    if (section === "portfolio") setPortfolioIncome(portfolioIncome.filter((i) => i.id !== id));
    if (section === "passive") setPassiveIncome(passiveIncome.filter((i) => i.id !== id));
  };

  // reusable income card
  const IncomeCard = ({
    title,
    items,
    section,
  }: {
    title: string;
    items: IncomeItem[];
    section: "earned" | "portfolio" | "passive";
  }) => {
    const [source, setSource] = useState("");
    const [amount, setAmount] = useState("");

    return (
      <div className="income-card">
        <div className="income-card-header">{title}</div>

        {items.length === 0 ? (
          <p className="income-empty">No {title.toLowerCase()} added yet.</p>
        ) : (
          <div className="income-list">
            {items.map((item) => (
              <div key={item.id} className="income-item">
                <span>{item.name}</span>
                <span>${item.amount}</span>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(section, item.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="income-inputs">
          <input
            type="text"
            placeholder="Source name"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <button
          className="add-btn"
          onClick={() => {
            handleAddIncome(section, source, amount);
            setSource("");
            setAmount("");
          }}
        >
          + Add {title}
        </button>
      </div>
    );
  };

  return (
    <div className="income-container">
      <div className="income-header">Income</div>

      <div className="income-sections">
        <IncomeCard title="Earned Income" items={earnedIncome} section="earned" />
        <IncomeCard title="Portfolio Income" items={portfolioIncome} section="portfolio" />
        <IncomeCard title="Passive Income" items={passiveIncome} section="passive" />
      </div>
    </div>
  );
};

export default IncomeSection;
