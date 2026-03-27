import TurnTimer from './TurnTimer'
import InterjectionCharge from './InterjectionCharge'

const BottomControls = ({
  chargeA, chargeB,
  turnTimeLeft, localTurnDuration,
  isMyTurn, isCharged, role,
  inputText, isSubmitting,
  onInterject, onSubmit, onInputChange, onKeyDown,
}) => (
  <div className="shrink-0 border-t border-neutral-800 bg-neutral-950 px-4 pt-3 pb-4">
    <div className="flex justify-between items-end mb-3 px-1">
      <InterjectionCharge
        charge={chargeA}
        onInterject={onInterject}
        isMyTurn={isMyTurn}
        isCharged={role === 'debater_a' && isCharged}
        side="debater_a"
      />
      <TurnTimer timeLeft={turnTimeLeft} isMyTurn={isMyTurn} turnDuration={localTurnDuration} />
      <InterjectionCharge
        charge={chargeB}
        onInterject={onInterject}
        isMyTurn={isMyTurn}
        isCharged={role === 'debater_b' && isCharged}
        side="debater_b"
      />
    </div>

    <div className={`flex gap-2 items-end border transition-all
                     ${isMyTurn
                       ? 'border-yellow-500/30 focus-within:border-yellow-400'
                       : 'border-neutral-800 opacity-50'}`}>
      <textarea
        className="flex-1 bg-transparent px-4 py-3 text-sm text-neutral-300 outline-none
                   resize-none placeholder-neutral-700 font-mono-plex caret-yellow-400 leading-relaxed"
        placeholder={isMyTurn ? 'State your argument...' : 'Waiting for opponent...'}
        rows={2}
        maxLength={500}
        value={inputText}
        disabled={!isMyTurn || isSubmitting}
        onChange={onInputChange}
        onKeyDown={onKeyDown}
      />
      <button
        onClick={onSubmit}
        disabled={!isMyTurn || !inputText.trim() || isSubmitting}
        className={`px-5 py-3 self-stretch font-cinzel text-xs tracking-widest
                    transition-all cursor-pointer border-l border-neutral-800
                    ${isMyTurn && inputText.trim() && !isSubmitting
                      ? 'text-yellow-400 hover:bg-yellow-400 hover:text-black'
                      : 'text-neutral-700 cursor-not-allowed'}`}
      >
        {isSubmitting ? '...' : 'ARGUE'}
      </button>
    </div>

    <div className="flex justify-between mt-1.5 px-1">
      <span className="text-[0.55rem] text-neutral-700">
        {isMyTurn ? 'ENTER to submit · SHIFT+ENTER for new line' : ''}
      </span>
      <span className="text-[0.55rem] text-neutral-700">{inputText.length}/500</span>
    </div>
  </div>
)

export default BottomControls