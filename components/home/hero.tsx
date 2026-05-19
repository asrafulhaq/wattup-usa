import { FadeUp } from "@/components/ui/fade-up";
import { ReusableSlider } from "@/components/ui/reusable-slider";
import { WattupButton } from "@/components/ui/wattup-button";
import { homeImageUrls } from "@/lib/images/home";
import { cn } from "@/lib/utils";
import Image from "next/image";
function HeroContent({ dark }: { dark: boolean }) {
  return (
    <div className="pt-8 md:pt-[116px] flex flex-col items-center justify-start grow w-full z-10 bg-white md:bg-transparent">
      <div
        className={cn(
          "relative z-10 container mx-auto flex flex-col items-center text-center",
          dark ? "text-black" : "max-md:text-black text-white",
        )}
      >
        <FadeUp yOffset={30}>
          <h1
            className={cn(
              "headline max-sm:h-[105px] w-[348px] md:w-[642px] mb-4 md:mb-5",
              dark ? "text-black" : "max-md:text-black text-white",
            )}
          >
            Powering the Next <br className="hidden md:block" />
            Generation of EV Charging
          </h1>
        </FadeUp>

        <FadeUp delay={0.2} yOffset={20}>
          <p
            className={cn(
              "text-[16px] md:text-[20px] font-normal max-w-[416px] mx-auto mb-6 md:mb-8 leading-[120%]",
              dark ? "text-black" : "max-md:text-black text-white",
            )}
          >
            Fast, reliable charging stations located
            <br className="hidden md:block" />
            where you live, work, and travel.
          </p>
        </FadeUp>

        <FadeUp delay={0.4} yOffset={20} className="w-full flex-col font-sans">
          <div className="flex flex-row items-center justify-center gap-[16px]">
            <WattupButton
              href="/locations?showAll=true#locations"
              className="w-full md:w-[210px]"
            >
              Our Growing Network
            </WattupButton>
            <WattupButton
              href="/contact#contact-us"
              variant="white"
              className="w-full md:w-[210px] max-md:shadow-[0px_4px_14px_rgba(0,0,0,0.05)] max-md:border max-md:border-[#E2E8F0]"
            >
              Partner With Us
            </WattupButton>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
// this is removed from the slide for now. may be use later
const backupSlides = [
  {
    id: 3,
    content: (
      <div className="relative w-full h-full flex flex-col items-center justify-start">
        {/* Background Image Setup */}
        <div className="relative h-[448px] shrink-0 w-full md:absolute md:h-auto md:inset-0 z-0 select-none bg-[#032e4d]">
          <Image
            src={homeImageUrls.slide_3_layered}
            alt="WattUp Hero Station"
            fill
            className="object-cover hidden md:block object-center xl:object-[67%]"
            priority
            draggable={false}
            /*    placeholder={slide1Desktop ? 'blur' : 'empty'}
                            blurDataURL={slide1Desktop} */
          />
          <Image
            src={homeImageUrls.slide_3_layered}
            alt="WattUp Hero Station"
            fill
            className="object-cover md:hidden object-center"
            priority
            draggable={false}
          />
          {/* Seamless fade for mobile to reduce zoom while covering top sky */}

          {/* Subtle Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent" />
        </div>

        {/* Content Container */}
        <HeroContent dark={false} />
      </div>
    ),
  },
  {
    id: 4,
    content: (
      <div className="relative w-full h-full flex flex-col items-center justify-start">
        {/* Background Image Setup */}
        <div className="relative h-[448px] shrink-0 w-full md:absolute md:h-auto md:inset-0 z-0 select-none bg-[#032e4d]">
          <Image
            src={homeImageUrls.slide_4_layered}
            alt="WattUp Hero Station"
            fill
            className="object-cover hidden md:block object-center xl:object-[67%]"
            priority
            draggable={false}
          />
          <Image
            src={homeImageUrls.slide_4_layered}
            alt="WattUp Hero Station"
            fill
            className="object-cover md:hidden object-center"
            priority
            draggable={false}
          />
          {/* Seamless fade for mobile to reduce zoom while covering top sky */}

          {/* Subtle Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent" />
        </div>

        {/* Content Container */}
        <HeroContent dark={false} />
      </div>
    ),
  },
  {
    id: 5,
    content: (
      <div className="relative w-full h-full flex flex-col items-center justify-start">
        {/* Background Image Setup */}
        <div className="relative h-[448px] shrink-0 w-full md:absolute md:h-auto md:inset-0 z-0 select-none bg-[#032e4d]">
          <Image
            src={homeImageUrls.slide_5_layered}
            alt="WattUp Hero Station"
            fill
            className="object-cover hidden md:block object-center xl:object-[67%]"
            priority
            draggable={false}
          />
          <Image
            src={homeImageUrls.slide_5_full}
            alt="WattUp Hero Station"
            fill
            className="object-cover md:hidden object-right"
            priority
            draggable={false}
          />
          {/* Seamless fade for mobile to reduce zoom while covering top sky */}

          {/* Subtle Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent" />
        </div>

        {/* Content Container */}
        <HeroContent dark={false} />
      </div>
    ),
  },
  {
    id: 6,
    content: (
      <div className="relative w-full h-full flex flex-col items-center justify-start">
        {/* Background Image Setup */}
        <div className="relative h-[448px] shrink-0 w-full md:absolute md:h-auto md:inset-0 z-0 select-none bg-[#032e4d]">
          <Image
            src={homeImageUrls.slide_6_layered}
            alt="WattUp Hero Station"
            fill
            className="object-cover hidden md:block object-center xl:object-[67%]"
            priority
            draggable={false}
          />
          <Image
            src={homeImageUrls.slide_6_full}
            alt="WattUp Hero Station"
            fill
            className="object-cover md:hidden object-left"
            priority
            draggable={false}
          />
          {/* Seamless fade for mobile to reduce zoom while covering top sky */}

          {/* Subtle Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent" />
        </div>

        {/* Content Container */}
        <HeroContent dark={false} />
      </div>
    ),
  },
  {
    id: 7,
    content: (
      <div className="relative w-full h-full flex flex-col items-center justify-start">
        {/* Background Image Setup */}
        <div className="relative h-[448px] shrink-0 w-full md:absolute md:h-auto md:inset-0 z-0 select-none bg-[#032e4d]">
          <Image
            src={homeImageUrls.slide_9_layered}
            alt="WattUp Hero Station"
            fill
            className="object-cover hidden md:block object-center xl:object-top"
            priority
            draggable={false}
          />
          <Image
            src={homeImageUrls.slide_9_full}
            alt="WattUp Hero Station"
            fill
            className="object-cover md:hidden object-center"
            priority
            draggable={false}
          />
          {/* Seamless fade for mobile to reduce zoom while covering top sky */}

          {/* Subtle Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent" />
        </div>

        {/* Content Container */}
        <HeroContent dark={false} />
      </div>
    ),
  },
  {
    id: 8,
    content: (
      <div className="relative w-full h-full flex flex-col items-center justify-start">
        {/* Background Image Setup */}
        <div className="relative h-[448px] shrink-0 w-full md:absolute md:h-auto md:inset-0 z-0 select-none bg-[#032e4d]">
          <Image
            src={homeImageUrls.homepageHero4}
            alt="WattUp Hero Station"
            fill
            className="object-cover hidden md:block object-center xl:object-[67%]"
            priority
            draggable={false}
          />
          <Image
            src={homeImageUrls.homepageHero4}
            alt="WattUp Hero Station"
            fill
            className="object-cover md:hidden object-left"
            priority
            draggable={false}
          />
          {/* Seamless fade for mobile to reduce zoom while covering top sky */}

          {/* Subtle Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent" />
        </div>

        {/* Content Container */}
        <HeroContent dark={false} />
      </div>
    ),
  },
  {
    id: 9,
    content: (
      <div className="relative w-full h-full flex flex-col items-center justify-start">
        {/* Background Image Setup */}
        <div className="relative h-[448px] shrink-0 w-full md:absolute md:h-auto md:inset-0 z-0 select-none bg-[#032e4d]">
          <Image
            src={homeImageUrls.homepageHero5}
            alt="WattUp Hero Station"
            fill
            className="object-cover hidden md:block object-center xl:object-[67%]"
            priority
            draggable={false}
          />
          <Image
            src={homeImageUrls.homepageHero5}
            alt="WattUp Hero Station"
            fill
            className="object-cover md:hidden object-left"
            priority
            draggable={false}
          />
          {/* Seamless fade for mobile to reduce zoom while covering top sky */}

          {/* Subtle Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent" />
        </div>

        {/* Content Container */}
        <HeroContent dark={false} />
      </div>
    ),
  },
  {
    id: 10,
    content: (
      <div className="relative w-full h-full flex flex-col items-center justify-start">
        {/* Background Image Setup */}
        <div className="relative h-[448px] shrink-0 w-full md:absolute md:h-auto md:inset-0 z-0 select-none bg-[#032e4d]">
          <Image
            src={homeImageUrls.slide_8_layered}
            alt="WattUp Hero Station"
            fill
            className="object-cover hidden md:block object-center"
            priority
            draggable={false}
          />
          <Image
            src={homeImageUrls.slide_8_full}
            alt="WattUp Hero Station"
            fill
            className="object-cover md:hidden object-center"
            priority
            draggable={false}
          />
          {/* Seamless fade for mobile to reduce zoom while covering top sky */}

          {/* Subtle Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent" />
        </div>

        {/* Content Container */}
        <HeroContent dark={false} />
      </div>
    ),
  },
];
export async function Hero() {
  const slidesData = [
    {
      id: 1,
      content: (
        <div className="relative w-full h-full flex flex-col items-center justify-start">
          {/* Background Image Setup */}
          <div className="relative h-112 shrink-0 w-full md:absolute md:h-auto md:inset-0 z-0 select-none bg-[#032e4d]">
            <Image
              src={homeImageUrls.slide_1_layered}
              alt="WattUp Hero Station"
              fill
              className="object-cover hidden md:block object-center xl:object-[67%]"
              priority
              draggable={false}
            />
            <Image
              src={homeImageUrls.slide_1_layered_mobile}
              alt="WattUp Hero Station"
              fill
              className="object-cover md:hidden object-center"
              priority
              draggable={false}
            />
            {/* Seamless fade for mobile to reduce zoom while covering top sky */}

            {/* Subtle Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent" />
          </div>

          {/* Content Container */}
          <HeroContent dark={false} />
        </div>
      ),
    },
    {
      id: 2,
      content: (
        <div className="relative w-full h-full flex flex-col items-center justify-start">
          {/* Background Image Setup */}
          <div className="relative h-[448px] shrink-0 w-full md:absolute md:h-auto md:inset-0 z-0 select-none bg-[#cfd8e3]">
            <Image
              src={homeImageUrls.slide_2_layered}
              alt="WattUp Hero Station"
              fill
              className="object-cover hidden md:block object-bottom xl:object-[67%]"
              priority
              draggable={false}
            />
            <Image
              src={homeImageUrls.slide_2_layered_mobile}
              alt="WattUp Hero Station"
              fill
              className="object-cover md:hidden object-bottom"
              priority
              draggable={false}
            />

            {/* Subtle Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent" />
          </div>

          {/* Content Container */}
          <HeroContent dark={false} />
        </div>
      ),
    },
    {
      id: 3,
      content: (
        <div className="relative w-full h-full flex flex-col items-center justify-start">
          {/* Background Image Setup */}
          <div className="relative h-[448px] shrink-0 w-full md:absolute md:h-auto md:inset-0 z-0 select-none bg-[#cfd8e3]">
            <Image
              src={homeImageUrls.slide_3_layered}
              alt="WattUp Hero Station"
              fill
              className="object-cover hidden md:block object-bottom xl:object-[67%]"
              priority
              draggable={false}
            />
            <Image
              src={homeImageUrls.slide_3_layered}
              alt="WattUp Hero Station"
              fill
              className="object-cover md:hidden object-bottom"
              priority
              draggable={false}
            />

            {/* Subtle Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent" />
          </div>

          {/* Content Container */}
          <HeroContent dark={false} />
        </div>
      ),
    },
    {
      id: 4,
      content: (
        <div className="relative w-full h-full flex flex-col items-center justify-start">
          {/* Background Image Setup */}
          <div className="relative h-[448px] shrink-0 w-full md:absolute md:h-auto md:inset-0 z-0 select-none bg-[#cfd8e3]">
            <Image
              src={homeImageUrls.slide_4_layered}
              alt="WattUp Hero Station"
              fill
              className="object-cover object-top hidden md:block xl:object-[67%]"
              priority
              draggable={false}
            />
            <Image
              src={homeImageUrls.slide_4_layered}
              alt="WattUp Hero Station"
              fill
              className="object-cover md:hidden object-bottom"
              priority
              draggable={false}
            />

            {/* Subtle Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/10 to-transparent" />
          </div>

          {/* Content Container */}
          <HeroContent dark={false} />
        </div>
      ),
    },
  ];

  return (
    <section className="relative  overflow-x-hidden mx-auto w-full  md:aspect-1440/951 h-[754px] md:h-[961px] xl:h-[1080px] overflow-hidden">
      <ReusableSlider slides={slidesData} className="w-full h-full" />
    </section>
  );
}
