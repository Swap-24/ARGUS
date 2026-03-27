const AdmitDefeatModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <div className="border border-red-500/30 bg-[#0a0a0a] px-8 py-6 text-center">
      <p className="text-red-400 font-cinzel tracking-widest mb-2">ADMIT DEFEAT?</p>
      <p className="text-neutral-500 text-sm mb-6">This will instantly end the debate.</p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={onConfirm}
          className="px-5 py-2 border border-red-500 text-red-400 font-cinzel text-xs
                     tracking-widest hover:bg-red-500 hover:text-black transition-all cursor-pointer"
        >
          YES
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2 border border-neutral-700 text-neutral-400 font-cinzel
                     text-xs tracking-widest hover:border-white hover:text-white
                     transition-all cursor-pointer"
        >
          CANCEL
        </button>
      </div>
    </div>
  </div>
)

export default AdmitDefeatModal