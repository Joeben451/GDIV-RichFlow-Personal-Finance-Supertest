import React from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
};

const RightSidePanel: React.FC<Props> = ({ isOpen, onClose, title, children }) => {
  // inject isOpen into child(ren) safely (casts to any for cloning)
  const childWithProp = React.Children.map(children, child =>
    React.isValidElement(child)
      ? React.cloneElement(child as React.ReactElement<any>, { isOpen })
      : child
  );

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/45 transition-opacity duration-240 ease-in-out z-49 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      {/* Panel */}
      <aside 
        className={`fixed top-0 right-0 h-full w-[400px] max-w-[90vw] bg-[#0b0b0b] shadow-[-8px_0_24px_rgba(0,0,0,0.6)] flex flex-col z-999999999 transition-transform duration-280ms ease-[cubic-bezier(.2,.9,.2,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:max-w-[90vw] max-md:w-screen`} 
        aria-hidden={!isOpen} 
        role="dialog" 
        aria-modal={isOpen}
      >
        <div className="flex items-center justify-between py-2.5 px-3.5 border-b border-white/4 gap-2">
          {title ? (
            <div className="font-bold text-white m-0 pr-2 whitespace-nowrap overflow-hidden text-ellipsis text-[clamp(1rem,2.5vw+0.5rem,1.2rem)]">
              {title}
            </div>
          ) : <div />}
          <button 
            className="bg-transparent text-white border-none text-[1.1rem] cursor-pointer py-1 px-2 hover:text-var(--color-gold)" 
            onClick={onClose} 
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>
        <div className="rf-ai-panel p-4 overflow-y-auto flex-1 text-[#e6e6e6] max-md:p-3 max-sm:p-2">{childWithProp}</div>
      </aside>
    </>
  );
};

export default RightSidePanel;
