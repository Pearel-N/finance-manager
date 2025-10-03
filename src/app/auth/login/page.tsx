"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { login } from "../actions";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    login(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Login to your account
          </CardDescription>
          <CardAction>
            <Button>Sign Up</Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={handleLogin}>Sign In</Button>
        </CardContent>
      </Card>
    </div>
  );
}
