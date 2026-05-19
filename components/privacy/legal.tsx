import { PolicyLeagalsData } from "@/data";
import { FadeUp } from "../ui/fade-up";

const PolicyLeagals = () => {
  return (
    <section
      id="legal"
      className="w-full common-section-padding bg-white overflow-hidden"
    >
      <div className="container">
        <FadeUp>
          <h2 className="headline-dark mb-6">Legal:</h2>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="text-description max-w-[842px] mb-4  font-normal! ">
            We may collect personal information such as your name, email
            address, and usage data when you interact with our website (e.g.,
            via forms, subscriptions, or analytics tools).
          </p>
        </FadeUp>

        <div className="legal-options  py-[32px] max-w-[900px]">
          {PolicyLeagalsData.map((item, index) => (
            <FadeUp key={index} delay={0.2 + index * 0.1}>
              <div className="legal-option">
                <h3 className="text-[24px] mb-[20px] font-semibold tracking-[-3%] leading-[110%] text-dark">
                  {item.title}
                </h3>
                <p className="text-description max-w-[842px] mb-4 font-normal! ">
                  {item.description}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
        {/*       <FadeUp delay={0.3}>
                    <Link
                        href={'#'}
                        className='text-primary text-[16px] font-semibold'>
                        Read Terms of Use
                    </Link>
                </FadeUp> */}
      </div>
    </section>
  );
};

export default PolicyLeagals;
