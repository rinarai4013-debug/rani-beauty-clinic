'use client';

interface BookingStepsProps {
  currentStep: number;
  steps: string[];
}

export default function BookingSteps({ currentStep, steps }: BookingStepsProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`flex items-center gap-2 ${index <= currentStep ? 'text-[#0F1D2C]' : 'text-gray-300'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              index < currentStep
                ? 'bg-[#C9A96E] text-white'
                : index === currentStep
                  ? 'bg-[#0F1D2C] text-white'
                  : 'bg-gray-200 text-gray-400'
            }`}>
              {index < currentStep ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span className="text-sm font-medium hidden sm:inline">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 sm:w-16 h-0.5 mx-2 ${
              index < currentStep ? 'bg-[#C9A96E]' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
