import { c as createComponent, e as createAstro, m as maybeRenderHead, d as addAttribute, a as renderTemplate } from './astro/server_BlvLBOpo.mjs';
import 'kleur/colors';
import 'clsx';

const $$Astro = createAstro();
const $$FormattedDate = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$FormattedDate;
  const { date } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<time${addAttribute(date.toISOString(), "datetime")}> ${date.toLocaleDateString("en-us", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })} </time>`;
}, "/Users/tomcomtang/VscodeProjects/video_fe/edgeone-pages-templates/astro-examples/astro-edgeone-adapter/src/components/FormattedDate.astro", void 0);

export { $$FormattedDate as $ };
