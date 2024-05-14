"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { array, z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  type BaseError,
  useWaitForTransactionReceipt,
  useWriteContract,
  useAccount,
  useReadContract,
  useReadContracts
} from "wagmi";
import { parseEther } from "viem";
import { formatUnits } from "viem";
// import { serialize } from "wagmi";
// import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check } from "lucide-react";
import { abi } from "./abi";
import { erc20Abi } from "./erc20-abi";
import { CONTRACT_ADDRESS_BAOBAB, CONTRACT_ADDRESS_CYPRESS } from "./contract";
import { useChainId } from 'wagmi'
import { Label } from "./ui/label";

const formSchema = z.object({
  addresses: z.string(),
  airdropAmounts: z.string(),
  totalAirdropAmount: z.string(),
});

const readTokenInfoFormSchema = z.object({
  tokenAddress: z.string(),
});

const setAllowanceFormSchema = z.object({
  amount: z.string(),
});

export function AirdropERC20() {
  const { toast } = useToast();
  const account = useAccount()
  const chainId = useChainId()
  const [erc20TokenAddress, setErc20TokenAddress] = useState<string>("");
  const [erc20TokenSymbol, setErc20TokenSymbol] = useState<string>("");
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { data: approveHash, error: approveError, isPending: approveIsPending, writeContract: approveWriteContract } = useWriteContract();

  const { 
    data: tokenInfoData,
    error: tokenInfoError,
    isPending: tokenInfoIsPending,
    isSuccess: tokenInfoSuccess,
  } = useReadContracts({
    contracts: [{
        abi: erc20Abi,
        functionName: 'allowance',
        address: erc20TokenAddress ? erc20TokenAddress as `0x${string}` : undefined,
        args: [account.address as `0x${string}`, chainId === 1001 ? CONTRACT_ADDRESS_BAOBAB : CONTRACT_ADDRESS_CYPRESS],
      }, {
        abi: erc20Abi,
        functionName: 'symbol',
        address: erc20TokenAddress as `0x${string}`,
      }, {
        abi: erc20Abi,
        functionName: 'name',
        address: erc20TokenAddress as `0x${string}`,
      }, {
        abi: erc20Abi,
        functionName: 'decimals',
        address: erc20TokenAddress as `0x${string}`,
      }
    ],
  });

  useEffect(() => {
    if (tokenInfoSuccess) {
      setErc20TokenSymbol(tokenInfoData[1]?.result?.toString() ?? "")
    }
  }, [tokenInfoData, tokenInfoSuccess])

  const setAllowanceForm = useForm<z.infer<typeof setAllowanceFormSchema>>({
    resolver: zodResolver(setAllowanceFormSchema),
  });

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (error) { 
      toast({
        variant: "destructive",
        title: "Transaction reverted",
        description: `${(error as BaseError).shortMessage || error.message}`,
      });
    }
  }, [error, toast])

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    const tokenAddress: (`0x${string}`) = erc20TokenAddress as `0x${string}`;
    const totalAirdropAmount: bigint = parseEther(values.totalAirdropAmount.toString());
    const addresses: (`0x${string}`)[] = values.addresses.split(",").map((address) => address.replace(/\s/g, "") as `0x${string}`);
    const airdropAmounts: bigint[] = values.airdropAmounts.split(",").map((amount) => parseEther(amount));
    writeContract({
      abi: abi,
      address: chainId === 1001 ? CONTRACT_ADDRESS_BAOBAB : CONTRACT_ADDRESS_CYPRESS,
      functionName: 'airdropERC20',
      args: [tokenAddress, addresses, airdropAmounts, totalAirdropAmount]
    })

  }

  function onApprove(values: z.infer<typeof setAllowanceFormSchema>) {
    const amount: bigint = parseEther(values.amount.toString());
    approveWriteContract({
      abi: erc20Abi,
      address: erc20TokenAddress as `0x${string}`,
      functionName: 'approve',
      args: [chainId === 1001 ? CONTRACT_ADDRESS_BAOBAB : CONTRACT_ADDRESS_CYPRESS, amount]
    })
  }


  // 0xfbafe784a4ee4fb559636cec7f760158ea90f86f
  // 50
  // 0x1B7a0b3E366CC0549A96ED4123E8058d59282f3f,0x6a672dD588577E3d4b57c45CDDA243129b80847d
  // 25,25



  function truncateAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  return (
    <Card className="w-full border-0 shadow-lg lg:max-w-3xl">
      <CardHeader>
        <CardTitle>Aidrop ERC20 Token</CardTitle>
        <CardDescription>
          Use this form to airdrop ERC20 tokens to multiple addresses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4 items-center">
            <div className="bg-primary text-secondary rounded-full h-8 w-8 flex justify-center items-center">
              <p>1</p>
            </div>
            <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
              Select a token
            </h3>
          </div>
          <div className="flex flex-col gap-4 pl-8">
            <div className="flex flex-col gap-3">
              <Label htmlFor="tokenAddress">ERC20 Token address</Label>
              <Input
                name="tokenAddress"
                type="text"
                placeholder="Paste address of the token here"
                value={erc20TokenAddress}
                onChange={(e) => setErc20TokenAddress(e.target.value)}
              />
            </div>
            {
              tokenInfoData ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row gap-4 items-center">
                    <div className="bg-gray-300 rounded-full h-12 w-12 flex justify-center items-center">
                      <p>{tokenInfoData[1]?.result?.toString().charAt(0)}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="font-semibold text-lg">{tokenInfoData[2]?.result?.toString()}</p>
                      <p className="font-mono text-sm">{tokenInfoData[1]?.result?.toString()}</p>
                    </div>
                  </div>
                  <p>Approval amount: {formatUnits(BigInt(tokenInfoData[0]?.result ?? 0), tokenInfoData[3]?.result ?? 0)}</p>
                </div>
              ) : <p className="mt-4">No results found.</p>
            }
          </div>
        </div>
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-row gap-4 items-center">
            <div className="bg-primary text-secondary rounded-full h-8 w-8 flex justify-center items-center">
              <p>2</p>
            </div>
            <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
              Set approval amount for the airdrop contract
            </h3>
          </div>
          <div className="pl-8">
            <Form {...setAllowanceForm}>
              <form onSubmit={setAllowanceForm.handleSubmit(onApprove)} className="space-y-8">
                <FormField
                  control={setAllowanceForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approval amount</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter the amount to be approved"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        This allows the airdrop contract to be able to transfer your tokens on your behalf.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {approveIsPending ? (
                  <Button disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </Button>
                ) : (
                  <Button type="submit">{`Approve ${erc20TokenSymbol}`}</Button>
                )}
              </form>
            </Form>
            <div className="flex flex-col gap-4 mt-4">
              {approveHash ? (
                <div className="flex flex-row gap-2">
                  Hash:
                  <a
                    target="_blank"
                    className="text-blue-500 underline"
                    href={chainId === 1001 ? `https://baobab.klaytnfinder.io/tx/${approveHash}` : `https://klaytnfinder.io/tx/${hash}`}
                  >
                    {truncateAddress(approveHash)}
                  </a>
                </div>
              ) : (
                <>
                  <div className="flex flex-row gap-2">
                    Hash: no transaction hash until after submission
                  </div>
                  <Badge className="w-fit" variant="outline">No approval yet</Badge>
                </>
              )}
              {isApproveConfirming && (
                <Badge className="w-fit" variant="secondary">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Waiting for confirmation...
                </Badge>
              )}
              {isApproveConfirmed && (
                <Badge className="flex flex-row items-center w-fit bg-green-500 cursor-pointer">
                  <Check className="mr-2 h-4 w-4" />
                  Approval confirmed!
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-row gap-4 items-center">
            <div className="bg-primary text-secondary rounded-full h-8 w-8 flex justify-center items-center">
              <p>3</p>
            </div>
            <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
              Enter the airdrop details
            </h3>
          </div>
          <div className="flex flex-col pl-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="totalAirdropAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total ERC20 amount</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter an amount in token symbol"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        You will send to the contract with this amount then the
                        contract will airdrop.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addresses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Addresses</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter addresses"
                          type="text"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Addresses
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="airdropAmounts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter amounts"
                          type="text"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Amounts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isPending ? (
                  <Button disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </Button>
                ) : (
                  <Button type="submit">Airdrop ERC20</Button>
                )}
                
              </form>
            </Form>
          </div>
          
        </div>
        
      </CardContent>
      <CardFooter className="flex flex-col gap-2 items-start h-fit">
        <div className="flex flex-row gap-4 items-center">
          <div className="bg-primary text-secondary rounded-full h-8 w-8 flex justify-center items-center">
            <p>4</p>
          </div>
          <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
            Monitor airdrop status
          </h3>
        </div>
        <div className="flex flex-col gap-4 pl-8">
          {hash ? (
            <div className="flex flex-row gap-2">
              Hash:
              <a
                target="_blank"
                className="text-blue-500 underline"
                href={chainId === 1001 ? `https://baobab.klaytnfinder.io/tx/${hash}` : `https://klaytnfinder.io/tx/${hash}`}
              >
                {truncateAddress(hash)}
              </a>
            </div>
          ) : (
            <>
              <div className="flex flex-row gap-2">
                Hash: no transaction hash until after submission
              </div>
              <Badge className="w-fit" variant="outline">No transaction yet</Badge>
            </>
          )}
          {isConfirming && (
            <Badge className="w-fit" variant="secondary">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Waiting for confirmation...
            </Badge>
          )}
          {isConfirmed && (
            <Badge className="flex flex-row items-center w-fit bg-green-500 cursor-pointer">
              <Check className="mr-2 h-4 w-4" />
              Transaction confirmed!
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
