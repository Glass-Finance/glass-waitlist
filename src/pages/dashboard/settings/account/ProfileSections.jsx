import OtpBoxes from "../../../../components/common/OtpBoxes";

export function DeleteAccountModal({
  user,
  deleteStep,
  deleteConfirm,
  setDeleteConfirm,
  deleteError,
  deleteLoading,
  deletionCode,
  setDeletionCode,
  resendLoading,
  resendMessage,
  onClose,
  onRequestCode,
  onResendCode,
  onConfirmDeletion,
}) {
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/20">
      <div className="bg-surface-bg rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-surface-container-border">
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4 bg-danger-tint">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#DC2626"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>

        {deleteStep === "warn" ? (
          <>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Delete Account
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              This will permanently delete your account and all associated data
              from Glass. This cannot be undone.
            </p>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="w-full h-12 min-h-8 border-[1.5px] border-gray-300 px-4 py-1 rounded-lg text-placeholder outline-none focus:border-red-400 mb-4 transition-all"
            />
            {deleteError && (
              <p className="text-xs text-red-500 mb-3">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-gray-700 cursor-pointer transition-colors bg-stacked-container"
              >
                Cancel
              </button>
              <button
                onClick={onRequestCode}
                disabled={deleteConfirm !== "DELETE" || deleteLoading}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-white cursor-pointer transition-colors disabled:opacity-50 bg-danger"
              >
                {deleteLoading ? "Sending code…" : "Continue"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Enter Verification Code
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              We've sent a code to <strong>{user?.email}</strong>. Enter it
              below to permanently delete your account.
            </p>
            <div className="mb-4">
              <OtpBoxes
                value={deletionCode}
                onChange={setDeletionCode}
                disabled={deleteLoading}
              />
            </div>
            <div className="flex items-center justify-center mb-4">
              <button
                onClick={onResendCode}
                disabled={resendLoading || deleteLoading}
                className="text-xs font-medium cursor-pointer bg-transparent border-none transition-all disabled:opacity-50 text-brand"
              >
                {resendLoading ? "Resending…" : resendMessage || "Resend code"}
              </button>
            </div>
            {deleteError && (
              <p className="text-xs text-red-500 mb-3 text-center">
                {deleteError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-gray-700 cursor-pointer transition-colors bg-stacked-container"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmDeletion}
                disabled={deletionCode.some((digit) => !digit) || deleteLoading}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-white cursor-pointer transition-colors disabled:opacity-50 bg-danger"
              >
                {deleteLoading ? "Deleting…" : "Delete Account"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
