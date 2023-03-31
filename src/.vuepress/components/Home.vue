<template>
	<div class="home">
		<Navbar/>
		<section id="hero">
			<!-- heroImage -->
			<img
				class="hero-img"
				v-if="data.heroImage"
				:src="$withBase(data.heroImage)"
				:alt="data.heroAlt || 'hero'"
			/><!-- 
			<br /> -->

			<!-- heroText -->
			<h1 class="heroText" v-if="data.heroText">
				<span>
					{{ data.heroText || $description || "Welcome to your VuePress site" }}
				</span>
			</h1>
			<Content v-else slot-key="heroText" class="heroText" />

			<!-- tagline -->
			<p class="tagline" v-if="data.tagline">
				{{ data.tagline }}
			</p>
			<Content v-else slot-key="tagline" class="tagline" />

			<!-- actions -->
			<p class="actions">
				<VPLink
					v-if="data.actionText && data.actionLink"
					class="action-link"
					:text="data.actionText"
					:link="data.actionLink"
				>
					<svg
						slot="after"
						class="icon"
						xmlns="http://www.w3.org/2000/svg"
						width="10"
						height="10"
						viewBox="0 0 24 24"
					>
						<path
							d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"
						/>
					</svg>
				</VPLink>
				<VPLink
					v-if="data.subActionText && data.subActionLink"
					class="sub-action-link"
					:text="data.subActionText"
					:link="data.subActionLink"
				/>
			</p>
		</section>

		<!-- special sponsor -->
		<section id="special-sponsor" v-show="data.sponsors">
			<span class="special-sponsor-title">{{
				data.sponsorsText || "Special Sponsor"
			}}</span>
			<span
				class="special-sponsor-item"
				v-for="sponsor in data.sponsors"
				:key="sponsor.title"
			>
				<span>{{ sponsor.title }}</span>
				<a :href="sponsor.link"><img :src="sponsor.img" /></a>
			</span>
		</section>

		<!-- features -->
		<section v-if="data.features" id="highlights" class="vt-box-container">
			<div class="vt-box" v-for="feature in data.features" :key="feature.title">
				<h3>{{ feature.title }}</h3>
				<p>{{ feature.details }}</p>
			</div>
		</section>

		<section class="content markdown-body">
			<h2 id="the-suphle-you-ordered-is-here">The Suphle you ordered is here!</h2>
			<p>
					Suphle is a sophisticated PHP framework for enterprises, startups and SAASes to
					build anything from robust APIs, to CLI programs and server rendered
					full-stack apps without compromising on the high fidelity expected of
					SPAs. It builds upon some of the industry's most trusted components, but
					can equally get out of the way for you to insert libraries that make you
					feel more at home. Its recommended stack is SBT (Suphle-Blade-Turbo)
			</p>
		</section>

		<section class="content markdown-body" id="performance-container">
			<h2 id="performance">Performance</h2>
			<!-- <p><img alt="" src="/image-not-found.jpg" /></p> -->
			<p>
					If you're coming from the JS ecosystem, you must be itching to see
					whether Suphle has the longest bar among a row of competing contenders.
					By now, it should be common knowledge that if you're not building one of
					the FAANG companies, handling hundreds of thousands of requests per
					second should be the least of your worries.
			</p>
			<p>
					Performance graphs compare frameworks/runtimes built for Hello World
					projects, or rudimentary apps making a very simple SQL query. These
					"educational" apps lack the context of a realistic project using an ORM
					to make dynamic, unpredictable or un-cacheable queries. That is not to
					discredit the value of speed. In Suphle, we use a trie-based router for
					quick failure, a RoadRunner server that's as close to a compiled
					language as it gets, and Flows for preemptively caching endpoints
					serving complex content.
			</p>
			<p>
					Suphle has a number of objectives it advices you prioritize over speed
					benchmarks:
			</p>
			<ul>
					<li>
							Building software maintainable by both minnows and those who didn't
							originally create it.
					</li>
					<li>
							Bridging the gap between developers who make best practices optional
							and those who don't -- standardizing them, if you will.
					</li>
					<li>
							Get developers who don't yet to take automated testing more
							seriously
					</li>
					<li>Deprecate error pages and responses.</li>
			</ul>
			<p>
					Thankfully, PHP's ecosystem has matured enough to boast of static
					type-checking tools to snipe out what can be classified as compile-time
					errors and RoadRunner to attend to both fears. Suphle comes pre-built
					with these tools, although it can still handle requests in the
					traditional PHP fashion.
			</p>
		</section>

		<section class="content markdown-body" id="similar-container">
			<h2 id="how-its-similar">How it's similar</h2>
			<p>
					In a broader sense, if you're coming from a framework written in another
					language, some features there parallel what is obtainable in Suphle:
			</p>
			<ul>
					<li><em>NestJS:</em> Modules, @Transaction</li>
					<li>
							<em>Spring Boot:</em> Circular dependencies, decorators, entity
							binding, component/service-specific classes, @Transactional
					</li>
					<li><em>Rust:</em> Macros, Result</li>
					<li><em>Phoenix:</em> Livewire</li>
			</ul>
			<p>
					It may interest you to know that some of these best practices were only
					found to intersect after Suphle was mostly complete rather than a
					premeditated attempt to build a chimera of widely acclaimed
					functionality. That is why in Suphle, their implementation details
					differ. For instance, Suphle's modules are wired/built differently, our
					transaction decorator does more than just transactions, and so on.
			</p>
			<p>
					The rest of the documentation goes into thorough detail about how that,
					as well as other implementations you're used to were improved upon.
			</p>

			</section>

			<section class="content markdown-body">
			<h2 id="how-its-different">How it's different</h2>
			<p>You may be thinking:</p>
			<blockquote>
					<p>
							I'm in too much of a hurry to sift through the entire docs in search
							of what captivating goodies Suphle has to offer, in concrete terms.
					</p>
			</blockquote>
			<p>
					Let me spare you the hassle by listing topics I personally find
					compelling:
			</p>
			<ol>
					<li>
							The routing system, guaranteed to be the most unconventional you've
							seen till date
					</li>
					<li>Module descriptors and their wiring</li>
					<li>Flows</li>
					<li>
							Testing framework to mock and verify behavior exposed by every
							observable functionality
					</li>
					<li>The default decorators available</li>
					<li>3rd party framework bridge</li>
					<li>Exception handling, testing, broadcasting</li>
					<li>Service-coordinators</li>
			</ol>
			<p>
					You can randomly check out any of them. But the APIs for everything else
					in Suphle is carefully designed to look marvelous; from events to
					middleware, component-templates, outgoing and incoming HTTP requests.
					There's model-based authorization, authentication customization. Pair
					strategic design with functionality, and you have the doozy that your
					SAAS application will be.
			</p>
			<blockquote>
					The love you have for what you build naturally reflects in the
					artsy attention paid to it. What if every thing could be built that way
					without the costly expense of tedium?
			</blockquote>
		</section>

		<section class="content markdown-body">
			<h2 id="how-reliable-it-is">How reliable it is</h2>
			<p>
					The iteration of Suphle released for public use has been in the making
					for at least 3 years, with 2 of out of that demanding full-time
					devotion. It's not farfetched to assume that that is enough time for it
					to have been rigorously tested and refined to withstand most realistic
					conditions. Should any need or bug have escaped internal usage, you can
					label the StackOverflow tag, <code>suphle</code>, on
					<a href="https://stackoverflow.com/questions/ask">your question</a>. If
					it's unexpected behavior, or that which deviates from specification on
					this documentation, kindly attempt to reproduce it on the
					<a href="https://github.com/nmeri17/suphle/issues/new/choose"
							>Github repository</a
					>.
			</p>
			<p><a href="/docs/v1/quick-start">Ready to get started?</a></p>
	</section>


		<!-- footer -->
		<div v-if="data.footer" class="footer">
			{{ data.footer }}
		</div>
		<Content v-else slot-key="footer" class="footer" />
	</div>
