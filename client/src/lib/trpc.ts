import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../api/trpc/[trpc]";

export const trpc = createTRPCReact<AppRouter>();
