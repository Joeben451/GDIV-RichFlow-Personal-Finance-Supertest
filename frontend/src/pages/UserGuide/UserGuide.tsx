import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UserGuide.css';

const UserGuide: React.FC = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="user-guide-container">
      <div className="user-guide-content">
        <h1 className="user-guide-title">Welcome to RichFlow!</h1>
        
        <p className="user-guide-intro">
          Hello there, and a warm welcome to the RichFlow family! We're thrilled to have you on board. 
          You've just taken a powerful first step towards mastering your money and building a future of 
          financial freedom. Let's get you started on this exciting journey!
        </p>

        {/* Table of Contents */}
        <nav className="table-of-contents">
          <h2 className="toc-title">Table of Contents</h2>
          <div className="toc-grid">
            <div className="toc-column">
              <div className="toc-category">Getting Started</div>
              <ul className="toc-list">
                <li><button onClick={() => scrollToSection('what-is-richflow')}>What is RichFlow?</button></li>
                <li><button onClick={() => scrollToSection('dashboard-tour')}>Your Financial Dashboard</button></li>
              </ul>
              
              <div className="toc-category">Advanced Features</div>
              <ul className="toc-list">
                <li><button onClick={() => scrollToSection('analysis-page')}>The Analysis Page</button></li>
                <li><button onClick={() => scrollToSection('trajectory-charts')}>Financial Trajectory Charts</button></li>
                <li><button onClick={() => scrollToSection('event-log')}>The Event Log</button></li>
              </ul>
            </div>
            
            <div className="toc-column">
              <div className="toc-category">Key Concepts</div>
              <ul className="toc-list">
                <li><button onClick={() => scrollToSection('cashflow-quadrant')}>The CASHFLOW Quadrant</button></li>
                <li><button onClick={() => scrollToSection('terminology')}>RichFlow Terminology</button></li>
              </ul>
              
              <div className="toc-category">Best Practices</div>
              <ul className="toc-list">
                <li><button onClick={() => scrollToSection('how-to-use')}>How to Use RichFlow Wisely</button></li>
                <li><button onClick={() => scrollToSection('path-to-freedom')}>Path to Financial Freedom</button></li>
                <li><button onClick={() => scrollToSection('journey-starts')}>Your Journey Starts Now</button></li>
              </ul>
            </div>
          </div>
        </nav>

        <section id="what-is-richflow" className="guide-section">
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

        <section id="dashboard-tour" className="guide-section">
          <h2>A Quick Tour of RichFlow: Your Financial Dashboard</h2>
          <p>Let's walk through the features that will become your command center for building wealth.</p>
          <ul className="feature-list">
            <li>
              <strong>The Dashboard:</strong> Your financial world at a glance. The first thing you'll see is an income table and
              a summary. On the bottom right there is an expense table, for tracking your expenses. Both these tables 
              are part of your income statement, and they are summarized in the summary section. It's designed for clarity, not complexity.
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

        <section id="analysis-page" className="guide-section">
          <h2>The Analysis Page: Your Financial X-Ray</h2>
          <p>
            The Analysis page is one of RichFlow's most powerful features—it's where your financial data transforms into 
            actionable intelligence. Here, you'll find deep insights into your financial trajectory, based on 
            Robert Kiyosaki's principles of wealth-building and the CASHFLOW Quadrant.
          </p>
          <ul className="feature-list">
            <li>
              <strong>Financial Snapshots:</strong> View your complete financial picture at any point in time. Use the date 
              selector to travel back and see exactly where you stood financially on any given day. This is invaluable for 
              tracking progress and understanding how your decisions have impacted your wealth.
            </li>
            <li>
              <strong>Net Worth Tracking:</strong> Your net worth is displayed prominently—this is your true financial score. 
              As Kiyosaki teaches, the goal isn't just to earn more, but to <em>build</em> more. Watch your net worth grow as 
              you acquire assets and pay down liabilities.
            </li>
            <li>
              <strong>Freedom Date Projection:</strong> This is your estimated date of financial freedom—the day when your 
              passive and portfolio income will cover all your expenses. RichFlow calculates this based on your current 
              trajectory. The closer you get, the more your money works for you instead of the other way around.
            </li>
            <li>
              <strong>Wealth Velocity:</strong> This metric shows how fast your net worth is growing each month. Positive 
              velocity means you're building wealth; negative means you're losing it. Use this to gauge whether your 
              financial strategy is working.
            </li>
            <li>
              <strong>Solvency Ratio:</strong> This measures your total liabilities against your total assets. A ratio 
              below 30% is considered safe, 30-60% requires caution, and above 60% is high risk. The goal is to keep 
              this number low by acquiring assets and reducing debt.
            </li>
            <li>
              <strong>Freedom Gap:</strong> This shows the difference between your current passive/portfolio income and 
              your total expenses. When this number reaches zero or becomes positive, you've achieved financial freedom—
              your money is fully working for you!
            </li>
            <li>
              <strong>Income Quadrant Analysis:</strong> Based on Kiyosaki's CASHFLOW Quadrant, RichFlow categorizes your 
              income into four types: <strong>Employee (E)</strong>, <strong>Self-Employed (S)</strong>, 
              <strong>Business Owner (B)</strong>, and <strong>Investor (I)</strong>. The goal is to shift your income 
              from the left side (E/S) to the right side (B/I), where true wealth and freedom are built.
            </li>
            <li>
              <strong>Compare Two Dates:</strong> Want to see how far you've come? Use the comparison feature to analyze 
              your financial evolution between any two dates. See how your net worth, runway, freedom date, and income 
              quadrant have shifted over time.
            </li>
            <li>
              <strong>Runway:</strong> This tells you how many months you could survive on your current cash and assets 
              if all income stopped. A longer runway means more financial security and freedom to take calculated risks.
            </li>
            <li>
              <strong>Asset Efficiency (ROA):</strong> Return on Assets measures how effectively your assets generate 
              income. A higher percentage means your assets are working harder for you—a key principle in building wealth.
            </li>
            <li>
              <strong>Passive Coverage Ratio:</strong> This percentage shows how much of your expenses are covered by 
              passive and portfolio income. When this reaches 100%, you've escaped the Rat Race!
            </li>
          </ul>
        </section>

        <section id="trajectory-charts" className="guide-section">
          <h2>Financial Trajectory Charts: Visualize Your Journey</h2>
          <p>
            The Analysis page features four powerful charts that visualize your path to financial freedom over time. 
            These charts update automatically based on the date range you select and help you understand trends in your 
            financial journey.
          </p>
          <ul className="feature-list">
            <li>
              <strong>The Rat Race Escape Chart:</strong> This is perhaps the most important visualization in RichFlow. 
              It plots your <em>Passive + Portfolio Income</em> (the green line) against your <em>Total Expenses</em> (the red line). 
              The moment these lines cross—when passive income exceeds expenses—marks your escape from the Rat Race. 
              A green dot will appear at this crossover point, celebrating your achievement!
            </li>
            <li>
              <strong>Net Worth & Velocity Chart:</strong> Watch your net worth grow (or track where it needs attention) 
              over time with the gold line. The purple bars show your wealth velocity—the rate of change in your net worth 
              each period. Consistent positive velocity is the sign of a healthy financial strategy.
            </li>
            <li>
              <strong>Asset Efficiency (ROA) Chart:</strong> Track how efficiently your assets are generating income over 
              time. An upward trend means you're getting better at making your money work for you—a core Kiyosaki principle.
            </li>
            <li>
              <strong>Quadrant Evolution Chart:</strong> This stacked area chart shows how your income distribution across 
              the four quadrants (Employee, Self-Employed, Business Owner, Investor) changes over time. The goal is to see 
              the B and I sections grow while E and S shrink, indicating a shift toward true financial freedom.
            </li>
          </ul>
        </section>

        <section id="event-log" className="guide-section">
          <h2>The Event Log: Your Financial History</h2>
          <p>
            Every financial decision you make is recorded in the Event Log. This feature provides a complete, 
            transparent history of all your financial activities—creating accountability and helping you learn 
            from your financial patterns.
          </p>
          <ul className="feature-list">
            <li>
              <strong>Complete Transaction History:</strong> Every income source added, expense logged, asset acquired, 
              or liability recorded is timestamped and stored. You can see exactly when each financial event occurred 
              and how it impacted your overall position.
            </li>
            <li>
              <strong>Filter by Type:</strong> Focus on specific categories—Income, Expense, Asset, Liability, Cash, 
              or User events. This helps you analyze patterns in specific areas of your finances.
            </li>
            <li>
              <strong>Date Range Filtering:</strong> Look at events within a specific time period. This is useful for 
              monthly reviews, quarterly analysis, or understanding what happened during a particular financial period.
            </li>
            <li>
              <strong>Search Functionality:</strong> Quickly find specific transactions by searching descriptions or types. 
              Looking for that specific income source or expense? Just type and find.
            </li>
            <li>
              <strong>Value Change Tracking:</strong> Each event shows its impact on your finances with positive changes 
              (income, assets) shown in green and negative changes (expenses, liabilities) shown in red. This gives you 
              an at-a-glance understanding of each transaction's effect.
            </li>
            <li>
              <strong>Currency History:</strong> If you've changed your preferred currency, the Event Log respects 
              historical currency contexts, showing transactions in the currency that was active at the time they occurred.
            </li>
          </ul>
        </section>

        <section id="cashflow-quadrant" className="guide-section">
          <h2>Understanding the CASHFLOW Quadrant</h2>
          <p>
            One of Robert Kiyosaki's most influential teachings is the CASHFLOW Quadrant, which divides income 
            earners into four categories. RichFlow tracks which quadrant your income comes from and helps you 
            strategize your shift toward financial freedom.
          </p>
          <ul className="terminology-list">
            <li>
              <strong>E - Employee:</strong> You work for someone else and trade your time for money. This is where 
              most people start, but it's also the quadrant with the least control and highest taxes. Your earned 
              income from jobs and salaries falls here.
            </li>
            <li>
              <strong>S - Self-Employed:</strong> You own your job—you're a freelancer, consultant, or small business 
              owner where the business depends on you. You have more control, but you're still trading time for money. 
              If you stop working, income stops.
            </li>
            <li>
              <strong>B - Business Owner:</strong> You own a system and people work for you. The business generates 
              income whether you're there or not. This is where passive income begins to flow—businesses that run 
              without your daily involvement.
            </li>
            <li>
              <strong>I - Investor:</strong> Your money works for you. You invest in assets that generate returns—
              stocks, real estate, bonds, and other investments. This is the ultimate goal: making money while you sleep.
            </li>
          </ul>
          <p>
            <strong>The Goal:</strong> Kiyosaki teaches that true financial freedom comes from moving your income 
            from the left side (E & S) to the right side (B & I) of the quadrant. RichFlow's Income Quadrant chart 
            helps you visualize and track this transition over time.
          </p>
        </section>

        <section id="terminology" className="guide-section">
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
            <li>
              <strong>Wealth Velocity:</strong> The rate at which your net worth is growing. Positive velocity means 
              you're building wealth faster than you're spending it—a key metric tracked in RichFlow's Analysis page.
            </li>
            <li>
              <strong>Freedom Gap:</strong> The difference between your passive/portfolio income and your total expenses. 
              When this gap closes to zero, you've achieved financial freedom.
            </li>
            <li>
              <strong>Runway:</strong> How many months you could sustain your lifestyle on current cash and assets 
              if all income stopped. A longer runway provides security and the freedom to take calculated risks.
            </li>
          </ul>
        </section>

        <section id="how-to-use" className="guide-section">
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
              <strong>Review Your Analysis Regularly:</strong> Visit the Analysis page weekly or monthly to check your 
              Freedom Gap, Wealth Velocity, and Income Quadrant. Are you moving in the right direction? Is your 
              passive income growing? These metrics tell the real story of your financial progress.
            </li>
            <li>
              <strong>Watch the Rat Race Escape Chart:</strong> This single visualization shows your path to freedom. 
              The day your passive income line crosses above your expenses line is the day you've won. Track this 
              relentlessly and celebrate when it happens!
            </li>
            <li>
              <strong>Use the Event Log for Accountability:</strong> Review your Event Log periodically to understand 
              your financial patterns. Are you adding more assets than liabilities? Are your income events outpacing 
              expense events? The log keeps you honest.
            </li>
            <li>
              <strong>Compare Your Progress:</strong> Use the Compare feature in Analysis to see your growth over 
              quarters or years. Seeing your net worth increase, your runway extend, and your freedom date get closer 
              is incredibly motivating.
            </li>
            <li>
              <strong>Shift Your Quadrant:</strong> Use the Income Quadrant analysis to guide your career and investment 
              decisions. If you're 100% in the Employee quadrant, start thinking about how to generate some Investor 
              income—even a small dividend counts!
            </li>
            <li>
              <strong>Experiment and Learn:</strong> RichFlow is your financial sandbox. Don't be afraid to try 
              different strategies. What happens if you reduce a certain expense? How quickly can you pay down a 
              liability? Use the app to model different scenarios. While RichFlow provides a framework, your financial 
              journey is unique to you.
            </li>
          </ul>
        </section>

        <section id="path-to-freedom" className="guide-section">
          <h2>The Path to Financial Freedom: A Step-by-Step Guide</h2>
          <p>
            Based on Kiyosaki's teachings, here's how to use RichFlow to systematically build your path to financial 
            freedom:
          </p>
          <ul className="tips-list">
            <li>
              <strong>Step 1 - Know Your Numbers:</strong> Start by entering all your current income sources, expenses, 
              assets, and liabilities into RichFlow. Get an accurate picture of where you stand today. Check your 
              Net Worth on the Analysis page—this is your starting point.
            </li>
            <li>
              <strong>Step 2 - Calculate Your Freedom Gap:</strong> Look at your Freedom Gap in the Analysis page. 
              This number tells you exactly how much more passive/portfolio income you need to achieve financial 
              freedom. This is your target.
            </li>
            <li>
              <strong>Step 3 - Pay Yourself First:</strong> Before paying expenses, set aside money for acquiring 
              assets. Track this in your Cash Savings and watch it grow. As Kiyosaki says, "The rich invest their 
              money and spend what is left. The poor spend their money and invest what is left."
            </li>
            <li>
              <strong>Step 4 - Acquire Income-Producing Assets:</strong> Use your savings to buy assets that generate 
              passive or portfolio income. Log these in your Balance Sheet and watch your income quadrant shift 
              toward the right side.
            </li>
            <li>
              <strong>Step 5 - Minimize Liabilities:</strong> Reduce debt and avoid acquiring new liabilities. 
              Your Solvency Ratio should decrease over time. Remember: liabilities take money from your pocket.
            </li>
            <li>
              <strong>Step 6 - Track and Adjust:</strong> Use the Analysis page regularly to monitor your Wealth 
              Velocity, Freedom Date, and trajectory charts. If something isn't working, the data will show you. 
              Adjust your strategy accordingly.
            </li>
            <li>
              <strong>Step 7 - Celebrate the Crossover:</strong> When your Rat Race Escape chart shows the green 
              line (passive income) crossing above the red line (expenses), you've done it! You've achieved 
              financial freedom. But don't stop—continue building to create generational wealth.
            </li>
          </ul>
        </section>

        <section id="journey-starts" className="guide-section">
          <h2>Your Journey Starts Now</h2>
          <p>
            Thank you for choosing RichFlow as your partner in building wealth. Remember, the path to financial 
            independence is a marathon, not a sprint. Every entry you make, every insight you gain, is a step in 
            the right direction.
          </p>
          <p>
            As Robert Kiyosaki says: <em>"The single most powerful asset we all have is our mind. If it is 
            trained well, it can create enormous wealth."</em> RichFlow is here to train your financial mind 
            and give you the tools to create that wealth.
          </p>
          <p className="closing-message">
            Welcome once again to RichFlow. We can't wait to see you escape the Rat Race and thrive!
          </p>
        </section>

        <button className="user-guide-back-button" onClick={() => navigate('/dashboard')}>
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
