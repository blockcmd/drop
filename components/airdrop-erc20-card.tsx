"use client";

import Link from "next/link";
import { ArrowRight, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type BaseError, useReadContract, useAccount, useChainId } from "wagmi";
import { Address } from "viem";
import { erc20Abi } from "./erc20-abi";
import { useState } from "react";

export default function AirdropErc20Card() {
  const account = useAccount();
  const [contractAddress, setContractAddress] = useState("");
  const {
    data: symbol,
    error,
    isPending,
  } = useReadContract({
    abi: erc20Abi,
    address: contractAddress as Address,
    functionName: "symbol",
  });

  function handleContractAddressChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setContractAddress(event.target.value);
  }

  return (
    <div className="flex flex-row justify-between items-stretch shadow-lg w-full border-2 border-secondary hover:border-primary">
      <div className="flex flex-col gap-4 p-8">
        <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
          Airdrop ERC20
        </h2>
        {account.address ? (
          <>
            <p>Add contract address to check before proceeding</p>
            <div className="flex flex-row gap-4 items-center">
              <Input
                type="text"
                placeholder="0x..."
                value={contractAddress}
                onChange={handleContractAddressChange}
              />
              {isPending && (
                <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
              )}
              {symbol ? (
                <p className="flex flex-row items-center">
                  <Check className="mr-2 h-6 w-6 text-green-500" />
                  {symbol?.toString()}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <p>Connect your wallet to proceed</p>
        )}
      </div>
      {symbol ? (
        <Link className="flex flex-col w-[100px] items-center justify-center bg-primary" href={`/airdrop-erc20?address=${contractAddress}`}>
            <ArrowRight className="w-8 h-8 text-secondary" />
        </Link>
      ) : (
        <div className="flex flex-col w-[100px] items-center justify-center bg-muted">
          <ArrowRight className="w-8 h-8" />
        </div>
      )}
    </div>
  );
}