</template>

<script>
	import Navbar from "@theme/components/Navbar.vue";

export default {
	computed: {
		data() {
			return this.$page.frontmatter;
		},
	},
	components: {

		Navbar
	}
};
</script>

<style lang="stylus">

	.home-link {

		background: inherit;
	}

a.action-link {
    --vp-c-brand: var(--vp-c-brand-dark); /*homepage action button*/
}
a {
	--c-darkmode-active-link: #6407a2;
    --vp-c-brand: #6407a2; /*link colors*/
}
</style>

<style lang="stylus" scoped>
.theme-default-content:not(.custom) > .home {
	margin-top: 0;
}

section {
	padding: 42px 32px;
}

section.content.markdown-body {
	margin: 0;
    padding: 0 8%;

	h2 {
		font-weight: 500;
	    font-size: 20px;
	    letter-spacing: -0.4px;
	    color: var(--vp-c-text-1);
	    transition: color 0.5s;
	    margin-bottom: 0.75em;
	}

	p {
		font-weight: 400;
	    font-size: 15px;
	}
}

#hero {
	max-width: 1000px;
	/*margin: 50px auto 0 auto;
	padding: 76px 0px 76px 0px;*/
	padding: 5% 5% 0 5%;
	text-align: center;
}

#hero {
	h1 {
		margin-block-start: 0.5em;
		margin-block-end: 0.5em;
	}

	.hero-img {
		max-width: 200px;
		max-height: 280px;
	}

	.heroText {
		font-size: 76px;
		line-height: 1.25;
		font-weight: 900;
		letter-spacing: -1.5px;
		display: inline-block;
		margin-bottom: 20px;
	}

	.tagline {
		display: inline-block;
		max-width: 960px;
		line-height: 1.5;
		color: var(--vp-c-text-2);
		transition: color 0.5s;
		font-size: 22px;
		margin: 24px auto 40px;
	}
}

