import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  return (
    <div className="text-white" style={{ background: 'linear-gradient(to bottom right, #7345AF, #7345AF, #1E1E1E, #000000)', minHeight: '100vh' }}>
      {/* Header */}
      <header className="bg-(--color-dark) px-4 sm:px-8 py-4 sm:py-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-(--color-dark) rounded-full flex items-center justify-center">
              <img src="/assets/richflow.png" alt="RichFlow Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl sm:text-4xl md:text-5xl font-bold text-(--color-gold)">RichFlow</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-4">
            <button onClick={() => navigate('/login')} className="btn-shimmer bg-(--color-purple) text-(--color-gold) px-6 sm:px-8 py-2 sm:py-3 rounded-2xl font-bold text-base sm:text-xl transition hover:-translate-y-0.5 hover:shadow-lg">
              { isAuthenticated ? 'Dashboard' : 'Log in'}
            </button>
            <button onClick={() => navigate('/signup')} className="btn-shimmer bg-(--color-purple) text-(--color-gold) px-6 sm:px-8 py-2 sm:py-3 rounded-2xl font-bold text-base sm:text-xl transition hover:-translate-y-0.5 hover:shadow-lg">
              Sign up
            </button>
          </nav>

          {/* Mobile Hamburger Menu */}
          <button 
            className="flex md:hidden flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-300 p-0 border-none bg-(--color-gold) rounded-full w-11 h-11"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`w-5 h-0.5 bg-(--color-dark) rounded-sm transition-all duration-300 ${mobileMenuOpen ? 'translate-y-1.5 rotate-45' : ''}`}></span>
            <span className={`w-5 h-0.5 bg-(--color-dark) rounded-sm transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-5 h-0.5 bg-(--color-dark) rounded-sm transition-all duration-300 ${mobileMenuOpen ? '-translate-y-1.5 -rotate-45' : ''}`}></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}></div>
            <nav className="absolute top-full left-4 right-4 bg-(--color-dark) border border-[#3a3a3a] rounded-xl p-4 flex flex-col gap-3 z-50 shadow-xl animate-[fadeIn_0.2s_ease]">
              <button 
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} 
                className="btn-shimmer bg-(--color-purple) text-(--color-gold) px-6 py-3 rounded-xl font-bold text-lg transition w-full"
              >
                { isAuthenticated ? 'Dashboard' : 'Log in'}
              </button>
              <button 
                onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }} 
                className="btn-shimmer bg-(--color-purple) text-(--color-gold) px-6 py-3 rounded-xl font-bold text-lg transition w-full"
              >
                Sign up
              </button>
            </nav>
          </>
        )}
      </header>

      {/* Hero Section */}
      <main style={{ minHeight: 'calc(100vh - 96px)' }} className="flex items-center justify-center px-4 sm:px-8 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-(--color-gold) mb-4 sm:mb-6 md:mb-8 leading-tight">
            See Where Your <span className="text-white">Money Flows</span> — and Make It Work for You.
          </h1>
          
          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-(--color-gold) italic font-light mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto px-4">
            Understand where your money goes and learn how to make it work toward your financial goals.
          </p>
          
          {/* CTA Button */}
            <button onClick={() => navigate('/signup')}
            className="btn-shimmer text-(--color-gold) px-6 sm:px-10 md:px-12 py-3 sm:py-4 md:py-5 rounded-2xl text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold transition shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
            style={{ background: 'linear-gradient(to bottom right, #7345AF, #7345AF, #1E1E1E, #000000)' }}
            >
            Get Started
            </button>
        </div>
      </main>
    </div>
  );
};

export default Landing;
