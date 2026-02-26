"use client";

/**
 * File upload component with drag-and-drop and file picker support.
 *
 * Accepts `.csv` files only. Validates the file extension before calling
 * the `onFileSelect` callback. Shows distinct visual states for idle,
 * drag-over, loading, error, and file-selected.
 */

import * as React from "react";
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
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
export function FileUpload({ onFileSelect, isLoading = false, error }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const displayError = error ?? localError;

  /** Handle a validated file: clear errors and notify parent. */
  function processFile(file: File) {
    if (!isCsvFile(file)) {
      setLocalError("Please select a CSV file (.csv extension required).");
      setSelectedFileName(null);
      return;
    }
    setLocalError(null);
    setSelectedFileName(file.name);
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
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={isLoading ? -1 : 0}
        aria-label="Drop CSV file here or click to browse"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={isLoading ? undefined : handlePickerClick}
        onKeyDown={(e) => {
          if (!isLoading && (e.key === "Enter" || e.key === " ")) {
            handlePickerClick();
          }
        }}
        className={cn(
          "flex min-h-48 cursor-pointer flex-col items-center justify-center gap-4",
          "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragOver && "border-primary bg-primary/5",
          !isDragOver && !selectedFileName && "border-muted-foreground/30 bg-muted/20 hover:border-muted-foreground/50 hover:bg-muted/30",
          selectedFileName && !isDragOver && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
          isLoading && "cursor-not-allowed opacity-60",
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-10 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Processing file…</p>
          </>
        ) : selectedFileName ? (
          <>
            <FileText className="size-10 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-300">
                {selectedFileName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click to select a different file
              </p>
            </div>
          </>
        ) : (
          <>
            <Upload className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {isDragOver ? "Drop your CSV here" : "Drop your CSV here"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                or click to browse — accepts .csv files only
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                // Reason: Stop propagation prevents the outer div's onClick
                // from firing again when the button is clicked.
                e.stopPropagation();
                handlePickerClick();
              }}
            >
              Browse files
            </Button>
          </>
        )}
      </div>

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
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          {displayError}
        </div>
      )}
    </div>
  );
}