.dark .heroText {
	color: var(--vp-c-brand-light);
	background: -webkit-linear-gradient(315deg, #42d392 25%, #647eff);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
}

.actions a {
	font-size: 16px;
	display: inline-block;
	background-color: var(--vp-c-bg-mute);
	padding: 8px 18px;
	font-weight: 500;
	border-radius: var(--vp-common-border-radius);
	transition: background-color 0.5s, color 0.5s;
}

.actions .action-link {
	font-weight: 500;
	background-color: var(--vp-c-brand);
	color: #fff;
	margin-right: 18px;
}

.actions .icon {
	display: inline;
	position: relative;
	top: -1px;
	margin-left: 2px;
	fill: currentColor;
	transition: transform 0.2s;
}

.dark .actions .action-link {
	color: var(--vp-c-indigo);
}

.actions .action-link:hover {
	background-color: var(--vp-c-brand-dark);
	transition-duration: 0.2s;
}

.actions .action-link:hover .icon {
	transform: translateX(2px);
}

.dark .actions .action-link:hover {
	background-color: var(--vp-c-brand-light);
}

.actions .sub-action-link {
	color: var(--vp-c-text-code);
}

.actions .sub-action-link:hover {
	background-color: var(--vp-c-gray-light-4);
	transition-duration: 0.2s;
}

.dark .actions .sub-action-link:hover {
	background-color: var(--vp-c-gray-dark-3);
}

#special-sponsor {
	border-top: 1px solid var(--vp-c-divider-light);
	border-bottom: 1px solid var(--vp-c-divider-light);
	padding: 12px 24px;
	text-align: center;

	.special-sponsor-title {
		margin: 0;
	}
}

#special-sponsor span {
	color: var(--vp-c-text-2);
	font-weight: 500;
	font-size: 13px;
	vertical-align: middle;
	margin: 0 20px;
}

#special-sponsor img {
	display: inline-block;
	vertical-align: middle;
	height: 36px;
}

.dark #special-sponsor img {
	filter: grayscale(1) invert(1);
}

#highlights {
	max-width: 960px;
	/*margin: 0px auto;*/
	margin: 0 5%;
	padding: 0 1%;
	color: var(--vp-c-text-2);
}

#highlights h3 {
	font-weight: 500;
	font-size: 20px;
	letter-spacing: -0.4px;
	color: var(--vp-c-text-1);
	transition: color 0.5s;
	margin-bottom: 0.75em;
}

#highlights p {
	font-weight: 400;
	font-size: 15px;
}

#highlights .vt-box {
	background-color: transparent;
}

@media (max-width: 768px) {
	.heroText {
		font-size: 48px;
		letter-spacing: -0.5px;
	}

	.description {
		font-size: 18px;
		margin-bottom: 48px;
	}
}

@media (max-width: 576px) {
	.home {
		padding: 0;
	}

	#hero {
		padding: 64px 10px;

		.heroText {
			font-size: 58px;
		}
	}

	.description {
		font-size: 16px;
		margin: 18px 0 30px;
	}

	#special-sponsor img {
		display: block;
		margin: 2px auto 1px;
	}

	#special-sponsor .special-sponsor-title {
		display: block;
		margin: 0 0 10px 0;
		font-weight: bolder;
	}

	#special-sponsor span {
		margin: 0;
	}

	#highlights h3 {
		margin-bottom: 0.6em;
	}

	#highlights .vt-box {
		/*padding: 20px 36px;*/
	}
}

@media (max-width: 370px) {
	#hero {
		.heroText {
			font-size: 36px;
		}
	}
}

.vt-box-container {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}

.vt-box-container .vt-box {
	background-color: var(--vp-c-bg-soft);
	transition: color 0.5s, background-color 0.5s;
	/*padding: 28px 36px;*/
	border-radius: 8px;
	flex: 0 32%;
	font-size: 14px;
	font-weight: 500;
}

@media (max-width: 768px) {
	.vt-box-container .vt-box {
		flex: 0 100%;
		margin-bottom: 20px;
	}
}

.footer {
	text-align: center;
	font-size: 12px;
}
</style>
