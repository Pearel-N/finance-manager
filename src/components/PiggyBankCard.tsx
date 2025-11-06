"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PiggyBankDialog } from "@/components/PiggyBankDialog";
import { TransferMoneyDialog } from "@/components/TransferMoneyDialog";
import { GoalHintDialog } from "@/components/GoalHintDialog";
import { useDeletePiggyBank } from "@/hooks/mutation/piggy-banks";
import { usePiggyBanks } from "@/hooks/queries/piggy-banks";
import { formatCurrency } from "@/lib/currency-utils";
import { useProfile } from "@/hooks/queries/profile";
import { calculateMonthsBetween } from "@/lib/date-utils";
import { useState } from "react";
import { Lightbulb } from "lucide-react";
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
    goalDueDate?: Date | string | null;
    currentBalance: number;
    calculatedBalance: number;
    isDefault: boolean;
    hasTransferFromDefaultThisMonth?: boolean;
    hasTransferFromParentThisMonth?: boolean;
    isParent?: boolean;
    isChild?: boolean;
    totalBalance?: number;
    ownBalance?: number;
    childrenTotal?: number;
    parentId?: string | null;
    parent?: { id: string; name: string } | null;
  };
}

export function PiggyBankCard({ piggyBank }: PiggyBankCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isHintDialogOpen, setIsHintDialogOpen] = useState(false);
  const deletePiggyBankMutation = useDeletePiggyBank();
  const { data: piggyBanks } = usePiggyBanks();
  const { data: profile } = useProfile();
  const currency = profile?.currency || 'INR';

  // For parents, use totalBalance (own + children), otherwise use regular balance
  const balance = piggyBank.isParent && piggyBank.totalBalance !== undefined
    ? piggyBank.totalBalance
    : (piggyBank.currentBalance !== piggyBank.calculatedBalance 
        ? piggyBank.currentBalance 
        : piggyBank.calculatedBalance);

  const progressPercentage = piggyBank.goal 
    ? Math.min((balance / piggyBank.goal) * 100, 100) 
    : 0;

  // Determine if hint button should be visible
  const goalDueDate = piggyBank.goalDueDate 
    ? (typeof piggyBank.goalDueDate === 'string' 
        ? new Date(piggyBank.goalDueDate) 
        : piggyBank.goalDueDate)
    : null;
  
  const isGoalDueDateValid = goalDueDate && goalDueDate > new Date();
  const isGoalNotReached = piggyBank.goal && balance < piggyBank.goal;
  
  // Determine source bank for hint: use parent if child, otherwise use default
  const sourceBank = piggyBank.isChild && piggyBank.parent
    ? piggyBanks?.find(bank => bank.id === piggyBank.parent?.id)
    : piggyBanks?.find(bank => bank.isDefault);
  
  const hasNoTransferThisMonth = piggyBank.isChild && piggyBank.parent
    ? !piggyBank.hasTransferFromParentThisMonth
    : !piggyBank.hasTransferFromDefaultThisMonth;
  
  // Get source bank balance
  const sourceBankBalance = sourceBank 
    ? (sourceBank.currentBalance !== sourceBank.calculatedBalance 
        ? sourceBank.currentBalance 
        : sourceBank.calculatedBalance)
    : 0;
  
  // Calculate suggested monthly amount
  const remainingAmount = piggyBank.goal && balance < piggyBank.goal 
    ? piggyBank.goal - balance 
    : 0;
  const remainingMonths = goalDueDate && isGoalDueDateValid 
    ? calculateMonthsBetween(new Date(), goalDueDate)
    : 0;
  const suggestedAmount = remainingMonths > 0 ? remainingAmount / remainingMonths : 0;
  
  // Check if source bank has enough money for the suggested amount
  const hasEnoughMoneyInSourceBank = sourceBank && suggestedAmount > 0 
    ? sourceBankBalance >= suggestedAmount 
    : false;
  
  const shouldShowHint = Boolean(
    piggyBank.goal && 
    isGoalNotReached && 
    isGoalDueDateValid && 
    hasNoTransferThisMonth &&
    hasEnoughMoneyInSourceBank
  );

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
            <div className="flex items-center gap-2">
              {shouldShowHint && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsHintDialogOpen(true)}
                  className="h-8 w-8 p-0 border-2 border-b-black-500"
                  title="Goal hint"
                >
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                </Button>
              )}
              {piggyBank.isParent && (
                <Badge variant="secondary">Parent</Badge>
              )}
              {piggyBank.isChild && (
                <Badge variant="outline">Child</Badge>
              )}
              {piggyBank.isDefault && (
                <Badge variant="secondary">Default</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {piggyBank.isParent && piggyBank.totalBalance !== undefined ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Own Balance</span>
                  <span>{formatCurrency(piggyBank.ownBalance || 0, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Children Total</span>
                  <span>{formatCurrency(piggyBank.childrenTotal || 0, currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                  <span className="text-muted-foreground">Total Balance</span>
                  <span>{formatCurrency(piggyBank.totalBalance, currency)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Balance</span>
                <span className="font-semibold">{formatCurrency(balance, currency)}</span>
              </div>
            )}
            
            {piggyBank.goal && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Goal</span>
                  <span>{formatCurrency(piggyBank.goal, currency)}</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progressPercentage.toFixed(1)}% complete</span>
                  <span>{formatCurrency(piggyBank.goal - balance, currency)} remaining</span>
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
          goalDueDate: piggyBank.goalDueDate ?? undefined,
          parentId: piggyBank.parentId ?? null,
        }}
        mode="edit"
      />

      <TransferMoneyDialog
        isOpen={isTransferDialogOpen}
        onClose={() => setIsTransferDialogOpen(false)}
        sourcePiggyBank={piggyBank}
      />

      {shouldShowHint && piggyBank.goal && goalDueDate && sourceBank && (
        <GoalHintDialog
          isOpen={isHintDialogOpen}
          onClose={() => setIsHintDialogOpen(false)}
          targetPiggyBank={{
            id: piggyBank.id,
            name: piggyBank.name,
            goal: piggyBank.goal,
            currentBalance: balance,
            goalDueDate: goalDueDate,
          }}
          sourceBankId={sourceBank.id}
        />
      )}
    </>
  );
}
