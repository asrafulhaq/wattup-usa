'use client';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { getCroppedImg } from '@/lib/crop-utils';
import { useCallback, useState } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';

interface ImageCropperProps {
    open: boolean;
    imageSrc: string;
    onClose: () => void;
    onCropComplete: (file: File, blobUrl: string) => void;
}

const ImageCropper = ({
    open,
    imageSrc,
    onClose,
    onCropComplete,
}: ImageCropperProps) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
        null
    );

    const handleClose = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        onClose();
    };

    const onCropCompleteHandler = useCallback(
        (_: Area, croppedPixels: Area) => {
            setCroppedAreaPixels(croppedPixels);
        },
        []
    );

    const handleCrop = async () => {
        if (!imageSrc || !croppedAreaPixels) {
            handleClose();
            return;
        }

        try {
            const result = await getCroppedImg(imageSrc, croppedAreaPixels);

            if (result && result.file && result.blobUrl) {
                onCropComplete(result.file, result.blobUrl);
            }
        } catch (error) {
            console.error('Error cropping image:', error);
            handleClose();
        }
    };

    if (!open || !imageSrc) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className='sm:max-w-[800px] md:max-w-[900px] lg:max-w-[1024px] w-[95vw] bg-card border-border p-0 overflow-hidden'>
                <div className='p-6 border-b border-border/50'>
                    <DialogHeader>
                        <DialogTitle className='text-foreground  text-xl'>
                            Crop Your Image
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className='p-6 space-y-6'>
                    <div className='relative w-full h-[400px] md:h-[500px] bg-background/50 border border-border rounded-xl overflow-hidden shadow-inner'>
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropCompleteHandler}
                            classes={{
                                containerClassName: 'rounded-xl',
                                mediaClassName: 'rounded-xl',
                            }}
                        />
                    </div>

                    <div className='bg-muted/30 p-4 rounded-xl border border-border/50 space-y-4'>
                        <div className='flex items-center justify-between'>
                            <label className='text-sm font-medium text-foreground flex items-center gap-2'>
                                Zoom Level
                            </label>
                            <span className='text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded'>
                                {zoom.toFixed(1)}x
                            </span>
                        </div>
                        <Slider
                            min={1}
                            max={3}
                            step={0.1}
                            value={[zoom]}
                            onValueChange={([z]) => setZoom(z)}
                            className='w-full'
                        />
                    </div>
                </div>

                <div className='p-6 flex justify-end gap-4 border-t border-border/50'>
                    <Button
                        onClick={handleClose}
                        variant='outline'
                        className='border-border hover:bg-muted font-normal px-8'>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCrop}
                        className='bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 px-8'>
                        Crop & Save
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImageCropper;

