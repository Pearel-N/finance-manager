"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTransactions } from "@/hooks/queries/transactions";
import { useCategories } from "@/hooks/queries/categories";
import { useUpdateTransaction, useDeleteTransaction } from "@/hooks/mutation/transactions";
import { Category, Transaction } from "@prisma/client";
import { formatTransactionDate } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/currency-utils";
import { useProfile } from "@/hooks/queries/profile";
import { useState } from "react";

export default function TransactionsTable() {
  const { data, isLoading, error, isFetching } = useTransactions();
  const { data: categories } = useCategories();
  const { data: profile } = useProfile();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();
  const currency = profile?.currency || "INR";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    amount: string;
    type: string;
    date: string;
    categoryId: string;
    note: string;
    excludeFromDailySpent: boolean;
  }>({
    amount: "",
    type: "expense",
    date: "",
    categoryId: "",
    note: "",
    excludeFromDailySpent: false,
  });

  const startEdit = (transaction: Transaction & { category: Category }) => {
    setEditingId(transaction.id);
    // Convert date to local date string (YYYY-MM-DD) without timezone conversion
    const transactionDate = new Date(transaction.date);
    const year = transactionDate.getFullYear();
    const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
    const day = String(transactionDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    
    setEditData({
      amount: transaction.amount.toString(),
      type: transaction.type,
      date: localDateString,
      categoryId: transaction.categoryId,
      note: transaction.note || "",
      excludeFromDailySpent: transaction.excludeFromDailySpent || false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({
      amount: "",
      type: "expense",
      date: "",
      categoryId: "",
      note: "",
      excludeFromDailySpent: false,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      // Parse date string as local date (not UTC) to avoid timezone shifts
      const [year, month, day] = editData.date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      
      await updateTransactionMutation.mutateAsync({
        id: editingId,
        data: {
          amount: Number(editData.amount),
          type: editData.type,
          date: localDate,
          categoryId: editData.categoryId,
          note: editData.note || null,
          excludeFromDailySpent: editData.excludeFromDailySpent,
        },
      });
      setEditingId(null);
    } catch (error) {
      console.error("Failed to update transaction:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransactionMutation.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="relative">
      {isFetching && !isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg border">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <span className="text-sm">Updating transactions...</span>
            </div>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Exclude from Budget</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((transaction: Transaction & { category: Category }) => {
            const isEditing = editingId === transaction.id;
            const isSystemTransaction = transaction.category.name === 'System';
            return (
              <TableRow key={transaction.id}>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editData.amount}
                      onChange={(e) => setEditData((prev) => ({ ...prev, amount: e.target.value }))}
                      className="w-24"
                    />
                  ) : (
                    formatCurrency(transaction.amount, currency)
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select value={editData.type} onValueChange={(value) => setEditData((prev) => ({ ...prev, type: value }))}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    transaction.type
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editData.date}
                      onChange={(e) => setEditData((prev) => ({ ...prev, date: e.target.value }))}
                      className="w-32"
                    />
                  ) : (
                    formatTransactionDate(transaction.date)
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select value={editData.categoryId} onValueChange={(value) => setEditData((prev) => ({ ...prev, categoryId: value }))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    transaction.category?.name
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      value={editData.note}
                      onChange={(e) => setEditData((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder="Note"
                      className="w-32"
                    />
                  ) : (
                    transaction.note
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Switch
                      checked={editData.excludeFromDailySpent}
                      onCheckedChange={(checked) => setEditData((prev) => ({ ...prev, excludeFromDailySpent: checked }))}
                    />
                  ) : (
                    // System transactions are always excluded, show "Yes" for them
                    (isSystemTransaction || transaction.excludeFromDailySpent) ? "Yes" : "No"
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} disabled={updateTransactionMutation.isPending}>
                        {updateTransactionMutation.isPending ? (
                          <div className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                            Saving...
                          </div>
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => startEdit(transaction)} 
                        disabled={updateTransactionMutation.isPending || deleteTransactionMutation.isPending || isSystemTransaction}
                        title={isSystemTransaction ? "System transactions cannot be edited" : "Edit transaction"}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            disabled={updateTransactionMutation.isPending || deleteTransactionMutation.isPending || isSystemTransaction}
                            title={isSystemTransaction ? "System transactions cannot be deleted" : "Delete transaction"}
                          >
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the transaction.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(transaction.id)} disabled={deleteTransactionMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              {deleteTransactionMutation.isPending ? (
                                <div className="flex items-center gap-1">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                  Deleting...
                                </div>
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}


