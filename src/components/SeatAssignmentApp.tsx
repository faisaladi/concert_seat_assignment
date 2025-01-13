'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Upload, RotateCcw, CheckCircle, FileWarning, ClipboardCopy, Loader2 } from 'lucide-react';


// Sample data
const SAMPLE_SEAT_MAP = `DIAMOND,1A,false
DIAMOND,1B,false
DIAMOND,---,false
DIAMOND,1C,false
DIAMOND,1D,true
PLATINUM,1A,false
PLATINUM,1B,false
PLATINUM,1C,false`;

const SAMPLE_BUYER_LIST = `DIAMOND,INV001,TICK001
DIAMOND,INV001,TICK002
PLATINUM,INV002,TICK003`;

// Interfaces
interface Seat {
  category: string;
  seatNumber: string;
  isBlocked: boolean;
}

interface Buyer {
  category: string;
  invoice: string;
  ticketCode: string;
}

interface Assignment {
  category: string;
  invoice: string;
  ticketCode: string;
  seatNumber: string;
}

interface ProcessLog {
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export default function SeatAssignmentApp() {
  // State declarations
  const [seatMap, setSeatMap] = useState<Seat[]>([]);
  const [buyerList, setBuyerList] = useState<Buyer[]>([]);
  const [results, setResults] = useState<Assignment[]>([]);
  const [error, setError] = useState("");
  const [fileName1, setFileName1] = useState("No file chosen");
  const [fileName2, setFileName2] = useState("No file chosen");

  // New state for loading and logs
  const [isProcessing, setIsProcessing] = useState(false);
  const [processLogs, setProcessLogs] = useState<ProcessLog[]>([]);

  // Refs
  const seatMapInputRef = useRef<HTMLInputElement>(null);
  const buyerListInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: ProcessLog['type'] = 'info') => {
    const newLog: ProcessLog = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    };
    setProcessLogs(prev => [...prev, newLog]);
    // Scroll to bottom of logs
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const resetAll = () => {
    setSeatMap([]);
    setBuyerList([]);
    setResults([]);
    setError("");
    setFileName1("No file chosen");
    setFileName2("No file chosen");
    setProcessLogs([]);
    if (seatMapInputRef.current) seatMapInputRef.current.value = '';
    if (buyerListInputRef.current) buyerListInputRef.current.value = '';
  };

