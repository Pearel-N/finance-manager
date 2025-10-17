"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PiggyBankDialog } from "@/components/PiggyBankDialog";
import { TransferMoneyDialog } from "@/components/TransferMoneyDialog";
import { useDeletePiggyBank } from "@/hooks/mutation/piggy-banks";
import { useState } from "react";
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

interface PiggyBankCardProps {
  piggyBank: {
    id: string;
    name: string;
    goal?: number | null;
    currentBalance: number;
    calculatedBalance: number;
    isDefault: boolean;
  };
}

export function PiggyBankCard({ piggyBank }: PiggyBankCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const deletePiggyBankMutation = useDeletePiggyBank();

  const balance = piggyBank.currentBalance !== piggyBank.calculatedBalance 
    ? piggyBank.currentBalance 
    : piggyBank.calculatedBalance;

  const progressPercentage = piggyBank.goal 
    ? Math.min((balance / piggyBank.goal) * 100, 100) 
    : 0;

  const handleDelete = async () => {
    try {
      await deletePiggyBankMutation.mutateAsync(piggyBank.id);
    } catch (error) {
      console.error("Failed to delete piggy bank:", error);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{piggyBank.name}</CardTitle>
            {piggyBank.isDefault && (
              <Badge variant="secondary">Default</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Balance</span>
              <span className="font-semibold">${balance.toFixed(2)}</span>
            </div>
            
            {piggyBank.goal && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Goal</span>
                  <span>${piggyBank.goal.toFixed(2)}</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progressPercentage.toFixed(1)}% complete</span>
                  <span>${(piggyBank.goal - balance).toFixed(2)} remaining</span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsTransferDialogOpen(true)}
              className="flex-1"
            >
              Transfer
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(true)}
            >
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="destructive"
                  disabled={deletePiggyBankMutation.isPending}
                >
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the piggy bank.
                    {piggyBank.isDefault && " This is your default piggy bank."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deletePiggyBankMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletePiggyBankMutation.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <PiggyBankDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        piggyBank={{
          ...piggyBank,
          goal: piggyBank.goal ?? undefined,
        }}
        mode="edit"
      />

      <TransferMoneyDialog
        isOpen={isTransferDialogOpen}
        onClose={() => setIsTransferDialogOpen(false)}
        sourcePiggyBank={piggyBank}
      />
    </>
  );
}
