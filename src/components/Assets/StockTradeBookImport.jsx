import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Upload } from 'lucide-react';
import Button from '../Common/Button';
import { usePortfolio } from '../../context/PortfolioContext';
import { mergeTradeBookRowsIntoPortfolio, parseTradeBookFile, SUPPORTED_TRADE_BOOK_HEADERS } from '../../utils/tradeBookImport';

const ACCEPTED_FILE_TYPES = '.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

export default function StockTradeBookImport() {
  const fileInputRef = useRef(null);
  const { data, updateData, showToast } = usePortfolio();
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState(null);
  const helpTextId = 'stock-trade-book-import-help';
  const dropzoneTextId = 'stock-trade-book-import-dropzone-help';

  const supportedHeaders = [
    ...SUPPORTED_TRADE_BOOK_HEADERS.symbol.slice(0, 4),
    ...SUPPORTED_TRADE_BOOK_HEADERS.type.slice(0, 2),
    ...SUPPORTED_TRADE_BOOK_HEADERS.quantity.slice(0, 2),
    ...SUPPORTED_TRADE_BOOK_HEADERS.price.slice(0, 2),
    SUPPORTED_TRADE_BOOK_HEADERS.date[0],
    SUPPORTED_TRADE_BOOK_HEADERS.orderId[0],
    SUPPORTED_TRADE_BOOK_HEADERS.tradeId[0],
  ].join(', ');

  const handleProcessedImport = async (file) => {
    if (!file) return;

    setIsImporting(true);
    try {
      const parsed = await parseTradeBookFile(file);
      const nextResult = mergeTradeBookRowsIntoPortfolio(data, parsed, file.name);
      setResult({ ...nextResult, fileName: file.name });

      if (nextResult.summary.importedCount > 0) {
        updateData(nextResult.data);
        const successMessage = nextResult.summary.rejectedCount > 0 || nextResult.summary.duplicateCount > 0
          ? `Imported ${nextResult.summary.importedCount} trade${nextResult.summary.importedCount === 1 ? '' : 's'} with some skips`
          : `Imported ${nextResult.summary.importedCount} trade${nextResult.summary.importedCount === 1 ? '' : 's'} successfully`;
        showToast(successMessage);
      } else if (nextResult.fatalError) {
        showToast(nextResult.fatalError, 'error');
      } else if (nextResult.summary.duplicateCount > 0 && nextResult.summary.rejectedCount === 0) {
        showToast('No new trades were imported because all rows matched existing transactions', 'error');
      } else {
        showToast('Trade book import failed. Review the row errors and try again.', 'error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The workbook could not be read';
      setResult({
        fileName: file.name,
        fatalError: message,
        missingColumns: [],
        errors: [],
        duplicateRows: [],
        skippedRows: [],
        summary: {
          totalRows: 0,
          importedCount: 0,
          duplicateCount: 0,
          rejectedCount: 0,
          skippedCount: 0,
          createdAssetsCount: 0,
          updatedAssetsCount: 0,
        },
      });
      showToast(`Failed to import trade book: ${message}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleInputChange = async (event) => {
    const file = event.target.files?.[0];
    await handleProcessedImport(file);
    event.target.value = '';
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    await handleProcessedImport(file);
  };

  return (
    <div className="mb-5 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-900/10 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <FileSpreadsheet className="h-4 w-4" />
            <p className="text-sm font-semibold">Import stock trade book</p>
          </div>
          <p className="text-xs leading-5 text-gray-600 dark:text-gray-300">
            Upload a broker trade book in <span className="font-medium">.xlsx</span> or <span className="font-medium">.xls</span> format.
            Zerodha trade-book files are supported, including reports with logo, Client ID, and title rows before the table.
            Required fields are matched case-insensitively and duplicates are skipped using trade or order identifiers when available,
            otherwise by a stable symbol/date/side/quantity/price fingerprint.
          </p>
          <p id={helpTextId} className="text-[11px] leading-5 text-gray-500 dark:text-gray-400">
            Supported header aliases include: {supportedHeaders}. ISIN headers are detected for validation, but each imported row still needs a tradable symbol/ticker.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleInputChange}
          className="hidden"
          aria-label="Upload stock trade book Excel file"
        />
        <Button
          size="sm"
          variant="secondary"
          icon={<Upload className={`h-3.5 w-3.5 ${isImporting ? 'animate-spin' : ''}`} />}
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          {isImporting ? 'Importing…' : 'Choose Excel File'}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => !isImporting && fileInputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          if (isImporting) return;
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (isImporting) return;
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (isImporting) return;
          setDragActive(false);
        }}
        onDrop={handleDrop}
        className={`mt-4 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-indigo-50 dark:focus:ring-offset-gray-900 ${
          dragActive
            ? 'border-indigo-500 bg-white dark:bg-gray-800'
            : 'border-indigo-200 dark:border-indigo-700 bg-white/80 dark:bg-gray-800/60'
        } ${isImporting ? 'cursor-progress opacity-80' : 'cursor-pointer'}`}
        disabled={isImporting}
        aria-disabled={isImporting}
        aria-busy={isImporting}
        aria-describedby={`${helpTextId} ${dropzoneTextId}`}
      >
        <Upload className={`mx-auto mb-3 h-8 w-8 text-indigo-500 ${isImporting ? 'animate-spin' : ''}`} />
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {isImporting ? 'Reading workbook and validating trades…' : 'Drop your Excel file here or click to browse'}
        </p>
        <p id={dropzoneTextId} className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Imported rows are merged into your current stock holdings without replacing manual positions.
        </p>
      </button>

      {result && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            result.summary.importedCount > 0
              ? 'border-green-200 bg-green-50/80 dark:border-green-800 dark:bg-green-900/10'
              : result.fatalError
                ? 'border-red-200 bg-red-50/80 dark:border-red-800 dark:bg-red-900/10'
                : 'border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-900/10'
          }`}
          aria-live="polite"
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {result.summary.importedCount > 0
                  ? `Import completed for ${result.fileName}`
                  : result.fatalError
                    ? `Import failed for ${result.fileName}`
                    : `No new trades imported from ${result.fileName}`}
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                {result.fatalError
                  ? result.fatalError
                  : `${result.summary.importedCount} imported, ${result.summary.duplicateCount} duplicates, ${result.summary.skippedCount} skipped, ${result.summary.rejectedCount} rejected.`}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryTile label="Rows scanned" value={result.summary.totalRows} />
              <SummaryTile label="Imported" value={result.summary.importedCount} />
              <SummaryTile label="Duplicates" value={result.summary.duplicateCount} />
              <SummaryTile label="Skipped" value={result.summary.skippedCount} />
              <SummaryTile label="Rejected" value={result.summary.rejectedCount} />
            </div>

            {result.summary.importedCount > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryTile label="Stocks updated" value={result.summary.updatedAssetsCount} />
                <SummaryTile label="New holdings created" value={result.summary.createdAssetsCount} />
              </div>
            )}

            {result.missingColumns?.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">
                Missing required columns: {result.missingColumns.join(', ')}
              </div>
            )}

            {result.errors?.length > 0 && (
              <details className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
                <summary className="cursor-pointer font-medium">Row errors ({result.errors.length})</summary>
                <ul className="mt-3 space-y-2">
                  {result.errors.map((error) => (
                    <li key={`${error.rowNumber}-${error.message}`} className="leading-5">
                      <span className="font-semibold">Row {error.rowNumber}:</span> {error.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {result.skippedRows?.length > 0 && (
              <details className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
                <summary className="cursor-pointer font-medium">Skipped non-trade rows ({result.skippedRows.length})</summary>
                <ul className="mt-3 space-y-2">
                  {result.skippedRows.map((entry) => (
                    <li key={`${entry.rowNumber}-${entry.message}`} className="leading-5">
                      <span className="font-semibold">Row {entry.rowNumber}:</span> {entry.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {result.duplicateRows?.length > 0 && (
              <details className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
                <summary className="cursor-pointer font-medium">Skipped duplicates ({result.duplicateRows.length})</summary>
                <ul className="mt-3 space-y-2">
                  {result.duplicateRows.map((entry) => (
                    <li key={`${entry.rowNumber}-${entry.symbol}`} className="leading-5">
                      <span className="font-semibold">Row {entry.rowNumber}:</span> {entry.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
