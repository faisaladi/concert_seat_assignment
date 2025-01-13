'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export default function SeatAssignmentApp() {
  const [seatMap, setSeatMap] = useState<Seat[]>([]);
  const [buyerList, setBuyerList] = useState<Buyer[]>([]);
  const [results, setResults] = useState<Assignment[]>([]);
  const [error, setError] = useState("");
  const [fileName1, setFileName1] = useState("No file chosen");
  const [fileName2, setFileName2] = useState("No file chosen");

  const seatMapInputRef = useRef<HTMLInputElement>(null);
  const buyerListInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File, type: 'seatMap' | 'buyerList') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (type === 'seatMap') {
          parseSeatMap(text);
        } else {
          parseBuyerList(text);
        }
      } catch (err) {
        setError(`Error reading ${type} file: ${(err as Error).message}`);
      }
    };
    reader.onerror = () => {
      setError(`Error reading ${type} file`);
    };
    reader.readAsText(file);
  };

  const parseSeatMap = (text: string) => {
    try {
      const rows = text.split('\n');
      const parsedData = rows
        .filter(row => row.trim())
        .map(row => {
          const [category, seatNumber, isBlocked] = row.split(',');
          if (!category || !seatNumber || isBlocked === undefined) {
            throw new Error('Invalid CSV format. Expected: category,seatNumber,isBlocked');
          }
          return {
            category: category.trim(),
            seatNumber: seatNumber.trim(),
            isBlocked: isBlocked.trim().toLowerCase() === 'true'
          };
        });
      setSeatMap(parsedData);
      setError("");
    } catch (err) {
      setError("Error parsing seat map CSV. Please check the format: category,seatNumber,isBlocked");
    }
  };

  const parseBuyerList = (text: string) => {
    try {
      const rows = text.split('\n');
      const parsedData = rows
        .filter(row => row.trim())
        .map(row => {
          const [category, invoice, ticketCode] = row.split(',');
          if (!category || !invoice || !ticketCode) {
            throw new Error('Invalid CSV format. Expected: category,invoice,ticketCode');
          }
          return {
            category: category.trim(),
            invoice: invoice.trim(),
            ticketCode: ticketCode.trim()
          };
        });
      setBuyerList(parsedData);
      setError("");
    } catch (err) {
      setError("Error parsing buyer list CSV. Please check the format: category,invoice,ticketCode");
    }
  };

  const assignSeats = () => {
    if (seatMap.length === 0 || buyerList.length === 0) {
      setError("Please upload both seat map and buyer list files first.");
      return;
    }

    try {
      // Group buyers by invoice
      const buyersByInvoice = buyerList.reduce((acc, buyer) => {
        if (!acc[buyer.invoice]) {
          acc[buyer.invoice] = [];
        }
        acc[buyer.invoice].push(buyer);
        return acc;
      }, {} as Record<string, Buyer[]>);

      // Group seats by category
      const seatsByCategory = seatMap.reduce((acc, seat) => {
        if (!acc[seat.category]) {
          acc[seat.category] = [];
        }
        acc[seat.category].push(seat);
        return acc;
      }, {} as Record<string, Seat[]>);

      let assignments: Assignment[] = [];
      
      // Process each invoice group
      Object.entries(buyersByInvoice).forEach(([invoice, buyers]) => {
        const category = buyers[0].category;
        const availableSeats = seatsByCategory[category]?.filter(seat => 
          !seat.isBlocked && 
          seat.seatNumber !== "---" &&
          !assignments.find(a => a.seatNumber === seat.seatNumber && a.category === category)
        ) || [];

        // Find consecutive seats for the group
        let assignedSeats: Seat[] = [];
        let currentIndex = 0;

        while (currentIndex < availableSeats.length && assignedSeats.length < buyers.length) {
          const consecutive = [availableSeats[currentIndex]];
          let nextIndex = currentIndex + 1;

          while (
            nextIndex < availableSeats.length &&
            consecutive.length < buyers.length &&
            availableSeats[nextIndex].seatNumber !== "---"
          ) {
            consecutive.push(availableSeats[nextIndex]);
            nextIndex++;
          }

          if (consecutive.length >= buyers.length) {
            assignedSeats = consecutive.slice(0, buyers.length);
            break;
          }

          currentIndex++;
        }

        // Assign seats to buyers
        if (assignedSeats.length === buyers.length) {
          buyers.forEach((buyer, index) => {
            assignments.push({
              category: buyer.category,
              invoice: buyer.invoice,
              ticketCode: buyer.ticketCode,
              seatNumber: assignedSeats[index].seatNumber
            });
          });
        } else {
          // If we can't find consecutive seats, assign any available seats
          buyers.forEach(buyer => {
            const seat = availableSeats.find(s => 
              !assignments.find(a => a.seatNumber === s.seatNumber && a.category === category)
            );
            if (seat) {
              assignments.push({
                category: buyer.category,
                invoice: buyer.invoice,
                ticketCode: buyer.ticketCode,
                seatNumber: seat.seatNumber
              });
            }
          });
        }
      });

      setResults(assignments);
      setError("");
    } catch (err) {
      setError("Error during seat assignment: " + (err as Error).message);
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
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Seat Assignment System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* File Upload Section */}
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Seat Map CSV
                  <div className="text-xs text-gray-500 mt-1">
                    Format: category,seatNumber,isBlocked
                  </div>
                </label>
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
                    Choose Seat Map File
                  </Button>
                  <span className="text-sm py-2">{fileName1}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Buyer List CSV
                  <div className="text-xs text-gray-500 mt-1">
                    Format: category,invoice,ticketCode
                  </div>
                </label>
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
                    Choose Buyer List File
                  </Button>
                  <span className="text-sm py-2">{fileName2}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={assignSeats}
              className="w-full"
              disabled={seatMap.length === 0 || buyerList.length === 0}
            >
              Process Seat Assignment
            </Button>
          </div>
          
          <div className="mt-4">
            <h3 className="font-bold mb-2">Loaded Data:</h3>
            <div className="text-sm">
              <p>Seat Map Records: {seatMap.length}</p>
              <p>Buyer List Records: {buyerList.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Assignment Results
              <Button onClick={copyToClipboard} variant="outline">
                Copy to Clipboard
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
