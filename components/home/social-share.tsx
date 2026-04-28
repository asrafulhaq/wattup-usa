import { Share2 } from 'lucide-react';

const SocialShare = () => {
    return (
        <button className='hover:text-foreground  font-medium text-[12px] leading-[14px] uppercase tracking-[-3%] text-text-muted cursor-pointer transition-colors'>
            <Share2 className='w-3 h-3' />
        </button>
    );
};

export default SocialShare;

