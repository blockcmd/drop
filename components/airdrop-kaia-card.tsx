import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function AirdropKaiaCard() {
  return (
    <Link href="/airdrop-kaia">
      <div className="flex flex-row justify-between items-center shadow-lg w-full p-8 border-2 border-secondary hover:border-primary">
        <div className='flex flex-col gap-4'>
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">Airdrop $KAIA</h2>
          <p>Go to deploy page</p>
        </div>
        <ArrowRight className="w-8 h-8" />
      </div>
    </Link>
  );
}