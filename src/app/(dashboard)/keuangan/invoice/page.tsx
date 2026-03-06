"use client";

import { useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import { Search, Plus, FileText, MoreHorizontal, Calculator, Receipt, Printer, Send } from "lucide-react";
import { toast } from "sonner";

import { Invoice, InvoiceFormValues, invoiceSchema } from "@/types/keuangan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const dummyInvoices: Invoice[] = [
  { id: "1", invoice_number: "INV/AAA/1025/001", date: "2025-10-25", customer_name: "PT. Industri Maju Abadi", po_number: "PO/IMA/1025/12", total_amount: 45000000, deposit_deduction: 5000000, final_amount: 40000000, status: "Unpaid" },
  { id: "2", invoice_number: "INV/AAA/1025/002", date: "2025-10-24", customer_name: "PT. Tekno Pangan", po_number: "PO/TP/1025/08", total_amount: 12500000, deposit_deduction: 0, final_amount: 12500000, status: "Paid" },
];

// Mock data: List Pemakaian yang belum ditagihkan (biasanya ditarik via API setelah Customer dipilih)
const mockUnbilledUsages = [
  { id: "USE-001", date: "2025-10-20", metode: "Delta Pressure", volume: "4,500 Sm3", amount: 18500000 },
  { id: "USE-002", date: "2025-10-22", metode: "Delta Pressure", volume: "4,200 Sm3", amount: 16800000 },
];

// Mock data: Info Kontrak Customer
const mockCustomerInfo = {
  contract_type: "Top Up", // Bisa "Top Up" atau "Deposit"
  current_deposit_balance: 15000000,
};

const columnHelper = createColumnHelper<Invoice>();

