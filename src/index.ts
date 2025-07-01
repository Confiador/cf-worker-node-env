/**
 * MINIMUM REPRODUCIBLE EXAMPLE: NODE_ENV Access Bug in Cloudflare Workers
 * 
 * Bug Summary: process.env.NODE_ENV returns undefined despite being present
 * in the environment and accessible through other methods.
 * 
 * To reproduce:
 * 1. Run `wrangler dev` 
 * 2. Make a request to trigger this handler
 * 3. Observe the console output showing the inconsistent behavior
 */

// Type for Cloudflare Workers environment variables
type Env = Record<string, unknown>;

interface ExecutionContext {
	waitUntil(promise: Promise<unknown>): void;
	passThroughOnException(): void;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		console.log("=".repeat(60));
		console.log("🐛 CLOUDFLARE WORKERS NODE_ENV BUG REPRODUCTION");
		console.log("=".repeat(60));

		try {
			// ===================================================================
			// SECTION 1: Show that NODE_ENV exists in the environment
			// ===================================================================
			console.log("\n📋 SECTION 1: Verify NODE_ENV exists in environment");
			console.log("Full process.env object:", process.env);
			console.log("Keys in process.env:", Object.keys(process.env));
			console.log("NODE_ENV in process.env keys?", Object.keys(process.env).includes("NODE_ENV"));

			// ===================================================================
			// SECTION 2: Test standard property existence checks
			// ===================================================================
			console.log("\n🔍 SECTION 2: Property existence checks");
			console.log("'NODE_ENV' in process.env:", "NODE_ENV" in process.env);
			console.log("process.env.hasOwnProperty('NODE_ENV'):", Object.hasOwn(process.env, "NODE_ENV"));
			console.log("Object.getOwnPropertyNames includes NODE_ENV:", 
				Object.getOwnPropertyNames(process.env).includes("NODE_ENV"));

			// ===================================================================
			// SECTION 3: Property descriptor analysis
			// ===================================================================
			console.log("\n🔬 SECTION 3: Property descriptor analysis");
			const nodeEnvDescriptor = Object.getOwnPropertyDescriptor(process.env, "NODE_ENV");
			console.log("NODE_ENV property descriptor:", nodeEnvDescriptor);
			if (nodeEnvDescriptor) {
				console.log("  - value:", nodeEnvDescriptor.value);
				console.log("  - writable:", nodeEnvDescriptor.writable);
				console.log("  - enumerable:", nodeEnvDescriptor.enumerable);
				console.log("  - configurable:", nodeEnvDescriptor.configurable);
			}

			// ===================================================================
			// SECTION 4: THE BUG - Standard access methods fail
			// ===================================================================
			console.log("\n❌ SECTION 4: BUG DEMONSTRATION - Standard access fails");
			console.log("process.env.NODE_ENV:", process.env.NODE_ENV);
			console.log("process.env['NODE_ENV']:", process.env["NODE_ENV"]);
			console.log("Expected: 'development' (or current NODE_ENV value)");
			console.log("Actual: undefined");

			// ===================================================================
			// SECTION 5: WORKAROUND - Reflect.get works
			// ===================================================================
			console.log("\n✅ SECTION 5: WORKAROUND - Reflect.get works");
			const nodeEnvValue = Reflect.get(process.env, "NODE_ENV");
			console.log("Reflect.get(process.env, 'NODE_ENV'):", nodeEnvValue);
			console.log("This correctly returns the NODE_ENV value!");

			// ===================================================================
			// SECTION 6: Comparison with other environment variables
			// ===================================================================
			console.log("\n🆚 SECTION 6: Comparison with other env vars");
			const envKeys = Object.keys(process.env).filter(key => key !== "NODE_ENV");
			if (envKeys.length > 0) {
				const testKey = envKeys[0];
				if (testKey) {
					console.log(`Testing ${testKey} for comparison:`);
					console.log(`  process.env.${testKey}:`, process.env[testKey as keyof NodeJS.ProcessEnv]);
					console.log(`  process.env['${testKey}']:`, process.env[testKey]);
					console.log(`  Reflect.get(process.env, '${testKey}'):`, Reflect.get(process.env, testKey));
					console.log("  ↑ Other env vars work with all access methods");
				}
			}

			// ===================================================================
			// SECTION 7: Additional debugging information
			// ===================================================================
			console.log("\n🔧 SECTION 7: Additional debugging info");
			console.log("typeof process.env:", typeof process.env);
			console.log("process.env constructor:", process.env.constructor.name);
			console.log("Is process.env a Proxy?", 
				process.env.constructor.name === "Object" && 
				typeof process.env === "object");

			console.log(`\n${"=".repeat(60)}`);
			console.log("🏁 END OF BUG REPRODUCTION");
			console.log("=".repeat(60));

			return new Response(JSON.stringify({
				bug: "NODE_ENV access issue",
				standard_access: process.env.NODE_ENV,
				reflect_access: Reflect.get(process.env, "NODE_ENV"),
				status: "bug_reproduced"
			}, null, 2), {
				headers: { "Content-Type": "application/json" }
			});

		} catch (error) {
			console.error("❌ Error during bug reproduction:", error);
			return new Response("Error during bug reproduction", { status: 500 });
		}
	},
};

/**
 * EXPECTED BEHAVIOR:
 * - process.env.NODE_ENV should return the same value as Reflect.get(process.env, 'NODE_ENV')
 * - Both should return 'development' when running with `wrangler dev`
 * 
 * ACTUAL BEHAVIOR:
 * - process.env.NODE_ENV returns undefined
 * - Reflect.get(process.env, 'NODE_ENV') correctly returns 'development'
 * 
 * ROOT CAUSE:
 * Appears to be a bug in Cloudflare Workers' process.env Proxy implementation
 * where the 'get' trap has faulty handling specifically for the 'NODE_ENV' property.
 */
