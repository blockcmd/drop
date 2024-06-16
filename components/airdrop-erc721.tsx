"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type BaseError,
  useWaitForTransactionReceipt,
  useWriteContract,
  useAccount,
  useReadContracts
} from "wagmi";
import { parseEther, formatEther, formatUnits, Address } from "viem";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Plus, Info, Trash2, ThumbsUp, CircleX } from "lucide-react";
import { abi } from "./abi";
import { erc721Abi } from "./erc721-abi";
import { CONTRACT_ADDRESS_BAOBAB, CONTRACT_ADDRESS_CYPRESS } from "./contract";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useChainId } from 'wagmi'
import { useSearchParams } from "next/navigation";

type AirdropItem = {
  address: string;
  nftId: string;
};


export function AirdropERC721() {
  const searchParams = useSearchParams();
  const erc721TokenAddress = searchParams.get("address");
  const [airdropList, setAirdropList] = useState<AirdropItem[]>([]);
  const account = useAccount()
  const chainId = useChainId()
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { data: approveHash, error: approveError, isPending: approveIsPending, writeContract: approveWriteContract } = useWriteContract();

  const { 
    data: tokenInfoData,
    error: tokenInfoError,
    isPending: tokenInfoIsPending,
    isSuccess: tokenInfoSuccess,
  } = useReadContracts({
    contracts: [{
        abi: erc721Abi,
        functionName: 'isApprovedForAll',
        address: erc721TokenAddress ? erc721TokenAddress as `0x${string}` : undefined,
        args: [account.address as `0x${string}`, chainId === 1001 ? CONTRACT_ADDRESS_BAOBAB : CONTRACT_ADDRESS_CYPRESS],
      }, {
        abi: erc721Abi,
        functionName: 'symbol',
        address: erc721TokenAddress as `0x${string}`,
      }, {
        abi: erc721Abi,
        functionName: 'name',
        address: erc721TokenAddress as `0x${string}`,
      }
    ],
  });

    // state for file input
    const [file, setFile] = useState<File | undefined>(undefined);

    useEffect(() => {
      const fileReader = new FileReader();
      fileReader.onload = function (e: ProgressEvent<FileReader>) {
        if (e.target) {
          const text = e.target.result;
          csvFileToArray(text);
        }
      };
      if (file) {
        fileReader.readAsText(file);
      }
    }, [file]);
  
    function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (file) {
        setFile(file);
      }
    }

      // function to convert the csv file to airdropList
  function csvFileToArray(text: string | ArrayBuffer | null) {
    if (typeof text === "string") {
      const rows = text.split("\n").filter((item) => item !== "");
      const airdropList = rows.map((row) => {
        const [address, nftId] = row.split(",");
        return { address, nftId };
      });
      setAirdropList(airdropList);
    }
  }

  function handleAddAirdropList() {
    setAirdropList(airdropList.concat({ address: "", nftId: "" }));
  }

  function handleResetAirdropList() {
    setAirdropList([]);
  }

  function handleAddressChange(index: number) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const newAirdropList = [...airdropList];
      newAirdropList[index].address = e.target.value;
      setAirdropList(newAirdropList);
    };
  }

  function handleNftIdChange(index: number) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const newAirdropList = [...airdropList];
      newAirdropList[index].nftId = e.target.value;
      setAirdropList(newAirdropList);
    };
  }

  // 2. Define a submit handler.
  function executeAirdrop() {
    // sanitize airdropList from any empty objects
    const airdropListFiltered = airdropList.filter(
      (item) => item.nftId !== "" && item.address !== ""
    );

    // create addresses list
    const addresses: Address[] = airdropListFiltered.map(
      (item) => item.address.replace(/\s/g, "") as Address
    );

    // create airdropAmounts list
    const airdropNftIds: bigint[] = airdropListFiltered.map((item) =>
      parseEther(item.nftId)
    );
    writeContract({
      abi,
      address: chainId === 1001 ? CONTRACT_ADDRESS_BAOBAB : CONTRACT_ADDRESS_CYPRESS,
      functionName: 'airdropERC721',
      args: [erc721TokenAddress as Address, addresses, airdropNftIds]
    })
  }

  function setApproval() {
    approveWriteContract({
      abi: erc721Abi,
      address: erc721TokenAddress as Address,
      functionName: 'setApprovalForAll',
      args: [chainId === 1001 ? CONTRACT_ADDRESS_BAOBAB : CONTRACT_ADDRESS_CYPRESS, true]
    })
  }

  function revokeApproval() {
    approveWriteContract({
      abi: erc721Abi,
      address: erc721TokenAddress as Address,
      functionName: 'setApprovalForAll',
      args: [chainId === 1001 ? CONTRACT_ADDRESS_BAOBAB : CONTRACT_ADDRESS_CYPRESS, false]
    })
  }

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
    <div className="flex flex-col gap-12 w-[768px]">
      <div className="flex flex-col gap-6">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Airdrop NFT on{" "}
          <a
            className="underline underline-offset-4 text-blue-500"
            href="https://coinmarketcap.com/currencies/klaytn/"
            target="_blank"
          >
            KAIA
          </a>
        </h1>
        <p>Airdrop NFTs to multiple addresses at once.</p>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Step 1
        </h2>
        <div className="flex flex-row gap-2 items-center">
          <Info className="h-4 w-4" />
          <p>Review the token information</p>
        </div>
        {tokenInfoData ? (
          <div
            className={
              tokenInfoData[0]?.result === false
                ? "flex flex-col gap-2 border border-destructive p-4"
                : "flex flex-col gap-2 border border-primary p-4"
            }
          >
            <div className="flex flex-row gap-4 items-center h-16">
              <div className="bg-gray-300 rounded-full h-12 w-12 flex justify-center items-center">
                <p>{tokenInfoData[1]?.result?.toString().charAt(0)}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold text-lg">
                  {tokenInfoData[2]?.result?.toString()}
                </p>
                <p className="font-mono text-sm">
                  {tokenInfoData[1]?.result?.toString()}
                </p>
              </div>
            </div>
            <p
              className={
                tokenInfoData[0]?.result === false
                  ? "text-destructive"
                  : "text-primary"
              }
            >
              {tokenInfoData[0]?.result === false
                ? "You have not set approval"
                : "You are ready to airdrop"}
            </p>
            <Button
              onClick={tokenInfoData[0]?.result === false ? setApproval : revokeApproval}
              className={`w-[300px] mt-4 ${tokenInfoData[0]?.result === false ? "bg-primary" : "bg-destructive"}`}
            >
              {tokenInfoData[0]?.result === false ? <ThumbsUp className="h-4 w-4 mr-2" /> : <CircleX className="h-4 w-4 mr-2" />}
              {tokenInfoData[0]?.result === false ? "Set approval" : "Revoke approval"}
            </Button>
          </div>
        ) : (
          <Skeleton className="w-full h-16" />
        )}
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Step 2
        </h2>
        <div className="flex flex-row gap-2 items-center">
          <Info className="h-4 w-4" />
          <p>Create an airdrop list</p>
        </div>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="file-input">File</TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="flex flex-col gap-4">
            <p>
              <span className="inline-block mr-2">
                <Info className="h-4 w-4" />
              </span>
              Input addresses and corresponding amounts manually. Best for
              airdropping to small amount of addreses
            </p>
            {
              // if airdropList is empty, show the message
              airdropList.length === 0 ? (
                <p className="text-md text-muted-foreground">
                  No addresses added. Click the + button below to add.
                </p>
              ) : (
                // if airdropList is not empty, show the list
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <h2>Addresses</h2>
                    <h2>Amounts</h2>
                  </div>
                  {airdropList.map((item, index) => (
                    <div key={index} className="flex flex-row gap-4">
                      <Input
                        placeholder="Enter an address"
                        value={item.address}
                        onChange={handleAddressChange(index)}
                      />
                      <Input
                        placeholder="Enter an amount"
                        value={item.nftId}
                        onChange={handleNftIdChange(index)}
                      />
                    </div>
                  ))}
                </div>
              )
            }
            <div className="flex flex-row gap-2">
              <Button
                onClick={handleAddAirdropList}
                variant="outline"
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleResetAirdropList}
                variant="outline"
                size="icon"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          <TabsContent className="flex flex-col gap-4" value="file-input">
            <p>
              <span className="inline-block mr-2">
                <Info className="h-4 w-4" />
              </span>
              Upload a .csv file containing addresses and amounts.
            </p>
            <Input
              type="file"
              accept=".csv"
              onChange={handleImportFile}
              className="w-full"
            />
            {
              // if airdropList is empty, show the message
              airdropList.length === 0 ? (
                <p className="text-md text-muted-foreground">
                  No addresses uploaded.
                </p>
              ) : (
                // if airdropList is not empty, show the list
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <h2>Addresses</h2>
                    <h2>Amounts</h2>
                  </div>
                  {airdropList.map((item, index) => (
                    <div key={index} className="flex flex-row gap-4">
                      <Input
                        placeholder="Enter an address"
                        value={item.address}
                        readOnly
                      />
                      <Input
                        placeholder="Enter an amount"
                        value={item.nftId}
                        readOnly
                      />
                    </div>
                  ))}
                </div>
              )
            }
          </TabsContent>
        </Tabs>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Step 4
        </h2>
        <div className="flex flex-row gap-2 items-center">
          <Info className="h-4 w-4" />
          <p>Execute the airdrop</p>
        </div>
        {isPending ? (
          <Button className="w-[300px]" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please confirm in your wallet
          </Button>
        ) : (
          <Button className="w-[300px]" onClick={executeAirdrop}>
            Airdrop NFTs
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Transaction status
        </h2>
        {isConfirming && (
          <div className="flex flex-row gap-2 text-yellow-500 font-semibold text-lg">
            <Loader2 className="h-6 w-6 animate-spin" />
            Waiting for confirmation...
          </div>
        )}
        {isConfirmed && (
          <div className="flex flex-row gap-2 text-green-500 font-semibold text-lg">
            <Check className="h-6 w-6" />
            Transaction confirmed!
          </div>
        )}
        {
          // if there is an error, show the error message
          error && (
            <div>
              Transaction reverted:{" "}
              {(error as BaseError).shortMessage.split(":")[1]}
            </div>
          )
        }
        {hash ? (
          <div className="flex flex-row gap-2">
            Transaction hash:
            <a
              target="_blank"
              className="text-blue-500 underline"
              href={
                chainId === 1001
                  ? `https://baobab.klaytnfinder.io/tx/${hash}`
                  : `https://klaytnfinder.io/tx/${hash}`
              }
            >
              {truncateAddress(hash)}
            </a>
          </div>
        ) : (
          <>
            <div className="flex flex-row gap-2">Nothing yet :)</div>
          </>
        )}
      </div>
    </div>
  );
}