export default function InvoicePage() {
  const [data, setData] = useState<Invoice[]>(dummyInvoices);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      customer_id: "", invoice_number: "", po_number: "", po_date: "", period_start: "", period_end: "", note: "",
      selected_usages: []
    }
  });

  const watchValues = useWatch({ control: form.control });

  // --- LOGIKA KALKULASI TAGIHAN ---
  // 1. Hitung total dari pemakaian yang di-ceklis
  const selectedUsagesData = mockUnbilledUsages.filter(u => watchValues.selected_usages?.includes(u.id));
  const totalPemakaian = selectedUsagesData.reduce((sum, item) => sum + item.amount, 0);

  // 2. Tentukan potongan deposit berdasarkan jenis kontrak
  let potonganDeposit = 0;
  if (watchValues.customer_id === "1") { // Simulasi jika PT Industri Maju Abadi (Top Up) dipilih
    if (mockCustomerInfo.contract_type === "Top Up") {
      // Potong saldo maksimal sebesar tagihan, sisanya menjadi tagihan akhir
      potonganDeposit = Math.min(mockCustomerInfo.current_deposit_balance, totalPemakaian);
    }
  }

  // 3. Tagihan Akhir
  const tagihanAkhir = totalPemakaian - potonganDeposit;

  const handleToggleUsage = (usageId: string, checked: boolean) => {
    const current = watchValues.selected_usages || [];
    if (checked) form.setValue("selected_usages", [...current, usageId], { shouldValidate: true });
    else form.setValue("selected_usages", current.filter(id => id !== usageId), { shouldValidate: true });
  };

  const onSubmit = async (values: InvoiceFormValues) => {
    await new Promise(res => setTimeout(res, 800));
    toast.success("Invoice berhasil di-generate dan tersimpan.");
    setIsDialogOpen(false);
  };

  const columns = useMemo(() => [
    columnHelper.accessor("invoice_number", { header: "No. Invoice", cell: info => <span className="font-bold text-foreground">{info.getValue()}</span> }),
    columnHelper.accessor("date", { header: "Tanggal" }),
    columnHelper.accessor("customer_name", {
      header: "Customer & Referensi",
      cell: info => (
        <div className="flex flex-col">
          <span className="font-medium">{info.getValue()}</span>
          <span className="text-xs text-muted-foreground">PO: {info.row.original.po_number}</span>
        </div>
      )
    }),
    columnHelper.accessor("final_amount", {
      header: "Tagihan Akhir",
      cell: info => <span className="font-bold text-primary">Rp {info.getValue().toLocaleString('id-ID')}</span>
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: info => {
        const val = info.getValue();
        return <Badge variant={val === "Paid" ? "default" : (val === "Overdue" ? "destructive" : "secondary")} className={val === "Paid" ? "bg-emerald-500" : ""}>{val}</Badge>;
      }
    }),
    columnHelper.display({
      id: "actions",
      cell: info => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem><FileText className="mr-2 h-4 w-4" /> Lihat Detail</DropdownMenuItem>
            <DropdownMenuItem><Printer className="mr-2 h-4 w-4" /> Cetak Invoice</DropdownMenuItem>
            <DropdownMenuItem className="text-primary focus:text-primary"><Send className="mr-2 h-4 w-4" /> Kirim ke Customer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    })
  ], []);

  const table = useReactTable({ data, columns, state: { globalFilter }, onGlobalFilterChange: setGlobalFilter, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel() });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold">Manajemen Invoice</h2>
          <p className="text-sm text-muted-foreground mt-1">Generate tagihan pelanggan berdasarkan akumulasi pemakaian gas.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary text-white"><Plus className="w-4 h-4 mr-2" /> Generate Invoice</Button>
      </div>

      {/* Tabel Data */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari no invoice atau customer..." value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="pl-9 bg-background" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 text-muted-foreground font-heading border-b border-border">
              {table.getHeaderGroups().map(hg => <tr key={hg.id}>{hg.headers.map(h => <th key={h.id} className="px-6 py-4 font-semibold">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>)}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map(row => <tr key={row.id} className="hover:bg-muted/10">{row.getVisibleCells().map(cell => <td key={cell.id} className="px-6 py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Form Lebar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl bg-card p-0 overflow-hidden">
          <div className="flex flex-col lg:flex-row h-[85vh] lg:h-[650px]">
            {/* Sisi Kiri: Form Input & Pemilihan Data */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar border-r border-border">
              <DialogHeader className="mb-6"><DialogTitle className="font-heading text-xl flex items-center gap-2"><Receipt className="w-5 h-5 text-primary"/> Generate Invoice Baru</DialogTitle></DialogHeader>
              <form id="invoice-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Referensi Dasar */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold text-primary">Pilih Customer</label>
                    <select {...form.register("customer_id")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary">
                      <option value="">-- Pilih Customer --</option>
                      <option value="1">PT. Industri Maju Abadi (Kontrak: Top Up)</option>
                      <option value="2">PT. Tekno Pangan (Kontrak: Deposit)</option>
                    </select>
                    {form.formState.errors.customer_id && <p className="text-[10px] text-destructive">{form.formState.errors.customer_id.message}</p>}
                  </div>
                  <div className="space-y-1"><label className="text-xs font-medium">No. Invoice</label><Input {...form.register("invoice_number")} placeholder="INV/XXX/..." /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Tanggal Invoice</label><Input type="date" {...form.register("date")} /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">No. PO Referensi</label><Input {...form.register("po_number")} /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Tanggal PO</label><Input type="date" {...form.register("po_date")} /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Periode Mulai</label><Input type="date" {...form.register("period_start")} /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">Periode Selesai</label><Input type="date" {...form.register("period_end")} /></div>
                </div>

                {/* List Pemakaian (Muncul Jika Customer Dipilih) */}
                {watchValues.customer_id === "1" && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex justify-between">
                      List Riwayat Pemakaian <Badge variant="secondary">{mockUnbilledUsages.length} Belum Ditagih</Badge>
                    </label>
                    <div className="space-y-2">
                      {mockUnbilledUsages.map(usage => (
                        <div key={usage.id} className="flex items-center space-x-3 bg-muted/30 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <input 
                            type="checkbox" 
                            id={`usage-${usage.id}`}
                            className="w-4 h-4 text-primary rounded border-border focus:ring-primary bg-background"
                            checked={(watchValues.selected_usages || []).includes(usage.id)}
                            onChange={(e) => handleToggleUsage(usage.id, e.target.checked)}
                          />
                          <div className="flex-1">
                            <label htmlFor={`usage-${usage.id}`} className="text-sm font-semibold cursor-pointer">{usage.id} <span className="text-xs text-muted-foreground ml-2 font-normal">{usage.date}</span></label>
                            <p className="text-xs text-muted-foreground">{usage.metode} • Volume: {usage.volume}</p>
                          </div>
                          <div className="font-mono text-sm font-semibold text-emerald-500">Rp {usage.amount.toLocaleString('id-ID')}</div>
                        </div>
                      ))}
                    </div>
                    {form.formState.errors.selected_usages && <p className="text-xs text-destructive">{form.formState.errors.selected_usages.message}</p>}
                  </div>
                )}

                <div className="space-y-1 pt-2">
                  <label className="text-xs font-medium">Catatan / Note</label>
                  <Input {...form.register("note")} placeholder="Tambahkan catatan untuk customer jika ada..." />
                </div>
              </form>
            </div>

            {/* Sisi Kanan: Panel Tagihan Realtime */}
            <div className="w-full lg:w-[380px] bg-sidebar/50 p-6 flex flex-col justify-between sidebar-gradient-dark">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Calculator className="w-5 h-5 text-primary" />
                  <h3 className="font-heading font-semibold text-lg">Kalkulasi Tagihan</h3>
                </div>
                
                {watchValues.customer_id === "1" ? (
                  <div className="space-y-4">
                    <div className="bg-background/80 p-3 rounded-lg border border-border flex justify-between items-center">
                      <span className="text-xs text-muted-foreground font-medium">Total Pemakaian</span>
                      <span className="text-sm font-mono font-bold">Rp {totalPemakaian.toLocaleString('id-ID')}</span>
                    </div>

                    {/* Logika Tampil Potongan Deposit (Top-Up) */}
                    {mockCustomerInfo.contract_type === "Top Up" ? (
                      <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-rose-500 font-bold">Potongan Saldo Deposit</span>
                          <span className="text-sm font-mono font-bold text-rose-500">- Rp {potonganDeposit.toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Sistem kontrak Top-Up. Saldo aktif saat ini: Rp {mockCustomerInfo.current_deposit_balance.toLocaleString('id-ID')}</p>
                      </div>
                    ) : (
                      <div className="bg-muted p-3 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground">Sistem kontrak <span className="font-bold">Jaminan Deposit</span>. Tagihan dibayar penuh tanpa pemotongan saldo.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
                    <p className="text-sm">Pilih customer untuk melihat kalkulasi.</p>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-border border-dashed">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                    Total Tagihan Akhir
                    {totalPemakaian > 0 && <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">Siap Cetak</Badge>}
                  </p>
                  <p className="text-3xl font-heading font-bold text-foreground break-all">
                    Rp {tagihanAkhir.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Button type="submit" form="invoice-form" className="w-full h-12 text-md font-semibold bg-primary hover:bg-primary/90 text-white" disabled={form.formState.isSubmitting || totalPemakaian === 0}>
                  {form.formState.isSubmitting ? "Memproses..." : "Simpan & Generate Invoice"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}