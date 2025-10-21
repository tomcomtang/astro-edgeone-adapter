import { c as createComponent, e as createAstro, r as renderComponent, a as renderTemplate } from '../../chunks/astro/server_BlvLBOpo.mjs';
import 'kleur/colors';
import { r as renderEntry, g as getCollection } from '../../chunks/_astro_content_CE_ivAZN.mjs';
import { $ as $$BlogPost } from '../../chunks/BlogPost_CLEe1MAc.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.id },
    props: post
  }));
}
const $$ = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$;
  const post = Astro2.props;
  const { Content } = await renderEntry(post);
  return renderTemplate`${renderComponent($$result, "BlogPost", $$BlogPost, { ...post.data }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Content", Content, {})} ` })}`;
}, "/Users/tomcomtang/VscodeProjects/video_fe/edgeone-pages-templates/astro-examples/astro-edgeone-adapter/src/pages/blog/[...slug].astro", void 0);

const $$file = "/Users/tomcomtang/VscodeProjects/video_fe/edgeone-pages-templates/astro-examples/astro-edgeone-adapter/src/pages/blog/[...slug].astro";
const $$url = "/blog/[...slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$,
	file: $$file,
	getStaticPaths,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
