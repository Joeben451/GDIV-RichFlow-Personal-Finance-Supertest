import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UserGuide.css';

const UserGuide: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="user-guide-container">
      <div className="user-guide-content">
        <h1 className="user-guide-title">Welcome to RichFlow!</h1>
        
        <p className="user-guide-intro">
          Hello there, and a warm welcome to the RichFlow family! We're thrilled to have you on board. 
          You've just taken a powerful first step towards mastering your money and building a future of 
          financial freedom. Let's get you started on this exciting journey!
        </p>

        <section className="guide-section">
          <h2>What is RichFlow? The 'Why' Behind Your Wealth</h2>
          <p>
            Ever felt like you're stuck in a loop of earning and spending, without ever getting ahead? 
            Robert Kiyosaki, in his groundbreaking book "Rich Dad Poor Dad," calls this the 'Rat Race.' 
            RichFlow is your digital key to breaking free from that cycle.
          </p>
          <p>
            We built RichFlow based on one simple, yet profound, principle from the book: 
            <strong> It's not about how much money you make. It's about how much money you keep.</strong>
          </p>
          <p>
            RichFlow helps you do exactly that. It's a personal finance tracker that lets you <em>see</em> exactly 
            where your money is going, <em>track</em> your income and expense sources, and most importantly, <em>visualize</em> your cash flow. 
            By understanding your financial statement, you can start making informed decisions to grow 
            your wealth and secure your financial future.
          </p>
        </section>

        <section className="guide-section">
          <h2>A Quick Tour of RichFlow: Your Financial Dashboard</h2>
          <p>Let's walk through the features that will become your command center for building wealth.</p>
          <ul className="feature-list">
            <li>
              <strong>The Dashboard:</strong> Your financial world at a glance. The first thing you'll see is an income table and
              a summary. On the bottom right there is an expense table, for tracking your expenses. Both these tables 
              are part of your income statement, and they are summarized in the summary section. it's designed for clarity, not complexity.
            </li>
            <li>
              <strong>Income & Expense Tracking (Income Statement):</strong> Easily add your sources of income and your daily, 
              weekly, or monthly expenses. Your income is categorized into three types: Earned, Portfolio, and Passive Income. 
              The more accurately you track, the clearer your financial picture becomes.
            </li>
            <li>
              <strong>Summary Section:</strong> This is where the magic happens! The summary section gathers all the data you input in your income 
              statement and calculates your cashflow based on your total income and expenses.
            </li>
            <li>
              <strong>Cash Flow Visualization:</strong> We turn the numbers into a story. With beautiful graphs, you can visually track your cash flow over time. 
              This section also includes a progress bar, which lets you also track how close you are to financial freedom. 
              Financial freedom, as defined in the book, occurs when your passive and portfolio income
              are more than enough to cover your total expenses. Is your money working for you? 
              The visuals will tell you.
            </li>
            <li>
              <strong>Cash Savings:</strong> This section in the summary lets you manually set a value for your current savings, or the cash that you currently have at your
              disposal. Set at a default value of 0 upon signing up, your cash savings are earned from your income streams and are used to buy assets and pay for 
              liabilities and expenses.
            </li>
            <li>
              <strong>Assets & Liabilities Tracking (Balance Sheet):</strong> If you choose to enable the balance sheet, you are provided with an assets and liabilities section.
              This lets you track your assets and liabilities in the same way as your income and expenses. 
              They will also appear on the summary section as your total net worth.
            </li>
            <li>
              <strong>Saki AI Assistant:</strong> Saki is RichFlow's integrated AI assistant that gathers the data from your summary section and statements 
              and turns them into brief insights and actionable tips on the end of the user.
            </li>
          </ul>
        </section>

        <section className="guide-section">
          <h2>RichFlow Terminology: Speaking the Language of Wealth</h2>
          <p>To get the most out of RichFlow, it helps to understand these key terms from "Rich Dad Poor Dad":</p>
          <ul className="terminology-list">
            <li>
              <strong>Earned Income:</strong> Income that you make in exchange for your time and effort, like your salary or wages from a job,
              or freelance services. This is the main source of income for most people starting out.
            </li>
            <li>
                <strong>Passive Income:</strong> Income that you make from assets like businesses or investments that require little to no effort on your part to maintain.
                Examples include rental income or earnings from a business you own but don't actively manage.
                This type of income is crucial for achieving financial freedom.
            </li>
            <li>
              <strong>Portfolio Income:</strong> Income that you make from paper assets, such as dividends from stocks or interest from bonds.
              This type of income is important for building wealth over time.
            </li>
            <li>
              <strong>Asset:</strong> Anything that puts money in your pocket/savings. This could be a rental property, 
              stocks, bonds, or a business that generates income. In RichFlow, you'll log these to see how they 
              contribute to your income.
            </li>
            <li>
              <strong>Liability:</strong> Anything that takes money out of your pocket/savings. This includes your mortgage, 
              car payments, student loans, and credit card debt. Tracking these is the first step to minimizing them.
            </li>
            <li>
              <strong>Cash Flow:</strong> The direction money is moving. Rich Dad's lesson is simple: "Assets cash 
              flow into your pocket. Liabilities cash flow out." Your aim is to create positive cash flow from your 
              assets that exceeds your expenses.
            </li>
            <li>
              <strong>The Rat Race:</strong> The cycle of living paycheck to paycheck, where an increase in earnings 
              is often met with an increase in spending, preventing you from ever getting ahead. RichFlow is your 
              tool to escape it.
            </li>
            <li>
              <strong>Financial Independence/Freedom:</strong> The point at which your income from assets is enough to cover 
              all your living expenses. This is the ultimate goal, and RichFlow will help you map your path to get there.
            </li>
          </ul>
        </section>

        <section className="guide-section">
          <h2>How to Use RichFlow Wisely</h2>
          <p>
            RichFlow is a flexible tool, but here's an ideal approach to get you started on the right foot, 
            inspired by the principles of "Rich Dad Poor Dad."
          </p>
          <ul className="tips-list">
            <li>
              <strong>Be Consistent:</strong> Make it a habit to update and track your finances frequently. Whether you choose to do it 
              daily, weekly, or monthly, consistency is key. An ideal way to use RichFlow, for example, is to track your data in your income statement and balance sheet
              on a monthly basis: that is, at the end of each month, log all your income, expenses, assets, and liabilities.
            </li>
            <li>
              <strong>Be Honest:</strong> The tool is only as good as the data you put in. Be diligent about recording 
              <em> all</em> your income and expenses, no matter how small. That morning coffee or pair of sneakers counts!
            </li>
            <li>
              <strong>"Mind the Business That Pays You":</strong> Your primary job pays the bills, but your focus 
              should be on building your asset column. Use the insights from RichFlow to identify where you can cut 
              back on liabilities and redirect that money into acquiring assets.
            </li>
            <li>
              <strong>Read the Summary:</strong> Your dashboard summary is your report card. Are your assets growing? 
              Is your cash flow positive? Use this feedback to adjust your financial strategy.
            </li>
            <li>
              <strong>Experiment and Learn:</strong> RichFlow is your financial sandbox. Don't be afraid to try 
              different strategies. What happens if you reduce a certain expense? How quickly can you pay down a 
              liability? Use the app to model different scenarios. While RichFlow provides a framework, your financial 
              journey is unique to you.
            </li>
          </ul>
        </section>

        <section className="guide-section">
          <h2>Your Journey Starts Now</h2>
          <p>
            Thank you for choosing RichFlow as your partner in building wealth. Remember, the path to financial 
            independence is a marathon, not a sprint. Every entry you make, every insight you gain, is a step in 
            the right direction.
          </p>
          <p className="closing-message">
            Welcome once again to RichFlow. We can't wait to see you thrive!
          </p>
        </section>

        <button className="back-button" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>

        <footer className="user-guide-footer">
          <p>© 2025 RichFlow.</p>
          <div className="footer-links">
            <span>About Us</span> - <span>Privacy Policy</span> - <span>Contact Support</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default UserGuide;
