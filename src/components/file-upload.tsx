"use client";

/**
 * File upload component with drag-and-drop and file picker support.
 *
 * Accepts `.csv` files only. Validates the file extension before calling
 * the `onFileSelect` callback. Shows distinct visual states for idle,
 * drag-over, loading, error, and file-selected.
 */

import * as React from "react";
import { Upload, FileText, AlertCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileUploadProps {
  /**
   * Called when the user selects or drops a valid `.csv` file.
   * The parent is responsible for parsing and error handling.
   */
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
  selectedFile: File | null;
  /** Whether a file is currently being processed. Disables all interactions. */
  isLoading?: boolean;
  /** Error message to display below the drop zone (e.g. invalid format). */
  error?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validate that a file has a `.csv` extension.
 *
 * @param file - The File object to check.
 * @returns True if the filename ends with `.csv` (case-insensitive).
 */
export function isCsvFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".csv");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Drag-and-drop CSV file upload zone with a file picker fallback.
 *
 * @param props - See FileUploadProps.
 */
export function FileUpload({
  onFileSelect,
  onFileClear,
  selectedFile,
  isLoading = false,
  error,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const displayError = error ?? localError;

  /** Handle a validated file: clear errors and notify parent. */
  function processFile(file: File) {
    if (!isCsvFile(file)) {
      setLocalError("Please select a CSV file (.csv extension required).");
      onFileClear();
      return;
    }
    setLocalError(null);
    onFileSelect(file);
  }

  // ---------------------------------------------------------------------------
  // Drag-and-drop handlers
  // ---------------------------------------------------------------------------

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isLoading) return;

    if (e.dataTransfer.files.length > 1) {
      setLocalError("Please upload one statement at a time.");
      onFileClear();
      return;
    }
    const file = e.dataTransfer.files[0];
    if (!file) return;
    processFile(file);
  }

  // ---------------------------------------------------------------------------
  // File picker handler
  // ---------------------------------------------------------------------------

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    // Reason: Reset value so the same file can be re-selected after an error.
    e.target.value = "";
  }

  function handlePickerClick() {
    fileInputRef.current?.click();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="relative flex flex-col gap-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={isLoading ? -1 : 0}
        aria-label="Drop CSV file here or click to browse"
        aria-disabled={isLoading}
        aria-busy={isLoading}
        data-drag={isDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={isLoading ? undefined : handlePickerClick}
        onKeyDown={(e) => {
          if (!isLoading && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handlePickerClick();
          }
        }}
        className={cn(
          "dropzone flex min-h-60 cursor-pointer flex-col items-start justify-between gap-6",
          "rounded-[2px] border border-dashed p-6 text-left transition-colors duration-200 sm:p-8",
          isDragOver && "border-solid border-ok bg-ok/10",
          !isDragOver &&
            !selectedFile &&
            "border-ok/60 bg-transparent hover:border-solid hover:border-ok hover:bg-ok/5",
          selectedFile && !isDragOver && "border-solid border-ok bg-ok/10",
          isLoading && "cursor-not-allowed opacity-60",
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-8 animate-spin text-ok" />
            <p className="text-sm text-muted-foreground">Processing file…</p>
          </>
        ) : selectedFile ? (
          <>
            <FileText className="size-6 text-ok" strokeWidth={1.25} aria-hidden />
            <div className="min-w-0 max-w-full" role="status">
              <p className="break-all font-mono text-sm">{selectedFile.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="tabular">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
                , ready to prepare
              </p>
              <p className="link-quiet mt-4 inline-block text-sm">
                Choose a different file
              </p>
            </div>
          </>
        ) : (
          <>
            <Upload className="size-6 text-ok" strokeWidth={1.25} aria-hidden />
            <div>
              <p className="text-[clamp(1.5rem,2.6vw,2rem)] leading-tight tracking-[-0.03em]">Drop your statement here<span className="caret" aria-hidden /></p>
              <p className="mt-1 text-sm text-muted-foreground">
                or choose a CSV file from your device
              </p>
            </div>
            <span className="inline-flex h-10 items-center rounded-full border border-ok px-5 text-sm text-ok">
              Browse files
            </span>
          </>
        )}
      </div>
      {selectedFile && !isLoading && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remove selected file"
          className="absolute right-3 top-3"
          onClick={() => {
            setLocalError(null);
            onFileClear();
          }}
        >
          <X className="size-4" />
        </Button>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        aria-hidden
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Error message */}
      {displayError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {displayError}
        </div>
      )}
    </div>
  );
}
