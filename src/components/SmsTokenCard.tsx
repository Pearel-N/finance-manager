"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateSmsToken, useRevokeSmsToken } from "@/hooks/mutation/profile";

type SmsTokenCardProps = {
  hasToken: boolean;
};

export function SmsTokenCard({ hasToken }: SmsTokenCardProps) {
  const createToken = useCreateSmsToken();
  const revokeToken = useRevokeSmsToken();

  // The plain token only exists in memory right after it is created.
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    const { token } = await createToken.mutateAsync();
    setNewToken(token);
    setCopied(false);
  };

  const handleRevoke = async () => {
    await revokeToken.mutateAsync();
    setNewToken(null);
  };

  const handleCopy = async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
  };

  const isBusy = createToken.isPending || revokeToken.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Import</CardTitle>
        <CardDescription>
          A secret token that lets your phone send bank SMS to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {newToken && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input value={newToken} readOnly className="font-mono text-xs" />
              <Button type="button" variant="outline" onClick={handleCopy}>
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-sm text-amber-700">
              Copy this now. For security it is not stored, so you will not see it again.
            </p>
          </div>
        )}

        {!newToken && (
          <p className="text-sm text-muted-foreground">
            {hasToken
              ? "A token is active. Generating a new one stops the old one working."
              : "No token yet."}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="button" onClick={handleCreate} disabled={isBusy}>
            {hasToken ? "Generate new token" : "Generate token"}
          </Button>
          {hasToken && (
            <Button type="button" variant="outline" onClick={handleRevoke} disabled={isBusy}>
              Revoke
            </Button>
          )}
        </div>

        {(createToken.isError || revokeToken.isError) && (
          <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
        )}
      </CardContent>
    </Card>
  );
}
