import app from "./app";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import OAuthProvider from "@cloudflare/workers-oauth-provider";

export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Demo",
		version: "1.0.0",
	});

	async init() {
		// Demo tools
		this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}));

		// Securities tool
		// 1. Get current price of a stock or a list of stocks
		// Implementation:
		// - Call API https://price.vixs.vn/datafeed/instruments?symbols=ACB,VCB
		// - Return the price of the stock
		this.server.tool("get-stock-price", { symbols: z.array(z.string()) }, async ({ symbols }) => {
			const response = await fetch(`https://price.vixs.vn/datafeed/instruments?symbols=${symbols.join(",")}`);
			const data = await response.json();
			return {
				content: [{ type: "text", text: JSON.stringify(data) }],
			};
		});

		// 2. Get Market Index
		// Implementation:
		// - Call API https://api2.simplize.vn/api/company/se/market?type=index
		// - Return the price of the index
		this.server.tool("get-market-index", {}, async () => {
			const response = await fetch(`https://api2.simplize.vn/api/company/se/market?type=index`);
			const data = await response.json();
			return {
				content: [{ type: "text", text: JSON.stringify(data) }],
			};
		});
		
		// 3. Get Price history of a stock
		// Implementation:
		// - Call API https://price.vixs.vn/fiin/Price/GetHistory?fromDate=01/01/2025&limitRow=500&nextIndex=0&symbol=ACB&toDate=13/03/2025
		this.server.tool("get-stock-price-history", { symbol: z.string(), fromDate: z.string(), toDate: z.string() }, async ({ symbol, fromDate, toDate }) => {
			const response = await fetch(`https://price.vixs.vn/fiin/Price/GetHistory?fromDate=${fromDate}&limitRow=1000&nextIndex=0&symbol=${symbol}&toDate=${toDate}`);
			const data = await response.json();
			return {
				content: [{ type: "text", text: JSON.stringify(data) }],
			};
		});
	}
}

// Export the OAuth handler as the default
export default new OAuthProvider({
	apiRoute: "/sse",
	// TODO: fix these types
	// @ts-ignore
	apiHandler: MyMCP.mount("/sse"),
	// @ts-ignore
	defaultHandler: app,
	authorizeEndpoint: "/authorize",
	tokenEndpoint: "/token",
	clientRegistrationEndpoint: "/register",
});
