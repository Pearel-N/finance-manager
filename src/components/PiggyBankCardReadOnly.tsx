"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GoalHintDialog } from "@/components/GoalHintDialog";
import { usePiggyBanks } from "@/hooks/queries/piggy-banks";
import { formatCurrency } from "@/lib/currency-utils";
import { useProfile } from "@/hooks/queries/profile";
import { calculateMonthsBetween } from "@/lib/date-utils";
import { useState } from "react";
import { Lightbulb } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PiggyBankWithCalculations } from "@/services/piggy-bank";

interface PiggyBankCardReadOnlyProps {
  piggyBank: PiggyBankWithCalculations;
}

export function PiggyBankCardReadOnly({ piggyBank }: PiggyBankCardReadOnlyProps) {
  const [isHintDialogOpen, setIsHintDialogOpen] = useState(false);
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

  // Get full child bank details for accordion display
  // Filter all banks to find children of this parent bank
  const childBanks = piggyBank.isParent
    ? piggyBanks?.filter((bank) => {
        // Access parentId from the base PiggyBank type
        const bankWithParent = bank as PiggyBankWithCalculations & { parentId?: string | null };
        return bankWithParent.parentId === piggyBank.id;
      }) || []
    : [];

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

          {/* Accordion for child banks */}
          {piggyBank.isParent && childBanks.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="children" className="border-none">
                <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline">
                  View Child Banks ({childBanks.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {childBanks.map((childBank) => {
                      const childBalance = childBank.currentBalance !== childBank.calculatedBalance 
                        ? childBank.currentBalance 
                        : childBank.calculatedBalance;
                      const childProgressPercentage = childBank.goal 
                        ? Math.min((childBalance / childBank.goal) * 100, 100) 
                        : 0;
                      
                      return (
                        <div 
                          key={childBank.id} 
                          className="flex items-center gap-3"
                        >
                          <span className="text-sm font-medium min-w-[120px]">{childBank.name}</span>
                          <span className="text-sm text-muted-foreground min-w-[80px]">
                            {formatCurrency(childBalance, currency)}
                          </span>
                          <Progress value={childProgressPercentage} className="h-2 flex-1" />
                          {childBank.goal && (
                            <span className="text-sm text-muted-foreground min-w-[80px] text-right">
                              {formatCurrency(childBank.goal, currency)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>

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

