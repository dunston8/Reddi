import Image from "next/image"

type Props = {
  steps: string[]
  totalSteps: number
}

export function LoadingOverlay({ steps, totalSteps }: Props) {
  const currentStep = steps.length - 1

  return (
    <div className="loading-overlay">
      <div className="loading-card">

        {/* Logo */}
        <Image
          src="/Reddi_logo.png"
          alt="Reddi Logo"
          width={40}
          height={40}
          className="loading-logo"
        />

        {/* Progress Text */}
        <div className="text-black">
          {currentStep} / {totalSteps}
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${(currentStep / totalSteps) * 100}%`
            }}
          />
        </div>

        {/* Optional Step Description */}
        <div className="loading-step">
          {steps[steps.length - 1]}
        </div>

      </div>
    </div>
  )
}

export default LoadingOverlay;