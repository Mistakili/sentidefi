import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getWalletPortfolioFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ address: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { fetchWalletPortfolio } = await import("./portfolio.server");
    return fetchWalletPortfolio(data.address);
  });