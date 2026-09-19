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
import { useRecurringTransactions } from "@/hooks/queries/recurring";
import { useCategories } from "@/hooks/queries/categories";
import { useUpdateRecurringTransaction, useDeleteRecurringTransaction } from "@/hooks/mutation/recurring";
import { Category } from "@prisma/client";
import { formatTransactionDate } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/currency-utils";
import { useProfile } from "@/hooks/queries/profile";
import { useState } from "react";
import { RecurringTransaction } from "@/services/recurring";

export default function RecurringTransactionsTable() {
  const { data, isLoading, error, isFetching } = useRecurringTransactions();
  const { data: categories } = useCategories();
  const { data: profile } = useProfile();
  const updateRecurringMutation = useUpdateRecurringTransaction();
  const deleteRecurringMutation = useDeleteRecurringTransaction();
  const currency = profile?.currency || "INR";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    amount: string;
    type: 'income' | 'expense';
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    nextDate: string;
    categoryId: string;
    note: string;
  }>({
    amount: "",
    type: "expense",
    frequency: "monthly",
    nextDate: "",
    categoryId: "",
    note: "",
  });

  const startEdit = (recurring: RecurringTransaction) => {
    setEditingId(recurring.id);
    const nextDate = new Date(recurring.nextDate);
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    
    setEditData({
      amount: recurring.amount.toString(),
      type: recurring.type,
      frequency: recurring.frequency,
      nextDate: localDateString,
      categoryId: recurring.categoryId,
      note: recurring.note || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateRecurringMutation.mutateAsync({
        id: editingId,
        data: {
          amount: Number(editData.amount),
          type: editData.type,
          frequency: editData.frequency,
          nextDate: new Date(editData.nextDate),
          categoryId: editData.categoryId,
          note: editData.note || null,
        },
      });
      setEditingId(null);
    } catch (error) {
      console.error("Failed to update recurring transaction:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecurringMutation.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete recurring transaction:", error);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="relative">
      {isFetching && !isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg border">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <span className="text-sm">Updating...</span>
            </div>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Next Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((recurring: RecurringTransaction) => {
            const isEditing = editingId === recurring.id;
            return (
              <TableRow key={recurring.id}>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editData.amount}
                      onChange={(e) => setEditData((prev) => ({ ...prev, amount: e.target.value }))}
                      className="w-24"
                    />
                  ) : (
                    formatCurrency(recurring.amount, currency)
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select value={editData.type} onValueChange={(value: 'income' | 'expense') => setEditData((prev) => ({ ...prev, type: value }))}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    recurring.type
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select value={editData.frequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => setEditData((prev) => ({ ...prev, frequency: value }))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="capitalize">{recurring.frequency}</span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editData.nextDate}
                      onChange={(e) => setEditData((prev) => ({ ...prev, nextDate: e.target.value }))}
                      className="w-32"
                    />
                  ) : (
                    formatTransactionDate(recurring.nextDate)
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
                    recurring.category?.name
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
                    recurring.note
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} disabled={updateRecurringMutation.isPending}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => startEdit(recurring)}>
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will delete the recurring transaction setup. No future transactions will be automatically created.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(recurring.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
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
