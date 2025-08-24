
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface PricingToggleProps {
  isAnnual: boolean;
  setIsAnnual: (value: boolean) => void;
}

export const PricingToggle: FC<PricingToggleProps> = ({ isAnnual, setIsAnnual }) => {
  const { t } = useTranslation('pricing');

  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <span className={`text-lg ${!isAnnual ? 'text-primary font-semibold' : 'text-neutral-600'}`}>
        {t('toggle.monthly')}
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
        {t('toggle.annual')}
      </span>
      {isAnnual ? (
        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
          {t('toggle.saveDiscount')}
        </span>
      ) : (
        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
          {t('toggle.switchToAnnual')}
        </span>
      )}
    </div>
  );
};