  const handleFileUpload = async (file: File, type: 'seatMap' | 'buyerList') => {
    try {
      addLog(`Started reading ${type} file: ${file.name}`, 'info');
      
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());
      
      addLog(`Found ${rows.length} rows in ${type}`, 'info');
      
      if (type === 'seatMap') {
        parseSeatMap(text);
      } else {
        parseBuyerList(text);
      }
    } catch (err) {
      const errorMessage = `Error reading ${type} file: ${(err as Error).message}`;
      setError(errorMessage);
      addLog(errorMessage, 'error');
    }
  };

  const downloadSampleCsv = (type: 'seatMap' | 'buyerList') => {
    const content = type === 'seatMap' ? SAMPLE_SEAT_MAP : SAMPLE_BUYER_LIST;
    const fileName = type === 'seatMap' ? 'sample_seat_map.csv' : 'sample_buyer_list.csv';
    
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const parseSeatMap = (text: string) => {
    try {
      const rows = text.split('\n');
      const parsedData = rows
        .filter(row => row.trim())
        .map((row, index) => {
          const [category, seatNumber, isBlocked] = row.split(',');
          if (!category || !seatNumber || isBlocked === undefined) {
            throw new Error(`Invalid row format at line ${index + 1}`);
          }
          return {
            category: category.trim(),
            seatNumber: seatNumber.trim(),
            isBlocked: isBlocked.trim().toLowerCase() === 'true'
          };
        });
      
      addLog(`Successfully parsed ${parsedData.length} seats`, 'success');
      addLog(`Categories found: ${[...new Set(parsedData.map(d => d.category))].join(', ')}`, 'info');
      
      setSeatMap(parsedData);
      setError("");
    } catch (err) {
      const errorMessage = `Error parsing seat map CSV: ${(err as Error).message}`;
      setError(errorMessage);
      addLog(errorMessage, 'error');
    }
  };

  const parseBuyerList = (text: string) => {
    try {
      const rows = text.split('\n');
      const parsedData = rows
        .filter(row => row.trim())
        .map((row, index) => {
          const [category, invoice, ticketCode] = row.split(',');
          if (!category || !invoice || !ticketCode) {
            throw new Error(`Invalid row format at line ${index + 1}`);
          }
          return {
            category: category.trim(),
            invoice: invoice.trim(),
            ticketCode: ticketCode.trim()
          };
        });
      
      addLog(`Successfully parsed ${parsedData.length} buyers`, 'success');
      addLog(`Unique invoices: ${new Set(parsedData.map(d => d.invoice)).size}`, 'info');
      
      setBuyerList(parsedData);
      setError("");
    } catch (err) {
      const errorMessage = `Error parsing buyer list CSV: ${(err as Error).message}`;
      setError(errorMessage);
      addLog(errorMessage, 'error');
    }
  };

  const validateData = () => {
    // Check for category mismatches
    const seatCategories = new Set(seatMap.map(s => s.category.toUpperCase()));
    const buyerCategories = new Set(buyerList.map(b => b.category.toUpperCase()));
    
    const invalidCategories = Array.from(buyerCategories).filter(c => !seatCategories.has(c));
    if (invalidCategories.length > 0) {
      addLog(`Error: Found buyer categories that don't exist in seat map: ${invalidCategories.join(', ')}`, 'error');
      return false;
    }
  
    // Log category statistics
    Array.from(seatCategories).forEach(category => {
      const totalSeats = seatMap.filter(s => s.category.toUpperCase() === category).length;
      const totalBuyers = buyerList.filter(b => b.category.toUpperCase() === category).length;
      addLog(`Category ${category}: ${totalSeats} seats, ${totalBuyers} buyers`, 'info');
    });
  
    return true;
  };

  const findBestSeatsForGroup = (
    availableSeats: Seat[],
    numberOfTickets: number,
    category: string
  ): Seat[] => {
    addLog(`Finding best ${numberOfTickets} seats in ${category}`, 'info');
  
    // First, find all possible consecutive seat groups
    const consecutiveGroups: Seat[][] = [];
    let currentGroup: Seat[] = [];
  
    for (let i = 0; i < availableSeats.length; i++) {
      // If this is the start of a group or continues the current group
      if (currentGroup.length === 0 || 
          isNextSeat(currentGroup[currentGroup.length - 1], availableSeats[i])) {
        currentGroup.push(availableSeats[i]);
      } else {
        // End of a group
        if (currentGroup.length > 0) {
          consecutiveGroups.push([...currentGroup]);
        }
        currentGroup = [availableSeats[i]];
      }
    }
    // Don't forget the last group
    if (currentGroup.length > 0) {
      consecutiveGroups.push(currentGroup);
    }
  
    addLog(`Found ${consecutiveGroups.length} groups of consecutive seats`, 'info');
    consecutiveGroups.forEach((group, index) => {
      addLog(`Group ${index + 1}: ${group.map(s => s.seatNumber).join(', ')}`, 'info');
    });
  
    // Find the best group that can accommodate the entire party
    const perfectGroup = consecutiveGroups.find(group => group.length >= numberOfTickets);
    if (perfectGroup) {
      addLog(`Found perfect consecutive group: ${perfectGroup.slice(0, numberOfTickets).map(s => s.seatNumber).join(', ')}`, 'success');
      return perfectGroup.slice(0, numberOfTickets);
    }
  
    // If we can't find a perfect group, find the largest available consecutive group
    const largestGroup = consecutiveGroups.reduce((largest, current) => 
      current.length > largest.length ? current : largest, [] as Seat[]);
  
    addLog(`Largest consecutive group has ${largestGroup.length} seats`, 'info');
  
    // If the largest consecutive group is big enough to fit most of the party (e.g., 80%)
    const SPLIT_THRESHOLD = 0.8; // Configurable threshold
    if (largestGroup.length >= numberOfTickets * SPLIT_THRESHOLD) {
      addLog(`Using largest available consecutive group and splitting remaining tickets`, 'warning');
      const remainingTickets = numberOfTickets - largestGroup.length;
      const remainingSeats = availableSeats.filter(seat => 
        !largestGroup.find(s => s.seatNumber === seat.seatNumber)
      ).slice(0, remainingTickets);
  
      return [...largestGroup, ...remainingSeats];
    }
  
    // If we have to split the group completely, try to find the smallest number of splits possible
    addLog(`No suitable consecutive groups found, attempting to minimize splits`, 'warning');
    return availableSeats.slice(0, numberOfTickets);
  };
  
  // Helper function to determine if two seats are consecutive
  const isNextSeat = (seat1: Seat, seat2: Seat): boolean => {
    // Extract the numeric and letter parts of the seat numbers
    const parse = (seatNumber: string) => {
      const match = seatNumber.match(/([A-Z]+)(\d+)/);
      if (!match) return { row: '', number: 0 };
      return {
        row: match[1],
        number: parseInt(match[2], 10)
      };
    };
  
    const s1 = parse(seat1.seatNumber);
    const s2 = parse(seat2.seatNumber);
  
    // Seats are consecutive if they're in the same row and numbers differ by 1
    return s1.row === s2.row && Math.abs(s1.number - s2.number) === 1;
  };
  
  
const assignSeats = async () => {
  if (!validateData()) {
    setIsProcessing(false);
    return;
  }
  
  if (seatMap.length === 0 || buyerList.length === 0) {
    setError("Please upload both seat map and buyer list files first.");
    return;
  }

  setIsProcessing(true);
  setError("");
  setProcessLogs([]); // Clear previous logs
  addLog("Starting seat assignment process...", 'info');

  try {
    // Group buyers by invoice
    addLog("Grouping buyers by invoice...", 'info');
    const buyersByInvoice = buyerList.reduce((acc, buyer) => {
      if (!acc[buyer.invoice]) {
        acc[buyer.invoice] = [];
      }
      acc[buyer.invoice].push(buyer);
      return acc;
    }, {} as Record<string, Buyer[]>);

    addLog(`Found ${Object.keys(buyersByInvoice).length} unique invoices`, 'info');

    // Group seats by category (make case-insensitive)
    addLog("Grouping seats by category...", 'info');
    const seatsByCategory = seatMap.reduce((acc, seat) => {
      const categoryKey = seat.category.toUpperCase();
      if (!acc[categoryKey]) {
        acc[categoryKey] = [];
      }
      acc[categoryKey].push(seat);
      return acc;
    }, {} as Record<string, Seat[]>);

    // Log available seats per category
    Object.entries(seatsByCategory).forEach(([category, seats]) => {
      const availableSeats = seats.filter(seat => !seat.isBlocked && seat.seatNumber !== "-----").length;
      addLog(`Category ${category}: ${availableSeats} available seats out of ${seats.length} total`, 'info');
    });

    let assignments: Assignment[] = [];
    let unassignedBuyers = 0;
    
    // Process each invoice group
    for (const [invoice, buyers] of Object.entries(buyersByInvoice)) {
      addLog(`Processing invoice ${invoice} with ${buyers.length} tickets...`, 'info');
      
      const category = buyers[0].category.toUpperCase();
      const availableSeats = seatsByCategory[category]?.filter(seat => 
        !seat.isBlocked && 
        seat.seatNumber !== "---" &&
        !assignments.find(a => a.seatNumber === seat.seatNumber && a.category.toUpperCase() === category)
      ) || [];

      if (availableSeats.length < buyers.length) {
        addLog(`Warning: Not enough seats in category ${category} for invoice ${invoice}`, 'warning');
        unassignedBuyers += buyers.length;
        continue;
      }

      // Use the new seat finding logic
      const bestSeats = findBestSeatsForGroup(availableSeats, buyers.length, category);
      
      if (bestSeats.length === buyers.length) {
        // Assign the seats
        buyers.forEach((buyer, index) => {
          assignments.push({
            category: buyer.category,
            invoice: buyer.invoice,
            ticketCode: buyer.ticketCode,
            seatNumber: bestSeats[index].seatNumber
          });
        });

        // Log the assignment
        addLog(`Assigned seats for invoice ${invoice}: ${bestSeats.map(s => s.seatNumber).join(', ')}`, 'success');
      } else {
        addLog(`Failed to find enough seats for invoice ${invoice}`, 'error');
        unassignedBuyers += buyers.length;
      }
    }

    addLog(`Assignment complete. ${assignments.length} seats assigned`, 'success');
    if (unassignedBuyers > 0) {
      addLog(`Warning: ${unassignedBuyers} buyers could not be assigned seats`, 'warning');
    }

    setResults(assignments);
  } catch (err) {
    const errorMessage = "Error during seat assignment: " + (err as Error).message;
    setError(errorMessage);
    addLog(errorMessage, 'error');
  } finally {
    setIsProcessing(false);
  }
};

  const copyToClipboard = () => {
    const headers = "Category,Invoice,Ticket Code,Seat Number\n";
    const csvContent = headers + results.map(r => 
      `${r.category},${r.invoice},${r.ticketCode},${r.seatNumber}`
    ).join('\n');
    
    navigator.clipboard.writeText(csvContent)
      .then(() => alert("Results copied to clipboard!"))
      .catch(() => setError("Failed to copy to clipboard"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header Section */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Seat Assignment App
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Automated seating arrangement for your seated concert
          </p>
        </div>
  
        {/* Main Upload Card */}
        <Card className="mb-6 shadow-lg border-t-4 border-t-blue-500">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              File Upload
              <Button variant="outline" size="sm" onClick={resetAll}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All
              </Button>
            </CardTitle>
            <CardDescription>
              Upload your CSV files to begin the seat assignment process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {/* File Upload Section */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Seat Map Upload */}
                <Card className="p-4 border-dashed">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium">
                        Seat Map CSV
                      </label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => downloadSampleCsv('seatMap')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Sample
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Format: category,seatNumber,isBlocked
                    </div>
                    <div className="flex gap-2">
                      <Input
                        ref={seatMapInputRef}
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFileName1(file.name);
                            handleFileUpload(file, 'seatMap');
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        onClick={() => seatMapInputRef.current?.click()}
                        variant="outline"
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                    <div className="flex items-center text-sm">
                      {seatMap.length > 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <FileWarning className="h-4 w-4 text-gray-400 mr-2" />
                      )}
                      {fileName1}
                    </div>
                  </div>
                </Card>
  
                {/* Buyer List Upload */}
                <Card className="p-4 border-dashed">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium">
                        Buyer List CSV
                      </label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => downloadSampleCsv('buyerList')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Sample
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Format: category,invoice,ticketCode
                    </div>
                    <div className="flex gap-2">
                      <Input
                        ref={buyerListInputRef}
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFileName2(file.name);
                            handleFileUpload(file, 'buyerList');
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        onClick={() => buyerListInputRef.current?.click()}
                        variant="outline"
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                    <div className="flex items-center text-sm">
                      {buyerList.length > 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <FileWarning className="h-4 w-4 text-gray-400 mr-2" />
                      )}
                      {fileName2}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
  
        {/* Process Button and Status Card */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Data Status</h3>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${seatMap.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Seat Map: {seatMap.length} records</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${buyerList.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Buyer List: {buyerList.length} records</span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={assignSeats}
                className="w-full h-full min-h-[60px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isProcessing || seatMap.length === 0 || buyerList.length === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process Seat Assignment'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
  
        {/* Processing Logs */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Processing Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black/95 text-gray-100 rounded-lg p-4 h-[200px] overflow-y-auto font-mono text-sm">
              {processLogs.map((log, index) => (
                <div 
                  key={index}
                  className={`mb-1 ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    log.type === 'success' ? 'text-green-400' :
                    'text-gray-300'
                  }`}
                >
                  <span className="opacity-50">[{log.timestamp}]</span> {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </CardContent>
        </Card>
  
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4 animate-slide-down">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
  
        {/* Results Section */}
        {results.length > 0 && (
          <Card className="shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Assignment Results
                <Button onClick={copyToClipboard} variant="outline">
                  <ClipboardCopy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </CardTitle>
              <CardDescription>
                Total assignments: {results.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                      <TableHead>Category</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Ticket Code</TableHead>
                      <TableHead>Seat Number</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>{result.category}</TableCell>
                        <TableCell>{result.invoice}</TableCell>
                        <TableCell>{result.ticketCode}</TableCell>
                        <TableCell>{result.seatNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
