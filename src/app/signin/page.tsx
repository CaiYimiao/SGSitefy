"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Dev email login is available locally or when NEXT_PUBLIC_ALLOW_DEV_LOGIN=true.
const allowDev =
  process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true" ||
  process.env.NODE_ENV !== "production";

export default function SignInPage() {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");

  return (
    <main className="container flex max-w-md flex-col gap-6 py-20">
      <Card>
        <CardHeader>
          <CardTitle>Sign in to SGSitefy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            Continue with Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn("facebook", { callbackUrl: "/dashboard" })}
          >
            Continue with Facebook
          </Button>

          {allowDev && (
            <>
              <div className="relative py-2 text-center">
                <span className="bg-background px-2 text-xs text-muted-foreground">
                  or dev sign-in
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>
              <Button
                className="w-full"
                disabled={!email.trim()}
                onClick={() => signIn("credentials", { email, name, callbackUrl: "/dashboard" })}
              >
                Continue with email (dev)
              </Button>
              <p className="text-xs text-muted-foreground">
                Dev-only email sign-in. Disabled in production unless
                NEXT_PUBLIC_ALLOW_DEV_LOGIN=true.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
