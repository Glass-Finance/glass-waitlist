import { Download, FileSpreadsheet, Check, X } from "lucide-react";
import uploadCloudIcon from "../../../assets/icons/upload-cloud.webp";
import { HEADERS, SAMPLE_ROW, downloadTemplate } from "../addMembersUtils";

// Extracted from AddMembers() as a pure presentational piece -- all state
// and handlers still live in the parent and come in as props, same shape
// as SuccessModal above. Kept as an explicit flat prop list (rather than
// a bundled object) so each prop maps 1:1 to the variable it replaced,
// making this a mechanical extraction with no behavior change.
export default function UploadMembersTab({
  uploadedFile,
  dragOver,
  setDragOver,
  fileRef,
  handleFile,
  handleDrop,
  fileUrl,
  setFileUrl,
  urlStage,
  urlProgress,
  urlFileInfo,
  handleUrlUpload,
  clearUrlUpload,
  loading,
  error,
  inputCls,
}) {
  return (
    <>
      <p className="text-sm font-semibold text-gray-900 mb-4">Upload a CSV</p>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-4">
        <p className="text-sm text-gray-500">Upload a CSV file with following sample information</p>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 text-xs font-medium text-brand hover:opacity-80 bg-transparent border-none cursor-pointer"
        >
          <Download size={12} />
          Download Template
        </button>
      </div>

      {/* Sample table — wider than any phone viewport, so it
          scrolls in its own strip instead of squeezing columns
          down to illegible widths. */}
      <div className="rounded-md overflow-x-auto mb-4 border border-[#E5E7EB]">
        <table className="w-full text-xs min-w-[560px]">
          <thead>
            <tr className="bg-gray-50">
              {HEADERS.map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100">
              {SAMPLE_ROW.map((cell, i) => (
                <td
                  key={i}
                  className={`px-4 py-3 ${i === 2 ? "text-brand underline" : "text-gray-900"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`w-full rounded-lg flex flex-col items-center justify-center py-8 cursor-pointer transition-all mb-5 min-h-[100px] border-dashed ${dragOver ? "border-2 bg-[#EEF2FF] border-brand" : "border bg-[#FAFAFA] border-gray-200"}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <img src={uploadCloudIcon} alt="" className="w-6 h-6 mb-2" />
        {uploadedFile ? (
          <p className="text-xs text-brand font-medium">{uploadedFile.name}</p>
        ) : (
          <p className="text-xs text-gray-500">
            Drag and Drop CSV here or{" "}
            <span className="text-brand font-medium underline">Browse</span>
          </p>
        )}
      </div>

      {/* URL upload */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">Or Upload from URL</p>
        <div className="flex gap-2">
          <input
            type="url"
            value={fileUrl}
            onChange={(e) => {
              setFileUrl(e.target.value);
              if (urlStage !== "idle") clearUrlUpload();
            }}
            placeholder="Add File URL"
            className={inputCls}
            disabled={urlStage === "fetching"}
          />
          <button
            onClick={handleUrlUpload}
            disabled={!fileUrl.trim() || urlStage === "fetching" || loading}
            className="px-5 py-2 rounded-lg bg-[#002FA733] text-xs text-brand hover:bg-brand/10 transition-all flex-shrink-0 border-none cursor-pointer disabled:opacity-50"
          >
            Upload
          </button>
        </div>

        {urlStage === "fetching" && (
          <div className="mt-3 flex items-center gap-3 rounded-lg px-4 py-3 border border-[#E5E7EB]">
            <FileSpreadsheet size={20} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-900 truncate">
                {fileUrl.split("/").pop() || "file.csv"}
              </p>
              <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-200 ease-linear"
                  style={{ width: `${urlProgress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">{Math.round(urlProgress)}%</span>
            <button
              onClick={clearUrlUpload}
              aria-label="Cancel upload"
              className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {urlStage === "complete" && urlFileInfo && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg px-4 py-3 border border-[#E5E7EB]">
            <FileSpreadsheet size={20} className="text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-900 truncate">{urlFileInfo.name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                {urlFileInfo.sizeLabel} • <Check size={11} className="text-green-600" />{" "}
                <span className="text-green-600 font-medium">Complete</span>
              </p>
            </div>
            <button
              onClick={clearUrlUpload}
              aria-label="Remove file"
              className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
    </>
  );
}
