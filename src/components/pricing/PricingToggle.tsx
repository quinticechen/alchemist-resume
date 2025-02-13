
import { FC } from 'react';

interface PricingToggleProps {
  isAnnual: boolean;
  setIsAnnual: (value: boolean) => void;
}

export const PricingToggle: FC<PricingToggleProps> = ({ isAnnual, setIsAnnual }) => {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <span className={`text-lg ${!isAnnual ? 'text-primary font-semibold' : 'text-neutral-600'}`}>
        Monthly
      </span>
      <button
        onClick={() => setIsAnnual(!isAnnual)}
        className={`relative w-16 h-8 rounded-full transition-colors ${
          isAnnual ? 'bg-primary' : 'bg-neutral-300'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform transform ${
            isAnnual ? 'translate-x-8' : ''
          }`}
        />
      </button>
      <span className={`text-lg ${isAnnual ? 'text-primary font-semibold' : 'text-neutral-600'}`}>
        Annual
      </span>
      {isAnnual ? (
        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
          Save 25%
        </span>
      ) : (
        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
          Switch to annual plan to save 25%
        </span>
      )}
    </div>
  );
};
