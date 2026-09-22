import { HexLogo } from '../icons/HexLogo'

export function Brand() {
  return (
    <div className="brand">
      <div className="brand__mark">
        <HexLogo />
      </div>
      <div className="brand__wordmark">
        DOCU<span>MIND</span>
      </div>
    </div>
  )
}
