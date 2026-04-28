import Footer from '@/components/home/footer';
import { Navbar } from '@/components/home/navbar';

export default function FrontendLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className='flex min-h-screen w-full flex-col bg-background selection:bg-primary/20 mx-auto'>
            {/* The Navbar floats absolutely over the entire Hero */}
            <Navbar />
            {children}
            <Footer />
        </div>
    );
}

