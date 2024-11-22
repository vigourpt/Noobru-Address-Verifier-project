import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download } from 'lucide-react';
import Papa from 'papaparse';
import { verifyAddressBatch } from '../lib/openai';

const CSVVerifier: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      handleProcess(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const handleProcess = async (csvFile: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const results = await new Promise<Papa.ParseResult<any>>((resolve) => {
        Papa.parse(csvFile, {
          header: true,
          complete: resolve
        });
      });

      // Combine address fields for verification
      const addressesToVerify = results.data.map((row: any) => {
        const addressParts = [
          row['Ship To - Address 1'],
          row['Ship To - Address 2'],
          row['Ship To - Address 3'],
          row['Ship To - City'],
          row['Ship To - State'],
          row['Ship To - Postal Code'],
          row['Ship To - Country']
        ].filter(Boolean);
        return addressParts.join(', ');
      });

      // Verify addresses in batch
      const verifiedAddresses = await verifyAddressBatch(addressesToVerify);

      // Update the original data with verified addresses
      const processedData = results.data.map((row: any, index: number) => ({
        ...row,
        'Verified Address': verifiedAddresses[index]
      }));

      // Generate and download the CSV
      const csv = Papa.unparse(processedData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'verified_addresses.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to process addresses. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-700">
          Drop your ShipStation CSV file here, or click to select
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Columns will be automatically mapped based on ShipStation format
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center gap-3 p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Processing addresses...</p>
        </div>
      )}
    </div>
  );
};

export default CSVVerifier;