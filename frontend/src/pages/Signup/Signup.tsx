import React from 'react';


const Signup: React.FC = () => {
  return (
    <div className="text-white w-screen h-screen flex items-center justify-center" 
    style={{ background: 'linear-gradient(to bottom right, #7345AF, #7345AF, #1E1E1E, #000000)' }}
  >
      <div 
      className="bg-opacity-60 backdrop-blur-sm rounded-lg flex items-center justify-center flex-col gap-7 p-8" 
      style={{ 
        backgroundColor: '#171717',
        width: '40vw',
        height: '80vh',
        boxSizing: 'border-box' // This ensures padding is included in the dimensions
      }}
      >
    
    {/* Box */}
    <div className="bg-opacity-60 w-full h-full flex items-center justify-center flex-col gap-5 backdrop-blur-sm p-8 max-w-md mx-auto rounded bg-#171717">
      <div className="flex items-center gap-3 mb-8 justify-center">
        <div className="w-12 h-12 bg-dark rounded-full flex items-center justify-center">
          <img src="./assets/richflow.png" alt="RichFlow Logo" />
        </div>
        <span className="text-5xl font-bold text-gold">RichFlow</span>
      </div>
      
      {/* Input Fields */}
      <div className="flex flex-col items-center justify-center gap-5 w-full max-w-md">
        <input 
          type="text" 
          placeholder="Username"
          className="w-full h-[50px] px-6 rounded-lg bg-gray-300 text-gray-700 placeholder-gray-600 font-bold focus:outline-none focus:ring-2 focus:ring-purple input"
        />
        
        <input 
          type="password" 
          placeholder="Password"
          className="w-full h-[50px] px-6 rounded-lg bg-gray-300 text-gray-700 placeholder-gray-600 font-bold focus:outline-none focus:ring-2 focus:ring-purple input"
        />
        
        <input 
          type="password" 
          placeholder="Confirm Password"
          className="w-full h-[50px] px-6 rounded-lg bg-gray-300 text-gray-700 placeholder-gray-600 font-bold focus:outline-none focus:ring-2 focus:ring-purple input"
        />
        
        <input 
          type="email" 
          placeholder="Email Address"
          className="w-full h-[50px] px-6 rounded-lg bg-gray-300 text-gray-700 placeholder-gray-600 font-bold focus:outline-none focus:ring-2 focus:ring-purple input"
        />
        
        {/* Button */}
        <button className="bg-purple w-[150px] h-[50px] text-gold px-8 py-3 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition btn-hover-effect">
          Sign Up
        </button>
      </div>
    </div>
  </div>
</div>
  );
};

export default Signup;
