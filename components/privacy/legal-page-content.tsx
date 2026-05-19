import { LegalDocumentData } from "@/data";
import { FadeUp } from "@/components/ui/fade-up";

function renderText(text: string): React.ReactNode {
  const pattern =
    /([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})|((?:https?:\/\/)?(?:[\w-]+\.)+[a-zA-Z]{2,}(?:\/[^\s(),"]*)?)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const [full, email, url] = match;

    if (email) {
      parts.push(
        <a
          key={match.index}
          href={`mailto:${email}`}
          className="text-primary hover:underline"
        >
          {email}
        </a>
      );
    } else if (url) {
      const href = url.startsWith("http") ? url : `https://${url}`;
      parts.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {url}
        </a>
      );
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 1 ? <>{parts}</> : text;
}

export function LegalPageContent({ data }: { data: LegalDocumentData }) {
  return (
    <section className="w-full common-section-padding bg-white overflow-hidden">
      <div className="container">

        {/* Document header */}
        <FadeUp>
          <h1 className="headline-dark mb-8">{data.title}</h1>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="flex flex-col gap-2 mb-10">
            <p className="text-description max-w-[842px] font-normal! text-dark/70">
              <span className="font-semibold text-dark">Effective Date: </span>
              {data.effectiveDate}
            </p>
            <p className="text-description max-w-[842px] font-normal! text-dark/70">
              <span className="font-semibold text-dark">Company: </span>
              {data.company}
            </p>
            <p className="text-description max-w-[842px] font-normal! text-dark/70">
              <span className="font-semibold text-dark">Address: </span>
              {data.address}
            </p>
            <p className="text-description max-w-[842px] font-normal! text-dark/70">
              <span className="font-semibold text-dark">Contact: </span>
              {renderText(data.contactEmail)}
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.15}>
          <p className="text-description max-w-[842px] mb-6 font-normal! text-dark/70">
            {renderText(data.intro)}
          </p>
        </FadeUp>

        {/* Sections */}
        {data.sections.map((section, i) => (
          <FadeUp key={i} delay={0.1}>
            <div className="mt-14">
              <h3 className="text-[24px] mb-6 font-semibold tracking-[-3%] leading-[110%] text-dark">
                {section.title}
              </h3>

              {section.blocks.map((block, j) => (
                <div key={j} className={block.subtitle ? "mt-8" : ""}>
                  {block.subtitle && (
                    <h3 className="text-[20px] mb-4 font-semibold tracking-[-3%] leading-[110%] text-dark">
                      {block.subtitle}
                    </h3>
                  )}
                  {block.paragraphs?.map((text, k) => (
                    <p
                      key={k}
                      className={`text-description max-w-[842px] font-normal! text-dark/70 ${block.compact ? "mb-1" : "mb-6"}`}
                    >
                      {renderText(text)}
                    </p>
                  ))}
                  {block.list && (
                    <ul className="list-disc pl-6 mb-6 space-y-3">
                      {block.list.map((item, k) => (
                        <li key={k} className="text-description font-normal! text-dark/70">
                          {renderText(item)}
                        </li>
                      ))}
                    </ul>
                  )}
                  {block.keyValuePairs && (
                    <div className="flex flex-col gap-2">
                      {block.keyValuePairs.map((pair, k) => (
                        <p key={k} className="text-description font-normal! text-dark/70">
                          <span className="font-semibold text-dark">{pair.label}: </span>
                          {renderText(pair.value)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
