import { c as createComponent, e as createAstro, m as maybeRenderHead, d as addAttribute, as as spreadAttributes, f as renderSlot, a as renderTemplate } from './astro/server_BlvLBOpo.mjs';
/* empty css                                                                  */
import 'clsx';

const $$Astro = createAstro();
const $$HeaderLink = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$HeaderLink;
  const { href, class: className, ...props } = Astro2.props;
  const pathname = Astro2.url.pathname.replace("/", "");
  const subpath = pathname.match(/[^\/]+/g);
  const isActive = href === pathname || href === "/" + (subpath?.[0] || "");
  return renderTemplate`${maybeRenderHead()}<a${addAttribute(href, "href")}${addAttribute([className, { active: isActive }], "class:list")}${spreadAttributes(props)} data-astro-cid-eimmu3lg> ${renderSlot($$result, $$slots["default"])} </a> `;
}, "/Users/tomcomtang/VscodeProjects/video_fe/edgeone-pages-templates/astro-examples/astro-edgeone-adapter/src/components/HeaderLink.astro", void 0);

export { $$HeaderLink as $ };
